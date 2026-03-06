# 📚 Benutzerhandbuch - Digitalisierung der Gehaltsabrechnung

## 📋 Inhaltsverzeichnis

1. [🎯 Einführung](#-einführung)
2. [🚀 Erste Schritte](#-erste-schritte)
3. [🔐 Authentifizierung und Sicherheit](#-authentifizierung-und-sicherheit)
4. [👥 Mitarbeiterverwaltung](#-mitarbeiterverwaltung)
5. [💳 Gehaltsverwaltung](#-gehaltsverwaltung)
6. [📊 Import und Export](#-import-und-export)
7. [⚙️ Erweiterte Funktionen](️-erweiterte-funktionen)
8. [❓ Häufig gestellte Fragen](#-häufig-gestellte-fragen)

---

## 🎯 Einführung

### Was ist das System zur Digitalisierung der Gehaltsabrechnung?

Das System zur Digitalisierung der Gehaltsabrechnung ist eine moderne Webanwendung für die Verwaltung von Mitarbeitern und die Verarbeitung von Gehaltsabrechnungen. Es ersetzt traditionelle Desktop-Anwendungen durch eine webbasierte Lösung.

### Hauptfunktionen

- **Mitarbeiterverwaltung:** Vollständige CRUD-Operationen für Stammdaten
- **Gehaltsabrechnung:** Berechnung und Gehaltsmanagement
- **Sichere Authentifizierung:** Login mit JWT und Passwort-Reset
- **Import/Export:** Integration mit Excel und anderen Formaten
- **Carry Over:** Übertragung von Beträgen zwischen Perioden
- **FTE-Management:** Kontrolle von Vollzeitäquivalenten

### Systemarchitektur

- **Frontend:** Next.js 16 mit TypeScript und Tailwind CSS
- **Backend:** Python Flask mit MySQL
- **Datenbank:** MySQL mit optimierten Tabellen
- **API:** RESTful mit JWT-Authentifizierung

---

## 🚀 Erste Schritte

### Systemanforderungen

#### Unterstützte Browser
- **Chrome:** Version 90 oder höher
- **Firefox:** Version 88 oder höher
- **Safari:** Version 14 oder höher
- **Edge:** Version 90 oder höher

#### Systemzugriff

1. **Haupt-URL:** Auf die Webanwendung zugreifen
2. **Login:** Anmeldedaten eingeben
3. **Dashboard:** Auf das Hauptpanel zugreifen

### Hauptseite

Die Hauptseite zeigt drei Hauptmodule:

- **👥 Mitarbeiterverwaltung:** Verwaltung von Stammdaten
- **💰 Gehaltsabrechnung:** Gehaltsmanagement
- **📊 Berichte und Export:** Analyse-Tools

---

## 🔐 Authentifizierung und Sicherheit

### Anmeldung

#### Authentifizierungsprozess

1. **Anmeldedaten:** Benutzername und Passwort
2. **Validierung:** Überprüfung in der Datenbank
3. **JWT Token:** Generierung des Sitzungstokens
4. **Zugriff:** Weiterleitung zum Dashboard

### Passwort-Wiederherstellung

#### Wiederherstellungsablauf

1. **Anforderung:** "Passwort vergessen?"
2. **E-Mail:** Wiederherstellungslink senden
3. **Validierung:** Token überprüfen (24 Stunden gültig)
4. **Aktualisierung:** Neues Passwort festlegen

#### Passwort-Anforderungen

- **Mindestlänge:** 8 Zeichen
- **Komplexität:** Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen
- **Sicherheit:** Keine Wiederverwendung früherer Passwörter

---

## 👥 Mitarbeiterverwaltung

### Mitarbeiterübersicht

#### Mitarbeitertabelle

Die Oberfläche zeigt eine Tabelle mit:

- **Mitarbeiter-ID:** Eindeutige Kennung
- **Name:** Vollständiger Mitarbeitername
- **CECO:** Kostenstelle
- **Kategorie:** "Techniker" oder "Office"
- **Aktiv:** Mitarbeiterstatus
- **Eintrittsdatum:** Vertragsbeginn

#### Verfügbare Funktionen

- **Suche:** Nach Name, Nachname, CECO
- **Filter:** Nach Kategorie, Aktivstatus
- **Sortierung:** Nach ID, Name, Datum
- **Paginierung:** Navigation durch Ergebnisse

### Neuen Mitarbeiter erstellen

#### Erstellungsformular

**Pflichtfelder:**
- Name und Nachname
- CECO (Kostenstelle)
- Kategorie (Techniker/Office)
- DNI

**Optionale Felder:**
- Eintrittsdatum
- Declaración
- Aktivstatus

**Prozess:**
1. **Personaldaten:** Grundlegende Informationen ausfüllen
2. **Arbeitsdaten:** CECO, Kategorie, Eintrittsdatum
3. **Validierung:** System überprüft erforderliche Daten
4. **Erstellung:** In Datenbank speichern

### Mitarbeiter bearbeiten

#### Datenänderung

**Bearbeitbare Felder:**
- Name und Nachname
- CECO
- Kategorie
- Status (Aktiv/Inaktiv)
- Eintrittsdatum
- Erklärung
- DNI

**Einschränkungen:**
- Mitarbeiter-ID nicht änderbar
- Format-Validierungen angewendet

### Mitarbeiter löschen

#### Löschprozess

- **Bestätigung:** Bestätigungsdialog
- **Logisches Löschen:** Als inaktiv markieren
- **Integrität:** Historische Daten beibehalten

### Mitarbeiterkategorien

#### Techniker
- Technisches Fachpersonal
- Zugriff auf technische Funktionen
- Spezifische Konfiguration

#### Office
- Verwaltungspersonal
- Zugriff auf Bürokfunktionen
- Administrative Konfiguration

---

## 💳 Gehaltsverwaltung

### Gehaltsinformationen

#### Gehaltsstruktur

**Hauptdaten:**
- **Jahr:** Gehaltsperiode
- **Modalität:** 12 oder 14 Zahlungen
- **Jahresbruttogehalt:** Zu versteuerndes Einkommen
- **Dienstalter:** Zulage für Dienstalter
- **Weitere Konzepte:** Zusätzliche Zulagen

#### Jahresweise Verwaltung

- **Erstellung:** Jahresgehalt festlegen
- **Aktualisierung:** Gehaltsdaten ändern
- **Löschung:** Gehaltsdatensatz entfernen

### FTE (Full-Time Equivalent)

#### Prozent-Management

**Funktionalität:**
- **Prozentsatz:** Teilzeit/Vollzeit (0-100%)
- **Periode:** Verwaltung nach Jahr und Monat
- **Aktualisierung:** Prozentsätze ändern
- **Berechnung:** Automatische Anwendung in Gehaltsabrechnung

#### Operationen

- **Abfrage:** FTE nach Periode anzeigen
- **Aktualisierung:** Prozentsatz ändern
- **Löschung:** FTE-Datensatz entfernen

### Einkünfte

#### Einkommensverwaltung

**Einkommensarten:**
- **Bruttoeinkünfte:** Monatliche Einkünfte
- **Verdienst:** Angerechnete Konzepte
- **Zulagen:** Zusätzliche Zahlungen

#### Periodenoperationen

- **Jährlich:** Jährliche Einkommenskonfiguration
- **Monatlich:** Monatliche Details
- **Aktualisierung:** Beträge ändern

### Abzüge

#### Abzugsverwaltung

**Abzugsarten:**
- **Sozialversicherung:** Pflichtbeiträge
- **IRPF:** Steuerabzüge
- **Sonstige:** Spezifische Abzüge

#### Operationen

- **Konfiguration:** Prozentsätze festlegen
- **Aktualisierung:** Abzüge ändern
- **Berechnung:** Automatische Anwendung

---

## 📊 Import und Export

### Datenimport

#### Stunden und Diäten

**Funktionalität:**
- **Excel-Datei:** Hochladen von Dateien mit Stunden/Diäten
- **Validierung:** Formatüberprüfung
- **Verarbeitung:** Automatischer Import
- **Bestätigung:** Importergebnisse

#### Benzin-Import

- **Excel-Datei:** Benzinkosten laden
- **Validierung:** Struktur prüfen
- **Verarbeitung:** Daten importieren
- **Bericht:** Operationsergebnisse

#### Kupon-Spezifikation

- **Import:** Spezifische Kupons laden
- **Validierung:** Daten überprüfen
- **Verarbeitung:** In System integrieren

### Datenexport

#### Excel-Export

**Exportarten:**
- **Jährlich:** Alle Daten des Jahres
- **Monatlich:** Daten eines bestimmten Monats
- **Pro Mitarbeiter:** Individuelle Daten

**Verfügbare Formate:**
- **Excel:** .xlsx Format mit Formeln
- **IRPF:** Steuerlicher Bericht
- **Gehaltskonten:** Buchhalterisches Format

#### Exportprozess

1. **Auswahl:** Periode und Typ wählen
2. **Generierung:** Datei erstellen
3. **Download:** Generierte Datei herunterladen
4. **Bestätigung:** Export überprüfen

---

## ⚙️ Erweiterte Funktionen

### Carry Over

#### Betragsübertragung

**Konzept:**
- **Quelle:** Quellperiode (Jahr/Monat)
- **Ziel:** Anwendungsperiode
- **Konzept:** Betragsart
- **Betrag:** Zu übertragender Betrag

#### Operationen

- **Erstellung:** Neuer Carry Over
- **Abfrage:** Bestehende Carry Overs anzeigen
- **Löschung:** Carry Over entfernen
- **Anwendung:** In Gehaltsabrechnung anwenden

### Bearbeitungshistorie

#### Änderungsverfolgung

**Funktionalität:**
- **Protokoll:** Alle Datenänderungen
- **Timestamp:** Änderungsdatum und -uhrzeit
- **Benutzer:** Wer die Änderung vorgenommen hat
- **Feld:** Geändertes Feld

#### Historie-Abfrage

- **Pro Mitarbeiter:** Individueller Verlauf
- **Global:** Alle Änderungen
- **Zeitraum:** Nach Periode filtern

### Salary Copy Manager

#### Gehaltskopie

**Funktionalität:**
- **Quelle:** Gehalt des Basisjahres
- **Ziel:** Zieljahr
- **Anpassungen:** Prozentuale Änderungen
- **Validierung:** Datenüberprüfung

---

## ❓ Häufig gestellte Fragen

### Zugriffsfragen

**F: Was mache ich, wenn ich mein Passwort vergessen habe?**
A: Verwenden Sie die Funktion "Passwort vergessen" und folgen Sie den Anweisungen per E-Mail.

**F: Kann ich von mehreren Geräten aus zugreifen?**
A: Ja, aber nur eine aktive Sitzung pro Benutzer.

**F: Warum läuft meine Sitzung ab?**
A: Aus Sicherheitsgründen haben Sitzungen eine Inaktivitätszeitbegrenzung.

### Mitarbeiterfragen

**F: Kann ich die Mitarbeiter-ID ändern?**
A: Nein, die ID ist eindeutig und nicht änderbar zur Wahrung der Datenintegrität.

**F: Was bedeutet die Kategorie "Techniker"?**
A: Es handelt sich um technisches Personal mit Zugang zu spezialisierten Funktionen.

**F: Wie wird der FTE berechnet?**
A: Es ist der Prozentsatz der Vollzeitbeschäftigung, der proportionale Berechnungen beeinflusst.

### Gehaltsfragen

**F: Was ist der Unterschied zwischen 12 und 14 Zahlungen?**
A: 12 Zahlungen sind reguläre Monatszahlungen, 14 enthalten zusätzliche Zahlungen.

**F: Kann ich Gehälter aus Vorjahren ändern?**
A: Ja, mit entsprechenden Berechtigungen und Systemvalidierung.

**F: Wie werden Abzüge angewendet?**
A: Automatisch entsprechend der Konfiguration von Prozentsätzen und Tabellen.

### Import/Export-Fragen

**F: Welches Format müssen Importdateien haben?**
A: Excel mit spezifischer Struktur je nach Datentyp.

**F: Kann ich Daten mehrerer Mitarbeiter auf einmal exportieren?**
A: Ja, Exporte können jährlich oder monatlich für alle Mitarbeiter erfolgen.

**F: Was enthält der IRPF-Bericht?**
A: Steuerliche Daten für die Steuererklärung.

### Technische Fragen

**F: Muss ich Software installieren?**
A: Nein, es ist eine Webanwendung, zugänglich über Browser.

**F: Welche Browser sind kompatibel?**
A: Chrome, Firefox, Safari, Edge in aktuellen Versionen.

**F: Sind meine Daten sicher?**
A: Ja, mit SSL-Verschlüsselung und JWT-Authentifizierung.

---

## 📞 Technischer Support

### Kontakt

**Systemadministrator:**
- **Direktkontakt:** Systemadministrator für Support-Anfragen

### Zusätzliche Ressourcen

**Dokumentation:**
- Installationshandbuch
- API-Leitfaden
- Best Practices

---

**Handbuchversion:** 2.1  
**Letzte Aktualisierung:** März 2026  
**Basiert auf:** Aktueller Softwareversion

---

*Dieses Handbuch spiegelt die aktuell implementierten Funktionen im System wider.*
