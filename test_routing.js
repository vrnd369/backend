const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'routing-test@example.com';

// Test functions
async function testApiAuthEndpoint() {
  console.log('\n🧪 Testing /api/auth/send-otp endpoint...');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/send-otp`, {
      email: TEST_EMAIL
    });
    
    if (response.data.status === 'success') {
      console.log('✅ /api/auth/send-otp endpoint works correctly');
      return true;
    }
  } catch (error) {
    console.error('❌ /api/auth/send-otp failed:', error.response?.data || error.message);
    return false;
  }
}

async function testAuthEndpoint() {
  console.log('\n🧪 Testing /auth/send-otp endpoint...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/send-otp`, {
      email: TEST_EMAIL
    });
    
    if (response.data.status === 'success') {
      console.log('✅ /auth/send-otp endpoint works correctly');
      return true;
    }
  } catch (error) {
    console.error('❌ /auth/send-otp failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCorsHeaders() {
  console.log('\n🧪 Testing CORS headers...');
  try {
    const response = await axios.options(`${BASE_URL}/auth/send-otp`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsHeaders = response.headers;
    console.log('✅ CORS headers present:');
    console.log('   Access-Control-Allow-Origin:', corsHeaders['access-control-allow-origin']);
    console.log('   Access-Control-Allow-Methods:', corsHeaders['access-control-allow-methods']);
    console.log('   Access-Control-Allow-Headers:', corsHeaders['access-control-allow-headers']);
    return true;
  } catch (error) {
    console.error('❌ CORS test failed:', error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runRoutingTests() {
  console.log('🚀 Starting Routing Compatibility Tests...');
  console.log('📍 Base URL:', BASE_URL);
  
  let passedTests = 0;
  let totalTests = 0;
  
  totalTests++;
  if (await testApiAuthEndpoint()) passedTests++;
  
  totalTests++;
  if (await testAuthEndpoint()) passedTests++;
  
  totalTests++;
  if (await testCorsHeaders()) passedTests++;
  
  // Summary
  console.log('\n📊 Routing Test Summary:');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All routing tests passed! Both /api/* and /* patterns work correctly.');
    console.log('✅ Frontend can now use either endpoint pattern:');
    console.log('   - https://backend-ottoman-mitten.onrender.com/api/auth/send-otp');
    console.log('   - https://backend-ottoman-mitten.onrender.com/auth/send-otp');
  } else {
    console.log('⚠️  Some routing tests failed. Please check the server configuration.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runRoutingTests().catch(console.error);
}

module.exports = {
  testApiAuthEndpoint,
  testAuthEndpoint,
  testCorsHeaders,
  runRoutingTests
}; 