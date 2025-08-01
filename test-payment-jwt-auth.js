const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
let authToken = null;

// Axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

async function testPaymentJWTAuth() {
  console.log('🧪 Testing Payment JWT Authentication...\n');

  try {
    // Step 1: Create a test user and get JWT token
    console.log('1️⃣ Creating test user...');
    const signupResponse = await api.post('/auth/signup', {
      name: 'Test Payment User',
      email: `test-payment-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      phone: '1234567890'
    });

    if (signupResponse.data.token) {
      authToken = signupResponse.data.token;
      console.log('✅ Test user created and token received');
    } else {
      console.log('❌ Failed to get token from signup');
      return false;
    }

    // Step 2: Test create-order endpoint with JWT
    console.log('\n2️⃣ Testing create-order with JWT...');
    const orderData = {
      amount: 10000, // 100 INR in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      orderItems: [{
        productId: 'test-product-1',
        productName: 'Test Product',
        quantity: 1,
        price: 10000
      }],
      orderTotal: 10000,
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'India'
      },
      billingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'India'
      }
    };

    const createOrderResponse = await api.post('/payment/create-order', orderData);
    console.log('✅ Create order successful:', createOrderResponse.data.success);

    // Step 3: Test capture-payment endpoint with JWT
    console.log('\n3️⃣ Testing capture-payment with JWT...');
    const captureData = {
      paymentId: 'pay_test123',
      orderId: createOrderResponse.data.data.orderId
    };

    const captureResponse = await api.post('/payment/capture-payment', captureData);
    console.log('✅ Capture payment successful:', captureResponse.data.success);

    // Step 4: Test user-payments endpoint with JWT
    console.log('\n4️⃣ Testing user-payments with JWT...');
    const userPaymentsResponse = await api.get('/payment/user-payments');
    console.log('✅ User payments successful:', userPaymentsResponse.data.success);

    // Step 5: Test without JWT token (should fail)
    console.log('\n5️⃣ Testing without JWT token...');
    const tempToken = authToken;
    authToken = null;

    try {
      await api.post('/payment/create-order', orderData);
      console.log('❌ Should have failed without token');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly rejected without token');
      } else {
        console.log('❌ Unexpected error without token:', error.response?.status);
        return false;
      }
    }

    // Step 6: Test with invalid JWT token
    console.log('\n6️⃣ Testing with invalid JWT token...');
    authToken = 'invalid.token.here';

    try {
      await api.post('/payment/create-order', orderData);
      console.log('❌ Should have failed with invalid token');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly rejected with invalid token');
      } else {
        console.log('❌ Unexpected error with invalid token:', error.response?.status);
        return false;
      }
    }

    console.log('\n🎉 All JWT authentication tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testPaymentJWTAuth()
    .then(success => {
      if (success) {
        console.log('\n✅ Payment JWT authentication is working correctly!');
        process.exit(0);
      } else {
        console.log('\n❌ Payment JWT authentication tests failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testPaymentJWTAuth }; 