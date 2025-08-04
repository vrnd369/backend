# Enhanced Razorpay Payment Gateway Integration

This document provides comprehensive guidance for integrating Razorpay payment gateway into your Node.js Express backend with enhanced database schema and comprehensive payment tracking.

## 🚀 Setup Instructions

### 1. Environment Variables

Add the following variables to your `.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

**Important:** Never expose these keys to the frontend. They should only be used in the backend.

### 2. Razorpay Dashboard Configuration

1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **Webhooks**
3. Add a new webhook with the following URL:
   ```
   https://your-backend-domain.com/api/payment/payment-webhook
   ```
4. Select the following events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`

## 📋 API Endpoints

### 1. Create Order
**POST** `/api/payment/create-order`

Creates a new payment order with enhanced schema.

**Request Body:**
```json
{
  "amount": 50000,        // Amount in paise (50000 = ₹500)
  "currency": "INR",      // Optional, defaults to INR
  "receipt": "order_123", // Unique receipt ID
  "userId": "user_id",    // User ID from your database
  "orderItems": [         // Required - Array of order items
    {
      "productId": "prod_123",
      "productName": "Product Name",
      "quantity": 2,
      "price": 25000,     // Price in paise
      "img": "https://example.com/product.jpg"
    }
  ],
  "orderTotal": 50000,    // Required - Total order amount in paise
  "shippingAddress": {    // Required - Shipping address
    "houseName": "House Name",
    "streetArea": "Street Area",
    "city": "City",
    "state": "State",
    "country": "India",
    "pincode": "123456"
  },
  "billingAddress": {     // Required - Billing address
    "houseName": "House Name",
    "streetArea": "Street Area",
    "city": "City",
    "state": "State",
    "country": "India",
    "pincode": "123456"
  },
  "couponCode": "SAVE10", // Optional - Coupon code
  "rewardPointsUsed": 100, // Optional - Reward points used
  "notes": {              // Optional
    "description": "Payment for order #123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "order_1703123456789_abc123",
    "transactionId": "txn_1703123456789_xyz789",
    "razorpayOrderId": "order_ABC123XYZ",
    "amount": 50000,
    "currency": "INR",
    "key": "rzp_test_xxxxxxxxxxxxx"
  }
}
```

### 2. Capture Payment
**POST** `/api/payment/capture-payment`

Captures an authorized payment.

**Request Body:**
```json
{
  "paymentId": "pay_ABC123XYZ",
  "orderId": "order_1703123456789_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment captured successfully",
  "data": {
    "paymentId": "pay_ABC123XYZ",
    "orderId": "order_1703123456789_abc123",
    "status": "captured",
    "amount": 50000
  }
}
```

### 3. Payment Webhook
**POST** `/api/payment/payment-webhook`

Handles Razorpay webhooks for payment status updates.

**Headers:**
- `x-razorpay-signature`: Webhook signature for verification

**Events Handled:**
- `payment.captured`: Payment successfully captured
- `payment.failed`: Payment failed
- `order.paid`: Order marked as paid

### 4. Refund Payment
**POST** `/api/payment/refund-payment`

Processes refunds for captured payments.

**Request Body:**
```json
{
  "paymentId": "pay_ABC123XYZ",
  "amount": 50000,        // Optional, defaults to full amount
  "reason": "Customer request"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment refunded successfully",
  "data": {
    "refundId": "rfnd_ABC123XYZ",
    "paymentId": "pay_ABC123XYZ",
    "amount": 50000,
    "status": "refunded"
  }
}
```

### 5. Get Payment Status
**GET** `/api/payment/payment-status/:orderId`

Retrieves payment status by order ID, transaction ID, or Razorpay order ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_1703123456789_xyz789",
    "orderId": "order_1703123456789_abc123",
    "razorpayOrderId": "order_ABC123XYZ",
    "paymentId": "pay_ABC123XYZ",
    "amount": 50000,
    "currency": "INR",
    "paymentStatus": "captured",
    "paymentMethod": "card",
    "paymentDate": "2023-12-21T10:30:00.000Z",
    "orderTotal": 50000,
    "orderItems": [
      {
        "productId": "prod_123",
        "productName": "Product Name",
        "quantity": 2,
        "price": 25000,
        "img": "https://example.com/product.jpg"
      }
    ],
    "shippingAddress": {
      "houseName": "House Name",
      "streetArea": "Street Area",
      "city": "City",
      "state": "State",
      "country": "India",
      "pincode": "123456"
    },
    "billingAddress": {
      "houseName": "House Name",
      "streetArea": "Street Area",
      "city": "City",
      "state": "State",
      "country": "India",
      "pincode": "123456"
    },
    "couponCode": "SAVE10",
    "rewardPointsUsed": 100,
    "webhookStatus": "verified",
    "signatureValid": true,
    "errorCode": null,
    "errorDescription": null,
    "capturedAt": "2023-12-21T10:35:00.000Z",
    "refundedAt": null,
    "createdAt": "2023-12-21T10:30:00.000Z"
  }
}
```

### 6. Get User Payments
**GET** `/api/payment/user-payments/:userId?page=1&limit=10`

Retrieves all payments for a specific user with pagination.

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [...],
    "totalPages": 5,
    "currentPage": 1,
    "totalPayments": 50
  }
}
```

## 🗄️ Enhanced Database Schema

### User Model Enhancements
The User model now includes comprehensive fields for better user management:

```javascript
{
  firstName: String,           // Required
  lastName: String,            // Required
  email: String,              // Required, unique
  phone: String,              // Optional
  shippingAddress: {          // Object with address details
    houseName: String,
    streetArea: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  billingAddress: {           // Object with address details
    houseName: String,
    streetArea: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  profilePic: String,         // Profile picture URL
  orderHistory: [{            // Array of order history
    orderId: String,
    orderDate: Date,
    orderAmount: Number,
    orderStatus: String,      // pending, processing, shipped, delivered, cancelled
    paymentStatus: String,    // pending, authorized, captured, failed, refunded
    paymentMethod: String,
    items: [{                 // Order items
      productId: String,
      productName: String,
      quantity: Number,
      price: Number,
      img: String
    }]
  }],
  wishlist: Array,            // Wishlist items
  cart: Array                 // Cart items
}
```

### Payment Model Enhancements
The Payment model now includes comprehensive payment tracking:

```javascript
{
  // Razorpay specific fields
  transactionId: String,      // Unique transaction ID
  paymentId: String,          // Razorpay payment ID
  razorpayOrderId: String,    // Razorpay order ID
  
  // Payment details
  amount: Number,             // Amount in paise
  currency: String,           // Currency (INR)
  paymentStatus: String,      // pending, authorized, captured, failed, refunded
  paymentMethod: String,      // card, upi, wallet, etc.
  paymentDate: Date,          // Payment timestamp
  
  // Order details
  orderId: String,            // Internal order ID
  orderItems: [{              // Array of order items
    productId: String,
    productName: String,
    quantity: Number,
    price: Number,
    img: String
  }],
  orderTotal: Number,         // Total order amount
  
  // Address details
  shippingAddress: Object,    // Shipping address
  billingAddress: Object,     // Billing address
  
  // User reference
  userId: ObjectId,           // Reference to User
  
  // Webhook and security
  webhookStatus: String,      // received, verified, failed
  signatureValid: Boolean,    // Webhook signature validation
  
  // Additional fields
  couponCode: String,         // Applied coupon code
  rewardPointsUsed: Number,   // Reward points redeemed
  
  // Error handling
  errorCode: String,          // Error code if payment failed
  errorDescription: String,   // Error description
  
  // Timestamps
  capturedAt: Date,           // Payment capture timestamp
  refundedAt: Date,           // Refund timestamp
  createdAt: Date,            // Order creation timestamp
  updatedAt: Date             // Last update timestamp
}
```

## 🎯 Frontend Integration

### 1. Install Razorpay Checkout

Add the Razorpay checkout script to your HTML:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 2. Create Payment Flow

```javascript
// Step 1: Create order on your backend
const createOrder = async (amount, userId) => {
  try {
    const response = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount, // Amount in paise
        receipt: `order_${Date.now()}`,
        userId: userId,
        notes: {
          description: 'Payment for your order'
        }
      })
    });

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Step 2: Initialize Razorpay checkout
const initiatePayment = async (amount, userId) => {
  try {
    const orderData = await createOrder(amount, userId);
    
    const options = {
      key: orderData.key, // Your Razorpay Key ID
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Your Company Name',
      description: 'Payment for your order',
      order_id: orderData.razorpayOrderId,
      handler: function (response) {
        // Payment successful
        console.log('Payment successful:', response);
        handlePaymentSuccess(response, orderData.orderId);
      },
      prefill: {
        name: 'Customer Name',
        email: 'customer@example.com',
        contact: '9999999999'
      },
      notes: {
        orderId: orderData.orderId
      },
      theme: {
        color: '#3399cc'
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
    
  } catch (error) {
    console.error('Error initiating payment:', error);
    alert('Failed to initiate payment. Please try again.');
  }
};

// Step 3: Handle payment success
const handlePaymentSuccess = async (response, orderId) => {
  try {
    // Verify payment on your backend
    const verifyResponse = await fetch('/api/payment/capture-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentId: response.razorpay_payment_id,
        orderId: orderId
      })
    });

    const verifyData = await verifyResponse.json();
    
    if (verifyData.success) {
      alert('Payment successful!');
      // Redirect to success page or update UI
    } else {
      alert('Payment verification failed. Please contact support.');
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    alert('Payment verification failed. Please contact support.');
  }
};

// Step 4: Handle payment failure
const handlePaymentFailure = (response) => {
  console.error('Payment failed:', response.error);
  alert('Payment failed. Please try again.');
};

// Usage example
document.getElementById('pay-button').addEventListener('click', () => {
  const amount = 50000; // ₹500 in paise
  const userId = 'user_123';
  initiatePayment(amount, userId);
});
```

### 3. React Component Example

```jsx
import React, { useState } from 'react';

const PaymentComponent = ({ amount, userId }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Create order
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          receipt: `order_${Date.now()}`,
          userId: userId
        })
      });

      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error(orderData.message);
      }

      // Initialize Razorpay
      const options = {
        key: orderData.data.key,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: 'Your Company',
        description: 'Payment for your order',
        order_id: orderData.data.razorpayOrderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/capture-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId: response.razorpay_payment_id,
                orderId: orderData.data.orderId
              })
            });

            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
              alert('Payment successful!');
            } else {
              alert('Payment verification failed.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed.');
          }
        },
        prefill: {
          name: 'Customer Name',
          email: 'customer@example.com'
        },
        theme: { color: '#3399cc' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePayment} 
      disabled={loading}
      className="payment-button"
    >
      {loading ? 'Processing...' : 'Pay Now'}
    </button>
  );
};

export default PaymentComponent;
```

## 🔒 Security Considerations

1. **Never expose Razorpay keys to frontend**
2. **Always verify webhook signatures**
3. **Validate payment amounts on backend**
4. **Use HTTPS in production**
5. **Implement proper error handling**
6. **Log all payment activities**

## 🐛 Error Handling

### Common Error Codes

- `BAD_REQUEST_ERROR`: Invalid request parameters
- `PAYMENT_CAPTURE_FAILED`: Payment capture failed
- `ORDER_NOT_FOUND`: Order doesn't exist
- `SIGNATURE_VERIFICATION_FAILED`: Invalid webhook signature

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

## 📊 Payment Status Flow

1. **created**: Order created, payment pending
2. **authorized**: Payment authorized but not captured
3. **captured**: Payment successfully captured
4. **failed**: Payment failed
5. **refunded**: Payment refunded

## 🔧 Testing

### Test Mode
- Use test keys from Razorpay dashboard
- Test with small amounts (₹1 = 100 paise)
- Use test card numbers provided by Razorpay

### Production Mode
- Switch to live keys
- Implement proper logging
- Monitor webhook deliveries
- Set up alerts for failed payments

## 📞 Support

For issues with this integration:
1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Ensure webhook URL is accessible
4. Contact Razorpay support for API-related issues

## 🔄 Webhook Testing

Test webhooks using tools like ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 5000

# Use the ngrok URL in Razorpay webhook settings
# https://abc123.ngrok.io/api/payment/payment-webhook
```

This will help you test webhooks during development. 