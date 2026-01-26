# Mitarbeiter Gehaltsabrechnung - Web Anwendung

Moderne Web-Anwendung für Mitarbeiterverwaltung und Gehaltsabrechnung mit React/Next.js Frontend und Python Flask Backend.

## 🏗️ Architektur

- **Frontend:** React/Next.js mit TypeScript und Tailwind CSS
- **Backend:** Python Flask mit JWT-Authentifizierung
- **Datenbank:** MySQL über bestehenden DatabaseManager

## 🚀 Schnellstart

### 1. Backend starten
```bash
cd backend
pip install -r requirements_api.txt
python flask_api_server.py
```
Backend läuft auf: http://localhost:8000

### 2. Frontend starten
```bash
cd frontend
npm install
npm run dev
```
Frontend läuft auf: http://localhost:3000

### 3. Anmeldung
 Kontaktieren Sie Ihren Administrator für Zugangsdaten.

## 📁 Verzeichnisstruktur

```
Mitarbeiter Gehaltsabrechnung/
├── backend/                    # Python Flask Backend
│   ├── flask_api_server.py    # Haupt-API-Server
│   ├── database_manager.py    # Datenbankverwaltung (bestehende Logik)
│   ├── start_backend.py       # Einfaches Start-Script
│   ├── requirements_api.txt    # Python Abhängigkeiten
│   ├── db_schema.sql          # Datenbank-Schema
│   └── sql_statements/        # SQL Statements
├── frontend/                   # React/Next.js Frontend
│   ├── src/
│   │   ├── app/               # Next.js Seiten
│   │   ├── components/        # React Komponenten
│   │   ├── lib/api.ts         # API Client
│   │   └── types/             # TypeScript Typen
│   ├── package.json           # Node.js Abhängigkeiten
│   └── .env.local             # API Konfiguration
└── README.md                  # Diese Datei
```

## 🎯 Funktionen

### ✅ Authentifizierung & Sicherheit
- JWT-Token basierte Authentifizierung
- Sichere Benutzeranmeldung
- Geschützte API-Endpunkte

### ✅ Mitarbeiterverwaltung (CRUD)
- Alle Mitarbeiter anzeigen
- Mitarbeiter suchen und filtern
- Neue Mitarbeiter anlegen
- Mitarbeiterdaten bearbeiten
- Mitarbeiter löschen

### ✅ Gehaltsverwaltung
- Jahresabhängige Gehälter verwalten
- Gehaltsmodalitäten (12/14 Monate)
- Antigüedad-Zulagen
- Gehälter importieren/exportieren

### ✅ Einkünfte & Abzüge
- Bruttoeinkünfte (Ticket Restaurant, Primas, etc.)
- Abzüge (Sozialversicherung, etc.)
- Jahresabhängige Verwaltung

### ✅ Export & Reporting
- Excel-Export für Gehaltsdaten
- Mitarbeiterlisten exportieren
- Jahresübersichten

### ✅ Moderne UI
- Responsive Design mit Tailwind CSS
- Intuitive Benutzeroberfläche
- Echtzeit-Suche
- Statusanzeigen und Validierung

## 🌐 API Endpunkte

### Authentifizierung
- `POST /auth/login` - Benutzeranmeldung

### Mitarbeiter
- `GET /employees` - Alle Mitarbeiter abrufen
- `GET /employees/{id}` - Mitarbeiterdetails
- `POST /employees` - Mitarbeiter erstellen
- `PUT /employees/{id}` - Mitarbeiter aktualisieren
- `DELETE /employees/{id}` - Mitarbeiter löschen
- `GET /employees/search/{term}` - Mitarbeiter suchen

### Gehälter & Daten
- `POST /employees/{id}/salaries` - Gehalt hinzufügen
- `PUT /employees/{id}/salaries/{year}` - Gehalt aktualisieren
- `DELETE /employees/{id}/salaries/{year}` - Gehalt löschen
- `PUT /employees/{id}/ingresos/{year}` - Bruttoeinkünfte
- `PUT /employees/{id}/deducciones/{year}` - Abzüge

### Export
- `GET /export/excel/{year}` - Excel Export

### System
- `GET /health` - Health Check

## 🔐 Benutzerdaten

Die Benutzer sind in der `t005_benutzer` Tabelle gespeichert. Für Testzwecke können Benutzer direkt in der Datenbank angelegt werden.

## 📊 Datenbankstruktur

- `t001_empleados` - Mitarbeiterstammdaten
- `t002_salarios` - Gehaltsinformationen (jahresabhängig)
- `t003_ingresos_brutos` - Bruttoeinkünfte (jahresabhängig)
- `t004_deducciones` - Abzüge (jahresabhängig)
- `t005_benutzer` - Benutzer für die Anmeldung

## 🛠️ Technologie-Stack

### Backend
- **Python 3.14+**
- **Flask** - Web Framework
- **Flask-CORS** - CORS Unterstützung
- **PyJWT** - JWT Token Handling
- **mysql-connector-python** - Datenbankverbindung

### Frontend
- **React 18** mit Next.js 14
- **TypeScript** - Typensicherheit
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Radix UI** - UI Komponenten

### Datenbank
- **MySQL** - Relationale Datenbank

## 📝 Installation & Konfiguration

### Backend Dependencies
```bash
cd backend
pip install -r requirements_api.txt
```

### Frontend Dependencies
```bash
cd frontend
npm install
```

### Datenbankkonfiguration
Die Datenbankverbindung ist in `backend/flask_api_server.py` konfiguriert:

```python
db_manager = DatabaseManager(
    host='localhost',
    database='nomina',
    user='root',
    password='Niklas-10',  # Anpassen
    port=3307
)
```

## 🔄 Migration von Desktop-Anwendung

Diese Web-Anwendung ersetzt die ursprüngliche Python/Tkinter Desktop-Anwendung:

- ✅ **Vollständige Funktionsübernahme** - Alle Features der Desktop-App
- ✅ **Keine doppelte Logik** - Nutzt bestehenden `database_manager.py`
- ✅ **Moderne Architektur** - Web-basiert und zukunftssicher
- ✅ **Parallelbetrieb möglich** - Desktop-App kann weiterhin verwendet werden

## 🚀 Entwicklung

### Backend starten (Debug-Modus)
```bash
cd backend
python flask_api_server.py
```

### Frontend starten (Entwicklung)
```bash
cd frontend
npm run dev
```

### API Dokumentation
Die API ist unter http://localhost:8000/health erreichbar.

## 📋 Hinweise

- Die Web-Anwendung nutzt die bestehende Python-Logik aus `database_manager.py`
- Keine doppelte Implementierung - Frontend nutzt ausschließlich die API
- Die ursprüngliche Desktop-Anwendung kann weiterhin parallel verwendet werden
- Alle Daten bleiben in der bestehenden MySQL-Datenbank

## 🐛 Fehlerbehandlung

### Häufige Probleme

1. **Datenbankverbindung fehlgeschlagen**
   - Prüfen ob MySQL Server läuft
   - Zugangsdaten in `flask_api_server.py` überprüfen

2. **Frontend kann nicht auf API zugreifen**
   - Backend muss auf http://localhost:8000 laufen
   - CORS ist bereits konfiguriert

3. **Login funktioniert nicht**
   - Benutzer in `t005_benutzer` Tabelle prüfen
   - Passwort-Hash muss SHA-256 sein
   - Kontaktieren Sie Administrator für gültige Zugangsdaten

## 📞 Support

Bei Problemen oder Fragen:
1. Backend-Logs prüfen (Console-Ausgabe)
2. Frontend-Developer Tools im Browser verwenden
3. Datenbankverbindung testen

---

**Entwickelt mit ❤️ für moderne Mitarbeiterverwaltung**
