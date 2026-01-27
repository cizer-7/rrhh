# Testing für Gehaltsabrechnungssystem

Dieses Verzeichnis enthält alle Tests für das Gehaltsabrechnungssystem - Backend, Frontend und E2E.

## 📁 Struktur

```
testing/
├── requirements.txt              # Python Test Dependencies
├── conftest.py                   # Pytest Konfiguration und Fixtures
├── pytest.ini                   # Pytest Konfiguration
├── .env.test                     # Test Environment Variablen
├── run_all_tests.py              # 🚀 Alle Tests Runner
│
├── Backend Tests/
├── test_database_manager.py      # DatabaseManager Unit Tests
├── test_flask_api.py             # Flask API Unit Tests
├── test_integration.py           # Integration Tests
│
├── Frontend Tests/
├── frontend/
│   ├── package.json              # Frontend Test Dependencies
│   ├── jest.config.js            # Jest Konfiguration
│   ├── jest.setup.js             # Jest Setup
│   └── test_employee_detail.test.js  # EmployeeDetail Component Tests
│
├── E2E Tests/
├── e2e/
│   ├── playwright.config.js      # Playwright Konfiguration
│   └── test_employee_workflow.spec.js  # Kompletter Workflow Tests
│
└── Reports/
    ├── htmlcov/                  # Coverage Reports
    └── playwright-report/        # E2E Reports
```

## 🚀 Alle Tests auf einmal ausführen

**Empfohlene Methode:**
```bash
cd testing
python run_all_tests.py
```

**Alternativen:**
```bash
# Nur schnelle Tests
python run_all_tests.py --fast

# Mit Coverage
python run_all_tests.py --coverage --html

# Nur bestimmte Test-Typen
python run_all_tests.py --unit          # Nur Backend
python run_all_tests.py --frontend      # Nur Frontend
python run_all_tests.py --e2e           # Nur E2E
python run_all_tests.py --integration   # Nur Integration
```

## 📋 Test-Arten

### 🔧 Backend Tests
- **DatabaseManager**: Datenbankoperationen, CRUD, Authentifizierung
- **Flask API**: REST Endpoints, JWT, Fehlerbehandlung
- **Integration**: API-Zusammenspiel, vollständige Workflows

### 🌐 Frontend Tests
- **Component Tests**: React Components mit Jest + Testing Library
- **UI Interaktionen**: Formulare, Navigation, State Management
- **Datenfluss**: API-Aufrufe, Error Handling

### 🎭 E2E Tests
- **User Workflows**: Komplette Benutzerjourneys
- **Cross-Browser**: Chrome, Firefox, Safari
- **Responsive**: Mobile, Tablet, Desktop
- **Accessibility**: ARIA, Keyboard Navigation

## 🛠️ Installation

### Python Dependencies
```bash
cd testing
pip install -r requirements.txt
```

### Frontend Dependencies
```bash
cd testing/frontend
npm install
```

### E2E Dependencies
```bash
cd testing/e2e
npx playwright install
```

## 📊 Test-Commands

### Backend
```bash
# Alle Backend Tests
python -m pytest -v --tb=short

# Mit Coverage
python -m pytest --cov=../backend --cov-report=html
```

### Frontend
```bash
cd testing/frontend
npm test                    # Einmalig
npm run test:watch         # Watch Mode
npm run test:coverage      # Mit Coverage
```

### E2E
```bash
cd testing/e2e
npx playwright test        # Alle Browser
npx playwright test --project=chromium  # Nur Chrome
npx playwright test --headed  # Mit Browser UI
```

## 📈 Coverage Reports

- **Backend**: `htmlcov/index.html`
- **Frontend**: `coverage/lcov-report/index.html`
- **E2E**: `playwright-report/index.html`

## 🎯 Test-Marker

```python
@pytest.mark.unit          # Unit Tests
@pytest.mark.integration   # Integration Tests
@pytest.mark.slow          # Langsame Tests
@pytest.mark.database      # Datenbank-Tests
```

## 📝 Schreiben von Tests

### Backend Tests
```python
def test_function_name():
    # Arrange
    db_manager = DatabaseManager(...)
    
    # Act
    result = db_manager.some_method()
    
    # Assert
    assert result == expected_value
```

### Frontend Tests
```javascript
test('component behavior', async () => {
  render(<Component />)
  
  await fireEvent.click(screen.getByText('Button'))
  
  expect(screen.getByText('Result')).toBeInTheDocument()
})
```

### E2E Tests
```javascript
test('user workflow', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Login')
  // ... vollständiger Benutzer-Flow
})
```

## 🔄 CI/CD Integration

```bash
# In CI/CD Pipeline
python testing/run_all_tests.py --unit --coverage --verbose
```

## 🐛 Troubleshooting

### Import Fehler
- Backend-Verzeichnis im Python-Pfad
- Frontend-Module korrekt importieren

### Dependencies
- Python: `pip install -r requirements.txt`
- Frontend: `npm install`
- E2E: `npx playwright install`

### Browser Probleme
- Playwright Browser installieren
- Headless Mode für CI/CD

### Zeitüberschreitungen
- Tests mit `--timeout` anpassen
- Mocks für externe APIs verwenden

## 📋 Best Practices

1. **Tests schreiben**: Für jede neue Funktion Tests erstellen
2. **Marker verwenden**: Tests korrekt markieren
3. **Isolation**: Tests unabhängig voneinander
4. **Coverage halten**: Mindestens 80% Abdeckung
5. **Schnelle Tests**: Unit Tests sollten < 1s dauern
6. **E2E sparsam**: Nur kritische User-Paths testen

## 🚀 Quick Start

```bash
# 1. Alle Dependencies installieren
cd testing && pip install -r requirements.txt

# 2. Alle Tests ausführen
python run_all_tests.py

# 3. Coverage ansehen
open htmlcov/index.html
```

## 📞 Hilfe

- **Backend Tests**: `test_database_manager.py`, `test_flask_api.py`
- **Frontend Tests**: `frontend/test_employee_detail.test.js`
- **E2E Tests**: `e2e/test_employee_workflow.spec.js`
- **Issues**: Check console output für detaillierte Ergebnisse
