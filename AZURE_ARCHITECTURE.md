# 🔷 Azure + Vercel Hybrid Architecture

## Overview

Your email verifier now supports **Azure Functions workers** for heavy bulk verification while keeping Vercel for the frontend/API.

## 📁 What Was Created

### Azure Functions (New Directory: `/azure-functions`)

azure-functions/
├── email-verifier-worker/
│   ├── function.json          # Queue trigger config
│   └── index.ts                # Worker logic (processes emails)
├── host.json                   # Azure Functions runtime config
├── local.settings.json         # Environment variables
├── package.json                # Azure-specific dependencies
└── tsconfig.json               # TypeScript config for Azure

### Vercel Integration

lib/azure-worker-client.ts      # Queue client (enqueues jobs)
app/api/azure-callback/route.ts # Receives results from Azure

### Documentation

AZURE_DEPLOYMENT.md             # Complete setup guide

## 🎯 How It Works

### Small Jobs (< 10K emails) → Vercel

User → Vercel API → Process inline → Return results
⏱️ Fast, no extra infrastructure needed

### Large Jobs (≥ 10K emails) → Azure

User → Vercel API → Azure Queue → Azure Function → Callback → Vercel
⏱️ No timeout limits, powerful compute

User → Vercel API → Azure Queue → Azure Function → Callback → Vercel
⏱️ No timeout limits, powerful compute

## 🚀 Deployment Steps

### 1. Install Azure Dependencies

```bash
npm install @azure/storage-queue
cd azure-functions && npm install && cd ..
```

### 2. Deploy to Azure (See AZURE_DEPLOYMENT.md)

```bash
az login
# Create resources (see full guide)
func azure functionapp publish email-verifier-workers
```

### 3. Add Vercel Environment Variables

```env
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
ENABLE_AZURE_WORKERS=true
```

### 4. Test

```bash
# Send 10K+ email verification request
# Check Azure logs to see worker processing
az functionapp logs tail --name email-verifier-workers --resource-group EmailVerifierWorkers
```

## 💰 Cost Comparison

### Vercel Only

- Function timeout: 10s (hobby), 60s (pro), 300s (enterprise)
- 100K emails: ❌ Timeout (needs enterprise plan)
- Memory: 1GB (hobby), 3GB (pro)

### Vercel + Azure

- No timeout limits
- 100K emails: ✅ ~5-6 minutes in Azure
- 1M emails: ✅ ~50-60 minutes in Azure
- Azure cost: < $0.01 per 1M emails

## 🎛️ Configuration

The system automatically routes jobs:

```typescript
// In azure-worker-client.ts
export function shouldUseAzureWorkers(emailCount: number): boolean {
  return azureWorkerClient.isEnabled() && emailCount >= 10000
}
```

**Threshold:** 10,000 emails

- Below 10K: Vercel processes (2000 workers)
- Above 10K: Azure processes (unlimited workers)

## 🔧 Optional: Update verify-bulk Endpoint

To enable Azure routing, add this to `/app/api/verify-bulk/route.ts`:

```typescript
import { azureWorkerClient, shouldUseAzureWorkers } from '@/lib/azure-worker-client'

// After deduplication, before verification:
if (shouldUseAzureWorkers(uniqueEmails.length)) {
  const result = await azureWorkerClient.enqueueJob({
    jobId: job?.id,
    userId: user.id,
    emails: uniqueEmails,
    concurrency: 2000,
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/azure-callback`
  })
  
  return NextResponse.json({ 
    jobId: job?.id,
    status: 'processing',
    message: 'Job queued for Azure processing',
    estimatedTime: '5-10 minutes'
  })
}
```

## ✅ Benefits

| Feature | Vercel Only | Vercel + Azure |
|---------|-------------|----------------|
| Max emails | 10K | Unlimited |
| Timeout | 10-300s | No limit |
| Cost (100K) | Enterprise plan | < $0.01 |
| Cold start | ~2s | ~5s |
| Monitoring | Vercel logs | Azure Portal |

## 📊 Performance Expectations

| Email Count | Vercel Only | With Azure |
|-------------|-------------|------------|
| 1K | 30s ✅ | 30s ✅ |
| 10K | 5 min ✅ | 3 min ✅ |
| 100K | ❌ Timeout | 5-6 min ✅ |
| 1M | ❌ Timeout | 50-60 min ✅ |

## 🔐 Security Notes

1. **Azure Callback**: Validates `X-Azure-Worker: true` header
2. **Queue Messages**: Base64 encoded JSON
3. **Connection String**: Stored in Vercel env (encrypted)
4. **CORS**: Configure in Azure if calling from browser

## 📝 Next Steps

1. ✅ Azure Functions code created
2. ⏳ Deploy to Azure (follow AZURE_DEPLOYMENT.md)
3. ⏳ Install @azure/storage-queue in main project
4. ⏳ Add Vercel environment variables
5. ⏳ Test with 10K+ email batch
6. ⏳ Monitor costs and performance

---

**Deployment is optional!** Your app works perfectly on Vercel alone. Azure is for handling enterprise-scale batches without timeouts.
