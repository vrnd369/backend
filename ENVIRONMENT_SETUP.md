# Environment Variables Setup Guide

## Required Environment Variables

Create a `.env` file in your backend root directory with the following variables:

```env
# Required for basic functionality
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password
GOOGLE_CLIENT_ID=your-google-oauth-client-id

# Optional (will use defaults if missing)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development

# Razorpay Configuration (optional - payment features disabled if missing)
RAZORPAY_KEY_ID=rzp_test_your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Server Configuration (optional)
PORT=5000
```

## How to Get These Values

### 1. MONGO_URI
- Go to MongoDB Atlas
- Create a cluster
- Get your connection string
- Replace `<username>`, `<password>`, and `<database>` with your values

### 2. EMAIL_USER & EMAIL_PASS
- Use a Gmail account
- Enable 2-factor authentication
- Generate an App Password
- Use the app password as EMAIL_PASS

### 3. GOOGLE_CLIENT_ID
- Go to Google Cloud Console
- Create a project
- Enable Google+ API
- Create OAuth 2.0 credentials
- Use the Client ID

### 4. JWT_SECRET
- Generate a random string (at least 32 characters)
- Example: `my-super-secret-jwt-key-2024-change-in-production`

### 5. Razorpay Keys (Optional)
- Sign up for Razorpay
- Get test keys from dashboard
- Use test keys for development

## Development vs Production

### Development
- JWT_SECRET can be any string
- Use test Razorpay keys
- NODE_ENV=development

### Production
- Use a strong, random JWT_SECRET
- Use live Razorpay keys
- NODE_ENV=production
- Secure all environment variables

## Quick Start for Testing

If you just want to test the routing, you can create a minimal `.env` file:

```env
MONGO_URI=your-mongodb-connection-string
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password
GOOGLE_CLIENT_ID=your-google-client-id
```

The server will use default values for missing optional variables.

## Security Notes

1. Never commit `.env` files to version control
2. Use different values for development and production
3. Rotate secrets regularly in production
4. Use strong, random passwords for JWT_SECRET 