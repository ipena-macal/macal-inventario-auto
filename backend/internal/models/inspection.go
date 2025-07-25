package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Inspection struct {
	ID          uuid.UUID        `gorm:"type:uuid;primary_key" json:"id"`
	VehicleID   uuid.UUID        `gorm:"type:uuid;not null" json:"vehicle_id"`
	Vehicle     *Vehicle         `json:"vehicle,omitempty"`
	InspectorID uuid.UUID        `gorm:"type:uuid;not null" json:"inspector_id"`
	Inspector   *User            `json:"inspector,omitempty"`
	Type        InspectionType   `json:"type"`
	Status      InspectionStatus `json:"status"`
	Sections    JSONB            `gorm:"type:jsonb" json:"sections"`
	Summary     string           `json:"summary"`
	StartedAt   time.Time        `json:"started_at"`
	CompletedAt *time.Time       `json:"completed_at,omitempty"`
	Version     int              `json:"version"`
	PDFUrl      string           `json:"pdf_url,omitempty"`
	Signature   string           `json:"signature,omitempty"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
}

type InspectionType string

const (
	InspectionTypeEntry    InspectionType = "entry"
	InspectionTypeRoutine  InspectionType = "routine"
	InspectionTypeExit     InspectionType = "exit"
	InspectionTypeSpecial  InspectionType = "special"
)

type InspectionStatus string

const (
	InspectionStatusDraft      InspectionStatus = "draft"
	InspectionStatusInProgress InspectionStatus = "in_progress"
	InspectionStatusCompleted  InspectionStatus = "completed"
	InspectionStatusApproved   InspectionStatus = "approved"
)

// JSONB type for PostgreSQL jsonb columns
type JSONB map[string]interface{}

func (j JSONB) Value() (driver.Value, error) {
	return json.Marshal(j)
}

func (j *JSONB) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, j)
}

// InspectionSection represents a section of the inspection
type InspectionSection struct {
	Name        string           `json:"name"`
	Items       []InspectionItem `json:"items"`
	Notes       string           `json:"notes"`
	CompletedAt *time.Time       `json:"completed_at,omitempty"`
	Photos      []string         `json:"photos,omitempty"`
}

// InspectionItem represents a single inspection point
type InspectionItem struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Category    string                 `json:"category"`
	Status      InspectionItemStatus   `json:"status"`
	Value       interface{}            `json:"value,omitempty"`
	Notes       string                 `json:"notes,omitempty"`
	Photos      []string               `json:"photos,omitempty"`
	Annotations []InspectionAnnotation `json:"annotations,omitempty"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

type InspectionItemStatus string

const (
	ItemStatusOK      InspectionItemStatus = "ok"
	ItemStatusWarning InspectionItemStatus = "warning"
	ItemStatusFail    InspectionItemStatus = "fail"
	ItemStatusNA      InspectionItemStatus = "na"
	ItemStatusPending InspectionItemStatus = "pending"
)

// InspectionAnnotation for photo annotations
type InspectionAnnotation struct {
	Type        string                 `json:"type"` // arrow, circle, text, damage
	Coordinates map[string]interface{} `json:"coordinates"`
	Text        string                 `json:"text,omitempty"`
	Color       string                 `json:"color,omitempty"`
	CreatedAt   time.Time              `json:"created_at"`
	CreatedBy   uuid.UUID              `json:"created_by"`
}

// Real-time update structure
type InspectionUpdate struct {
	InspectionID uuid.UUID              `json:"inspection_id"`
	Path         string                 `json:"path"`
	Value        interface{}            `json:"value"`
	UpdatedBy    uuid.UUID              `json:"updated_by"`
	Version      int                    `json:"version"`
	Timestamp    time.Time              `json:"timestamp"`
	Type         string                 `json:"type"` // field_update, photo_added, section_completed
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

// BeforeCreate hook
func (i *Inspection) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	if i.StartedAt.IsZero() {
		i.StartedAt = time.Now()
	}
	if i.Status == "" {
		i.Status = InspectionStatusDraft
	}
	if i.Sections == nil {
		i.Sections = make(JSONB)
	}
	i.Version = 1
	return nil
}

// Helper methods
func (i *Inspection) IsCompleted() bool {
	return i.Status == InspectionStatusCompleted || i.Status == InspectionStatusApproved
}

func (i *Inspection) CanEdit() bool {
	return i.Status == InspectionStatusDraft || i.Status == InspectionStatusInProgress
}

func (i *Inspection) GetSection(name string) (*InspectionSection, bool) {
	if section, ok := i.Sections[name]; ok {
		var inspectionSection InspectionSection
		// Convert to InspectionSection
		if data, err := json.Marshal(section); err == nil {
			if err := json.Unmarshal(data, &inspectionSection); err == nil {
				return &inspectionSection, true
			}
		}
	}
	return nil, false
}

func (i *Inspection) UpdateSection(name string, section *InspectionSection) {
	i.Sections[name] = section
	i.Version++
}