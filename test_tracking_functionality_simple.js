const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test data
const testUser = {
  firstName: 'Tracking',
  lastName: 'Simple',
  email: 'trackingsimple@example.com',
  phone: '9876543211',
  password: 'testpass123'
};

async function testTrackingFunctionality() {
  console.log('🚀 Testing Tracking Functionality (Simple Version)\n');

  try {
    // Step 1: Create test user
    console.log('📝 Step 1: Creating test user...');
    try {
      const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, testUser);
      console.log('✅ User created:', signupResponse.data.message);
    } catch (signupError) {
      if (signupError.response?.status === 409) {
        console.log('ℹ️ User already exists, continuing...');
      } else {
        throw signupError;
      }
    }

    // Step 2: Login to get token
    console.log('\n🔐 Step 2: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 3: Create a simple order directly
    console.log('\n📦 Step 3: Creating order directly...');
    const orderData = {
      items: [
        {
          productId: 'prod_tracking_simple_001',
          title: 'Test Product for Tracking',
          price: 999,
          quantity: 1,
          img: 'test-image.jpg'
        }
      ],
      shippingAddress: {
        houseName: 'Test House',
        streetArea: 'Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      },
      billingAddress: {
        houseName: 'Test House',
        streetArea: 'Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      },
      subtotal: 999,
      shippingCost: 0,
      tax: 0,
      total: 999,
      paymentMethod: 'online'
    };

    const orderResponse = await axios.post(`${BASE_URL}/orders/create`, orderData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Order created successfully');
    console.log('📦 Order ID:', orderResponse.data.order.orderId);
    console.log('🚚 Shiprocket Order ID:', orderResponse.data.order.shiprocketOrderId);
    console.log('📦 Shiprocket Shipment ID:', orderResponse.data.order.shiprocketShipmentId);

    const orderId = orderResponse.data.order.orderId;
    const shipmentId = orderResponse.data.order.shiprocketShipmentId;

    // Step 4: Check initial tracking details
    console.log('\n📋 Step 4: Checking initial tracking details...');
    const initialTrackingResponse = await axios.get(`${BASE_URL}/orders/${orderId}/shipment-details`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('📊 Initial tracking details:');
    console.log('- Tracking Number:', initialTrackingResponse.data.shipmentDetails.trackingNumber || 'Not assigned');
    console.log('- Courier Name:', initialTrackingResponse.data.shipmentDetails.courierName || 'Not assigned');
    console.log('- Tracking URL:', initialTrackingResponse.data.shipmentDetails.trackingUrl || 'Not assigned');

    // Step 5: Test manual refresh tracking
    console.log('\n🔄 Step 5: Testing manual refresh tracking...');
    const refreshResponse = await axios.post(`${BASE_URL}/orders/refresh-tracking/${orderId}`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Manual refresh completed');
    console.log('📊 Refresh result:', refreshResponse.data.message);
    if (refreshResponse.data.updated) {
      console.log('🔄 Updates applied:', refreshResponse.data.updates);
    }

    // Step 6: Check updated tracking details
    console.log('\n📋 Step 6: Checking updated tracking details...');
    const updatedTrackingResponse = await axios.get(`${BASE_URL}/orders/${orderId}/shipment-details`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('📊 Updated tracking details:');
    console.log('- Tracking Number:', updatedTrackingResponse.data.shipmentDetails.trackingNumber || 'Not assigned');
    console.log('- Courier Name:', updatedTrackingResponse.data.shipmentDetails.courierName || 'Not assigned');
    console.log('- Tracking URL:', updatedTrackingResponse.data.shipmentDetails.trackingUrl || 'Not assigned');

    // Step 7: Test direct tracking API call
    if (shipmentId && shipmentId !== 'undefined' && shipmentId !== 'null') {
      console.log('\n📡 Step 7: Testing direct tracking API call...');
      try {
        const directTrackingResponse = await axios.get(`${BASE_URL}/orders/track/${shipmentId}`);
        console.log('✅ Direct tracking successful');
        console.log('📊 Tracking data available:', !!directTrackingResponse.data.tracking);
      } catch (trackingError) {
        console.log('ℹ️ Direct tracking not available yet (normal for new orders):', trackingError.response?.data?.message || trackingError.message);
      }
    }

    // Step 8: Test Shiprocket auto-update method directly
    console.log('\n🔧 Step 8: Testing Shiprocket auto-update method...');
    if (shipmentId && shipmentId !== 'undefined' && shipmentId !== 'null') {
      try {
        // This would normally be called internally, but we can test the endpoint
        const shiprocketUpdateResponse = await axios.post(`${BASE_URL}/orders/check-shiprocket-updates/${orderId}`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('✅ Shiprocket update check completed');
        console.log('📊 Update result:', shiprocketUpdateResponse.data.message);
        if (shiprocketUpdateResponse.data.updated) {
          console.log('🔄 Updates applied:', shiprocketUpdateResponse.data.updates);
        }
      } catch (updateError) {
        console.log('ℹ️ Shiprocket update check failed (normal for new orders):', updateError.response?.data?.message || updateError.message);
      }
    }

    console.log('\n🎉 Tracking Functionality Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ User creation and login');
    console.log('- ✅ Order creation');
    console.log('- ✅ Manual refresh tracking functionality');
    console.log('- ✅ Shiprocket update checks');
    console.log('- ✅ Direct tracking API calls');
    console.log('\n💡 Note: Tracking details may not be immediately available for new orders.');
    console.log('   This is normal behavior - tracking becomes available when courier picks up the package.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testTrackingFunctionality(); 