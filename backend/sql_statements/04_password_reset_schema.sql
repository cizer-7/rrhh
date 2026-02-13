-- ============================================================================
-- TABLA 6: password_reset_tokens
-- Tokens für Passwort-Reset-Funktionalität
-- ============================================================================
CREATE TABLE IF NOT EXISTS t009_password_reset_tokens (
    id_token INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL,
    token VARCHAR(256) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nombre_usuario) REFERENCES t005_benutzer(nombre_usuario) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_usuario (nombre_usuario),
    INDEX idx_expires (expires_at)
);
