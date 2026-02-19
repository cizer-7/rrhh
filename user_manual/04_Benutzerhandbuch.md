# 📖 Benutzerhandbuch - Digitalisierung Gehaltsabrechnung

## 📋 Inhaltsverzeichnis

1. [🚀 Erste Schritte](#-erste-schritte)
2. [🔐 Anmeldung & Sicherheit](#-anmeldung--sicherheit)
3. [👤 Mitarbeiterverwaltung](#-mitarbeiterverwaltung)
4. [💰 Gehaltsabrechnung](#-gehaltsabrechnung)
5. [📊 Reporting & Export](#-reporting--export)
6. [⚙️ Systemeinstellungen](#️-systemeinstellungen)
7. [❓ Häufige Fragen](#-häufige-fragen)

---

## 🚀 Erste Schritte

### Systemanforderungen
- **Browser:** Chrome, Firefox, Safari, Edge (aktuellste Version)
- **Internet:** Stabile Internetverbindung
- **Bildschirmauflösung:** Mindestens 1024x768

### Zugriff auf das System
1. **URL im Browser öffnen:** `http://localhost:3000` (oder die von Ihrem Administrator bereitgestellte URL)
2. **Anmeldedaten eingeben:** Benutzername und Passwort
3. **Anmelden:** Auf "Anmelden" klicken

---

## 🔐 Anmeldung & Sicherheit

### Login-Prozess
1. **Benutzername eingeben:** Ihren zugewiesenen Benutzernamen
2. **Passwort eingeben:** Ihr persönliches Passwort
3. **Anmelden:** Klicken Sie auf den "Anmelden" Button

### 🔑 Passwort vergessen
Wenn Sie Ihr Passwort vergessen haben:

1. **"Passwort vergessen?" klicken:** Auf der Login-Seite
2. **Benutzername eingeben:** Ihren registrierten Benutzernamen
3. **Email abwarten:** Sie erhalten eine Email mit Reset-Link
4. **Link klicken:** Innerhalb von 1 Stunde auf den Link in der Email klicken
5. **Neues Passwort setzen:** Sicher neues Passwort eingeben
6. **Bestätigen:** Passwort wiederholen und bestätigen

**⏰ Wichtig:** Reset-Links sind nur 1 Stunde gültig!

### Sicherheitsfunktionen
- **JWT-Token:** Sichere Sitzungsverwaltung
- **Passwort-Verschlüsselung:** Schutz Ihrer Zugangsdaten
- **Automatischer Logout:** Bei Inaktivität werden Sie automatisch abgemeldet
- **Sichere Reset-Tokens:** Kryptographisch sichere Passwort-Reset-Funktion

### Passwort vergessen - Detaillierte Schritte

#### Schritt 1: Reset anfordern
- Auf Login-Seite "Passwort vergessen?" klicken
- Benutzername eingeben und absenden
- System sendet automatisch Email mit Reset-Link

#### Schritt 2: Email prüfen
- Email-Eingang prüfen (auch Spam-Ordner)
- Reset-Link innerhalb 1 Stunde klicken
- Link führt zur sicheren Passwort-Reset-Seite

#### Schritt 3: Neues Passwort setzen
- Neues Passwort eingeben (mindestens 8 Zeichen)
- Passwort wiederholen zur Bestätigung
- "Passwort aktualisieren" klicken

#### Schritt 4: Bestätigung
- Erfolgsmeldung erscheint
- Mit neuen Passwort anmelden

### 🔐 Technische Details der Passwort-Reset-Funktion

**Sicherheitsfeatures:**
- **Kryptographisch sichere Tokens:** 32-Byte URL-safe Tokens
- **Zeitbegrenzung:** Tokens verfallen nach 1 Stunde automatisch
- **Einmalige Verwendung:** Jeder Token kann nur einmal verwendet werden
- **Sichere Übertragung:** HTTPS-Verschlüsselung erforderlich

**Email-Konfiguration (für Administratoren):**
- **SMTP-Server:** Unterstützt Gmail und andere SMTP-Provider
- **Authentifizierung:** App-Passwörter für 2-Faktor-Authentifizierung
- **Anpassung:** Email-Texte und Absender konfigurierbar

### Passwort vergessen - Fehlerbehandlung

**Email nicht erhalten?**
- Spam-Ordner prüfen
- Benutzername korrekt eingegeben?
- Firewall blockiert keine Emails?

**Link ungültig?**
- Link älter als 1 Stunde?
- Link bereits verwendet?
- Neu anfordern falls nötig

---

## 👤 Mitarbeiterverwaltung

### Mitarbeiterübersicht
**Zugriff:** Hauptmenü → "Mitarbeiter"

**Funktionen:**
- **Suche:** Schnelle Suche nach Namen, Mitarbeiter-ID, CECO oder Kategorie
- **Filter:** Filtern nach Abteilung, Status, Kategorie (Techniker/Office)
- **Sortierung:** Klickbare Spaltenüberschriften mit 3-Wege-Sortierung:
  - **ID:** Numerische Sortierung
  - **Name:** Alphabetische Sortierung (Nachname, Vorname)
  - **CECO:** Alphabetische Sortierung
  - **Status:** Aktiv zuerst, dann Inaktiv
  - **Kategorie:** Alphabetische Sortierung
- **Visuelle Indikatoren:** Pfeilsymbole (↑/↓) zeigen aktuelle Sortierrichtung

### Neuen Mitarbeiter anlegen
1. **"Neuer Mitarbeiter" klicken**
2. **Stammdaten eingeben:**
   - Vollständiger Name
   - Mitarbeiter-ID (falls vorhanden)
   - Kostenstelle (CECO)
   - **Kategorie:** Techniker oder Office auswählen
   - Abteilung
   - Position
   - Kontaktdaten
3. **Speichern:** Klicken Sie auf "Speichern"

### Mitarbeiter bearbeiten
1. **Mitarbeiter auswählen:** In der Übersicht klicken
2. **Daten ändern:** Gewünschte Felder aktualisieren
3. **Speichern:** Änderungen mit "Speichern" bestätigen

### Mitarbeiter löschen
1. **Mitarbeiter auswählen**
2. **"Löschen" klicken**
3. **Bestätigen:** Löschvorgang im Dialog bestätigen

---

## 💰 Gehaltsabrechnung

### Gehaltsübersicht
**Zugriff:** Mitarbeiter → "Gehaltsdaten"

**Angezeigte Informationen:**
- **Grundgehalt:** Basisgehalt für ausgewähltes Jahr
- **Modalität:** 12 oder 14 Monatsgehälter
- **Antigüedad:** Dienstalterszulage
- **Gesamtgehalt:** Berechnetes Jahresgehalt

### Gehalt anlegen/bearbeiten
1. **Mitarbeiter auswählen**
2. **Jahr wählen:** Dropdown für Jahresauswahl
3. **Gehaltsdaten eingeben:**
   - Grundgehalt
   - Gehaltsmodalität
   - Antigüedad-Zulage
4. **Speichern:** Mit "Speichern" bestätigen

### Bruttoeinkünfte
**Zugugriff:** Mitarbeiter → "Bruttoeinkünfte"

**Einkommensarten:**
- **Ticket Restaurant:** Monatliche Restauranttickets
- **Primas:** Einmalige oder regelmäßige Prämien
- **Weitere Einkünfte:** Zusätzliche Vergütungen

### Abzüge
**Zugriff:** Mitarbeiter → "Abzüge"

**Abzugsarten:**
- **Sozialversicherung:** Pflichtversicherungsbeiträge
- **Steuern:** Lohnsteuer und weitere Abgaben
- **Weitere Abzüge:** Sonstige Abzüge

---

## 📊 Reporting & Export

### Excel-Export
**Funktionen:**
- **Jahresexport:** Alle Gehaltsdaten für ein Jahr
- **Mitarbeiterliste:** Stamm- und Kontaktdaten
- **Gehaltsübersicht:** Zusammenfassende Gehaltsstatistik

**Schritte:**
1. **Bericht auswählen:** Im Hauptmenü "Export" wählen
2. **Parameter festlegen:** Jahr, Mitarbeiter, etc.
3. **Export starten:** "Exportieren" klicken
4. **Download:** Datei wird automatisch heruntergeladen

### Berichte anzeigen
**Verfügbare Berichte:**
- **Mitarbeiterstatistik:** Anzahl nach Abteilung
- **Gehaltsstatistik:** Durchschnittsgehälter
- **Jahresübersicht:** Gehaltsentwicklung

---

## ⚙️ Systemeinstellungen

### Persönliche Einstellungen
**Zugriff:** Profil → "Einstellungen"

**Optionen:**
- **Sprache:** Deutsch/Englisch
- **Datumsformat:** Verschiedene Formate wählbar
- **Design:** Hell/Dunkel (falls verfügbar)

### Benutzerverwaltung (nur Administratoren)
**Zugriff:** Administration → "Benutzer"

**Funktionen:**
- **Benutzer anlegen:** Neue Benutzerkonten erstellen
- **Rollen zuweisen:** Admin/User Berechtigungen
- **Passwort zurücksetzen:** Passwörter neu setzen

---

## ❓ Häufige Fragen

### Allgemeine Fragen

**F: Was tun bei vergessenen Passwort?**
A: Kontaktieren Sie Ihren Systemadministrator.

**F: Warum kann ich mich nicht anmelden?**
A: Überprüfen Sie Benutzername und Passwort. Achten Sie auf Groß-/Kleinschreibung.

**F: Wie lange bin ich angemeldet?**
A: Die Sitzung läuft nach 8 Stunden Inaktivität automatisch ab.

### Mitarbeiterverwaltung

**F: Kann ich Mitarbeiterdaten im Nachhinein ändern?**
A: Ja, alle Stammdaten können jederzeit bearbeitet werden.

**F: Was passiert bei der Löschung eines Mitarbeiters?**
A: Alle Daten werden archiviert und aus der aktiven Ansicht entfernt.

### Gehaltsabrechnung

**F: Wie werden die Atrasos berechnet?**
A: Atrasos werden automatisch basierend auf dem Vorjahresgehalt berechnet.

**F: Kann ich Gehälter rückwirkend ändern?**
A: Ja, aber Änderungen müssen dokumentiert und genehmigt werden.

### Export & Berichte

**F: In welchem Format werden Daten exportiert?**
A: Standardmäßig als Excel-Datei (.xlsx).

**F: Kann ich benutzerdefinierte Berichte erstellen?**
A: Kontaktieren Sie Ihren Administrator für spezielle Report-Anforderungen.

---

## 📞 Support

### Technische Probleme
Bei technischen Problemen wenden Sie sich bitte an:
- **IT-Support:** [E-Mail/Telefon des Supports]
- **Systemadministrator:** [Kontaktdaten]

### Schulungen
Für Schulungen und Schulungsunterlagen:
- **Personalabteilung:** [Kontaktdaten]
- **IT-Schulung:** [Schulungszeiten und Orte]

---

## 📝 Tipps & Tricks

### Effiziente Bedienung
- **Tastaturkürzel:** Verwenden Sie Tab für Navigation
- **Suche:** Nutzen Sie die Schnellsuche für schnellen Zugriff
- **Filter:** Kombinieren Sie mehrere Filter für präzise Ergebnisse
- **Sortierung:** Klicken Sie auf Spaltenüberschriften für 3-Wege-Sortierung (↑→↓→keine Sortierung)
- **Kategorie-Filter:** Nutzen Sie Kategorie-Filter für gezielte Mitarbeiterauswahl

### Datenqualität
- **Regelmäßige Updates:** Halten Sie Mitarbeiterdaten aktuell
- **Plausibilitätsprüfungen:** Überprüfen Sie Gehaltsdaten auf Plausibilität
- **Backups:** Regelmäßige Datensicherungen werden automatisch durchgeführt

---

*Nächste Dokumente: [Systemübersicht](01_Übersicht.md) | [Datenbank-Dokumentation](02_Datenbank.md) | [Testing-Handbuch](03_Testing.md)*
