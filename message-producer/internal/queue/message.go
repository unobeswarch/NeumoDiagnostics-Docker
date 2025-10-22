package queue

import (
	"time"
)

type NotificationMessage struct {
	UserID       string    `json:"identificacion"`
	PatientEmail string    `json:"patient_email"`
	PatientName  string    `json:"patient_name"`
	Timestamp    time.Time `json:"timestamp"`
	MessageType  string    `json:"message_type"`
}
