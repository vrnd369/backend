const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testNavbarFields() {
  try {
    console.log('Testing profile endpoints for navbar address fields...\n');

    // Test data with all address fields
    const testUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.navbar@example.com',
      password: 'testpassword123',
      phone: '1234567890',
      houseName: 'Navbar House',
      streetArea: 'Navbar Street',
      city: 'Navbar City',
      state: 'Navbar State',
      country: 'Navbar Country',
      pincode: '123456'
    };

    // 1. Create test user
    console.log('1. Creating test user...');
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, testUserData);
    console.log('✅ Signup successful');
    
    const userId = signupResponse.data.user._id;
    console.log('User ID:', userId);

    // 2. Test GET profile endpoint
    console.log('\n2. Testing GET /auth/profile/:userId...');
    const getProfileResponse = await axios.get(`${BASE_URL}/auth/profile/${userId}`);
    const user = getProfileResponse.data.user;
    
    console.log('✅ GET profile successful');
    console.log('Navbar fields found:');
    console.log('- firstName:', user.firstName);
    console.log('- city:', user.city);
    console.log('- pincode:', user.pincode);
    console.log('- houseName:', user.houseName);
    console.log('- streetArea:', user.streetArea);
    console.log('- state:', user.state);
    console.log('- country:', user.country);

    // 3. Verify all required fields are present
    const requiredFields = ['firstName', 'city', 'pincode', 'houseName', 'streetArea', 'state', 'country'];
    const missingFields = requiredFields.filter(field => !user[field] || user[field] === '');
    
    if (missingFields.length === 0) {
      console.log('\n✅ SUCCESS: All navbar fields are present and populated!');
      console.log('Frontend navbar can now display:');
      console.log(`- "Deliver to ${user.firstName}"`);
      console.log(`- "${user.city}, ${user.pincode}"`);
    } else {
      console.log('\n❌ FAILED: Missing or empty fields:', missingFields);
    }

    // 4. Test PUT profile endpoint
    console.log('\n3. Testing PUT /auth/profile/:userId...');
    const updateData = {
      firstName: 'John Updated',
      lastName: 'Doe Updated',
      email: 'john.navbar@example.com',
      phone: '9876543210',
      houseName: 'Updated Navbar House',
      streetArea: 'Updated Navbar Street',
      city: 'Updated Navbar City',
      state: 'Updated Navbar State',
      country: 'Updated Navbar Country',
      pincode: '654321'
    };

    const updateResponse = await axios.put(`${BASE_URL}/auth/profile/${userId}`, updateData);
    const updatedUser = updateResponse.data.user;
    
    console.log('✅ PUT profile successful');
    console.log('Updated navbar fields:');
    console.log('- firstName:', updatedUser.firstName);
    console.log('- city:', updatedUser.city);
    console.log('- pincode:', updatedUser.pincode);

    // 5. Final verification
    if (updatedUser.firstName === 'John Updated' && updatedUser.city === 'Updated Navbar City') {
      console.log('\n✅ SUCCESS: Profile update works correctly with flat address fields!');
    } else {
      console.log('\n❌ FAILED: Profile update did not work correctly');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testNavbarFields(); 