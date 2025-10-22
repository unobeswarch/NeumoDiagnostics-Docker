"""API Routes for Email Sending"""
from fastapi import APIRouter, HTTPException, status
from app.models import EmailRequest, BulkEmailRequest, EmailResponse, BulkEmailResponse
from app.mail_controller import mail_controller, EmailError
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/email", tags=["Email"])


@router.post("/send", response_model=EmailResponse, status_code=status.HTTP_200_OK)
async def send_email(email_request: EmailRequest):
    """
    Send a single email via Mailgun SMTP
    
    - **to_email**: Recipient email address
    - **subject**: Email subject line
    - **body_text**: Plain text version of the email (optional)
    - **body_html**: HTML version of the email (optional)
    
    Note: At least one of body_text or body_html must be provided
    """
    try:
        result = await mail_controller.send_email(
            to_email=email_request.to_email,
            subject=email_request.subject,
            body_text=email_request.body_text,
            body_html=email_request.body_html
        )
        return EmailResponse(**result)
    
    except EmailError as e:
        logger.error(f"Email sending failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending the email"
        )


@router.post("/send-bulk", response_model=BulkEmailResponse, status_code=status.HTTP_200_OK)
async def send_bulk_email(bulk_request: BulkEmailRequest):
    """
    Send the same email to multiple recipients
    
    - **to_emails**: List of recipient email addresses
    - **subject**: Email subject line
    - **body_text**: Plain text version of the email (optional)
    - **body_html**: HTML version of the email (optional)
    
    Note: At least one of body_text or body_html must be provided
    """
    try:
        result = await mail_controller.send_bulk_email(
            to_emails=bulk_request.to_emails,
            subject=bulk_request.subject,
            body_text=bulk_request.body_text,
            body_html=bulk_request.body_html
        )
        return BulkEmailResponse(**result)
    
    except EmailError as e:
        logger.error(f"Bulk email sending failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending bulk emails"
        )


@router.get("/test", status_code=status.HTTP_200_OK)
async def test_smtp_connection():
    """
    Test SMTP configuration (without sending an email)
    
    Returns the current SMTP configuration status
    """
    return {
        "smtp_configured": all([
            mail_controller.smtp_host,
            mail_controller.smtp_username,
            mail_controller.smtp_password
        ]),
        "smtp_host": mail_controller.smtp_host,
        "smtp_port": mail_controller.smtp_port,
        "email_from": mail_controller.email_from,
        "email_from_name": mail_controller.email_from_name
    }


@router.get("/rabbitmq/stats", status_code=status.HTTP_200_OK)
async def get_rabbitmq_stats():
    """
    Get RabbitMQ consumer statistics
    
    Returns statistics about message processing
    """
    try:
        from app.rabbitmq_consumer import consumer
        stats = consumer.get_stats()
        return {
            "status": "ok",
            "consumer": stats
        }
    except Exception as e:
        logger.error(f"Failed to get RabbitMQ stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve RabbitMQ statistics"
        )

