# Azure Ressourcen Einrichtung

## Voraussetzungen
- Azure Account mit ausreichenden Berechtigungen
- Azure CLI installiert und konfiguriert
- Node.js und Python für lokale Tests

## Wo führe ich die Befehle aus?
- **`az ...` Befehle (Azure CLI):** Entweder lokal in deinem Terminal (PowerShell) **oder** im Azure Portal über **Cloud Shell**.
- **`mysql ... < ...sql` Import-Befehle:** Am einfachsten **lokal** (weil du dafür den MySQL-Client brauchst und Zugriff auf die SQL-Dateien im Repo).

## 1. Azure Resource Group erstellen
```bash
az group create \
  --name rrhh \
  --location westeurope
```

## 2. Azure Database for MySQL (Flexible Server) einrichten
```bash
# MySQL Flexible Server erstellen
az mysql flexible-server create \
  --resource-group rrhh \
  --name digitalisierung-mysql \
  --location westeurope \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 8.0 \
  --admin-user <dein-admin-user> \
  --admin-password <starkes-passwort> \
  --storage-size 32 \
  --public-access 0.0.0.0

# Datenbank erstellen (entspricht eurem Default-Namen "nomina")
az mysql flexible-server db create \
  --resource-group rrhh \
  --server-name digitalisierung-mysql \
  --database-name nomina

# Firewall-Regel für deinen aktuellen Client (optional, falls du DB-Import lokal machst)
# Start/Ende mit deiner öffentlichen IP setzen
az mysql flexible-server firewall-rule create \
  --resource-group rrhh \
  --name AllowMyIP \
  --server-name digitalisierung-mysql \
  --start-ip-address <deine-ip> \
  --end-ip-address <deine-ip>
```

## 2.1 Schema + Trigger importieren
Die SQL-Skripte liegen im Repo unter:
- `backend/sql_statements/01_schema/01_schema.sql`
- `backend/sql_statements/02_triggers/01_triggers.sql`

Import (lokal, mit installiertem MySQL Client):
```bash
# Schema anlegen
mysql -h digitalisierung-mysql.mysql.database.azure.com -u <dein-admin-user> -p --ssl-mode=REQUIRED nomina < backend/sql_statements/01_schema/01_schema.sql

# Trigger/Indizes anlegen
mysql -h digitalisierung-mysql.mysql.database.azure.com -u <dein-admin-user> -p --ssl-mode=REQUIRED nomina < backend/sql_statements/02_triggers/01_triggers.sql

# (Optional) Testdaten importieren
mysql -h digitalisierung-mysql.mysql.database.azure.com -u <dein-admin-user> -p --ssl-mode=REQUIRED nomina < backend/sql_statements/03_data/00_insert_employees.sql
mysql -h digitalisierung-mysql.mysql.database.azure.com -u <dein-admin-user> -p --ssl-mode=REQUIRED nomina < backend/sql_statements/03_data/01_insert_benutzer.sql
mysql -h digitalisierung-mysql.mysql.database.azure.com -u <dein-admin-user> -p --ssl-mode=REQUIRED nomina < backend/sql_statements/03_data/02_insert_salaries.sql
mysql -h digitalisierung-mysql.mysql.database.azure.com -u <dein-admin-user> -p --ssl-mode=REQUIRED nomina < backend/sql_statements/03_data/03_insert_income.sql
```

## 3. Azure App Service für Backend
```bash
# App Service Plan erstellen
az appservice plan create \
  --name digitalisierung-backend-plan \
  --resource-group rrhh \
  --location westeurope \
  --sku B1 \
  --is-linux

# Backend Web App erstellen
az webapp create \
  --resource-group rrhh \
  --plan digitalisierung-backend-plan \
  --name digitalisierung-backend \
  --runtime "PYTHON|3.11"
```

## 4. Azure App Service für Frontend
```bash
# Frontend App Service Plan erstellen
az appservice plan create \
  --name digitalisierung-frontend-plan \
  --resource-group rrhh \
  --location westeurope \
  --sku B1 \
  --is-linux

# Frontend Web App erstellen
az webapp create \
  --resource-group rrhh \
  --plan digitalisierung-frontend-plan \
  --name digitalisierung-frontend \
  --runtime "NODE|18-lts"
```

## 5. Storage Account für Dateien
```bash
az storage account create \
  --name digitalisierungstorage \
  --resource-group rrhh \
  --location westeurope \
  --sku Standard_LRS \
  --kind StorageV2
```

## 6. Connection Strings und wichtige Informationen abrufen
```bash
# MySQL Hostname anzeigen
az mysql flexible-server show \
  --resource-group rrhh \
  --name digitalisierung-mysql \
  --query fullyQualifiedDomainName \
  -o tsv

# Storage Account Connection String
az storage account show-connection-string \
  --name digitalisierungstorage \
  --resource-group rrhh
```

## 7. Environment Variables für Backend setzen
```bash
az webapp config appsettings set \
  --resource-group rrhh \
  --name digitalisierung-backend \
  --settings \
    DB_HOST="digitalisierung-mysql.mysql.database.azure.com" \
    DB_NAME="nomina" \
    DB_USER="<dein-admin-user>" \
    DB_PASSWORD="<starkes-passwort>" \
    DB_PORT="3306" \
    DB_SSL_DISABLED="false" \
    AZURE_STORAGE_CONNECTION_STRING="<dein-storage-connection-string>" \
    FLASK_ENV=production \
    SECRET_KEY="<dein-secret-key>"
```

## 8. CORS für Frontend einrichten
```bash
az webapp cors add \
  --resource-group rrhh \
  --name digitalisierung-backend \
  --allowed-origins "https://digitalisierung-frontend.azurewebsites.net"
```

## Wichtige Informationen notieren:
- **Resource Group**: rrhh
- **MySQL Server**: digitalisierung-mysql.mysql.database.azure.com
- **Database**: nomina
- **Backend URL**: https://digitalisierung-backend.azurewebsites.net
- **Frontend URL**: https://digitalisierung-frontend.azurewebsites.net
- **Storage Account**: digitalisierungstorage

## Nächste Schritte:
1. Backend für Azure Production konfigurieren
2. Frontend für Azure Production konfigurieren
3. GitHub Actions Workflows erstellen
