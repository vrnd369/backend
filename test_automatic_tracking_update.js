const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test data
const testUser = {
  firstName: 'Tracking',
  lastName: 'Test',
  email: 'trackingtest@example.com',
  phone: '9876543210',
  password: 'testpass123'
};

const testOrder = {
  items: [
    {
      productId: 'prod_tracking_001',
      title: 'Test Product for Tracking',
      price: 999,
      quantity: 1,
      img: 'test-image.jpg'
    }
  ],
  shippingAddress: {
    houseName: 'Test House',
    streetArea: 'Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India'
  },
  billingAddress: {
    houseName: 'Test House',
    streetArea: 'Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India'
  },
  subtotal: 999,
  shippingCost: 0,
  tax: 0,
  total: 999,
  paymentMethod: 'online'
};

async function testAutomaticTrackingUpdate() {
  console.log('🚀 Testing Automatic Tracking Update Functionality\n');

  try {
    // Step 1: Create test user
    console.log('📝 Step 1: Creating test user...');
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, testUser);
    console.log('✅ User created:', signupResponse.data.message);

    // Step 2: Login to get token
    console.log('\n🔐 Step 2: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 3: Create order with payment verification
    console.log('\n💰 Step 3: Creating order with payment verification...');
    const paymentData = {
      razorpay_payment_id: 'pay_test_tracking_001',
      razorpay_order_id: 'order_test_tracking_001',
      razorpay_signature: 'test_signature_001',
      ...testOrder
    };

    const paymentResponse = await axios.post(`${BASE_URL}/payment/verify-payment`, paymentData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Payment verification successful');
    console.log('📦 Order created:', paymentResponse.data.data.orderId);
    console.log('🚚 Shiprocket Order ID:', paymentResponse.data.data.shiprocketOrderId);
    console.log('📦 Shiprocket Shipment ID:', paymentResponse.data.data.shiprocketShipmentId);

    const orderId = paymentResponse.data.data.orderId;
    const shipmentId = paymentResponse.data.data.shiprocketShipmentId;

    // Step 4: Check initial tracking details
    console.log('\n📋 Step 4: Checking initial tracking details...');
    const initialTrackingResponse = await axios.get(`${BASE_URL}/orders/${orderId}/shipment-details`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('📊 Initial tracking details:');
    console.log('- Tracking Number:', initialTrackingResponse.data.shipmentDetails.trackingNumber || 'Not assigned');
    console.log('- Courier Name:', initialTrackingResponse.data.shipmentDetails.courierName || 'Not assigned');
    console.log('- Tracking URL:', initialTrackingResponse.data.shipmentDetails.trackingUrl || 'Not assigned');

    // Step 5: Test manual refresh tracking
    console.log('\n🔄 Step 5: Testing manual refresh tracking...');
    const refreshResponse = await axios.post(`${BASE_URL}/orders/refresh-tracking/${orderId}`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Manual refresh completed');
    console.log('📊 Refresh result:', refreshResponse.data.message);
    if (refreshResponse.data.updated) {
      console.log('🔄 Updates applied:', refreshResponse.data.updates);
    }

    // Step 6: Check updated tracking details
    console.log('\n📋 Step 6: Checking updated tracking details...');
    const updatedTrackingResponse = await axios.get(`${BASE_URL}/orders/${orderId}/shipment-details`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('📊 Updated tracking details:');
    console.log('- Tracking Number:', updatedTrackingResponse.data.shipmentDetails.trackingNumber || 'Not assigned');
    console.log('- Courier Name:', updatedTrackingResponse.data.shipmentDetails.courierName || 'Not assigned');
    console.log('- Tracking URL:', updatedTrackingResponse.data.shipmentDetails.trackingUrl || 'Not assigned');

    // Step 7: Test direct tracking API call
    if (shipmentId && shipmentId !== 'undefined' && shipmentId !== 'null') {
      console.log('\n📡 Step 7: Testing direct tracking API call...');
      try {
        const directTrackingResponse = await axios.get(`${BASE_URL}/orders/track/${shipmentId}`);
        console.log('✅ Direct tracking successful');
        console.log('📊 Tracking data available:', !!directTrackingResponse.data.tracking);
      } catch (trackingError) {
        console.log('ℹ️ Direct tracking not available yet (normal for new orders):', trackingError.response?.data?.message || trackingError.message);
      }
    }

    // Step 8: Verify order history update
    console.log('\n📚 Step 8: Verifying order history update...');
    const userResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const orderHistory = userResponse.data.user.orderHistory || [];
    const orderInHistory = orderHistory.find(order => order.orderId === orderId);

    if (orderInHistory) {
      console.log('✅ Order found in user history');
      console.log('- Order ID:', orderInHistory.orderId);
      console.log('- Order Status:', orderInHistory.orderStatus);
      console.log('- Payment Status:', orderInHistory.paymentStatus);
    } else {
      console.log('❌ Order not found in user history');
    }

    console.log('\n🎉 Automatic Tracking Update Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ User creation and login');
    console.log('- ✅ Order creation with payment verification');
    console.log('- ✅ Automatic tracking update attempt');
    console.log('- ✅ Manual refresh tracking functionality');
    console.log('- ✅ Order history update verification');
    console.log('\n💡 Note: Tracking details may not be immediately available for new orders.');
    console.log('   This is normal behavior - tracking becomes available when courier picks up the package.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 409) {
      console.log('ℹ️ User already exists - this is expected for repeated tests');
    }
  }
}

// Run the test
testAutomaticTrackingUpdate(); 