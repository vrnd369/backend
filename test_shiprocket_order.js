const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function testShiprocketOrder() {
  try {
    console.log('🚀 Testing Shiprocket Order Creation...\n');

    // Step 1: Authenticate with Shiprocket
    console.log('1. Authenticating with Shiprocket...');
    
    const authResponse = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD
    });

    const token = authResponse.data.token;
    console.log('✅ Authentication successful');

    // Step 2: Create order in Shiprocket
    console.log('\n2. Creating order in Shiprocket...');
    
    const orderData = {
      order_id: 'TEST_ORDER_' + Date.now(),
      order_date: new Date().toISOString().split('T')[0],
      pickup_location: 'warehouse', // Use the correct pickup location
      billing_customer_name: 'Test Customer',
      billing_last_name: 'Test',
      billing_address: 'Test Address',
      billing_address_2: 'Test Address 2',
      billing_city: 'Test City',
      billing_pincode: '123456',
      billing_state: 'Test State',
      billing_country: 'India',
      billing_email: 'test@example.com',
      billing_phone: '1234567890',
      shipping_customer_name: 'Test Customer',
      shipping_last_name: 'Test',
      shipping_address: 'Test Address',
      shipping_address_2: 'Test Address 2',
      shipping_city: 'Test City',
      shipping_pincode: '123456',
      shipping_state: 'Test State',
      shipping_country: 'India',
      shipping_email: 'test@example.com',
      shipping_phone: '1234567890',
      order_items: [
        {
          name: 'Test Product',
          sku: 'TEST001',
          units: 1,
          selling_price: 1000,
          discount: 0,
          tax: 0
        }
      ],
      sub_total: 1000,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
      payment_method: 'Prepaid',
      shipping_is_billing: true
    };

    console.log('Order data:', JSON.stringify(orderData, null, 2));

    const orderResponse = await axios.post('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order creation successful');
    console.log('Response status:', orderResponse.status);
    console.log('Response data:', JSON.stringify(orderResponse.data, null, 2));

    if (orderResponse.data.data) {
      console.log('\n📦 Order Details:');
      console.log('Order ID:', orderResponse.data.data.order_id);
      console.log('Shipment ID:', orderResponse.data.data.shipment_id);
      console.log('Courier:', orderResponse.data.data.courier_name);
      console.log('AWB Code:', orderResponse.data.data.awb_code);
      console.log('Tracking URL:', orderResponse.data.data.tracking_url);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testShiprocketOrder(); 