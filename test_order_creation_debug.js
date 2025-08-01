const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test data with unique email
const testUser = {
  firstName: 'Order',
  lastName: 'Debug',
  email: `order.debug.${Date.now()}@example.com`,
  password: 'testpassword123',
  phone: '9876543210'
};

let authToken = '';

async function testOrderCreationDebug() {
  console.log('🔍 Testing Order Creation Debug...\n');

  try {
    // 1. Register a test user
    console.log('1️⃣ Registering test user...');
    const registerResponse = await axios.post(`${API_BASE}/auth/signup`, testUser);
    console.log('✅ Registration successful:', registerResponse.data.status);
    authToken = registerResponse.data.token;
    console.log('🔑 Auth token received');
    console.log('');

    // 2. Check initial user profile
    console.log('2️⃣ Checking initial user profile...');
    const initialProfileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('📊 Initial Profile:');
    console.log('  - User ID:', initialProfileResponse.data.user?._id);
    console.log('  - Cart Items:', initialProfileResponse.data.user?.cart?.length || 0);
    console.log('  - Order History:', initialProfileResponse.data.user?.orderHistory?.length || 0);
    console.log('');

    // 3. Create an order with detailed logging
    console.log('3️⃣ Creating test order with detailed logging...');
    const orderData = {
      items: [
        {
          productId: 'debug-test-product',
          id: 'debug-test-product',
          title: 'Debug Test Product',
          price: 199,
          quantity: 1,
          img: 'https://example.com/debug-test.jpg'
        }
      ],
      shippingAddress: {
        houseName: 'Debug Test House',
        streetArea: 'Debug Test Street',
        city: 'Debug Test City',
        state: 'Debug Test State',
        country: 'India',
        pincode: '123456'
      },
      billingAddress: {
        houseName: 'Debug Test House',
        streetArea: 'Debug Test Street',
        city: 'Debug Test City',
        state: 'Debug Test State',
        country: 'India',
        pincode: '123456'
      },
      subtotal: 199,
      shippingCost: 0,
      tax: 0,
      total: 199,
      paymentMethod: 'online',
      notes: 'Debug test order'
    };

    console.log('📋 Order data being sent:', JSON.stringify(orderData, null, 2));
    console.log('');

    const orderResponse = await axios.post(`${API_BASE}/orders/create`, orderData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Order creation response:', orderResponse.data);
    console.log('📋 Order ID:', orderResponse.data.order?.orderId);
    console.log('');

    // 4. Wait a moment for the order to be processed
    console.log('4️⃣ Waiting for order processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('');

    // 5. Check user profile after order creation
    console.log('5️⃣ Checking user profile after order creation...');
    const profileAfterOrderResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('📊 Profile after order creation:');
    console.log('  - User ID:', profileAfterOrderResponse.data.user?._id);
    console.log('  - Cart Items:', profileAfterOrderResponse.data.user?.cart?.length || 0);
    console.log('  - Order History:', profileAfterOrderResponse.data.user?.orderHistory?.length || 0);
    
    if (profileAfterOrderResponse.data.user?.orderHistory?.length > 0) {
      console.log('  - Latest Order in History:', profileAfterOrderResponse.data.user.orderHistory[profileAfterOrderResponse.data.user.orderHistory.length - 1]);
    }
    console.log('');

    // 6. Check all orders
    console.log('6️⃣ Checking all orders...');
    const allOrdersResponse = await axios.get(`${API_BASE}/orders/my-orders`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ All orders response:');
    console.log('📋 Orders count:', allOrdersResponse.data.orders?.length || 0);
    
    if (allOrdersResponse.data.orders && allOrdersResponse.data.orders.length > 0) {
      const order = allOrdersResponse.data.orders[0];
      console.log('📊 Order details:');
      console.log('  - Order ID:', order.orderId);
      console.log('  - User ID:', order.userId);
      console.log('  - Total:', order.total);
      console.log('  - Status:', order.orderStatus);
      console.log('  - Items:', order.items ? order.items.length : 0);
    }
    console.log('');

    // 7. Analysis
    console.log('7️⃣ Analysis...');
    const orderHistoryLength = profileAfterOrderResponse.data.user?.orderHistory?.length || 0;
    const ordersLength = allOrdersResponse.data.orders?.length || 0;
    
    console.log('📊 RESULTS:');
    console.log('  - Orders in order section:', ordersLength);
    console.log('  - Orders in user history:', orderHistoryLength);
    console.log('  - User ID from profile:', profileAfterOrderResponse.data.user?._id);
    console.log('  - User ID from order:', allOrdersResponse.data.orders?.[0]?.userId);
    console.log('');

    if (orderHistoryLength > 0) {
      console.log('✅ SUCCESS: Order history is working correctly!');
    } else {
      console.log('❌ ISSUE: Order history is still not working');
      console.log('   - Orders exist in order section but not in user history');
      console.log('   - This indicates the addOrderToUserHistory function is not working');
      console.log('   - Need to check server logs for errors');
      console.log('   - The issue might be in the order creation process');
    }

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
testOrderCreationDebug(); 