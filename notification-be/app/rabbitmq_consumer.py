"""RabbitMQ Consumer Service for Email Notifications"""
import asyncio
import json
import logging
from typing import Optional
from datetime import datetime

import aio_pika
from aio_pika import connect_robust, Message, IncomingMessage, ExchangeType
from aio_pika.abc import AbstractRobustConnection, AbstractChannel, AbstractQueue
from pydantic import ValidationError

from app.config import settings
from app.rabbitmq_models import NotificationMessage
from app.email_templates import email_template_service
from app.mail_controller import mail_controller, EmailError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class RabbitMQConsumer:
    """RabbitMQ Consumer for processing email notification messages"""
    
    def __init__(self):
        """Initialize the RabbitMQ consumer"""
        self.connection: Optional[AbstractRobustConnection] = None
        self.channel: Optional[AbstractChannel] = None
        self.queue: Optional[AbstractQueue] = None
        self.dlq: Optional[AbstractQueue] = None
        self.is_running = False
        
        # Configuration
        self.rabbitmq_url = settings.rabbitmq_url
        self.queue_name = settings.rabbitmq_queue_name
        self.dlq_name = settings.rabbitmq_dlq_name
        self.prefetch_count = settings.rabbitmq_prefetch_count
        self.max_retries = settings.rabbitmq_max_retries
        
        # Metrics
        self.messages_processed = 0
        self.messages_success = 0
        self.messages_failed = 0
    
    async def connect(self) -> None:
        """Establish connection to RabbitMQ"""
        try:
            logger.info(f"Connecting to RabbitMQ at {self.rabbitmq_url}")
            
            # Create robust connection (auto-reconnect)
            self.connection = await connect_robust(self.rabbitmq_url)
            
            # Create channel
            self.channel = await self.connection.channel()
            
            # Set QoS (prefetch count)
            await self.channel.set_qos(prefetch_count=self.prefetch_count)
            
            # Declare Dead Letter Queue
            self.dlq = await self.channel.declare_queue(
                self.dlq_name,
                durable=True,
                arguments={}
            )
            
            # Declare main queue with DLQ
            self.queue = await self.channel.declare_queue(
                self.queue_name,
                durable=True,
                arguments={
                    'x-dead-letter-exchange': '',  # Default exchange
                    'x-dead-letter-routing-key': self.dlq_name
                }
            )
            
            logger.info(f"Connected to RabbitMQ. Queue: {self.queue_name}, DLQ: {self.dlq_name}")
            self.is_running = True
            
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {str(e)}")
            raise
    
    async def disconnect(self) -> None:
        """Close RabbitMQ connection"""
        self.is_running = False
        
        if self.connection:
            await self.connection.close()
            logger.info("Disconnected from RabbitMQ")
    
    async def process_message(self, message: IncomingMessage) -> None:
        """
        Process a single message from the queue
        
        Args:
            message: Incoming RabbitMQ message
        """
        start_time = datetime.now()
        
        try:
            # Parse message body
            body = message.body.decode('utf-8')
            logger.info(f"Received message: {body}")
            
            # Parse JSON
            data = json.loads(body)
            
            # Validate with Pydantic model
            notification = NotificationMessage(**data)
            
            # Get retry count from message headers
            retry_count = 0
            if message.headers and 'x-retry-count' in message.headers:
                retry_count = int(message.headers['x-retry-count'])
            
            logger.info(
                f"Processing notification: "
                f"type={notification.message_type}, "
                f"to={notification.patient_email}, "
                f"retry={retry_count}"
            )
            
            # Generate email content from template
            subject, body_text, body_html = email_template_service.get_email_content(notification)
            
            # Send email via Mailgun
            result = await mail_controller.send_email(
                to_email=notification.patient_email,
                subject=subject,
                body_text=body_text,
                body_html=body_html
            )
            
            # Success - ACK the message
            await message.ack()
            
            self.messages_processed += 1
            self.messages_success += 1
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            logger.info(
                f"✅ Email sent successfully: "
                f"to={notification.patient_email}, "
                f"type={notification.message_type}, "
                f"id={notification.identificacion}, "
                f"time={processing_time:.0f}ms"
            )
            
        except ValidationError as e:
            # Validation error - reject without requeue (bad message format)
            logger.error(f"❌ Message validation failed: {str(e)}")
            await message.reject(requeue=False)
            self.messages_processed += 1
            self.messages_failed += 1
            
        except EmailError as e:
            # Email sending failed - handle retry logic
            await self._handle_email_error(message, e, retry_count)
            
        except json.JSONDecodeError as e:
            # Invalid JSON - reject without requeue
            logger.error(f"❌ Invalid JSON in message: {str(e)}")
            await message.reject(requeue=False)
            self.messages_processed += 1
            self.messages_failed += 1
            
        except Exception as e:
            # Unexpected error - handle retry logic
            logger.error(f"❌ Unexpected error processing message: {str(e)}")
            await self._handle_email_error(message, e, retry_count)
    
    async def _handle_email_error(
        self,
        message: IncomingMessage,
        error: Exception,
        retry_count: int
    ) -> None:
        """
        Handle email sending errors with retry logic
        
        Args:
            message: The failed message
            error: The exception that occurred
            retry_count: Current retry count
        """
        self.messages_processed += 1
        
        if retry_count < self.max_retries:
            # Retry - NACK and requeue
            logger.warning(
                f"⚠️ Email sending failed (retry {retry_count + 1}/{self.max_retries}): {str(error)}"
            )
            
            # Increment retry count in headers
            new_headers = message.headers or {}
            new_headers['x-retry-count'] = retry_count + 1
            
            # NACK with requeue
            await message.nack(requeue=True)
            
        else:
            # Max retries exceeded - send to DLQ
            logger.error(
                f"❌ Max retries exceeded. Sending to DLQ: {str(error)}"
            )
            
            # Reject without requeue (will go to DLQ due to x-dead-letter-* settings)
            await message.reject(requeue=False)
            self.messages_failed += 1
    
    async def start_consuming(self) -> None:
        """Start consuming messages from the queue"""
        if not self.queue:
            raise RuntimeError("Not connected to RabbitMQ. Call connect() first.")
        
        logger.info(f"Starting to consume messages from {self.queue_name}")
        
        # Start consuming
        await self.queue.consume(self.process_message)
        
        logger.info(f"Consumer started. Waiting for messages...")
    
    async def run(self) -> None:
        """Main run loop - connect and start consuming"""
        try:
            await self.connect()
            await self.start_consuming()
            
            # Keep running until interrupted
            while self.is_running:
                await asyncio.sleep(1)
                
        except KeyboardInterrupt:
            logger.info("Received interrupt signal. Shutting down...")
        except Exception as e:
            logger.error(f"Consumer error: {str(e)}")
            raise
        finally:
            await self.disconnect()
    
    def get_stats(self) -> dict:
        """Get consumer statistics"""
        return {
            "is_running": self.is_running,
            "messages_processed": self.messages_processed,
            "messages_success": self.messages_success,
            "messages_failed": self.messages_failed,
            "success_rate": (
                self.messages_success / self.messages_processed * 100
                if self.messages_processed > 0
                else 0
            )
        }


# Create global consumer instance
consumer = RabbitMQConsumer()

