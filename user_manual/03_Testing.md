# 🧪 Testing-Handbuch - Digitalisierung Gehaltsabrechnung

## 📋 Inhaltsverzeichnis

1. [🚀 Schnellstart](#-schnellstart)
2. [📁 Test-Struktur](#-test-struktur)
3. [🧪 Test-Arten](#-test-arten)
4. [📊 Coverage & Berichte](#-coverage--berichte)
5. [🔧 Konfiguration](#-konfiguration)
6. [🐛 Fehlerbehandlung](#-fehlerbehandlung)
7. [📝 Test-Schreiben](#-test-schreiben)

---

## 🚀 Schnellstart

### Alle Tests ausführen
```bash
# Backend-Tests
python testing/backend/run_backend_tests.py

# Frontend-Tests
cd testing/frontend && npm test

# E2E-Tests
cd testing/e2e && npm test
```

### Schnelle Tests (Entwicklung)
```bash
# Nur Unit-Tests (schnell)
python testing/backend/run_backend_tests.py --unit-only

# Frontend im Watch-Mode
cd testing/frontend && npm run test:watch

# E2E-Tests mit sichtbarem Browser
cd testing/e2e && npm run test:headed
```

---

## 📁 Test-Struktur

### Backend-Tests (`testing/backend/`)
- **`run_backend_tests.py`** - Haupt-Test-Runner
- **`test_backend_core.py`** - DatabaseManager Tests
- **`test_api_core.py`** - Flask API Tests
- **`test_integration_simple.py`** - Integrationstests

### Frontend-Tests (`testing/frontend/`)
- **`*.test.js`** - React-Komponenten-Tests
- **`jest.config.js`** - Jest-Konfiguration
- **`package.json`** - Test-Dependencies

### E2E-Tests (`testing/e2e/`)
- **`tests-final.spec.js`** - Haupt-E2E-Test-Suite
- **`playwright.config.js`** - Playwright-Einstellungen
- **`test-results/`** - Test-Ergebnisse und Screenshots

---

## 🧪 Test-Arten

### Backend Unit-Tests
**Zweck:** Isolierte Tests einzelner Backend-Komponenten

**Getestete Funktionen:**
- DatabaseManager Methoden
- Flask API Endpunkte
- JWT Token-Verarbeitung
- Passwort-Hashing
- Datenbankoperationen

**Beispiel:**
```python
def test_employee_creation(self, mock_db_manager):
    result = mock_db_manager.create_employee(test_data)
    assert result['success'] is True
    assert 'employee_id' in result
```

### Frontend Unit-Tests
**Zweck:** Tests einzelner React-Komponenten

**Getestete Funktionen:**
- Komponenten-Rendering
- User-Interaktionen
- Formular-Validierung
- State-Management

**Beispiel:**
```javascript
test('renders employee form correctly', () => {
  render(<EmployeeForm />);
  expect(screen.getByLabelText('Name')).toBeInTheDocument();
});
```

### Integrationstests
**Zweck:** Tests kompletter Workflows

**Getestete Workflows:**
- Mitarbeiter CRUD-Operationen
- Gehaltsverwaltung
- Benutzerauthentifizierung
- Excel-Export

### End-to-End Tests
**Zweck:** Tests kompletter Benutzer-Workflows im Browser

**Getestete Szenarien:**
- Login-Prozess
- Mitarbeiter-Anlage und -Bearbeitung
- Gehaltsabrechnung
- Daten-Export

---

## 📊 Coverage & Berichte

### Backend Coverage
- **HTML-Reports:** `htmlcov_db/` und `htmlcov_api/`
- **Terminal-Reports:** Direkte Ausgabe im Terminal
- **Ziel:** >80% Code-Abdeckung

### Frontend Coverage
- **HTML-Report:** `testing/frontend/coverage/`
- **LCOV-Format:** Für CI/CD-Integration
- **Ziel:** >80% Komponenten-Abdeckung

### E2E Berichte
- **Screenshots:** Automatisch bei Fehlern
- **Videos:** Für Debugging-Zwecke
- **HTML-Report:** `testing/e2e/playwright-report/`

---

## 🔧 Konfiguration

### Backend Konfiguration
**Datei:** `testing/pytest.ini`
- Test-Discovery-Einstellungen
- Marker-Definitionen
- Output-Formatierung

**Dependencies:** `testing/backend/requirements.txt`
```
pytest==7.4.3
pytest-cov==4.1.0
pytest-mock==3.12.0
mysql-connector-python==8.2.0
```

### Frontend Konfiguration
**Datei:** `testing/frontend/jest.config.js`
- React Testing Library Setup
- TypeScript-Unterstützung
- Test-Umgebungsvariablen

### E2E Konfiguration
**Datei:** `testing/e2e/playwright.config.js`
- Browser-Konfiguration
- Timeout-Einstellungen
- Reporter-Konfiguration

---

## 🐛 Fehlerbehandlung

### Häufige Probleme

#### Backend-Probleme
1. **Datenbankverbindung fehlgeschlagen**
   - Lösung: Tests verwenden Mocks, keine echte DB nötig
   - Prüfung: mysql-connector-python Installation

2. **Backend-Abhängigkeiten fehlen**
   ```bash
   pip install -r testing/backend/requirements.txt
   ```

#### Frontend-Probleme
1. **Node.js Version**
   - Erforderlich: Node.js 18+
   - Prüfung: `node --version`

2. **TypeScript-Fehler**
   - Lösung: tsconfig.json überprüfen
   - Prüfung: Typ-Definitionen vorhanden

#### E2E-Probleme
1. **Browser nicht installiert**
   ```bash
   cd testing/e2e && npm run install:browsers
   ```

2. **Server nicht erreichbar**
   - Lösung: Backend und Frontend starten
   - Prüfung: Playwright-Config URLs

---

## 📝 Test-Schreiben

### Backend-Test hinzufügen
```python
import pytest
from testing.conftest_comprehensive import *

@pytest.mark.unit
class TestNewFeature:
    def test_new_functionality(self, mock_db_manager):
        # Arrange
        test_data = {...}
        
        # Act
        result = mock_db_manager.new_method(test_data)
        
        # Assert
        assert result['success'] is True
```

### Frontend-Test hinzufügen
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  test('handles user interaction', () => {
    render(<MyComponent />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### E2E-Test hinzufügen
```javascript
import { test, expect } from '@playwright/test';

test('complete user workflow', async ({ page }) => {
  await page.goto('/');
  
  await page.fill('[data-testid="username"]', 'test');
  await page.fill('[data-testid="password"]', 'test');
  await page.click('[data-testid="login-button"]');
  
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
});
```

---

## 📈 Test-Statistiken

### Aktuelle Test-Abdeckung
- **Gesamt:** 66+ Tests
- **Backend Unit-Tests:** 31+ Tests
- **Flask API Tests:** 26+ Tests
- **Integrationstests:** 9+ Tests
- **Frontend Tests:** React Komponenten Tests
- **E2E Tests:** Browser-basierte Workflow-Tests

### Test-Ausführungszeiten
- **Unit-Tests:** < 2 Minuten
- **Integrationstests:** < 5 Minuten
- **E2E-Tests:** < 10 Minuten
- **Gesamt:** < 20 Minuten

---

*Nächste Dokumente: [Systemübersicht](01_Übersicht.md) | [Datenbank-Dokumentation](02_Datenbank.md) | [Benutzerhandbuch](04_Benutzerhandbuch.md)*
