# Azure Deployment Guide for SMTP Microservice

## Step 1: Create Azure App Service

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "App Service" → Click "Create"
4. Fill in:
   - **Resource Group**: Create new or use existing
   - **Name**: `fkbounce-smtp` (will be `fkbounce-smtp.azurewebsites.net`)
   - **Runtime**: Node 18 LTS
   - **Region**: Choose closest to your users
   - **Plan**: Basic B1 ($13/month) or higher

## Step 2: Configure Environment Variables

In Azure Portal → Your App Service → Configuration → Application settings:

Add these:
```
API_KEY = generate-secure-random-key-here
ALLOWED_ORIGINS = https://fkbounce.com,https://app.fkbounce.com
PORT = 8080
```

Click "Save"

## Step 3: Deploy Code

### Option A: Azure CLI (Fastest)

```bash
# Install Azure CLI if needed
# brew install azure-cli  # macOS
# Or download from https://aka.ms/InstallAzureCLIDeb

# Login
az login

# Deploy
cd smtp-microservice
az webapp up --name fkbounce-smtp --resource-group YourResourceGroup --runtime "NODE:18-lts"
```

### Option B: GitHub Actions

1. In Azure Portal → Your App Service → Deployment Center
2. Select "GitHub"
3. Authorize and select your repo
4. Select branch: `main`
5. It will auto-create workflow file

### Option C: VS Code Extension

1. Install "Azure App Service" extension
2. Right-click `smtp-microservice` folder
3. Select "Deploy to Web App"
4. Choose your app service

## Step 4: Test Deployment

Visit: `https://fkbounce-smtp.azurewebsites.net/test-port25`

Should return:
```json
{
  "port25Available": true,
  "canConnectToGmail": true,
  "details": ["✅ PORT 25 IS OPEN - SMTP verification will work!"]
}
```

## Step 5: Get Your API Endpoint

Your microservice URL:
```
https://fkbounce-smtp.azurewebsites.net
```

Save this - you'll need it to update your main Vercel app!

## Troubleshooting

### If port 25 still blocked:
- Check Azure region (some regions block it)
- Try different region (West US, East US usually work)
- Contact Azure support to unblock

### If deployment fails:
- Check Node version (must be 18+)
- Verify package.json is valid
- Check Azure logs in Portal

## Cost

Basic B1: ~$13/month with your Azure credits = FREE for you! 🎉
