"""RabbitMQ Message Models - Matching Go Service Schema"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Literal


class NotificationMessage(BaseModel):
    """
    Message model matching the Go service's NotificationMessage struct
    
    Maps to Go struct:
    type NotificationMessage struct {
        UserID       string    `json:"identificacion"`
        PatientEmail string    `json:"patient_email"`
        PatientName  string    `json:"patient_name"`
        Timestamp    time.Time `json:"timestamp"`
        MessageType  string    `json:"message_type"`
    }
    """
    
    identificacion: str = Field(
        ...,
        description="User/Doctor ID who triggered the notification",
        min_length=1
    )
    
    patient_email: EmailStr = Field(
        ...,
        description="Patient email address (recipient)"
    )
    
    patient_name: str = Field(
        ...,
        description="Patient full name for email personalization",
        min_length=1
    )
    
    timestamp: datetime = Field(
        ...,
        description="Timestamp when the notification was created (ISO 8601)"
    )
    
    message_type: str = Field(
        ...,
        description="Type of notification (determines email template)",
        min_length=1
    )
    
    # Retry tracking (internal use, not from Go service)
    _retry_count: int = 0
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "identificacion": "DOC12345",
                    "patient_email": "john.doe@example.com",
                    "patient_name": "John Doe",
                    "timestamp": "2025-10-19T14:30:00Z",
                    "message_type": "diagnostic_result"
                }
            ]
        }
    }
    
    def get_template_name(self) -> str:
        """Map message_type to email template name"""
        # Map message types to template identifiers
        template_map = {
            "diagnostic_result": "diagnostic_result",
            "appointment_reminder": "appointment_reminder",
            "lab_report": "lab_report",
            "test_notification": "test_notification",
        }
        return template_map.get(self.message_type, "default")


class MessageTypeEnum(str):
    """Known message types (can be extended)"""
    DIAGNOSTIC_RESULT = "diagnostic_result"
    APPOINTMENT_REMINDER = "appointment_reminder"
    LAB_REPORT = "lab_report"
    TEST_NOTIFICATION = "test_notification"

