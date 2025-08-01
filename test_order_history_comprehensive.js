const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test data for email login
const testUserEmail = {
  firstName: 'Email',
  lastName: 'User',
  email: `emailuser_${Date.now()}@example.com`,
  password: 'testpassword123',
  phone: '9876543210'
};

// Test data for mobile login
const testUserMobile = {
  firstName: 'Mobile',
  lastName: 'User',
  email: `mobileuser_${Date.now()}@example.com`,
  password: 'testpassword123',
  phone: '8765432109'
};

const testOrder = {
  items: [
    {
      id: 'prod_001',
      productId: 'prod_001',
      title: 'Test Product 1',
      price: 100,
      quantity: 2,
      img: 'test-image-1.jpg'
    }
  ],
  shippingAddress: {
    houseName: 'Test House',
    streetArea: 'Test Street',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    pincode: '123456'
  },
  billingAddress: {
    houseName: 'Test House',
    streetArea: 'Test Street',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    pincode: '123456'
  },
  subtotal: 200,
  shippingCost: 50,
  tax: 20,
  total: 270,
  paymentMethod: 'online',
  notes: 'Comprehensive test order'
};

async function testOrderHistoryComprehensive() {
  try {
    console.log('🧪 Comprehensive Order History Test');
    console.log('===================================');

    // Test 1: Email Login User
    console.log('\n📧 TEST 1: Email Login User');
    console.log('============================');

    // Create email user
    console.log('1️⃣ Creating email user...');
    const emailSignupResponse = await axios.post(`${BASE_URL}/auth/signup`, testUserEmail);
    console.log('✅ Email user created:', emailSignupResponse.data.user.email);

    // Login with email
    console.log('2️⃣ Logging in with email...');
    const emailLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUserEmail.email,
      password: testUserEmail.password
    });
    
    const emailToken = emailLoginResponse.data.token;
    console.log('✅ Email login successful');

    // Check initial orderHistory
    console.log('3️⃣ Checking initial orderHistory for email user...');
    const emailInitialResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${emailToken}` }
    });
    
    const emailInitialHistory = emailInitialResponse.data.user.orderHistory || [];
    console.log('📊 Email user initial orderHistory length:', emailInitialHistory.length);

    // Create order for email user
    console.log('4️⃣ Creating order for email user...');
    const emailOrderResponse = await axios.post(`${BASE_URL}/orders/create`, testOrder, {
      headers: { Authorization: `Bearer ${emailToken}` }
    });
    
    console.log('✅ Email user order created:', emailOrderResponse.data.order.orderId);

    // Check updated orderHistory for email user
    console.log('5️⃣ Checking updated orderHistory for email user...');
    const emailUpdatedResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${emailToken}` }
    });
    
    const emailUpdatedHistory = emailUpdatedResponse.data.user.orderHistory || [];
    console.log('📊 Email user updated orderHistory length:', emailUpdatedHistory.length);

    // Test 2: Mobile Login User
    console.log('\n📱 TEST 2: Mobile Login User');
    console.log('=============================');

    // Create mobile user
    console.log('1️⃣ Creating mobile user...');
    const mobileSignupResponse = await axios.post(`${BASE_URL}/auth/signup`, testUserMobile);
    console.log('✅ Mobile user created:', mobileSignupResponse.data.user.email);

    // Login with mobile
    console.log('2️⃣ Logging in with mobile...');
    const mobileLoginResponse = await axios.post(`${BASE_URL}/auth/mobile-login`, {
      mobile: testUserMobile.phone,
      password: testUserMobile.password
    });
    
    const mobileToken = mobileLoginResponse.data.token;
    console.log('✅ Mobile login successful');

    // Check initial orderHistory
    console.log('3️⃣ Checking initial orderHistory for mobile user...');
    const mobileInitialResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${mobileToken}` }
    });
    
    const mobileInitialHistory = mobileInitialResponse.data.user.orderHistory || [];
    console.log('📊 Mobile user initial orderHistory length:', mobileInitialHistory.length);

    // Create order for mobile user
    console.log('4️⃣ Creating order for mobile user...');
    const mobileOrderResponse = await axios.post(`${BASE_URL}/orders/create`, testOrder, {
      headers: { Authorization: `Bearer ${mobileToken}` }
    });
    
    console.log('✅ Mobile user order created:', mobileOrderResponse.data.order.orderId);

    // Check updated orderHistory for mobile user
    console.log('5️⃣ Checking updated orderHistory for mobile user...');
    const mobileUpdatedResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${mobileToken}` }
    });
    
    const mobileUpdatedHistory = mobileUpdatedResponse.data.user.orderHistory || [];
    console.log('📊 Mobile user updated orderHistory length:', mobileUpdatedHistory.length);

    // Results Analysis
    console.log('\n📊 RESULTS ANALYSIS');
    console.log('===================');
    
    // Email user results
    const emailSuccess = emailUpdatedHistory.length > emailInitialHistory.length;
    console.log('📧 Email User:');
    console.log('   - Initial history:', emailInitialHistory.length);
    console.log('   - Updated history:', emailUpdatedHistory.length);
    console.log('   - Success:', emailSuccess ? '✅ YES' : '❌ NO');
    
    if (emailSuccess && emailUpdatedHistory.length > 0) {
      const latestEmailOrder = emailUpdatedHistory[emailUpdatedHistory.length - 1];
      console.log('   - Latest order ID:', latestEmailOrder.orderId);
      console.log('   - Latest order amount:', latestEmailOrder.orderAmount);
    }

    // Mobile user results
    const mobileSuccess = mobileUpdatedHistory.length > mobileInitialHistory.length;
    console.log('📱 Mobile User:');
    console.log('   - Initial history:', mobileInitialHistory.length);
    console.log('   - Updated history:', mobileUpdatedHistory.length);
    console.log('   - Success:', mobileSuccess ? '✅ YES' : '❌ NO');
    
    if (mobileSuccess && mobileUpdatedHistory.length > 0) {
      const latestMobileOrder = mobileUpdatedHistory[mobileUpdatedHistory.length - 1];
      console.log('   - Latest order ID:', latestMobileOrder.orderId);
      console.log('   - Latest order amount:', latestMobileOrder.orderAmount);
    }

    // Overall assessment
    console.log('\n🎯 OVERALL ASSESSMENT');
    console.log('====================');
    
    if (emailSuccess && mobileSuccess) {
      console.log('🎉 SUCCESS: OrderHistory update works for BOTH email and mobile login!');
      console.log('✅ Email login orderHistory: Working');
      console.log('✅ Mobile login orderHistory: Working');
      console.log('✅ Order creation: Working');
      console.log('✅ User authentication: Working');
    } else if (emailSuccess) {
      console.log('⚠️ PARTIAL SUCCESS: OrderHistory update works for email login only');
      console.log('✅ Email login orderHistory: Working');
      console.log('❌ Mobile login orderHistory: Not working');
    } else if (mobileSuccess) {
      console.log('⚠️ PARTIAL SUCCESS: OrderHistory update works for mobile login only');
      console.log('❌ Email login orderHistory: Not working');
      console.log('✅ Mobile login orderHistory: Working');
    } else {
      console.log('❌ FAILURE: OrderHistory update not working for either login method');
      console.log('❌ Email login orderHistory: Not working');
      console.log('❌ Mobile login orderHistory: Not working');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testOrderHistoryComprehensive(); 