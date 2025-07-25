package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/macal/inventory/internal/models"
)

// ListFormTemplates returns all form templates
func (h *Handlers) ListFormTemplates(c *gin.Context) {
	templateType := c.Query("type")
	
	var templates []models.FormTemplate
	query := h.db.Where("active = ?", true)
	
	if templateType != "" {
		query = query.Where("type = ?", templateType)
	}
	
	if err := query.Order("created_at DESC").Find(&templates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch templates"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"templates": templates,
		"count":     len(templates),
	})
}

// GetFormTemplate returns a specific form template
func (h *Handlers) GetFormTemplate(c *gin.Context) {
	id := c.Param("id")
	
	var template models.FormTemplate
	if err := h.db.First(&template, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}
	
	c.JSON(http.StatusOK, template)
}

// CreateFormTemplate creates a new form template
func (h *Handlers) CreateFormTemplate(c *gin.Context) {
	userID := c.GetString("userID") // From auth middleware
	
	var input struct {
		Name   string             `json:"name" binding:"required"`
		Type   string             `json:"type" binding:"required"`
		Config models.FormConfig  `json:"config" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Validate the configuration
	if err := validateFormConfig(input.Config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form configuration", "details": err.Error()})
		return
	}
	
	template := models.FormTemplate{
		Name:      input.Name,
		Type:      input.Type,
		Config:    models.JSONB(input.Config),
		CreatedBy: uuid.MustParse(userID),
		Active:    true,
		Version:   1,
	}
	
	if err := h.db.Create(&template).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create template"})
		return
	}
	
	// Cache the template
	h.cacheFormTemplate(&template)
	
	c.JSON(http.StatusCreated, template)
}

// UpdateFormTemplate updates an existing form template
func (h *Handlers) UpdateFormTemplate(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString("userID")
	
	var template models.FormTemplate
	if err := h.db.First(&template, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}
	
	var input struct {
		Name   string             `json:"name"`
		Config models.FormConfig  `json:"config"`
		Active bool               `json:"active"`
	}
	
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Validate configuration if provided
	if input.Config.Sections != nil {
		if err := validateFormConfig(input.Config); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form configuration", "details": err.Error()})
			return
		}
	}
	
	// Create new version instead of updating (versioning)
	newTemplate := models.FormTemplate{
		Name:      input.Name,
		Type:      template.Type,
		Config:    models.JSONB(input.Config),
		CreatedBy: uuid.MustParse(userID),
		Active:    input.Active,
		Version:   template.Version + 1,
	}
	
	// Begin transaction
	tx := h.db.Begin()
	
	// Deactivate old version
	if err := tx.Model(&template).Update("active", false).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update template"})
		return
	}
	
	// Create new version
	if err := tx.Create(&newTemplate).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create new version"})
		return
	}
	
	tx.Commit()
	
	// Update cache
	h.cacheFormTemplate(&newTemplate)
	
	c.JSON(http.StatusOK, newTemplate)
}

// DeleteFormTemplate soft deletes a form template
func (h *Handlers) DeleteFormTemplate(c *gin.Context) {
	id := c.Param("id")
	
	if err := h.db.Model(&models.FormTemplate{}).Where("id = ?", id).Update("active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete template"})
		return
	}
	
	// Remove from cache
	h.redis.Del(c.Request.Context(), "form_template:"+id)
	
	c.JSON(http.StatusOK, gin.H{"message": "Template deleted successfully"})
}

// CloneFormTemplate creates a copy of an existing template
func (h *Handlers) CloneFormTemplate(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString("userID")
	
	var original models.FormTemplate
	if err := h.db.First(&original, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}
	
	var input struct {
		Name string `json:"name" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Create clone
	clone := models.FormTemplate{
		Name:      input.Name,
		Type:      original.Type,
		Config:    original.Config,
		CreatedBy: uuid.MustParse(userID),
		Active:    true,
		Version:   1,
	}
	
	if err := h.db.Create(&clone).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clone template"})
		return
	}
	
	c.JSON(http.StatusCreated, clone)
}

// ExportFormTemplate exports a template as JSON
func (h *Handlers) ExportFormTemplate(c *gin.Context) {
	id := c.Param("id")
	
	var template models.FormTemplate
	if err := h.db.First(&template, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}
	
	// Set headers for file download
	c.Header("Content-Type", "application/json")
	c.Header("Content-Disposition", "attachment; filename="+template.Name+".json")
	
	c.JSON(http.StatusOK, gin.H{
		"name":    template.Name,
		"type":    template.Type,
		"version": template.Version,
		"config":  template.Config,
	})
}

// ImportFormTemplate imports a template from JSON
func (h *Handlers) ImportFormTemplate(c *gin.Context) {
	userID := c.GetString("userID")
	
	var input struct {
		Name    string             `json:"name" binding:"required"`
		Type    string             `json:"type" binding:"required"`
		Config  models.FormConfig  `json:"config" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Validate configuration
	if err := validateFormConfig(input.Config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form configuration", "details": err.Error()})
		return
	}
	
	template := models.FormTemplate{
		Name:      input.Name + " (Imported)",
		Type:      input.Type,
		Config:    models.JSONB(input.Config),
		CreatedBy: uuid.MustParse(userID),
		Active:    true,
		Version:   1,
	}
	
	if err := h.db.Create(&template).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to import template"})
		return
	}
	
	c.JSON(http.StatusCreated, template)
}

// Helper functions

func (h *Handlers) cacheFormTemplate(template *models.FormTemplate) {
	// Cache in Redis for fast access
	ctx := context.Background()
	key := "form_template:" + template.ID.String()
	
	data, _ := json.Marshal(template)
	h.redis.Set(ctx, key, data, 24*time.Hour)
}

func validateFormConfig(config models.FormConfig) error {
	// Validate that all sections have unique IDs
	sectionIDs := make(map[string]bool)
	for _, section := range config.Sections {
		if sectionIDs[section.ID] {
			return fmt.Errorf("duplicate section ID: %s", section.ID)
		}
		sectionIDs[section.ID] = true
		
		// Validate fields in section
		fieldIDs := make(map[string]bool)
		for _, field := range section.Fields {
			if fieldIDs[field.ID] {
				return fmt.Errorf("duplicate field ID: %s in section %s", field.ID, section.Name)
			}
			fieldIDs[field.ID] = true
			
			// Validate field type
			validTypes := []string{"text", "number", "select", "checkbox", "radio", "photo", "signature", "date", "time"}
			validType := false
			for _, t := range validTypes {
				if field.Type == t {
					validType = true
					break
				}
			}
			if !validType {
				return fmt.Errorf("invalid field type: %s", field.Type)
			}
			
			// Validate options for select/radio fields
			if (field.Type == "select" || field.Type == "radio") && len(field.Options) == 0 {
				return fmt.Errorf("field %s requires options", field.ID)
			}
		}
	}
	
	return nil
}