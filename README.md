# � Digitalización de Nóminas

Sistema web moderno para la gestión digitalizada de nóminas y empleados que reemplaza las aplicaciones de escritorio tradicionales.

## 🚀 Características Principales

- **👥 Gestión de Empleados:** CRUD completo con ordenamiento y categorías
- **💳 Procesamiento de Nóminas:** Cálculo automático con múltiples modalidades
- **🔐 Autenticación Segura:** JWT con restablecimiento de contraseña por email
- **📊 Reportes:** Exportación a Excel y análisis en tiempo real
- **🌐 Interfaz Moderna:** React/Next.js con Tailwind CSS
- **⚡ Backend Robusto:** Python Flask con MySQL

## 🏗️ Arquitectura

### Frontend
- **Tecnología:** React/Next.js 16 con TypeScript
- **Estilos:** Tailwind CSS para diseño responsivo
- **Componentes:** UI moderna y consistente

### Backend  
- **Tecnología:** Python Flask 3.0
- **Base de Datos:** MySQL con triggers optimizados
- **API:** RESTful con autenticación JWT

### Testing
- **Backend:** pytest con 70+ tests
- **Frontend:** Jest con React Testing Library
- **E2E:** Playwright para pruebas de navegador

## 📋 Requisitos

- Node.js 18+ 
- Python 3.11+
- MySQL 8.0+
- Navegador moderno

## 🚀 Instalación Rápida

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Base de Datos
```bash
mysql -u root -p < backend/sql_statements/01_schema/01_schema.sql
mysql -u root -p < backend/sql_statements/02_triggers/01_triggers.sql
```

## � Configuración

1. **Base de Datos:** Configurar conexión en `backend/config/settings.json`
2. **Environment:** Copiar `.env.example` a `.env` y configurar variables
3. **Usuarios:** Crear usuarios de prueba con scripts en `backend/sql_statements/03_data/`

## � Documentación

- **📖 Manual de Usuario:** Ver `docs/user_manual.pdf`
- **🗄️ Documentación Técnica:** Ver `docs/technical_manual.pdf`
- **🧪 Testing:** Ver `testing/README.md`

## 🌐 Despliegue

### Azure (Recomendado)
```bash
# Ver azure-setup.md para configuración completa
az group create --name rrhh --location westeurope
az mysql flexible-server create --resource-group rrhh --name digitalisierung-mysql
```

### Docker
```bash
docker-compose up -d
```

## 🧪 Testing

```bash
# Backend Tests
cd testing/backend
pytest -v

# Frontend Tests  
cd testing/frontend
npm test

# E2E Tests
cd testing/e2e
npx playwright test
```

## 📊 Estadísticas del Proyecto

- **📁 Archivos:** 50+ archivos de código
- **🧪 Tests:** 70+ tests con cobertura integral
- **🌐 Idiomas:** Español, Alemán, Inglés
- **📱 Responsive:** Mobile-first design

## 🤝 Contribuir

1. Fork del repositorio
2. Crear feature branch
3. Commit con cambios
4. Push al branch
5. Pull Request

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles

## 📞 Soporte

- **📧 Email:** soporte@digitalizacion.com
- **📱 Teléfono:** +49 123 456789
- **💬 Discord:** [Servidor de Discord]

---

**Última Actualización:** Marzo 2026  
**Versión:** 2.0  
**Estado:** Production Ready

---

*Para documentación detallada, ver los archivos PDF en `docs/`*
