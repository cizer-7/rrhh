# 🗄️ Documentación de Base de Datos - Sistema de Nóminas

## 📋 Tabla de Contenidos

1. [📊 Estructura de la Base de Datos](#-estructura-de-la-base-de-datos)
2. [⚡ Instalación y Configuración](#-instalación-y-configuración)
3. [🔧 Triggers y Automatización](#-triggers-y-automatización)
4. [📅 Tablas Mensuales](#-tablas-mensuales)
5. [👤 Usuarios de Prueba](#-usuarios-de-prueba)

---

## 📊 Estructura de la Base de Datos

### Tablas Principales

#### `t001_empleados` - Datos Maestros de Empleados
- **ID:** Identificación única de empleado
- **Nombre:** Nombre completo del empleado
- **CECO:** Número de centro de costos
- **Categoría:** Categoría de empleado (Técnico, Oficina)
- **Campos adicionales:** Información de contacto, departamento, posición

#### `t002_salarios` - Información Salarial
- **ID Empleado:** Enlace a empleados
- **Año:** Salarios dependientes del año
- **Salario Base:** Salario base
- **Modalidad:** 12 o 14 pagas mensuales
- **Antigüedad:** Complemento de antigüedad

#### `t003_ingresos_brutos` - Ingresos Brutos
- **ID Empleado:** Enlace a empleados
- **Año:** Ingresos dependientes del año
- **Ticket Restaurant:** Tickets restaurante
- **Primas:** Primas y bonificaciones
- **Otros Ingresos:** Compensaciones adicionales

#### `t004_deducciones` - Deducciones
- **ID Empleado:** Enlace a empleados
- **Año:** Deducciones dependientes del año
- **Seguridad Social:** Contribuciones a la seguridad social
- **Otras Deducciones:** Impuestos y otras deducciones

#### `t005_benutzer` - Gestión de Usuarios
- **Nombre de Usuario:** Nombre de login
- **Hash de Contraseña:** Contraseña encriptada
- **Rol:** Rol de usuario (admin, user)
- **Activo:** Estado de la cuenta

#### `t009_password_reset_tokens` - Tokens de Restablecimiento de Contraseña
- **nombre_usuario:** Enlace al usuario
- **token:** Token de restablecimiento único
- **email:** Dirección de email del usuario
- **expires_at:** Fecha de expiración (1 hora)
- **used:** ¿Token ya utilizado?
- **created_at:** Fecha de creación

---

## ⚡ Instalación y Configuración

### Requisitos Previos
- MySQL Server 8.0+
- Python mysql-connector-python
- Permisos de acceso para creación de base de datos

### Pasos de Instalación

1. **Crear base de datos**
   ```sql
   CREATE DATABASE nomina;
   ```

2. **Ejecutar scripts SQL (respetar orden)**
   ```bash
   # Fase 1: Esquema básico
   mysql -u root -p nomina < 01_schema.sql
   mysql -u root -p nomina < 02_triggers.sql
   
   # Fase 2: Datos de prueba
   mysql -u root -p nomina < 03_insert_employees.sql
   mysql -u root -p nomina < 04_insert_salaries.sql
   mysql -u root -p nomina < 05_insert_income.sql
   
   # Fase 3: Funcionalidad de restablecimiento de contraseña
   mysql -u root -p nomina < 04_password_reset_schema.sql
   ```

### 🔐 Configuración Email para Restablecimiento de Contraseña

Para la funcionalidad de restablecimiento de contraseña se debe configurar el email:

**Crear archivo `.env` en el directorio del Backend:**
```bash
# Configuración Email
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=su-email@gmail.com
SMTP_PASSWORD=su-contraseña-app
FROM_EMAIL=su-email@gmail.com
FRONTEND_URL=http://localhost:3000
```

**Configuración Gmail:**
1. **Activar autenticación de 2 factores**
2. **Crear contraseña de aplicación** (no la contraseña normal)
3. Usar contraseña de aplicación en configuración

---

## 🔧 Triggers y Automatización

### Cálculos Automáticos

#### Triggers de Salario
- **Salario Mensual:** Cálculo automático desde salario anual
- **Antigüedad:** Complemento de antigüedad basado en antigüedad en la empresa
- **Atrasos:** Cálculo de retrasos basado en datos de años anteriores

#### Integridad de Datos
- **Integridad Referencial:** Aseguramiento de relaciones de datos consistentes
- **Validación:** Verificación de reglas de negocio
- **Rendimiento:** Índices optimizados para consultas rápidas

---

## 📅 Tablas Mensuales (Funcionalidad Extendida)

### Propósito
- **Liquidación Mensual Detallada:** Procesamiento individual por mes
- **Flexibilidad:** Ajustes mensuales de complementos y deducciones
- **Historial:** Seguimiento completo de todos los cambios

### Automatización
- **Nuevos Empleados:** Creación automática de 12 registros mensuales
- **Migración de Datos:** Copia de datos anuales a estructura mensual
- **Compatibilidad:** Mantenimiento de datos anuales originales

---

## 👤 Usuarios de Prueba

### Acceso de Prueba Estándar
Para desarrollo y testing está disponible un usuario estándar:

- **Nombre de Usuario:** `test`
- **Contraseña:** `test`
- **Rol:** `admin`
- **Uso:** Tests E2E, desarrollo, demostración

### Usuarios de Prueba Adicionales
Se pueden crear usuarios de prueba adicionales en la tabla `t005_benutzer`:
```sql
INSERT INTO t005_benutzer (benutzername, passwort_hash, rolle, aktiv)
VALUES ('nuevo_user', SHA2('contraseña', 256), 'user', 1);
```

---

## 📞 Mantenimiento y Soporte

### Mantenimiento Regular
- **Backup:** Copias de seguridad diarias de la base de datos
- **Rendimiento:** Monitoreo del rendimiento de consultas
- **Índices:** Optimización regular de índices de la base de datos

### Resolución de Problemas
- **Errores de Trigger:** Verificación de logs de triggers
- **Integridad de Datos:** Verificaciones de consistencia regulares
- **Rendimiento:** Análisis de consultas lentas

---

*Próximos documentos: [Resumen del Sistema](01_Übersicht.md) | [Manual de Testing](03_Testing.md) | [Manual de Usuario](04_Benutzerhandbuch.md)*
