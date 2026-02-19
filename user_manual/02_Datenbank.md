# 🗄️ Datenbank-Dokumentation - Gehaltsabrechnungssystem

## 📋 Inhaltsverzeichnis

1. [📊 Datenbankstruktur](#-datenbankstruktur)
2. [⚡ Installation & Setup](#-installation--setup)
3. [🔧 Trigger & Automatisierung](#-trigger--automatisierung)
4. [📅 Monatliche Tabellen](#-monatliche-tabellen)
5. [👤 Test-Benutzer](#-test-benutzer)

---

## 📊 Datenbankstruktur

### Haupttabellen

#### `t001_empleados` - Mitarbeiterstammdaten
- **ID:** Eindeutige Mitarbeiteridentifikation
- **Name:** Vollständiger Mitarbeitername
- **CECO:** Kostenstellennummer
- **Kategorie:** Mitarbeiterkategorie (Techniker, Office)
- **Weitere Felder:** Kontaktinformationen, Abteilung, Position

#### `t002_salarios` - Gehaltsinformationen
- **Mitarbeiter-ID:** Verknüpfung zu Mitarbeitern
- **Jahr:** Jahresabhängige Gehälter
- **Grundgehalt:** Basisgehalt
- **Modalität:** 12 oder 14 Monatsgehälter
- **Antigüedad:** Dienstalterszulage

#### `t003_ingresos_brutos` - Bruttoeinkünfte
- **Mitarbeiter-ID:** Verknüpfung zu Mitarbeitern
- **Jahr:** Jahresabhängige Einkünfte
- **Ticket Restaurant:** Restauranttickets
- **Primas:** Prämien und Boni
- **Weitere Einkünfte:** Zusätzliche Vergütungen

#### `t004_deducciones` - Abzüge
- **Mitarbeiter-ID:** Verknüpfung zu Mitarbeitern
- **Jahr:** Jahresabhängige Abzüge
- **Sozialversicherung:** Sozialversicherungsbeiträge
- **Weitere Abzüge:** Steuern und andere Abzüge

#### `t005_benutzer` - Benutzerverwaltung
- **Benutzername:** Login-Name
- **Passwort-Hash:** Verschlüsseltes Passwort
- **Rolle:** Benutzerrolle (admin, user)
- **Aktiv:** Account-Status

#### `t009_password_reset_tokens` - Passwort-Reset-Tokens
- **nombre_usuario:** Verknüpfung zum Benutzer
- **token:** Eindeutiger Reset-Token
- **email:** Email-Adresse des Benutzers
- **expires_at:** Ablaufzeitpunkt (1 Stunde)
- **used:** Token bereits verwendet?
- **created_at:** Erstellungszeitpunkt

---

## ⚡ Installation & Setup

### Voraussetzungen
- MySQL Server 8.0+
- Python mysql-connector-python
- Zugriffsrechte für Datenbankerstellung

### Installationsschritte

1. **Datenbank erstellen**
   ```sql
   CREATE DATABASE nomina;
   ```

2. **SQL-Skripte ausführen (Reihenfolge beachten)**
   ```bash
   # Phase 1: Grundschema
   mysql -u root -p nomina < 01_schema.sql
   mysql -u root -p nomina < 02_triggers.sql
   
   # Phase 2: Testdaten
   mysql -u root -p nomina < 03_insert_employees.sql
   mysql -u root -p nomina < 04_insert_salaries.sql
   mysql -u root -p nomina < 05_insert_income.sql
   
   # Phase 3: Passwort-Reset-Funktionalität
   mysql -u root -p nomina < 04_password_reset_schema.sql
   ```

### 🔐 Email-Konfiguration für Passwort-Reset

Für die Passwort-Reset-Funktionalität muss Email konfiguriert werden:

**`.env` Datei im Backend-Verzeichnis erstellen:**
```bash
# Email-Konfiguration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ihre-email@gmail.com
SMTP_PASSWORD=ihr-app-passwort
FROM_EMAIL=ihre-email@gmail.com
FRONTEND_URL=http://localhost:3000
```

**Gmail-Konfiguration:**
1. **2-Faktor-Authentifizierung** aktivieren
2. **App-Passwort** erstellen (nicht normales Passwort)
3. App-Passwort in Konfiguration verwenden

---

## 🔧 Trigger & Automatisierung

### Automatische Berechnungen

#### Gehaltstrigger
- **Monatsgehalt:** Automatische Berechnung aus Jahresgehalt
- **Antigüedad:** Dienstalterszulage basierend auf Betriebszugehörigkeit
- **Atrasos:** Berechnung von Rückständen basierend auf Vorjahresdaten

#### Datenintegrität
- **Referenzielle Integrität:** Sicherstellung konsistenter Datenbeziehungen
- **Validierung:** Prüfung von Geschäftsvorfallregeln
- **Performance:** Optimierte Indizes für schnelle Abfragen

---

## 📅 Monatliche Tabellen (Erweiterte Funktionalität)

### Zweck
- **Detaillierte Monatsabrechnung:** Individuelle Bearbeitung pro Monat
- **Flexibilität:** Monatliche Anpassungen von Zuschlägen und Abzügen
- **Historie:** Vollständige Nachverfolgung aller Änderungen

### Automatisierung
- **Neue Mitarbeiter:** Automatische Erstellung von 12 Monatsdatensätzen
- **Datenmigration:** Kopierung Jahresdaten in monatliche Struktur
- **Kompatibilität:** Beibehaltung der ursprünglichen Jahresdaten

---

## 👤 Test-Benutzer

### Standard-Testzugang
Für Entwicklung und Testing steht ein Standard-Benutzer zur Verfügung:

- **Benutzername:** `test`
- **Passwort:** `test`
- **Rolle:** `admin`
- **Verwendung:** E2E-Tests, Entwicklung, Demonstration

### Weitere Testbenutzer
Zusätzliche Testbenutzer können in der `t005_benutzer` Tabelle angelegt werden:
```sql
INSERT INTO t005_benutzer (benutzername, passwort_hash, rolle, aktiv)
VALUES ('neuer_user', SHA2('passwort', 256), 'user', 1);
```

---

## 📞 Wartung & Support

### Regelmäßige Wartung
- **Backup:** Tägliche Datenbank-Sicherungen
- **Performance:** Überwachung der Abfrageperformance
- **Indizes:** Regelmäßige Optimierung der Datenbankindizes

### Fehlerbehebung
- **Trigger-Fehler:** Überprüfung der Trigger-Logs
- **Datenintegrität:** Regelmäßige Konsistenzprüfungen
- **Performance:** Analyse langsamer Abfragen

---

*Nächste Dokumente: [Systemübersicht](01_Übersicht.md) | [Testing-Handbuch](03_Testing.md) | [Benutzerhandbuch](04_Benutzerhandbuch.md)*
