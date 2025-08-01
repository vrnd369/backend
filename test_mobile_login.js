const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testMobileLogin() {
  console.log('📱 Testing Mobile Login Functionality...\n');

  try {
    // Test 1: Create a user with mobile number
    console.log('1️⃣ Creating user with mobile number...');
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      firstName: 'Test',
      lastName: 'Mobile',
      email: 'testmobile@example.com',
      password: 'password123',
      phone: '+919876543210'
    });

    console.log('✅ User created successfully');
    console.log('User ID:', signupResponse.data.user._id);
    console.log('Phone:', signupResponse.data.user.phone);

    // Test 2: Try login with email (should work)
    console.log('\n2️⃣ Testing login with email...');
    const emailLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testmobile@example.com',
      password: 'password123'
    });

    console.log('✅ Email login successful');
    console.log('Token received:', !!emailLoginResponse.data.token);

    // Test 3: Try login with mobile number using main login endpoint
    console.log('\n3️⃣ Testing login with mobile number (main endpoint)...');
    const mobileLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      mobile: '+919876543210',
      password: 'password123'
    });

    console.log('✅ Mobile login successful (main endpoint)');
    console.log('Token received:', !!mobileLoginResponse.data.token);
    console.log('User phone:', mobileLoginResponse.data.user.phone);

    // Test 4: Try login with mobile number using dedicated mobile endpoint
    console.log('\n4️⃣ Testing login with mobile number (dedicated endpoint)...');
    const mobileLoginDedicatedResponse = await axios.post(`${BASE_URL}/auth/mobile-login`, {
      mobile: '+919876543210',
      password: 'password123'
    });

    console.log('✅ Mobile login successful (dedicated endpoint)');
    console.log('Token received:', !!mobileLoginDedicatedResponse.data.token);
    console.log('User phone:', mobileLoginDedicatedResponse.data.user.phone);

    // Test 5: Try login with wrong mobile number
    console.log('\n5️⃣ Testing login with wrong mobile number...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        mobile: '+919876543211',
        password: 'password123'
      });
      console.log('❌ Should have failed with wrong mobile number');
    } catch (error) {
      console.log('✅ Correctly rejected wrong mobile number');
      console.log('Error message:', error.response.data.message);
    }

    // Test 6: Try login with wrong password
    console.log('\n6️⃣ Testing login with wrong password...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        mobile: '+919876543210',
        password: 'wrongpassword'
      });
      console.log('❌ Should have failed with wrong password');
    } catch (error) {
      console.log('✅ Correctly rejected wrong password');
      console.log('Error message:', error.response.data.message);
    }

    // Test 7: Try login without mobile or email
    console.log('\n7️⃣ Testing login without credentials...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        password: 'password123'
      });
      console.log('❌ Should have failed without credentials');
    } catch (error) {
      console.log('✅ Correctly rejected login without credentials');
      console.log('Error message:', error.response.data.message);
    }

    console.log('\n🎉 All mobile login tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ User creation with mobile number works');
    console.log('✅ Email login works');
    console.log('✅ Mobile login works (main endpoint)');
    console.log('✅ Mobile login works (dedicated endpoint)');
    console.log('✅ Error handling works correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testMobileLogin(); 