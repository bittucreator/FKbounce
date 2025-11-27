# SMTP Microservice for FKbounce

A lightweight SMTP verification microservice designed for deployment on Azure (or any VPS with port 25 access).

## Features

- ✅ SMTP email verification via port 25
- ✅ Catch-all detection
- ✅ SMTP provider detection (Gmail, Microsoft 365, etc.)
- ✅ MX fallback (tries backup servers)
- ✅ Bulk verification support
- ✅ Rate limiting
- ✅ API key authentication
- ✅ Docker support

## API Endpoints

### Health Check
```
GET /health
```

### Test Port 25
```
GET /test-port25
```

### Verify Single Email
```
POST /verify
Headers: X-API-Key: your-api-secret
Body: { "email": "user@example.com" }
```

Response:
```json
{
  "email": "user@example.com",
  "smtp": true,
  "catch_all": false,
  "smtp_provider": "Google Workspace",
  "connected": true,
  "mx_servers": 5,
  "error": null
}
```

### Verify Bulk Emails
```
POST /verify-bulk
Headers: X-API-Key: your-api-secret
Body: { "emails": ["user1@example.com", "user2@example.com"] }
```

## Deployment on Azure

### Option 1: Azure Container Instances (Recommended)

1. **Create Azure Container Registry:**
```bash
az acr create --resource-group myResourceGroup --name fkbouncesmtp --sku Basic
az acr login --name fkbouncesmtp
```

2. **Build and Push Docker Image:**
```bash
cd smtp-microservice
docker build -t fkbouncesmtp.azurecr.io/smtp-service:latest .
docker push fkbouncesmtp.azurecr.io/smtp-service:latest
```

3. **Deploy Container Instance:**
```bash
az container create \
  --resource-group myResourceGroup \
  --name smtp-service \
  --image fkbouncesmtp.azurecr.io/smtp-service:latest \
  --cpu 1 \
  --memory 1 \
  --ports 3001 \
  --dns-name-label fkbounce-smtp \
  --environment-variables \
    PORT=3001 \
    API_SECRET=your-super-secret-key \
    ALLOWED_ORIGINS=https://fkbounce.com
```

4. **Get the URL:**
```bash
az container show --resource-group myResourceGroup --name smtp-service --query ipAddress.fqdn
```
Your service will be at: `http://fkbounce-smtp.<region>.azurecontainer.io:3001`

### Option 2: Azure App Service

1. **Create App Service:**
```bash
az webapp create \
  --resource-group myResourceGroup \
  --plan myAppServicePlan \
  --name fkbounce-smtp \
  --deployment-container-image-name fkbouncesmtp.azurecr.io/smtp-service:latest
```

2. **Configure Environment Variables:**
```bash
az webapp config appsettings set \
  --resource-group myResourceGroup \
  --name fkbounce-smtp \
  --settings \
    PORT=3001 \
    API_SECRET=your-super-secret-key \
    ALLOWED_ORIGINS=https://fkbounce.com
```

### Option 3: Azure VM (Full Control)

1. Create an Ubuntu VM (B1s is sufficient - ~$4/month)
2. SSH into the VM
3. Install Node.js and clone this repo
4. Run with PM2:
```bash
npm install -g pm2
cd smtp-microservice
npm install
pm2 start server.js --name smtp-service
pm2 save
pm2 startup
```

## Important: Port 25 on Azure

⚠️ **Azure blocks outbound port 25 by default** for VMs created after November 2017.

### Solutions:

1. **Azure Container Instances** - Port 25 is usually NOT blocked
2. **Azure Enterprise subscription** - Can request port 25 unblock
3. **Use an older VM** - VMs created before Nov 2017 have port 25 open
4. **Create support ticket** - Request Microsoft to unblock port 25

To check if port 25 is open, deploy and visit:
```
http://your-service-url:3001/test-port25
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3001 |
| API_SECRET | API key for authentication | (required) |
| ALLOWED_ORIGINS | Comma-separated CORS origins | https://fkbounce.com |

## Connecting to FKbounce

After deployment, update your `.env.local` in the main app:

```env
SMTP_SERVICE_URL=https://your-azure-url:3001
SMTP_SERVICE_API_KEY=your-super-secret-key
```

Then update the verification routes to call this service instead of direct SMTP.
