const express = require('express');
const router = express.Router();
const { razorpay, verifyWebhookSignature, generateOrderId, hasRazorpayKeys } = require('../utils/razorpay');
const Payment = require('../models/Payment');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// JWT Secret - in production, use a strong secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// JWT Authentication Middleware for payment routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('Payment capture: No authorization token provided');
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log('Payment capture: Invalid or expired token:', err.message);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }

    try {
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        console.log('Payment capture: User not found for token:', decoded.userId);
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }
      req.user = user;
      next();
    } catch (error) {
      console.error('Payment capture: Authentication error:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Authentication failed' 
      });
    }
  });
};

// Optional authentication - doesn't fail if user not found
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (!err && decoded) {
          const user = await User.findById(decoded.userId).select('-password');
          if (user) {
            req.user = user;
          }
        }
        next();
      });
    } else {
      next();
    }
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue even if auth fails
  }
};

// ✅ Test JWT Authentication
router.get('/test-auth', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    message: 'JWT authentication working correctly',
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name
    }
  });
});

// ✅ Create Order API
router.post('/create-order', authenticateToken, async (req, res) => {
  try {
    const { 
      amount, 
      currency = 'INR', 
      receipt, 
      orderItems, 
      orderTotal,
      shippingAddress,
      billingAddress,
      couponCode = '',
      rewardPointsUsed = 0,
      notes = {}
    } = req.body;

    // Get userId from authenticated user
    const userId = req.user._id;

    // Validate required fields
    if (!amount || !receipt || !orderItems || !orderTotal || !shippingAddress || !billingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Amount, receipt, orderItems, orderTotal, shippingAddress, and billingAddress are required'
      });
    }

    // Validate amount (should be in paise)
    if (amount < 100) { // Minimum 1 INR
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least 100 paise (1 INR)'
      });
    }

    // Validate order items
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items array is required and cannot be empty'
      });
    }

    // Process orderItems to handle frontend format (title vs productName)
    const processedOrderItems = orderItems.map(item => ({
      productId: item.productId,
      productName: item.productName || item.title || 'Product', // Use title if productName not provided
      title: item.title || item.productName || 'Product', // Store both for flexibility
      description: item.description || '',
      quantity: item.quantity,
      price: item.price,
      img: item.img || ''
    }));

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate unique order ID and transaction ID
    const orderId = generateOrderId();
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Debug log to verify amount and orderTotal
    console.log('Received from frontend:', { amount, orderTotal, orderItems });

    // Always use the amount received from the frontend (in paise)
    console.log('Using amount for Razorpay order:', amount);
    // Debug log to verify the amount received from the frontend
    console.log('Creating Razorpay order with amount:', amount);

    const orderOptions = {
      amount: amount, // This should be the value from the frontend, in paise
      currency: currency,
      receipt: receipt,
      notes: {
        ...notes,
        couponCode: couponCode,
        rewardPointsUsed: rewardPointsUsed.toString()
      },
      payment_capture: 1 // Auto capture payment
    };

    console.log('Order options sent to Razorpay:', orderOptions);

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Save order to database with enhanced schema
    const payment = new Payment({
      transactionId: transactionId,
      paymentId: null, // Will be updated when payment is captured
      razorpayOrderId: razorpayOrder.id,
      amount: amount,
      currency: currency,
      paymentStatus: 'pending',
      paymentMethod: '',
      paymentDate: new Date(),
      orderId: orderId,
      orderItems: processedOrderItems,
      orderTotal: orderTotal,
      shippingAddress: shippingAddress,
      billingAddress: billingAddress,
      userId: userId,
      webhookStatus: 'received',
      signatureValid: false,
      couponCode: couponCode,
      rewardPointsUsed: rewardPointsUsed
    });

    await payment.save();

    console.log('Order created successfully:', {
      orderId: orderId,
      transactionId: transactionId,
      razorpayOrderId: razorpayOrder.id,
      amount: amount
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: orderId,
        transactionId: transactionId,
        razorpayOrderId: razorpayOrder.id,
        amount: amount,
        currency: currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ Capture Payment API
router.post('/capture-payment', authenticateToken, async (req, res) => {
  try {
    // Log the full request body for debugging
    console.log('Capture payment request body:', req.body);
    // Accept both frontend and Razorpay field names
    const paymentId = req.body.paymentId || req.body.razorpay_payment_id;
    const orderId = req.body.orderId || req.body.razorpay_order_id;
    const razorpaySignature = req.body.razorpay_signature;

    if (!paymentId || !orderId) {
      console.log('Payment capture: Missing required fields', { paymentId, orderId });
      return res.status(400).json({
        success: false,
        message: 'Payment ID and Order ID are required'
      });
    }

    // Find the payment record
    const payment = await Payment.findOne({ 
      $or: [
        { orderId: orderId },
        { razorpayOrderId: orderId }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if Razorpay is available
    if (!hasRazorpayKeys || !razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently unavailable. Please try again later.'
      });
    }

    // Check payment status from Razorpay before capturing
    const paymentDetails = await razorpay.payments.fetch(paymentId);

    if (paymentDetails.status === 'captured') {
      // Already captured, just update your DB and return success
      payment.paymentStatus = 'captured';
      payment.paymentId = paymentId;
      payment.paymentMethod = paymentDetails.method || '';
      payment.capturedAt = new Date();
      payment.webhookStatus = 'verified';
      payment.razorpaySignature = razorpaySignature || payment.razorpaySignature;
      payment.signatureValid = !!razorpaySignature;
      await payment.save();

      await updateUserOrderHistory(payment);

      return res.json({
        success: true,
        message: 'Payment already captured',
        data: {
          paymentId: paymentId,
          orderId: orderId,
          transactionId: payment.transactionId,
          paymentStatus: 'captured',
          paymentMethod: payment.paymentMethod,
          amount: payment.amount,
          orderTotal: payment.orderTotal
        }
      });
    }

    // If not captured, proceed to capture
    const captureResponse = await razorpay.payments.capture(
      paymentId,
      payment.amount,
      payment.currency
    );

    // Update payment status with enhanced fields
    payment.paymentStatus = 'captured';
    payment.paymentId = paymentId; // This will now be razorpay_payment_id if sent
    payment.paymentMethod = captureResponse.method || '';
    payment.capturedAt = new Date();
    payment.webhookStatus = 'verified';
    payment.razorpaySignature = razorpaySignature || payment.razorpaySignature; // Save signature if present
    payment.signatureValid = !!razorpaySignature; // Set to true if signature is present
    await payment.save();

    // Update user's order history
    await updateUserOrderHistory(payment);

    console.log('Payment captured successfully:', {
      paymentId: paymentId,
      orderId: orderId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      userId: req.user._id
    });

    res.json({
      success: true,
      message: 'Payment captured successfully',
      data: {
        paymentId: paymentId,
        orderId: orderId,
        transactionId: payment.transactionId,
        paymentStatus: 'captured',
        paymentMethod: payment.paymentMethod,
        amount: payment.amount,
        orderTotal: payment.orderTotal
      }
    });

  } catch (error) {
    console.error('Error capturing payment:', error);
    
    // Handle specific Razorpay errors
    if (error.error) {
      return res.status(400).json({
        success: false,
        message: 'Payment capture failed',
        error: error.error.description || 'Payment capture failed'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to capture payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ Payment Webhook
router.post('/payment-webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    // Verify webhook signature
    const signatureValid = verifyWebhookSignature(body, signature);
    
    const { 
      event, 
      payload 
    } = req.body;

    console.log('Webhook received:', { event, payload, signatureValid });

    // Find payment record by Razorpay order ID or payment ID
    let payment = null;
    if (payload.payment) {
      payment = await Payment.findOne({ 
        $or: [
          { paymentId: payload.payment.id },
          { razorpayOrderId: payload.payment.order_id }
        ]
      });
    } else if (payload.order) {
      payment = await Payment.findOne({ 
        razorpayOrderId: payload.order.id 
      });
    }

    if (payment) {
      // Update webhook status
      payment.webhookStatus = signatureValid ? 'verified' : 'failed';
      payment.signatureValid = signatureValid;
      await payment.save();
    } else {
      console.log('Payment record not found for webhook:', { event, payload });
    }

    if (!signatureValid) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      
      case 'payment.authorized':
        await handlePaymentAuthorized(payload);
        break;
      
      case 'order.paid':
        await handleOrderPaid(payload);
        break;
      
      default:
        console.log('Unhandled webhook event:', event);
    }

    res.json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

// ✅ Refund Payment API
router.post('/refund-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentId, amount, reason = 'Customer request' } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    // Find the payment record
    const payment = await Payment.findOne({ paymentId: paymentId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.paymentStatus !== 'captured') {
      return res.status(400).json({
        success: false,
        message: 'Payment must be captured before refund'
      });
    }

    // Check if Razorpay is available
    if (!hasRazorpayKeys || !razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently unavailable. Please try again later.'
      });
    }

    // Create refund using Razorpay
    const refundOptions = {
      amount: amount || payment.amount, // Refund full amount if not specified
      speed: 'normal', // or 'optimum'
      notes: {
        reason: reason
      }
    };

    const refund = await razorpay.payments.refund(paymentId, refundOptions);

    // Update payment status
    payment.paymentStatus = 'refunded';
    payment.refundId = refund.id;
    payment.refundedAt = new Date();
    await payment.save();

    console.log('Payment refunded successfully:', {
      paymentId: paymentId,
      refundId: refund.id,
      amount: refundOptions.amount
    });

    res.json({
      success: true,
      message: 'Payment refunded successfully',
      data: {
        refundId: refund.id,
        paymentId: paymentId,
        transactionId: payment.transactionId,
        amount: refundOptions.amount,
        paymentStatus: 'refunded'
      }
    });

  } catch (error) {
    console.error('Error refunding payment:', error);
    
    if (error.error) {
      return res.status(400).json({
        success: false,
        message: 'Refund failed',
        error: error.error.description || 'Refund failed'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to refund payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ Get Payment Status
router.get('/payment-status/:orderId', optionalAuth, async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({
      $or: [
        { orderId: orderId },
        { razorpayOrderId: orderId },
        { transactionId: orderId }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: {
        transactionId: payment.transactionId,
        orderId: payment.orderId,
        razorpayOrderId: payment.razorpayOrderId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        paymentStatus: payment.paymentStatus,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        orderTotal: payment.orderTotal,
        orderItems: payment.orderItems,
        shippingAddress: payment.shippingAddress,
        billingAddress: payment.billingAddress,
        couponCode: payment.couponCode,
        rewardPointsUsed: payment.rewardPointsUsed,
        webhookStatus: payment.webhookStatus,
        signatureValid: payment.signatureValid,
        errorCode: payment.errorCode,
        errorDescription: payment.errorDescription,
        capturedAt: payment.capturedAt,
        refundedAt: payment.refundedAt,
        createdAt: payment.createdAt
      }
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ Get User Payments
router.get('/user-payments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Payment.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        payments,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalPayments: count
      }
    });

  } catch (error) {
    console.error('Error getting user payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user payments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper functions for webhook processing
async function handlePaymentCaptured(payload) {
  try {
    const { payment } = payload;
    
    const paymentRecord = await Payment.findOne({ 
      $or: [
        { paymentId: payment.id },
        { razorpayOrderId: payment.order_id }
      ]
    });

    if (paymentRecord) {
      paymentRecord.paymentStatus = 'captured';
      paymentRecord.paymentId = payment.id;
      paymentRecord.paymentMethod = payment.method || '';
      paymentRecord.capturedAt = new Date();
      paymentRecord.webhookStatus = 'verified';
      paymentRecord.signatureValid = true;
      await paymentRecord.save();
      
      // Update user's order history
      await updateUserOrderHistory(paymentRecord);
      
      console.log('Payment status updated to captured:', payment.id);
    } else {
      console.log('Payment record not found for capture:', payment.id);
    }
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

async function handlePaymentAuthorized(payload) {
  try {
    const { payment } = payload;
    
    const paymentRecord = await Payment.findOne({ 
      $or: [
        { paymentId: payment.id },
        { razorpayOrderId: payment.order_id }
      ]
    });

    if (paymentRecord) {
      paymentRecord.paymentStatus = 'authorized';
      paymentRecord.paymentId = payment.id;
      paymentRecord.paymentMethod = payment.method || '';
      paymentRecord.webhookStatus = 'verified';
      paymentRecord.signatureValid = true;
      await paymentRecord.save();
      
      console.log('Payment status updated to authorized:', payment.id);
    } else {
      console.log('Payment record not found for authorization:', payment.id);
    }
  } catch (error) {
    console.error('Error handling payment authorized:', error);
  }
}

async function handlePaymentFailed(payload) {
  try {
    const { payment } = payload;
    
    const paymentRecord = await Payment.findOne({ 
      $or: [
        { paymentId: payment.id },
        { razorpayOrderId: payment.order_id }
      ]
    });

    if (paymentRecord) {
      paymentRecord.paymentStatus = 'failed';
      paymentRecord.paymentId = payment.id;
      paymentRecord.errorCode = payment.error_code;
      paymentRecord.errorDescription = payment.error_description;
      paymentRecord.webhookStatus = 'verified';
      paymentRecord.signatureValid = true;
      await paymentRecord.save();
      
      console.log('Payment status updated to failed:', payment.id);
    } else {
      console.log('Payment record not found for failure:', payment.id);
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleOrderPaid(payload) {
  try {
    const { order } = payload;
    
    const paymentRecord = await Payment.findOne({ 
      razorpayOrderId: order.id 
    });

    if (paymentRecord) {
      paymentRecord.paymentStatus = 'captured';
      paymentRecord.capturedAt = new Date();
      paymentRecord.webhookStatus = 'verified';
      paymentRecord.signatureValid = true;
      await paymentRecord.save();
      
      // Update user's order history
      await updateUserOrderHistory(paymentRecord);
      
      console.log('Order paid status updated:', order.id);
    }
  } catch (error) {
    console.error('Error handling order paid:', error);
  }
}

// Helper function to update user's order history
async function updateUserOrderHistory(payment) {
  try {
    const user = await User.findById(payment.userId);
    if (!user) {
      console.error('User not found for order history update:', payment.userId);
      return;
    }

    // Create order history entry
    const orderHistoryEntry = {
      orderId: payment.orderId,
      orderDate: payment.paymentDate,
      orderAmount: payment.orderTotal,
      orderStatus: 'pending', // Default order status
      paymentStatus: payment.paymentStatus,
      paymentMethod: payment.paymentMethod,
      items: payment.orderItems.map(item => ({
        productId: item.productId,
        productName: item.productName || item.title || 'Product',
        title: item.title || item.productName || 'Product',
        description: item.description || '',
        quantity: item.quantity,
        price: item.price,
        img: item.img || ''
      }))
    };

    // Add to user's order history
    user.orderHistory.push(orderHistoryEntry);
    await user.save();

    console.log('User order history updated for user:', payment.userId);
  } catch (error) {
    console.error('Error updating user order history:', error);
  }
}

module.exports = router; 