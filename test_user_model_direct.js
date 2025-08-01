require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testUserModelDirect() {
  try {
    console.log('🔍 Testing User Model Direct Update...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    // Find a test user
    const testUser = await User.findOne();
    if (!testUser) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log('👤 Found test user:', testUser._id);
    console.log('📊 Current order history count:', testUser.orderHistory.length);
    
    // Create a test order history entry
    const testOrderEntry = {
      orderId: 'TEST-ORDER-' + Date.now(),
      orderDate: new Date(),
      orderAmount: 999,
      orderStatus: 'confirmed',
      paymentStatus: 'pending',
      paymentMethod: 'online',
      items: [{
        productId: 'test-product-1',
        productName: 'Test Product',
        quantity: 1,
        price: 999,
        img: 'https://example.com/test.jpg'
      }]
    };
    
    console.log('📋 Test order entry:', testOrderEntry);
    
    // Try to update user with new order history entry
    const updatedUser = await User.findOneAndUpdate(
      { _id: testUser._id },
      { $push: { orderHistory: testOrderEntry } },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      console.log('❌ Failed to update user');
      return;
    }
    
    console.log('✅ User updated successfully');
    console.log('📊 New order history count:', updatedUser.orderHistory.length);
    console.log('📋 Latest order in history:', updatedUser.orderHistory[updatedUser.orderHistory.length - 1]);
    
    // Verify the order was added
    if (updatedUser.orderHistory.length > testUser.orderHistory.length) {
      console.log('✅ Order history update confirmed');
    } else {
      console.log('❌ Order history not updated');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

testUserModelDirect(); 