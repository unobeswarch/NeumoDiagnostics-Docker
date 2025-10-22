"""Worker Service - Runs RabbitMQ Consumer"""
import asyncio
import logging
import signal
import sys
from pathlib import Path

# Add parent directory to path for direct execution
if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).parent.parent))

from app.rabbitmq_consumer import consumer
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Worker:
    """Worker service to run the RabbitMQ consumer"""
    
    def __init__(self):
        """Initialize the worker"""
        self.is_shutting_down = False
    
    def handle_shutdown(self, signum, frame):
        """Handle shutdown signals gracefully"""
        if not self.is_shutting_down:
            self.is_shutting_down = True
            logger.info(f"Received signal {signum}. Initiating graceful shutdown...")
            
            # Stop the consumer
            asyncio.create_task(consumer.disconnect())
    
    async def run(self):
        """Run the worker"""
        logger.info("=" * 60)
        logger.info(f"Starting {settings.app_name} Worker")
        logger.info(f"Version: {settings.app_version}")
        logger.info("=" * 60)
        logger.info(f"RabbitMQ URL: {settings.rabbitmq_url}")
        logger.info(f"Queue: {settings.rabbitmq_queue_name}")
        logger.info(f"Dead Letter Queue: {settings.rabbitmq_dlq_name}")
        logger.info(f"Prefetch Count: {settings.rabbitmq_prefetch_count}")
        logger.info(f"Max Retries: {settings.rabbitmq_max_retries}")
        logger.info(f"Email From: {settings.email_from_name} <{settings.email_from}>")
        logger.info("=" * 60)
        
        try:
            # Run the consumer
            await consumer.run()
            
        except KeyboardInterrupt:
            logger.info("Worker interrupted by user")
        except Exception as e:
            logger.error(f"Worker error: {str(e)}", exc_info=True)
            raise
        finally:
            logger.info("Worker stopped")
            
            # Print final stats
            stats = consumer.get_stats()
            logger.info("=" * 60)
            logger.info("Final Statistics:")
            logger.info(f"  Messages Processed: {stats['messages_processed']}")
            logger.info(f"  Messages Success: {stats['messages_success']}")
            logger.info(f"  Messages Failed: {stats['messages_failed']}")
            logger.info(f"  Success Rate: {stats['success_rate']:.2f}%")
            logger.info("=" * 60)


async def main():
    """Main entry point"""
    worker = Worker()
    
    # Setup signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, worker.handle_shutdown)
    signal.signal(signal.SIGTERM, worker.handle_shutdown)
    
    # Run the worker
    await worker.run()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}", exc_info=True)
        sys.exit(1)

