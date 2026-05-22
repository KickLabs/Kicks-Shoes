#!/bin/bash
# Build script for Lambda function

set -e

echo "🔨 Building Lambda function..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create deployment package
echo "📦 Creating deployment package..."
cd ..
rm -f bedrock-chat.zip
zip -r bedrock-chat.zip bedrock-chat/ -x "*.git*" "*.md" "build.sh" "test-local.js"

echo "✅ Lambda package created: bedrock-chat.zip"
echo "📊 Package size:"
ls -lh bedrock-chat.zip

echo ""
echo "🚀 Next steps:"
echo "1. Copy to Terraform directory:"
echo "   cp backend/lambda/bedrock-chat.zip infra/terraform/lambda-placeholder.zip"
echo ""
echo "2. Deploy with Terraform:"
echo "   cd infra/terraform/environments/dev/02-app"
echo "   terraform init"
echo "   terraform plan"
echo "   terraform apply"
