const axios = require('axios');
const crypto = require('crypto');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_USER_TOKEN = 'your-test-jwt-token-here'; // Replace with actual test token

// Helper function to generate test signature
function generateTestSignature(orderId, paymentId, secretKey) {
  const text = orderId + '|' + paymentId;
  return crypto
    .createHmac('sha256', secretKey)
    .update(text, 'utf8')
    .digest('hex');
}

// Test 1: Create order with payment verification
async function testCreateOrderWithPayment() {
  console.log('\n🧪 Test 1: Create order with payment verification');
  
  try {
    const testData = {
      items: [
        {
          productId: 'prod_123',
          title: 'Test Product',
          price: 1000,
          quantity: 1,
          img: 'test-image.jpg'
        }
      ],
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
      subtotal: 1000,
      shippingCost: 100,
      tax: 50,
      total: 1150,
      paymentMethod: 'online',
      notes: 'Test order with payment verification',
      // Payment verification data
      razorpay_payment_id: 'pay_test123',
      razorpay_order_id: 'order_test123',
      razorpay_signature: generateTestSignature('order_test123', 'pay_test123', process.env.RAZORPAY_KEY_SECRET || 'test_secret')
    };

    const response = await axios.post(`${BASE_URL}/api/orders/create-with-payment`, testData, {
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order created with payment verification:', response.data);
    return response.data.order.orderId;
  } catch (error) {
    console.error('❌ Test 1 failed:', error.response?.data || error.message);
    return null;
  }
}

// Test 2: Verify payment and update order status
async function testVerifyPayment(orderId) {
  console.log('\n🧪 Test 2: Verify payment and update order status');
  
  try {
    const testData = {
      razorpay_payment_id: 'pay_test123',
      razorpay_order_id: 'order_test123',
      razorpay_signature: generateTestSignature('order_test123', 'pay_test123', process.env.RAZORPAY_KEY_SECRET || 'test_secret'),
      orderId: orderId
    };

    const response = await axios.post(`${BASE_URL}/api/payment/verify-payment`, testData, {
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Payment verified and order status updated:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Test 2 failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Check order status after verification
async function testCheckOrderStatus(orderId) {
  console.log('\n🧪 Test 3: Check order status after verification');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`
      }
    });

    const order = response.data.order;
    console.log('✅ Order status check:', {
      orderId: order.orderId,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus
    });

    // Verify that order status is updated correctly
    if (order.orderStatus === 'confirmed' && order.paymentStatus === 'paid') {
      console.log('✅ Order status correctly updated to confirmed/paid');
      return true;
    } else {
      console.log('❌ Order status not updated correctly');
      return false;
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Check user order history
async function testCheckUserOrderHistory() {
  console.log('\n🧪 Test 4: Check user order history');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/orders/my-orders`, {
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`
      }
    });

    const orders = response.data.orders;
    console.log('✅ User order history:', {
      totalOrders: orders.length,
      latestOrder: orders[0] ? {
        orderId: orders[0].orderId,
        orderStatus: orders[0].orderStatus,
        paymentStatus: orders[0].paymentStatus
      } : null
    });

    return orders.length > 0;
  } catch (error) {
    console.error('❌ Test 4 failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 5: Test payment capture with order update
async function testPaymentCaptureWithOrderUpdate() {
  console.log('\n🧪 Test 5: Test payment capture with order update');
  
  try {
    const testData = {
      paymentId: 'pay_test456',
      orderId: 'order_test456',
      razorpay_signature: generateTestSignature('order_test456', 'pay_test456', process.env.RAZORPAY_KEY_SECRET || 'test_secret'),
      internalOrderId: 'ORD1234567890' // Our internal order ID
    };

    const response = await axios.post(`${BASE_URL}/api/payment/capture-payment`, testData, {
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Payment captured with order update:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Test 5 failed:', error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Payment Verification Tests...\n');
  
  // Test 1: Create order with payment verification
  const orderId = await testCreateOrderWithPayment();
  
  if (orderId) {
    // Test 2: Verify payment and update order status
    const verificationSuccess = await testVerifyPayment(orderId);
    
    if (verificationSuccess) {
      // Test 3: Check order status after verification
      await testCheckOrderStatus(orderId);
    }
  }
  
  // Test 4: Check user order history
  await testCheckUserOrderHistory();
  
  // Test 5: Test payment capture with order update
  await testPaymentCaptureWithOrderUpdate();
  
  console.log('\n🎉 Payment verification tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testCreateOrderWithPayment,
  testVerifyPayment,
  testCheckOrderStatus,
  testCheckUserOrderHistory,
  testPaymentCaptureWithOrderUpdate,
  runAllTests
}; 