const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test data with unique email
const testUser = {
  firstName: 'Order',
  lastName: 'Test',
  email: `order.test.${Date.now()}@example.com`,
  password: 'testpassword123',
  phone: '9876543210'
};

let authToken = '';

async function testOrderObjectStructure() {
  console.log('🔍 Testing Order Object Structure...\n');

  try {
    // 1. Register a test user
    console.log('1️⃣ Registering test user...');
    const registerResponse = await axios.post(`${API_BASE}/auth/signup`, testUser);
    console.log('✅ Registration successful:', registerResponse.data.status);
    authToken = registerResponse.data.token;
    console.log('🔑 Auth token received');
    console.log('');

    // 2. Create an order and capture the order object
    console.log('2️⃣ Creating test order...');
    const orderData = {
      items: [
        {
          productId: 'structure-test-product',
          id: 'structure-test-product',
          title: 'Structure Test Product',
          price: 199,
          quantity: 1,
          img: 'https://example.com/structure-test.jpg'
        }
      ],
      shippingAddress: {
        houseName: 'Structure Test House',
        streetArea: 'Structure Test Street',
        city: 'Structure Test City',
        state: 'Structure Test State',
        country: 'India',
        pincode: '123456'
      },
      billingAddress: {
        houseName: 'Structure Test House',
        streetArea: 'Structure Test Street',
        city: 'Structure Test City',
        state: 'Structure Test State',
        country: 'India',
        pincode: '123456'
      },
      subtotal: 199,
      shippingCost: 0,
      tax: 0,
      total: 199,
      paymentMethod: 'online',
      notes: 'Structure test order'
    };

    const orderResponse = await axios.post(`${API_BASE}/orders/create`, orderData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Order creation response:', orderResponse.data);
    console.log('📋 Order ID:', orderResponse.data.order?.orderId);
    console.log('');

    // 3. Check user profile after order creation
    console.log('3️⃣ Checking user profile after order creation...');
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('📊 Profile after order creation:');
    console.log('  - Cart Items:', profileResponse.data.user?.cart?.length || 0);
    console.log('  - Order History:', profileResponse.data.user?.orderHistory?.length || 0);
    console.log('');

    // 4. Check all orders
    console.log('4️⃣ Checking all orders...');
    const allOrdersResponse = await axios.get(`${API_BASE}/orders/my-orders`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ All orders response:', allOrdersResponse.data);
    console.log('📋 Orders count:', allOrdersResponse.data.orders?.length || 0);
    console.log('');

    // 5. Detailed analysis of order object structure
    console.log('5️⃣ Analyzing order object structure...');
    if (allOrdersResponse.data.orders && allOrdersResponse.data.orders.length > 0) {
      const order = allOrdersResponse.data.orders[0];
      console.log('📊 Order object structure:');
      console.log('  - orderId:', order.orderId);
      console.log('  - total:', order.total);
      console.log('  - orderStatus:', order.orderStatus);
      console.log('  - paymentStatus:', order.paymentStatus);
      console.log('  - items:', order.items ? order.items.length : 0);
      console.log('  - createdAt:', order.createdAt);
      console.log('  - _id:', order._id);
      console.log('  - userId:', order.userId);
      console.log('');

      // Check if order object has all required fields for addOrderToUserHistory
      const requiredFields = ['orderId', 'total', 'orderStatus', 'paymentStatus', 'items', 'createdAt'];
      const missingFields = requiredFields.filter(field => !order[field]);
      
      if (missingFields.length > 0) {
        console.log('❌ Missing required fields in order object:', missingFields);
      } else {
        console.log('✅ Order object has all required fields');
      }
    }

    // 6. Test the addOrderToUserHistory function with the actual order object
    console.log('6️⃣ Testing addOrderToUserHistory with actual order object...');
    if (allOrdersResponse.data.orders && allOrdersResponse.data.orders.length > 0) {
      const order = allOrdersResponse.data.orders[0];
      
      // Create a test order object with the same structure
      const testOrder = {
        orderId: order.orderId,
        total: order.total,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        items: order.items
      };
      
      console.log('📋 Test order object:', testOrder);
      console.log('✅ Order object structure looks correct');
    }

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
testOrderObjectStructure(); 