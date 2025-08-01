const mongoose = require('mongoose');
const Order = require('./models/Order');
const shiprocket = require('./utils/shiprocket');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixShiprocketOrder() {
  try {
    console.log('🔧 Fixing Shiprocket order details...');
    
    // Find the specific order that needs fixing
    const orderId = 'ORD1753860857432C0VCO';
    const order = await Order.findOne({ orderId: orderId });
    
    if (!order) {
      console.log('❌ Order not found:', orderId);
      return;
    }
    
    console.log('📦 Found order:', {
      orderId: order.orderId,
      shiprocketOrderId: order.shiprocketOrderId,
      shiprocketShipmentId: order.shiprocketShipmentId,
      courierName: order.courierName,
      trackingNumber: order.trackingNumber
    });
    
    // Create Shiprocket order data
    const shiprocketOrderData = {
      order_id: order.orderId,
      order_date: new Date().toISOString().split('T')[0],
      pickup_location: 'warehouse',
      billing_customer_name: 'Customer Name', // You'll need to get this from user
      billing_last_name: 'Last Name',
      billing_address: order.billingAddress.houseName,
      billing_address_2: order.billingAddress.streetArea,
      billing_city: order.billingAddress.city,
      billing_pincode: order.billingAddress.pincode,
      billing_state: order.billingAddress.state,
      billing_country: order.billingAddress.country,
      billing_email: 'customer@example.com', // You'll need to get this from user
      billing_phone: '1234567890', // You'll need to get this from user
      shipping_customer_name: 'Customer Name',
      shipping_last_name: 'Last Name',
      shipping_address: order.shippingAddress.houseName,
      shipping_address_2: order.shippingAddress.streetArea,
      shipping_city: order.shippingAddress.city,
      shipping_pincode: order.shippingAddress.pincode,
      shipping_state: order.shippingAddress.state,
      shipping_country: order.shippingAddress.country,
      shipping_email: 'customer@example.com',
      shipping_phone: '1234567890',
      order_items: order.items.map(item => ({
        name: item.title,
        sku: item.productId,
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
        tax: 0
      })),
      sub_total: order.subtotal || 0,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
      payment_method: 'Prepaid',
      shipping_is_billing: true
    };
    
    console.log('🚚 Creating Shiprocket order...');
    const shiprocketResponse = await shiprocket.createOrder(shiprocketOrderData);
    
    if (shiprocketResponse && !shiprocketResponse.message?.includes('Wrong Pickup location')) {
      const responseData = shiprocketResponse;
      
      // Update order with Shiprocket data
      if (responseData.order_id) {
        order.shiprocketOrderId = responseData.order_id;
      }
      
      if (responseData.shipment_id) {
        order.shiprocketShipmentId = responseData.shipment_id;
      }
      
      if (responseData.courier_name && responseData.courier_name !== '') {
        order.courierName = responseData.courier_name;
      }
      
      if (responseData.awb_code && responseData.awb_code !== '') {
        order.trackingNumber = responseData.awb_code;
      }
      
      if (responseData.tracking_url && responseData.tracking_url !== '') {
        order.trackingUrl = responseData.tracking_url;
      }
      
      await order.save();
      
      console.log('✅ Order updated with Shiprocket data:');
      console.log('Shiprocket Order ID:', order.shiprocketOrderId);
      console.log('Shipment ID:', order.shiprocketShipmentId);
      console.log('Courier Name:', order.courierName);
      console.log('Tracking Number:', order.trackingNumber);
      console.log('Tracking URL:', order.trackingUrl);
    } else {
      console.log('❌ Failed to create Shiprocket order');
    }
    
  } catch (error) {
    console.error('❌ Error fixing Shiprocket order:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixShiprocketOrder(); 