"""Email Templates for Different Message Types"""
from typing import Dict, Tuple
from app.rabbitmq_models import NotificationMessage


class EmailTemplateService:
    """Service to generate email subject and body based on message type"""
    
    def get_email_content(self, message: NotificationMessage) -> Tuple[str, str, str]:
        """
        Generate email subject, body_text, and body_html for a notification message
        
        Args:
            message: NotificationMessage from RabbitMQ
            
        Returns:
            Tuple of (subject, body_text, body_html)
        """
        template_method = getattr(
            self,
            f"_template_{message.message_type}",
            self._template_default
        )
        return template_method(message)
    
    def _template_diagnostic_result(self, message: NotificationMessage) -> Tuple[str, str, str]:
        """Template for diagnostic results notification"""
        subject = "Sus Resultados de Diagnóstico están Disponibles"
        
        body_text = f"""
Estimado/a {message.patient_name},

Sus resultados de diagnóstico ya están disponibles.

Por favor, ingrese a su portal de paciente para revisar los resultados o comuníquese con su médico tratante.

ID de Referencia: {message.identificacion}
Fecha: {message.timestamp.strftime('%d/%m/%Y %H:%M')}

Atentamente,
Equipo de neudiagnostics
        """.strip()
        
        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c5aa0;">Sus Resultados de Diagnóstico están Disponibles</h2>
                
                <p>Estimado/a <strong>{message.patient_name}</strong>,</p>
                
                <p>Sus resultados de diagnóstico ya están disponibles.</p>
                
                <p>Por favor, ingrese a su portal de paciente para revisar los resultados o comuníquese con su médico tratante.</p>
                
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>ID de Referencia:</strong> {message.identificacion}</p>
                    <p style="margin: 5px 0;"><strong>Fecha:</strong> {message.timestamp.strftime('%d/%m/%Y %H:%M')}</p>
                </div>
                
                <p style="margin-top: 30px;">Atentamente,<br>
                <strong>Equipo de neudiagnostics</strong></p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="font-size: 12px; color: #666;">
                    Este es un correo automático, por favor no responder directamente a este mensaje.
                </p>
            </div>
        </body>
        </html>
        """.strip()
        
        return subject, body_text, body_html
    
    def _template_appointment_reminder(self, message: NotificationMessage) -> Tuple[str, str, str]:
        """Template for appointment reminder"""
        subject = "Recordatorio de Cita Médica"
        
        body_text = f"""
Estimado/a {message.patient_name},

Este es un recordatorio de su próxima cita médica.

Por favor, confirme su asistencia o comuníquese con nosotros si necesita reprogramar.

ID de Referencia: {message.identificacion}
Fecha: {message.timestamp.strftime('%d/%m/%Y %H:%M')}

Atentamente,
Equipo de neudiagnostics
        """.strip()
        
        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c5aa0;">Recordatorio de Cita Médica</h2>
                
                <p>Estimado/a <strong>{message.patient_name}</strong>,</p>
                
                <p>Este es un recordatorio de su próxima cita médica.</p>
                
                <p>Por favor, confirme su asistencia o comuníquese con nosotros si necesita reprogramar.</p>
                
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>ID de Referencia:</strong> {message.identificacion}</p>
                    <p style="margin: 5px 0;"><strong>Fecha:</strong> {message.timestamp.strftime('%d/%m/%Y %H:%M')}</p>
                </div>
                
                <p style="margin-top: 30px;">Atentamente,<br>
                <strong>Equipo de neudiagnostics</strong></p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="font-size: 12px; color: #666;">
                    Este es un correo automático, por favor no responder directamente a este mensaje.
                </p>
            </div>
        </body>
        </html>
        """.strip()
        
        return subject, body_text, body_html
    
    def _template_lab_report(self, message: NotificationMessage) -> Tuple[str, str, str]:
        """Template for lab report notification"""
        subject = "Su Reporte de Laboratorio está Listo"
        
        body_text = f"""
Estimado/a {message.patient_name},

Su reporte de laboratorio ha sido procesado y está disponible.

Puede acceder a su reporte a través del portal de paciente o solicitarlo en recepción.

ID de Referencia: {message.identificacion}
Fecha: {message.timestamp.strftime('%d/%m/%Y %H:%M')}

Atentamente,
Equipo de neudiagnostics
        """.strip()
        
        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c5aa0;">Su Reporte de Laboratorio está Listo</h2>
                
                <p>Estimado/a <strong>{message.patient_name}</strong>,</p>
                
                <p>Su reporte de laboratorio ha sido procesado y está disponible.</p>
                
                <p>Puede acceder a su reporte a través del portal de paciente o solicitarlo en recepción.</p>
                
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>ID de Referencia:</strong> {message.identificacion}</p>
                    <p style="margin: 5px 0;"><strong>Fecha:</strong> {message.timestamp.strftime('%d/%m/%Y %H:%M')}</p>
                </div>
                
                <p style="margin-top: 30px;">Atentamente,<br>
                <strong>Equipo de neudiagnostics</strong></p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="font-size: 12px; color: #666;">
                    Este es un correo automático, por favor no responder directamente a este mensaje.
                </p>
            </div>
        </body>
        </html>
        """.strip()
        
        return subject, body_text, body_html
    
    def _template_test_notification(self, message: NotificationMessage) -> Tuple[str, str, str]:
        """Template for test notifications"""
        subject = "Test Notification - neudiagnostics"
        
        body_text = f"""
Hello {message.patient_name},

This is a test notification from the neudiagnostics system.

Reference ID: {message.identificacion}
Timestamp: {message.timestamp.strftime('%Y-%m-%d %H:%M:%S')}

Best regards,
neudiagnostics Team
        """.strip()
        
        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c5aa0;">Test Notification</h2>
                
                <p>Hello <strong>{message.patient_name}</strong>,</p>
                
                <p>This is a test notification from the neudiagnostics system.</p>
                
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Reference ID:</strong> {message.identificacion}</p>
                    <p style="margin: 5px 0;"><strong>Timestamp:</strong> {message.timestamp.strftime('%Y-%m-%d %H:%M:%S')}</p>
                </div>
                
                <p style="margin-top: 30px;">Best regards,<br>
                <strong>neudiagnostics Team</strong></p>
            </div>
        </body>
        </html>
        """.strip()
        
        return subject, body_text, body_html
    
    def _template_default(self, message: NotificationMessage) -> Tuple[str, str, str]:
        """Default template for unknown message types"""
        subject = f"Notificación de neudiagnostics - {message.message_type}"
        
        body_text = f"""
Estimado/a {message.patient_name},

Tiene una nueva notificación del sistema neudiagnostics.

Tipo: {message.message_type}
ID de Referencia: {message.identificacion}
Fecha: {message.timestamp.strftime('%d/%m/%Y %H:%M')}

Para más información, por favor contacte a su proveedor de atención médica.

Atentamente,
Equipo de neudiagnostics
        """.strip()
        
        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c5aa0;">Notificación de neudiagnostics</h2>
                
                <p>Estimado/a <strong>{message.patient_name}</strong>,</p>
                
                <p>Tiene una nueva notificación del sistema neudiagnostics.</p>
                
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Tipo:</strong> {message.message_type}</p>
                    <p style="margin: 5px 0;"><strong>ID de Referencia:</strong> {message.identificacion}</p>
                    <p style="margin: 5px 0;"><strong>Fecha:</strong> {message.timestamp.strftime('%d/%m/%Y %H:%M')}</p>
                </div>
                
                <p>Para más información, por favor contacte a su proveedor de atención médica.</p>
                
                <p style="margin-top: 30px;">Atentamente,<br>
                <strong>Equipo de neudiagnostics</strong></p>
            </div>
        </body>
        </html>
        """.strip()
        
        return subject, body_text, body_html


# Create global instance
email_template_service = EmailTemplateService()

