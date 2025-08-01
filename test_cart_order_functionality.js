const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testCartAndOrderFunctionality() {
  console.log('🛒 Testing Cart and Order Functionality...\n');

  let authToken = null;
  let userId = null;

  try {
    // Step 1: Create a test user
    console.log('1️⃣ Creating test user...');
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      firstName: 'Test',
      lastName: 'Cart',
      email: 'testcart@example.com',
      password: 'password123',
      phone: '+919876543211',
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
    console.log('Token received:', !!authToken);

    // Step 2: Test cart functionality
    console.log('\n2️⃣ Testing cart functionality...');
    
    // Test cart update
    const testCart = [
      {
        id: 'product1',
        productId: 'product1',
        title: 'Test Product 1',
        price: 100,
        quantity: 2,
        img: 'test-image-1.jpg',
        description: 'Test product description'
      },
      {
        id: 'product2',
        productId: 'product2',
        title: 'Test Product 2',
        price: 150,
        quantity: 1,
        img: 'test-image-2.jpg',
        description: 'Another test product'
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

    console.log('✅ Cart update response:', cartUpdateResponse.data);

    // Test cart retrieval
    console.log('\n📦 Retrieving cart...');
    const cartGetResponse = await axios.get(`${BASE_URL}/cart/my-cart`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Cart retrieved successfully');
    console.log('Cart items count:', cartGetResponse.data.cart.length);
    console.log('Cart items:', cartGetResponse.data.cart);

    // Step 3: Test order creation
    console.log('\n3️⃣ Testing order creation...');
    
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
      subtotal: 350,
      shippingCost: 50,
      tax: 35,
      total: 435,
      paymentMethod: 'cod',
      notes: 'Test order'
    };

    console.log('📋 Creating order...');
    const orderCreateResponse = await axios.post(`${BASE_URL}/orders/create`, orderData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order created successfully');
    console.log('Order ID:', orderCreateResponse.data.order._id);
    console.log('Order Status:', orderCreateResponse.data.order.orderStatus);

    // Step 4: Test order retrieval
    console.log('\n4️⃣ Testing order retrieval...');
    
    const ordersGetResponse = await axios.get(`${BASE_URL}/orders/my-orders`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Orders retrieved successfully');
    console.log('Orders count:', ordersGetResponse.data.orders.length);
    console.log('Orders:', ordersGetResponse.data.orders);

    // Step 5: Test specific order retrieval
    if (orderCreateResponse.data.order._id) {
      console.log('\n5️⃣ Testing specific order retrieval...');
      
      const specificOrderResponse = await axios.get(`${BASE_URL}/orders/${orderCreateResponse.data.order._id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('✅ Specific order retrieved successfully');
      console.log('Order details:', specificOrderResponse.data.order);
    }

    // Step 6: Test cart with legacy endpoint
    console.log('\n6️⃣ Testing cart with legacy endpoint...');
    
    const legacyCartResponse = await axios.get(`${BASE_URL}/cart/${userId}`);
    console.log('✅ Legacy cart endpoint works');
    console.log('Legacy cart items count:', legacyCartResponse.data.cart.length);

    console.log('\n🎉 All cart and order tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ User creation works');
    console.log('✅ Cart update works');
    console.log('✅ Cart retrieval works');
    console.log('✅ Order creation works');
    console.log('✅ Order retrieval works');
    console.log('✅ Legacy cart endpoint works');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testCartAndOrderFunctionality(); 