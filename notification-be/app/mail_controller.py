"""Email Controller Module - Handles email sending via Mailgun SMTP"""
import logging
from typing import Optional, List
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
from app.config import settings

# Configure logging
logger = logging.getLogger(__name__)


class EmailError(Exception):
    """Custom exception for email-related errors"""
    pass


class MailController:
    """Handles email sending operations using Mailgun SMTP"""
    
    def __init__(self):
        """Initialize the mail controller with SMTP settings"""
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_username = settings.smtp_username
        self.smtp_password = settings.smtp_password
        self.smtp_use_tls = settings.smtp_use_tls
        self.email_from = settings.email_from
        self.email_from_name = settings.email_from_name
        
        # Validate configuration
        if not all([self.smtp_host, self.smtp_username, self.smtp_password]):
            logger.warning("SMTP configuration is incomplete. Email sending will fail.")
    
    def _create_message(
        self,
        to_email: str,
        subject: str,
        body_text: Optional[str] = None,
        body_html: Optional[str] = None
    ) -> MIMEMultipart:
        """
        Create a MIME multipart message
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body_text: Plain text body (optional)
            body_html: HTML body (optional)
            
        Returns:
            MIMEMultipart message object
        """
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f'"{self.email_from_name}" <{self.email_from}>'
        message["To"] = to_email
        
        # Add text and/or HTML parts
        if body_text:
            part_text = MIMEText(body_text, "plain")
            message.attach(part_text)
        
        if body_html:
            part_html = MIMEText(body_html, "html")
            message.attach(part_html)
        
        return message
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        body_text: Optional[str] = None,
        body_html: Optional[str] = None
    ) -> dict:
        """
        Send an email via Mailgun SMTP
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body_text: Plain text body (optional)
            body_html: HTML body (optional)
            
        Returns:
            dict: Status information about the email sending operation
            
        Raises:
            EmailError: If email sending fails
        """
        # Validate inputs
        if not to_email:
            raise EmailError("Recipient email address is required")
        
        if not subject:
            raise EmailError("Email subject is required")
        
        if not body_text and not body_html:
            raise EmailError("Either body_text or body_html must be provided")
        
        # Check SMTP configuration
        if not all([self.smtp_host, self.smtp_username, self.smtp_password]):
            raise EmailError("SMTP configuration is incomplete")
        
        try:
            # Create message
            message = self._create_message(to_email, subject, body_text, body_html)
            
            # Send email via SMTP
            logger.info(f"Sending email to {to_email} via Mailgun SMTP")
            
            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_username,
                password=self.smtp_password,
                start_tls=self.smtp_use_tls,
            )
            
            logger.info(f"Email sent successfully to {to_email}")
            
            return {
                "success": True,
                "message": f"Email sent successfully to {to_email}",
                "recipient": to_email,
                "subject": subject
            }
            
        except aiosmtplib.SMTPException as e:
            error_msg = f"SMTP error while sending email: {str(e)}"
            logger.error(error_msg)
            raise EmailError(error_msg)
        
        except Exception as e:
            error_msg = f"Unexpected error while sending email: {str(e)}"
            logger.error(error_msg)
            raise EmailError(error_msg)
    
    async def send_bulk_email(
        self,
        to_emails: List[str],
        subject: str,
        body_text: Optional[str] = None,
        body_html: Optional[str] = None
    ) -> dict:
        """
        Send the same email to multiple recipients
        
        Args:
            to_emails: List of recipient email addresses
            subject: Email subject
            body_text: Plain text body (optional)
            body_html: HTML body (optional)
            
        Returns:
            dict: Status information about the bulk email sending operation
        """
        if not to_emails:
            raise EmailError("At least one recipient email address is required")
        
        results = {
            "success": [],
            "failed": [],
            "total": len(to_emails)
        }
        
        for email in to_emails:
            try:
                await self.send_email(email, subject, body_text, body_html)
                results["success"].append(email)
            except EmailError as e:
                logger.error(f"Failed to send email to {email}: {str(e)}")
                results["failed"].append({"email": email, "error": str(e)})
        
        return {
            "success": len(results["failed"]) == 0,
            "message": f"Sent {len(results['success'])} out of {results['total']} emails",
            "results": results
        }


# Create a global mail controller instance
mail_controller = MailController()

