# 🗄️ Datenbank-Dokumentation - Gehaltsabrechnungssystem

Dieses Dokument beschreibt die vollständige Datenbankstruktur und SQL-Skripte für das Gehaltsabrechnungssystem.

## 📋 Inhaltsverzeichnis

1. [📁 Dateien und Ausführungsreihenfolge](#-dateien-und-ausführungsreihenfolge)
2. [⚡ Ausführung](#-ausführung)
3. [📝 Wichtige Hinweise](#-wichtige-hinweise)
4. [🔧 Grundfunktionen](#-grundfunktionen)
5. [📅 Monatliche Tabellen](#-monatliche-tabellen)
6. [👤 Test-Benutzer](#-test-benutzer)

---

## 📁 Dateien und Ausführungsreihenfolge

### 1. `01_schema.sql`
**Beschreibung:** Erstellt das vollständige Datenbankschema mit allen Tabellen.
**Inhalt:**
- Tabellen: t001_empleados, t002_salarios, t003_ingresos_brutos, t004_deducciones, t005_benutzer
- Grundlegende Trigger für automatische Berechnung von Gehältern und Atrasos

### 2. `02_triggers.sql`
**Beschreibung:** Aktualisierte Trigger zur Behebung des Atrasos-Berechnungsproblems und monatliche Trigger.
**Inhalt:**
- Verbesserte BEFORE Trigger für korrekte Atrasos-Berechnung bei chronologisch falscher Eingabe
- Trigger für automatische Erstellung monatlicher Datensätze bei neuen Mitarbeitern
- Indexes für Performance-Optimierung der monatlichen Tabellen

### 3. `03_insert_employees.sql`
**Beschreibung:** Fügt Mitarbeiterstammdaten in die t001_empleados Tabelle ein.
**Inhalt:** 88 Mitarbeiter mit Namen und CECO-Nummern sowie Test-Benutzer für E2E-Tests

### 4. `04_insert_salaries.sql`
**Beschreibung:** Fügt Gehaltsdaten für die Jahre 2025-2026 ein.
**Inhalt:** Gehaltsinformationen für alle Mitarbeiter mit verschiedenen Modalitäten (12/14)

### 5. `05_insert_income.sql`
**Beschreibung:** Fügt Bruttoeinkommensdaten für 2025 ein.
**Inhalt:** Zusätzliche Einkommensbestandteile wie Restauranttickets, Prämien, etc.



## ⚡ Ausführung

Die Skripte müssen in der angegebenen Reihenfolge ausgeführt werden:

### Phase 1: Grundschema
1. `01_schema.sql` - Erstellt das grundlegende Datenbankschema
2. `02_triggers.sql` - Aktualisierte Trigger für korrekte Berechnungen

### Phase 2: Testdaten
3. `03_insert_employees.sql` - Mitarbeiterstammdaten und Test-Benutzer
4. `04_insert_salaries.sql` - Gehaltsdaten
5. `05_insert_income.sql` - Bruttoeinkommensdaten

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
- Für E2E-Tests steht ein Test-Benutzer zur Verfügung:
  - Benutzername: `test`
  - Passwort: `test`
  - Rolle: `admin`
