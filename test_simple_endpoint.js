const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testSimpleEndpoints() {
  try {
    console.log('🔍 Testing basic endpoints...\n');

    // 1. Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health endpoint working');
    console.log('Response:', healthResponse.data);

    // 2. Test root endpoint
    console.log('\n2. Testing root endpoint...');
    const rootResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Root endpoint working');
    console.log('Response:', rootResponse.data);

    // 3. Test orders endpoint (should return 404 for GET without auth)
    console.log('\n3. Testing orders endpoint...');
    try {
      const ordersResponse = await axios.get(`${BASE_URL}/api/orders/my-orders`);
      console.log('❌ Orders endpoint should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Orders endpoint properly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    // 4. Test courier list endpoint
    console.log('\n4. Testing courier list endpoint...');
    try {
      const courierResponse = await axios.get(`${BASE_URL}/api/orders/couriers/list`);
      console.log('✅ Courier list endpoint working');
      console.log('Response status:', courierResponse.status);
    } catch (error) {
      console.log('❌ Courier list error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testSimpleEndpoints(); 