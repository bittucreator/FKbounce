#!/bin/bash

# Azure Email Verifier Workers - Setup Script
# Run this after Microsoft.Web provider is registered

set -e

echo "🚀 Setting up Azure Email Verifier Workers..."

# Variables
RESOURCE_GROUP="EmailVerifierWorkers"
LOCATION="eastus"
STORAGE_ACCOUNT="emailverifierstorage"
FUNCTION_APP="email-verifier-workers"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Checking Microsoft.Web provider registration...${NC}"
REGISTRATION_STATE=$(az provider show -n Microsoft.Web --query "registrationState" -o tsv)
if [ "$REGISTRATION_STATE" != "Registered" ]; then
  echo "Microsoft.Web is still: $REGISTRATION_STATE"
  echo "Please wait a few more minutes and run this script again"
  echo "Or check status with: az provider show -n Microsoft.Web"
  exit 1
fi
echo -e "${GREEN}✓ Microsoft.Web is registered${NC}"

echo -e "\n${BLUE}Step 2: Creating Function App...${NC}"
az functionapp create \
  --resource-group $RESOURCE_GROUP \
  --consumption-plan-location $LOCATION \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name $FUNCTION_APP \
  --storage-account $STORAGE_ACCOUNT \
  --os-type Linux
echo -e "${GREEN}✓ Function App created${NC}"

echo -e "\n${BLUE}Step 3: Getting storage connection string...${NC}"
STORAGE_CONNECTION=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --output tsv)
echo -e "${GREEN}✓ Storage connection string retrieved${NC}"

echo -e "\n${BLUE}Step 4: Configuring Function App settings...${NC}"
echo "Please provide the following values:"
read -p "Supabase URL: " SUPABASE_URL
read -p "Supabase Service Key: " SUPABASE_SERVICE_KEY
read -p "Vercel App URL (e.g., https://your-app.vercel.app): " VERCEL_URL

az functionapp config appsettings set \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    "SUPABASE_URL=$SUPABASE_URL" \
    "SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY" \
    "VERCEL_CALLBACK_URL=$VERCEL_URL/api/azure-callback" \
    "AzureWebJobsStorage=$STORAGE_CONNECTION"
echo -e "${GREEN}✓ Function App configured${NC}"

echo -e "\n${BLUE}Step 5: Building TypeScript...${NC}"
npm run build
echo -e "${GREEN}✓ TypeScript compiled${NC}"

echo -e "\n${BLUE}Step 6: Deploying function to Azure...${NC}"
func azure functionapp publish $FUNCTION_APP
echo -e "${GREEN}✓ Function deployed${NC}"

echo -e "\n${GREEN}🎉 Setup complete!${NC}"
echo -e "\n${BLUE}Next steps:${NC}"
echo "1. Add this to your Vercel environment variables:"
echo "   AZURE_STORAGE_CONNECTION_STRING=$STORAGE_CONNECTION"
echo "   ENABLE_AZURE_WORKERS=true"
echo ""
echo "2. Test the setup by sending a bulk verification with 10K+ emails"
echo ""
echo "3. Monitor logs with:"
echo "   az functionapp logs tail --name $FUNCTION_APP --resource-group $RESOURCE_GROUP"
