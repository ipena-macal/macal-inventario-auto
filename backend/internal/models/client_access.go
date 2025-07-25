package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// ClientOrganization represents external organizations (banks, insurance companies, etc.)
type ClientOrganization struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	Type        string         `json:"type"` // bank, insurance, dealer, other
	Logo        string         `json:"logo"`
	ContactName string         `json:"contact_name"`
	Email       string         `json:"email"`
	Phone       string         `json:"phone"`
	Active      bool           `gorm:"default:true" json:"active"`
	
	// Access configuration
	AccessToken string         `gorm:"uniqueIndex" json:"-"`
	ValidUntil  *time.Time     `json:"valid_until"`
	IPWhitelist pq.StringArray `gorm:"type:text[]" json:"ip_whitelist"`
	
	// Permissions
	Permissions ClientPermissions `gorm:"type:jsonb" json:"permissions"`
	
	// Tracking
	LastAccess  *time.Time     `json:"last_access"`
	AccessCount int            `gorm:"default:0" json:"access_count"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// ClientPermissions defines what a client can see/do
type ClientPermissions struct {
	// View permissions
	CanViewVehicles      bool     `json:"can_view_vehicles"`
	CanViewInspections   bool     `json:"can_view_inspections"`
	CanViewPhotos        bool     `json:"can_view_photos"`
	CanViewDocuments     bool     `json:"can_view_documents"`
	CanViewOwnerInfo     bool     `json:"can_view_owner_info"`
	CanDownloadReports   bool     `json:"can_download_reports"`
	
	// Filters - restrict what vehicles they can see
	VehicleFilters       VehicleFilters `json:"vehicle_filters"`
	
	// Custom fields they can see
	VisibleFields        []string `json:"visible_fields"`
	HiddenFields         []string `json:"hidden_fields"`
}

// VehicleFilters restricts which vehicles a client can access
type VehicleFilters struct {
	OwnerIDs      []uuid.UUID `json:"owner_ids"`      // Specific owners
	VehicleIDs    []uuid.UUID `json:"vehicle_ids"`    // Specific vehicles
	LicensePlates []string    `json:"license_plates"` // Specific plates
	Statuses      []string    `json:"statuses"`       // Vehicle statuses
	DateFrom      *time.Time  `json:"date_from"`      // Vehicles after this date
	DateTo        *time.Time  `json:"date_to"`        // Vehicles before this date
}

// ClientAccessLog tracks all client access for audit
type ClientAccessLog struct {
	ID               uuid.UUID            `gorm:"type:uuid;primary_key" json:"id"`
	OrganizationID   uuid.UUID            `gorm:"type:uuid;not null" json:"organization_id"`
	Organization     *ClientOrganization  `json:"organization,omitempty"`
	Action           string               `json:"action"` // view_vehicle, download_report, etc.
	ResourceType     string               `json:"resource_type"`
	ResourceID       string               `json:"resource_id"`
	IPAddress        string               `json:"ip_address"`
	UserAgent        string               `json:"user_agent"`
	ResponseStatus   int                  `json:"response_status"`
	ResponseTime     int                  `json:"response_time"` // milliseconds
	CreatedAt        time.Time            `json:"created_at"`
}

// ClientReport represents a custom report for a client
type ClientReport struct {
	ID             uuid.UUID           `gorm:"type:uuid;primary_key" json:"id"`
	OrganizationID uuid.UUID           `gorm:"type:uuid;not null" json:"organization_id"`
	Name           string              `gorm:"not null" json:"name"`
	Type           string              `json:"type"` // vehicle_status, inspection_summary, etc.
	Config         JSONB               `gorm:"type:jsonb" json:"config"`
	Schedule       string              `json:"schedule"` // daily, weekly, monthly, on_demand
	LastGenerated  *time.Time          `json:"last_generated"`
	Active         bool                `gorm:"default:true" json:"active"`
	CreatedAt      time.Time           `json:"created_at"`
	UpdatedAt      time.Time           `json:"updated_at"`
}

// ClientNotification for sending updates to clients
type ClientNotification struct {
	ID             uuid.UUID           `gorm:"type:uuid;primary_key" json:"id"`
	OrganizationID uuid.UUID           `gorm:"type:uuid;not null" json:"organization_id"`
	Type           string              `json:"type"` // vehicle_added, inspection_completed, etc.
	Title          string              `json:"title"`
	Message        string              `json:"message"`
	Data           JSONB               `gorm:"type:jsonb" json:"data"`
	Read           bool                `gorm:"default:false" json:"read"`
	SentAt         time.Time           `json:"sent_at"`
	ReadAt         *time.Time          `json:"read_at"`
}

// BeforeCreate hooks
func (c *ClientOrganization) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	// Generate secure access token
	if c.AccessToken == "" {
		c.AccessToken = generateSecureToken()
	}
	return nil
}

func (l *ClientAccessLog) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}

func (r *ClientReport) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

func (n *ClientNotification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	if n.SentAt.IsZero() {
		n.SentAt = time.Now()
	}
	return nil
}

// Helper methods
func (c *ClientOrganization) IsValid() bool {
	if !c.Active {
		return false
	}
	if c.ValidUntil != nil && time.Now().After(*c.ValidUntil) {
		return false
	}
	return true
}

func (c *ClientOrganization) CanAccessVehicle(vehicle *Vehicle) bool {
	if !c.Permissions.CanViewVehicles {
		return false
	}
	
	filters := c.Permissions.VehicleFilters
	
	// Check specific vehicle IDs
	if len(filters.VehicleIDs) > 0 {
		found := false
		for _, id := range filters.VehicleIDs {
			if id == vehicle.ID {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	
	// Check owner IDs
	if len(filters.OwnerIDs) > 0 {
		found := false
		for _, id := range filters.OwnerIDs {
			if id == vehicle.OwnerID {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	
	// Check license plates
	if len(filters.LicensePlates) > 0 {
		found := false
		for _, plate := range filters.LicensePlates {
			if plate == vehicle.LicensePlate {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	
	// Check status
	if len(filters.Statuses) > 0 {
		found := false
		for _, status := range filters.Statuses {
			if status == string(vehicle.Status) {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	
	// Check date range
	if filters.DateFrom != nil && vehicle.CheckInDate.Before(*filters.DateFrom) {
		return false
	}
	if filters.DateTo != nil && vehicle.CheckInDate.After(*filters.DateTo) {
		return false
	}
	
	return true
}

func generateSecureToken() string {
	// Generate a secure random token
	return uuid.New().String() + "-" + uuid.New().String()
}