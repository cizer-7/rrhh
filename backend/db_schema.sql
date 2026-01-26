-- ============================================================================
-- SCHEMA DE BASE DE DATOS PARA SISTEMA DE NÓMINA
-- Datenbank-Schema für die Gehaltsabrechnung
-- ============================================================================

-- ============================================================================
-- TABLA 1: empleados (Mitarbeiter)
-- Stammdaten der Mitarbeiter
-- ============================================================================
CREATE TABLE t001_empleados (
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
CREATE TABLE t002_salarios (
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
        IF NEW.modalidad = 12 THEN
            SET NEW.atrasos = (NEW.salario_anual_bruto - salario_anual_prev) / 12 * 3;
        ELSEIF NEW.modalidad = 14 THEN
            SET NEW.atrasos = (NEW.salario_anual_bruto - salario_anual_prev) / 14 * 3;
        ELSE
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
        IF NEW.modalidad = 12 THEN
            SET NEW.atrasos = (NEW.salario_anual_bruto - salario_anual_prev) / 12 * 3;
        ELSEIF NEW.modalidad = 14 THEN
            SET NEW.atrasos = (NEW.salario_anual_bruto - salario_anual_prev) / 14 * 3;
        ELSE
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
-- TABLA 3: ingresos brutos
-- Bruttoeinkommen Informationen pro Mitarbeiter
-- ============================================================================
CREATE TABLE t003_ingresos_brutos (
    id_empleado INT NOT NULL,
    anio INT NOT NULL,
    ticket_restaurant DECIMAL(10,2) DEFAULT 0.00,
    primas DECIMAL(10,2) DEFAULT 0.00,
    dietas_cotizables DECIMAL(10,2) DEFAULT 0.00,
    horas_extras DECIMAL(10,2) DEFAULT 0.00,
    dias_exentos DECIMAL(10,2) DEFAULT 0.00,
    dietas_exentas DECIMAL(10,2) DEFAULT 0.00,
    seguro_pensiones DECIMAL(10,2) DEFAULT 0.00,
    lavado_coche DECIMAL(10,2) DEFAULT 0.00,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_empleado, anio),
    FOREIGN KEY (id_empleado) REFERENCES t001_empleados(id_empleado) ON DELETE CASCADE
);

-- ============================================================================
-- TABLA 4: deducciones
-- Abzüge Informationen pro Mitarbeiter
-- ============================================================================
CREATE TABLE t004_deducciones (
    id_empleado INT NOT NULL,
    anio INT NOT NULL,
    seguro_accidentes DECIMAL(10,2) DEFAULT 0.00,
    adelas DECIMAL(10,2) DEFAULT 0.00,
    sanitas DECIMAL(10,2) DEFAULT 0.00,
    gasolina_arval DECIMAL(10,2) DEFAULT 0.00,
    cotizacion_especie DECIMAL(10,2) DEFAULT 0.00,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_empleado, anio),
    FOREIGN KEY (id_empleado) REFERENCES t001_empleados(id_empleado) ON DELETE CASCADE
    
);


-- ============================================================================
-- TABLA 5: benutzer (Benutzer)
-- Benutzer für die Anwendungsanmeldung
-- ============================================================================
CREATE TABLE t005_benutzer (
    id_benutzer INT AUTO_INCREMENT PRIMARY KEY,
    benutzername VARCHAR(50) NOT NULL UNIQUE,
    passwort_hash VARCHAR(256) NOT NULL,
    voller_name VARCHAR(200) NOT NULL,
    rolle VARCHAR(50) DEFAULT 'benutzer',
    aktiv BOOLEAN DEFAULT TRUE,
    datum_erstellung TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datum_modifikation TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


