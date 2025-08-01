const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testProfileUpdate() {
  try {
    console.log('Testing profile update with flat address fields...\n');

    // First, let's create a test user or get an existing one
    const testUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'testpassword123',
      phone: '1234567890',
      houseName: 'Test House',
      streetArea: 'Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      pincode: '123456'
    };

    // Try to signup first
    console.log('1. Creating test user...');
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, testUserData);
    console.log('Signup response:', signupResponse.data);

    const userId = signupResponse.data.user._id;
    console.log('User ID:', userId);

    // Test profile update with flat address fields
    console.log('\n2. Testing profile update with flat address fields...');
    const updateData = {
      firstName: 'John Updated',
      lastName: 'Doe Updated',
      email: 'john.doe@example.com',
      phone: '9876543210',
      houseName: 'Updated House',
      streetArea: 'Updated Street',
      city: 'Updated City',
      state: 'Updated State',
      country: 'Updated Country',
      pincode: '654321'
    };

    const updateResponse = await axios.put(`${BASE_URL}/auth/profile/${userId}`, updateData);
    console.log('Update response:', JSON.stringify(updateResponse.data, null, 2));

    // Verify the update worked by fetching the profile
    console.log('\n3. Fetching updated profile...');
    const getResponse = await axios.get(`${BASE_URL}/auth/profile/${userId}`);
    console.log('Get profile response:', JSON.stringify(getResponse.data, null, 2));

    // Check if address fields are properly saved
    const user = getResponse.data.user;
    console.log('\n4. Verifying address fields...');
    console.log('Shipping Address:', user.shippingAddress);
    console.log('Billing Address:', user.billingAddress);

    if (user.shippingAddress && user.shippingAddress.houseName === 'Updated House') {
      console.log('✅ SUCCESS: Address fields are properly saved!');
    } else {
      console.log('❌ FAILED: Address fields are not properly saved!');
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Run the test
testProfileUpdate(); 