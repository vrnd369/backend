const express = require('express');
const router = express.Router();
const { razorpay, verifyWebhookSignature, generateOrderId, hasRazorpayKeys } = require('../utils/razorpay');
const { getCurrentIndianTime } = require('../utils/indianTime');
const shiprocket = require('../utils/shiprocket');
const shiprocketUpdater = require('../utils/shiprocketUpdater');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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

// ✅ Verify Payment and Update Order Status
router.post('/verify-payment', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Verifying payment and updating order status...');
    
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      orderId, // Our internal order ID
      items,
      shippingAddress,
      billingAddress,
      subtotal,
      shippingCost,
      tax,
      total,
      paymentMethod,
      notes
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification data'
      });
    }

    // Verify Razorpay payment signature
    const signatureValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
    if (!signatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Payment verification failed.'
      });
    }

    console.log('✅ Payment signature verified successfully');

    // Find or create the order
    let order = null;
    
    if (orderId) {
      // Try to find existing order
      order = await Order.findOne({ 
        orderId: orderId,
        userId: req.user._id 
      });
    }

    // If order doesn't exist, create it
    if (!order) {
      console.log('📋 Creating new order for payment verification...');
      
      if (!items || !shippingAddress || !billingAddress || !total) {
        return res.status(400).json({
          success: false,
          message: 'Missing required order data for order creation'
        });
      }

      // Create new order
      order = new Order({
        userId: req.user._id,
        items,
        shippingAddress,
        billingAddress,
        subtotal: subtotal || 0,
        shippingCost: shippingCost || 0,
        tax: tax || 0,
        total,
        paymentMethod: paymentMethod || 'online',
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        notes: notes || 'Order placed through payment verification'
      });

      await order.save();
      console.log('✅ New order created for payment verification:', order.orderId);
    } else {
      console.log('📋 Found existing order for payment verification:', order.orderId);
    }

    // Update order status
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    await order.save();

    console.log('✅ Order status updated to confirmed and paid');

    // Create shipment in Shiprocket
    try {
      console.log('🚚 Creating Shiprocket order for payment verification...');
      
      const shiprocketOrderData = {
        order_id: order.orderId,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: 'warehouse',
        billing_customer_name: req.user.firstName + ' ' + req.user.lastName,
        billing_last_name: req.user.lastName,
        billing_address: order.billingAddress.houseName,
        billing_address_2: order.billingAddress.streetArea,
        billing_city: order.billingAddress.city,
        billing_pincode: order.billingAddress.pincode,
        billing_state: order.billingAddress.state,
        billing_country: order.billingAddress.country,
        billing_email: req.user.email,
        billing_phone: req.user.phone,
        shipping_customer_name: req.user.firstName + ' ' + req.user.lastName,
        shipping_last_name: req.user.lastName,
        shipping_address: order.shippingAddress.houseName,
        shipping_address_2: order.shippingAddress.streetArea,
        shipping_city: order.shippingAddress.city,
        shipping_pincode: order.shippingAddress.pincode,
        shipping_state: order.shippingAddress.state,
        shipping_country: order.shippingAddress.country,
        shipping_email: req.user.email,
        shipping_phone: req.user.phone,
        order_items: order.items.map(item => ({
          name: item.title,
          sku: item.productId,
          units: item.quantity,
          selling_price: item.price,
          discount: 0,
          tax: 0
        })),
        sub_total: order.subtotal || 0,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5,
        payment_method: 'Prepaid',
        shipping_is_billing: true
      };

      console.log('📦 Shiprocket order data:', shiprocketOrderData);

      const shiprocketResponse = await shiprocket.createOrder(shiprocketOrderData);
      
      console.log('🚚 Shiprocket response:', shiprocketResponse);
      
      // Check if Shiprocket response is successful
      if (shiprocketResponse && !shiprocketResponse.message?.includes('Wrong Pickup location')) {
        const responseData = shiprocketResponse;
        
        // Save real Shiprocket Order ID
        if (responseData.order_id) {
          order.shiprocketOrderId = responseData.order_id;
          console.log('✅ Saved Shiprocket Order ID:', responseData.order_id);
        }
        
        // Save real Shipment ID
        if (responseData.shipment_id) {
          order.shiprocketShipmentId = responseData.shipment_id;
          console.log('✅ Saved Shiprocket Shipment ID:', responseData.shipment_id);
        }
        
        // Only save courier name if it's real (not empty)
        if (responseData.courier_name && responseData.courier_name !== '') {
          order.courierName = responseData.courier_name;
          console.log('✅ Saved Courier Name:', responseData.courier_name);
        }
        
        // Only save AWB if it's real (not empty)
        if (responseData.awb_code && responseData.awb_code !== '') {
          order.trackingNumber = responseData.awb_code;
          console.log('✅ Saved Tracking Number:', responseData.awb_code);
        }
        
        // Only save tracking URL if it's real
        if (responseData.tracking_url && responseData.tracking_url !== '') {
          order.trackingUrl = responseData.tracking_url;
          console.log('✅ Saved Tracking URL:', responseData.tracking_url);
        }
        
        console.log('✅ Shiprocket order created with real data');
        console.log('Real Shiprocket Order ID:', responseData.order_id);
        console.log('Real Shipment ID:', responseData.shipment_id);
        console.log('Real Courier Name:', responseData.courier_name || 'Not assigned yet');
        console.log('Real AWB Code:', responseData.awb_code || 'Not assigned yet');
      } else {
        console.log('⚠️ Shiprocket order creation returned error or invalid response');
        console.log('Response:', shiprocketResponse);
        order.notes = (order.notes || '') + ' | Shiprocket order creation failed: ' + (shiprocketResponse?.message || 'Unknown error');
      }
      
      await order.save();
      console.log('✅ Order saved with Shiprocket data');

    } catch (shiprocketError) {
      console.error('❌ Shiprocket order creation failed:', shiprocketError.message);
      // Order is still created in database, but Shiprocket integration failed
      order.notes = (order.notes || '') + ' | Shiprocket integration failed: ' + shiprocketError.message;
      await order.save();
    }

    // Add order to user's orderHistory
    try {
      console.log('🔍 CALLING addOrderToUserHistory NOW');
      
      // Convert Mongoose document to plain object if needed
      const orderObj = order.toObject ? order.toObject() : order;
      
      // Create order history entry directly
      const orderHistoryEntry = {
        orderId: orderObj.orderId,
        orderDate: orderObj.createdAt,
        orderAmount: orderObj.total,
        orderStatus: orderObj.orderStatus || 'confirmed',
        paymentStatus: orderObj.paymentStatus || 'pending',
        paymentMethod: orderObj.paymentMethod || 'online',
        items: (orderObj.items || []).map(item => ({
          productId: item.productId || item.id,
          productName: item.title,
          quantity: item.quantity,
          price: item.price,
          img: item.img || ''
        }))
      };

      console.log('📋 Order history entry created:', orderHistoryEntry);

      // Update user's order history directly
      const updatedUser = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $push: { orderHistory: orderHistoryEntry } },
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        console.error('❌ Failed to update user order history - user not found after update');
      } else {
        console.log('✅ User order history updated successfully');
        console.log('📊 Total orders in history:', updatedUser.orderHistory.length);
      }
      
    } catch (historyError) {
      console.error('❌ Error in addOrderToUserHistory:', historyError);
      console.error('Error details:', {
        message: historyError.message,
        stack: historyError.stack,
        name: historyError.name,
        code: historyError.code
      });
      // Continue with order creation even if history update fails
    }

    // Auto-update tracking details if payment is paid and shipment exists
    if (order.paymentStatus === 'paid' && order.shiprocketShipmentId) {
      try {
        console.log('🔄 Auto-updating tracking details for paid order with shipment ID:', order.shiprocketShipmentId);
        
        // Use the enhanced shiprocket updater with retry logic
        const updated = await shiprocketUpdater.updateOrderTracking(order.orderId, order.shiprocketShipmentId);
        
        if (updated) {
          console.log('✅ Order updated with auto-fetched tracking details');
        } else {
          console.log('ℹ️ No tracking updates available yet (normal for new orders)');
        }
      } catch (trackingError) {
        console.error('❌ Auto-tracking update failed:', trackingError.message);
        // Continue with order completion even if tracking update fails
      }
    }

    // Clear user's cart after successful order
    await User.findByIdAndUpdate(req.user._id, { cart: [] });

    console.log('✅ Payment verified and order status updated:', {
      orderId: order.orderId,
      paymentId: razorpay_payment_id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      shiprocketOrderId: order.shiprocketOrderId,
      shiprocketShipmentId: order.shiprocketShipmentId
    });

    res.json({
      success: true,
      message: 'Payment verified and order status updated successfully',
      data: {
        orderId: order.orderId,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        total: order.total,
        shiprocketOrderId: order.shiprocketOrderId,
        shiprocketShipmentId: order.shiprocketShipmentId,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        courierName: order.courierName,
        createdAt: order.createdAt,
        paymentDate: getCurrentIndianTime()
      }
    });

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment and update order status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ Capture Payment API (Updated to also update Order model)
router.post('/capture-payment', authenticateToken, async (req, res) => {
  try {
    // Log the full request body for debugging
    console.log('Capture payment request body:', req.body);
    // Accept both frontend and Razorpay field names
    const paymentId = req.body.paymentId || req.body.razorpay_payment_id;
    const orderId = req.body.orderId || req.body.razorpay_order_id;
    const razorpaySignature = req.body.razorpay_signature;
    const internalOrderId = req.body.internalOrderId; // Our internal order ID

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
      payment.paymentStatus = 'paid';
      payment.paymentId = paymentId;
      payment.paymentMethod = paymentDetails.method || '';
      payment.capturedAt = getCurrentIndianTime();
      payment.webhookStatus = 'verified';
      payment.razorpaySignature = razorpaySignature || payment.razorpaySignature;
      payment.signatureValid = !!razorpaySignature;
      await payment.save();

      await updateUserOrderHistory(payment);

      // Also update Order model if internal order ID is provided
      if (internalOrderId) {
        await updateOrderStatus(internalOrderId, req.user._id);
      }

      return res.json({
        success: true,
        message: 'Payment already captured',
        data: {
          paymentId: paymentId,
          orderId: orderId,
          transactionId: payment.transactionId,
          paymentStatus: 'paid',
          paymentMethod: payment.paymentMethod,
          amount: payment.amount,
          orderTotal: payment.orderTotal,
          capturedAt: payment.capturedAt
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
    payment.capturedAt = getCurrentIndianTime();
    payment.webhookStatus = 'verified';
    payment.razorpaySignature = razorpaySignature || payment.razorpaySignature; // Save signature if present
    payment.signatureValid = !!razorpaySignature; // Set to true if signature is present
    await payment.save();

    // Update user's order history
    await updateUserOrderHistory(payment);

    // Also update Order model if internal order ID is provided
    if (internalOrderId) {
      await updateOrderStatus(internalOrderId, req.user._id);
    }

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
    payment.refundedAt = getCurrentIndianTime();
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
      paymentRecord.paymentStatus = 'paid';
      paymentRecord.paymentId = payment.id;
      paymentRecord.paymentMethod = payment.method || '';
      paymentRecord.capturedAt = getCurrentIndianTime();
      paymentRecord.webhookStatus = 'verified';
      paymentRecord.signatureValid = true;
      await paymentRecord.save();
      
      // Update user's order history
      await updateUserOrderHistory(paymentRecord);
      
      console.log('Payment status updated to paid:', payment.id);
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
      paymentRecord.paymentStatus = 'paid';
      paymentRecord.capturedAt = getCurrentIndianTime();
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

// Helper function to verify payment signature
function verifyPaymentSignature(orderId, paymentId, signature) {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay key secret not available for signature verification');
      return false;
    }
    
    const text = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text, 'utf8')
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

// Helper function to update order status
async function updateOrderStatus(orderId, userId) {
  try {
    const order = await Order.findOne({ 
      orderId: orderId,
      userId: userId 
    });

    if (order) {
      order.paymentStatus = 'paid';
      order.orderStatus = 'confirmed';
      await order.save();

      // Add order to user's orderHistory
      try {
        console.log('🔍 CALLING addOrderToUserHistory NOW');
        
        // Convert Mongoose document to plain object if needed
        const orderObj = order.toObject ? order.toObject() : order;
        
        // Create order history entry directly
        const orderHistoryEntry = {
          orderId: orderObj.orderId,
          orderDate: orderObj.createdAt,
          orderAmount: orderObj.total,
          orderStatus: orderObj.orderStatus || 'confirmed',
          paymentStatus: orderObj.paymentStatus || 'pending',
          paymentMethod: orderObj.paymentMethod || 'online',
          items: (orderObj.items || []).map(item => ({
            productId: item.productId || item.id,
            productName: item.title,
            quantity: item.quantity,
            price: item.price,
            img: item.img || ''
          }))
        };

        console.log('📋 Order history entry created:', orderHistoryEntry);

        // Update user's order history directly
        const updatedUser = await User.findOneAndUpdate(
          { _id: userId },
          { $push: { orderHistory: orderHistoryEntry } },
          { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
          console.error('❌ Failed to update user order history - user not found after update');
        } else {
          console.log('✅ User order history updated successfully');
          console.log('📊 Total orders in history:', updatedUser.orderHistory.length);
        }
        
      } catch (historyError) {
        console.error('❌ Error in addOrderToUserHistory:', historyError);
        console.error('Error details:', {
          message: historyError.message,
          stack: historyError.stack,
          name: historyError.name,
          code: historyError.code
        });
        // Continue with order creation even if history update fails
      }

      console.log('Order status updated:', orderId);
    } else {
      console.log('Order not found for status update:', orderId);
    }
  } catch (error) {
    console.error('Error updating order status:', error);
  }
}

// Helper function to add order to user's orderHistory
async function addOrderToUserHistory(userId, order) {
  try {
    console.log('📝 Adding order to user history for user:', userId);
    console.log('Order details:', {
      orderId: order.orderId,
      total: order.total,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      itemsCount: order.items ? order.items.length : 0
    });

    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found for order history update:', userId);
      return;
    }

    console.log('👤 User found:', {
      userId: user._id,
      firstName: user.firstName,
      currentOrderHistoryLength: user.orderHistory ? user.orderHistory.length : 0
    });

    // Check if order already exists in history
    const existingOrder = user.orderHistory.find(historyItem => 
      historyItem.orderId === order.orderId
    );

    if (existingOrder) {
      console.log('⚠️ Order already exists in user history:', order.orderId);
      return;
    }

    // Create order history entry
    const orderHistoryEntry = {
      orderId: order.orderId,
      orderDate: order.createdAt,
      orderAmount: order.total,
      orderStatus: order.orderStatus || 'confirmed',
      paymentStatus: order.paymentStatus || 'paid',
      paymentMethod: order.paymentMethod || 'online',
      items: (order.items || []).map(item => ({
        productId: item.productId || item.id,
        productName: item.title,
        quantity: item.quantity,
        price: item.price,
        img: item.img || ''
      }))
    };

    console.log('📋 Order history entry created:', orderHistoryEntry);

    // Add to user's order history
    user.orderHistory.push(orderHistoryEntry);
    
    console.log('📝 Before saving - Order history length:', user.orderHistory.length);
    
    const savedUser = await user.save();
    
    console.log('📝 After saving - Order history length:', savedUser.orderHistory.length);
    console.log('✅ User order history updated successfully for user:', userId);
    console.log('📊 Total orders in history:', savedUser.orderHistory.length);
    
    // Verify the save worked
    const verifyUser = await User.findById(userId);
    console.log('🔍 Verification - User order history length:', verifyUser.orderHistory.length);
    
  } catch (error) {
    console.error('❌ Error updating user order history:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
}

module.exports = router; 