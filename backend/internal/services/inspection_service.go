package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"github.com/macal/inventory/internal/models"
	"github.com/macal/inventory/pkg/storage"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type InspectionService struct {
	db      *gorm.DB
	redis   *redis.Client
	storage storage.Storage
	logger  *zap.SugaredLogger
	pubsub  *redis.PubSub
}

func NewInspectionService(db *gorm.DB, redis *redis.Client, storage storage.Storage) *InspectionService {
	logger, _ := zap.NewProduction()
	return &InspectionService{
		db:      db,
		redis:   redis,
		storage: storage,
		logger:  logger.Sugar(),
	}
}

// CreateInspection creates a new inspection
func (s *InspectionService) CreateInspection(ctx context.Context, inspection *models.Inspection) error {
	// Save to database
	if err := s.db.Create(inspection).Error; err != nil {
		return err
	}

	// Cache in Redis for real-time editing
	if err := s.cacheInspection(ctx, inspection); err != nil {
		s.logger.Errorf("Failed to cache inspection: %v", err)
	}

	// Publish creation event
	s.publishUpdate(ctx, &models.InspectionUpdate{
		InspectionID: inspection.ID,
		Type:         "inspection_created",
		Timestamp:    time.Now(),
		Version:      inspection.Version,
	})

	return nil
}

// GetInspection retrieves an inspection (first from cache, then DB)
func (s *InspectionService) GetInspection(ctx context.Context, id uuid.UUID) (*models.Inspection, error) {
	// Try cache first
	inspection, err := s.getCachedInspection(ctx, id)
	if err == nil && inspection != nil {
		return inspection, nil
	}

	// Fallback to database
	inspection = &models.Inspection{}
	if err := s.db.Preload("Vehicle").Preload("Inspector").First(inspection, id).Error; err != nil {
		return nil, err
	}

	// Cache for future requests
	s.cacheInspection(ctx, inspection)

	return inspection, nil
}

// UpdateInspectionField updates a specific field in real-time
func (s *InspectionService) UpdateInspectionField(ctx context.Context, update *models.InspectionUpdate) error {
	key := fmt.Sprintf("inspection:%s", update.InspectionID)

	// Use Redis transaction for atomic updates
	err := s.redis.Watch(ctx, func(tx *redis.Tx) error {
		// Get current version
		currentVersion, err := tx.HGet(ctx, key, "version").Int()
		if err != nil && err != redis.Nil {
			return err
		}

		// Check version conflict
		if currentVersion >= update.Version {
			return fmt.Errorf("version conflict: current %d, update %d", currentVersion, update.Version)
		}

		// Marshal the update value
		valueJSON, err := json.Marshal(update.Value)
		if err != nil {
			return err
		}

		// Pipeline for atomic updates
		_, err = tx.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
			pipe.HSet(ctx, key, update.Path, valueJSON)
			pipe.HSet(ctx, key, "updated_at", time.Now())
			pipe.HIncrBy(ctx, key, "version", 1)
			pipe.Expire(ctx, key, 24*time.Hour)

			// Publish update to subscribers
			updateJSON, _ := json.Marshal(update)
			pipe.Publish(ctx, fmt.Sprintf("inspection:%s:updates", update.InspectionID), updateJSON)

			return nil
		})

		return err
	}, key)

	if err != nil {
		return err
	}

	// Async save to database (debounced)
	go s.persistToDB(ctx, update.InspectionID)

	return nil
}

// SubscribeToUpdates subscribes to real-time inspection updates
func (s *InspectionService) SubscribeToUpdates(ctx context.Context, inspectionID uuid.UUID) (<-chan *models.InspectionUpdate, error) {
	channel := fmt.Sprintf("inspection:%s:updates", inspectionID)
	pubsub := s.redis.Subscribe(ctx, channel)

	updates := make(chan *models.InspectionUpdate, 100)

	go func() {
		defer close(updates)
		defer pubsub.Close()

		for {
			select {
			case <-ctx.Done():
				return
			case msg := <-pubsub.Channel():
				var update models.InspectionUpdate
				if err := json.Unmarshal([]byte(msg.Payload), &update); err != nil {
					s.logger.Errorf("Failed to unmarshal update: %v", err)
					continue
				}
				updates <- &update
			}
		}
	}()

	return updates, nil
}

// CompleteSection marks a section as completed
func (s *InspectionService) CompleteSection(ctx context.Context, inspectionID uuid.UUID, sectionName string) error {
	now := time.Now()
	update := &models.InspectionUpdate{
		InspectionID: inspectionID,
		Path:         fmt.Sprintf("sections.%s.completed_at", sectionName),
		Value:        now,
		Type:         "section_completed",
		Timestamp:    now,
	}

	return s.UpdateInspectionField(ctx, update)
}

// AddPhotoToInspection adds a photo to an inspection item
func (s *InspectionService) AddPhotoToInspection(ctx context.Context, inspectionID uuid.UUID, sectionName, itemID string, photoData []byte) (string, error) {
	// Generate unique filename
	filename := fmt.Sprintf("inspections/%s/%s/%s_%s.jpg", inspectionID, sectionName, itemID, uuid.New())

	// Upload to storage
	url, err := s.storage.Upload(ctx, filename, photoData)
	if err != nil {
		return "", err
	}

	// Update inspection with photo URL
	update := &models.InspectionUpdate{
		InspectionID: inspectionID,
		Path:         fmt.Sprintf("sections.%s.items.%s.photos", sectionName, itemID),
		Value:        url,
		Type:         "photo_added",
		Timestamp:    time.Now(),
		Metadata: map[string]interface{}{
			"filename": filename,
			"size":     len(photoData),
		},
	}

	if err := s.UpdateInspectionField(ctx, update); err != nil {
		return "", err
	}

	return url, nil
}

// GeneratePDF generates a PDF report for the inspection
func (s *InspectionService) GeneratePDF(ctx context.Context, inspectionID uuid.UUID) ([]byte, error) {
	inspection, err := s.GetInspection(ctx, inspectionID)
	if err != nil {
		return nil, err
	}

	// Check cache first
	cacheKey := fmt.Sprintf("pdf:%s:v%d", inspectionID, inspection.Version)
	if cached, err := s.redis.Get(ctx, cacheKey).Bytes(); err == nil {
		return cached, nil
	}

	// Generate PDF (implement PDF generation logic)
	pdfData, err := s.generatePDFReport(inspection)
	if err != nil {
		return nil, err
	}

	// Cache the PDF
	s.redis.Set(ctx, cacheKey, pdfData, 24*time.Hour)

	// Upload to storage
	pdfURL, err := s.storage.Upload(ctx, fmt.Sprintf("reports/%s.pdf", inspectionID), pdfData)
	if err != nil {
		s.logger.Errorf("Failed to upload PDF: %v", err)
	} else {
		// Update inspection with PDF URL
		inspection.PDFUrl = pdfURL
		s.db.Model(inspection).Update("pdf_url", pdfURL)
	}

	return pdfData, nil
}

// Helper methods

func (s *InspectionService) cacheInspection(ctx context.Context, inspection *models.Inspection) error {
	key := fmt.Sprintf("inspection:%s", inspection.ID)
	data, err := json.Marshal(inspection)
	if err != nil {
		return err
	}

	pipe := s.redis.Pipeline()
	pipe.HSet(ctx, key, "data", data)
	pipe.HSet(ctx, key, "version", inspection.Version)
	pipe.HSet(ctx, key, "updated_at", inspection.UpdatedAt)
	pipe.Expire(ctx, key, 24*time.Hour)

	_, err = pipe.Exec(ctx)
	return err
}

func (s *InspectionService) getCachedInspection(ctx context.Context, id uuid.UUID) (*models.Inspection, error) {
	key := fmt.Sprintf("inspection:%s", id)
	data, err := s.redis.HGet(ctx, key, "data").Bytes()
	if err != nil {
		return nil, err
	}

	var inspection models.Inspection
	if err := json.Unmarshal(data, &inspection); err != nil {
		return nil, err
	}

	return &inspection, nil
}

func (s *InspectionService) publishUpdate(ctx context.Context, update *models.InspectionUpdate) {
	updateJSON, _ := json.Marshal(update)
	s.redis.Publish(ctx, fmt.Sprintf("inspection:%s:updates", update.InspectionID), updateJSON)
}

func (s *InspectionService) persistToDB(ctx context.Context, inspectionID uuid.UUID) {
	// Implement debounced database persistence
	// This would batch updates and save to DB every few seconds
	time.Sleep(5 * time.Second)

	inspection, err := s.getCachedInspection(ctx, inspectionID)
	if err != nil {
		s.logger.Errorf("Failed to get cached inspection for persistence: %v", err)
		return
	}

	if err := s.db.Save(inspection).Error; err != nil {
		s.logger.Errorf("Failed to persist inspection to DB: %v", err)
	}
}

func (s *InspectionService) generatePDFReport(inspection *models.Inspection) ([]byte, error) {
	// TODO: Implement PDF generation using a library like gopdf or wkhtmltopdf
	// For now, return a placeholder
	return []byte("PDF Report Placeholder"), nil
}