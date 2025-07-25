const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = global.testToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Test functions
async function testSignup() {
  console.log('\n🧪 Testing Signup...');
  try {
    const response = await api.post('/auth/signup', {
      firstName: 'Test',
      lastName: 'User',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      phone: '+1234567890'
    });
    
    if (response.data.status === 'success') {
      global.testToken = response.data.token;
      console.log('✅ Signup successful');
      console.log('   Token received:', response.data.token ? 'Yes' : 'No');
      console.log('   User ID:', response.data.user._id);
      return true;
    }
  } catch (error) {
    if (error.response?.data?.message === 'User already exists') {
      console.log('⚠️  User already exists, proceeding to login...');
      return false;
    }
    console.error('❌ Signup failed:', error.response?.data || error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n🧪 Testing Login...');
  try {
    const response = await api.post('/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (response.data.status === 'success') {
      global.testToken = response.data.token;
      console.log('✅ Login successful');
      console.log('   Token received:', response.data.token ? 'Yes' : 'No');
      console.log('   User ID:', response.data.user._id);
      return true;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetProfile() {
  console.log('\n🧪 Testing Get Profile (Protected Route)...');
  try {
    const response = await api.get('/auth/profile');
    
    if (response.data.status === 'success') {
      console.log('✅ Get profile successful');
      console.log('   User ID:', response.data.user._id);
      console.log('   Email:', response.data.user.email);
      console.log('   Name:', `${response.data.user.firstName} ${response.data.user.lastName}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Get profile failed:', error.response?.data || error.message);
    return false;
  }
}

async function testUpdateProfile() {
  console.log('\n🧪 Testing Update Profile...');
  try {
    const response = await api.put('/auth/profile', {
      firstName: 'Updated',
      lastName: 'User',
      phone: '+9876543210',
      profilePic: 'https://example.com/avatar.jpg'
    });
    
    if (response.data.status === 'success') {
      console.log('✅ Update profile successful');
      console.log('   Updated name:', `${response.data.user.firstName} ${response.data.user.lastName}`);
      console.log('   Updated phone:', response.data.user.phone);
      return true;
    }
  } catch (error) {
    console.error('❌ Update profile failed:', error.response?.data || error.message);
    return false;
  }
}

async function testSendOTP() {
  console.log('\n🧪 Testing Send OTP...');
  try {
    const response = await api.post('/auth/send-otp', {
      email: TEST_EMAIL
    });
    
    if (response.data.status === 'success') {
      console.log('✅ Send OTP successful');
      console.log('   Message:', response.data.message);
      return true;
    }
  } catch (error) {
    console.error('❌ Send OTP failed:', error.response?.data || error.message);
    return false;
  }
}

async function testInvalidToken() {
  console.log('\n🧪 Testing Invalid Token...');
  try {
    // Set invalid token
    global.testToken = 'invalid.token.here';
    
    const response = await api.get('/auth/profile');
    console.log('❌ Should have failed with invalid token');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Invalid token correctly rejected');
      console.log('   Error message:', error.response.data.message);
      return true;
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
      return false;
    }
  }
}

async function testNoToken() {
  console.log('\n🧪 Testing No Token...');
  try {
    // Remove token
    global.testToken = null;
    
    const response = await api.get('/auth/profile');
    console.log('❌ Should have failed with no token');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ No token correctly rejected');
      console.log('   Error message:', error.response.data.message);
      return true;
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
      return false;
    }
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting JWT Authentication Tests...');
  console.log('📍 Base URL:', BASE_URL);
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test signup or login
  totalTests++;
  const signupResult = await testSignup();
  if (!signupResult) {
    totalTests++;
    const loginResult = await testLogin();
    if (loginResult) passedTests++;
  } else {
    passedTests++;
  }
  
  // Test protected routes
  totalTests++;
  if (await testGetProfile()) passedTests++;
  
  totalTests++;
  if (await testUpdateProfile()) passedTests++;
  
  // Test OTP
  totalTests++;
  if (await testSendOTP()) passedTests++;
  
  // Test authentication errors
  totalTests++;
  if (await testInvalidToken()) passedTests++;
  
  totalTests++;
  if (await testNoToken()) passedTests++;
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! JWT authentication is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testSignup,
  testLogin,
  testGetProfile,
  testUpdateProfile,
  testSendOTP,
  testInvalidToken,
  testNoToken,
  runTests
}; 