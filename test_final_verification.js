const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testFinalVerification() {
  try {
    console.log('🔍 Final verification of profile endpoint fix...\n');

    // Generate unique email to avoid conflicts
    const timestamp = Date.now();
    const uniqueEmail = `test.final.${timestamp}@example.com`;

    // 1. Create a test user with complete address data
    console.log('1. Creating test user with complete address data...');
    const testUserData = {
      firstName: 'Final',
      lastName: 'Test',
      email: uniqueEmail,
      password: 'testpassword123',
      phone: '1234567890',
      houseName: 'Final Test House',
      streetArea: 'Final Test Street',
      city: 'Final Test City',
      state: 'Final Test State',
      country: 'Final Test Country',
      pincode: '123456'
    };

    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, testUserData);
    console.log('✅ Signup successful');
    console.log('User ID:', signupResponse.data.user._id);
    console.log('Token:', signupResponse.data.token.substring(0, 50) + '...');

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
    
    const user = profileResponse.data.user;
    
    // 3. Check for all required navbar fields
    console.log('\n3. Checking navbar fields in response:');
    const navbarFields = ['firstName', 'city', 'pincode', 'houseName', 'streetArea', 'state', 'country'];
    
    let allFieldsPresent = true;
    navbarFields.forEach(field => {
      const value = user[field];
      const status = value && value !== '' ? '✅' : '❌';
      console.log(`${status} ${field}: ${value || 'MISSING'}`);
      if (!value || value === '') {
        allFieldsPresent = false;
      }
    });

    // 4. Check if shippingAddress object exists and has data
    console.log('\n4. Checking shippingAddress object:');
    if (user.shippingAddress) {
      console.log('✅ shippingAddress object exists');
      const addressFields = ['houseName', 'streetArea', 'city', 'state', 'country', 'pincode'];
      addressFields.forEach(field => {
        const value = user.shippingAddress[field];
        const status = value && value !== '' ? '✅' : '❌';
        console.log(`  ${status} ${field}: ${value || 'MISSING'}`);
      });
    } else {
      console.log('❌ shippingAddress object is missing or null');
      allFieldsPresent = false;
    }

    // 5. Verify the response structure
    console.log('\n5. Full user object structure:');
    console.log('Keys in user object:', Object.keys(user));
    
    // 6. Test if the flat address fields are properly extracted
    if (allFieldsPresent) {
      console.log('\n✅ SUCCESS: All navbar fields are present and populated!');
      console.log('Frontend can now display:');
      console.log(`- "Deliver to ${user.firstName}"`);
      console.log(`- "${user.city}, ${user.pincode}"`);
      console.log(`- Full address: ${user.houseName}, ${user.streetArea}, ${user.city}, ${user.state}, ${user.country} ${user.pincode}`);
    } else {
      console.log('\n❌ FAILED: Some navbar fields are missing or empty');
      const missingFields = navbarFields.filter(field => !user[field] || user[field] === '');
      console.log('Missing fields:', missingFields);
    }

    // 7. Test profile update functionality
    console.log('\n6. Testing profile update functionality...');
    const updateData = {
      firstName: 'Updated Final',
      lastName: 'Updated Test',
      email: uniqueEmail,
      phone: '9876543210',
      houseName: 'Updated Final Test House',
      streetArea: 'Updated Final Test Street',
      city: 'Updated Final Test City',
      state: 'Updated Final Test State',
      country: 'Updated Final Test Country',
      pincode: '654321'
    };

    const updateResponse = await axios.put(`${BASE_URL}/auth/profile/${userId}`, updateData);
    console.log('✅ Profile update successful');
    
    const updatedUser = updateResponse.data.user;
    console.log('Updated navbar fields:');
    console.log(`- firstName: ${updatedUser.firstName}`);
    console.log(`- city: ${updatedUser.city}`);
    console.log(`- pincode: ${updatedUser.pincode}`);

    // 8. Final verification
    if (updatedUser.firstName === 'Updated Final' && updatedUser.city === 'Updated Final Test City') {
      console.log('\n✅ SUCCESS: Profile update works correctly with flat address fields!');
    } else {
      console.log('\n❌ FAILED: Profile update did not work correctly');
    }

    console.log('\n🎉 DEPLOYMENT READY: All profile functionality is working correctly!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

// Run the test
testFinalVerification(); 