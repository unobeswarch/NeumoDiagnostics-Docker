"""Main FastAPI Application"""
import sys
from pathlib import Path

# Add parent directory to path for direct execution
if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI
from app.config import settings
from app.routes import router as email_router

# Create FastAPI application instance
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="A simple notification backend service with Mailgun SMTP email sending"
)

# Include routers
app.include_router(email_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Notification Backend API",
        "version": settings.app_version,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version
    }


@app.get("/config")
async def get_config():
    """Get current configuration (non-sensitive data only)"""
    return {
        "app_name": settings.app_name,
        "app_version": settings.app_version,
        "debug": settings.debug,
        "smtp_configured": settings.smtp_host is not None,
        "rabbitmq_configured": settings.rabbitmq_url is not None,
        "rabbitmq_queue": settings.rabbitmq_queue_name
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
