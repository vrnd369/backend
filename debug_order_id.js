const mongoose = require('mongoose');
const Order = require('./models/Order');

async function debugOrderId() {
  console.log('🔍 Debugging Order ID Generation...\n');

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
    console.log('✅ Connected to database');

    // Create a test order
    const testOrder = new Order({
      userId: new mongoose.Types.ObjectId(),
      items: [
        {
          productId: 'test1',
          title: 'Test Product',
          price: 100,
          quantity: 1,
          img: 'test.jpg',
          description: 'Test description'
        }
      ],
      shippingAddress: {
        houseName: 'Test House',
        streetArea: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'India',
        pincode: '123456'
      },
      billingAddress: {
        houseName: 'Test House',
        streetArea: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'India',
        pincode: '123456'
      },
      subtotal: 100,
      total: 100
    });

    console.log('📋 Test order before save:');
    console.log('_id:', testOrder._id);
    console.log('orderId:', testOrder.orderId);

    await testOrder.save();
    console.log('\n📋 Test order after save:');
    console.log('_id:', testOrder._id);
    console.log('orderId:', testOrder.orderId);

    // Fetch the order again
    const fetchedOrder = await Order.findById(testOrder._id);
    console.log('\n📋 Fetched order:');
    console.log('_id:', fetchedOrder._id);
    console.log('orderId:', fetchedOrder.orderId);

    console.log('\n✅ Order ID generation test completed');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugOrderId(); 