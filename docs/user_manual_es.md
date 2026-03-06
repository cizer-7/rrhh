# 📚 Manual de Usuario - Digitalización de Nóminas

## 📋 Tabla de Contenidos

1. [🎯 Introducción](#-introducción)
2. [🚀 Primeros Pasos](#-primeros-pasos)
3. [🔐 Autenticación y Seguridad](#-autenticación-y-seguridad)
4. [👥 Gestión de Empleados](#-gestión-de-empleados)
5. [💳 Gestión de Salarios](#-gestión-de-salarios)
6. [📊 Importación y Exportación](#-importación-y-exportación)
7. [⚙️ Funciones Avanzadas](️-funciones-avanzadas)
8. [❓ Preguntas Frecuentes](#-preguntas-frecuentes)

---

## 🎯 Introducción

### ¿Qué es el Sistema de Digitalización de Nóminas?

El Sistema de Digitalización de Nóminas es una aplicación web moderna para la gestión de empleados y procesamiento de nóminas. Reemplaza las aplicaciones de escritorio tradicionales con una solución basada en web.

### Características Principales

- **Gestión de Empleados:** CRUD completo de datos maestros
- **Procesamiento de Nóminas:** Cálculo y gestión salarial
- **Autenticación Segura:** Login con JWT y recuperación de contraseña
- **Importación/Exportación:** Integración con Excel y otros formatos
- **Carry Over:** Transferencia de importes entre períodos
- **Gestión FTE:** Control de porcentajes de tiempo completo

### Arquitectura del Sistema

- **Frontend:** Next.js 16 con TypeScript y Tailwind CSS
- **Backend:** Python Flask con MySQL
- **Base de Datos:** MySQL con tablas optimizadas
- **API:** RESTful con autenticación JWT

---

## 🚀 Primeros Pasos

### Requisitos del Sistema

#### Navegadores Soportados
- **Chrome:** Versión 90 o superior
- **Firefox:** Versión 88 o superior
- **Safari:** Versión 14 o superior
- **Edge:** Versión 90 o superior

#### Acceso al Sistema

1. **URL Principal:** Acceder a la aplicación web
2. **Inicio de Sesión:** Ingresar credenciales
3. **Dashboard:** Acceder al panel principal

### Pantalla Principal

La pantalla principal muestra tres módulos principales:

- **👥 Gestión de Empleados:** Administración de datos maestros
- **💰 Procesamiento de Nómina:** Gestión salarial
- **📊 Informes y Exportación:** Herramientas de análisis

---

## 🔐 Autenticación y Seguridad

### Inicio de Sesión

#### Proceso de Autenticación

1. **Credenciales:** Usuario y contraseña
2. **Validación:** Verificación en base de datos
3. **Token JWT:** Generación de token de sesión
4. **Acceso:** Redirección al dashboard

### Recuperación de Contraseña

#### Flujo de Recuperación

1. **Solicitud:** "¿Olvidaste tu contraseña?"
2. **Email:** Enviar enlace de recuperación
3. **Validación:** Verificar token (24 horas válido)
4. **Actualización:** Establecer nueva contraseña

#### Requisitos de Contraseña

- **Longitud mínima:** 8 caracteres
- **Complejidad:** Mayúsculas, minúsculas, números, caracteres especiales
- **Seguridad:** No reutilizar contraseñas anteriores

---

## 👥 Gestión de Empleados

### Vista General de Empleados

#### Tabla de Empleados

La interfaz muestra una tabla con:

- **ID Empleado:** Identificador único
- **Nombre:** Nombre completo del empleado
- **CECO:** Centro de costos
- **Categoría:** "Techniker" o "Office"
- **Activo:** Estado del empleado
- **Fecha de Alta:** Fecha de contratación

#### Funciones Disponibles

- **Búsqueda:** Por nombre, apellido, CECO
- **Filtros:** Por categoría, estado activo
- **Ordenamiento:** Por ID, nombre, fecha
- **Paginación:** Navegación por resultados

### Crear Nuevo Empleado

#### Formulario de Creación

**Campos Obligatorios:**
- Nombre y Apellido
- CECO (Centro de Costos)
- Categoría (Techniker/Office)
- DNI

**Campos Opcionales:**
- Fecha de Alta
- Declaración
- Estado Activo

**Proceso:**
1. **Datos Personales:** Completar información básica
2. **Datos Laborales:** CECO, categoría, fecha de alta
3. **Validación:** Sistema verifica datos requeridos
4. **Creación:** Guardar en base de datos

### Editar Empleado

#### Modificación de Datos

**Campos Editables:**
- Nombre y Apellido
- CECO
- Categoría
- Estado (Activo/Inactivo)
- Fecha de Alta
- Declaración
- DNI

**Restricciones:**
- ID de empleado no modificable
- Validaciones de formato aplicadas

### Eliminar Empleado

#### Proceso de Eliminación

- **Confirmación:** Diálogo de confirmación
- **Eliminación Lógica:** Marcar como inactivo
- **Integridad:** Mantener datos históricos

### Categorías de Empleados

#### Techniker
- Personal técnico especializado
- Acceso a funciones técnicas
- Configuración específica

#### Office
- Personal administrativo
- Acceso a funciones de oficina
- Configuración administrativa

---

## 💳 Gestión de Salarios

### Información Salarial

#### Estructura Salarial

**Datos Principales:**
- **Año:** Período salarial
- **Modalidad:** 12 o 14 pagas
- **Salario Anual Bruto:** Base imponible
- **Antigüedad:** Complemento por antigüedad
- **Otros Conceptos:** Complementos adicionales

#### Gestión por Año

- **Creación:** Establecer salario anual
- **Actualización:** Modificar datos salariales
- **Eliminación:** Remover registro salarial

### FTE (Full-Time Equivalent)

#### Gestión de Porcentajes

**Funcionalidad:**
- **Porcentaje:** Tiempo parcial/completo (0-100%)
- **Período:** Gestión por año y mes
- **Actualización:** Modificación de porcentajes
- **Cálculo:** Aplicación automática en nóminas

#### Operaciones

- **Consulta:** Ver FTE por período
- **Actualización:** Modificar porcentaje
- **Eliminación:** Remover registro FTE

### Einkünfte (Ingresos)

#### Gestión de Ingresos

**Tipos de Ingresos:**
- **Ingresos Brutos:** Ingresos mensuales
- **Devengos:** Conceptos devengados
- **Complementos:** Pagos adicionales

#### Operaciones por Período

- **Anuales:** Configuración anual de ingresos
- **Mensuales:** Detalle mensual
- **Actualización:** Modificación de importes

### Deducciones (Deducciones)

#### Gestión de Deducciones

**Tipos de Deducciones:**
- **Seguridad Social:** Contribuciones obligatorias
- **IRPF:** Retenciones fiscales
- **Otros:** Deducciones específicas

#### Operaciones

- **Configuración:** Establecer porcentajes
- **Actualización:** Modificar deducciones
- **Cálculo:** Aplicación automática

---

## 📊 Importación y Exportación

### Importación de Datos

#### Horas y Dietas

**Funcionalidad:**
- **Archivo Excel:** Subida de archivo con horas/dietas
- **Validación:** Verificación de formato
- **Procesamiento:** Importación automática
- **Confirmación:** Resultados de la importación

#### Importación de Gasolina

- **Archivo Excel:** Cargar gastos de gasolina
- **Validación:** Comprobar estructura
- **Procesamiento:** Importar datos
- **Reporte:** Resultados de la operación

#### Cotización Especie

- **Importación:** Cargar cupones específicos
- **Validación:** Verificar datos
- **Procesamiento:** Integrar en sistema

### Exportación de Datos

#### Exportación Excel

**Tipos de Exportación:**
- **Anual:** Todos los datos del año
- **Mensual:** Datos de un mes específico
- **Por Empleado:** Datos individuales

**Formatos Disponibles:**
- **Excel:** Formato .xlsx con fórmulas
- **IRPF:** Reporte fiscal
- **Asiento Nómina:** Formato contable

#### Proceso de Exportación

1. **Selección:** Elegir período y tipo
2. **Generación:** Crear archivo
3. **Descarga:** Descargar archivo generado
4. **Confirmación:** Verificar exportación

---

## ⚙️ Funciones Avanzadas

### Carry Over

#### Transferencia de Importes

**Concepto:**
- **Origen:** Período de origen (año/mes)
- **Destino:** Período de aplicación
- **Concepto:** Tipo de importe
- **Monto:** Cantidad a transferir

#### Operaciones

- **Creación:** Nuevo carry over
- **Consulta:** Ver carry overs existentes
- **Eliminación:** Remover carry over
- **Aplicación:** Aplicar en nóminas

### Bearbeitungshistorie (Historial de Ediciones)

#### Seguimiento de Cambios

**Funcionalidad:**
- **Registro:** Todos los cambios en datos
- **Timestamp:** Fecha y hora de modificación
- **Usuario:** Quién realizó el cambio
- **Campo:** Campo modificado

#### Consulta de Historial

- **Por Empleado:** Historial individual
- **Global:** Todos los cambios
- **Fechas:** Filtrar por período

### Salary Copy Manager

#### Copia de Salarios

**Funcionalidad:**
- **Origen:** Salario de año base
- **Destino:** Año de destino
- **Ajustes:** Modificaciones porcentuales
- **Validación:** Verificación de datos

---

## ❓ Preguntas Frecuentes

### Preguntas de Acceso

**P: ¿Qué hago si olvidé mi contraseña?**
R: Utiliza la función "¿Olvidaste tu contraseña?" y sigue las instrucciones por email.

**P: ¿Puedo acceder desde múltiples dispositivos?**
R: Sí, pero solo una sesión activa por usuario.

**P: ¿Por qué mi sesión expira?**
R: Por seguridad, las sesiones tienen tiempo límite de inactividad.

### Preguntas de Empleados

**P: ¿Puedo cambiar el ID de un empleado?**
R: No, el ID es único y no modificable para mantener la integridad de datos.

**P: ¿Qué significa la categoría "Techniker"?**
R: Es personal técnico con acceso a funciones especializadas.

**P: ¿Cómo se calcula el FTE?**
R: Es el porcentaje de tiempo completo, afectando cálculos proporcionales.

### Preguntas de Salarios

**P: ¿Cuál es la diferencia entre 12 y 14 pagas?**
R: 12 pagas son mensuales regulares, 14 incluyen pagas extraordinarias.

**P: ¿Puedo modificar salarios de años anteriores?**
R: Sí, con los permisos adecuados y validación del sistema.

**P: ¿Cómo se aplican las deducciones?**
R: Automáticamente según configuración de porcentajes y tablas.

### Preguntas de Importación/Exportación

**P: ¿Qué formato deben tener los archivos de importación?**
R: Excel con estructura específica según el tipo de dato.

**P: ¿Puedo exportar datos de múltiples empleados a la vez?**
R: Sí, las exportaciones pueden ser anuales o mensuales para todos los empleados.

**P: ¿Qué incluye el reporte IRPF?**
R: Datos fiscales necesarios para declaración de impuestos.

### Preguntas Técnicas

**P: ¿Necesito instalar algún software?**
R: No, es una aplicación web accesible desde navegador.

**P: ¿Qué navegadores son compatibles?**
R: Chrome, Firefox, Safari, Edge en versiones recientes.

**P: ¿Mis datos están seguros?**
R: Sí, con encriptación SSL y autenticación JWT.

---

## 📞 Soporte Técnico

### Contacto

**Administrador del Sistema:**
- **Contacto Directo:** Administrador del sistema para solicitudes de soporte

### Recursos Adicionales

**Documentación:**
- Manual de instalación
- Guía de API
- Best practices

---

**Versión del Manual:** 2.1  
**Última Actualización:** Marzo 2026  
**Basado en:** Versión actual del software

---

*Este manual refleja las funciones actualmente implementadas en el sistema.*
