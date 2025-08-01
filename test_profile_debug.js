const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testProfileEndpoint() {
  try {
    console.log('🔍 Testing /auth/profile endpoint for navbar address fields...\n');

    // 1. First, let's create a test user with complete address data
    console.log('1. Creating test user with complete address data...');
    const testUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.profile@example.com',
      password: 'testpassword123',
      phone: '1234567890',
      houseName: 'Test House',
      streetArea: 'Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      pincode: '123456'
    };

    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, testUserData);
    console.log('✅ Signup successful');
    console.log('User ID:', signupResponse.data.user._id);
    console.log('Token:', signupResponse.data.token);

    const token = signupResponse.data.token;
    const userId = signupResponse.data.user._id;

    // 2. Test the /auth/profile endpoint with JWT token
    console.log('\n2. Testing GET /auth/profile with JWT token...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Profile request successful');
    console.log('Response status:', profileResponse.status);
    console.log('Response data:', JSON.stringify(profileResponse.data, null, 2));

    const user = profileResponse.data.user;
    
    // 3. Check for all required navbar fields
    console.log('\n3. Checking navbar fields in response:');
    const navbarFields = ['firstName', 'city', 'pincode', 'houseName', 'streetArea', 'state', 'country'];
    
    navbarFields.forEach(field => {
      const value = user[field];
      const status = value && value !== '' ? '✅' : '❌';
      console.log(`${status} ${field}: ${value || 'MISSING'}`);
    });

    // 4. Check if shippingAddress object exists
    console.log('\n4. Checking shippingAddress object:');
    if (user.shippingAddress) {
      console.log('✅ shippingAddress object exists:', JSON.stringify(user.shippingAddress, null, 2));
    } else {
      console.log('❌ shippingAddress object is missing or null');
    }

    // 5. Verify the response structure
    console.log('\n5. Full user object structure:');
    console.log('Keys in user object:', Object.keys(user));
    
    // 6. Test if the flat address fields are properly extracted
    const hasAllNavbarFields = navbarFields.every(field => user[field] && user[field] !== '');
    if (hasAllNavbarFields) {
      console.log('\n✅ SUCCESS: All navbar fields are present and populated!');
      console.log('Frontend can now display:');
      console.log(`- "Deliver to ${user.firstName}"`);
      console.log(`- "${user.city}, ${user.pincode}"`);
    } else {
      console.log('\n❌ FAILED: Some navbar fields are missing or empty');
      const missingFields = navbarFields.filter(field => !user[field] || user[field] === '');
      console.log('Missing fields:', missingFields);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

// Run the test
testProfileEndpoint(); 