package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/macal/inventory/internal/models"
)

// Client Portal Handlers (for external clients)

// ClientAuth middleware to authenticate client organizations
func (h *Handlers) ClientAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from header or query param
		token := c.GetHeader("X-Client-Token")
		if token == "" {
			token = c.Query("token")
		}
		
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No authentication token provided"})
			c.Abort()
			return
		}
		
		// Find client by token
		var client models.ClientOrganization
		if err := h.db.Where("access_token = ?", token).First(&client).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}
		
		// Check if client is valid
		if !client.IsValid() {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Access expired or disabled"})
			c.Abort()
			return
		}
		
		// Check IP whitelist if configured
		if len(client.IPWhitelist) > 0 {
			clientIP := c.ClientIP()
			allowed := false
			for _, ip := range client.IPWhitelist {
				if ip == clientIP {
					allowed = true
					break
				}
			}
			if !allowed {
				c.JSON(http.StatusForbidden, gin.H{"error": "IP not whitelisted"})
				c.Abort()
				return
			}
		}
		
		// Update last access
		h.db.Model(&client).Updates(map[string]interface{}{
			"last_access": time.Now(),
			"access_count": client.AccessCount + 1,
		})
		
		// Store client in context
		c.Set("client", &client)
		c.Set("clientID", client.ID.String())
		
		// Log access
		h.logClientAccess(c, &client, "authenticate", "auth", "", http.StatusOK)
		
		c.Next()
	}
}

// GetClientInfo returns client organization info
func (h *Handlers) GetClientInfo(c *gin.Context) {
	client := c.MustGet("client").(*models.ClientOrganization)
	
	c.JSON(http.StatusOK, gin.H{
		"id": client.ID,
		"name": client.Name,
		"type": client.Type,
		"logo": client.Logo,
		"permissions": client.Permissions,
		"validUntil": client.ValidUntil,
	})
}

// GetClientVehicles returns vehicles accessible by the client
func (h *Handlers) GetClientVehicles(c *gin.Context) {
	client := c.MustGet("client").(*models.ClientOrganization)
	
	if !client.Permissions.CanViewVehicles {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to view vehicles"})
		return
	}
	
	// Build query based on filters
	query := h.db.Model(&models.Vehicle{}).Preload("Owner")
	
	// Apply vehicle filters
	filters := client.Permissions.VehicleFilters
	
	if len(filters.VehicleIDs) > 0 {
		query = query.Where("id IN ?", filters.VehicleIDs)
	}
	
	if len(filters.OwnerIDs) > 0 {
		query = query.Where("owner_id IN ?", filters.OwnerIDs)
	}
	
	if len(filters.LicensePlates) > 0 {
		query = query.Where("license_plate IN ?", filters.LicensePlates)
	}
	
	if len(filters.Statuses) > 0 {
		query = query.Where("status IN ?", filters.Statuses)
	}
	
	if filters.DateFrom != nil {
		query = query.Where("check_in_date >= ?", filters.DateFrom)
	}
	
	if filters.DateTo != nil {
		query = query.Where("check_in_date <= ?", filters.DateTo)
	}
	
	// Apply additional filters from query params
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	
	if dateFrom := c.Query("dateFrom"); dateFrom != "" {
		query = query.Where("check_in_date >= ?", dateFrom)
	}
	
	if dateTo := c.Query("dateTo"); dateTo != "" {
		query = query.Where("check_in_date <= ?", dateTo)
	}
	
	// Load photos if permitted
	if client.Permissions.CanViewPhotos {
		query = query.Preload("Photos")
	}
	
	var vehicles []models.Vehicle
	if err := query.Find(&vehicles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch vehicles"})
		return
	}
	
	// Filter fields based on permissions
	filteredVehicles := h.filterVehicleFields(vehicles, client.Permissions)
	
	// Log access
	h.logClientAccess(c, client, "view_vehicles", "vehicle", "list", http.StatusOK)
	
	c.JSON(http.StatusOK, gin.H{
		"vehicles": filteredVehicles,
		"count": len(filteredVehicles),
	})
}

// GetClientVehicle returns a specific vehicle
func (h *Handlers) GetClientVehicle(c *gin.Context) {
	client := c.MustGet("client").(*models.ClientOrganization)
	vehicleID := c.Param("id")
	
	if !client.Permissions.CanViewVehicles {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to view vehicles"})
		return
	}
	
	var vehicle models.Vehicle
	query := h.db.Preload("Owner")
	
	if client.Permissions.CanViewPhotos {
		query = query.Preload("Photos")
	}
	
	if err := query.First(&vehicle, "id = ?", vehicleID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vehicle not found"})
		return
	}
	
	// Check if client can access this vehicle
	if !client.CanAccessVehicle(&vehicle) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to view this vehicle"})
		return
	}
	
	// Filter fields
	filteredVehicle := h.filterVehicleFields([]models.Vehicle{vehicle}, client.Permissions)[0]
	
	// Log access
	h.logClientAccess(c, client, "view_vehicle", "vehicle", vehicleID, http.StatusOK)
	
	c.JSON(http.StatusOK, filteredVehicle)
}

// GetClientVehicleInspection returns inspection details
func (h *Handlers) GetClientVehicleInspection(c *gin.Context) {
	client := c.MustGet("client").(*models.ClientOrganization)
	vehicleID := c.Param("vehicleId")
	inspectionID := c.Param("inspectionId")
	
	if !client.Permissions.CanViewInspections {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to view inspections"})
		return
	}
	
	// First check if client can access the vehicle
	var vehicle models.Vehicle
	if err := h.db.First(&vehicle, "id = ?", vehicleID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vehicle not found"})
		return
	}
	
	if !client.CanAccessVehicle(&vehicle) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to view this vehicle"})
		return
	}
	
	// Get inspection
	var inspection models.Inspection
	if err := h.db.Preload("Inspector").First(&inspection, "id = ? AND vehicle_id = ?", inspectionID, vehicleID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Inspection not found"})
		return
	}
	
	// Log access
	h.logClientAccess(c, client, "view_inspection", "inspection", inspectionID, http.StatusOK)
	
	c.JSON(http.StatusOK, inspection)
}

// GetClientStats returns statistics for the client
func (h *Handlers) GetClientStats(c *gin.Context) {
	client := c.MustGet("client").(*models.ClientOrganization)
	
	if !client.Permissions.CanViewVehicles {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized"})
		return
	}
	
	// Build base query with filters
	baseQuery := h.db.Model(&models.Vehicle{})
	filters := client.Permissions.VehicleFilters
	
	if len(filters.VehicleIDs) > 0 {
		baseQuery = baseQuery.Where("id IN ?", filters.VehicleIDs)
	}
	if len(filters.OwnerIDs) > 0 {
		baseQuery = baseQuery.Where("owner_id IN ?", filters.OwnerIDs)
	}
	if len(filters.LicensePlates) > 0 {
		baseQuery = baseQuery.Where("license_plate IN ?", filters.LicensePlates)
	}
	
	// Get stats
	var totalVehicles int64
	baseQuery.Count(&totalVehicles)
	
	var inInspection int64
	baseQuery.Where("status = ?", "inspecting").Count(&inInspection)
	
	var completed int64
	baseQuery.Where("status = ?", "completed").Count(&completed)
	
	// This month
	startOfMonth := time.Now().AddDate(0, 0, -time.Now().Day()+1)
	var thisMonth int64
	baseQuery.Where("check_in_date >= ?", startOfMonth).Count(&thisMonth)
	
	c.JSON(http.StatusOK, gin.H{
		"totalVehicles": totalVehicles,
		"inInspection": inInspection,
		"completed": completed,
		"thisMonth": thisMonth,
	})
}

// DownloadClientReport generates and downloads a report
func (h *Handlers) DownloadClientReport(c *gin.Context) {
	client := c.MustGet("client").(*models.ClientOrganization)
	
	if !client.Permissions.CanDownloadReports {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to download reports"})
		return
	}
	
	reportType := c.Query("type")
	format := c.Query("format") // pdf, excel, csv
	
	// Generate report based on type
	var reportData []byte
	var filename string
	var contentType string
	
	switch format {
	case "pdf":
		// Generate PDF report
		contentType = "application/pdf"
		filename = "reporte-vehiculos.pdf"
		// reportData = generatePDFReport(...)
		
	case "excel":
		// Generate Excel report
		contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		filename = "reporte-vehiculos.xlsx"
		// reportData = generateExcelReport(...)
		
	case "csv":
		// Generate CSV report
		contentType = "text/csv"
		filename = "reporte-vehiculos.csv"
		// reportData = generateCSVReport(...)
		
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid format"})
		return
	}
	
	// Log access
	h.logClientAccess(c, client, "download_report", "report", reportType, http.StatusOK)
	
	// Send file
	c.Header("Content-Type", contentType)
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, contentType, reportData)
}

// Admin handlers for managing clients

// ListClients returns all client organizations
func (h *Handlers) ListClients(c *gin.Context) {
	var clients []models.ClientOrganization
	if err := h.db.Order("created_at DESC").Find(&clients).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch clients"})
		return
	}
	
	c.JSON(http.StatusOK, clients)
}

// CreateClient creates a new client organization
func (h *Handlers) CreateClient(c *gin.Context) {
	var input struct {
		Name        string                   `json:"name" binding:"required"`
		Type        string                   `json:"type" binding:"required"`
		Logo        string                   `json:"logo"`
		ContactName string                   `json:"contactName"`
		Email       string                   `json:"email" binding:"required,email"`
		Phone       string                   `json:"phone"`
		ValidUntil  *time.Time               `json:"validUntil"`
		IPWhitelist []string                 `json:"ipWhitelist"`
		Permissions models.ClientPermissions `json:"permissions"`
	}
	
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	client := models.ClientOrganization{
		Name:        input.Name,
		Type:        input.Type,
		Logo:        input.Logo,
		ContactName: input.ContactName,
		Email:       input.Email,
		Phone:       input.Phone,
		ValidUntil:  input.ValidUntil,
		IPWhitelist: input.IPWhitelist,
		Permissions: input.Permissions,
		Active:      true,
	}
	
	if err := h.db.Create(&client).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create client"})
		return
	}
	
	c.JSON(http.StatusCreated, client)
}

// UpdateClient updates a client organization
func (h *Handlers) UpdateClient(c *gin.Context) {
	clientID := c.Param("id")
	
	var client models.ClientOrganization
	if err := h.db.First(&client, "id = ?", clientID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		return
	}
	
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	if err := h.db.Model(&client).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update client"})
		return
	}
	
	c.JSON(http.StatusOK, client)
}

// RegenerateClientToken regenerates the access token for a client
func (h *Handlers) RegenerateClientToken(c *gin.Context) {
	clientID := c.Param("id")
	
	var client models.ClientOrganization
	if err := h.db.First(&client, "id = ?", clientID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		return
	}
	
	// Generate new token
	newToken := uuid.New().String() + "-" + uuid.New().String()
	
	if err := h.db.Model(&client).Update("access_token", newToken).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to regenerate token"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"token": newToken,
		"message": "Token regenerated successfully",
	})
}

// GetClientAccessLogs returns access logs for a client
func (h *Handlers) GetClientAccessLogs(c *gin.Context) {
	clientID := c.Param("id")
	
	var logs []models.ClientAccessLog
	query := h.db.Where("organization_id = ?", clientID).Order("created_at DESC")
	
	// Add pagination
	limit := 100
	if l := c.Query("limit"); l != "" {
		// Parse limit
	}
	
	if err := query.Limit(limit).Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch logs"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"logs": logs,
		"count": len(logs),
	})
}

// Helper functions

func (h *Handlers) filterVehicleFields(vehicles []models.Vehicle, permissions models.ClientPermissions) []map[string]interface{} {
	filtered := make([]map[string]interface{}, len(vehicles))
	
	for i, vehicle := range vehicles {
		v := make(map[string]interface{})
		
		// Always include basic fields
		v["id"] = vehicle.ID
		v["licensePlate"] = vehicle.LicensePlate
		v["make"] = vehicle.Make
		v["model"] = vehicle.Model
		v["year"] = vehicle.Year
		v["status"] = vehicle.Status
		v["checkInDate"] = vehicle.CheckInDate
		
		// Conditionally include fields based on permissions
		if !contains(permissions.HiddenFields, "vin") {
			v["vin"] = vehicle.VIN
		}
		if !contains(permissions.HiddenFields, "mileage") {
			v["mileage"] = vehicle.Mileage
		}
		if !contains(permissions.HiddenFields, "color") {
			v["color"] = vehicle.Color
		}
		if vehicle.CheckOutDate != nil && !contains(permissions.HiddenFields, "checkOutDate") {
			v["checkOutDate"] = vehicle.CheckOutDate
		}
		
		// Owner info
		if permissions.CanViewOwnerInfo && vehicle.Owner != nil {
			v["owner"] = map[string]interface{}{
				"id": vehicle.Owner.ID,
				"name": vehicle.Owner.Name,
				"companyName": vehicle.Owner.CompanyName,
			}
		}
		
		// Photos
		if permissions.CanViewPhotos && len(vehicle.Photos) > 0 {
			photos := make([]map[string]interface{}, len(vehicle.Photos))
			for j, photo := range vehicle.Photos {
				photos[j] = map[string]interface{}{
					"id": photo.ID,
					"url": photo.URL,
					"thumbnail": photo.Thumbnail,
					"category": photo.Category,
				}
			}
			v["photos"] = photos
		}
		
		// Inspections count
		if permissions.CanViewInspections {
			v["inspectionsCount"] = len(vehicle.Inspections)
		}
		
		filtered[i] = v
	}
	
	return filtered
}

func (h *Handlers) logClientAccess(c *gin.Context, client *models.ClientOrganization, action, resourceType, resourceID string, status int) {
	log := models.ClientAccessLog{
		OrganizationID: client.ID,
		Action:         action,
		ResourceType:   resourceType,
		ResourceID:     resourceID,
		IPAddress:      c.ClientIP(),
		UserAgent:      c.GetHeader("User-Agent"),
		ResponseStatus: status,
		CreatedAt:      time.Now(),
	}
	
	// Save async
	go func() {
		h.db.Create(&log)
	}()
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}