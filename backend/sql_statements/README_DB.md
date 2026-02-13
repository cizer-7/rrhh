# 🗄️ Datenbank-Dokumentation - Gehaltsabrechnungssystem

Dieses Dokument beschreibt die vollständige Datenbankstruktur und SQL-Skripte für das Gehaltsabrechnungssystem.

## 📋 Inhaltsverzeichnis

1. [📁 Ordnerstruktur](#-ordnerstruktur)
2. [⚡ Ausführung](#-ausführung)
3. [📝 Wichtige Hinweise](#-wichtige-hinweise)
4. [🔧 Grundfunktionen](#-grundfunktionen)
5. [📅 Monatliche Tabellen](#-monatliche-tabellen)
6. [👤 Test-Benutzer](#-test-benutzer)

---

## 📁 Ordnerstruktur

### `01_schema/` - Datenbankschema
**Beschreibung:** Enthält alle CREATE TABLE Anweisungen für die Datenbankstruktur.

**Dateien:**
- `01_schema.sql` - Alle Tabellen: t001_empleados, t002_salarios, t003_ingresos_brutos, t004_deducciones, t005_benutzer, t006_valores_calculados_mensuales, t007_bearbeitungslog, t008_empleado_fte, t009_password_reset_tokens

### `02_triggers/` - Datenbank-Trigger
**Beschreibung:** Enthält alle Trigger für automatische Berechnungen und Datenintegrität.

**Dateien:**
- `01_triggers.sql` - Trigger für automatische Gehaltsberechnung, Atrasos-Berechnung und monatliche Datensätze

### `03_data/` - Testdaten
**Beschreibung:** Enthält alle INSERT Anweisungen für Testdaten.

**Dateien:**
- `00_insert_employees.sql` - Mitarbeiterstammdaten (88 Mitarbeiter + Test-Benutzer)
- `01_insert_benutzer.sql` - Benutzerkonten für die Anwendung
- `02_insert_salaries.sql` - Gehaltsdaten für die Jahre 2025-2026
- `03_insert_income.sql` - Bruttoeinkommensdaten für 2025 (Restauranttickets, Prämien, etc.)

### `04_maintenance/` - Wartungsskripte
**Beschreibung:** Skripte für Datenbank-Wartung und Migrationen (zukünftig).

---

## ⚡ Ausführung

Die Skripte müssen in der angegebenen Reihenfolge ausgeführt werden:

### Phase 1: Grundschema
1. `01_schema/01_schema.sql` - Erstellt das vollständige Datenbankschema mit allen Tabellen
2. `02_triggers/01_triggers.sql` - Aktualisierte Trigger für korrekte Berechnungen

### Phase 2: Testdaten
3. `03_data/00_insert_employees.sql` - Mitarbeiterstammdaten und Test-Benutzer
4. `03_data/01_insert_benutzer.sql` - Benutzerkonten
5. `03_data/02_insert_salaries.sql` - Gehaltsdaten
6. `03_data/03_insert_income.sql` - Bruttoeinkommensdaten

## 📝 Wichtige Hinweise

### 🔧 Grundfunktionen
- Die Trigger berechnen automatisch monatliche Gehälter und Atrasos
- Atrasos werden basierend auf dem Vorjahresgehalt berechnet
- Bei neuen Mitarbeitern ohne Vorgängerdaten wird Atrasos auf 0 gesetzt

### 📅 Monatliche Tabellen (erweiterte Funktionalität)
- Die monatlichen Tabellen ermöglichen individuelle Bearbeitung von Zuschlägen und Abzügen pro Monat
- Neue Mitarbeiter erhalten automatisch 12 monatliche Datensätze für das aktuelle Jahr
- Die Migration kopiert bestehende Jahresdaten in monatliche Datensätze
- Die ursprünglichen Jahresdaten bleiben aus Kompatibilitätsgründen erhalten

### 👤 Test-Benutzer
- Für E2E-Tests stehen folgende Test-Benutzer zur Verfügung:
  - Benutzername: `test`, Passwort: `test`, Rolle: `admin`
  - Benutzername: `Gerard.Cizer@krones.es`, Passwort: `Test`, Rolle: `benutzer`
  - Benutzername: `xforne@krones.es`, Passwort: `Test`, Rolle: `benutzer`
  - Benutzername: `Michelle.Cruz@krones.es`, Passwort: `Test`, Rolle: `benutzer`
  - Benutzername: `Guillermo.Gonzalez@krones.es`, Passwort: `Test`, Rolle: `benutzer`

**Hinweis:** In der Produktion sollten Passwörter gehasht werden (z.B. mit bcrypt). Für Tests wird SHA256 verwendet.
