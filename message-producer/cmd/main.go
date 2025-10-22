package main

import (
	"encoding/json"
	"log"
	"message-queue/internal/queue"
	"net/http"
	"os"
	"time"
)

type Server struct {
	rabbitClient *queue.RabbitMQClient
}

func (s *Server) handleNotification(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var msg queue.NotificationMessage
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		log.Printf("Error decoding message: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if msg.Timestamp.IsZero() {
		msg.Timestamp = time.Now()
	}

	// Publicar en la cola
	if err := s.rabbitClient.PublishNotification(msg); err != nil {
		log.Printf("Error publishing message: %v", err)
		http.Error(w, "Failed to queue message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "queued"})
}

func main() {
	// Configuración desde variables de entorno
	amqpURL := getEnv("RABBITMQ_URL", "amqp://guest:guest@message-broker:5672/")
	queueName := getEnv("QUEUE_NAME", "diagnostic_notifications")
	port := getEnv("PORT", "8082")

	// Conectar a RabbitMQ
	rabbitClient, err := queue.NewRabbitMQClient(amqpURL, queueName)
	if err != nil {
		log.Fatalf("Failed to create RabbitMQ client: %v", err)
	}
	defer rabbitClient.Close()

	server := &Server{rabbitClient: rabbitClient}

	http.HandleFunc("/notifications", server.handleNotification)
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	log.Printf("Messaging queue server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
