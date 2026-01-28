-- ============================================================================
-- MONATLICHE TABELLEN FÜR ZUSCHLÄGE UND ABZÜGE
-- Monatliche Zuschläge und Abzüge mit individueller Bearbeitungsmöglichkeit
-- ============================================================================

-- ============================================================================
-- TABLA 3a: ingresos brutos mensuales (Monatliche Bruttoeinkünfte)
-- Monatliche Bruttoeinkünfte Informationen pro Mitarbeiter
-- ============================================================================
CREATE TABLE t003_ingresos_brutos_mensuales (
    id_empleado INT NOT NULL,
    anio INT NOT NULL,
    mes INT NOT NULL, -- 1-12 für Januar bis Dezember
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
    PRIMARY KEY (id_empleado, anio, mes),
    FOREIGN KEY (id_empleado) REFERENCES t001_empleados(id_empleado) ON DELETE CASCADE,
    CONSTRAINT chk_mes CHECK (mes BETWEEN 1 AND 12),
    CONSTRAINT chk_anio CHECK (anio BETWEEN 2020 AND 2050)
);

-- ============================================================================
-- TABLA 4a: deducciones mensuales (Monatliche Abzüge)
-- Monatliche Abzüge Informationen pro Mitarbeiter
-- ============================================================================
CREATE TABLE t004_deducciones_mensuales (
    id_empleado INT NOT NULL,
    anio INT NOT NULL,
    mes INT NOT NULL, -- 1-12 für Januar bis Dezember
    seguro_accidentes DECIMAL(10,2) DEFAULT 0.00,
    adelas DECIMAL(10,2) DEFAULT 0.00,
    sanitas DECIMAL(10,2) DEFAULT 0.00,
    gasolina_arval DECIMAL(10,2) DEFAULT 0.00,
    cotizacion_especie DECIMAL(10,2) DEFAULT 0.00,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_empleado, anio, mes),
    FOREIGN KEY (id_empleado) REFERENCES t001_empleados(id_empleado) ON DELETE CASCADE,
    CONSTRAINT chk_mes_deducciones CHECK (mes BETWEEN 1 AND 12),
    CONSTRAINT chk_anio_deducciones CHECK (anio BETWEEN 2020 AND 2050)
);

-- ============================================================================
-- INDEXES FÜR PERFORMANCE
-- ============================================================================

-- Indexes für schnelle Abfragen nach Jahr und Monat
CREATE INDEX idx_ingresos_mensuales_anio_mes ON t003_ingresos_brutos_mensuales(anio, mes);
CREATE INDEX idx_deducciones_mensuales_anio_mes ON t004_deducciones_mensuales(anio, mes);

-- Indexes für schnelle Mitarbeiterabfragen
CREATE INDEX idx_ingresos_mensuales_empleado ON t003_ingresos_brutos_mensuales(id_empleado);
CREATE INDEX idx_deducciones_mensuales_empleado ON t004_deducciones_mensuales(id_empleado);

-- ============================================================================
-- TRIGGER FÜR AUTOMATISCHE DATENSATZERZEUGUNG
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

-- ============================================================================
-- KOMMENTARE
-- ============================================================================

COMMENT ON TABLE t003_ingresos_brutos_mensuales IS 'Monatliche Bruttoeinkünfte pro Mitarbeiter - ermöglicht individuelle Bearbeitung pro Monat';
COMMENT ON TABLE t004_deducciones_mensuales IS 'Monatliche Abzüge pro Mitarbeiter - ermöglicht individuelle Bearbeitung pro Monat';

COMMENT ON COLUMN t003_ingresos_brutos_mensuales.mes IS 'Monat (1=Januar, 12=Dezember)';
COMMENT ON COLUMN t004_deducciones_mensuales.mes IS 'Monat (1=Januar, 12=Dezember)';
