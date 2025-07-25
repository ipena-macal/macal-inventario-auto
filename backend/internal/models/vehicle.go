package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Vehicle struct {
	ID           uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	LicensePlate string         `gorm:"uniqueIndex;not null" json:"license_plate"`
	VIN          string         `gorm:"uniqueIndex" json:"vin"`
	Make         string         `json:"make"`
	Model        string         `json:"model"`
	Year         int            `json:"year"`
	Color        string         `json:"color"`
	Mileage      int            `json:"mileage"`
	OwnerID      uuid.UUID      `gorm:"type:uuid" json:"owner_id"`
	Owner        *Owner         `json:"owner,omitempty"`
	Status       VehicleStatus  `json:"status"`
	CheckInDate  time.Time      `json:"check_in_date"`
	CheckOutDate *time.Time     `json:"check_out_date,omitempty"`
	Photos       []VehiclePhoto `json:"photos,omitempty"`
	Inspections  []Inspection   `json:"inspections,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

type VehicleStatus string

const (
	VehicleStatusPending    VehicleStatus = "pending"
	VehicleStatusInspecting VehicleStatus = "inspecting"
	VehicleStatusRepairing  VehicleStatus = "repairing"
	VehicleStatusCompleted  VehicleStatus = "completed"
	VehicleStatusDelivered  VehicleStatus = "delivered"
)

type VehiclePhoto struct {
	ID         uuid.UUID     `gorm:"type:uuid;primary_key" json:"id"`
	VehicleID  uuid.UUID     `gorm:"type:uuid;not null" json:"vehicle_id"`
	Category   PhotoCategory `json:"category"`
	URL        string        `json:"url"`
	Thumbnail  string        `json:"thumbnail"`
	Metadata   JSONB         `gorm:"type:jsonb" json:"metadata"`
	UploadedBy uuid.UUID     `gorm:"type:uuid" json:"uploaded_by"`
	UploadedAt time.Time     `json:"uploaded_at"`
}

type PhotoCategory string

const (
	PhotoCategoryExteriorFront  PhotoCategory = "exterior_front"
	PhotoCategoryExteriorBack   PhotoCategory = "exterior_back"
	PhotoCategoryExteriorLeft   PhotoCategory = "exterior_left"
	PhotoCategoryExteriorRight  PhotoCategory = "exterior_right"
	PhotoCategoryInteriorFront  PhotoCategory = "interior_front"
	PhotoCategoryInteriorBack   PhotoCategory = "interior_back"
	PhotoCategoryEngine         PhotoCategory = "engine"
	PhotoCategoryTrunk          PhotoCategory = "trunk"
	PhotoCategoryDamage         PhotoCategory = "damage"
	PhotoCategoryDocument       PhotoCategory = "document"
)

type Owner struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	RUT         string         `gorm:"uniqueIndex" json:"rut"`
	Email       string         `json:"email"`
	Phone       string         `json:"phone"`
	Address     string         `json:"address"`
	CompanyName string         `json:"company_name,omitempty"`
	Vehicles    []Vehicle      `json:"vehicles,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// BeforeCreate hooks
func (v *Vehicle) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	if v.CheckInDate.IsZero() {
		v.CheckInDate = time.Now()
	}
	if v.Status == "" {
		v.Status = VehicleStatusPending
	}
	return nil
}

func (p *VehiclePhoto) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	if p.UploadedAt.IsZero() {
		p.UploadedAt = time.Now()
	}
	return nil
}

func (o *Owner) BeforeCreate(tx *gorm.DB) error {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	return nil
}