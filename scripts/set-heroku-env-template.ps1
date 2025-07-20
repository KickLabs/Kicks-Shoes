# Heroku Environment Variables Setup Template
# Replace the placeholder values with your actual secrets
Write-Host "Setting up Heroku environment variables..." -ForegroundColor Green

# Server Configuration
heroku config:set PORT=3000

# Database Configuration
heroku config:set MONGODB_URI="YOUR_MONGODB_URI_HERE"

# JWT Configuration
heroku config:set JWT_SECRET="YOUR_JWT_SECRET_HERE"
heroku config:set JWT_EXPIRES_IN="1d"
heroku config:set JWT_REFRESH_SECRET="YOUR_JWT_REFRESH_SECRET_HERE"
heroku config:set JWT_REFRESH_EXPIRES_IN="7d"

# Email Configuration
heroku config:set GOOGLE_MAILER_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID_HERE"
heroku config:set GOOGLE_MAILER_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET_HERE"
heroku config:set GOOGLE_MAILER_REFRESH_TOKEN="YOUR_GOOGLE_REFRESH_TOKEN_HERE"
heroku config:set FROM_NAME="Kicks Shoes"
heroku config:set ADMIN_EMAIL_ADDRESS="YOUR_ADMIN_EMAIL_HERE"

# Frontend URL
heroku config:set FRONTEND_URL="YOUR_FRONTEND_URL_HERE"

# Cloudinary Configuration
heroku config:set CLOUDINARY_CLOUD_NAME="YOUR_CLOUDINARY_CLOUD_NAME_HERE"
heroku config:set CLOUDINARY_API_KEY="YOUR_CLOUDINARY_API_KEY_HERE"
heroku config:set CLOUDINARY_API_SECRET="YOUR_CLOUDINARY_API_SECRET_HERE"

# VNPay Configuration
heroku config:set VNPAY_TMN_CODE="YOUR_VNPAY_TMN_CODE_HERE"
heroku config:set VNPAY_SECURE_SECRET="YOUR_VNPAY_SECURE_SECRET_HERE"

Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host "You can verify by running: heroku config" -ForegroundColor Yellow 