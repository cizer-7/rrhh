# Passwort-Reset-Funktionalität

Diese Dokumentation beschreibt die implementierte Passwort-Reset-Funktionalität für das Gehaltsabrechnungssystem.

## Übersicht

Die Passwort-Reset-Funktionalität ermöglicht es Benutzern, ihr vergessenes Passwort über eine sichere Email-basierte Prozedur zurückzusetzen.

## Funktionsweise

1. **Passwort-Reset-Anfrage**: Benutzer klicken auf "Passwort vergessen?" im Login-Fenster
2. **Token-Generierung**: System generiert einen sicheren Token und sendet eine Email mit Reset-Link
3. **Passwort-Reset**: Benutzer klicken auf den Link und setzen ein neues Passwort
4. **Validierung**: Token wird validiert und Passwort wird in der Datenbank aktualisiert

## Datenbank-Schema

### t009_password_reset_tokens Tabelle

```sql
CREATE TABLE IF NOT EXISTS t009_password_reset_tokens (
    id_token INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL,
    token VARCHAR(256) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nombre_usuario) REFERENCES t005_benutzer(nombre_usuario) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_usuario (nombre_usuario),
    INDEX idx_expires (expires_at)
);
```

## API-Endpunkte

### POST /auth/forgot-password
Sendet eine Passwort-Reset-Email.

**Request Body:**
```json
{
  "username": "benutzername"
}
```

**Response:**
```json
{
  "message": "Wenn der Benutzer existiert, wurde eine Reset-Email gesendet"
}
```

### POST /auth/reset-password
Setzt ein neues Passwort mit einem Token.

**Request Body:**
```json
{
  "token": "reset-token-hier",
  "new_password": "neues-passwort"
}
```

**Response:**
```json
{
  "message": "Passwort erfolgreich aktualisiert"
}
```

### POST /auth/validate-reset-token
Validiert einen Reset-Token.

**Request Body:**
```json
{
  "token": "reset-token-hier"
}
```

**Response:**
```json
{
  "valid": true,
  "username": "benutzername"
}
```

## Email-Konfiguration

Die Email-Funktion muss konfiguriert werden. Erstellen Sie eine `.env` Datei im Backend-Verzeichnis:

```bash
# Email-Konfiguration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ihre-email@gmail.com
SMTP_PASSWORD=ihr-app-passwort
FROM_EMAIL=ihre-email@gmail.com
FRONTEND_URL=http://localhost:3000
```

### Gmail-Konfiguration

Für Gmail müssen Sie:
1. Ein "App Passwort" erstellen (nicht Ihr normales Passwort)
2. 2-Faktor-Authentifizierung aktivieren
3. Das App Passwort in der Konfiguration verwenden

**Schritte für Gmail App Passwort:**
1. Gehen Sie zu Google Account Settings
2. Aktivieren Sie 2-Faktor-Authentifizierung
3. Gehen Sie zu "App Passwörter"
4. Erstellen Sie ein neues App Passwort
5. Verwenden Sie dieses Passwort in der Konfiguration

## Installation

### 1. Datenbank-Schema aktualisieren

Führen Sie die neue SQL-Datei aus:

```bash
mysql -u root -p nomina < backend/sql_statements/04_password_reset_schema.sql
```

### 2. Backend-Abhängigkeiten installieren

```bash
cd backend
pip install -r requirements.txt
```

### 3. Email-Konfiguration einrichten

Erstellen Sie die `.env` Datei wie oben beschrieben.

### 4. Backend starten

```bash
python flask_api_server.py
```

### 5. Frontend starten

```bash
cd frontend
npm install
npm run dev
```

## Sicherheit

- Tokens sind 1 Stunde gültig
- Tokens werden nach Verwendung invalidiert
- Es wird nicht verraten, ob ein Benutzer existiert (Security through obscurity)
- Passwörter werden mit SHA-256 gehasht
- Tokens sind kryptographisch sicher (secrets.token_urlsafe)

## Frontend-Komponenten

### Login.tsx
- Enthält "Passwort vergessen?" Button
- Ruft forgotPassword API auf

### ResetPassword.tsx
- Zeigt das Passwort-Reset-Formular
- Validiert den Token aus der URL
- Ermöglicht die Passwort-Änderung

## Testen

1. Starten Sie Backend und Frontend
2. Gehen Sie zur Login-Seite
3. Klicken Sie auf "Passwort vergessen?"
4. Geben Sie einen existierenden Benutzernamen ein
5. Überprüfen Sie Ihre Email (oder die Logs für Test-Zwecke)
6. Klicken Sie auf den Link in der Email
7. Setzen Sie ein neues Passwort
8. Testen Sie den Login mit dem neuen Passwort

## Fehlersuche

### Email wird nicht gesendet
- Überprüfen Sie die SMTP-Konfiguration
- Stellen Sie sicher, dass die Email-Adresse und das Passwort korrekt sind
- Prüfen Sie die Firewall/Netzwerkeinstellungen

### Token ungültig
- Stellen Sie sicher, dass der Token nicht abgelaufen ist (1 Stunde)
- Überprüfen Sie, dass der Token nicht bereits verwendet wurde
- Prüfen Sie die Datenbankverbindung

### Frontend zeigt Fehler
- Überprüfen Sie die API-URL Konfiguration
- Stellen Sie sicher, dass das Backend läuft
- Prüfen Sie die Browser-Konsole auf Fehler
