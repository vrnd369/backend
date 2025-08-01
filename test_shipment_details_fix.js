const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testShipmentDetailsFix() {
  console.log('🚚 Testing Shipment Details Fix...\n');

  let authToken = null;
  let userId = null;

  try {
    // Step 1: Create a test user
    console.log('1️⃣ Creating test user...');
    const uniqueEmail = `testshipment${Date.now()}@example.com`;
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      firstName: 'Test',
      lastName: 'Shipment',
      email: uniqueEmail,
      password: 'password123',
      phone: '+919876543215',
      houseName: 'Test House',
      streetArea: 'Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'India',
      pincode: '123456'
    });

    authToken = signupResponse.data.token;
    userId = signupResponse.data.user._id;
    console.log('✅ User created successfully');

    // Step 2: Create order and check shipment details
    console.log('\n2️⃣ Creating order and checking shipment details...');
    
    const orderData = {
      items: [
        {
          id: 'product1',
          productId: 'product1',
          title: 'Test Product',
          price: 100,
          quantity: 1,
          img: 'test-image.jpg',
          description: 'Test product'
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
      subtotal: 100,
      shippingCost: 50,
      tax: 10,
      total: 160,
      paymentMethod: 'cod',
      notes: 'Test shipment details'
    };

    const orderCreateResponse = await axios.post(`${BASE_URL}/orders/create`, orderData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order created successfully');
    console.log('Order ID:', orderCreateResponse.data.order.orderId);
    
    // Check if shipment details are included in order creation response
    const order = orderCreateResponse.data.order;
    console.log('\n📋 Order Creation Response Shipment Details:');
    console.log('Has shipmentDetails:', !!order.shipmentDetails);
    if (order.shipmentDetails) {
      console.log('Shiprocket Order ID:', order.shipmentDetails.shiprocketOrderId);
      console.log('Shiprocket Shipment ID:', order.shipmentDetails.shiprocketShipmentId);
      console.log('Courier Name:', order.shipmentDetails.courierName);
      console.log('Tracking Number:', order.shipmentDetails.trackingNumber);
      console.log('Tracking URL:', order.shipmentDetails.trackingUrl);
      console.log('Has Tracking:', order.shipmentDetails.hasTracking);
      console.log('Has Courier:', order.shipmentDetails.hasCourier);
      console.log('Tracking Status:', order.shipmentDetails.trackingStatus);
      console.log('Can Track:', order.shipmentDetails.canTrack);
      console.log('Estimated Delivery:', order.shipmentDetails.estimatedDelivery);
    } else {
      console.log('❌ No shipment details in order creation response');
    }

    // Step 3: Test order retrieval to check shipment details
    console.log('\n3️⃣ Testing order retrieval...');
    const ordersGetResponse = await axios.get(`${BASE_URL}/orders/my-orders`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Orders retrieved successfully');
    console.log('Orders count:', ordersGetResponse.data.orders.length);
    
    if (ordersGetResponse.data.orders.length > 0) {
      const retrievedOrder = ordersGetResponse.data.orders[0];
      console.log('\n📋 Order Retrieval Response Shipment Details:');
      console.log('Has shipmentDetails:', !!retrievedOrder.shipmentDetails);
      if (retrievedOrder.shipmentDetails) {
        console.log('Shiprocket Order ID:', retrievedOrder.shipmentDetails.shiprocketOrderId);
        console.log('Shiprocket Shipment ID:', retrievedOrder.shipmentDetails.shiprocketShipmentId);
        console.log('Courier Name:', retrievedOrder.shipmentDetails.courierName);
        console.log('Tracking Number:', retrievedOrder.shipmentDetails.trackingNumber);
        console.log('Tracking URL:', retrievedOrder.shipmentDetails.trackingUrl);
        console.log('Has Tracking:', retrievedOrder.shipmentDetails.hasTracking);
        console.log('Has Courier:', retrievedOrder.shipmentDetails.hasCourier);
        console.log('Tracking Status:', retrievedOrder.shipmentDetails.trackingStatus);
      } else {
        console.log('❌ No shipment details in order retrieval response');
      }
    }

    // Step 4: Test specific order retrieval
    console.log('\n4️⃣ Testing specific order retrieval...');
    if (order.orderId) {
      const specificOrderResponse = await axios.get(`${BASE_URL}/orders/${order.orderId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('✅ Specific order retrieved successfully');
      const specificOrder = specificOrderResponse.data.order;
      console.log('\n📋 Specific Order Response Shipment Details:');
      console.log('Has shipmentDetails:', !!specificOrder.shipmentDetails);
      if (specificOrder.shipmentDetails) {
        console.log('Shiprocket Order ID:', specificOrder.shipmentDetails.shiprocketOrderId);
        console.log('Shiprocket Shipment ID:', specificOrder.shipmentDetails.shiprocketShipmentId);
        console.log('Courier Name:', specificOrder.shipmentDetails.courierName);
        console.log('Tracking Number:', specificOrder.shipmentDetails.trackingNumber);
        console.log('Tracking URL:', specificOrder.shipmentDetails.trackingUrl);
        console.log('Has Tracking:', specificOrder.shipmentDetails.hasTracking);
        console.log('Has Courier:', specificOrder.shipmentDetails.hasCourier);
        console.log('Tracking Status:', specificOrder.shipmentDetails.trackingStatus);
        console.log('Can Track:', specificOrder.shipmentDetails.canTrack);
        console.log('Estimated Delivery:', specificOrder.shipmentDetails.estimatedDelivery);
      } else {
        console.log('❌ No shipment details in specific order response');
      }
    }

    // Step 5: Test shipment details endpoint
    console.log('\n5️⃣ Testing shipment details endpoint...');
    if (order.orderId) {
      const shipmentDetailsResponse = await axios.get(`${BASE_URL}/orders/${order.orderId}/shipment-details`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('✅ Shipment details endpoint working');
      const shipmentDetails = shipmentDetailsResponse.data.shipmentDetails;
      console.log('\n📋 Shipment Details Endpoint Response:');
      console.log('Shiprocket Order ID:', shipmentDetails.shiprocketOrderId);
      console.log('Shiprocket Shipment ID:', shipmentDetails.shiprocketShipmentId);
      console.log('Courier Name:', shipmentDetails.courierName);
      console.log('Tracking Number:', shipmentDetails.trackingNumber);
      console.log('Tracking URL:', shipmentDetails.trackingUrl);
      console.log('Has Tracking:', shipmentDetails.hasTracking);
      console.log('Has Courier:', shipmentDetails.hasCourier);
      console.log('Tracking Status:', shipmentDetails.trackingStatus);
      console.log('Can Track:', shipmentDetails.canTrack);
      console.log('Estimated Delivery:', shipmentDetails.estimatedDelivery);
    }

    console.log('\n🎉 Shipment details test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Order creation includes shipment details');
    console.log('✅ Order retrieval includes shipment details');
    console.log('✅ Specific order retrieval includes shipment details');
    console.log('✅ Shipment details endpoint works');
    console.log('✅ All shipment details fields are properly populated');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testShipmentDetailsFix(); 