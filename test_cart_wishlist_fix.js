const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test data
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'testcart@example.com',
  password: 'testpassword123',
  phone: '9876543210'
};

const testProduct = {
  id: 'test-product-1',
  productId: 'test-product-1',
  title: 'Test Product',
  price: 299,
  quantity: 2,
  img: 'https://example.com/image.jpg',
  description: 'Test product description'
};

let authToken = '';

async function testCartWishlist() {
  console.log('🚀 Testing Cart and Wishlist functionality...\n');

  try {
    // 1. Register a test user
    console.log('1️⃣ Registering test user...');
    const registerResponse = await axios.post(`${API_BASE}/auth/signup`, testUser);
    console.log('✅ Registration successful:', registerResponse.data.status);
    authToken = registerResponse.data.token;
    console.log('🔑 Auth token received');
    console.log('');

    // 2. Test Cart Update
    console.log('2️⃣ Testing Cart Update...');
    const cartItems = [testProduct];
    console.log('📦 Cart items to add:', cartItems);
    
    const cartUpdateResponse = await axios.post(`${API_BASE}/cart/update`, {
      cart: cartItems
    }, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Cart update response:', cartUpdateResponse.data);
    console.log('📦 Cart items count:', cartUpdateResponse.data.cart.length);
    console.log('');

    // 3. Test Cart Load
    console.log('3️⃣ Testing Cart Load...');
    const cartLoadResponse = await axios.get(`${API_BASE}/cart/my-cart`, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Cart load response:', cartLoadResponse.data);
    console.log('📦 Loaded cart items count:', cartLoadResponse.data.cart.length);
    console.log('');

    // 4. Test Wishlist Update
    console.log('4️⃣ Testing Wishlist Update...');
    const wishlistItems = [testProduct];
    console.log('💝 Wishlist items to add:', wishlistItems);
    
    const wishlistUpdateResponse = await axios.post(`${API_BASE}/wishlist/update`, {
      wishlist: wishlistItems
    }, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Wishlist update response:', wishlistUpdateResponse.data);
    console.log('💝 Wishlist items count:', wishlistUpdateResponse.data.wishlist.length);
    console.log('');

    // 5. Test Wishlist Load
    console.log('5️⃣ Testing Wishlist Load...');
    const wishlistLoadResponse = await axios.get(`${API_BASE}/wishlist/my-wishlist`, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Wishlist load response:', wishlistLoadResponse.data);
    console.log('💝 Loaded wishlist items count:', wishlistLoadResponse.data.wishlist.length);
    console.log('');

    // 6. Test User Profile to verify data is saved
    console.log('6️⃣ Testing User Profile to verify saved data...');
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Profile response status:', profileResponse.data.status);
    console.log('📦 User cart count:', profileResponse.data.user.cart.length);
    console.log('💝 User wishlist count:', profileResponse.data.user.wishlist.length);
    console.log('');

    console.log('🎉 Cart and Wishlist test completed successfully!');
    console.log('✅ Cart operations working');
    console.log('✅ Wishlist operations working');
    console.log('✅ Data is being saved to database');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
  }
}

// Run the test
testCartWishlist(); 