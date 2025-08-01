const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test data
const testUser = {
  firstName: 'Akhil',
  lastName: 'Reddy',
  email: 'akhil.fix2@example.com',
  password: 'testpassword123',
  phone: '9876543210'
};

const testProduct = {
  id: 'test-product-1',
  productId: 'test-product-1',
  title: 'Test Product for Fix',
  price: 299,
  quantity: 2,
  img: 'https://example.com/image.jpg',
  description: 'Test product description'
};

const testOrderData = {
  items: [testProduct],
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
  subtotal: 598,
  shippingCost: 0,
  tax: 0,
  total: 598,
  paymentMethod: 'online',
  notes: 'Test order for fixing issues'
};

let authToken = '';
let testOrderId = '';

async function testOrderHistoryCartFix() {
  console.log('🚀 Testing Order History and Cart Fix...\n');

  try {
    // 1. Register a test user
    console.log('1️⃣ Registering test user...');
    const registerResponse = await axios.post(`${API_BASE}/auth/signup`, testUser);
    console.log('✅ Registration successful:', registerResponse.data.status);
    authToken = registerResponse.data.token;
    console.log('🔑 Auth token received');
    console.log('');

    // 2. Add items to cart
    console.log('2️⃣ Adding items to cart...');
    const cartItems = [
      {
        productId: 'cart-product-1',
        title: 'Cart Product for Fix',
        price: 199,
        quantity: 1,
        img: 'https://example.com/cart1.jpg'
      },
      {
        productId: 'cart-product-2',
        title: 'Cart Product 2 for Fix',
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

    // 3. Check cart items
    console.log('3️⃣ Checking cart items...');
    const cartResponse = await axios.get(`${API_BASE}/cart/my-cart`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Cart response:', cartResponse.data);
    console.log('📦 Cart items count:', cartResponse.data.cart?.length || 0);
    console.log('');

    // 4. Create an order
    console.log('4️⃣ Creating test order...');
    const orderResponse = await axios.post(`${API_BASE}/orders/create`, testOrderData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Order creation response:', orderResponse.data);
    testOrderId = orderResponse.data.order.orderId;
    console.log('📋 Order ID:', testOrderId);
    console.log('');

    // 5. Test payment verification (bypass signature for testing)
    console.log('5️⃣ Testing Payment Verification...');
    const paymentData = {
      razorpay_payment_id: 'pay_test123456789',
      razorpay_order_id: 'order_test123456789',
      razorpay_signature: 'test_signature_123456789',
      orderId: testOrderId,
      items: testOrderData.items,
      shippingAddress: testOrderData.shippingAddress,
      billingAddress: testOrderData.billingAddress,
      subtotal: testOrderData.subtotal,
      shippingCost: testOrderData.shippingCost,
      tax: testOrderData.tax,
      total: testOrderData.total,
      paymentMethod: 'online',
      notes: 'Test payment for fixing issues'
    };

    try {
      const paymentResponse = await axios.post(`${API_BASE}/payment/verify-payment`, paymentData, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      console.log('✅ Payment verification response:', paymentResponse.data);
    } catch (paymentError) {
      console.log('⚠️ Payment verification failed (expected due to signature):', paymentError.response?.data?.message);
    }
    console.log('');

    // 6. Check user profile for order history
    console.log('6️⃣ Checking User Profile for Order History...');
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ User profile response:', profileResponse.data);
    console.log('📋 Order History Count:', profileResponse.data.user?.orderHistory?.length || 0);
    console.log('📦 Cart Items Count:', profileResponse.data.user?.cart?.length || 0);
    console.log('');

    // 7. Check all orders
    console.log('7️⃣ Checking All Orders...');
    const allOrdersResponse = await axios.get(`${API_BASE}/orders/my-orders`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ All orders response:', allOrdersResponse.data);
    console.log('📋 Orders count:', allOrdersResponse.data.orders?.length || 0);
    console.log('');

    // 8. Final verification
    console.log('8️⃣ Final Verification...');
    console.log('📊 ISSUE ANALYSIS:');
    console.log('  📋 Orders in Order Section:', allOrdersResponse.data.orders?.length || 0);
    console.log('  👤 Orders in User History:', profileResponse.data.user?.orderHistory?.length || 0);
    console.log('  📦 Cart Items in Profile:', profileResponse.data.user?.cart?.length || 0);
    console.log('  🛒 Cart Items from Cart API:', cartResponse.data.cart?.length || 0);
    console.log('');

    if (allOrdersResponse.data.orders?.length > 0 && profileResponse.data.user?.orderHistory?.length === 0) {
      console.log('❌ ISSUE FOUND: Orders exist but not in user history!');
    } else {
      console.log('✅ Order history working correctly');
    }

    if (cartResponse.data.cart?.length > 0 && profileResponse.data.user?.cart?.length === 0) {
      console.log('❌ ISSUE FOUND: Cart items exist but not in user profile!');
    } else {
      console.log('✅ Cart items working correctly');
    }

    console.log('');
    console.log('🎯 FIXES NEEDED:');
    console.log('1. Order history not being added to user profile');
    console.log('2. Cart items not being saved to user profile');
    console.log('3. Need to ensure addOrderToUserHistory is called');
    console.log('4. Need to ensure cart updates are saved to user profile');

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
testOrderHistoryCartFix(); 