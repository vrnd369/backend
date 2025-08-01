const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testShiprocketIntegration() {
  try {
    console.log('🚀 Testing Shiprocket Integration...\n');

    // 1. Test Shiprocket authentication
    console.log('1. Testing Shiprocket authentication...');
    const authResponse = await axios.post(`${BASE_URL}/api/orders/couriers/list`);
    console.log('✅ Courier list endpoint working');
    console.log('Response status:', authResponse.status);

    // 2. Test shipping rate calculation
    console.log('\n2. Testing shipping rate calculation...');
    const shippingResponse = await axios.post(`${BASE_URL}/api/orders/calculate-shipping`, {
      pickupPincode: '110001', // Delhi
      deliveryPincode: '400001', // Mumbai
      weight: 0.5
    });
    console.log('✅ Shipping calculation working');
    console.log('Response status:', shippingResponse.status);
    console.log('Available couriers:', shippingResponse.data.rates?.data?.length || 0);

    // 3. Test order creation (without actual Shiprocket call)
    console.log('\n3. Testing order creation endpoint...');
    
    // First create a test user
    const testUserData = {
      firstName: 'Shiprocket',
      lastName: 'Test',
      email: `shiprocket.test.${Date.now()}@example.com`,
      password: 'testpassword123',
      phone: '1234567890',
      houseName: 'Test House',
      streetArea: 'Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      pincode: '123456'
    };

    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, testUserData);
    const token = signupResponse.data.token;

    // Test order creation
    const orderData = {
      items: [
        {
          productId: 'PROD001',
          title: 'Test Product',
          price: 1000,
          quantity: 2,
          img: 'test-image.jpg',
          description: 'Test product description'
        }
      ],
      shippingAddress: {
        houseName: 'Test Shipping House',
        streetArea: 'Test Shipping Street',
        city: 'Test Shipping City',
        state: 'Test Shipping State',
        country: 'Test Shipping Country',
        pincode: '654321'
      },
      billingAddress: {
        houseName: 'Test Billing House',
        streetArea: 'Test Billing Street',
        city: 'Test Billing City',
        state: 'Test Billing State',
        country: 'Test Billing Country',
        pincode: '654321'
      },
      subtotal: 2000,
      shippingCost: 100,
      tax: 50,
      total: 2150,
      paymentMethod: 'online',
      notes: 'Test order for Shiprocket integration'
    };

    const orderResponse = await axios.post(`${BASE_URL}/api/orders/create`, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order creation working');
    console.log('Order ID:', orderResponse.data.order.orderId);
    console.log('Order Status:', orderResponse.data.order.orderStatus);

    // 4. Test order retrieval
    console.log('\n4. Testing order retrieval...');
    const ordersResponse = await axios.get(`${BASE_URL}/api/orders/my-orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Order retrieval working');
    console.log('Number of orders:', ordersResponse.data.orders.length);

    // 5. Test specific order retrieval
    if (orderResponse.data.order.orderId) {
      console.log('\n5. Testing specific order retrieval...');
      const specificOrderResponse = await axios.get(`${BASE_URL}/api/orders/${orderResponse.data.order.orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Specific order retrieval working');
      console.log('Order details:', specificOrderResponse.data.order.orderId);
    }

    console.log('\n🎉 SUCCESS: Shiprocket integration is working correctly!');
    console.log('✅ Authentication working');
    console.log('✅ Shipping calculation working');
    console.log('✅ Order creation working');
    console.log('✅ Order retrieval working');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testShiprocketIntegration(); 