package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// TemplateMarketplace represents a shared template in the marketplace
type TemplateMarketplace struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	TemplateID  uuid.UUID      `gorm:"type:uuid;not null" json:"template_id"`
	Template    *FormTemplate  `json:"template,omitempty"`
	Name        string         `gorm:"not null" json:"name"`
	Description string         `json:"description"`
	Category    string         `json:"category"`
	Tags        pq.StringArray `gorm:"type:text[]" json:"tags"`
	Icon        string         `json:"icon"`
	Screenshots pq.StringArray `gorm:"type:text[]" json:"screenshots"`
	
	// Marketplace metadata
	Downloads   int            `gorm:"default:0" json:"downloads"`
	Rating      float32        `gorm:"default:0" json:"rating"`
	RatingCount int            `gorm:"default:0" json:"rating_count"`
	IsOfficial  bool           `gorm:"default:false" json:"is_official"`
	IsFeatured  bool           `gorm:"default:false" json:"is_featured"`
	
	// Publishing info
	PublishedBy uuid.UUID      `gorm:"type:uuid" json:"published_by"`
	Publisher   *User          `json:"publisher,omitempty"`
	PublishedAt time.Time      `json:"published_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// TemplateRating represents a user's rating for a template
type TemplateRating struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	TemplateID   uuid.UUID `gorm:"type:uuid;not null" json:"template_id"`
	UserID       uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Rating       int       `gorm:"not null;check:rating >= 1 AND rating <= 5" json:"rating"`
	Comment      string    `json:"comment"`
	IsVerified   bool      `gorm:"default:false" json:"is_verified"` // Verified purchase/usage
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// TemplateCategory represents predefined categories
type TemplateCategory struct {
	Slug        string `gorm:"primary_key" json:"slug"`
	Name        string `gorm:"not null" json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Order       int    `json:"order"`
}

// PredefinedTemplate represents system templates
type PredefinedTemplate struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Category    string         `json:"category"`
	Icon        string         `json:"icon"`
	Config      FormConfig     `json:"config"`
	Tags        []string       `json:"tags"`
}

// GetPredefinedTemplates returns all system templates
func GetPredefinedTemplates() []PredefinedTemplate {
	return []PredefinedTemplate{
		{
			ID:          "inspection_basic",
			Name:        "Inspección Básica",
			Description: "Inspección vehicular estándar con todos los puntos esenciales",
			Category:    "inspection",
			Icon:        "🔍",
			Tags:        []string{"básico", "rápido", "esencial"},
			Config: FormConfig{
				Sections: []FormSection{
					{
						ID:       "exterior",
						Name:     "Exterior",
						Icon:     "🚗",
						Required: true,
						Order:    1,
						Fields: []FormField{
							{
								ID:       "body_condition",
								Type:     "select",
								Label:    "Condición Carrocería",
								Required: true,
								Options:  []string{"Excelente", "Buena", "Regular", "Mala"},
								Order:    1,
							},
							{
								ID:       "paint_condition",
								Type:     "select",
								Label:    "Estado Pintura",
								Required: true,
								Options:  []string{"Original", "Retocada", "Repintada completa"},
								Order:    2,
							},
							{
								ID:    "exterior_photos",
								Type:  "photo",
								Label: "Fotos Exterior (4 ángulos)",
								Validation: map[string]interface{}{
									"minPhotos": 4,
								},
								Order: 3,
							},
						},
					},
					{
						ID:       "interior",
						Name:     "Interior",
						Icon:     "🪑",
						Required: true,
						Order:    2,
						Fields: []FormField{
							{
								ID:       "seats_condition",
								Type:     "select",
								Label:    "Estado Asientos",
								Required: true,
								Options:  []string{"Excelente", "Bueno", "Regular", "Malo"},
								Order:    1,
							},
							{
								ID:      "odometer_reading",
								Type:    "number",
								Label:   "Kilometraje",
								Required: true,
								Order:   2,
							},
						},
					},
				},
				Settings: FormSettings{
					RequireSignature:   true,
					RequirePhotos:      true,
					MinPhotosPerItem:   1,
					AllowVoiceNotes:    false,
					AllowSkipSections:  false,
					AutoSaveInterval:   30,
					CompletionRequires: []string{"all_required_fields", "signature"},
				},
			},
		},
		{
			ID:          "inspection_complete",
			Name:        "Inspección Completa Premium",
			Description: "Inspección exhaustiva con más de 100 puntos de verificación",
			Category:    "inspection",
			Icon:        "⭐",
			Tags:        []string{"completo", "premium", "detallado"},
			Config: FormConfig{
				Sections: []FormSection{
					// ... más secciones detalladas
				},
				Settings: FormSettings{
					RequireSignature:   true,
					RequirePhotos:      true,
					MinPhotosPerItem:   2,
					AllowVoiceNotes:    true,
					AllowSkipSections:  false,
					AutoSaveInterval:   30,
					CompletionRequires: []string{"all_required_fields", "signature", "min_photos"},
				},
			},
		},
		{
			ID:          "quick_checkin",
			Name:        "Check-in Rápido",
			Description: "Registro rápido de entrada de vehículos",
			Category:    "checkin",
			Icon:        "⚡",
			Tags:        []string{"rápido", "entrada", "simple"},
			Config: FormConfig{
				Sections: []FormSection{
					{
						ID:       "vehicle_info",
						Name:     "Información del Vehículo",
						Icon:     "🚙",
						Required: true,
						Order:    1,
						Fields: []FormField{
							{
								ID:          "license_plate",
								Type:        "text",
								Label:       "Patente",
								Required:    true,
								Placeholder: "AA-BB-12",
								Order:       1,
							},
							{
								ID:       "entry_reason",
								Type:     "select",
								Label:    "Motivo de Ingreso",
								Required: true,
								Options:  []string{"Mantención", "Reparación", "Inspección", "Otro"},
								Order:    2,
							},
							{
								ID:    "entry_photos",
								Type:  "photo",
								Label: "Foto de Ingreso",
								Validation: map[string]interface{}{
									"minPhotos": 1,
									"maxPhotos": 1,
								},
								Order: 3,
							},
						},
					},
				},
				Settings: FormSettings{
					RequireSignature:   false,
					RequirePhotos:      true,
					MinPhotosPerItem:   1,
					AllowVoiceNotes:    false,
					AllowSkipSections:  false,
					AutoSaveInterval:   30,
					CompletionRequires: []string{"all_required_fields"},
				},
			},
		},
		{
			ID:          "damage_report",
			Name:        "Reporte de Daños",
			Description: "Documentación detallada de daños con fotos y anotaciones",
			Category:    "damage",
			Icon:        "🔧",
			Tags:        []string{"daños", "seguro", "evidencia"},
			Config: FormConfig{
				Sections: []FormSection{
					{
						ID:       "damage_details",
						Name:     "Detalles del Daño",
						Icon:     "⚠️",
						Required: true,
						Order:    1,
						Fields: []FormField{
							{
								ID:       "damage_type",
								Type:     "select",
								Label:    "Tipo de Daño",
								Required: true,
								Options:  []string{"Colisión", "Rayón", "Abolladura", "Rotura", "Otro"},
								Order:    1,
							},
							{
								ID:       "damage_location",
								Type:     "select",
								Label:    "Ubicación",
								Required: true,
								Options:  []string{
									"Frontal", "Trasero", "Lateral Izquierdo", 
									"Lateral Derecho", "Techo", "Capó", "Maletero",
								},
								Order: 2,
							},
							{
								ID:          "damage_description",
								Type:        "text",
								Label:       "Descripción Detallada",
								Required:    true,
								Placeholder: "Describe el daño en detalle...",
								Order:       3,
							},
							{
								ID:    "damage_photos",
								Type:  "photo",
								Label: "Fotos del Daño",
								Validation: map[string]interface{}{
									"minPhotos": 3,
									"maxPhotos": 10,
								},
								Order: 4,
							},
						},
					},
				},
				Settings: FormSettings{
					RequireSignature:   true,
					RequirePhotos:      true,
					MinPhotosPerItem:   3,
					AllowVoiceNotes:    true,
					AllowSkipSections:  false,
					AutoSaveInterval:   30,
					CompletionRequires: []string{"all_required_fields", "signature", "min_photos"},
				},
			},
		},
		{
			ID:          "delivery_checklist",
			Name:        "Checklist de Entrega",
			Description: "Verificación final antes de entregar el vehículo al cliente",
			Category:    "delivery",
			Icon:        "✅",
			Tags:        []string{"entrega", "final", "cliente"},
			Config: FormConfig{
				Sections: []FormSection{
					{
						ID:       "final_checks",
						Name:     "Verificaciones Finales",
						Icon:     "📋",
						Required: true,
						Order:    1,
						Fields: []FormField{
							{
								ID:       "work_completed",
								Type:     "checkbox",
								Label:    "Todos los trabajos completados",
								Required: true,
								Order:    1,
							},
							{
								ID:       "test_drive",
								Type:     "checkbox",
								Label:    "Prueba de manejo realizada",
								Required: true,
								Order:    2,
							},
							{
								ID:       "cleaning",
								Type:     "checkbox",
								Label:    "Vehículo limpio interior y exterior",
								Required: true,
								Order:    3,
							},
							{
								ID:       "fuel_level",
								Type:     "select",
								Label:    "Nivel de combustible",
								Required: true,
								Options:  []string{"Vacío", "1/4", "1/2", "3/4", "Lleno"},
								Order:    4,
							},
							{
								ID:    "final_photos",
								Type:  "photo",
								Label: "Fotos de entrega",
								Validation: map[string]interface{}{
									"minPhotos": 2,
								},
								Order: 5,
							},
						},
					},
				},
				Settings: FormSettings{
					RequireSignature:   true,
					RequirePhotos:      true,
					MinPhotosPerItem:   1,
					AllowVoiceNotes:    false,
					AllowSkipSections:  false,
					AutoSaveInterval:   30,
					CompletionRequires: []string{"all_required_fields", "signature"},
				},
			},
		},
	}
}

// GetTemplateCategories returns all available categories
func GetTemplateCategories() []TemplateCategory {
	return []TemplateCategory{
		{
			Slug:        "inspection",
			Name:        "Inspección",
			Description: "Formularios de inspección vehicular",
			Icon:        "🔍",
			Order:       1,
		},
		{
			Slug:        "checkin",
			Name:        "Registro",
			Description: "Formularios de entrada y salida",
			Icon:        "📝",
			Order:       2,
		},
		{
			Slug:        "damage",
			Name:        "Daños",
			Description: "Reportes y evaluación de daños",
			Icon:        "⚠️",
			Order:       3,
		},
		{
			Slug:        "delivery",
			Name:        "Entrega",
			Description: "Checklists de entrega",
			Icon:        "✅",
			Order:       4,
		},
		{
			Slug:        "maintenance",
			Name:        "Mantenimiento",
			Description: "Formularios de servicio",
			Icon:        "🔧",
			Order:       5,
		},
		{
			Slug:        "custom",
			Name:        "Personalizado",
			Description: "Formularios personalizados",
			Icon:        "⚙️",
			Order:       6,
		},
	}
}

// BeforeCreate hooks
func (t *TemplateMarketplace) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	if t.PublishedAt.IsZero() {
		t.PublishedAt = time.Now()
	}
	return nil
}

func (r *TemplateRating) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}