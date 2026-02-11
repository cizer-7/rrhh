-- ============================================================================
-- SCHEMA DE BASE DE DATOS PARA SISTEMA DE NÓMINA
-- Datenbank-Schema für die Gehaltsabrechnung
-- ============================================================================

-- ============================================================================
-- TABLA 1: empleados (Mitarbeiter)
-- Stammdaten der Mitarbeiter
-- ============================================================================
CREATE TABLE IF NOT EXISTS t001_empleados (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    apellido VARCHAR(200) NOT NULL,
    ceco VARCHAR(10),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================================
-- TABLA 2: salarios (Gehälter)
-- Gehaltsinformationen pro Mitarbeiter und Jahr
-- ============================================================================
CREATE TABLE IF NOT EXISTS t002_salarios (
    id_empleado INT NOT NULL,
    anio INT NOT NULL,
    modalidad INT NOT NULL, 
    antiguedad DECIMAL(10,2) DEFAULT 0.00,
    salario_anual_bruto DECIMAL(12,2) NOT NULL,
    salario_mensual_bruto DECIMAL(10,2) NOT NULL,
    atrasos DECIMAL(10,2) DEFAULT 0.00,
    salario_mensual_con_atrasos DECIMAL(10,2) DEFAULT 0.00,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_empleado, anio),
    FOREIGN KEY (id_empleado) REFERENCES t001_empleados(id_empleado) ON DELETE CASCADE
);

DELIMITER $$

CREATE TRIGGER trg_before_insert_t002_salarios
BEFORE INSERT ON t002_salarios
FOR EACH ROW
BEGIN
    DECLARE salario_anual_prev DECIMAL(12,2);
    DECLARE has_previous_year BOOLEAN DEFAULT FALSE;

    -- Check if previous year's salary exists
    SELECT COUNT(*) INTO has_previous_year
    FROM t002_salarios
    WHERE id_empleado = NEW.id_empleado 
      AND anio = NEW.anio - 1;
    
    IF has_previous_year THEN
        SELECT salario_anual_bruto INTO salario_anual_prev
        FROM t002_salarios
        WHERE id_empleado = NEW.id_empleado 
          AND anio = NEW.anio - 1
        LIMIT 1;
    END IF;

    -- Compute salario_mensual_bruto
    SET NEW.salario_mensual_bruto = NEW.salario_anual_bruto / 
        CASE NEW.modalidad 
            WHEN 12 THEN 12 
            WHEN 14 THEN 14 
            ELSE 12 
        END;

    -- Compute atrasos
    IF has_previous_year THEN
        IF salario_anual_prev > 0 THEN
            IF NEW.modalidad = 12 THEN
                SET NEW.atrasos = (NEW.salario_anual_bruto - salario_anual_prev) / 12 * 3;
            ELSEIF NEW.modalidad = 14 THEN
                SET NEW.atrasos = (NEW.salario_anual_bruto - salario_anual_prev) / 14 * 3;
            ELSE
                SET NEW.atrasos = 0;
            END IF;
        ELSE
            -- Previous year salary is 0 or less, treat as no salary
            SET NEW.atrasos = 0;
        END IF;
    ELSE
        -- No previous year data exists (new employee), set atrasos to 0
        SET NEW.atrasos = 0;
    END IF;

    -- Compute salario_mensual_con_atrasos
    SET NEW.salario_mensual_con_atrasos = NEW.salario_mensual_bruto + NEW.atrasos;
END$$

DELIMITER ;


DELIMITER $$

CREATE TRIGGER trg_before_update_t002_salarios
BEFORE UPDATE ON t002_salarios
FOR EACH ROW
BEGIN
    DECLARE salario_anual_prev DECIMAL(12,2);
    DECLARE has_previous_year BOOLEAN DEFAULT FALSE;

    -- Check if previous year's salary exists
    SELECT COUNT(*) INTO has_previous_year
    FROM t002_salarios
    WHERE id_empleado = NEW.id_empleado 
      AND anio = NEW.anio - 1;
    
    IF has_previous_year THEN
        SELECT salario_anual_bruto INTO salario_anual_prev
        FROM t002_salarios
        WHERE id_empleado = NEW.id_empleado 
          AND anio = NEW.anio - 1
        LIMIT 1;
    END IF;

    SET NEW.salario_mensual_bruto = NEW.salario_anual_bruto / 
        CASE NEW.modalidad 
            WHEN 12 THEN 12 
            WHEN 14 THEN 14 
            ELSE 12 
        END;

    -- Compute atrasos
    IF has_previous_year THEN
        IF salario_anual_prev > 0 THEN
            IF NEW.modalidad = 12 THEN
                SET NEW.atrasos = (NEW.salario_anual_bruto - salario_anual_prev) / 12 * 3;
            ELSEIF NEW.modalidad = 14 THEN
                SET NEW.atrasos = (NEW.salario_anual_bruto - salario_anual_prev) / 14 * 3;
            ELSE
                SET NEW.atrasos = 0;
            END IF;
        ELSE
            -- Previous year salary is 0 or less, treat as no salary
            SET NEW.atrasos = 0;
        END IF;
    ELSE
        -- No previous year data exists (new employee), set atrasos to 0
        SET NEW.atrasos = 0;
    END IF;

    SET NEW.salario_mensual_con_atrasos = NEW.salario_mensual_bruto + NEW.atrasos;
END$$

DELIMITER;



-- ============================================================================
-- TABLA 3: ingresos brutos mensuales
-- Monatliches Bruttoeinkommen Informationen pro Mitarbeiter
-- ============================================================================
CREATE TABLE IF NOT EXISTS t003_ingresos_brutos_mensuales (
    id_empleado INT NOT NULL,
    anio INT NOT NULL,
    mes INT NOT NULL,
    ticket_restaurant DECIMAL(10,2) DEFAULT 0.00,
    primas DECIMAL(10,2) DEFAULT 0.00,
    dietas_cotizables DECIMAL(10,2) DEFAULT 0.00,
    horas_extras DECIMAL(10,2) DEFAULT 0.00,
    dias_exentos DECIMAL(10,2) DEFAULT 0.00,
    dietas_exentas DECIMAL(10,2) DEFAULT 0.00,
    seguro_pensiones DECIMAL(10,2) DEFAULT 0.00,
    lavado_coche DECIMAL(10,2) DEFAULT 0.00,
    formacion DECIMAL(10,2) DEFAULT 0.00,
    tickets DECIMAL(10,2) DEFAULT 0.00,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_empleado, anio, mes),
    FOREIGN KEY (id_empleado) REFERENCES t001_empleados(id_empleado) ON DELETE CASCADE
);

-- ============================================================================
-- TABLA 4: deducciones mensuales
-- Monatliche Abzüge Informationen pro Mitarbeiter
-- ============================================================================
CREATE TABLE IF NOT EXISTS t004_deducciones_mensuales (
    id_empleado INT NOT NULL,
    anio INT NOT NULL,
    mes INT NOT NULL,
    seguro_accidentes DECIMAL(10,2) DEFAULT 0.00,
    adelas DECIMAL(10,2) DEFAULT 0.00,
    sanitas DECIMAL(10,2) DEFAULT 0.00,
    gasolina_arval DECIMAL(10,2) DEFAULT 0.00,
    gasolina_ald DECIMAL(10,2) DEFAULT 0.00,
    ret_especie DECIMAL(10,2) DEFAULT 0.00,
    seguro_medico DECIMAL(10,2) DEFAULT 0.00,
    cotizacion_especie DECIMAL(10,2) DEFAULT 0.00,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_empleado, anio, mes),
    FOREIGN KEY (id_empleado) REFERENCES t001_empleados(id_empleado) ON DELETE CASCADE
);

-- ============================================================================
-- TABLA 5: benutzer (Benutzer)
-- Benutzer für die Anwendungsanmeldung
-- ============================================================================
CREATE TABLE IF NOT EXISTS t005_benutzer (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    hash_contraseña VARCHAR(256) NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    rol VARCHAR(50) DEFAULT 'benutzer',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t006_valores_calculados_mensuales (
    id_empleado INT NOT NULL,
    anio INT NOT NULL,
    mes INT NOT NULL,
    total DECIMAL(12,2) DEFAULT 0.00,           -- SUMME(C6:K6) - Summe der relevanten Spalten
    anticipos DECIMAL(10,2) DEFAULT 0.00,       -- D6+ G6 + K6 (Anticipos = bestimmte Spaltenkombination)
    total_especie DECIMAL(10,2) DEFAULT 0.00,   -- E6 + I6 + J6 (Total Especie = bestimmte Spaltenkombination)
    dias_exentos DECIMAL(10,2) DEFAULT 0.00,    -- Exente Tage
    base_imponible DECIMAL(12,2) DEFAULT 0.00,  -- Steuerpflichtige Basis
    dietas_cotizables_total DECIMAL(10,2) DEFAULT 0.00,  -- Gesamt der cotizables Dietas
    dietas_exentas_total DECIMAL(10,2) DEFAULT 0.00,    -- Gesamt der exentas Dietas
    tickets_total DECIMAL(10,2) DEFAULT 0.00,    -- Gesamt der Tickets
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_empleado, anio, mes),
    FOREIGN KEY (id_empleado) REFERENCES t001_empleados(id_empleado) ON DELETE CASCADE
 );

CREATE TABLE IF NOT EXISTS t007_bearbeitungslog (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_login VARCHAR(50) NOT NULL,
    id_empleado INT NULL,
    anio INT NULL,
    mes INT NULL,
    aktion VARCHAR(100) NOT NULL,
    objekt VARCHAR(100) NULL,
    details JSON NULL,
    INDEX idx_t007_empleado_fecha (id_empleado, fecha),
    INDEX idx_t007_usuario_fecha (usuario_login, fecha),
    FOREIGN KEY (id_empleado) REFERENCES t001_empleados(id_empleado) ON DELETE SET NULL,
    FOREIGN KEY (usuario_login) REFERENCES t005_benutzer(nombre_usuario)
 );

 CREATE TABLE IF NOT EXISTS t008_empleado_fte (
     id_empleado INT NOT NULL,
     anio INT NOT NULL,
     mes INT NOT NULL,
     porcentaje DECIMAL(5,2) NOT NULL,
     fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     PRIMARY KEY (id_empleado, anio, mes),
     INDEX idx_t008_empleado_fecha (id_empleado, anio, mes),
     FOREIGN KEY (id_empleado) REFERENCES t001_empleados(id_empleado) ON DELETE CASCADE
 );
