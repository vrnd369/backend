const axios = require('axios');

const BASE_URL = 'https://backend-ottoman-mitten.onrender.com';

async function testBackend() {
  console.log('🧪 Testing Backend Endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test 2: CORS preflight
    console.log('\n2. Testing CORS preflight...');
    try {
      const corsResponse = await axios.options(`${BASE_URL}/auth/login`, {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      console.log('✅ CORS preflight passed:', corsResponse.status);
    } catch (error) {
      console.log('❌ CORS preflight failed:', error.response?.status, error.response?.data);
    }

    // Test 3: Profile endpoint with undefined userId
    console.log('\n3. Testing profile endpoint with undefined userId...');
    try {
      const profileResponse = await axios.put(`${BASE_URL}/auth/profile/undefined`, {
        firstName: 'Test',
        lastName: 'User'
      });
      console.log('❌ Should have failed but got:', profileResponse.data);
    } catch (error) {
      console.log('✅ Correctly rejected undefined userId:', error.response?.data);
    }

    // Test 4: Profile endpoint without authentication
    console.log('\n4. Testing protected profile endpoint without auth...');
    try {
      const protectedResponse = await axios.get(`${BASE_URL}/auth/profile`);
      console.log('❌ Should have failed but got:', protectedResponse.data);
    } catch (error) {
      console.log('✅ Correctly rejected unauthenticated request:', error.response?.status);
    }

    console.log('\n🎉 Backend tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testBackend(); 