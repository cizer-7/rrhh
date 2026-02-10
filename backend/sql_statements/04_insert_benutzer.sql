-- ============================================================================
-- INSERT BENUTZER
-- Neue Benutzer für die Anwendung
-- ============================================================================

-- NOTE: Das Passwort "Test" wird hier als Klartext angezeigt.
-- In der Produktion sollte das Passwort gehasht werden (z.B. mit bcrypt)
-- Für diesen Test verwenden wir SHA256-Hash von "Test"

INSERT INTO t005_benutzer (nombre_usuario, hash_contraseña, nombre_completo, rol, activo) VALUES
('Gerard.Cizer@krones.es', SHA2('Test', 256), 'Gerard Cizer', 'benutzer', TRUE),
('xforne@krones.es', SHA2('Test', 256), 'Xavier Forne', 'benutzer', TRUE),
('Michelle.Cruz@krones.es', SHA2('Test', 256), 'Michelle Cruz', 'benutzer', TRUE),
('Guillermo.Gonzalez@krones.es', SHA2('Test', 256), 'Guillermo Gonzalez', 'benutzer', TRUE);
