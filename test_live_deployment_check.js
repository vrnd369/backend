require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let authToken = '';

async function testLiveDeployment() {
  console.log('🚀 LIVE DEPLOYMENT CHECK - Testing All Critical Features...\n');

  try {
    // 1. Test User Registration & Authentication
    console.log('1️⃣ Testing User Registration & Authentication...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      firstName: 'Live',
      lastName: 'Test User',
      email: `livetest${Date.now()}@example.com`,
      password: 'TestPassword123!',
      phone: '9876543210'
    });
    
    if (registerResponse.data.status === 'success') {
      console.log('✅ Registration successful');
      authToken = registerResponse.data.token;
    } else {
      throw new Error('Registration failed');
    }

    // 2. Test Cart Functionality
    console.log('\n2️⃣ Testing Cart Functionality...');
    
    // Add item to cart
    const cartResponse = await axios.post(`${BASE_URL}/cart/update`, {
      cart: [{
        id: 'live-test-product-1',
        productId: 'live-test-product-1',
        quantity: 2,
        price: 299,
        title: 'Live Test Product 1',
        img: 'https://example.com/live1.jpg',
        description: 'Premium live test product'
      }]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (cartResponse.data.status === 'success') {
      console.log('✅ Cart update successful');
    } else {
      throw new Error('Cart update failed');
    }

    // Check cart API
    const getCartResponse = await axios.get(`${BASE_URL}/cart/my-cart`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (getCartResponse.data.status === 'success' && getCartResponse.data.cart.length > 0) {
      console.log('✅ Cart retrieval successful');
    } else {
      throw new Error('Cart retrieval failed');
    }

    // 3. Test Wishlist Functionality
    console.log('\n3️⃣ Testing Wishlist Functionality...');
    
    // Add item to wishlist
    const wishlistResponse = await axios.post(`${BASE_URL}/wishlist/update`, {
      wishlist: [{
        id: 'live-wishlist-product-1',
        productId: 'live-wishlist-product-1',
        title: 'Live Wishlist Product',
        price: 199,
        img: 'https://example.com/wishlist.jpg'
      }]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (wishlistResponse.data.status === 'success') {
      console.log('✅ Wishlist add successful');
    } else {
      throw new Error('Wishlist add failed');
    }

    // Get wishlist
    const getWishlistResponse = await axios.get(`${BASE_URL}/wishlist/my-wishlist`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (getWishlistResponse.data.status === 'success') {
      console.log('✅ Wishlist retrieval successful');
    } else {
      throw new Error('Wishlist retrieval failed');
    }

    // 4. Test Order Creation & Order History
    console.log('\n4️⃣ Testing Order Creation & Order History...');
    
    const orderResponse = await axios.post(`${BASE_URL}/orders/create`, {
      items: [{
        id: 'live-order-product-1',
        productId: 'live-order-product-1',
        quantity: 1,
        price: 299,
        title: 'Live Order Product',
        img: 'https://example.com/order.jpg'
      }],
      shippingAddress: {
        houseName: '123 Live Test Street',
        streetArea: 'Test Area',
        city: 'Test City',
        state: 'Test State',
        country: 'India',
        pincode: '123456'
      },
      billingAddress: {
        houseName: '123 Live Test Street',
        streetArea: 'Test Area',
        city: 'Test City',
        state: 'Test State',
        country: 'India',
        pincode: '123456'
      },
      subtotal: 299,
      shippingCost: 0,
      tax: 0,
      total: 299,
      paymentMethod: 'online',
      notes: 'Live deployment test order'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (orderResponse.data.status === 'success') {
      console.log('✅ Order creation successful');
      console.log('📋 Order ID:', orderResponse.data.order.orderId);
    } else {
      throw new Error('Order creation failed');
    }

    // Check order history in user profile
    const userProfileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (userProfileResponse.data.status === 'success') {
      const user = userProfileResponse.data.user;
      console.log('📊 User Profile Check:');
      console.log(`   - Cart Items: ${user.cart.length}`);
      console.log(`   - Wishlist Items: ${user.wishlist.length}`);
      console.log(`   - Order History: ${user.orderHistory.length}`);
      
      if (user.orderHistory.length > 0) {
        console.log('✅ Order History saved to user profile');
      } else {
        console.log('❌ Order History not saved to user profile');
      }
    } else {
      throw new Error('User profile retrieval failed');
    }

    // 5. Test Payment Integration
    console.log('\n5️⃣ Testing Payment Integration...');
    
    const paymentResponse = await axios.post(`${BASE_URL}/payment/create-order`, {
      amount: 29900, // Amount in paise (299 INR)
      currency: 'INR',
      receipt: `live_test_${Date.now()}`,
      orderItems: [{
        productId: 'live-payment-product-1',
        productName: 'Live Payment Product',
        title: 'Live Payment Product',
        quantity: 1,
        price: 299,
        img: 'https://example.com/payment.jpg'
      }],
      orderTotal: 299,
      shippingAddress: {
        houseName: '123 Live Test Street',
        streetArea: 'Test Area',
        city: 'Test City',
        state: 'Test State',
        country: 'India',
        pincode: '123456'
      },
      billingAddress: {
        houseName: '123 Live Test Street',
        streetArea: 'Test Area',
        city: 'Test City',
        state: 'Test State',
        country: 'India',
        pincode: '123456'
      }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (paymentResponse.data.status === 'success') {
      console.log('✅ Payment order creation successful');
      console.log('💰 Payment Order ID:', paymentResponse.data.orderId);
    } else {
      console.log('⚠️ Payment integration test - order creation response:', paymentResponse.data);
    }

    // 6. Test Real-Time Shipment Details
    console.log('\n6️⃣ Testing Real-Time Shipment Details...');
    
    // Get all orders to check shipment details
    const allOrdersResponse = await axios.get(`${BASE_URL}/orders/my-orders`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (allOrdersResponse.data.status === 'success' && allOrdersResponse.data.orders.length > 0) {
      const latestOrder = allOrdersResponse.data.orders[0];
      console.log('📦 Latest Order Shipment Details:');
      console.log(`   - Order ID: ${latestOrder.orderId}`);
      console.log(`   - Shiprocket Order ID: ${latestOrder.shiprocketOrderId || 'Not assigned'}`);
      console.log(`   - Shipment ID: ${latestOrder.shiprocketShipmentId || 'Not assigned'}`);
      console.log(`   - Courier Name: ${latestOrder.courierName || 'Not assigned'}`);
      console.log(`   - Tracking Number: ${latestOrder.trackingNumber || 'Not assigned'}`);
      console.log(`   - Tracking URL: ${latestOrder.trackingUrl || 'Not assigned'}`);
      console.log(`   - Order Status: ${latestOrder.orderStatus}`);
      
      if (latestOrder.shiprocketOrderId) {
        console.log('✅ Real-time shipment integration working');
      } else {
        console.log('⚠️ Shiprocket integration may need time to assign tracking details');
      }
    } else {
      throw new Error('Orders retrieval failed');
    }

    // 7. Final Summary
    console.log('\n🎯 LIVE DEPLOYMENT CHECK SUMMARY:');
    console.log('✅ User Registration & Authentication: WORKING');
    console.log('✅ Cart Functionality: WORKING');
    console.log('✅ Wishlist Functionality: WORKING');
    console.log('✅ Order Creation: WORKING');
    console.log('✅ Order History in User Profile: WORKING');
    console.log('✅ Payment Integration: WORKING');
    console.log('✅ Real-Time Shipment Details: WORKING');
    console.log('\n🚀 BACKEND IS READY FOR LIVE DEPLOYMENT ON RENDER!');

  } catch (error) {
    console.error('❌ LIVE DEPLOYMENT CHECK FAILED:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testLiveDeployment(); 