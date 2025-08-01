const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test data
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: `testuser_${Date.now()}@example.com`,
  password: 'testpassword123',
  phone: '9876543210'
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
    },
    {
      id: 'prod_002',
      productId: 'prod_002',
      title: 'Test Product 2',
      price: 150,
      quantity: 1,
      img: 'test-image-2.jpg'
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
  subtotal: 350,
  shippingCost: 50,
  tax: 35,
  total: 435,
  paymentMethod: 'online',
  notes: 'Test order for orderHistory verification'
};

async function testOrderHistoryUpdate() {
  try {
    console.log('🧪 Testing Order History Update Functionality');
    console.log('============================================');

    // Step 1: Create a test user
    console.log('\n1️⃣ Creating test user...');
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, testUser);
    console.log('✅ User created:', signupResponse.data.user.email);

    // Step 2: Login to get token
    console.log('\n2️⃣ Logging in to get authentication token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user._id;
    console.log('✅ Login successful, token obtained');

    // Step 3: Check initial orderHistory
    console.log('\n3️⃣ Checking initial orderHistory...');
    const initialUserResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const initialOrderHistory = initialUserResponse.data.user.orderHistory || [];
    console.log('📊 Initial orderHistory length:', initialOrderHistory.length);

    // Step 4: Create an order
    console.log('\n4️⃣ Creating test order...');
    const orderResponse = await axios.post(`${BASE_URL}/orders/create`, testOrder, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Order created successfully');
    console.log('📋 Order ID:', orderResponse.data.order.orderId);
    console.log('💰 Order Total:', orderResponse.data.order.total);

    // Step 5: Check updated orderHistory
    console.log('\n5️⃣ Checking updated orderHistory...');
    const updatedUserResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const updatedOrderHistory = updatedUserResponse.data.user.orderHistory || [];
    console.log('📊 Updated orderHistory length:', updatedOrderHistory.length);

    // Step 6: Verify orderHistory was updated
    console.log('\n6️⃣ Verifying orderHistory update...');
    if (updatedOrderHistory.length > initialOrderHistory.length) {
      console.log('✅ SUCCESS: orderHistory was updated!');
      
      const newOrder = updatedOrderHistory[updatedOrderHistory.length - 1];
      console.log('📋 Latest order in history:');
      console.log('   - Order ID:', newOrder.orderId);
      console.log('   - Order Amount:', newOrder.orderAmount);
      console.log('   - Order Status:', newOrder.orderStatus);
      console.log('   - Payment Status:', newOrder.paymentStatus);
      console.log('   - Items Count:', newOrder.items.length);
      
      // Verify the order matches what we created
      if (newOrder.orderId === orderResponse.data.order.orderId) {
        console.log('✅ Order ID matches!');
      } else {
        console.log('❌ Order ID mismatch!');
      }
      
      if (newOrder.orderAmount === orderResponse.data.order.total) {
        console.log('✅ Order amount matches!');
      } else {
        console.log('❌ Order amount mismatch!');
      }
      
    } else {
      console.log('❌ FAILURE: orderHistory was NOT updated!');
      console.log('Initial length:', initialOrderHistory.length);
      console.log('Updated length:', updatedOrderHistory.length);
    }

    // Step 7: Test with payment verification endpoint
    console.log('\n7️⃣ Testing order creation with payment verification...');
    const paymentOrderData = {
      ...testOrder,
      razorpay_payment_id: 'pay_test123',
      razorpay_order_id: 'order_test123',
      razorpay_signature: 'test_signature_123'
    };
    
    try {
      const paymentOrderResponse = await axios.post(`${BASE_URL}/orders/create-with-payment`, paymentOrderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Payment order created (expected to fail signature verification)');
      
      // Check orderHistory again
      const finalUserResponse = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const finalOrderHistory = finalUserResponse.data.user.orderHistory || [];
      console.log('📊 Final orderHistory length:', finalOrderHistory.length);
      
    } catch (error) {
      console.log('⚠️ Payment order creation failed (expected due to invalid signature):', error.response?.data?.message);
    }

    console.log('\n🎯 Test Summary:');
    console.log('================');
    console.log('✅ User creation: Working');
    console.log('✅ User login: Working');
    console.log('✅ Order creation: Working');
    console.log('✅ OrderHistory update: ' + (updatedOrderHistory.length > initialOrderHistory.length ? 'Working' : 'NOT Working'));
    
    if (updatedOrderHistory.length > initialOrderHistory.length) {
      console.log('🎉 SUCCESS: OrderHistory update is working correctly!');
    } else {
      console.log('🔧 ISSUE: OrderHistory update needs to be fixed!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testOrderHistoryUpdate(); 