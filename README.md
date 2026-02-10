# Mitarbeiter Gehaltsabrechnung - Web Anwendung

Moderne Web-Anwendung für Mitarbeiterverwaltung und Gehaltsabrechnung mit React/Next.js Frontend und Python Flask Backend.

## 🏗️ Architektur

- **Frontend:** React/Next.js 14 mit TypeScript und Tailwind CSS
- **Backend:** Python Flask 3.0 mit JWT-Authentifizierung
- **Datenbank:** MySQL über bestehenden DatabaseManager
- **Testing:** Umfassende Test-Suite mit pytest, Jest und Playwright

## 🚀 Schnellstart

### 1. Backend starten
```bash
cd backend
pip install -r requirements.txt
python flask_api_server.py
```
Backend läuft auf: http://localhost:8000

### 2. Backend-Tests (empfohlen)
```bash
cd testing
python run_backend_tests.py
```

### 3. Frontend starten
```bash
cd frontend
npm install
npm run dev
```
Frontend läuft auf: http://localhost:3000

### 4. Anmeldung
 Kontaktieren Sie Ihren Administrator für Zugangsdaten.

## 📁 Verzeichnisstruktur

```
Mitarbeiter Gehaltsabrechnung/
├── backend/                    # Python Flask Backend
│   ├── flask_api_server.py    # Haupt-API-Server
│   ├── database_manager.py    # Datenbankverwaltung (bestehende Logik)
│   ├── database_manager_exports.py # Export-Funktionalitäten
│   ├── start_backend.py       # Einfaches Start-Script
│   ├── requirements.txt       # Python Abhängigkeiten
│   ├── settings.json          # Konfiguration
│   └── sql_statements/        # SQL Statements
├── frontend/                   # React/Next.js Frontend
│   ├── src/
│   │   ├── app/               # Next.js Seiten
│   │   ├── components/        # React Komponenten
│   │   └── types/             # TypeScript Typen
│   ├── package.json           # Node.js Abhängigkeiten
│   └── next-env.d.ts         # Next.js TypeScript Konfiguration
├── testing/                   # Umfassende Test-Suite
│   ├── README_TESTING.md      # Detaillierte Test-Dokumentation
│   ├── run_backend_tests.py   # Haupt Backend Test-Runner
│   ├── conftest_comprehensive.py # Test-Konfiguration
│   ├── backend/               # Backend-spezifische Tests
│   ├── frontend/              # Frontend-Tests (Jest)
│   └── e2e/                   # End-to-End Tests (Playwright)
├── data/                      # Datenverzeichnis
├── pyproject.toml             # Python Projekt-Konfiguration
├── pytest.ini                # pytest Konfiguration
├── commands.md                # Nützliche Befehle
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
- **Python 3.11+**
- **Flask 3.0** - Web Framework
- **Flask-CORS 4.0** - CORS Unterstützung
- **PyJWT 2.8** - JWT Token Handling
- **mysql-connector-python 8.2.0** - Datenbankverbindung
- **reportlab 4.0.7** - PDF Generierung
- **openpyxl 3.1.2** - Excel Verarbeitung

### Frontend
- **React 18** mit Next.js 14.0.4
- **TypeScript 5** - Typensicherheit
- **Tailwind CSS 3.3.0** - Styling
- **Lucide React 0.303.0** - Icons
- **Radix UI** - UI Komponenten (Dialog, Dropdown, Select, etc.)
- **xlsx 0.18.5** - Excel Export
- **bcryptjs 2.4.3** - Passwort-Hashing
- **jsonwebtoken 9.0.2** - JWT Handling

### Datenbank
- **MySQL** - Relationale Datenbank

### Testing
- **Backend:** pytest mit Coverage, Mocking
- **Frontend:** Jest mit React Testing Library
- **E2E:** Playwright für Browser-Automatisierung

## 📝 Installation & Konfiguration

### Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
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

## 🧪 Testing

Die Anwendung verfügt über eine umfassende Test-Suite mit Unit-, Integrations- und End-to-End Tests.

### Backend-Tests ausführen
```bash
cd testing
python run_backend_tests.py
```

### Backend Test-Optionen
```bash
# Nur Unit-Tests
python run_backend_tests.py --unit-only

# Nur Integration-Tests  
python run_backend_tests.py --integration-only

# Schnelle Tests (überspringt langsame Tests)
python run_backend_tests.py --fast

# Alle Optionen anzeigen
python run_backend_tests.py --help
```

### Frontend-Tests
```bash
cd testing/frontend
npm test
```

### End-to-End Tests
```bash
cd testing/e2e
npm test
```

### Test-Abdeckung
- **66+ Tests** insgesamt
- **DatabaseManager**: 31+ Tests (Core-Funktionalität)
- **Flask API**: 26+ Tests (API-Endpunkte)
- **Integration**: 9+ Tests (komplette Workflows)
- **Frontend**: React Komponenten Tests
- **E2E**: Browser-basierte Workflow-Tests

### Test-Arten
- ✅ **Unit-Tests** - Einzelne Komponenten isoliert
- ✅ **Integrationstests** - Komplette Workflows  
- ✅ **Fehler-Szenarien** - Robustheit und Edge Cases
- ✅ **Performance-Tests** - Geschwindigkeit und Speicher
- ✅ **Security-Tests** - JWT, Passwort-Hashing, Authorization
- ✅ **E2E Tests** - Vollständige Benutzer-Workflows im Browser

📖 **Detaillierte Test-Dokumentation:** Siehe `testing/README_TESTING.md`

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

## 📋 Projekt-Status

### ✅ Abgeschlossen
- Vollständige Mitarbeiterverwaltung (CRUD)
- Gehaltsabrechnung mit Jahresabhängigkeit
- JWT-basierte Authentifizierung
- Excel-Export Funktionalität
- Umfassende Test-Suite (66+ Tests)
- Moderne React/Next.js UI
- API-Dokumentation

### 🔄 In Arbeit
- Performance-Optimierungen
- Erweiterte Reporting-Funktionen

### 📋 Hinweise

- Die Web-Anwendung nutzt die bestehende Python-Logik aus `database_manager.py`
- Keine doppelte Implementierung - Frontend nutzt ausschließlich die API
- Die ursprüngliche Desktop-Anwendung kann weiterhin parallel verwendet werden
- Alle Daten bleiben in der bestehenden MySQL-Datenbank
- Umfassende Test-Abdeckung mit Unit-, Integrations- und E2E-Tests

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
