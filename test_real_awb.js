const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function testRealAWB() {
  try {
    console.log('🚀 Testing Real AWB Generation...\n');

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
      pickup_location: 'warehouse',
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

    const orderResponse = await axios.post('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order creation successful');
    console.log('Response data:', JSON.stringify(orderResponse.data, null, 2));

    if (orderResponse.data.data) {
      const orderDetails = orderResponse.data.data;
      console.log('\n📦 Order Details:');
      console.log('Order ID:', orderDetails.order_id);
      console.log('Shipment ID:', orderDetails.shipment_id);
      console.log('Status:', orderDetails.status);
      console.log('AWB Code:', orderDetails.awb_code);
      console.log('Courier Company ID:', orderDetails.courier_company_id);
      console.log('Courier Name:', orderDetails.courier_name);
      
      // Check if AWB is real or empty
      if (orderDetails.awb_code && orderDetails.awb_code !== '') {
        console.log('✅ REAL AWB CODE FOUND:', orderDetails.awb_code);
        console.log('✅ This AWB should work in tracking system');
      } else {
        console.log('⚠️ AWB CODE IS EMPTY - This is normal for new orders');
        console.log('ℹ️ AWB will be assigned when courier picks up the package');
      }
      
      // Check courier assignment
      if (orderDetails.courier_company_id && orderDetails.courier_company_id !== '') {
        console.log('✅ COURIER ASSIGNED:', orderDetails.courier_name);
      } else {
        console.log('⚠️ COURIER NOT ASSIGNED YET - This is normal for new orders');
      }
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
testRealAWB(); 