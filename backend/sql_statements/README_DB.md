# 🗄️ Documentación de Base de Datos - Sistema de Nóminas

Este documento describe la estructura completa de la base de datos y los scripts SQL para el sistema de nóminas.

## 📋 Tabla de Contenidos

1. [📁 Estructura de Carpetas](#-estructura-de-carpetas)
2. [⚡ Ejecución](#-ejecución)
3. [📝 Notas Importantes](#-notas-importantes)
4. [🔧 Funciones Básicas](#-funciones-básicas)
5. [📅 Tablas Mensuales](#-tablas-mensuales)
6. [👤 Usuarios de Prueba](#-usuarios-de-prueba)

---

## 📁 Estructura de Carpetas

### `01_schema/` - Esquema de Base de Datos
**Descripción:** Contiene todas las instrucciones CREATE TABLE para la estructura de la base de datos.

**Archivos:**
- `01_schema.sql` - Todas las tablas: t001_empleados, t002_salarios, t003_ingresos_brutos, t004_deducciones, t005_usuarios, t006_valores_calculados_mensuales, t007_registro_procesamiento, t008_empleado_fte, t009_password_reset_tokens

### `02_triggers/` - Triggers de Base de Datos
**Descripción:** Contiene todos los triggers para cálculos automáticos e integridad de datos.

**Archivos:**
- `01_triggers.sql` - Triggers para cálculo automático de salarios, cálculo de atrasos y registros mensuales

### `03_data/` - Datos de Prueba
**Descripción:** Contiene todas las instrucciones INSERT para datos de prueba.

**Archivos:**
- `00_insert_employees.sql` - Datos maestros de empleados (88 empleados + usuarios de prueba)
- `01_insert_benutzer.sql` - Cuentas de usuario para la aplicación
- `02_insert_salaries.sql` - Datos salariales para los años 2025-2026
- `03_insert_income.sql` - Datos de ingresos brutos para 2025 (tickets de restaurante, primas, etc.)

### `04_maintenance/` - Scripts de Mantenimiento
**Descripción:** Scripts para mantenimiento de base de datos y migraciones (futuro).

---

## ⚡ Ejecución

Los scripts deben ejecutarse en el orden especificado:

### Fase 1: Esquema Base
1. `01_schema/01_schema.sql` - Crea el esquema completo de la base de datos con todas las tablas
2. `02_triggers/01_triggers.sql` - Triggers actualizados para cálculos correctos

### Fase 2: Datos de Prueba
3. `03_data/00_insert_employees.sql` - Datos maestros de empleados y usuarios de prueba
4. `03_data/01_insert_benutzer.sql` - Cuentas de usuario
5. `03_data/02_insert_salaries.sql` - Datos salariales
6. `03_data/03_insert_income.sql` - Datos de ingresos brutos

## 📝 Notas Importantes

### 🔧 Funciones Básicas
- Los triggers calculan automáticamente salarios mensuales y atrasos
- Los atrasos se calculan basándose en el salario del año anterior
- Para nuevos empleados sin datos previos, los atrasos se establecen en 0

### 📅 Tablas Mensuales (funcionalidad extendida)
- Las tablas mensuales permiten edición individual de complementos y deducciones por mes
- Los nuevos empleados reciben automáticamente 12 registros mensuales para el año actual
- La migración copia datos anuales existentes en registros mensuales
- Los datos anuales originales se mantienen por razones de compatibilidad

### 👤 Usuarios de Prueba
- Para pruebas E2E están disponibles los siguientes usuarios de prueba:
  - Usuario: `test`, Contraseña: `test`, Rol: `admin`
  - Usuario: `Gerard.Cizer@krones.es`, Contraseña: `Test`, Rol: `usuario`
  - Usuario: `xforne@krones.es`, Contraseña: `Test`, Rol: `usuario`
  - Usuario: `Michelle.Cruz@krones.es`, Contraseña: `Test`, Rol: `usuario`
  - Usuario: `Guillermo.Gonzalez@krones.es`, Contraseña: `Test`, Rol: `usuario`

**Nota:** En producción, las contraseñas deberían estar hasheadas (ej. con bcrypt). Para pruebas se usa SHA256.
