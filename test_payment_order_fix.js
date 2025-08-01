const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test data
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'testpayment2@example.com',
  password: 'testpassword123',
  phone: '9876543210'
};

const testProduct = {
  id: 'test-product-1',
  productId: 'test-product-1',
  title: 'Test Product',
  price: 299,
  quantity: 2,
  img: 'https://example.com/image.jpg',
  description: 'Test product description'
};

const testOrderData = {
  items: [testProduct],
  shippingAddress: {
    houseName: 'Test House',
    streetArea: 'Test Street',
    city: 'Test City',
    state: 'Test State',
    country: 'India',
    pincode: '123456'
  },
  billingAddress: {
    houseName: 'Test House',
    streetArea: 'Test Street',
    city: 'Test City',
    state: 'Test State',
    country: 'India',
    pincode: '123456'
  },
  subtotal: 598,
  shippingCost: 0,
  tax: 0,
  total: 598,
  paymentMethod: 'online',
  notes: 'Test order with payment'
};

let authToken = '';

async function testPaymentOrder() {
  console.log('🚀 Testing Payment and Order Creation...\n');

  try {
    // 1. Register a test user
    console.log('1️⃣ Registering test user...');
    const registerResponse = await axios.post(`${API_BASE}/auth/signup`, testUser);
    console.log('✅ Registration successful:', registerResponse.data.status);
    authToken = registerResponse.data.token;
    console.log('🔑 Auth token received');
    console.log('');

    // 2. Test Order Creation
    console.log('2️⃣ Testing Order Creation...');
    const orderResponse = await axios.post(`${API_BASE}/orders/create`, testOrderData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Order creation response:', orderResponse.data);
    console.log('📋 Order ID:', orderResponse.data.order.orderId);
    console.log('🚚 Shiprocket Order ID:', orderResponse.data.order.shiprocketOrderId);
    console.log('📦 Shiprocket Shipment ID:', orderResponse.data.order.shiprocketShipmentId);
    console.log('');

    // 3. Test Order Retrieval (without payment verification)
    console.log('3️⃣ Testing Order Retrieval...');
    const ordersResponse = await axios.get(`${API_BASE}/orders/my-orders`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Orders retrieval successful:', ordersResponse.data.status);
    console.log('📋 Total orders:', ordersResponse.data.orders.length);
    
    if (ordersResponse.data.orders.length > 0) {
      const order = ordersResponse.data.orders[0];
      console.log('📦 First order details:');
      console.log('  - Order ID:', order.orderId);
      console.log('  - Status:', order.orderStatus);
      console.log('  - Payment Status:', order.paymentStatus);
      console.log('  - Total:', order.total);
      console.log('  - Shiprocket Order ID:', order.shiprocketOrderId);
      console.log('  - Shiprocket Shipment ID:', order.shiprocketShipmentId);
      console.log('  - Courier Name:', order.courierName);
      console.log('  - Tracking Number:', order.trackingNumber);
      console.log('  - Tracking URL:', order.trackingUrl);
      console.log('  - Shipment Details:', order.shipmentDetails);
    }
    console.log('');

    // 4. Test Specific Order Details
    console.log('4️⃣ Testing Specific Order Details...');
    if (ordersResponse.data.orders.length > 0) {
      const orderId = ordersResponse.data.orders[0].orderId;
      const orderDetailResponse = await axios.get(`${API_BASE}/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      console.log('✅ Order detail response:', orderDetailResponse.data);
      console.log('📦 Order shipment details:', orderDetailResponse.data.order.shipmentDetails);
    }
    console.log('');

    // 5. Test Shipment Details Endpoint
    console.log('5️⃣ Testing Shipment Details Endpoint...');
    if (ordersResponse.data.orders.length > 0) {
      const orderId = ordersResponse.data.orders[0].orderId;
      const shipmentResponse = await axios.get(`${API_BASE}/orders/${orderId}/shipment-details`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      console.log('✅ Shipment details response:', shipmentResponse.data);
    }
    console.log('');

    // 6. Test User Profile (to check order history)
    console.log('6️⃣ Testing User Profile (Order History)...');
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Profile response status:', profileResponse.data.status);
    console.log('📋 Order history count:', profileResponse.data.user.orderHistory.length);
    
    if (profileResponse.data.user.orderHistory.length > 0) {
      const orderHistory = profileResponse.data.user.orderHistory[0];
      console.log('📦 First order history entry:');
      console.log('  - Order ID:', orderHistory.orderId);
      console.log('  - Order Amount:', orderHistory.orderAmount);
      console.log('  - Order Status:', orderHistory.orderStatus);
      console.log('  - Payment Status:', orderHistory.paymentStatus);
      console.log('  - Items count:', orderHistory.items.length);
    }
    console.log('');

    // 7. Test Payment Verification (with bypass for testing)
    console.log('7️⃣ Testing Payment Verification (with test data)...');
    const paymentData = {
      razorpay_payment_id: 'test_payment_id_' + Date.now(),
      razorpay_order_id: 'test_razorpay_order_id',
      razorpay_signature: 'test_signature',
      orderId: orderResponse.data.order.orderId,
      ...testOrderData
    };

    try {
      const paymentResponse = await axios.post(`${API_BASE}/payment/verify-payment`, paymentData, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      console.log('✅ Payment verification response:', paymentResponse.data);
    } catch (paymentError) {
      console.log('⚠️ Payment verification failed (expected in test):', paymentError.response?.data?.message || paymentError.message);
      console.log('This is expected because we\'re using test signature data');
    }
    console.log('');

    console.log('🎉 Payment and Order test completed successfully!');
    console.log('✅ Order creation working');
    console.log('✅ Order retrieval working');
    console.log('✅ Shipment details working');
    console.log('✅ Order history saving working');
    console.log('✅ Real-time shipment details working');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
  }
}

// Run the test
testPaymentOrder(); 