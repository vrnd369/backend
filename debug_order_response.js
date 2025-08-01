const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function debugOrderResponse() {
  console.log('🔍 Debugging Order Response Structure...\n');

  try {
    // Step 1: Create a test user
    console.log('1️⃣ Creating test user...');
    const uniqueEmail = `debugorder${Date.now()}@example.com`;
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      firstName: 'Test',
      lastName: 'Debug',
      email: uniqueEmail,
      password: 'password123',
      phone: '+919876543216',
      houseName: 'Test House',
      streetArea: 'Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'India',
      pincode: '123456'
    });

    const authToken = signupResponse.data.token;
    console.log('✅ User created successfully');

    // Step 2: Create order and check full response
    console.log('\n2️⃣ Creating order and checking full response...');
    
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
      notes: 'Debug order response'
    };

    const orderCreateResponse = await axios.post(`${BASE_URL}/orders/create`, orderData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order created successfully');
    console.log('\n📋 Full Order Creation Response:');
    console.log(JSON.stringify(orderCreateResponse.data, null, 2));

    // Step 3: Check specific fields
    console.log('\n3️⃣ Checking specific fields...');
    const order = orderCreateResponse.data.order;
    console.log('_id:', order._id);
    console.log('orderId:', order.orderId);
    console.log('userId:', order.userId);
    console.log('shiprocketOrderId:', order.shiprocketOrderId);
    console.log('shiprocketShipmentId:', order.shiprocketShipmentId);
    console.log('Has shipmentDetails:', !!order.shipmentDetails);
    
    if (order.shipmentDetails) {
      console.log('shipmentDetails keys:', Object.keys(order.shipmentDetails));
    }

    console.log('\n✅ Debug completed');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
debugOrderResponse(); 