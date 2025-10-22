"""Pydantic Models for API Request/Response"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List


class EmailRequest(BaseModel):
    """Model for single email request"""
    to_email: EmailStr = Field(..., description="Recipient email address")
    subject: str = Field(..., min_length=1, max_length=500, description="Email subject")
    body_text: Optional[str] = Field(None, description="Plain text email body")
    body_html: Optional[str] = Field(None, description="HTML email body")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "to_email": "user@example.com",
                    "subject": "Welcome to our service",
                    "body_text": "Hello! Welcome to our service.",
                    "body_html": "<h1>Hello!</h1><p>Welcome to our service.</p>"
                }
            ]
        }
    }


class BulkEmailRequest(BaseModel):
    """Model for bulk email request"""
    to_emails: List[EmailStr] = Field(..., min_length=1, description="List of recipient email addresses")
    subject: str = Field(..., min_length=1, max_length=500, description="Email subject")
    body_text: Optional[str] = Field(None, description="Plain text email body")
    body_html: Optional[str] = Field(None, description="HTML email body")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "to_emails": ["user1@example.com", "user2@example.com"],
                    "subject": "Newsletter Update",
                    "body_text": "Check out our latest updates!",
                    "body_html": "<h1>Latest Updates</h1><p>Check out our latest updates!</p>"
                }
            ]
        }
    }


class EmailResponse(BaseModel):
    """Model for email sending response"""
    success: bool = Field(..., description="Whether the operation was successful")
    message: str = Field(..., description="Status message")
    recipient: Optional[str] = Field(None, description="Recipient email address")
    subject: Optional[str] = Field(None, description="Email subject")


class BulkEmailResponse(BaseModel):
    """Model for bulk email sending response"""
    success: bool = Field(..., description="Whether all emails were sent successfully")
    message: str = Field(..., description="Status message")
    results: dict = Field(..., description="Detailed results of the bulk operation")

