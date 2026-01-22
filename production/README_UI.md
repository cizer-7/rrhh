# Mitarbeiter Gehaltsabrechnung - Management UI

## Übersicht
Dieses Python-Interface bietet eine moderne grafische Oberfläche zur Verwaltung von Mitarbeiterdaten in der Gehaltsabrechnungsdatenbank. Die Anwendung wurde mit einer modularen Architektur entwickelt und verwendet ein modernes Design mit Benutzeranmeldung.

## Hauptfunktionen
1. **Benutzerauthentifizierung** - Sichere Anmeldung mit Benutzernamen und Passwort
2. **Mitarbeiterverwaltung** - Vollständige CRUD-Operationen für Mitarbeiter:
   - Mitarbeiter anzeigen und durchsuchen
   - Neue Mitarbeiter anlegen
   - Mitarbeiterdaten bearbeiten
   - Mitarbeiter löschen (mit Sicherheitsabfrage)
3. **Stammdatenverwaltung** - Bearbeitung von:
   - Name, CECO, Aktiv-Status
4. **Gehaltsdaten** - Jahresabhängige Verwaltung von:
   - Gehaltsmodalität (12/14)
   - Jahres- und Monatsgehalt
   - Antigüedad-Zulagen
   - Atrasos (Verzögerungen)
5. **Bruttoeinkünfte** - Jahresabhängige Verwaltung von:
   - Ticket Restaurant
   - Cotización Especie
   - Primas
   - Dietas Cotizables
   - Stunden Überstunden
   - Tage Steuerfrei
   - Benzin Arval
   - Dietas Steuerfrei
6. **Abzüge** - Jahresabhängige Verwaltung von:
   - Sicherheitspension
   - Unfallversicherung
   - Adelas
   - Sanitas
7. **Historie** - Anzeige aller Änderungen mit Filtermöglichkeiten:
   - Nach Mitarbeiter filtern
   - Nach Datentyp filtern (Gehälter, Bruttoeinkünfte, Abzüge)
8. **Report-Generator** - Export von Mitarbeiterdaten als:
   - PDF-Berichte
   - Excel-Tabellen

## Architektur
Die Anwendung verwendet eine modulare Architektur mit folgenden Komponenten:
- `user_interface.py` - Hauptanwendung mit Login-Dialog
- `database_manager.py` - Datenbankverbindung und -operationen
- `ui_components.py` - Modulare UI-Komponenten für Tabs
- `ui_styles.py` - Modernes Styling und Farbschemata
- `report_generator.py` - PDF- und Excel-Export-Funktionalität

## Installation
```bash
pip install -r requirements.txt
```

## Benötigte Pakete
- `mysql-connector-python==8.2.0` - MySQL Datenbankverbindung
- `reportlab==4.0.7` - PDF-Erstellung
- `openpyxl==3.1.2` - Excel-Export

## Verwendung
```bash
python user_interface.py
```

## Datenbankkonfiguration
Passen Sie die Datenbankverbindung in `user_interface.py` an (Zeile 141-147):
```python
self.db = DatabaseManager(
    host='localhost',
    database='nomina',
    user='root',
    password='ihr_passwort',
    port=3307
)
```

## Datenbankstruktur
- `t001_empleados` - Mitarbeiterstammdaten
- `t002_salarios` - Gehaltsinformationen (jahresabhängig)
- `t003_ingresos_brutos` - Bruttoeinkünfte (jahresabhängig)
- `t004_deducciones` - Abzüge (jahresabhängig)
- `t005_benutzer` - Benutzer für die Anmeldung

## Features im Detail

### Benutzeroberfläche
- Modernes Design mit Karten-Layout
- Farbcodierung für verschiedene Aktionen
- Intuitive Tab-Organisation
- Suchfunktion für Mitarbeiter
- Statusanzeigen und Validierung

### Sicherheit
- Benutzeranmeldung vor dem Zugriff
- Passwortgeschützte Datenbankverbindung
- Sicherheitsabfragen bei Löschoperationen

### Datenverwaltung
- Jahresabhängige Datenverwaltung
- Automatische Validierung bei Eingaben
- Echtzeit-Suche und Filterung
- Historienverfolgung von Änderungen

### Export-Funktionen
- PDF-Berichte mit Formatierung
- Excel-Tabellen für weitere Analyse
- Auswahlmöglichkeit für Datenexport

## Entwicklung
Die Anwendung wurde mit folgenden Prinzipien entwickelt:
- Modularer Code für bessere Wartbarkeit
- Trennung von UI und Geschäftslogik
- Moderne UI-Komponenten
- Umfassende Fehlerbehandlung
- Logging für Debugging-Zwecke
