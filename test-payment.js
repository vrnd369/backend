// Test file for Razorpay integration
// Run this file to test the payment endpoints

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/payment';

// Test data
const testData = {
  amount: 10000, // ₹100 in paise
  currency: 'INR',
  receipt: `test_order_${Date.now()}`,
  userId: '507f1f77bcf86cd799439011', // Replace with actual user ID
  notes: {
    description: 'Test payment for integration'
  }
};

// Test functions
async function testCreateOrder() {
  try {
    console.log('🧪 Testing Create Order...');
    const response = await axios.post(`${BASE_URL}/create-order`, testData);
    
    if (response.data.success) {
      console.log('✅ Create Order Test Passed');
      console.log('Order ID:', response.data.data.orderId);
      console.log('Razorpay Order ID:', response.data.data.razorpayOrderId);
      return response.data.data;
    } else {
      console.log('❌ Create Order Test Failed:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Create Order Test Error:', error.response?.data || error.message);
  }
}

async function testPaymentStatus(orderId) {
  try {
    console.log('🧪 Testing Payment Status...');
    const response = await axios.get(`${BASE_URL}/payment-status/${orderId}`);
    
    if (response.data.success) {
      console.log('✅ Payment Status Test Passed');
      console.log('Status:', response.data.data.status);
      return response.data.data;
    } else {
      console.log('❌ Payment Status Test Failed:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Payment Status Test Error:', error.response?.data || error.message);
  }
}

async function testUserPayments(userId) {
  try {
    console.log('🧪 Testing User Payments...');
    const response = await axios.get(`${BASE_URL}/user-payments/${userId}`);
    
    if (response.data.success) {
      console.log('✅ User Payments Test Passed');
      console.log('Total Payments:', response.data.data.totalPayments);
      console.log('Current Page:', response.data.data.currentPage);
    } else {
      console.log('❌ User Payments Test Failed:', response.data.message);
    }
  } catch (error) {
    console.error('❌ User Payments Test Error:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Razorpay Integration Tests...\n');
  
  // Test 1: Create Order
  const orderData = await testCreateOrder();
  
  if (orderData) {
    // Test 2: Payment Status
    await testPaymentStatus(orderData.orderId);
    
    // Test 3: User Payments
    await testUserPayments(testData.userId);
  }
  
  console.log('\n🏁 Tests completed!');
  console.log('\n📝 Note: Capture Payment and Refund tests require actual payment IDs from Razorpay.');
  console.log('   These should be tested manually after a successful payment.');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await axios.get('http://localhost:5000/health');
    console.log('✅ Server is running');
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
    await runTests();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testCreateOrder,
  testPaymentStatus,
  testUserPayments
}; 