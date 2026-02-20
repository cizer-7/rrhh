# 🧪 Manual de Testing - Digitalización de Nóminas

## 📋 Índice

1. [🚀 Inicio Rápido](#-inicio-rápido)
2. [📁 Estructura de Tests](#-estructura-de-tests)
3. [🧪 Tipos de Tests](#-tipos-de-tests)
4. [📊 Cobertura e Informes](#-cobertura-e-informes)
5. [🔧 Configuración](#-configuración)
6. [🐛 Manejo de Errores](#-manejo-de-errores)
7. [📝 Escribir Tests](#-escribir-tests)

---

## 🚀 Inicio Rápido

### Ejecutar Todos los Tests
```bash
# Tests del Backend
python testing/backend/test_backend.py

# Tests del Frontend
cd testing/frontend

# Tests E2E
cd testing/e2e
npx playwright test tests-final.spec.js --project=chromium --reporter=list
```

### Tests Rápidos (Desarrollo)
```bash
# Solo Unit Tests (rápido)
python testing/backend/run_backend_tests.py --unit-only

# Frontend en modo Watch
cd testing/frontend && npm run test:watch

# Tests E2E con navegador visible
cd testing/e2e && npm run test:headed
```

---

## 📁 Estructura de Tests

### Tests del Backend (`testing/backend/`)
- **`run_backend_tests.py`** - Ejecutor principal de tests
- **`test_backend_core.py`** - Tests de DatabaseManager
- **`test_api_core.py`** - Tests de Flask API
- **`test_integration_simple.py`** - Tests de integración

### Tests del Frontend (`testing/frontend/`)
- **`*.test.js`** - Tests de componentes React
- **`jest.config.js`** - Configuración de Jest
- **`package.json`** - Dependencias de tests

### Tests E2E (`testing/e2e/`)
- **`tests-final.spec.js`** - Suite principal de tests E2E
- **`playwright.config.js`** - Configuración de Playwright
- **`test-results/`** - Resultados de tests y capturas de pantalla

---

## 🧪 Tipos de Tests

### Unit Tests del Backend
**Propósito:** Tests aislados de componentes individuales del backend

**Funciones Probadas:**
- Métodos de DatabaseManager
- Endpoints de Flask API
- Procesamiento de Tokens JWT
- Hash de Contraseñas
- Operaciones de base de datos

**Ejemplo:**
```python
def test_employee_creation(self, mock_db_manager):
    result = mock_db_manager.create_employee(test_data)
    assert result['success'] is True
    assert 'employee_id' in result
```

### Unit Tests del Frontend
**Propósito:** Tests de componentes React individuales

**Funciones Probadas:**
- Renderizado de componentes
- Interacciones del usuario
- Validación de formularios
- Gestión de estado
- **Nuevo:** Funciones de ordenación e interacciones de tabla
- **Nuevo:** Filtrado por categoría y búsqueda

**Ejemplo:**
```javascript
test('renders employee form correctly', () => {
  render(<EmployeeForm />);
  expect(screen.getByLabelText('Name')).toBeInTheDocument();
});

// Nuevo test para ordenación
test('table sorting works correctly', () => {
  render(<EmployeeTable />);
  fireEvent.click(screen.getByText('Name'));
  expect(screen.getByRole('arrow-up')).toBeInTheDocument();
});
```

### Tests de Integración
**Propósito:** Tests de flujos de trabajo completos

**Flujos de Trabajo Probados:**
- Operaciones CRUD de empleados
- Gestión de salarios
- Autenticación de usuarios
- Exportación Excel

### Tests End-to-End
**Propósito:** Tests de flujos de trabajo completos del usuario en el navegador

**Escenarios Probados:**
- Proceso de login
- Creación y edición de empleados
- Procesamiento de nóminas
- Exportación de datos
- **Nuevo:** Flujo de restablecimiento de contraseña
- **Nuevo:** Ordenación y filtrado en la UI
- **Nuevo:** Gestión de empleados basada en categorías

---

## 📊 Cobertura e Informes

### Cobertura del Backend
- **Informes HTML:** `htmlcov_db/` y `htmlcov_api/`
- **Informes de Terminal:** Salida directa en terminal
- **Objetivo:** >80% de cobertura de código

### Cobertura del Frontend
- **Informe HTML:** `testing/frontend/coverage/`
- **Formato LCOV:** Para integración CI/CD
- **Objetivo:** >80% de cobertura de componentes

### Informes E2E
- **Capturas de Pantalla:** Automáticas en caso de errores
- **Videos:** Para propósitos de debugging
- **Informe HTML:** `testing/e2e/playwright-report/`

---

## 🔧 Configuración

### Configuración del Backend
**Archivo:** `testing/pytest.ini`
- Configuración de descubrimiento de tests
- Definición de marcadores
- Formato de salida

**Dependencias:** `testing/backend/requirements.txt`
```
pytest==7.4.3
pytest-cov==4.1.0
pytest-mock==3.12.0
mysql-connector-python==8.2.0
```

### Configuración del Frontend
**Archivo:** `testing/frontend/jest.config.js`
- Configuración de React Testing Library
- Soporte TypeScript
- Variables de entorno de tests

### Configuración E2E
**Archivo:** `testing/e2e/playwright.config.js`
- Configuración del navegador
- Configuración de timeouts
- Configuración de reporteros

---

## 🐛 Manejo de Errores

### Problemas Comunes

#### Problemas del Backend
1. **Conexión a base de datos fallida**
   - Solución: Los tests usan mocks, no se necesita DB real
   - Verificación: Instalación de mysql-connector-python

2. **Faltan dependencias del backend**
   ```bash
   pip install -r testing/backend/requirements.txt
   ```

#### Problemas del Frontend
1. **Versión de Node.js**
   - Requerido: Node.js 18+
   - Verificación: `node --version`

2. **Errores de TypeScript**
   - Solución: Verificar tsconfig.json
   - Verificación: Definiciones de tipos presentes

#### Problemas E2E
1. **Navegador no instalado**
   ```bash
   cd testing/e2e && npm run install:browsers
   ```

2. **Servidor no alcanzable**
   - Solución: Iniciar backend y frontend
   - Verificación: URLs de configuración de Playwright

---

## 📝 Escribir Tests

### Agregar Test del Backend
```python
import pytest
from testing.conftest_comprehensive import *

@pytest.mark.unit
class TestNewFeature:
    def test_new_functionality(self, mock_db_manager):
        # Arrange
        test_data = {...}
        
        # Act
        result = mock_db_manager.new_method(test_data)
        
        # Assert
        assert result['success'] is True
```

### Agregar Test del Frontend
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  test('handles user interaction', () => {
    render(<MyComponent />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### Agregar Test E2E
```javascript
import { test, expect } from '@playwright/test';

test('complete user workflow', async ({ page }) => {
  await page.goto('/');
  
  await page.fill('[data-testid="username"]', 'test');
  await page.fill('[data-testid="password"]', 'test');
  await page.click('[data-testid="login-button"]');
  
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
});
```

---

## 📈 Estadísticas de Tests

### Cobertura Actual de Tests
- **Total:** 70+ tests
- **Unit Tests del Backend:** 35+ tests (incluyendo API Core, Autenticación)
- **Tests de Flask API:** 30+ tests (todos los endpoints)
- **Tests de Integración:** 10+ tests (flujos completos)
- **Tests del Frontend:** Tests de componentes React (EmployeeTable, Formularios)
- **Tests E2E:** Tests de flujos basados en navegador (Gestión de empleados)

### Tiempos de Ejecución de Tests
- **Unit Tests:** < 2 minutos
- **Tests de Integración:** < 5 minutos
- **Tests E2E:** < 10 minutos
- **Total:** < 20 minutos

---

*Próximos documentos: [Resumen del Sistema](01_Overview.md) | [Documentación de Base de Datos](02_Database.md) | [Manual de Usuario](04_UserManual.md)*
