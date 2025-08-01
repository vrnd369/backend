const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

async function testLogging() {
  console.log('🔍 Testing logging in order creation...\n');

  try {
    // 1. Register a test user
    console.log('1️⃣ Registering test user...');
    const registerResponse = await axios.post(`${API_BASE}/auth/signup`, {
      firstName: 'Logging',
      lastName: 'Test',
      email: `logging.test.${Date.now()}@example.com`,
      password: 'testpassword123',
      phone: '9876543210'
    });
    console.log('✅ Registration successful');
    const authToken = registerResponse.data.token;
    console.log('');

    // 2. Create an order to trigger logging
    console.log('2️⃣ Creating test order to check logging...');
    const orderData = {
      items: [
        {
          productId: 'logging-test-product',
          id: 'logging-test-product',
          title: 'Logging Test Product',
          price: 299,
          quantity: 1,
          img: 'https://example.com/logging-test.jpg'
        }
      ],
      shippingAddress: {
        houseName: 'Logging Test House',
        streetArea: 'Logging Test Street',
        city: 'Logging Test City',
        state: 'Logging Test State',
        country: 'India',
        pincode: '123456'
      },
      billingAddress: {
        houseName: 'Logging Test House',
        streetArea: 'Logging Test Street',
        city: 'Logging Test City',
        state: 'Logging Test State',
        country: 'India',
        pincode: '123456'
      },
      subtotal: 299,
      shippingCost: 0,
      tax: 0,
      total: 299,
      paymentMethod: 'online',
      notes: 'Logging test order'
    };

    const orderResponse = await axios.post(`${API_BASE}/orders/create`, orderData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Order creation response:', orderResponse.data);
    console.log('📋 Order ID:', orderResponse.data.order?.orderId);
    console.log('');

    // 3. Check user profile
    console.log('3️⃣ Checking user profile...');
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('📊 Profile:');
    console.log('  - Cart Items:', profileResponse.data.user?.cart?.length || 0);
    console.log('  - Order History:', profileResponse.data.user?.orderHistory?.length || 0);
    console.log('');

    console.log('🔍 ANALYSIS:');
    console.log('If you see the logging messages in the server console, the function is being called.');
    console.log('If not, there might be an issue with the function call or an error before the logging.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testLogging(); 