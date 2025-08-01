const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testOrderResponse() {
  console.log('🔍 Testing Order Response Structure...\n');

  try {
    // Step 1: Create a test user
    console.log('1️⃣ Creating test user...');
    const uniqueEmail = `testresponse${Date.now()}@example.com`;
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      firstName: 'Test',
      lastName: 'Response',
      email: uniqueEmail,
      password: 'password123',
      phone: '+919876543214',
      houseName: 'Test House',
      streetArea: 'Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'India',
      pincode: '123456'
    });

    const authToken = signupResponse.data.token;
    console.log('✅ User created successfully');

    // Step 2: Create order
    console.log('\n2️⃣ Creating order...');
    
    const orderData = {
      items: [
        {
          id: 'product1',
          productId: 'product1',
          title: 'Test Product',
          price: 100,
          quantity: 1,
          img: 'test-image.jpg',
          description: 'Test product'
        }
      ],
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
      subtotal: 100,
      shippingCost: 50,
      tax: 10,
      total: 160,
      paymentMethod: 'cod',
      notes: 'Test order response'
    };

    const orderCreateResponse = await axios.post(`${BASE_URL}/orders/create`, orderData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order created successfully');
    console.log('\n📋 Full Order Response:');
    console.log(JSON.stringify(orderCreateResponse.data, null, 2));

    // Step 3: Check specific fields
    console.log('\n3️⃣ Checking specific fields...');
    const order = orderCreateResponse.data.order;
    console.log('_id:', order._id);
    console.log('orderId:', order.orderId);
    console.log('userId:', order.userId);
    console.log('total:', order.total);
    console.log('orderStatus:', order.orderStatus);

    console.log('\n✅ Order response test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testOrderResponse(); 