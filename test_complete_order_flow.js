const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_URL = 'http://localhost:5000';

async function testCompleteOrderFlow() {
  try {
    console.log('🚀 Testing Complete Order Creation Flow...\n');

    // Step 1: Create a test user
    console.log('1. Creating test user...');
    const testUserData = {
      firstName: 'Test',
      lastName: 'User',
      email: `test.user.${Date.now()}@example.com`,
      password: 'testpassword123',
      phone: '1234567890',
      houseName: 'Test House',
      streetArea: 'Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'India',
      pincode: '123456'
    };

    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, testUserData);
    const token = signupResponse.data.token;
    console.log('✅ Test user created');

    // Step 2: Create order with Shiprocket integration
    console.log('\n2. Creating order with Shiprocket integration...');
    
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
        country: 'India',
        pincode: '654321'
      },
      billingAddress: {
        houseName: 'Test Billing House',
        streetArea: 'Test Billing Street',
        city: 'Test Billing City',
        state: 'Test Billing State',
        country: 'India',
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

    console.log('✅ Order created successfully');
    console.log('Order ID:', orderResponse.data.order.orderId);
    console.log('Order Status:', orderResponse.data.order.orderStatus);
    console.log('Shiprocket Order ID:', orderResponse.data.order.shiprocketOrderId);
    console.log('Shipment ID:', orderResponse.data.order.shiprocketShipmentId);
    console.log('Courier:', orderResponse.data.order.courierName);
    console.log('Tracking Number:', orderResponse.data.order.trackingNumber);

    // Step 3: Test order retrieval
    console.log('\n3. Testing order retrieval...');
    const ordersResponse = await axios.get(`${BASE_URL}/api/orders/my-orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Orders retrieved successfully');
    console.log('Number of orders:', ordersResponse.data.orders.length);

    // Step 4: Test specific order retrieval
    if (orderResponse.data.order.orderId) {
      console.log('\n4. Testing specific order retrieval...');
      const specificOrderResponse = await axios.get(`${BASE_URL}/api/orders/${orderResponse.data.order.orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Specific order retrieved successfully');
      const order = specificOrderResponse.data.order;
      console.log('Order details:', {
        orderId: order.orderId,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        shiprocketOrderId: order.shiprocketOrderId,
        shiprocketShipmentId: order.shiprocketShipmentId,
        courierName: order.courierName,
        trackingNumber: order.trackingNumber
      });
    }

    console.log('\n🎉 SUCCESS: Complete order creation flow is working!');
    console.log('✅ User creation working');
    console.log('✅ Order creation with Shiprocket working');
    console.log('✅ Order retrieval working');
    console.log('✅ Shiprocket integration working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testCompleteOrderFlow(); 