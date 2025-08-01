const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testOrdersRoute() {
  try {
    console.log('🔍 Testing orders route...\n');

    // 1. Test if orders route is loaded
    console.log('1. Testing orders route availability...');
    
    // Test with a non-existent endpoint to see if the route is loaded
    try {
      const response = await axios.get(`${BASE_URL}/api/orders/non-existent`);
      console.log('❌ Should have returned 404');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Orders route is loaded (404 for non-existent endpoint)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    // 2. Test courier list endpoint
    console.log('\n2. Testing courier list endpoint...');
    try {
      const courierResponse = await axios.get(`${BASE_URL}/api/orders/couriers/list`);
      console.log('✅ Courier list endpoint working');
      console.log('Response status:', courierResponse.status);
      console.log('Response data:', courierResponse.data);
    } catch (error) {
      console.log('❌ Courier list error:', error.response?.data || error.message);
      console.log('Error status:', error.response?.status);
    }

    // 3. Test shipping calculation endpoint
    console.log('\n3. Testing shipping calculation endpoint...');
    try {
      const shippingResponse = await axios.post(`${BASE_URL}/api/orders/calculate-shipping`, {
        pickupPincode: '110001',
        deliveryPincode: '400001',
        weight: 0.5
      });
      console.log('✅ Shipping calculation endpoint working');
      console.log('Response status:', shippingResponse.status);
      console.log('Response data:', shippingResponse.data);
    } catch (error) {
      console.log('❌ Shipping calculation error:', error.response?.data || error.message);
      console.log('Error status:', error.response?.status);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testOrdersRoute(); 