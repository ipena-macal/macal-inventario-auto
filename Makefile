.PHONY: help dev build test deploy clean

# Default target
help:
	@echo "MACAL Inventory System - Development Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  dev        - Start development environment with Docker Compose"
	@echo "  build      - Build production Docker images"
	@echo "  test       - Run all tests"
	@echo "  deploy     - Deploy to production"
	@echo "  clean      - Clean up containers and volumes"
	@echo "  setup      - Initial project setup"
	@echo "  migrate    - Run database migrations"
	@echo "  seed       - Seed database with test data"
	@echo "  logs       - Show logs from all services"
	@echo "  backend    - Start only backend services"
	@echo "  frontend   - Start only frontend service"

# Development
dev:
	docker-compose up -d
	@echo "Development environment is running!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:8080"
	@echo "MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"

# Build production images
build:
	docker-compose build --no-cache

# Run tests
test:
	cd backend && go test ./...
	cd frontend && npm test

# Deploy to production
deploy:
	@echo "Building production images..."
	docker build -t macal-inventory-backend:latest ./backend
	docker build -t macal-inventory-frontend:latest -f ./frontend/Dockerfile.prod ./frontend
	@echo "Deployment process would continue here..."

# Clean up
clean:
	docker-compose down -v
	rm -rf backend/tmp
	rm -rf frontend/node_modules
	rm -rf frontend/dist

# Initial setup
setup:
	@echo "Setting up MACAL Inventory System..."
	cp .env.example .env
	cd backend && go mod download
	cd frontend && npm install
	docker-compose up -d postgres redis minio
	sleep 5
	make migrate
	make seed
	@echo "Setup complete! Run 'make dev' to start development."

# Database migrations
migrate:
	docker-compose exec backend go run cmd/migrate/main.go up

# Seed database
seed:
	docker-compose exec backend go run cmd/seed/main.go

# Show logs
logs:
	docker-compose logs -f

# Backend only
backend:
	docker-compose up -d postgres redis minio backend

# Frontend only
frontend:
	docker-compose up -d frontend

# Database console
db-console:
	docker-compose exec postgres psql -U postgres -d macal_inventory

# Redis console
redis-console:
	docker-compose exec redis redis-cli

# Generate PDF report test
test-pdf:
	curl -X GET http://localhost:8080/api/v1/inspections/test-id/pdf -o test-report.pdf