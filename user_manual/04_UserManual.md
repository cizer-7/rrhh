# 📖 Manual de Usuario - Digitalización de Nóminas

## 📋 Índice

1. [🚀 Primeros Pasos](#-primeros-pasos)
2. [🔐 Inicio de Sesión y Seguridad](#-inicio-de-sesión-y-seguridad)
3. [👤 Gestión de Empleados](#-gestión-de-empleados)
4. [💰 Procesamiento de Nóminas](#-procesamiento-de-nóminas)
5. [📊 Informes y Exportación](#-informes-y-exportación)
6. [⚙️ Configuración del Sistema](#️-configuración-del-sistema)
7. [❓ Preguntas Frecuentes](#-preguntas-frecuentes)

---

## 🚀 Primeros Pasos

### Requisitos del Sistema
- **Navegador:** Chrome, Firefox, Safari, Edge (última versión)
- **Internet:** Conexión a internet estable
- **Resolución de pantalla:** Mínimo 1024x768

### Acceso al Sistema
1. **Abrir URL en el navegador:** `http://localhost:3000` (o la URL proporcionada por su administrador)
2. **Ingresar credenciales:** Nombre de usuario y contraseña
3. **Iniciar sesión:** Hacer clic en "Iniciar Sesión"

---

## 🔐 Inicio de Sesión y Seguridad

### Proceso de Login
1. **Ingresar nombre de usuario:** Su nombre de usuario asignado
2. **Ingresar contraseña:** Su contraseña personal
3. **Iniciar sesión:** Hacer clic en el botón "Iniciar Sesión"

### 🔑 ¿Olvidó su Contraseña?
Si olvidó su contraseña:

1. **Hacer clic en "¿Olvidó su contraseña?":** En la página de login
2. **Ingresar nombre de usuario:** Su nombre de usuario registrado
3. **Esperar email:** Recibirá un email con enlace de restablecimiento
4. **Hacer clic en enlace:** Hacer clic en el enlace del email dentro de 1 hora
5. **Establecer nueva contraseña:** Ingresar contraseña segura
6. **Confirmar:** Repetir contraseña y confirmar

**⏰ Importante:** ¡Los enlaces de restablecimiento solo son válidos por 1 hora!

### Funciones de Seguridad
- **Tokens JWT:** Gestión segura de sesiones
- **Encriptación de Contraseñas:** Protección de sus credenciales
- **Cierre de Sesión Automático:** Se cerrará sesión automáticamente por inactividad
- **Tokens de Restablecimiento Seguros:** Función de restablecimiento de contraseña criptográficamente segura

### ¿Olvidó su Contraseña? - Pasos Detallados

#### Paso 1: Solicitar Restablecimiento
- Hacer clic en "¿Olvidó su contraseña?" en página de login
- Ingresar nombre de usuario y enviar
- Sistema envía automáticamente email con enlace de restablecimiento

#### Paso 2: Verificar Email
- Revisar bandeja de entrada (incluyendo carpeta de spam)
- Hacer clic en enlace de restablecimiento dentro de 1 hora
- Enlace lleva a página segura de restablecimiento de contraseña

#### Paso 3: Establecer Nueva Contraseña
- Ingresar nueva contraseña (mínimo 8 caracteres)
- Repetir contraseña para confirmación
- Hacer clic en "Actualizar Contraseña"

#### Paso 4: Confirmación
- Aparece mensaje de éxito
- Iniciar sesión con nueva contraseña

### 🔐 Detalles Técnicos de la Función de Restablecimiento de Contraseña

**Características de Seguridad:**
- **Tokens Criptográficamente Seguros:** Tokens URL-safe de 32 bytes
- **Límite de Tiempo:** Tokens expiran automáticamente después de 1 hora
- **Uso Único:** Cada token solo puede usarse una vez
- **Transmisión Segura:** Se requiere encriptación HTTPS

**Configuración de Email (para Administradores):**
- **Servidor SMTP:** Soporta Gmail y otros proveedores SMTP
- **Autenticación:** Contraseñas de aplicación para autenticación de 2 factores
- **Personalización:** Textos de email y remitente configurables

### ¿Olvidó su Contraseña? - Manejo de Errores

**¿No recibió el email?**
- Revisar carpeta de spam
- ¿Nombre de usuario ingresado correctamente?
- ¿Firewall bloqueando emails?

**¿Enlace inválido?**
- ¿Enlace tiene más de 1 hora?
- ¿Enlace ya fue utilizado?
- Solicitar nuevo si es necesario

---

## 👤 Gestión de Empleados

### Vista General de Empleados
**Acceso:** Menú principal → "Empleados"

**Funciones:**
- **Búsqueda:** Búsqueda rápida por nombres, ID de empleado, CECO o categoría
- **Filtros:** Filtrar por departamento, estado, categoría (Técnico/Oficina)
- **Ordenación:** Encabezados de columna clicables con ordenación de 3 vías:
  - **ID:** Ordenación numérica
  - **Nombre:** Ordenación alfabética (Apellido, Nombre)
  - **CECO:** Ordenación alfabética
  - **Estado:** Activos primero, luego Inactivos
  - **Categoría:** Ordenación alfabética
- **Indicadores Visuales:** Símbolos de flecha (↑/↓) muestran dirección de ordenación actual

### Crear Nuevo Empleado
1. **Hacer clic en "Nuevo Empleado"**
2. **Ingresar datos maestros:**
   - Nombre completo
   - ID de empleado (si está disponible)
   - Centro de costos (CECO)
   - **Categoría:** Seleccionar Técnico u Oficina
   - Departamento
   - Posición
   - Datos de contacto
3. **Guardar:** Hacer clic en "Guardar"

### Editar Empleado
1. **Seleccionar empleado:** Hacer clic en la vista general
2. **Cambiar datos:** Actualizar campos deseados
3. **Guardar:** Confirmar cambios con "Guardar"

### Eliminar Empleado
1. **Seleccionar empleado**
2. **Hacer clic en "Eliminar"**
3. **Confirmar:** Confirmar eliminación en diálogo

---

## 💰 Procesamiento de Nóminas

### Vista General de Salarios
**Acceso:** Empleados → "Datos de Salario"

**Información Mostrada:**
- **Salario Base:** Salario base para año seleccionado
- **Modalidad:** 12 o 14 pagas mensuales
- **Antigüedad:** Asignación por antigüedad
- **Salario Total:** Salario anual calculado

### Crear/Editar Salario
1. **Seleccionar empleado**
2. **Elegir año:** Dropdown para selección anual
3. **Ingresar datos de salario:**
   - Salario base
   - Modalidad de salario
   - Asignación por antigüedad
4. **Guardar:** Confirmar con "Guardar"

### Ingresos Brutos
**Acceso:** Empleados → "Ingresos Brutos"

**Tipos de Ingresos:**
- **Ticket Restaurante:** Tickets de restaurante mensuales
- **Primas:** Primas únicas o regulares
- **Otros Ingresos:** Compensaciones adicionales

### Deducciones
**Acceso:** Empleados → "Deducciones"

**Tipos de Deducciones:**
- **Seguridad Social:** Contribuciones obligatorias a la seguridad social
- **Impuestos:** Impuestos sobre la renta y otras deducciones
- **Otras Deducciones:** Otras deducciones

---

## 📊 Informes y Exportación

### Exportación Excel
**Funciones:**
- **Exportación Anual:** Todos los datos de salarios para un año
- **Lista de Empleados:** Datos maestros y de contacto
- **Resumen de Salarios:** Estadísticas de salarios resumidas

**Pasos:**
1. **Seleccionar informe:** Elegir "Exportar" en menú principal
2. **Establecer parámetros:** Año, empleados, etc.
3. **Iniciar exportación:** Hacer clic en "Exportar"
4. **Descargar:** Archivo se descarga automáticamente

### Mostrar Informes
**Informes Disponibles:**
- **Estadísticas de Empleados:** Cantidad por departamento
- **Estadísticas de Salarios:** Salarios promedio
- **Resumen Anual:** Evolución de salarios

---

## ⚙️ Configuración del Sistema

### Configuración Personal
**Acceso:** Perfil → "Configuración"

**Opciones:**
- **Idioma:** Español/Inglés
- **Formato de Fecha:** Varios formatos seleccionables
- **Diseño:** Claro/Oscuro (si está disponible)

### Gestión de Usuarios (solo Administradores)
**Acceso:** Administración → "Usuarios"

**Funciones:**
- **Crear usuario:** Crear nuevas cuentas de usuario
- **Asignar roles:** Permisos de Admin/Usuario
- **Restablecer contraseña:** Establecer nuevas contraseñas

---

## ❓ Preguntas Frecuentes

### Preguntas Generales

**P: ¿Qué hacer si olvido mi contraseña?**
R: Contacte a su administrador del sistema.

**P: ¿Por qué no puedo iniciar sesión?**
R: Verifique nombre de usuario y contraseña. Preste atención a mayúsculas/minúsculas.

**P: ¿Cuánto tiempo estoy conectado?**
R: La sesión expira automáticamente después de 8 horas de inactividad.

### Gestión de Empleados

**P: ¿Puedo cambiar datos de empleado después?**
R: Sí, todos los datos maestros pueden editarse en cualquier momento.

**P: ¿Qué pasa al eliminar un empleado?**
R: Todos los datos se archivan y se eliminan de la vista activa.

### Procesamiento de Nóminas

**P: ¿Cómo se calculan los Atrasos?**
R: Los Atrasos se calculan automáticamente basados en el salario del año anterior.

**P: ¿Puedo cambiar salarios retroactivamente?**
R: Sí, pero los cambios deben documentarse y aprobarse.

### Exportación e Informes

**P: ¿En qué formato se exportan los datos?**
R: Por defecto como archivo Excel (.xlsx).

**P: ¿Puedo crear informes personalizados?**
R: Contacte a su administrador para requisitos especiales de informes.

---

## 📞 Soporte

### Problemas Técnicos
Para problemas técnicos contacte:
- **Soporte TI:** [Email/Teléfono del Soporte]
- **Administrador del Sistema:** [Datos de Contacto]

### Capacitaciones
Para capacitaciones y materiales de capacitación:
- **Departamento de Personal:** [Datos de Contacto]
- **Capacitación TI:** [Horarios y lugares de capacitación]

---

## 📝 Consejos y Trucos

### Operación Eficiente
- **Atajos de Teclado:** Use Tab para navegación
- **Búsqueda:** Use búsqueda rápida para acceso rápido
- **Filtros:** Combine múltiples filtros para resultados precisos
- **Ordenación:** Haga clic en encabezados de columna para ordenación de 3 vías (↑→↓→sin ordenación)
- **Filtro por Categoría:** Use filtro por categoría para selección específica de empleados

### Calidad de Datos
- **Actualizaciones Regulares:** Mantenga datos de empleados actualizados
- **Verificación de Plausibilidad:** Verifique datos de salarios para plausibilidad
- **Copias de Seguridad:** Las copias de seguridad regulares se realizan automáticamente

---

*Próximos documentos: [Resumen del Sistema](01_Overview.md) | [Documentación de Base de Datos](02_Database.md) | [Manual de Testing](03_Testing.md)*
