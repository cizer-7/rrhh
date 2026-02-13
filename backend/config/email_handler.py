"""
Email Service für Passwort-Reset-Funktionalität
"""

import smtplib
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self, smtp_server="smtp.gmail.com", smtp_port=587, 
                 smtp_user="", smtp_password="", from_email=""):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.smtp_user = smtp_user
        self.smtp_password = smtp_password
        self.from_email = from_email
    
    def generate_reset_token(self):
        """Generiert einen sicheren Reset-Token"""
        return secrets.token_urlsafe(32)
    
    def send_password_reset_email(self, to_email, username, reset_token, frontend_url="http://localhost:3000"):
        """Sendet Passwort-Reset-Email"""
        try:
            # Reset-Link erstellen
            reset_link = f"{frontend_url}/reset-password?token={reset_token}"
            
            # Email erstellen
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = "Passwort zurücksetzen - Gehaltsabrechnungssystem"
            
            # Email-Body (HTML)
            html_body = f"""
            <html>
            <body>
                <h2>Passwort zurücksetzen</h2>
                <p>Hallo {username},</p>
                <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts für das Gehaltsabrechnungssystem gestellt.</p>
                <p>Klicken Sie auf den folgenden Link, um ein neues Passwort festzulegen:</p>
                <p><a href="{reset_link}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Passwort zurücksetzen</a></p>
                <p>oder kopieren Sie diesen Link in Ihren Browser:</p>
                <p><small>{reset_link}</small></p>
                <p>Dieser Link ist 1 Stunde gültig.</p>
                <p>Wenn Sie diese Anfrage nicht gestellt haben, können Sie diese Email ignorieren.</p>
                <hr>
                <p><small>Dies ist eine automatische Email. Bitte antworten Sie nicht auf diese Nachricht.</small></p>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(html_body, 'html'))
            
            # Email senden
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Passwort-Reset-Email gesendet an: {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Fehler beim Senden der Passwort-Reset-Email: {e}")
            return False

# Konfiguration (muss angepasst werden)
email_service = EmailService(
    smtp_server="smtp.gmail.com",
    smtp_port=587,
    smtp_user="ihre-email@gmail.com",  # Muss konfiguriert werden
    smtp_password="ihr-app-passwort",  # Muss konfiguriert werden
    from_email="ihre-email@gmail.com"  # Muss konfiguriert werden
)
