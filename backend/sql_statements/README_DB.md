# SQL Statements - Gehaltsabrechnungssystem

Dieses Verzeichnis enthält alle SQL-Skripte für die Einrichtung und Initialisierung der Datenbank des Gehaltsabrechnungssystems.

## Dateien und Ausführungsreihenfolge

### 1. `01_schema.sql`
**Beschreibung:** Erstellt das vollständige Datenbankschema mit allen Tabellen.
**Inhalt:**
- Tabellen: t001_empleados, t002_salarios, t003_ingresos_brutos, t004_deducciones, t005_benutzer
- Grundlegende Trigger für automatische Berechnung von Gehältern und Atrasos

### 2. `02_triggers.sql`
**Beschreibung:** Aktualisierte Trigger zur Behebung des Atrasos-Berechnungsproblems.
**Inhalt:**
- Verbesserte BEFORE Trigger für korrekte Atrasos-Berechnung bei chronologisch falscher Eingabe

### 3. `03_insert_employees.sql`
**Beschreibung:** Fügt Mitarbeiterstammdaten in die t001_empleados Tabelle ein.
**Inhalt:** 88 Mitarbeiter mit Namen und CECO-Nummern

### 4. `04_insert_salaries.sql`
**Beschreibung:** Fügt Gehaltsdaten für die Jahre 2025-2026 ein.
**Inhalt:** Gehaltsinformationen für alle Mitarbeiter mit verschiedenen Modalitäten (12/14)

### 5. `05_insert_income.sql`
**Beschreibung:** Fügt Bruttoeinkommensdaten für 2025 ein.
**Inhalt:** Zusätzliche Einkommensbestandteile wie Restauranttickets, Prämien, etc.

## Ausführung

Die Skripte müssen in der angegebenen Reihenfolge ausgeführt werden:
1. Zuerst `01_schema.sql` für die Tabellenerstellung
2. Optional `02_triggers.sql` für aktualisierte Trigger
3. Danach die Insert-Skripte für Testdaten

## Wichtige Hinweise

- Die Trigger berechnen automatisch monatliche Gehälter und Atrasos
- Atrasos werden basierend auf dem Vorjahresgehalt berechnet
- Bei neuen Mitarbeitern ohne Vorgängerdaten wird Atrasos auf 0 gesetzt
