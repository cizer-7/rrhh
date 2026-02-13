"""
Email-Konfiguration für Passwort-Reset-Funktionalität
"""

import os
from email_service import EmailService

# Email-Konfiguration - kann über Umgebungsvariablen konfiguriert werden
EMAIL_CONFIG = {
    'smtp_server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
    'smtp_port': int(os.getenv('SMTP_PORT', '587')),
    'smtp_user': os.getenv('SMTP_USER', 'ihre-email@gmail.com'),
    'smtp_password': os.getenv('SMTP_PASSWORD', 'ihr-app-passwort'),
    'from_email': os.getenv('FROM_EMAIL', 'ihre-email@gmail.com'),
    'frontend_url': os.getenv('FRONTEND_URL', 'http://localhost:3000')
}

# Email-Service mit Konfiguration initialisieren
email_service = EmailService(
    smtp_server=EMAIL_CONFIG['smtp_server'],
    smtp_port=EMAIL_CONFIG['smtp_port'],
    smtp_user=EMAIL_CONFIG['smtp_user'],
    smtp_password=EMAIL_CONFIG['smtp_password'],
    from_email=EMAIL_CONFIG['from_email']
)

# Für Entwicklung: Konfiguration ausgeben
if __name__ == '__main__':
    print("Email-Konfiguration:")
    for key, value in EMAIL_CONFIG.items():
        if 'password' in key.lower():
            print(f"{key}: {'*' * len(str(value))}")
        else:
            print(f"{key}: {value}")
