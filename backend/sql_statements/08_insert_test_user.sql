-- Test Benutzer für E2E Tests
-- Fügt einen Test-Benutzer 'test' mit Passwort 'test' hinzu

INSERT INTO t005_benutzer (benutzername, passwort_hash, voller_name, rolle, aktiv) 
VALUES ('test', '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', 'Test Benutzer', 'admin', TRUE);
