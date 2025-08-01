const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ottoman-mitten', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Copy the addOrderToUserHistory function from routes/orders.js
async function addOrderToUserHistory(userId, order) {
  try {
    console.log('📝 Adding order to user history for user:', userId);
    console.log('Order details:', {
      orderId: order.orderId,
      total: order.total,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      itemsCount: order.items ? order.items.length : 0
    });

    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found for order history update:', userId);
      return;
    }

    console.log('👤 User found:', {
      userId: user._id,
      firstName: user.firstName,
      currentOrderHistoryLength: user.orderHistory ? user.orderHistory.length : 0
    });

    // Check if order already exists in history
    const existingOrder = user.orderHistory.find(historyItem => 
      historyItem.orderId === order.orderId
    );

    if (existingOrder) {
      console.log('⚠️ Order already exists in user history:', order.orderId);
      return;
    }

    // Create order history entry
    const orderHistoryEntry = {
      orderId: order.orderId,
      orderDate: order.createdAt,
      orderAmount: order.total,
      orderStatus: order.orderStatus || 'confirmed',
      paymentStatus: order.paymentStatus || 'pending',
      paymentMethod: order.paymentMethod || 'online',
      items: (order.items || []).map(item => ({
        productId: item.productId || item.id,
        productName: item.title,
        quantity: item.quantity,
        price: item.price,
        img: item.img || ''
      }))
    };

    console.log('📋 Order history entry created:', orderHistoryEntry);

    // Add to user's order history
    user.orderHistory.push(orderHistoryEntry);
    
    console.log('📝 Before saving - Order history length:', user.orderHistory.length);
    
    const savedUser = await user.save();
    
    console.log('📝 After saving - Order history length:', savedUser.orderHistory.length);
    console.log('✅ User order history updated successfully for user:', userId);
    console.log('📊 Total orders in history:', savedUser.orderHistory.length);
    
    // Verify the save worked
    const verifyUser = await User.findById(userId);
    console.log('🔍 Verification - User order history length:', verifyUser.orderHistory.length);
    
  } catch (error) {
    console.error('❌ Error updating user order history:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
}

async function testAddOrderToUserHistory() {
  console.log('🔍 Testing addOrderToUserHistory function directly...\n');

  try {
    // 1. Find a user
    console.log('1️⃣ Finding a user...');
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

    // 2. Create a mock order
    console.log('2️⃣ Creating mock order...');
    const mockOrder = {
      orderId: `TEST-ORDER-${Date.now()}`,
      total: 299,
      orderStatus: 'confirmed',
      paymentStatus: 'pending',
      paymentMethod: 'online',
      createdAt: new Date(),
      items: [
        {
          productId: 'test-product-1',
          id: 'test-product-1',
          title: 'Test Product 1',
          quantity: 1,
          price: 299,
          img: 'https://example.com/test1.jpg'
        }
      ]
    };
    console.log('✅ Mock order created:', mockOrder.orderId);
    console.log('');

    // 3. Call addOrderToUserHistory function
    console.log('3️⃣ Calling addOrderToUserHistory function...');
    await addOrderToUserHistory(user._id, mockOrder);
    console.log('✅ addOrderToUserHistory function called');
    console.log('');

    // 4. Check if the order was added
    console.log('4️⃣ Checking if order was added to user history...');
    const updatedUser = await User.findById(user._id);
    console.log('📊 Updated user profile:');
    console.log('  - Order History Length:', updatedUser.orderHistory ? updatedUser.orderHistory.length : 0);
    
    if (updatedUser.orderHistory && updatedUser.orderHistory.length > 0) {
      console.log('  - Latest Order:', updatedUser.orderHistory[updatedUser.orderHistory.length - 1]);
    }
    console.log('');

    // 5. Analysis
    console.log('🔍 ANALYSIS:');
    const initialLength = user.orderHistory ? user.orderHistory.length : 0;
    const finalLength = updatedUser.orderHistory ? updatedUser.orderHistory.length : 0;
    
    if (finalLength > initialLength) {
      console.log('✅ SUCCESS: Order was added to user history');
      console.log(`   - Before: ${initialLength} orders`);
      console.log(`   - After: ${finalLength} orders`);
    } else {
      console.log('❌ FAILURE: Order was not added to user history');
      console.log(`   - Before: ${initialLength} orders`);
      console.log(`   - After: ${finalLength} orders`);
      console.log('   - This indicates an issue with the addOrderToUserHistory function');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  } finally {
    mongoose.connection.close();
  }
}

testAddOrderToUserHistory(); 