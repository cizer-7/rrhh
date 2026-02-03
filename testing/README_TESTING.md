# Testing-Strategie

Dieses Verzeichnis enthält die komplette Test-Infrastruktur für die Digitalisierung der Gehaltsabrechnung.

## 🚀 Schnellstart

### Backend-Tests
```bash
# Alle Backend-Tests ausführen
python testing/backend/run_backend_tests.py

# Nur Unit-Tests
python testing/backend/run_backend_tests.py --unit-only

# Nur Integration-Tests
python testing/backend/run_backend_tests.py --integration-only

# Schnelle Tests (überspringt langsame Tests)
python testing/backend/run_backend_tests.py --fast
```

### Frontend-Tests
```bash
# Alle Frontend-Tests ausführen
cd testing/frontend && npm test

# Tests mit Coverage
cd testing/frontend && npm run test:coverage

# Watch-Mode
cd testing/frontend && npm run test:watch
```

### End-to-End-Tests
```bash
# E2E-Tests ausführen
cd testing/e2e && npm test

# Im Browser sichtbar
cd testing/e2e && npm run test:headed

# Alle Browser testen
cd testing/e2e && npm run test:all-browsers
```

## 📁 Test-Struktur

### Backend-Tests (`backend/`)
- **`run_backend_tests.py`** - Haupt-Test-Runner mit allen Test-Optionen
- **`test_backend_core.py`** - DatabaseManager Core-Tests
- **`test_api_core.py`** - Flask API Core-Tests  
- **`test_integration_simple.py`** - Integrationstests für komplette Workflows
- **`test_backend.py`** - Einfacher Test-Runner
- **`requirements.txt`** - Backend-Test-Dependencies

### Frontend-Tests (`frontend/`)
- **`package.json`** - Frontend-Test-Konfiguration mit Jest
- **`jest.config.js`** - Jest-Konfiguration
- **`jest.setup.js`** - Jest-Setup-Datei
- **`*.test.js`** - React-Komponenten-Tests

### End-to-End-Tests (`e2e/`)
- **`tests-final.spec.js`** - Haupt-E2E-Test-Suite
- **`package.json`** - Playwright-Konfiguration
- **`playwright.config.js`** - Playwright-Einstellungen
- **`test-results/`** - E2E-Test-Ergebnisse

### Gemeinsame Dateien
- **`conftest_comprehensive.py`** - Gemeinsame Fixtures und Test-Konfiguration
- **`pytest.ini`** - pytest-Konfiguration
- **`.env.test`** - Test-Umgebungsvariablen

## 🧪 Test-Arten

### Backend Unit-Tests
Testen einzelne Backend-Komponenten isoliert:
- DatabaseManager Methoden
- Flask API Endpunkte
- JWT Token-Verarbeitung
- Passwort-Hashing

### Frontend Unit-Tests
Testen einzelne Frontend-Komponenten:
- React-Komponenten-Rendering
- User-Interaktionen
- Formular-Validierung
- State-Management

### Integration-Tests
Testen komplette Workflows:
- Mitarbeiter CRUD-Operationen
- Gehaltsverwaltung
- Benutzerauthentifizierung
- Excel-Export

### End-to-End-Tests
Testen komplette Benutzer-Workflows:
- Login-Prozess
- Mitarbeiter-Anlage und -Bearbeitung
- Gehaltsabrechnung
- Daten-Export

### Security-Tests
Testen Sicherheitsaspekte:
- JWT Token-Sicherheit
- Passwort-Hashing-Qualität
- SQL-Injection-Schutz
- Authorization-Header-Validierung

### Performance-Tests
Testen Performance-Aspekte:
- Speicherverbrauch
- Antwortzeiten
- Nebenläufige Zugriffe

## 📊 Coverage

### Backend Coverage
Die Backend-Tests generieren detaillierte Coverage-Reports:
- **HTML-Reports**: `htmlcov_db/` und `htmlcov_api/`
- **Terminal-Reports**: Direkt in der Ausgabe
- **Test-Report**: `test_report.html`

### Frontend Coverage
Frontend-Tests generieren Coverage-Reports:
- **HTML-Report**: `testing/frontend/coverage/`
- **Terminal-Report**: Direkt in der Ausgabe
- **LCOV-Format**: Für CI/CD-Integration

### E2E Coverage
E2E-Tests generieren:
- **Screenshots**: Bei Fehlern und manuell
- **Videos**: Für Debugging
- **HTML-Report**: `testing/e2e/playwright-report/`

## 🔧 Konfiguration

### Backend Konfiguration

#### pytest.ini
Enthält pytest-Konfiguration:
- Test-Discovery
- Marker-Definitionen
- Output-Formatierung

#### backend/requirements.txt
Benötigte Pakete für Backend-Tests:
```
pytest==7.4.3
pytest-cov==4.1.0
pytest-mock==3.12.0
pytest-asyncio==0.21.1
mysql-connector-python==8.2.0
requests==2.31.0
python-dotenv==1.0.0
flask==3.0.0
flask-cors==4.0.0
PyJWT==2.8.0
```

### Frontend Konfiguration

#### frontend/package.json
Frontend-Test-Dependencies:
- Jest für Unit-Tests
- React Testing Library
- TypeScript-Unterstützung

#### frontend/jest.config.js
Jest-Konfiguration für React-Tests

### E2E Konfiguration

#### e2e/package.json
E2E-Test-Dependencies:
- Playwright für Browser-Automatisierung
- Multi-Browser-Unterstützung

#### e2e/playwright.config.js
Playwright-Einstellungen:
- Browser-Konfiguration
- Timeout-Einstellungen
- Reporter-Konfiguration

## 🏃‍♂️ Test-Runner Optionen

### Backend Test-Runner
```bash
# Alle Optionen anzeigen
python testing/backend/run_backend_tests.py --help

# Coverage-Analyse überspringen
python testing/backend/run_backend_tests.py --no-coverage

# Nur aufräumen
python testing/backend/run_backend_tests.py --cleanup-only

# Ohne Aufräumen
python testing/backend/run_backend_tests.py --no-cleanup
```

### Frontend Test-Runner
```bash
# Watch-Mode
cd testing/frontend && npm run test:watch

# CI-Mode (kein Watch)
cd testing/frontend && npm run test:ci

# Coverage mit LCOV
cd testing/frontend && npm run test:coverage
```

### E2E Test-Runner
```bash
# Spezielle Browser
cd testing/e2e && npm run test:chrome
cd testing/e2e && npm run test:firefox
cd testing/e2e && npm run test:edge

# Debug-Mode
cd testing/e2e && npm run test:debug

# UI-Mode
cd testing/e2e && npm run test:ui

# Browser installieren
cd testing/e2e && npm run install:browsers
```

## 📋 Test-Marker

### Backend pytest Marker
- `@pytest.mark.unit` - Unit-Tests
- `@pytest.mark.integration` - Integration-Tests
- `@pytest.mark.performance` - Performance-Tests
- `@pytest.mark.security` - Security-Tests
- `@pytest.mark.slow` - Langsame Tests

### Frontend Test-Kategorien
- Unit-Tests für Komponenten
- Integration-Tests für Hooks
- Snapshot-Tests für UI

### E2E Test-Kategorien
- Smoke-Tests (kritische Pfade)
- Regression-Tests
- Cross-Browser-Tests

## 🐛 Fehlerbehandlung

### Häufige Probleme

#### Backend-Probleme
1. **Datenbankverbindung fehlgeschlagen**
   - Tests verwenden Mocks, keine echte DB nötig
   - Überprüfen Sie mysql-connector-python Installation

2. **Backend-Abhängigkeiten fehlen**
   ```bash
   pip install -r testing/backend/requirements.txt
   ```

3. **Permission-Fehler**
   - Stellen Sie sicher, dass Schreibrechte für testing/ Verzeichnis vorhanden sind

4. **Timeout bei Backend-Tests**
   - Verwenden Sie `--fast` für schnelle Tests
   - Erhöhen Sie Timeout in run_backend_tests.py bei Bedarf

#### Frontend-Probleme
1. **Node.js Version**
   - Stellen Sie sicher, dass Node.js 18+ installiert ist
   - Überprüfen Sie package.json engines

2. **Frontend-Abhängigkeiten fehlen**
   ```bash
   cd testing/frontend && npm install
   ```

3. **TypeScript-Fehler**
   - Überprüfen Sie tsconfig.json
   - Stellen Sie sicher, dass Typ-Definitionen vorhanden sind

#### E2E-Probleme
1. **Browser nicht installiert**
   ```bash
   cd testing/e2e && npm run install:browsers
   ```

2. **Server nicht erreichbar**
   - Stellen Sie sicher, dass Backend und Frontend laufen
   - Überprüfen Sie Playwright-Config für richtige URLs

3. **Timeout bei E2E-Tests**
   - Erhöhen Sie Timeout in playwright.config.js
   - Überprüfen Sie Netzwerkverbindung

## 📈 Test-Ergebnisse

### Erfolgreiche Tests
```
🎉 Alle Tests erfolgreich!
✅ Backend Unit-Tests bestanden
✅ Frontend Unit-Tests bestanden
✅ Integration-Tests bestanden
✅ E2E-Tests bestanden
✅ Coverage-Analyse abgeschlossen
```

### Fehlgeschlagene Tests
```
⚠️ Einige Tests sind fehlgeschlagen
❌ Backend Unit-Tests: 2 fehlgeschlagen
❌ Frontend Tests: 1 fehlgeschlagen
❌ E2E-Tests: 1 fehlgeschlagen
```

## 🔄 CI/CD Integration

### GitHub Actions Beispiel
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r testing/backend/requirements.txt
      - name: Run backend tests
        run: |
          python testing/backend/run_backend_tests.py --unit-only --no-cleanup

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd testing/frontend && npm install
      - name: Run frontend tests
        run: |
          cd testing/frontend && npm run test:ci

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd testing/e2e && npm install
      - name: Install browsers
        run: |
          cd testing/e2e && npm run install:browsers
      - name: Run E2E tests
        run: |
          cd testing/e2e && npm test
```

### Lokale Pre-Commit Hooks
```bash
#!/bin/sh
# Backend schnelle Tests
python testing/backend/run_backend_tests.py --fast

# Frontend schnelle Tests
cd testing/frontend && npm run test:ci
```

## 📝 Test-Schreiben

### Backend-Test hinzufügen
```python
import pytest
from testing.conftest_comprehensive import *

@pytest.mark.unit
class TestNewFeature:
    def test_new_functionality(self, mock_db_manager):
        # Test-Logik hier
        assert True
```

### Frontend-Test hinzufügen
```javascript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E-Test hinzufügen
```javascript
import { test, expect } from '@playwright/test';

test('new user flow', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="login-button"]');
  // Test-Logik hier
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
});
```

### Best Practices
1. **Descriptive Names**: `test_employee_creation_with_valid_data`
2. **AAA Pattern**: Arrange, Act, Assert
3. **Mock External Dependencies**: Datenbank, APIs
4. **Test Edge Cases**: Leere Daten, Fehler, Grenzwerte
5. **Independent Tests**: Keine Abhängigkeiten zwischen Tests
6. **Page Objects**: Für E2E-Tests Wiederverwendbarkeit fördern

## 🧹 Wartung

### Regelmäßige Aufgaben
- [ ] Backend Test-Abdeckung überprüfen (>80% Ziel)
- [ ] Frontend Test-Abdeckung überprüfen (>80% Ziel)
- [ ] Langsame Tests identifizieren und optimieren
- [ ] Veraltete Tests entfernen
- [ ] Dependencies aktualisieren (Backend & Frontend)
- [ ] Test-Daten refreshen
- [ ] E2E-Browser-Kompatibilität prüfen

### Aufräumen
```bash
# Backend temporäre Dateien entfernen
python testing/backend/run_backend_tests.py --cleanup-only

# Frontend Coverage-Reports entfernen
rm -rf testing/frontend/coverage/

# E2E Test-Ergebnisse aufräumen
rm -rf testing/e2e/test-results/
rm -rf testing/e2e/playwright-report/
```

## 📞 Unterstützung

Bei Problemen mit den Tests:

### Backend-Support
1. `python testing/backend/run_backend_tests.py --help` für Optionen
2. Logs in `test_report.html` überprüfen
3. Dependencies mit `check_dependencies()` prüfen

### Frontend-Support
1. `cd testing/frontend && npm test --help` für Optionen
2. Jest-Konfiguration überprüfen
3. TypeScript-Fehler analysieren

### E2E-Support
1. `cd testing/e2e && npm run test:debug` für Debugging
2. Playwright-Report anzeigen: `npm run report`
3. Screenshots und Videos analysieren

### Allgemeiner Support
1. Issues im Projekt-Tracker erstellen
2. Test-Dokumentation konsultieren
3. Team-Kommunikation für komplexe Probleme
