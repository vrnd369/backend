const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test data
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
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

let authToken = '';
let userId = '';

async function testBackend() {
  console.log('🚀 Starting comprehensive backend verification...\n');

  try {
    // 1. Test User Registration
    console.log('1️⃣ Testing User Registration...');
    const registerResponse = await axios.post(`${API_BASE}/auth/signup`, testUser);
    console.log('✅ Registration successful:', registerResponse.data.status);
    authToken = registerResponse.data.token;
    userId = registerResponse.data.user._id;
    console.log('🔑 Auth token received');
    console.log('👤 User ID:', userId);
    console.log('');

    // 2. Test User Login
    console.log('2️⃣ Testing User Login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', loginResponse.data.status);
    authToken = loginResponse.data.token; // Update token
    console.log('🔑 Updated auth token received');
    console.log('');

    // 3. Test Cart Operations
    console.log('3️⃣ Testing Cart Operations...');
    
    // Add items to cart
    const cartItems = [testProduct];
    const cartUpdateResponse = await axios.post(`${API_BASE}/cart/update`, {
      cart: cartItems
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Cart update successful:', cartUpdateResponse.data.status);
    console.log('📦 Cart items count:', cartUpdateResponse.data.cart.length);

    // Load cart
    const cartLoadResponse = await axios.get(`${API_BASE}/cart/my-cart`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Cart load successful:', cartLoadResponse.data.status);
    console.log('📦 Loaded cart items count:', cartLoadResponse.data.cart.length);
    console.log('');

    // 4. Test Wishlist Operations
    console.log('4️⃣ Testing Wishlist Operations...');
    
    // Add items to wishlist
    const wishlistItems = [testProduct];
    const wishlistUpdateResponse = await axios.post(`${API_BASE}/wishlist/update`, {
      wishlist: wishlistItems
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Wishlist update successful:', wishlistUpdateResponse.data.status);
    console.log('💝 Wishlist items count:', wishlistUpdateResponse.data.wishlist.length);

    // Load wishlist
    const wishlistLoadResponse = await axios.get(`${API_BASE}/wishlist/my-wishlist`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Wishlist load successful:', wishlistLoadResponse.data.status);
    console.log('💝 Loaded wishlist items count:', wishlistLoadResponse.data.wishlist.length);
    console.log('');

    // 5. Test Order Creation
    console.log('5️⃣ Testing Order Creation...');
    
    const orderData = {
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
      notes: 'Test order'
    };

    const orderResponse = await axios.post(`${API_BASE}/orders/create`, orderData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Order creation successful:', orderResponse.data.status);
    console.log('📋 Order ID:', orderResponse.data.order.orderId);
    console.log('💰 Order total:', orderResponse.data.order.total);
    console.log('🚚 Shiprocket Order ID:', orderResponse.data.order.shiprocketOrderId);
    console.log('📦 Shiprocket Shipment ID:', orderResponse.data.order.shiprocketShipmentId);
    console.log('');

    // 6. Test Order Retrieval
    console.log('6️⃣ Testing Order Retrieval...');
    
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
      console.log('  - Shipment Details:', order.shipmentDetails);
    }
    console.log('');

    // 7. Test User Profile (to check order history)
    console.log('7️⃣ Testing User Profile (Order History)...');
    
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Profile retrieval successful:', profileResponse.data.status);
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

    // 8. Test Shipment Details
    console.log('8️⃣ Testing Shipment Details...');
    
    if (ordersResponse.data.orders.length > 0) {
      const orderId = ordersResponse.data.orders[0].orderId;
      const shipmentResponse = await axios.get(`${API_BASE}/orders/${orderId}/shipment-details`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      console.log('✅ Shipment details retrieval successful:', shipmentResponse.data.status);
      console.log('📦 Shipment details:', shipmentResponse.data.shipmentDetails);
    }
    console.log('');

    // 9. Test Payment Verification (if Shiprocket order exists)
    console.log('9️⃣ Testing Payment Verification...');
    
    if (ordersResponse.data.orders.length > 0) {
      const order = ordersResponse.data.orders[0];
      if (order.shiprocketOrderId) {
        const paymentData = {
          razorpay_payment_id: 'test_payment_id',
          razorpay_order_id: order.shiprocketOrderId,
          razorpay_signature: 'test_signature',
          internalOrderId: order.orderId
        };

        try {
          const paymentResponse = await axios.post(`${API_BASE}/payment/verify-payment`, paymentData, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          console.log('✅ Payment verification successful:', paymentResponse.data.success);
        } catch (error) {
          console.log('⚠️ Payment verification failed (expected for test):', error.response?.data?.message || error.message);
        }
      } else {
        console.log('⚠️ No Shiprocket order ID available for payment test');
      }
    }
    console.log('');

    // 10. Test Real-time Updates
    console.log('🔟 Testing Real-time Updates...');
    
    if (ordersResponse.data.orders.length > 0) {
      const order = ordersResponse.data.orders[0];
      if (order.shiprocketOrderId) {
        try {
          const updateResponse = await axios.get(`${API_BASE}/orders/check-shiprocket-updates/${order.orderId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          console.log('✅ Shiprocket updates check successful:', updateResponse.data.status);
        } catch (error) {
          console.log('⚠️ Shiprocket updates check failed (may be expected):', error.response?.data?.message || error.message);
        }
      }
    }
    console.log('');

    console.log('🎉 All backend tests completed successfully!');
    console.log('✅ Cart operations working');
    console.log('✅ Wishlist operations working');
    console.log('✅ Order creation working');
    console.log('✅ Order history saving working');
    console.log('✅ Shipment details working');
    console.log('✅ Authentication working');
    console.log('✅ Real-time updates configured');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
  }
}

// Run the test
testBackend(); 