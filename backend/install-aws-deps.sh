#!/bin/bash

echo "Installing AWS SDK dependencies..."

npm install @aws-sdk/client-s3@^3.1031.0 \
  @aws-sdk/lib-storage@^3.1031.0 \
  @aws-sdk/s3-request-presigner@^3.1031.0

echo "AWS dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Copy backend/.env.example to backend/.env"
echo "2. Configure AWS credentials in .env"
echo "3. Set UPLOAD_STRATEGY=s3 to use S3"
echo "4. Run: npm start"
