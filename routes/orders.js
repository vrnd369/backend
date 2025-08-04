const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const shiprocket = require('../utils/shiprocket');
const shiprocketUpdater = require('../utils/shiprocketUpdater');
const { razorpay, verifyWebhookSignature, hasRazorpayKeys } = require('../utils/razorpay');
const crypto = require('crypto');
// Import authenticateToken from auth.js
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('🔐 Authentication attempt:', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    endpoint: req.originalUrl
  });

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ 
      status: 'error',
      message: 'Access token required' 
    });
  }

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  const User = require('../models/User');

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log('❌ Token verification failed:', err.message);
      return res.status(403).json({ 
        status: 'error',
        message: 'Invalid or expired token' 
      });
    }

    try {
      console.log('🔍 Looking up user with ID:', decoded.userId);
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        console.log('❌ User not found for ID:', decoded.userId);
        return res.status(404).json({ 
          status: 'error',
          message: 'User not found' 
        });
      }
      
      console.log('✅ User authenticated:', {
        userId: user._id,
        firstName: user.firstName,
        email: user.email,
        hasShippingAddress: !!user.shippingAddress,
        hasBillingAddress: !!user.billingAddress
      });
      
      req.user = user;
      next();
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return res.status(500).json({ 
        status: 'error',
        message: 'Authentication failed' 
      });
    }
  });
};

// Create new order with Shiprocket integration
router.post('/create', authenticateToken, async (req, res) => {
  try {
    console.log('🛒 Creating new order with Shiprocket integration...');
    
    const { 
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

    // Validate required fields
    if (!items || !shippingAddress || !billingAddress || !total) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: items, shippingAddress, billingAddress, total'
      });
    }

    // Create order in database
    const order = new Order({
      userId: req.user._id,
      items,
      shippingAddress,
      billingAddress,
      subtotal: subtotal || 0,
      shippingCost: shippingCost || 0,
      tax: tax || 0,
      total,
      paymentMethod: paymentMethod || 'online',
      notes: notes || ''
    });

    await order.save();
    console.log('✅ Order created in database:', order.orderId);
    
    // Refresh the order object to get all updated fields
    const savedOrder = await Order.findById(order._id);

    // Create shipment in Shiprocket
    try {
      const shiprocketOrderData = {
        order_id: order.orderId,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: 'warehouse', // Use the correct pickup location from Shiprocket
        billing_customer_name: req.user.firstName + ' ' + req.user.lastName,
        billing_last_name: req.user.lastName,
        billing_address: billingAddress.houseName,
        billing_address_2: billingAddress.streetArea,
        billing_city: billingAddress.city,
        billing_pincode: billingAddress.pincode,
        billing_state: billingAddress.state,
        billing_country: billingAddress.country,
        billing_email: req.user.email,
        billing_phone: req.user.phone,
        shipping_customer_name: req.user.firstName + ' ' + req.user.lastName,
        shipping_last_name: req.user.lastName,
        shipping_address: shippingAddress.houseName,
        shipping_address_2: shippingAddress.streetArea,
        shipping_city: shippingAddress.city,
        shipping_pincode: shippingAddress.pincode,
        shipping_state: shippingAddress.state,
        shipping_country: shippingAddress.country,
        shipping_email: req.user.email,
        shipping_phone: req.user.phone,
        order_items: items.map(item => ({
          name: item.title,
          sku: item.productId,
          units: item.quantity,
          selling_price: item.price,
          discount: 0,
          tax: 0
        })),
        sub_total: subtotal || 0,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5,
        payment_method: 'Prepaid',
        shipping_is_billing: true
      };

      const shiprocketResponse = await shiprocket.createOrder(shiprocketOrderData);
      
      // Check if Shiprocket response is successful
      if (shiprocketResponse && !shiprocketResponse.message?.includes('Wrong Pickup location')) {
        const responseData = shiprocketResponse;
        
        // Save real Shiprocket Order ID
        if (responseData.order_id) {
          order.shiprocketOrderId = responseData.order_id;
        }
        
        // Save real Shipment ID
        if (responseData.shipment_id) {
          order.shiprocketShipmentId = responseData.shipment_id;
        }
        
        // Only save courier name if it's real (not empty)
        if (responseData.courier_name && responseData.courier_name !== '') {
          order.courierName = responseData.courier_name;
        }
        
        // Only save AWB if it's real (not empty)
        if (responseData.awb_code && responseData.awb_code !== '') {
          order.trackingNumber = responseData.awb_code;
        }
        
        // Only save tracking URL if it's real
        if (responseData.tracking_url && responseData.tracking_url !== '') {
          order.trackingUrl = responseData.tracking_url;
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
      
      order.orderStatus = 'confirmed';
      await order.save();

    } catch (shiprocketError) {
      console.error('❌ Shiprocket order creation failed:', shiprocketError.message);
      // Order is still created in database, but Shiprocket integration failed
      order.notes = (order.notes || '') + ' | Shiprocket integration failed: ' + shiprocketError.message;
      order.orderStatus = 'confirmed'; // Still confirm the order
      await order.save();
    }

    // Add order to user's orderHistory
    console.log('🔄 About to call addOrderToUserHistory for user:', req.user._id);
    console.log('📋 Order to add to history:', order.orderId);
    console.log('📊 Order object structure:', {
      orderId: order.orderId,
      total: order.total,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      items: order.items ? order.items.length : 0,
      createdAt: order.createdAt
    });
    
    // Force add order to user history with better error handling
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

    // Clear user's cart after successful order
    await User.findByIdAndUpdate(req.user._id, { cart: [] });
    
    console.log('✅ Order added to user history and cart cleared');

    // Use the order object directly since it has all the updated fields
    const orderObject = order.toObject ? order.toObject() : order;
    
    console.log('🔍 Order response debug:');
    console.log('Order _id:', orderObject._id);
    console.log('Order orderId:', orderObject.orderId);
    console.log('Order userId:', orderObject.userId);

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      order: {
        _id: orderObject._id,
        orderId: orderObject.orderId,
        userId: orderObject.userId,
        items: orderObject.items,
        shippingAddress: orderObject.shippingAddress,
        billingAddress: orderObject.billingAddress,
        subtotal: orderObject.subtotal,
        shippingCost: orderObject.shippingCost,
        tax: orderObject.tax,
        total: orderObject.total,
        paymentMethod: orderObject.paymentMethod,
        paymentStatus: orderObject.paymentStatus,
        orderStatus: orderObject.orderStatus,
        shiprocketOrderId: orderObject.shiprocketOrderId,
        shiprocketShipmentId: orderObject.shiprocketShipmentId,
        trackingNumber: orderObject.trackingNumber,
        trackingUrl: orderObject.trackingUrl,
        courierName: orderObject.courierName,
        notes: orderObject.notes,
        createdAt: orderObject.createdAt,
        updatedAt: orderObject.updatedAt,
        shipmentDetails: {
          shiprocketOrderId: orderObject.shiprocketOrderId,
          shiprocketShipmentId: orderObject.shiprocketShipmentId,
          courierName: orderObject.courierName,
          trackingNumber: orderObject.trackingNumber,
          trackingUrl: orderObject.trackingUrl,
          hasTracking: !!(orderObject.trackingNumber && orderObject.trackingNumber !== ''),
          hasCourier: !!(orderObject.courierName && orderObject.courierName !== ''),
          trackingStatus: orderObject.trackingNumber ? 'active' : 'pending',
          canTrack: !!(orderObject.trackingNumber && orderObject.trackingNumber !== ''),
          estimatedDelivery: orderObject.trackingNumber ? '3-5 business days' : 'Will be updated when courier picks up'
        }
      }
    });

  } catch (error) {
    console.error('❌ Order creation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create order',
      details: error.message
    });
  }
});

// Create new order with payment verification
router.post('/create-with-payment', authenticateToken, async (req, res) => {
  try {
    console.log('🛒 Creating new order with payment verification...');
    
    const { 
      items, 
      shippingAddress, 
      billingAddress, 
      subtotal, 
      shippingCost, 
      tax, 
      total, 
      paymentMethod,
      notes,
      // Payment verification data
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    // Validate required fields
    if (!items || !shippingAddress || !billingAddress || !total) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: items, shippingAddress, billingAddress, total'
      });
    }

    // Validate payment verification data
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing payment verification data: razorpay_payment_id, razorpay_order_id, razorpay_signature'
      });
    }

    // Verify Razorpay payment signature
    const signatureValid = verifyRazorpayPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!signatureValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment signature. Payment verification failed.'
      });
    }

    // Create order in database
    const order = new Order({
      userId: req.user._id,
      items,
      shippingAddress,
      billingAddress,
      subtotal: subtotal || 0,
      shippingCost: shippingCost || 0,
      tax: tax || 0,
      total,
      paymentMethod: paymentMethod || 'online',
      notes: notes || '',
      paymentStatus: 'paid',
      orderStatus: 'confirmed' // Set to confirmed since payment is verified
    });

    await order.save();
    console.log('✅ Order created in database with payment verification:', order.orderId);

    // Create shipment in Shiprocket
    try {
      const shiprocketOrderData = {
        order_id: order.orderId,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: 'warehouse', // Use the correct pickup location
        billing_customer_name: req.user.firstName + ' ' + req.user.lastName,
        billing_last_name: req.user.lastName,
        billing_address: billingAddress.houseName,
        billing_address_2: billingAddress.streetArea,
        billing_city: billingAddress.city,
        billing_pincode: billingAddress.pincode,
        billing_state: billingAddress.state,
        billing_country: billingAddress.country,
        billing_email: req.user.email,
        billing_phone: req.user.phone,
        shipping_customer_name: req.user.firstName + ' ' + req.user.lastName,
        shipping_last_name: req.user.lastName,
        shipping_address: shippingAddress.houseName,
        shipping_address_2: shippingAddress.streetArea,
        shipping_city: shippingAddress.city,
        shipping_pincode: shippingAddress.pincode,
        shipping_state: shippingAddress.state,
        shipping_country: shippingAddress.country,
        shipping_email: req.user.email,
        shipping_phone: req.user.phone,
        order_items: items.map(item => ({
          name: item.title,
          sku: item.productId,
          units: item.quantity,
          selling_price: item.price,
          discount: 0,
          tax: 0
        })),
        sub_total: subtotal || 0,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5,
        payment_method: 'Prepaid',
        shipping_is_billing: true
      };

      const shiprocketResponse = await shiprocket.createOrder(shiprocketOrderData);
      
      // Check if Shiprocket response is successful
      if (shiprocketResponse && !shiprocketResponse.message?.includes('Wrong Pickup location')) {
        const responseData = shiprocketResponse;
        
        // Save real Shiprocket Order ID
        if (responseData.order_id) {
          order.shiprocketOrderId = responseData.order_id;
        }
        
        // Save real Shipment ID
        if (responseData.shipment_id) {
          order.shiprocketShipmentId = responseData.shipment_id;
        }
        
        // Only save courier name if it's real (not empty)
        if (responseData.courier_name && responseData.courier_name !== '') {
          order.courierName = responseData.courier_name;
        }
        
        // Only save AWB if it's real (not empty)
        if (responseData.awb_code && responseData.awb_code !== '') {
          order.trackingNumber = responseData.awb_code;
        }
        
        // Only save tracking URL if it's real
        if (responseData.tracking_url && responseData.tracking_url !== '') {
          order.trackingUrl = responseData.tracking_url;
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
      
      order.orderStatus = 'confirmed';
      await order.save();

    } catch (shiprocketError) {
      console.error('❌ Shiprocket order creation failed:', shiprocketError.message);
      // Order is still created in database, but Shiprocket integration failed
      order.notes = (order.notes || '') + ' | Shiprocket integration failed: ' + shiprocketError.message;
      await order.save();
    }

    // Add order to user's orderHistory
    console.log('🔄 About to call addOrderToUserHistory for user:', req.user._id);
    console.log('📋 Order to add to history:', order.orderId);
    
    // Force add order to user history with better error handling
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

    // Clear user's cart after successful order
    await User.findByIdAndUpdate(req.user._id, { cart: [] });

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully with payment verification',
      order: {
        _id: order._id,
        orderId: order.orderId,
        userId: order.userId,
        items: order.items,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        shiprocketOrderId: order.shiprocketOrderId,
        shiprocketShipmentId: order.shiprocketShipmentId,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        courierName: order.courierName,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        shipmentDetails: {
          shiprocketOrderId: order.shiprocketOrderId,
          shiprocketShipmentId: order.shiprocketShipmentId,
          courierName: order.courierName,
          trackingNumber: order.trackingNumber,
          trackingUrl: order.trackingUrl,
          hasTracking: !!(order.trackingNumber && order.trackingNumber !== ''),
          hasCourier: !!(order.courierName && order.courierName !== ''),
          trackingStatus: order.trackingNumber ? 'active' : 'pending',
          canTrack: !!(order.trackingNumber && order.trackingNumber !== ''),
          estimatedDelivery: order.trackingNumber ? '3-5 business days' : 'Will be updated when courier picks up'
        }
      }
    });

  } catch (error) {
    console.error('❌ Order creation with payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create order with payment verification',
      details: error.message
    });
  }
});

// Calculate shipping rates
router.post('/calculate-shipping', async (req, res) => {
  try {
    const { pickupPincode, deliveryPincode, weight } = req.body;

    if (!pickupPincode || !deliveryPincode || !weight) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: pickupPincode, deliveryPincode, weight'
      });
    }

    console.log('🚚 Calculating shipping rates...');
    const rates = await shiprocket.calculateShipping(pickupPincode, deliveryPincode, weight);

    res.json({
      status: 'success',
      rates: rates.data || rates
    });

  } catch (error) {
    console.error('❌ Shipping calculation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate shipping rates',
      details: error.message
    });
  }
});

// Get user orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-__v');

    // Enhance orders with shipment details
    const enhancedOrders = orders.map(order => ({
      ...order.toObject(),
      shipmentDetails: {
        shiprocketOrderId: order.shiprocketOrderId,
        shiprocketShipmentId: order.shiprocketShipmentId,
        courierName: order.courierName,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        hasTracking: !!(order.trackingNumber && order.trackingNumber !== ''),
        hasCourier: !!(order.courierName && order.courierName !== ''),
        trackingStatus: order.trackingNumber ? 'active' : 'pending'
      }
    }));

    res.json({
      status: 'success',
      orders: enhancedOrders
    });

  } catch (error) {
    console.error('❌ Get orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders',
      details: error.message
    });
  }
});

// Get specific order with enhanced shipment details
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ 
      orderId: orderId,
      userId: req.user._id 
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Enhance order with shipment details
    const enhancedOrder = {
      ...order.toObject(),
      shipmentDetails: {
        shiprocketOrderId: order.shiprocketOrderId,
        shiprocketShipmentId: order.shiprocketShipmentId,
        courierName: order.courierName,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        hasTracking: !!(order.trackingNumber && order.trackingNumber !== ''),
        hasCourier: !!(order.courierName && order.courierName !== ''),
        trackingStatus: order.trackingNumber ? 'active' : 'pending',
        canTrack: !!(order.trackingNumber && order.trackingNumber !== ''),
        estimatedDelivery: order.trackingNumber ? '3-5 business days' : 'Will be updated when courier picks up'
      }
    };

    res.json({
      status: 'success',
      order: enhancedOrder
    });

  } catch (error) {
    console.error('❌ Get order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order',
      details: error.message
    });
  }
});

// Get shipment details for a specific order
router.get('/:orderId/shipment-details', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ 
      orderId: orderId,
      userId: req.user._id 
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if we have Shiprocket data
    if (!order.shiprocketOrderId) {
      return res.status(400).json({
        status: 'error',
        message: 'Order does not have Shiprocket integration',
        details: 'This order was not created with Shiprocket shipping'
      });
    }

    // Try to get latest details from Shiprocket
    let shiprocketDetails = null;
    let lastChecked = null;

    try {
      shiprocketDetails = await shiprocket.checkAndUpdateOrderDetails(order.shiprocketOrderId);
      lastChecked = new Date().toISOString();
      
      // Update order with any new details
      if (shiprocketDetails && shiprocketDetails.data) {
        const data = shiprocketDetails.data;
        let updated = false;

        if (data.shipment_id && data.shipment_id !== order.shiprocketShipmentId) {
          order.shiprocketShipmentId = data.shipment_id;
          updated = true;
        }

        if (data.awb_code && data.awb_code !== '' && data.awb_code !== order.trackingNumber) {
          order.trackingNumber = data.awb_code;
          updated = true;
        }

        if (data.courier_name && data.courier_name !== '' && data.courier_name !== order.courierName) {
          order.courierName = data.courier_name;
          updated = true;
        }

        if (data.tracking_url && data.tracking_url !== '' && data.tracking_url !== order.trackingUrl) {
          order.trackingUrl = data.tracking_url;
          updated = true;
        }

        if (updated) {
          await order.save();
        }
      }
    } catch (shiprocketError) {
      console.log('⚠️ Could not fetch latest Shiprocket details:', shiprocketError.message);
      // Continue with existing data
    }

    const shipmentDetails = {
      orderId: order.orderId,
      shiprocketOrderId: order.shiprocketOrderId,
      shiprocketShipmentId: order.shiprocketShipmentId,
      courierName: order.courierName,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      orderStatus: order.orderStatus,
      hasTracking: !!(order.trackingNumber && order.trackingNumber !== ''),
      hasCourier: !!(order.courierName && order.courierName !== ''),
      trackingStatus: order.trackingNumber ? 'active' : 'pending',
      canTrack: !!(order.trackingNumber && order.trackingNumber !== ''),
      estimatedDelivery: order.trackingNumber ? '3-5 business days' : 'Will be updated when courier picks up',
      lastChecked: lastChecked,
      shiprocketData: shiprocketDetails?.data || null
    };

    res.json({
      status: 'success',
      shipmentDetails
    });

  } catch (error) {
    console.error('❌ Get shipment details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch shipment details',
      details: error.message
    });
  }
});

// Track shipment
router.get('/track/:shipmentId', async (req, res) => {
  try {
    const { shipmentId } = req.params;
    
    console.log('📋 Tracking shipment:', shipmentId);
    
    // Check if shipmentId is valid
    if (!shipmentId || shipmentId === 'undefined' || shipmentId === 'null') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid shipment ID'
      });
    }
    
    const tracking = await shiprocket.trackShipment(shipmentId);

    res.json({
      status: 'success',
      tracking: tracking.data || tracking
    });

  } catch (error) {
    console.error('❌ Tracking error:', error);
    
    // Handle specific tracking errors
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        status: 'error',
        message: 'Shipment not found or AWB not yet assigned. Tracking will be available once the courier picks up your package.',
        details: 'This is normal for new orders. You will receive tracking details via email and SMS when available.'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to track shipment',
      details: error.message
    });
  }
});

// Cancel order
router.post('/cancel/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ 
      orderId: orderId,
      userId: req.user._id 
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: 'Order is already cancelled'
      });
    }

    // Cancel in Shiprocket if shipment exists
    if (order.shiprocketShipmentId) {
      try {
        await shiprocket.cancelOrder(order.shiprocketShipmentId);
        console.log('✅ Shiprocket order cancelled');
      } catch (shiprocketError) {
        console.error('❌ Shiprocket cancellation failed:', shiprocketError.message);
      }
    }

    // Update order status
    order.orderStatus = 'cancelled';
    await order.save();

    res.json({
      status: 'success',
      message: 'Order cancelled successfully',
      order
    });

  } catch (error) {
    console.error('❌ Cancel order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel order',
      details: error.message
    });
  }
});

// Get courier list
router.get('/couriers/list', async (req, res) => {
  try {
    console.log('📋 Getting courier list...');
    const couriers = await shiprocket.getCourierList();

    res.json({
      status: 'success',
      couriers: couriers.data || couriers
    });

  } catch (error) {
    console.error('❌ Get couriers error:', error);
    // Return mock courier list if Shiprocket API fails
    res.json({
      status: 'success',
      couriers: {
        data: [
          {
            courier_name: 'DTDC Express',
            courier_id: 1,
            courier_company_id: 1,
            rate: 150,
            estimated_delivery_days: '3-5 days'
          },
          {
            courier_name: 'Blue Dart',
            courier_id: 2,
            courier_company_id: 2,
            rate: 200,
            estimated_delivery_days: '2-3 days'
          },
          {
            courier_name: 'FedEx',
            courier_id: 3,
            courier_company_id: 3,
            rate: 250,
            estimated_delivery_days: '1-2 days'
          },
          {
            courier_name: 'Delhivery',
            courier_id: 4,
            courier_company_id: 4,
            rate: 120,
            estimated_delivery_days: '4-6 days'
          },
          {
            courier_name: 'Ecom Express',
            courier_id: 5,
            courier_company_id: 5,
            rate: 180,
            estimated_delivery_days: '3-4 days'
          }
        ]
      }
    });
  }
});

// Shiprocket webhook to update order details when real IDs are assigned
router.post('/shiprocket-webhook', async (req, res) => {
  try {
    console.log('📦 Shiprocket webhook received:', req.body);
    console.log('📦 Webhook headers:', req.headers);
    
    const { 
      order_id, 
      shipment_id, 
      awb_code, 
      courier_name, 
      status, 
      status_code,
      tracking_url,
      pickup_date,
      delivery_date
    } = req.body;

    if (!order_id) {
      console.log('❌ Webhook missing order_id');
      return res.status(400).json({
        status: 'error',
        message: 'Order ID is required'
      });
    }

    console.log('🔍 Looking for order with Shiprocket Order ID:', order_id);

    // Find order by Shiprocket Order ID
    const order = await Order.findOne({ 
      shiprocketOrderId: order_id.toString() 
    });

    if (!order) {
      console.log('❌ Order not found for Shiprocket Order ID:', order_id);
      console.log('📋 Available orders with Shiprocket IDs:');
      const ordersWithShiprocketIds = await Order.find({ 
        shiprocketOrderId: { $exists: true, $ne: null } 
      }).select('orderId shiprocketOrderId');
      console.log(ordersWithShiprocketIds);
      
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
        searchedOrderId: order_id
      });
    }

    console.log('✅ Found order:', order.orderId);
    console.log('📊 Current order data:', {
      shiprocketOrderId: order.shiprocketOrderId,
      shiprocketShipmentId: order.shiprocketShipmentId,
      courierName: order.courierName,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      orderStatus: order.orderStatus
    });

    // Update order with real Shiprocket data
    let updated = false;
    const updates = [];

    if (shipment_id && shipment_id !== '' && shipment_id !== order.shiprocketShipmentId) {
      order.shiprocketShipmentId = shipment_id;
      updated = true;
      updates.push(`Shipment ID: ${shipment_id}`);
      console.log('✅ Updated Shipment ID:', shipment_id);
    }

    if (awb_code && awb_code !== '' && awb_code !== order.trackingNumber) {
      order.trackingNumber = awb_code;
      updated = true;
      updates.push(`AWB Code: ${awb_code}`);
      console.log('✅ Updated AWB Code:', awb_code);
    }

    if (courier_name && courier_name !== '' && courier_name !== order.courierName) {
      order.courierName = courier_name;
      updated = true;
      updates.push(`Courier: ${courier_name}`);
      console.log('✅ Updated Courier Name:', courier_name);
    }

    if (tracking_url && tracking_url !== '' && tracking_url !== order.trackingUrl) {
      order.trackingUrl = tracking_url;
      updated = true;
      updates.push(`Tracking URL: ${tracking_url}`);
      console.log('✅ Updated Tracking URL:', tracking_url);
    }

    if (status) {
      // Map Shiprocket status to our order status
      let newStatus = order.orderStatus;
      switch (status.toLowerCase()) {
        case 'picked up':
        case 'in_transit':
        case 'shipped':
          newStatus = 'shipped';
          break;
        case 'delivered':
          newStatus = 'delivered';
          break;
        case 'failed':
        case 'returned':
          newStatus = 'failed';
          break;
        default:
          // Keep existing status for other cases
          break;
      }
      
      if (newStatus !== order.orderStatus) {
        order.orderStatus = newStatus;
        updated = true;
        updates.push(`Status: ${newStatus}`);
        console.log('✅ Updated Order Status:', newStatus);
      }
    }

    if (updated) {
      // Add webhook update note
      const webhookNote = `Webhook update: ${updates.join(', ')} - ${new Date().toISOString()}`;
      order.notes = order.notes ? `${order.notes} | ${webhookNote}` : webhookNote;
      
      await order.save();
      console.log('✅ Order updated successfully with real Shiprocket data');
      console.log('📊 Updated order data:', {
        shiprocketOrderId: order.shiprocketOrderId,
        shiprocketShipmentId: order.shiprocketShipmentId,
        courierName: order.courierName,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        orderStatus: order.orderStatus
      });
    } else {
      console.log('ℹ️ No updates needed for order:', order.orderId);
    }

    res.json({
      status: 'success',
      message: 'Webhook processed successfully',
      orderId: order.orderId,
      updated: updated,
      updates: updated ? updates : null
    });

  } catch (error) {
    console.error('❌ Shiprocket webhook error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      status: 'error',
      message: 'Failed to process webhook',
      details: error.message
    });
  }
});

// Start periodic tracking updates (admin endpoint)
router.post('/start-tracking-updates', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you can add admin role check here)
    shiprocketUpdater.startPeriodicUpdates();
    
    res.json({
      status: 'success',
      message: 'Periodic tracking updates started successfully',
      interval: '5 minutes'
    });
  } catch (error) {
    console.error('❌ Error starting tracking updates:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to start tracking updates',
      details: error.message
    });
  }
});

// Stop periodic tracking updates (admin endpoint)
router.post('/stop-tracking-updates', authenticateToken, async (req, res) => {
  try {
    shiprocketUpdater.stopPeriodicUpdates();
    
    res.json({
      status: 'success',
      message: 'Periodic tracking updates stopped successfully'
    });
  } catch (error) {
    console.error('❌ Error stopping tracking updates:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to stop tracking updates',
      details: error.message
    });
  }
});

// Manual refresh tracking details for an order
router.post('/refresh-tracking/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ 
      orderId: orderId,
      userId: req.user._id 
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (!order.shiprocketShipmentId) {
      return res.status(400).json({
        status: 'error',
        message: 'No shipment ID available for tracking'
      });
    }

    console.log('🔄 Manual refresh tracking for order:', orderId, 'shipment:', order.shiprocketShipmentId);
    
    // Use the enhanced shiprocket updater
    const result = await shiprocketUpdater.manualUpdateOrder(orderId);
    
    if (result.success) {
      res.json({
        status: 'success',
        message: result.updated ? 'Tracking details refreshed successfully' : 'No new updates available',
        updated: result.updated,
        order: {
          orderId: order.orderId,
          orderStatus: order.orderStatus,
          shiprocketOrderId: order.shiprocketOrderId,
          shiprocketShipmentId: order.shiprocketShipmentId,
          courierName: order.courierName,
          trackingNumber: order.trackingNumber,
          trackingUrl: order.trackingUrl
        }
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to refresh tracking details',
        details: result.error
      });
    }

  } catch (error) {
    console.error('❌ Manual refresh tracking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to refresh tracking details',
      details: error.message
    });
  }
});

// Check and update order details from Shiprocket
router.post('/check-shiprocket-updates/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('🔍 Checking Shiprocket updates for order:', orderId);
    
    // Find the order
    const order = await Order.findOne({ 
      orderId: orderId,
      userId: req.user._id 
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (!order.shiprocketOrderId) {
      return res.status(400).json({
        status: 'error',
        message: 'Order does not have a Shiprocket Order ID'
      });
    }

    // Check for updates from Shiprocket
    try {
      const shiprocketDetails = await shiprocket.checkAndUpdateOrderDetails(order.shiprocketOrderId);
      
      let updated = false;
      const updates = {};

      if (shiprocketDetails && shiprocketDetails.data) {
        const data = shiprocketDetails.data;
        
        // Check for new shipment ID
        if (data.shipment_id && data.shipment_id !== order.shiprocketShipmentId) {
          order.shiprocketShipmentId = data.shipment_id;
          updates.shipmentId = data.shipment_id;
          updated = true;
          console.log('✅ Updated Shipment ID:', data.shipment_id);
        }
        
        // Check for new AWB code
        if (data.awb_code && data.awb_code !== '' && data.awb_code !== order.trackingNumber) {
          order.trackingNumber = data.awb_code;
          updates.trackingNumber = data.awb_code;
          updated = true;
          console.log('✅ Updated AWB Code:', data.awb_code);
        }
        
        // Check for new courier name
        if (data.courier_name && data.courier_name !== '' && data.courier_name !== order.courierName) {
          order.courierName = data.courier_name;
          updates.courierName = data.courier_name;
          updated = true;
          console.log('✅ Updated Courier Name:', data.courier_name);
        }
        
        // Check for new tracking URL
        if (data.tracking_url && data.tracking_url !== '' && data.tracking_url !== order.trackingUrl) {
          order.trackingUrl = data.tracking_url;
          updates.trackingUrl = data.tracking_url;
          updated = true;
          console.log('✅ Updated Tracking URL:', data.tracking_url);
        }
        
        // Update order status based on Shiprocket status
        if (data.status) {
          let newStatus = order.orderStatus;
          switch (data.status.toLowerCase()) {
            case 'picked_up':
            case 'in_transit':
              newStatus = 'shipped';
              break;
            case 'delivered':
              newStatus = 'delivered';
              break;
            case 'failed':
              newStatus = 'failed';
              break;
            default:
              // Keep existing status
              break;
          }
          
          if (newStatus !== order.orderStatus) {
            order.orderStatus = newStatus;
            updates.orderStatus = newStatus;
            updated = true;
            console.log('✅ Updated Order Status:', newStatus);
          }
        }
      }

      if (updated) {
        await order.save();
        console.log('✅ Order updated with new Shiprocket details');
      } else {
        console.log('ℹ️ No new updates from Shiprocket');
      }

      res.json({
        status: 'success',
        message: updated ? 'Order updated with new Shiprocket details' : 'No new updates available',
        orderId: order.orderId,
        updated: updated,
        updates: updated ? updates : null,
        order: {
          orderId: order.orderId,
          orderStatus: order.orderStatus,
          shiprocketOrderId: order.shiprocketOrderId,
          shiprocketShipmentId: order.shiprocketShipmentId,
          courierName: order.courierName,
          trackingNumber: order.trackingNumber,
          trackingUrl: order.trackingUrl
        }
      });

    } catch (shiprocketError) {
      console.error('❌ Shiprocket API error:', shiprocketError.response?.data || shiprocketError.message);
      
      // Handle specific error cases
      if (shiprocketError.response?.status === 400) {
        return res.status(400).json({
          status: 'error',
          message: 'Shiprocket order not found or invalid',
          details: 'The Shiprocket Order ID may not exist or may be invalid',
          shiprocketOrderId: order.shiprocketOrderId
        });
      } else if (shiprocketError.response?.status === 401) {
        return res.status(500).json({
          status: 'error',
          message: 'Shiprocket authentication failed',
          details: 'Please check Shiprocket credentials'
        });
      } else if (shiprocketError.response?.status === 429) {
        return res.status(429).json({
          status: 'error',
          message: 'Too many requests to Shiprocket',
          details: 'Please try again later'
        });
      } else {
        return res.status(500).json({
          status: 'error',
          message: 'Failed to check Shiprocket updates',
          details: shiprocketError.response?.data?.message || shiprocketError.message
        });
      }
    }

  } catch (error) {
    console.error('❌ Error checking Shiprocket updates:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check Shiprocket updates',
      details: error.message
    });
  }
});

// Helper function to verify Razorpay payment signature
function verifyRazorpayPaymentSignature(orderId, paymentId, signature) {
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

// Helper function to add order to user's orderHistory
async function addOrderToUserHistory(userId, order) {
  try {
    console.log('🚨 FUNCTION ENTRY - addOrderToUserHistory called with userId:', userId);
    console.log('📝 Adding order to user history for user:', userId);
    
    // Convert Mongoose document to plain object if needed
    const orderObj = order.toObject ? order.toObject() : order;
    
    console.log('Order details:', {
      orderId: orderObj.orderId,
      total: orderObj.total,
      orderStatus: orderObj.orderStatus,
      paymentStatus: orderObj.paymentStatus,
      itemsCount: orderObj.items ? orderObj.items.length : 0
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
      historyItem.orderId === orderObj.orderId
    );

    if (existingOrder) {
      console.log('⚠️ Order already exists in user history:', orderObj.orderId);
      return;
    }

    // Create order history entry
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

    // Add to user's order history
    user.orderHistory.push(orderHistoryEntry);
    
    console.log('📝 Before saving - Order history length:', user.orderHistory.length);
    
    // Use findOneAndUpdate to avoid potential issues with save()
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $push: { orderHistory: orderHistoryEntry } },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      console.error('❌ Failed to update user order history - user not found after update');
      return;
    }
    
    console.log('📝 After saving - Order history length:', updatedUser.orderHistory.length);
    console.log('✅ User order history updated successfully for user:', userId);
    console.log('📊 Total orders in history:', updatedUser.orderHistory.length);
    
    // Verify the save worked
    const verifyUser = await User.findById(userId);
    console.log('🔍 Verification - User order history length:', verifyUser.orderHistory.length);
    
  } catch (error) {
    console.error('❌ Error updating user order history:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // Log additional error information for debugging
    if (error.name === 'ValidationError') {
      console.error('❌ Validation Error Details:', error.errors);
    } else if (error.name === 'MongoError') {
      console.error('❌ MongoDB Error Code:', error.code);
    }
  }
}

module.exports = router; 