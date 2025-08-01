const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function testShiprocketDebug() {
  try {
    console.log('🔍 Debugging Shiprocket Integration...\n');

    // Test 1: Check if environment variables are loaded
    console.log('1. Checking environment variables...');
    console.log('SHIPROCKET_EMAIL:', process.env.SHIPROCKET_EMAIL ? 'SET' : 'NOT SET');
    console.log('SHIPROCKET_PASSWORD:', process.env.SHIPROCKET_PASSWORD ? 'SET' : 'NOT SET');

    // Test 2: Test direct Shiprocket API call
    console.log('\n2. Testing direct Shiprocket API authentication...');
    
    const authData = {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD
    };

    console.log('Auth data:', {
      email: authData.email,
      password: authData.password ? '***SET***' : 'NOT SET'
    });

    try {
      const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', authData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Direct Shiprocket authentication successful');
      console.log('Response status:', response.status);
      console.log('Token received:', response.data.token ? 'YES' : 'NO');

      if (response.data.token) {
        // Test 3: Test courier list with token
        console.log('\n3. Testing courier list with token...');
        
        const courierResponse = await axios.get('https://apiv2.shiprocket.in/v1/external/courier/courierList', {
          headers: {
            'Authorization': `Bearer ${response.data.token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Courier list successful');
        console.log('Response status:', courierResponse.status);
        console.log('Couriers available:', courierResponse.data.data?.length || 0);

        // Test 4: Test order creation endpoint
        console.log('\n4. Testing order creation endpoint...');
        
        const orderData = {
          order_id: 'TEST_ORDER_' + Date.now(),
          order_date: new Date().toISOString().split('T')[0],
          pickup_location: 'Primary',
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
          weight: 0.5
        };

        const orderResponse = await axios.post('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', orderData, {
          headers: {
            'Authorization': `Bearer ${response.data.token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Order creation successful');
        console.log('Response status:', orderResponse.status);
        console.log('Order ID:', orderResponse.data.data?.order_id);
        console.log('Shipment ID:', orderResponse.data.data?.shipment_id);

      }

    } catch (authError) {
      console.error('❌ Direct Shiprocket authentication failed');
      console.error('Error status:', authError.response?.status);
      console.error('Error data:', authError.response?.data);
      console.error('Error message:', authError.message);
    }

  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the debug test
testShiprocketDebug(); 