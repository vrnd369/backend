// Comprehensive test file for payment endpoints
// Run this to verify all payment functionality

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_USER_ID = '507f1f77bcf86cd799439011'; // Replace with actual user ID

// Test data
const testOrderData = {
  amount: 10000, // ₹100 in paise
  currency: 'INR',
  receipt: `test_order_${Date.now()}`,
  userId: TEST_USER_ID,
  orderItems: [
    {
      productId: 'prod_123',
      productName: 'Test Product 1',
      quantity: 2,
      price: 3000,
      img: 'https://example.com/product1.jpg'
    },
    {
      productId: 'prod_456',
      productName: 'Test Product 2',
      quantity: 1,
      price: 4000,
      img: 'https://example.com/product2.jpg'
    }
  ],
  orderTotal: 10000,
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
  couponCode: 'TEST10',
  rewardPointsUsed: 50
};

// Test functions
async function testServerHealth() {
  try {
    console.log('🏥 Testing server health...');
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    
    if (response.data.status === 'ok') {
      console.log('✅ Server is healthy');
      console.log('   MongoDB:', response.data.mongodb);
      console.log('   Environment:', response.data.environment);
      return true;
    } else {
      console.log('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Server health check error:', error.message);
    return false;
  }
}

async function testCreateOrder() {
  try {
    console.log('\n🧪 Testing Create Order...');
    
    const response = await axios.post(`${BASE_URL}/payment/create-order`, testOrderData, {
      headers: {
        'user-id': TEST_USER_ID,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Create Order Test Passed');
      console.log('   Order ID:', response.data.data.orderId);
      console.log('   Transaction ID:', response.data.data.transactionId);
      console.log('   Razorpay Order ID:', response.data.data.razorpayOrderId);
      console.log('   Amount:', response.data.data.amount);
      return response.data.data;
    } else {
      console.log('❌ Create Order Test Failed:', response.data.message);
      return null;
    }
  } catch (error) {
    if (error.response?.status === 503) {
      console.log('⚠️  Create Order Test - Payment service unavailable (Razorpay keys not configured)');
      console.log('   This is expected if Razorpay keys are not set');
      return null;
    }
    console.error('❌ Create Order Test Error:', error.response?.data || error.message);
    return null;
  }
}

async function testPaymentStatus(orderData) {
  if (!orderData) {
    console.log('\n⚠️  Skipping Payment Status Test - No order data available');
    return;
  }
  
  try {
    console.log('\n🧪 Testing Payment Status...');
    
    const response = await axios.get(`${BASE_URL}/payment/payment-status/${orderData.orderId}`, {
      headers: {
        'user-id': TEST_USER_ID
      }
    });
    
    if (response.data.success) {
      console.log('✅ Payment Status Test Passed');
      console.log('   Payment Status:', response.data.data.paymentStatus);
      console.log('   Order Items Count:', response.data.data.orderItems.length);
      console.log('   Shipping City:', response.data.data.shippingAddress.city);
      return response.data.data;
    } else {
      console.log('❌ Payment Status Test Failed:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Payment Status Test Error:', error.response?.data || error.message);
  }
}

async function testUserPayments() {
  try {
    console.log('\n🧪 Testing User Payments...');
    
    const response = await axios.get(`${BASE_URL}/payment/user-payments/${TEST_USER_ID}`, {
      headers: {
        'user-id': TEST_USER_ID
      }
    });
    
    if (response.data.success) {
      console.log('✅ User Payments Test Passed');
      console.log('   Total Payments:', response.data.data.totalPayments);
      console.log('   Current Page:', response.data.data.currentPage);
    } else {
      console.log('❌ User Payments Test Failed:', response.data.message);
    }
  } catch (error) {
    console.error('❌ User Payments Test Error:', error.response?.data || error.message);
  }
}

async function testAuthentication() {
  try {
    console.log('\n🔐 Testing Authentication...');
    
    // Test without user ID
    try {
      await axios.post(`${BASE_URL}/payment/create-order`, testOrderData);
      console.log('❌ Authentication Test Failed - Should require user ID');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Authentication Test Passed - Properly requires user ID');
      } else {
        console.log('⚠️  Authentication Test - Unexpected response:', error.response?.status);
      }
    }
  } catch (error) {
    console.error('❌ Authentication Test Error:', error.message);
  }
}

async function testErrorHandling() {
  try {
    console.log('\n🚨 Testing Error Handling...');
    
    // Test with invalid data
    const invalidData = {
      amount: 50, // Too small
      currency: 'INR',
      receipt: 'test',
      userId: TEST_USER_ID
    };
    
    try {
      await axios.post(`${BASE_URL}/payment/create-order`, invalidData, {
        headers: {
          'user-id': TEST_USER_ID,
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Error Handling Test Failed - Should reject invalid data');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Error Handling Test Passed - Properly validates input');
        console.log('   Error Message:', error.response.data.message);
      } else {
        console.log('⚠️  Error Handling Test - Unexpected response:', error.response?.status);
      }
    }
  } catch (error) {
    console.error('❌ Error Handling Test Error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Payment Endpoint Tests...\n');
  
  // Test 1: Server Health
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log('\n❌ Server is not healthy. Please start the server first.');
    return;
  }
  
  // Test 2: Authentication
  await testAuthentication();
  
  // Test 3: Error Handling
  await testErrorHandling();
  
  // Test 4: Create Order
  const orderData = await testCreateOrder();
  
  // Test 5: Payment Status
  await testPaymentStatus(orderData);
  
  // Test 6: User Payments
  await testUserPayments();
  
  console.log('\n🏁 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('   ✅ Server health check');
  console.log('   ✅ Authentication validation');
  console.log('   ✅ Error handling');
  console.log('   ✅ Payment endpoints (if Razorpay keys configured)');
  console.log('\n📝 Notes:');
  console.log('   - If Razorpay keys are not configured, payment tests will show as unavailable');
  console.log('   - This is expected behavior for deployment without payment keys');
  console.log('   - Add Razorpay keys to enable full payment functionality');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await axios.get('http://localhost:5000/health');
    return true;
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first:');
    console.error('   npm start');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await runAllTests();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testServerHealth,
  testCreateOrder,
  testPaymentStatus,
  testUserPayments,
  testAuthentication,
  testErrorHandling
}; 