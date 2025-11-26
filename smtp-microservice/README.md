# SMTP Verification Microservice

Azure-hosted microservice for SMTP and catch-all email verification.

## Environment Variables

Create a `.env` file (not committed to git):

```env
PORT=3001
ALLOWED_ORIGINS=https://fkbounce.com,https://app.fkbounce.com,https://www.fkbounce.com
NODE_ENV=production
```

## Local Development

```bash
cd smtp-microservice
npm install
npm run dev
```

Test locally:
```bash
curl -X POST http://localhost:3001/api/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"support@zapmail.ai"}'
```

## Azure Deployment Steps

### 1. Install Azure CLI
```bash
# macOS
brew install azure-cli

# Login
az login
```

### 2. Create Azure Resources
```bash
# Set variables
RESOURCE_GROUP="fkbounce-rg"
APP_NAME="fkbounce-smtp"
LOCATION="eastus"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service Plan (B1 Basic tier)
az appservice plan create \
  --name "${APP_NAME}-plan" \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan "${APP_NAME}-plan" \
  --name $APP_NAME \
  --runtime "NODE:18-lts"
```

### 3. Configure App Settings
```bash
# Set environment variables
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    NODE_ENV=production \
    ALLOWED_ORIGINS="https://fkbounce.com,https://app.fkbounce.com,https://www.fkbounce.com" \
    PORT=8080
```

### 4. Deploy Code
```bash
# Option A: Deploy from local directory
cd smtp-microservice
zip -r deploy.zip .
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src deploy.zip

# Option B: Deploy from GitHub (recommended)
az webapp deployment source config \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --repo-url https://github.com/bittucreator/FKbounce \
  --branch main \
  --manual-integration
```

### 5. Test Deployment
```bash
# Get the URL
echo "https://${APP_NAME}.azurewebsites.net/health"

# Test health endpoint
curl https://${APP_NAME}.azurewebsites.net/health

# Test verification
curl -X POST https://${APP_NAME}.azurewebsites.net/api/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"support@zapmail.ai"}'
```

## API Endpoints

### Health Check
```
GET /health
```

### Verify Single Email
```
POST /api/verify
Body: { "email": "test@example.com", "checkCatchAll": true }
Response: { "smtp": true, "catchAll": false, "mxRecords": [...] }
```

### Check SMTP Only
```
POST /api/check-smtp
Body: { "email": "test@example.com", "domain": "example.com" }
Response: { "smtp": true, "mxRecords": [...] }
```

### Check Catch-All Only
```
POST /api/check-catchall
Body: { "domain": "example.com" }
Response: { "catchAll": false, "mxRecords": [...] }
```

### Bulk Verification
```
POST /api/verify-bulk
Body: { "emails": ["email1@test.com", "email2@test.com"], "checkCatchAll": true }
Response: { "results": [{ "email": "...", "smtp": true, "catchAll": false }] }
```

## Monitoring

View logs:
```bash
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP
```

## Cost Estimate

- Basic B1 App Service Plan: ~$13/month
- Includes 1.75 GB RAM, 1 vCPU
- 99.95% SLA
- Auto-scaling available

## Security

- CORS enabled for your domains only
- Rate limiting: 100 requests/minute per IP
- Helmet.js security headers
- Request size limit: 10MB
