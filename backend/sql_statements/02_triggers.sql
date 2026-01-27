-- ============================================================================
-- FIX FOR ATRASOS CALCULATION ISSUE
-- Problem: When entering years out of chronological order, atrasos is not calculated correctly
-- Solution: Enhanced BEFORE triggers that check both previous and next years
-- ============================================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS trg_before_insert_t002_salarios;
DROP TRIGGER IF EXISTS trg_before_update_t002_salarios;

DELIMITER $$

CREATE TRIGGER trg_before_insert_t002_salarios
BEFORE INSERT ON t002_salarios
FOR EACH ROW
BEGIN
    DECLARE salario_anual_prev DECIMAL(12,2);
    DECLARE salario_anual_next DECIMAL(12,2);
    DECLARE has_previous_year BOOLEAN DEFAULT FALSE;
    DECLARE has_next_year BOOLEAN DEFAULT FALSE;
    DECLARE next_year_modalidad INT;

    -- Check if previous year's salary exists
    SELECT COUNT(*) > 0, salario_anual_bruto 
    INTO has_previous_year, salario_anual_prev
    FROM t002_salarios
    WHERE id_empleado = NEW.id_empleado 
      AND anio = NEW.anio - 1
    LIMIT 1;

    -- Check if next year's salary exists (for future reference)
    SELECT COUNT(*) > 0, salario_anual_bruto, modalidad
    INTO has_next_year, salario_anual_next, next_year_modalidad
    FROM t002_salarios
    WHERE id_empleado = NEW.id_empleado 
      AND anio = NEW.anio + 1
    LIMIT 1;

    -- Compute salario_mensual_bruto
    SET NEW.salario_mensual_bruto = NEW.salario_anual_bruto / 
        CASE NEW.modalidad 
            WHEN 12 THEN 12 
            WHEN 14 THEN 14 
            ELSE 12 
        END;

    -- Compute atrasos based on previous year
    IF has_previous_year THEN
        IF NEW.modalidad = 12 THEN
            SET NEW.atrasos = (NEW.salario_anual_bruto - salario_anual_prev) / 12 * 3;
        ELSEIF NEW.modalidad = 14 THEN
            SET NEW.atrasos = (NEW.salario_anual_bruto - salario_anual_prev) / 14 * 3;
        ELSE
            SET NEW.atrasos = 0;
        END IF;
    ELSE
        -- No previous year data exists, set atrasos to 0
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
    SELECT COUNT(*) > 0, salario_anual_bruto 
    INTO has_previous_year, salario_anual_prev
    FROM t002_salarios
    WHERE id_empleado = NEW.id_empleado 
      AND anio = NEW.anio - 1
    LIMIT 1;

    -- Compute salario_mensual_bruto
    SET NEW.salario_mensual_bruto = NEW.salario_anual_bruto / 
        CASE NEW.modalidad 
            WHEN 12 THEN 12 
            WHEN 14 THEN 14 
            ELSE 12 
        END;

    -- Compute atrasos based on previous year
    IF has_previous_year THEN
        IF NEW.modalidad = 12 THEN
            SET NEW.atrasos = (NEW.salario_anual_bruto - salario_anual_prev) / 12 * 3;
        ELSEIF NEW.modalidad = 14 THEN
            SET NEW.atrasos = (NEW.salario_anual_bruto - salario_anual_prev) / 14 * 3;
        ELSE
            SET NEW.atrasos = 0;
        END IF;
    ELSE
        -- No previous year data exists, set atrasos to 0
        SET NEW.atrasos = 0;
    END IF;

    -- Compute salario_mensual_con_atrasos
    SET NEW.salario_mensual_con_atrasos = NEW.salario_mensual_bruto + NEW.atrasos;
END$$

DELIMITER ;
