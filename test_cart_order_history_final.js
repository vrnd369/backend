const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test data with unique email
const testUser = {
  firstName: 'Akhil',
  lastName: 'Reddy',
  email: `akhil.cart.order.test.${Date.now()}@example.com`,
  password: 'testpassword123',
  phone: '9876543210'
};

let authToken = '';

async function testCartAndOrderHistory() {
  console.log('🔍 Testing Cart and Order History Functionality...\n');

  try {
    // 1. Register a test user
    console.log('1️⃣ Registering test user...');
    const registerResponse = await axios.post(`${API_BASE}/auth/signup`, testUser);
    console.log('✅ Registration successful:', registerResponse.data.status);
    authToken = registerResponse.data.token;
    console.log('🔑 Auth token received');
    console.log('');

    // 2. Check initial user profile
    console.log('2️⃣ Checking initial user profile...');
    const initialProfileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('📊 Initial Profile:');
    console.log('  - Cart Items:', initialProfileResponse.data.user?.cart?.length || 0);
    console.log('  - Order History:', initialProfileResponse.data.user?.orderHistory?.length || 0);
    console.log('');

    // 3. Add items to cart
    console.log('3️⃣ Adding items to cart...');
    const cartItems = [
      {
        productId: 'cart-test-product-1',
        id: 'cart-test-product-1',
        title: 'Cart Test Product 1',
        price: 199,
        quantity: 1,
        img: 'https://example.com/cart1.jpg'
      },
      {
        productId: 'cart-test-product-2',
        id: 'cart-test-product-2',
        title: 'Cart Test Product 2',
        price: 299,
        quantity: 2,
        img: 'https://example.com/cart2.jpg'
      }
    ];

    const cartUpdateResponse = await axios.post(`${API_BASE}/cart/update`, {
      cart: cartItems
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Cart update response:', cartUpdateResponse.data);
    console.log('');

    // 4. Check cart API
    console.log('4️⃣ Checking cart API...');
    const cartResponse = await axios.get(`${API_BASE}/cart/my-cart`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Cart API response:', cartResponse.data);
    console.log('📦 Cart items count:', cartResponse.data.cart?.length || 0);
    console.log('');

    // 5. Check user profile after cart update
    console.log('5️⃣ Checking user profile after cart update...');
    const profileAfterCartResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('📊 Profile after cart update:');
    console.log('  - Cart Items:', profileAfterCartResponse.data.user?.cart?.length || 0);
    console.log('  - Order History:', profileAfterCartResponse.data.user?.orderHistory?.length || 0);
    console.log('');

    // 6. Create an order
    console.log('6️⃣ Creating test order...');
    const orderData = {
      items: [
        {
          productId: 'order-test-product',
          id: 'order-test-product',
          title: 'Order Test Product',
          price: 399,
          quantity: 1,
          img: 'https://example.com/order-test.jpg'
        }
      ],
      shippingAddress: {
        houseName: 'Order Test House',
        streetArea: 'Order Test Street',
        city: 'Order Test City',
        state: 'Order Test State',
        country: 'India',
        pincode: '123456'
      },
      billingAddress: {
        houseName: 'Order Test House',
        streetArea: 'Order Test Street',
        city: 'Order Test City',
        state: 'Order Test State',
        country: 'India',
        pincode: '123456'
      },
      subtotal: 399,
      shippingCost: 0,
      tax: 0,
      total: 399,
      paymentMethod: 'online',
      notes: 'Cart and order history test'
    };

    const orderResponse = await axios.post(`${API_BASE}/orders/create`, orderData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Order creation response:', orderResponse.data);
    console.log('📋 Order ID:', orderResponse.data.order?.orderId);
    console.log('');

    // 7. Check user profile after order creation
    console.log('7️⃣ Checking user profile after order creation...');
    const profileAfterOrderResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('📊 Profile after order creation:');
    console.log('  - Cart Items:', profileAfterOrderResponse.data.user?.cart?.length || 0);
    console.log('  - Order History:', profileAfterOrderResponse.data.user?.orderHistory?.length || 0);
    console.log('');

    // 8. Check all orders
    console.log('8️⃣ Checking all orders...');
    const allOrdersResponse = await axios.get(`${API_BASE}/orders/my-orders`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ All orders response:', allOrdersResponse.data);
    console.log('📋 Orders count:', allOrdersResponse.data.orders?.length || 0);
    console.log('');

    // 9. Detailed analysis
    console.log('9️⃣ Detailed Analysis...');
    console.log('🔍 FUNCTIONALITY STATUS:');
    console.log('  📦 Cart API shows items:', cartResponse.data.cart?.length || 0);
    console.log('  👤 User profile cart items:', profileAfterCartResponse.data.user?.cart?.length || 0);
    console.log('  📋 Orders in order section:', allOrdersResponse.data.orders?.length || 0);
    console.log('  📋 Orders in user history:', profileAfterOrderResponse.data.user?.orderHistory?.length || 0);
    console.log('');

    // 10. Status check
    console.log('🔍 STATUS CHECK:');
    
    // Cart functionality
    if (cartResponse.data.cart?.length > 0 && profileAfterCartResponse.data.user?.cart?.length > 0) {
      console.log('✅ CART FUNCTIONALITY: WORKING');
      console.log('   - Cart items are being saved to user profile');
    } else {
      console.log('❌ CART FUNCTIONALITY: ISSUE');
      console.log('   - Cart items are not being saved to user profile');
    }

    // Order history functionality
    if (allOrdersResponse.data.orders?.length > 0 && profileAfterOrderResponse.data.user?.orderHistory?.length > 0) {
      console.log('✅ ORDER HISTORY FUNCTIONALITY: WORKING');
      console.log('   - Orders are being saved to user history');
    } else if (allOrdersResponse.data.orders?.length > 0 && profileAfterOrderResponse.data.user?.orderHistory?.length === 0) {
      console.log('❌ ORDER HISTORY FUNCTIONALITY: ISSUE');
      console.log('   - Orders exist in order section but not in user history');
      console.log('   - This indicates addOrderToUserHistory function is not working');
    } else {
      console.log('❌ ORDER HISTORY FUNCTIONALITY: ISSUE');
      console.log('   - No orders found in either section');
    }

    console.log('');
    console.log('🎯 SUMMARY:');
    console.log('1. Cart functionality:', cartResponse.data.cart?.length > 0 && profileAfterCartResponse.data.user?.cart?.length > 0 ? '✅ WORKING' : '❌ ISSUE');
    console.log('2. Order history functionality:', profileAfterOrderResponse.data.user?.orderHistory?.length > 0 ? '✅ WORKING' : '❌ ISSUE');
    console.log('3. Order creation functionality:', allOrdersResponse.data.orders?.length > 0 ? '✅ WORKING' : '❌ ISSUE');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
  }
}

// Run the test
testCartAndOrderHistory(); 