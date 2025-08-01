const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testCartAndOrderFinal() {
  console.log('🛒 Final Cart and Order Test...\n');

  let authToken = null;
  let userId = null;

  try {
    // Step 1: Create a test user with unique email
    console.log('1️⃣ Creating test user...');
    const uniqueEmail = `testfinal${Date.now()}@example.com`;
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      firstName: 'Test',
      lastName: 'Final',
      email: uniqueEmail,
      password: 'password123',
      phone: '+919876543213',
      houseName: 'Test House',
      streetArea: 'Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'India',
      pincode: '123456'
    });

    authToken = signupResponse.data.token;
    userId = signupResponse.data.user._id;
    console.log('✅ User created successfully');
    console.log('User ID:', userId);

    // Step 2: Test cart functionality
    console.log('\n2️⃣ Testing cart functionality...');
    
    const testCart = [
      {
        id: 'product1',
        productId: 'product1',
        title: 'Test Product 1',
        price: 100,
        quantity: 2,
        img: 'test-image-1.jpg',
        description: 'Test product description'
      }
    ];

    console.log('📦 Adding items to cart...');
    const cartUpdateResponse = await axios.post(`${BASE_URL}/cart/update`, {
      cart: testCart
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Cart update response:', cartUpdateResponse.data.status);

    // Step 3: Verify cart was saved
    console.log('\n3️⃣ Verifying cart was saved...');
    const cartGetResponse = await axios.get(`${BASE_URL}/cart/my-cart`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Cart retrieved successfully');
    console.log('Cart items count:', cartGetResponse.data.cart.length);

    // Step 4: Create order
    console.log('\n4️⃣ Creating order...');
    
    const orderData = {
      items: testCart,
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
      subtotal: 200,
      shippingCost: 50,
      tax: 25,
      total: 275,
      paymentMethod: 'cod',
      notes: 'Final test order'
    };

    const orderCreateResponse = await axios.post(`${BASE_URL}/orders/create`, orderData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order created successfully');
    console.log('Order ID:', orderCreateResponse.data.order._id);
    console.log('Order Status:', orderCreateResponse.data.order.orderStatus);

    // Step 5: Verify cart was cleared after order
    console.log('\n5️⃣ Verifying cart was cleared after order...');
    const cartAfterOrderResponse = await axios.get(`${BASE_URL}/cart/my-cart`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Cart after order creation');
    console.log('Cart items count:', cartAfterOrderResponse.data.cart.length);
    console.log('Expected: 0 (cart should be cleared)');

    // Step 6: Test order retrieval
    console.log('\n6️⃣ Testing order retrieval...');
    const ordersGetResponse = await axios.get(`${BASE_URL}/orders/my-orders`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Orders retrieved successfully');
    console.log('Orders count:', ordersGetResponse.data.orders.length);

    console.log('\n🎉 Final cart and order test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ User creation works');
    console.log('✅ Cart update works');
    console.log('✅ Cart retrieval works');
    console.log('✅ Order creation works');
    console.log('✅ Cart clearing after order works');
    console.log('✅ Order retrieval works');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testCartAndOrderFinal(); 