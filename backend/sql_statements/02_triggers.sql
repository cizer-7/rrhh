-- ============================================================================
-- TRIGGER OHNE ATRASOS BERECHNUNG
-- Atrasos werden jetzt im Python Backend berechnet
-- ============================================================================

DELIMITER $$

CREATE TRIGGER trg_before_insert_t002_salarios
BEFORE INSERT ON t002_salarios
FOR EACH ROW
BEGIN
    -- Compute salario_mensual_bruto
    SET NEW.salario_mensual_bruto = NEW.salario_anual_bruto / 
        CASE NEW.modalidad 
            WHEN 12 THEN 12 
            WHEN 14 THEN 14 
            ELSE 12 
        END;
END$$

DELIMITER ;


DELIMITER $$

CREATE TRIGGER trg_before_update_t002_salarios
BEFORE UPDATE ON t002_salarios
FOR EACH ROW
BEGIN
    -- Compute salario_mensual_bruto
    SET NEW.salario_mensual_bruto = NEW.salario_anual_bruto / 
        CASE NEW.modalidad 
            WHEN 12 THEN 12 
            WHEN 14 THEN 14 
            ELSE 12 
        END;
END$$

DELIMITER ;

-- ============================================================================
-- INDEXES FÜR PERFORMANCE MONATLICHE TABELLEN
-- ============================================================================

-- Indexes für schnelle Abfragen nach Jahr und Monat
CREATE INDEX idx_ingresos_mensuales_anio_mes ON t003_ingresos_brutos_mensuales(anio, mes);
CREATE INDEX idx_deducciones_mensuales_anio_mes ON t004_deducciones_mensuales(anio, mes);

-- Indexes für schnelle Mitarbeiterabfragen
CREATE INDEX idx_ingresos_mensuales_empleado ON t003_ingresos_brutos_mensuales(id_empleado);
CREATE INDEX idx_deducciones_mensuales_empleado ON t004_deducciones_mensuales(id_empleado);

-- ============================================================================
-- TRIGGER FÜR AUTOMATISCHE DATENSATZERZEUGUNG MONATLICHE TABELLEN
-- ============================================================================

DELIMITER $$

-- Trigger für neue Mitarbeiter - erstellt automatisch 12 monatliche Datensätze für das aktuelle Jahr
CREATE TRIGGER trg_create_monthly_records_new_employee
AFTER INSERT ON t001_empleados
FOR EACH ROW
BEGIN
    DECLARE current_year INT;
    DECLARE month_counter INT;
    
    SET current_year = YEAR(CURDATE());
    SET month_counter = 1;
    
    -- Monatliche Bruttoeinkünfte erstellen
    WHILE month_counter <= 12 DO
        INSERT INTO t003_ingresos_brutos_mensuales (id_empleado, anio, mes)
        VALUES (NEW.id_empleado, current_year, month_counter);
        SET month_counter = month_counter + 1;
    END WHILE;
    
    -- Monatliche Abzüge erstellen
    SET month_counter = 1;
    WHILE month_counter <= 12 DO
        INSERT INTO t004_deducciones_mensuales (id_empleado, anio, mes)
        VALUES (NEW.id_empleado, current_year, month_counter);
        SET month_counter = month_counter + 1;
    END WHILE;
END$$

DELIMITER ;
