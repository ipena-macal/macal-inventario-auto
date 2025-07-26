package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

var jwtSecret = []byte("macal-secret-2025")

type User struct {
	ID          string                 `json:"id"`
	Email       string                 `json:"email"`
	Password    string                 `json:"password,omitempty"`
	Name        string                 `json:"name"`
	Role        string                 `json:"role"`
	Permissions map[string]interface{} `json:"permissions"`
}

type Vehicle struct {
	ID           string `json:"id"`
	LicensePlate string `json:"license_plate"`
	Make         string `json:"make"`
	Model        string `json:"model"`
	Year         int    `json:"year"`
	Color        string `json:"color"`
	Mileage      int    `json:"mileage"`
	Status       string `json:"status"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

var users = []User{
	{
		ID:       "1",
		Email:    "admin@macal.cl",
		Password: "MacalAdmin2024",
		Name:     "Administrador",
		Role:     "admin",
	},
	{
		ID:       "2",
		Email:    "leader@macal.cl",
		Password: "MacalAdmin2024",
		Name:     "Líder López",
		Role:     "leader",
	},
	{
		ID:       "3",
		Email:    "inspector@macal.cl",
		Password: "MacalAdmin2024",
		Name:     "Inspector García",
		Role:     "inspector",
	},
	{
		ID:       "4",
		Email:    "client@bank.cl",
		Password: "MacalAdmin2024",
		Name:     "Banco Santander",
		Role:     "client",
	},
}

var vehicles = []Vehicle{
	{ID: "1", LicensePlate: "GFKL-82", Make: "Toyota", Model: "Corolla", Year: 2022, Color: "Blanco", Mileage: 15000, Status: "completed"},
	{ID: "2", LicensePlate: "HXRT-93", Make: "Nissan", Model: "Versa", Year: 2023, Color: "Negro", Mileage: 8000, Status: "inspecting"},
	{ID: "3", LicensePlate: "JKLM-45", Make: "Chevrolet", Model: "Sail", Year: 2021, Color: "Rojo", Mileage: 22000, Status: "pending"},
	{ID: "4", LicensePlate: "MNOP-67", Make: "Hyundai", Model: "Accent", Year: 2023, Color: "Azul", Mileage: 5000, Status: "pending"},
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "ok",
		"timestamp": time.Now(),
	})
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Find user
	var foundUser *User
	for _, user := range users {
		if user.Email == req.Email && user.Password == req.Password {
			foundUser = &user
			break
		}
	}

	if foundUser == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":    foundUser.ID,
		"email": foundUser.Email,
		"role":  foundUser.Role,
		"exp":   time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	// Set permissions
	permissions := map[string]interface{}{
		"create_vehicles":      foundUser.Role == "admin" || foundUser.Role == "leader",
		"edit_vehicles":        foundUser.Role == "admin" || foundUser.Role == "leader",
		"delete_vehicles":      foundUser.Role == "admin",
		"create_inspections":   foundUser.Role == "admin" || foundUser.Role == "leader" || foundUser.Role == "inspector",
		"view_all_inspections": foundUser.Role == "admin" || foundUser.Role == "leader",
	}

	foundUser.Permissions = permissions
	foundUser.Password = "" // Don't send password

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LoginResponse{
		Token: tokenString,
		User:  *foundUser,
	})
}

func listVehiclesHandler(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	
	var filtered []Vehicle
	if status != "" {
		for _, v := range vehicles {
			if v.Status == status {
				filtered = append(filtered, v)
			}
		}
	} else {
		filtered = vehicles
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(filtered)
}

func getVehicleHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	for _, v := range vehicles {
		if v.ID == id {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(v)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(map[string]string{"error": "Vehicle not found"})
}

func main() {
	r := mux.NewRouter()

	// Routes
	r.HandleFunc("/health", healthHandler).Methods("GET")
	r.HandleFunc("/api/v1/auth/login", loginHandler).Methods("POST")
	r.HandleFunc("/api/v1/vehicles", listVehiclesHandler).Methods("GET")
	r.HandleFunc("/api/v1/vehicles/{id}", getVehicleHandler).Methods("GET")

	// CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})

	handler := c.Handler(r)

	fmt.Println("Simple Go backend running on port 3001")
	fmt.Println("Available users:")
	for _, u := range users {
		fmt.Printf("  - %s / %s (%s)\n", u.Email, u.Password, u.Role)
	}

	log.Fatal(http.ListenAndServe(":3001", handler))
}