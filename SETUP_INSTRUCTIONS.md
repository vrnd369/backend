# Razorpay Integration Setup Instructions

## 🔧 Environment Variables Setup

Add the following variables to your `.env` file:

```env
# Existing variables (keep these)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
GOOGLE_CLIENT_ID=your-google-client-id

# New Razorpay variables (add these)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Optional server configuration
PORT=5000
NODE_ENV=development
```

## 🚀 Getting Razorpay Keys

1. **Sign up/Login** to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. **Go to Settings** → **API Keys**
3. **Generate API Key** (if not already generated)
4. **Copy Key ID and Key Secret**
5. **Add them to your .env file**

## 📋 Installation Steps

1. **Install Dependencies** (already done):
   ```bash
   npm install razorpay crypto axios
   ```

2. **Add Environment Variables** to your `.env` file

3. **Start the Server**:
   ```bash
   npm start
   ```

4. **Test the Integration**:
   ```bash
   node test-payment.js
   ```

## 🔗 Webhook Configuration

1. **Go to Razorpay Dashboard** → **Settings** → **Webhooks**
2. **Add New Webhook** with URL:
   ```
   https://your-backend-domain.com/api/payment/payment-webhook
   ```
3. **Select Events**:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`

## 🧪 Testing

### Test Mode
- Use test keys from Razorpay dashboard
- Test with small amounts (₹1 = 100 paise)
- Use test card numbers:
  - **Card Number**: 4111 1111 1111 1111
  - **Expiry**: Any future date
  - **CVV**: Any 3 digits
  - **Name**: Any name

### Production Mode
- Switch to live keys from Razorpay dashboard
- Ensure HTTPS is enabled
- Monitor webhook deliveries

## 📁 Files Created

1. **`utils/razorpay.js`** - Razorpay configuration and utilities
2. **`models/Payment.js`** - Payment database model
3. **`routes/payment.js`** - Payment API endpoints
4. **`test-payment.js`** - Integration test file
5. **`RAZORPAY_INTEGRATION.md`** - Comprehensive documentation

## 🔒 Security Notes

- ✅ Never expose Razorpay keys to frontend
- ✅ Always verify webhook signatures
- ✅ Use HTTPS in production
- ✅ Validate payment amounts on backend
- ✅ Implement proper error handling

## 🆘 Troubleshooting

### Common Issues:

1. **"Missing required environment variables"**
   - Check your `.env` file has all required variables

2. **"Invalid signature"**
   - Verify webhook signature verification
   - Check if webhook URL is correct

3. **"Order not found"**
   - Ensure order was created successfully
   - Check database connection

4. **"Payment capture failed"**
   - Verify payment was authorized
   - Check Razorpay dashboard for payment status

### Debug Steps:

1. **Check server logs** for detailed error messages
2. **Verify environment variables** are set correctly
3. **Test webhook URL** accessibility
4. **Check Razorpay dashboard** for API errors

## 📞 Support

- **Backend Issues**: Check server logs and error messages
- **Razorpay API Issues**: Contact Razorpay support
- **Integration Issues**: Refer to `RAZORPAY_INTEGRATION.md` 