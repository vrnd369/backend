# Deployment Checklist - Razorpay Integration

## ✅ Pre-Deployment Verification

### 1. Environment Variables Setup
- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `EMAIL_USER` - Gmail address for sending emails
- [ ] `EMAIL_PASS` - Gmail app password
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `RAZORPAY_KEY_ID` - Razorpay Key ID (optional for deployment)
- [ ] `RAZORPAY_KEY_SECRET` - Razorpay Key Secret (optional for deployment)

### 2. Code Verification
- [ ] All syntax errors fixed
- [ ] Database models updated with enhanced schema
- [ ] Payment routes properly secured with authentication
- [ ] Error handling implemented for all endpoints
- [ ] Webhook signature verification working
- [ ] User model updated (firstName, lastName, addresses, orderHistory)

### 3. Dependencies
- [ ] All required packages installed
- [ ] Package.json updated with correct versions
- [ ] No conflicting dependencies

## 🚀 Deployment Steps

### 1. Render Deployment
1. **Connect Repository**
   - Link your GitHub repository to Render
   - Set build command: `npm install`
   - Set start command: `npm start`

2. **Environment Variables**
   - Add all required environment variables in Render dashboard
   - Ensure `NODE_ENV=production` is set

3. **Build Settings**
   - Node.js version: 18.x or higher
   - Build command: `npm install`
   - Start command: `npm start`

### 2. Razorpay Configuration (After Deployment)
1. **Get Razorpay Keys**
   - Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Go to Settings → API Keys
   - Generate new API key if needed
   - Copy Key ID and Key Secret

2. **Add Keys to Render**
   - Go to your Render service dashboard
   - Navigate to Environment Variables
   - Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

3. **Configure Webhook**
   - In Razorpay Dashboard, go to Settings → Webhooks
   - Add webhook URL: `https://your-app-name.onrender.com/api/payment/payment-webhook`
   - Select events: `payment.captured`, `payment.failed`, `payment.authorized`, `order.paid`

## 🧪 Testing Checklist

### 1. Server Health
- [ ] Health endpoint responds correctly
- [ ] MongoDB connection established
- [ ] All routes accessible

### 2. Authentication
- [ ] Payment routes require authentication
- [ ] Invalid user IDs are rejected
- [ ] Proper error messages returned

### 3. Payment Endpoints
- [ ] Create order endpoint works (with Razorpay keys)
- [ ] Payment status endpoint accessible
- [ ] User payments endpoint works
- [ ] Error handling for missing Razorpay keys

### 4. Database Operations
- [ ] User creation works
- [ ] Order history updates correctly
- [ ] Payment records saved properly

## 🔒 Security Checklist

### 1. Environment Variables
- [ ] No sensitive data in code
- [ ] All keys stored in environment variables
- [ ] Production environment variables set

### 2. Authentication
- [ ] Payment routes protected
- [ ] User validation implemented
- [ ] Input validation working

### 3. Webhook Security
- [ ] Signature verification implemented
- [ ] Invalid signatures rejected
- [ ] Webhook URL secured

## 📊 Monitoring Checklist

### 1. Logging
- [ ] Payment events logged
- [ ] Error messages detailed
- [ ] Webhook processing logged

### 2. Error Tracking
- [ ] 500 errors handled gracefully
- [ ] Validation errors return proper status codes
- [ ] Database errors logged

### 3. Performance
- [ ] Response times acceptable
- [ ] Database queries optimized
- [ ] No memory leaks

## 🎯 Post-Deployment Verification

### 1. Manual Testing
```bash
# Test server health
curl https://your-app-name.onrender.com/health

# Test payment endpoints (with authentication)
curl -X POST https://your-app-name.onrender.com/api/payment/create-order \
  -H "Content-Type: application/json" \
  -H "user-id: YOUR_USER_ID" \
  -d '{"amount": 10000, "currency": "INR", ...}'
```

### 2. Razorpay Integration Test
1. Create a test order
2. Complete payment with test card
3. Verify webhook received
4. Check database records updated

### 3. Production Checklist
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting implemented (if needed)
- [ ] Backup strategy in place

## 🆘 Troubleshooting

### Common Issues
1. **Server won't start**
   - Check environment variables
   - Verify MongoDB connection
   - Check Node.js version

2. **Payment endpoints return 503**
   - Razorpay keys not configured
   - Add keys to environment variables

3. **Webhook not working**
   - Verify webhook URL is correct
   - Check signature verification
   - Ensure HTTPS is used

4. **Database errors**
   - Check MongoDB connection string
   - Verify database permissions
   - Check schema compatibility

## 📞 Support

- **Backend Issues**: Check server logs in Render dashboard
- **Razorpay Issues**: Contact Razorpay support
- **Deployment Issues**: Check Render documentation

## 🔄 Update Process

1. **Code Changes**
   - Push to GitHub
   - Render auto-deploys
   - Monitor deployment logs

2. **Environment Variables**
   - Update in Render dashboard
   - Redeploy service
   - Test functionality

3. **Database Changes**
   - Run migrations if needed
   - Test with sample data
   - Monitor for errors

---

**Note**: This backend is ready for deployment without Razorpay keys. Payment functionality will be disabled until keys are added, but all other features will work normally. 