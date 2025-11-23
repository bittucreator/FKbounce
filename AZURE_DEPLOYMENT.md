# Azure Functions Deployment Guide

## 🚀 Setup Azure Workers for Email Verification

This guide shows you how to deploy Azure Functions workers while keeping Vercel for your main API.

### Prerequisites

1. Azure account with subscription
2. Azure CLI installed: `brew install azure-cli`
3. Azure Functions Core Tools: `npm install -g azure-functions-core-tools@4`

### Step 1: Install Dependencies

```bash
cd azure-functions
npm install
```

### Step 2: Create Azure Resources

```bash
# Login to Azure
az login

# Create resource group
az group create --name EmailVerifierWorkers --location eastus

# Create storage account
az storage account create \
  --name emailverifierstorage \
  --resource-group EmailVerifierWorkers \
  --location eastus \
  --sku Standard_LRS

# Create function app (Consumption plan - pay per execution)
az functionapp create \
  --resource-group EmailVerifierWorkers \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name email-verifier-workers \
  --storage-account emailverifierstorage
```

### Step 3: Configure Environment Variables

```bash
# Get storage connection string
STORAGE_CONNECTION=$(az storage account show-connection-string \
  --name emailverifierstorage \
  --resource-group EmailVerifierWorkers \
  --output tsv)

# Set function app settings
az functionapp config appsettings set \
  --name email-verifier-workers \
  --resource-group EmailVerifierWorkers \
  --settings \
    "SUPABASE_URL=your_supabase_url" \
    "SUPABASE_SERVICE_KEY=your_supabase_service_key" \
    "VERCEL_CALLBACK_URL=https://your-app.vercel.app/api/azure-callback"
```

### Step 4: Deploy Function

```bash
# Build TypeScript
npm run build

# Deploy to Azure
func azure functionapp publish email-verifier-workers
```

### Step 5: Update Vercel Environment Variables

Add to your Vercel project:

```env
AZURE_STORAGE_CONNECTION_STRING=your_storage_connection_string
AZURE_QUEUE_NAME=email-verification-jobs
ENABLE_AZURE_WORKERS=true
```

### Step 6: Install Azure SDK in Main Project

```bash
cd ..
npm install @azure/storage-queue
```

### How It Works

```
User Request (100K emails)
    ↓
Vercel API (/api/verify-bulk)
    ↓
Checks: emailCount >= 10,000?
    ↓ YES
Sends job to Azure Queue
    ↓
Azure Function picks up job
    ↓
Processes with 2000+ workers
    ↓
Sends results to Vercel callback
    ↓
Vercel updates database + webhooks
    ↓
User receives completion notification
```

### Benefits

✅ **No Vercel timeout** - Azure handles long-running jobs
✅ **Powerful compute** - Azure provides more CPU/memory
✅ **Pay per use** - Only pay when processing
✅ **Auto-scaling** - Azure scales workers automatically
✅ **Better for 100K+** - Handles massive batches efficiently

### Cost Estimate

**Azure Functions Consumption Plan:**
- First 1 million executions: FREE
- After: $0.20 per million executions
- Execution time: $0.000016/GB-s

**Example: 1M email verification**
- ~50-60 minutes execution
- ~4GB memory = ~240 GB-seconds
- Cost: ~$0.004 (less than 1 cent!)

### Testing Locally

```bash
cd azure-functions
npm start
```

Then trigger a test job from Vercel dev server.

### Monitoring

View logs in Azure Portal:
```bash
az functionapp logs tail \
  --name email-verifier-workers \
  --resource-group EmailVerifierWorkers
```

---

**Next Steps:**
1. Deploy Azure Function
2. Update Vercel env vars
3. Install @azure/storage-queue in main project
4. Test with 10K+ email batch
5. Monitor Azure logs and costs
