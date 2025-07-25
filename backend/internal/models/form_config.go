package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// FormTemplate represents a customizable form template
type FormTemplate struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	Type        string         `json:"type"` // inspection, checklist, etc
	Version     int            `json:"version"`
	Active      bool           `gorm:"default:true" json:"active"`
	Config      JSONB          `gorm:"type:jsonb" json:"config"`
	CreatedBy   uuid.UUID      `gorm:"type:uuid" json:"created_by"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// FormConfig structure for the JSONB field
type FormConfig struct {
	Sections []FormSection `json:"sections"`
	Settings FormSettings  `json:"settings"`
}

type FormSection struct {
	ID       string      `json:"id"`
	Name     string      `json:"name"`
	Icon     string      `json:"icon,omitempty"`
	Fields   []FormField `json:"fields"`
	Required bool        `json:"required"`
	Order    int         `json:"order"`
}

type FormField struct {
	ID           string                 `json:"id"`
	Type         string                 `json:"type"` // text, number, select, checkbox, photo, signature
	Label        string                 `json:"label"`
	Placeholder  string                 `json:"placeholder,omitempty"`
	Required     bool                   `json:"required"`
	Options      []string               `json:"options,omitempty"`      // for select/radio
	Validation   map[string]interface{} `json:"validation,omitempty"`   // min, max, pattern
	DefaultValue interface{}            `json:"defaultValue,omitempty"`
	Conditional  *FieldCondition        `json:"conditional,omitempty"`
	Order        int                    `json:"order"`
}

type FieldCondition struct {
	Field    string      `json:"field"`    // field ID to check
	Operator string      `json:"operator"` // equals, not_equals, contains
	Value    interface{} `json:"value"`
}

type FormSettings struct {
	RequireSignature   bool     `json:"requireSignature"`
	RequirePhotos      bool     `json:"requirePhotos"`
	MinPhotosPerItem   int      `json:"minPhotosPerItem"`
	AllowVoiceNotes    bool     `json:"allowVoiceNotes"`
	AllowSkipSections  bool     `json:"allowSkipSections"`
	AutoSaveInterval   int      `json:"autoSaveInterval"` // seconds
	CompletionRequires []string `json:"completionRequires"`
}

// BeforeCreate hook
func (f *FormTemplate) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	if f.Version == 0 {
		f.Version = 1
	}
	return nil
}

// Example of a default inspection form configuration
func DefaultInspectionFormConfig() FormConfig {
	return FormConfig{
		Sections: []FormSection{
			{
				ID:       "exterior",
				Name:     "Inspección Exterior",
				Icon:     "🚗",
				Required: true,
				Order:    1,
				Fields: []FormField{
					{
						ID:       "paint_condition",
						Type:     "select",
						Label:    "Estado de la Pintura",
						Required: true,
						Options:  []string{"Excelente", "Bueno", "Regular", "Malo"},
						Order:    1,
					},
					{
						ID:           "scratches",
						Type:         "checkbox",
						Label:        "Rayones visibles",
						Order:        2,
						Conditional: &FieldCondition{
							Field:    "paint_condition",
							Operator: "not_equals",
							Value:    "Excelente",
						},
					},
					{
						ID:       "exterior_photos",
						Type:     "photo",
						Label:    "Fotos del Exterior",
						Required: true,
						Validation: map[string]interface{}{
							"minPhotos": 4,
							"maxPhotos": 8,
						},
						Order: 3,
					},
					{
						ID:          "exterior_notes",
						Type:        "text",
						Label:       "Observaciones",
						Placeholder: "Detalles adicionales del exterior...",
						Order:       4,
					},
				},
			},
			{
				ID:       "engine",
				Name:     "Motor",
				Icon:     "⚙️",
				Required: true,
				Order:    2,
				Fields: []FormField{
					{
						ID:       "engine_start",
						Type:     "select",
						Label:    "Arranque del Motor",
						Required: true,
						Options:  []string{"Normal", "Dificultad", "No arranca"},
						Order:    1,
					},
					{
						ID:    "engine_sound",
						Type:  "select",
						Label: "Ruido del Motor",
						Options: []string{
							"Normal",
							"Ruido leve",
							"Ruido moderado",
							"Ruido excesivo",
						},
						Order: 2,
					},
					{
						ID:       "oil_level",
						Type:     "select",
						Label:    "Nivel de Aceite",
						Required: true,
						Options:  []string{"Correcto", "Bajo", "Excesivo"},
						Order:    3,
					},
				},
			},
		},
		Settings: FormSettings{
			RequireSignature:   true,
			RequirePhotos:      true,
			MinPhotosPerItem:   1,
			AllowVoiceNotes:    true,
			AllowSkipSections:  false,
			AutoSaveInterval:   30,
			CompletionRequires: []string{"all_required_fields", "signature", "min_photos"},
		},
	}
}