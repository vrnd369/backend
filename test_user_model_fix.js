const mongoose = require('mongoose');
const User = require('./models/User');

// Load environment variables
require('dotenv').config();

// Connect to the same MongoDB Atlas database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testUserModelFix() {
  console.log('🔍 Testing User Model and Order History Fix...\n');

  try {
    // 1. Find a user from the database
    console.log('1️⃣ Finding a user from database...');
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    console.log('✅ User found:', {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      currentOrderHistoryLength: user.orderHistory ? user.orderHistory.length : 0
    });
    console.log('');

    // 2. Create a test order history entry
    console.log('2️⃣ Creating test order history entry...');
    const orderHistoryEntry = {
      orderId: `TEST-ORDER-${Date.now()}`,
      orderDate: new Date(),
      orderAmount: 399,
      orderStatus: 'confirmed',
      paymentStatus: 'pending',
      paymentMethod: 'online',
      items: [
        {
          productId: 'test-product',
          productName: 'Test Product',
          quantity: 1,
          price: 399,
          img: 'https://example.com/test.jpg'
        }
      ]
    };
    console.log('✅ Test order history entry created:', orderHistoryEntry.orderId);
    console.log('');

    // 3. Update user's order history directly
    console.log('3️⃣ Updating user order history...');
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $push: { orderHistory: orderHistoryEntry } },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      console.error('❌ Failed to update user order history - user not found after update');
      return;
    }
    
    console.log('✅ User order history updated successfully');
    console.log('📊 Total orders in history:', updatedUser.orderHistory.length);
    console.log('');

    // 4. Verify the update worked
    console.log('4️⃣ Verifying the update...');
    const verifyUser = await User.findById(user._id);
    console.log('📊 Verification - User order history length:', verifyUser.orderHistory.length);
    
    if (verifyUser.orderHistory && verifyUser.orderHistory.length > 0) {
      console.log('  - Latest Order:', verifyUser.orderHistory[verifyUser.orderHistory.length - 1]);
    }
    console.log('');

    // 5. Analysis
    console.log('5️⃣ Analysis...');
    const initialLength = user.orderHistory ? user.orderHistory.length : 0;
    const finalLength = verifyUser.orderHistory ? verifyUser.orderHistory.length : 0;
    
    if (finalLength > initialLength) {
      console.log('✅ SUCCESS: User model and order history are working correctly!');
      console.log(`   - Before: ${initialLength} orders`);
      console.log(`   - After: ${finalLength} orders`);
      console.log('   - This means the User model can be updated correctly');
      console.log('   - The issue must be in the order creation process');
    } else {
      console.log('❌ FAILURE: User model update is not working');
      console.log(`   - Before: ${initialLength} orders`);
      console.log(`   - After: ${finalLength} orders`);
      console.log('   - This indicates an issue with the User model or database');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
  } finally {
    mongoose.connection.close();
  }
}

testUserModelFix(); 