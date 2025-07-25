package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/macal/inventory/internal/config"
	"github.com/macal/inventory/internal/handlers"
	"github.com/macal/inventory/internal/middleware"
	"github.com/macal/inventory/internal/repository"
	"github.com/macal/inventory/internal/services"
	"github.com/macal/inventory/pkg/storage"
	"go.uber.org/zap"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()
	sugar := logger.Sugar()

	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := repository.InitDB(cfg.Database)
	if err != nil {
		sugar.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize Redis
	redisClient := repository.InitRedis(cfg.Redis)
	defer redisClient.Close()

	// Initialize storage (MinIO/S3)
	storageService, err := storage.NewMinIOStorage(cfg.Storage)
	if err != nil {
		sugar.Fatalf("Failed to initialize storage: %v", err)
	}

	// Initialize services
	vehicleService := services.NewVehicleService(db, redisClient, storageService)
	inspectionService := services.NewInspectionService(db, redisClient, storageService)
	authService := services.NewAuthService(db, redisClient)

	// Initialize handlers
	handlers := handlers.NewHandlers(vehicleService, inspectionService, authService, sugar)

	// Setup router
	router := setupRouter(cfg, handlers, sugar)

	// Start server
	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		sugar.Infof("Starting server on port %s", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			sugar.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	sugar.Info("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		sugar.Fatalf("Server forced to shutdown: %v", err)
	}

	sugar.Info("Server exited")
}

func setupRouter(cfg *config.Config, h *handlers.Handlers, logger *zap.SugaredLogger) *gin.Engine {
	// Set Gin mode
	if cfg.Server.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Global middleware
	router.Use(gin.Recovery())
	router.Use(middleware.Logger(logger))
	router.Use(middleware.CORS(cfg.CORS))
	router.Use(middleware.RateLimiter())

	// Health check
	router.GET("/health", h.HealthCheck)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Public routes
		public := v1.Group("")
		{
			public.POST("/auth/login", h.Login)
			public.POST("/auth/register", h.Register)
			public.POST("/auth/refresh", h.RefreshToken)
		}

		// Client portal routes (external access)
		clientPortal := v1.Group("/client")
		clientPortal.Use(h.ClientAuth())
		{
			clientPortal.GET("/info", h.GetClientInfo)
			clientPortal.GET("/vehicles", h.GetClientVehicles)
			clientPortal.GET("/vehicles/:id", h.GetClientVehicle)
			clientPortal.GET("/vehicles/:vehicleId/inspections/:inspectionId", h.GetClientVehicleInspection)
			clientPortal.GET("/stats", h.GetClientStats)
			clientPortal.GET("/reports/download", h.DownloadClientReport)
		}

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.Auth(cfg.JWT.Secret))
		{
			// Vehicle routes
			vehicles := protected.Group("/vehicles")
			{
				vehicles.GET("", h.ListVehicles)
				vehicles.POST("", h.CreateVehicle)
				vehicles.GET("/:id", h.GetVehicle)
				vehicles.PUT("/:id", h.UpdateVehicle)
				vehicles.DELETE("/:id", h.DeleteVehicle)
				vehicles.POST("/:id/photos", h.UploadVehiclePhotos)
				vehicles.GET("/:id/photos", h.GetVehiclePhotos)
			}

			// Inspection routes
			inspections := protected.Group("/inspections")
			{
				inspections.GET("", h.ListInspections)
				inspections.POST("", h.CreateInspection)
				inspections.GET("/:id", h.GetInspection)
				inspections.PUT("/:id", h.UpdateInspection)
				inspections.GET("/:id/pdf", h.GenerateInspectionPDF)
				inspections.GET("/:id/ws", h.InspectionWebSocket)
			}

			// Real-time inspection updates
			protected.GET("/ws/inspection/:id", h.InspectionWebSocket)

			// Form template routes
			formTemplates := protected.Group("/form-templates")
			{
				formTemplates.GET("", h.ListFormTemplates)
				formTemplates.POST("", h.CreateFormTemplate)
				formTemplates.GET("/:id", h.GetFormTemplate)
				formTemplates.PUT("/:id", h.UpdateFormTemplate)
				formTemplates.DELETE("/:id", h.DeleteFormTemplate)
				formTemplates.POST("/:id/clone", h.CloneFormTemplate)
				formTemplates.GET("/:id/export", h.ExportFormTemplate)
				formTemplates.POST("/import", h.ImportFormTemplate)
			}

			// Client management routes (admin only)
			clients := protected.Group("/clients")
			clients.Use(middleware.RequireRole("admin"))
			{
				clients.GET("", h.ListClients)
				clients.POST("", h.CreateClient)
				clients.PUT("/:id", h.UpdateClient)
				clients.DELETE("/:id", h.DeleteClient)
				clients.POST("/:id/regenerate-token", h.RegenerateClientToken)
				clients.GET("/:id/access-logs", h.GetClientAccessLogs)
			}
		}
	}

	// Static files for PWA
	router.Static("/static", "./static")
	router.NoRoute(func(c *gin.Context) {
		c.File("./static/index.html")
	})

	return router
}