const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test data with unique email
const testUser = {
  firstName: 'Akhil',
  lastName: 'Reddy',
  email: `akhil.final.test.${Date.now()}@example.com`,
  password: 'testpassword123',
  phone: '9876543210'
};

let authToken = '';

async function testOrderHistoryAndCart() {
  console.log('🔍 Testing Order History and Cart Functionality...\n');

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
        productId: 'final-test-product-1',
        id: 'final-test-product-1',
        title: 'Final Test Product 1',
        price: 199,
        quantity: 1,
        img: 'https://example.com/final1.jpg'
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
          productId: 'final-order-product',
          id: 'final-order-product',
          title: 'Final Order Product',
          price: 299,
          quantity: 2,
          img: 'https://example.com/final-order.jpg'
        }
      ],
      shippingAddress: {
        houseName: 'Final Test House',
        streetArea: 'Final Test Street',
        city: 'Final Test City',
        state: 'Final Test State',
        country: 'India',
        pincode: '123456'
      },
      billingAddress: {
        houseName: 'Final Test House',
        streetArea: 'Final Test Street',
        city: 'Final Test City',
        state: 'Final Test State',
        country: 'India',
        pincode: '123456'
      },
      subtotal: 598,
      shippingCost: 0,
      tax: 0,
      total: 598,
      paymentMethod: 'online',
      notes: 'Final test order for debugging'
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
    console.log('🔍 ISSUE DIAGNOSIS:');
    console.log('  📦 Cart API shows items:', cartResponse.data.cart?.length || 0);
    console.log('  👤 User profile cart items:', profileAfterCartResponse.data.user?.cart?.length || 0);
    console.log('  📋 Orders in order section:', allOrdersResponse.data.orders?.length || 0);
    console.log('  📋 Orders in user history:', profileAfterOrderResponse.data.user?.orderHistory?.length || 0);
    console.log('');

    // 10. Check if addOrderToUserHistory was called
    console.log('🔍 Checking if addOrderToUserHistory was called...');
    if (allOrdersResponse.data.orders?.length > 0 && profileAfterOrderResponse.data.user?.orderHistory?.length === 0) {
      console.log('❌ ORDER HISTORY ISSUE CONFIRMED:');
      console.log('   - Orders exist in order section but not in user history');
      console.log('   - This indicates addOrderToUserHistory function is not working properly');
      console.log('   - Need to check the function call and database update logic');
    }

    if (cartResponse.data.cart?.length > 0 && profileAfterCartResponse.data.user?.cart?.length === 0) {
      console.log('❌ CART ISSUE CONFIRMED:');
      console.log('   - Cart API returns items but user profile shows empty cart');
      console.log('   - This indicates cart update is not persisting to user profile');
    }

    console.log('');
    console.log('🎯 ROOT CAUSE ANALYSIS:');
    console.log('1. Order History Issue: addOrderToUserHistory function may not be called or failing');
    console.log('2. Cart Issue: Cart items may not be properly saved to user profile');
    console.log('3. Need to check server logs for any errors during these operations');

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
testOrderHistoryAndCart(); 