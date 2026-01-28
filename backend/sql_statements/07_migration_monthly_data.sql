-- ============================================================================
-- MIGRATIONSKRIPT: JAHRESDATEN IN MONATLICHE DATEN KOPIEREN
-- Migriert bestehende Jahresdaten in die neuen monatlichen Tabellen
-- ============================================================================

-- ============================================================================
-- VORBEREITUNG
-- ============================================================================

-- Prüfen ob die monatlichen Tabellen existieren
-- (Dieses Skript sollte nach Erstellung der monatlichen Tabellen ausgeführt werden)

-- ============================================================================
-- MIGRATION DER BRUTTOEINKÜNFTE
-- ============================================================================

-- Monatliche Bruttoeinkünfte aus Jahresdaten erstellen
-- Für jeden Mitarbeiter und jedes Jahr werden 12 Monatsdatensätze erstellt
INSERT INTO t003_ingresos_brutos_mensuales (
    id_empleado, 
    anio, 
    mes, 
    ticket_restaurant, 
    primas, 
    dietas_cotizables, 
    horas_extras, 
    dias_exentos, 
    dietas_exentas, 
    seguro_pensiones, 
    lavado_coche
)
SELECT 
    ib.id_empleado,
    ib.anio,
    months.mes,
    COALESCE(ib.ticket_restaurant, 0.00) as ticket_restaurant,
    COALESCE(ib.primas, 0.00) as primas,
    COALESCE(ib.dietas_cotizables, 0.00) as dietas_cotizables,
    COALESCE(ib.horas_extras, 0.00) as horas_extras,
    COALESCE(ib.dias_exentos, 0.00) as dias_exentos,
    COALESCE(ib.dietas_exentas, 0.00) as dietas_exentas,
    COALESCE(ib.seguro_pensiones, 0.00) as seguro_pensiones,
    COALESCE(ib.lavado_coche, 0.00) as lavado_coche
FROM t003_ingresos_brutos ib
CROSS JOIN (
    SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION
    SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION
    SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
) months
WHERE NOT EXISTS (
    SELECT 1 FROM t003_ingresos_brutos_mensuales mb 
    WHERE mb.id_empleado = ib.id_empleado 
    AND mb.anio = ib.anio 
    AND mb.mes = months.mes
);

-- ============================================================================
-- MIGRATION DER ABZÜGE
-- ============================================================================

-- Monatliche Abzüge aus Jahresdaten erstellen
-- Für jeden Mitarbeiter und jedes Jahr werden 12 Monatsdatensätze erstellt
INSERT INTO t004_deducciones_mensuales (
    id_empleado, 
    anio, 
    mes, 
    seguro_accidentes, 
    adelas, 
    sanitas, 
    gasolina_arval, 
    cotizacion_especie
)
SELECT 
    d.id_empleado,
    d.anio,
    months.mes,
    COALESCE(d.seguro_accidentes, 0.00) as seguro_accidentes,
    COALESCE(d.adelas, 0.00) as adelas,
    COALESCE(d.sanitas, 0.00) as sanitas,
    COALESCE(d.gasolina_arval, 0.00) as gasolina_arval,
    COALESCE(d.cotizacion_especie, 0.00) as cotizacion_especie
FROM t004_deducciones d
CROSS JOIN (
    SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION
    SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION
    SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
) months
WHERE NOT EXISTS (
    SELECT 1 FROM t004_deducciones_mensuales md 
    WHERE md.id_empleado = d.id_empleado 
    AND md.anio = d.anio 
    AND md.mes = months.mes
);

-- ============================================================================
-- VERIFIZIERUNG DER MIGRATION
-- ============================================================================

-- Prüfen wie viele Datensätze migriert wurden
SELECT 'Migrierte monatliche Bruttoeinkünfte' as typ, COUNT(*) as anzahl 
FROM t003_ingresos_brutos_mensuales

UNION ALL

SELECT 'Migrierte monatliche Abzüge' as typ, COUNT(*) as anzahl 
FROM t004_deducciones_mensuales

UNION ALL

SELECT 'Vorhandene Jahres-Bruttoeinkünfte' as typ, COUNT(*) as anzahl 
FROM t003_ingresos_brutos

UNION ALL

SELECT 'Vorhandene Jahres-Abzüge' as typ, COUNT(*) as anzahl 
FROM t004_deducciones;

-- ============================================================================
-- ZUSATZ: FEHLENDE MONATLICHE DATENSÄTZE FÜR AKTUELLES JAHR ERSTELLEN
-- ============================================================================

-- Für Mitarbeiter, die noch keine monatlichen Daten für das aktuelle Jahr haben
INSERT INTO t003_ingresos_brutos_mensuales (id_empleado, anio, mes)
SELECT DISTINCT 
    e.id_empleado,
    YEAR(CURDATE()) as anio,
    months.mes
FROM t001_empleados e
CROSS JOIN (
    SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION
    SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION
    SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
) months
WHERE e.activo = TRUE
AND NOT EXISTS (
    SELECT 1 FROM t003_ingresos_brutos_mensuales mb 
    WHERE mb.id_empleado = e.id_empleado 
    AND mb.anio = YEAR(CURDATE()) 
    AND mb.mes = months.mes
);

INSERT INTO t004_deducciones_mensuales (id_empleado, anio, mes)
SELECT DISTINCT 
    e.id_empleado,
    YEAR(CURDATE()) as anio,
    months.mes
FROM t001_empleados e
CROSS JOIN (
    SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION
    SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION
    SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
) months
WHERE e.activo = TRUE
AND NOT EXISTS (
    SELECT 1 FROM t004_deducciones_mensuales md 
    WHERE md.id_empleado = e.id_empleado 
    AND md.anio = YEAR(CURDATE()) 
    AND md.mes = months.mes
);

-- ============================================================================
-- HINWEISE
-- ============================================================================

/*
Nach Ausführung dieses Skripts:

1. Alle bestehenden Jahresdaten wurden in monatliche Datensätze kopiert
2. Jeder Mitarbeiter hat für jedes Jahr 12 Monatsdatensätze
3. Die Werte sind zunächst identisch mit den Jahreswerten
4. Die monatlichen Datensätze können jetzt individuell bearbeitet werden
5. Die ursprünglichen Jahresdaten bleiben für Kompatibilität erhalten

Für neue Mitarbeiter werden automatisch monatliche Datensätze erstellt
(durch den Trigger in der 06_monthly_tables.sql)
*/
