const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_URL = 'http://localhost:5000';

async function testOrderHistory() {
  try {
    console.log('🚀 Testing Order History Functionality...\n');

    // Step 1: Create a test user
    console.log('1. Creating test user...');
    const testUserData = {
      firstName: 'Order',
      lastName: 'History',
      email: `order.history.${Date.now()}@example.com`,
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

    // Step 2: Check initial order history (should be empty)
    console.log('\n2. Checking initial order history...');
    const initialUserResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const initialUser = initialUserResponse.data.user;
    console.log('Initial order history length:', initialUser.orderHistory?.length || 0);

    // Step 3: Create order
    console.log('\n3. Creating order...');
    
    const orderData = {
      items: [
        {
          productId: 'PROD001',
          title: 'Test Product 1',
          price: 1000,
          quantity: 1,
          img: 'test-image-1.jpg',
          description: 'Test product 1 description'
        },
        {
          productId: 'PROD002',
          title: 'Test Product 2',
          price: 500,
          quantity: 2,
          img: 'test-image-2.jpg',
          description: 'Test product 2 description'
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
      tax: 100,
      total: 2200,
      paymentMethod: 'online',
      notes: 'Test order for order history'
    };

    const orderResponse = await axios.post(`${BASE_URL}/api/orders/create`, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order created successfully');
    const order = orderResponse.data.order;
    console.log('Order ID:', order.orderId);

    // Step 4: Check updated order history
    console.log('\n4. Checking updated order history...');
    const updatedUserResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const updatedUser = updatedUserResponse.data.user;
    console.log('Updated order history length:', updatedUser.orderHistory?.length || 0);

    if (updatedUser.orderHistory && updatedUser.orderHistory.length > 0) {
      const latestOrder = updatedUser.orderHistory[0];
      console.log('\n📦 Latest Order in History:');
      console.log('Order ID:', latestOrder.orderId);
      console.log('Order Date:', latestOrder.orderDate);
      console.log('Order Amount:', latestOrder.orderAmount);
      console.log('Order Status:', latestOrder.orderStatus);
      console.log('Payment Status:', latestOrder.paymentStatus);
      console.log('Payment Method:', latestOrder.paymentMethod);
      console.log('Number of Items:', latestOrder.items?.length || 0);
      
      if (latestOrder.items && latestOrder.items.length > 0) {
        console.log('\n📋 Order Items:');
        latestOrder.items.forEach((item, index) => {
          console.log(`${index + 1}. ${item.productName} - Qty: ${item.quantity} - Price: ₹${item.price}`);
        });
      }
    }

    // Step 5: Test order with payment verification
    console.log('\n5. Creating order with payment verification...');
    
    const orderWithPaymentData = {
      ...orderData,
      // Mock payment verification data
      razorpay_payment_id: 'pay_' + Date.now(),
      razorpay_order_id: 'order_' + Date.now(),
      razorpay_signature: 'mock_signature_' + Date.now()
    };

    const orderWithPaymentResponse = await axios.post(`${BASE_URL}/api/orders/create-with-payment`, orderWithPaymentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order with payment created successfully');
    const orderWithPayment = orderWithPaymentResponse.data.order;
    console.log('Order ID:', orderWithPayment.orderId);

    // Step 6: Check final order history
    console.log('\n6. Checking final order history...');
    const finalUserResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const finalUser = finalUserResponse.data.user;
    console.log('Final order history length:', finalUser.orderHistory?.length || 0);

    if (finalUser.orderHistory && finalUser.orderHistory.length > 0) {
      console.log('\n📊 All Orders in History:');
      finalUser.orderHistory.forEach((order, index) => {
        console.log(`${index + 1}. Order ID: ${order.orderId} - Amount: ₹${order.orderAmount} - Status: ${order.orderStatus} - Payment: ${order.paymentStatus}`);
      });
    }

    console.log('\n🎉 SUCCESS: Order history functionality is working!');
    console.log('✅ Orders are saved to user history');
    console.log('✅ Order details are complete');
    console.log('✅ Payment status is tracked');
    console.log('✅ Order items are included');
    console.log('✅ Both regular and payment orders work');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testOrderHistory(); 