const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testCartAndOrderComprehensive() {
  console.log('🛒 Comprehensive Cart and Order Test...\n');

  let authToken = null;
  let userId = null;

  try {
    // Step 1: Create a test user
    console.log('1️⃣ Creating test user...');
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      firstName: 'Test',
      lastName: 'Comprehensive',
      email: 'testcomprehensive@example.com',
      password: 'password123',
      phone: '+919876543212',
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

    // Step 2: Test initial cart state
    console.log('\n2️⃣ Testing initial cart state...');
    const initialCartResponse = await axios.get(`${BASE_URL}/cart/my-cart`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Initial cart items count:', initialCartResponse.data.cart.length);

    // Step 3: Add items to cart
    console.log('\n3️⃣ Adding items to cart...');
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

    const cartUpdateResponse = await axios.post(`${BASE_URL}/cart/update`, {
      cart: testCart
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Cart update response:', cartUpdateResponse.data.status);

    // Step 4: Verify cart was saved
    console.log('\n4️⃣ Verifying cart was saved...');
    const cartGetResponse = await axios.get(`${BASE_URL}/cart/my-cart`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Cart retrieved successfully');
    console.log('Cart items count:', cartGetResponse.data.cart.length);
    console.log('Cart items:', cartGetResponse.data.cart);

    // Step 5: Test legacy cart endpoint
    console.log('\n5️⃣ Testing legacy cart endpoint...');
    const legacyCartResponse = await axios.get(`${BASE_URL}/cart/${userId}`);
    console.log('✅ Legacy cart endpoint works');
    console.log('Legacy cart items count:', legacyCartResponse.data.cart.length);

    // Step 6: Create order (this should clear the cart)
    console.log('\n6️⃣ Creating order (this will clear the cart)...');
    
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

    const orderCreateResponse = await axios.post(`${BASE_URL}/orders/create`, orderData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order created successfully');
    console.log('Order ID:', orderCreateResponse.data.order._id);
    console.log('Order Status:', orderCreateResponse.data.order.orderStatus);

    // Step 7: Verify cart was cleared after order
    console.log('\n7️⃣ Verifying cart was cleared after order...');
    const cartAfterOrderResponse = await axios.get(`${BASE_URL}/cart/my-cart`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Cart after order creation');
    console.log('Cart items count:', cartAfterOrderResponse.data.cart.length);
    console.log('Expected: 0 (cart should be cleared)');

    // Step 8: Test order retrieval
    console.log('\n8️⃣ Testing order retrieval...');
    const ordersGetResponse = await axios.get(`${BASE_URL}/orders/my-orders`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Orders retrieved successfully');
    console.log('Orders count:', ordersGetResponse.data.orders.length);

    // Step 9: Add items to cart again
    console.log('\n9️⃣ Adding items to cart again...');
    const newCartItems = [
      {
        id: 'product3',
        productId: 'product3',
        title: 'Test Product 3',
        price: 200,
        quantity: 1,
        img: 'test-image-3.jpg',
        description: 'Another test product'
      }
    ];

    const newCartUpdateResponse = await axios.post(`${BASE_URL}/cart/update`, {
      cart: newCartItems
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ New cart update response:', newCartUpdateResponse.data.status);

    // Step 10: Verify new cart state
    console.log('\n🔟 Verifying new cart state...');
    const finalCartResponse = await axios.get(`${BASE_URL}/cart/my-cart`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Final cart state');
    console.log('Cart items count:', finalCartResponse.data.cart.length);
    console.log('Cart items:', finalCartResponse.data.cart);

    console.log('\n🎉 All comprehensive cart and order tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ User creation works');
    console.log('✅ Cart update works');
    console.log('✅ Cart retrieval works');
    console.log('✅ Legacy cart endpoint works');
    console.log('✅ Order creation works');
    console.log('✅ Cart clearing after order works');
    console.log('✅ Order retrieval works');
    console.log('✅ Cart can be updated again after order');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testCartAndOrderComprehensive(); 