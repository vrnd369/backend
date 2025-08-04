# Shiprocket Environment Setup Guide

## 🚨 **CRITICAL: Missing Environment Variables**

The 400 error you're experiencing is caused by **missing Shiprocket credentials** in your environment variables.

## 📝 **Required .env File**

Create a `.env` file in your backend root directory with these variables:

```env
# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-oauth-client-id

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# 🚨 SHIPROCKET CREDENTIALS (REQUIRED)
SHIPROCKET_EMAIL=your-shiprocket-email@domain.com
SHIPROCKET_PASSWORD=your-shiprocket-password

# Server Configuration
PORT=5000
NODE_ENV=development
```

## 🔑 **How to Get Shiprocket Credentials**

### 1. **Sign Up for Shiprocket**
- Go to [Shiprocket.in](https://shiprocket.in)
- Create an account or log in

### 2. **Get Your Credentials**
- Log into your Shiprocket dashboard
- Go to **Settings** → **API Credentials**
- Copy your **Email** and **Password**

### 3. **Add to Your .env File**
```env
SHIPROCKET_EMAIL=your-actual-shiprocket-email@domain.com
SHIPROCKET_PASSWORD=your-actual-shiprocket-password
```

## 🔗 **Webhook Configuration (CRITICAL for Tracking Updates)**

### **Why Webhooks are Important:**
When you ship a product from the Shiprocket website, the tracking information (AWB code, courier name) should automatically update in your database. This requires webhook configuration.

### **1. Configure Webhook in Shiprocket Dashboard:**

1. **Log into your Shiprocket Dashboard**
2. **Go to Settings** → **Webhooks** (or **API Settings**)
3. **Add New Webhook** with these details:

```
Webhook URL: https://your-backend-domain.com/api/orders/shiprocket-webhook
Events to Listen: 
- Order Status Updates
- Shipment Created
- AWB Generated
- Courier Assigned
```

### **2. Webhook Payload Structure:**
Your backend expects this webhook payload:
```json
{
  "order_id": "910618760",
  "shipment_id": "906922174", 
  "awb_code": "AWB123456789",
  "courier_name": "DTDC Express",
  "status": "shipped",
  "status_code": "shipped"
}
```

### **3. Test Webhook Configuration:**
After setting up the webhook, test it by:
1. Creating an order in your website
2. Going to Shiprocket dashboard
3. Assigning a courier and generating AWB
4. Checking if your database gets updated automatically

## 🔍 **Why This Fixes the 400 Error**

### **Current Problem:**
```
❌ Shiprocket authentication failed: {
  errors: {
    email: [ 'The email is required.' ],
    password: [ 'The password is required.' ]
  },
  status_code: 422
}
```

### **After Fix:**
```
✅ Authentication successful, token received
✅ Shiprocket API calls will work properly
✅ No more 400 errors in frontend
```

## 🧪 **Test Your Setup**

After adding the credentials, run this test:

```bash
node test_shiprocket_400_error.js
```

You should see:
```
✅ Authentication successful, token received
✅ Got expected error: (for invalid order test)
✅ Real order check successful: (for valid orders)
```

## 🚀 **Deploy to Render**

### **For Render Deployment:**

1. **Add Environment Variables in Render Dashboard:**
   - Go to your Render service
   - Click **Environment**
   - Add these variables:
     - `SHIPROCKET_EMAIL`
     - `SHIPROCKET_PASSWORD`
     - All other required variables

2. **Redeploy Your Service:**
   - Render will automatically redeploy with new environment variables

## ✅ **Expected Results**

After adding Shiprocket credentials:

1. **✅ Authentication will work**
2. **✅ Order creation will work**
3. **✅ Shiprocket updates will work**
4. **✅ No more 400 errors**
5. **✅ Real Shiprocket IDs will be saved**
6. **✅ Tracking information will auto-update via webhooks**

## 🆘 **If You Don't Have Shiprocket Account**

If you don't have Shiprocket credentials yet:

1. **Sign up at [Shiprocket.in](https://shiprocket.in)**
2. **Get your API credentials**
3. **Add them to your .env file**
4. **Configure webhooks for tracking updates**
5. **Test the integration**

## 📞 **Support**

If you need help getting Shiprocket credentials or setting up the integration, contact Shiprocket support or check their documentation. 