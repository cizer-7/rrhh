# Testing für Digitalisierung Gehaltsabrechnung

Dieses Verzeichnis enthält alle Testdateien für die Gehaltsabrechnungsanwendung.

## Testdateien

### `test_database_manager.py`
Umfassende Tests für alle Funktionen im `DatabaseManager`. Die Tests decken folgende Bereiche ab:

#### Getestete Funktionen:
- **Datenbankverbindung**: `connect()`, `disconnect()`
- **Mitarbeiterverwaltung**: `add_employee()`, `get_all_employees()`, `search_employees()`, `get_employee_complete_info()`, `update_employee()`, `delete_employee()`
- **Gehaltsverwaltung**: `add_salary()`, `update_salary()`, `delete_salary()`
- **Bruttoeinkünfte**: `update_ingresos()`
- **Abzüge**: `update_deducciones()`
- **Benutzerverwaltung**: `create_user()`, `verify_user()`, `hash_password()`
- **Fehlerbehandlung**: Verschiedene Fehlerfälle und Edge Cases
- **Transaktionen**: Rollback-Funktionalität

#### Besonderheiten:
- **Produktivdatenbank**: Die Tests verwenden die echte Produktivdatenbank
- **Automatische Aufräumung**: Alle Testdaten werden nach Abschluss automatisch gelöscht
- **Sichere Testdaten**: Verwendet eindeutige Testdaten, die keine Produktivdaten beeinflussen

### `test_ui_components.py`
Umfassende Tests für alle UI-Komponenten in `EmployeeTabComponents`. Die Tests decken folgende Bereiche ab:

#### Getestete Funktionen:
- **Initialisierung**: `__init__()`, Konfiguration und Setup
- **Tab-Setup**: `setup_stammdaten_tab()`, `setup_gehaelter_tab()`, `setup_ingresos_tab()`, `setup_deducciones_tab()`, `setup_historie_tab()`
- **Edit-Modus**: `toggle_edit_mode()`, `set_fields_readonly()`, `update_status_labels()`
- **Historie-Funktionen**: `load_historie_employees()`, `search_historie_employees()`, `show_all_historie_employees()`, `clear_historie()`
- **Event-Handler**: `on_year_change()`, `on_historie_employee_select()`, `on_historie_filter_change()`
- **Widget-Management**: Erstellung und Konfiguration aller UI-Elemente
- **Datenbindung**: Verbindung von UI-Elementen mit Datenvariablen
- **Fehlerbehandlung**: Robuste Fehlerbehandlung in UI-Operationen

#### Besonderheiten:
- **Mock-Objekte**: Verwendet Mock-Objekte für Datenbank und UI-Komponenten
- **Keine echte GUI**: Tests laufen ohne sichtbares GUI-Fenster
- **Widget-Tests**: Überprüft Erstellung, Konfiguration und Zustände aller Widgets
- **Event-Tests**: Testet alle Event-Handler und Benutzerinteraktionen

### `test_ui_styles.py`
Umfassende Tests für alle UI-Stile in `ModernStyles`. Die Tests decken folgende Bereiche ab:

#### Getestete Funktionen:
- **Initialisierung**: `__init__()`, Farbkonfiguration und Setup
- **Stil-Anwendung**: `setup_modern_style()`, Theme-Konfiguration
- **Button-Stile**: Primary, Secondary, Success, Warning, Danger Buttons
- **Widget-Stile**: Entry, Treeview, LabelFrame, Checkbutton, Combobox
- **Basis-Stile**: Frame und Label Grundkonfiguration
- **Farbschema**: Konsistenz und Harmonie der Farben
- **Schriftarten**: Konsistenz der Font-Konfiguration
- **Layout**: Padding und Abstand-Konsistenz
- **Fehlerbehandlung**: Robuste Handhabung ungültiger Werte

#### Besonderheiten:
- **Farbtests**: Überprüft alle definierten Farben und deren Werte
- **Stil-Konsistenz**: Stellt sicher, dass alle Stile korrekt konfiguriert sind
- **Design-Prinzipien**: Testet Einhaltung moderner UI-Design-Richtlinien
- **Theme-Integration**: Überprüft korrekte Anwendung des ttk-Theme

## Voraussetzungen

1. **Datenbankverbindung**: Die Produktivdatenbank muss laufen und erreichbar sein
2. **Python-Abhängigkeiten**: Installieren Sie die requirements aus dem Produktionsverzeichnis:
   ```bash
   pip install -r ../production/requirements.txt
   ```

3. **Datenbank-Konfiguration**: Passen Sie die Datenbankverbindungsdetails in der `setUpClass`-Methode an Ihre Umgebung an:
   ```python
   cls.db_config = {
       'host': 'localhost',
       'database': 'gehaltsabrechnung',
       'user': 'root',
       'password': '',
       'port': 3307
   }
   ```

## Tests ausführen

### Einzelne Testdatei ausführen:
```bash
python test_database_manager.py
```

### Mit detaillierter Ausgabe:
```bash
python -m unittest test_database_manager.py -v
```

### Alle Tests im Verzeichnis ausführen:
```bash
python -m unittest discover -v
```

## Teststruktur

Die Tests verwenden das `unittest`-Framework und sind wie folgt strukturiert:

- **`setUpClass()`**: Einmalige Einrichtung für alle Tests (Datenbankverbindung)
- **`tearDownClass()`**: Aufräumen nach allen Tests (Löschen aller Testdaten)
- **`setUp()`**: Einrichtung für jeden einzelnen Test
- **`tearDown()`**: Aufräumen nach jedem einzelnen Test

## Sicherheitshinweise

⚠️ **Wichtige Hinweise zur Sicherheit:**

1. **Produktivdatenbank**: Die Tests verwenden die Produktivdatenbank, aber:
   - Alle Testdaten werden automatisch gelöscht
   - Es werden nur neue Testdatensätze erstellt
   - Bestehende Daten werden nicht verändert

2. **Testdaten-Kennzeichnung**: Test-Mitarbeiter und -Benutzer werden mit eindeutigen Präfixen erstellt:
   - Mitarbeiter: `Test`, `Search`, `Update`, etc.
   - Benutzer: `testuser_` mit Zeitstempel

3. **Automatische Aufräumung**: Die `tearDownClass()`-Methode stellt sicher, dass alle Testdaten entfernt werden, selbst wenn Tests fehlschlagen

## Fehlersuche

### Häufige Probleme:

1. **Verbindung fehlgeschlagen**:
   - Überprüfen Sie die Datenbank-Konfiguration
   - Stellen Sie sicher, dass die Datenbank läuft
   - Prüfen Sie Benutzerrechte

2. **Module nicht gefunden**:
   - Stellen Sie sicher, dass Sie im richtigen Verzeichnis sind
   - Überprüfen Sie den Python-Pfad

3. **Testdaten nicht gelöscht**:
   - Die Tests sollten automatisch aufräumen
   - Bei Abbrüchen können manuell Testdaten gelöscht werden (Mitarbeiter mit Test-Namen)

### Manuelles Aufräumen (falls nötig):
```sql
-- Test-Mitarbeiter löschen
DELETE FROM t001_empleados WHERE nombre LIKE 'Test%' OR nombre LIKE 'Search%' OR nombre LIKE 'Update%' OR nombre LIKE 'Delete%' OR nombre LIKE 'Salary%' OR nombre LIKE 'Ingresos%' OR nombre LIKE 'Deducciones%' OR nombre LIKE 'Transaction%' OR nombre LIKE 'Complete%';

-- Test-Benutzer löschen
DELETE FROM t005_benutzer WHERE benutzername LIKE 'testuser_%';
```

## Erweiterung

Um neue Tests hinzuzufügen:

1. Erstellen Sie neue Testmethoden in `test_database_manager.py`
2. Folgen Sie dem Namensschema `test_*()`
3. Fügen Sie Test-Mitarbeiter/IDs zur `test_employee_ids`-Liste hinzu, damit sie gelöscht werden
4. Dokumentieren Sie neue Tests hier in der README

## Testabdeckung

Die aktuelle Testabdeckung umfasst:
- ✅ Alle öffentlichen Methoden von DatabaseManager
- ✅ Fehlerbehandlung und Edge Cases
- ✅ Transaktionsverhalten
- ✅ Datenintegrität
- ✅ Benutzer-Authentifizierung

Für weitere Fragen oder Probleme wenden Sie sich an das Entwicklungsteam.