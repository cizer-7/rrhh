# Backend-Testing

Dieses Verzeichnis enthält alle Tests für das Backend der Gehaltsabrechnungsanwendung.

## 🚀 Schnellstart

### Alle Tests ausführen
```bash
python run_backend_tests.py
```

### Spezifische Tests
```bash
# Nur Unit-Tests
python run_backend_tests.py --unit-only

# Nur Integration-Tests
python run_backend_tests.py --integration-only

# Nur Security-Tests
python run_backend_tests.py --security-only

# Schnelle Tests (überspringt langsame Tests)
python run_backend_tests.py --fast
```

## 📁 Test-Struktur

### Dateien
- **`run_backend_tests.py`** - Haupt-Test-Runner mit allen Test-Optionen
- **`test_backend_core.py`** - DatabaseManager Core-Tests
- **`test_api_core.py`** - Flask API Core-Tests
- **`test_integration_simple.py`** - Integrationstests für komplette Workflows
- **`test_backend.py`** - Einfacher Test-Runner
- **`conftest_comprehensive.py`** - Gemeinsame Fixtures und Test-Konfiguration

### Verzeichnisse
- **`e2e/`** - End-to-End Tests (Playwright)
- **`frontend/`** - Frontend-spezifische Tests

## 🧪 Test-Arten

### Unit-Tests
Testen einzelne Komponenten isoliert:
- DatabaseManager Methoden
- Flask API Endpunkte
- JWT Token-Verarbeitung
- Passwort-Hashing

### Integration-Tests
Testen komplette Workflows:
- Mitarbeiter CRUD-Operationen
- Gehaltsverwaltung
- Benutzerauthentifizierung
- Excel-Export

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

Die Tests generieren detaillierte Coverage-Reports:
- **HTML-Reports**: `htmlcov_db/` und `htmlcov_api/`
- **Terminal-Reports**: Direkt in der Ausgabe
- **Test-Report**: `test_report.html`

## 🔧 Konfiguration

### pytest.ini
Enthält pytest-Konfiguration:
- Test-Discovery
- Marker-Definitionen
- Output-Formatierung

### requirements.txt
Benötigte Pakete für Tests:
```
pytest
pytest-cov
mysql-connector-python
flask
pandas
openpyxl
```

## 🏃‍♂️ Test-Runner Optionen

```bash
# Alle Optionen anzeigen
python run_backend_tests.py --help

# Coverage-Analyse überspringen
python run_backend_tests.py --no-coverage

# Nur aufräumen
python run_backend_tests.py --cleanup-only

# Ohne Aufräumen
python run_backend_tests.py --no-cleanup
```

## 📋 Test-Marker

- `@pytest.mark.unit` - Unit-Tests
- `@pytest.mark.integration` - Integration-Tests
- `@pytest.mark.performance` - Performance-Tests
- `@pytest.mark.security` - Security-Tests
- `@pytest.mark.slow` - Langsame Tests

## 🐛 Fehlerbehandlung

### Häufige Probleme

1. **Datenbankverbindung fehlgeschlagen**
   - Tests verwenden Mocks, keine echte DB nötig
   - Überprüfen Sie mysql-connector-python Installation

2. **Abhängigkeiten fehlen**
   ```bash
   pip install -r requirements.txt
   ```

3. **Permission-Fehler**
   - Stellen Sie sicher, dass Schreibrechte für testing/ Verzeichnis vorhanden sind

4. **Timeout bei Tests**
   - Verwenden Sie `--fast` für schnelle Tests
   - Erhöhen Sie Timeout in run_backend_tests.py bei Bedarf

## 📈 Test-Ergebnisse

### Erfolgreiche Tests
```
🎉 Alle Tests erfolgreich!
✅ Unit-Tests bestanden
✅ Integration-Tests bestanden
✅ Security-Tests bestanden
✅ Coverage-Analyse abgeschlossen
```

### Fehlgeschlagene Tests
```
⚠️ Einige Tests sind fehlgeschlagen
❌ Unit-Tests: 2 fehlgeschlagen
❌ Integration-Tests: 1 fehlgeschlagen
```

## 🔄 CI/CD Integration

### GitHub Actions Beispiel
```yaml
- name: Run Backend Tests
  run: |
    cd testing
    python run_backend_tests.py --unit-only --no-cleanup
```

### Lokale Pre-Commit Hooks
```bash
#!/bin/sh
cd testing
python run_backend_tests.py --fast
```

## 📝 Test-Schreiben

### Neuen Test hinzufügen
```python
import pytest
from conftest_comprehensive import *

@pytest.mark.unit
class TestNewFeature:
    def test_new_functionality(self, mock_db_manager):
        # Test-Logik hier
        assert True
```

### Best Practices
1. **Descriptive Names**: `test_employee_creation_with_valid_data`
2. **AAA Pattern**: Arrange, Act, Assert
3. **Mock External Dependencies**: Datenbank, APIs
4. **Test Edge Cases**: Leere Daten, Fehler, Grenzwerte
5. **Independent Tests**: Keine Abhängigkeiten zwischen Tests

## 🧹 Wartung

### Regelmäßige Aufgaben
- [ ] Test-Abdeckung überprüfen (>80% Ziel)
- [ ] Langsame Tests identifizieren
- [ ] Veraltete Tests entfernen
- [ ] Dependencies aktualisieren
- [ ] Test-Daten refreshen

### Aufräumen
```bash
# Temporäre Dateien entfernen
python run_backend_tests.py --cleanup-only
```

## 📞 Unterstützung

Bei Problemen mit den Tests:
1. `run_backend_tests.py --help` für Optionen
2. Logs in `test_report.html` überprüfen
3. Dependencies mit `check_dependencies()` prüfen
4. Issues im Projekt-Tracker erstellen
