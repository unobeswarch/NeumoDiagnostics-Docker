"""Application Configuration Module"""
from pydantic import ConfigDict
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings and configuration"""
    
    # Application settings
    app_name: str = "Notification Backend"
    app_version: str = "0.1.0"
    debug: bool = False
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8003
    
    # SMTP settings (Mailgun configuration)
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = True
    
    # Email settings
    email_from: str = "notification@neudiagnostics.dadames.tech"
    email_from_name: str = "neudiagnostics"
    
    # RabbitMQ settings
    rabbitmq_url: str = "amqp://guest:guest@message-broker:5672/"
    rabbitmq_queue_name: str = "diagnostic_notifications"
    rabbitmq_prefetch_count: int = 10
    rabbitmq_max_retries: int = 3
    rabbitmq_dlq_name: str = "diagnostic_notifications_dlq"
    
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=False
    )


# Create a global settings instance
settings = Settings()
