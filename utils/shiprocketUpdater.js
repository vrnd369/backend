const Order = require('../models/Order');
const shiprocket = require('./shiprocket');

class ShiprocketUpdater {
  constructor() {
    this.isRunning = false;
    this.updateInterval = 15 * 60 * 1000; // Check every 15 minutes (more frequent for tracking updates)
  }

  // Start the automatic updater
  start() {
    if (this.isRunning) {
      console.log('⚠️ Shiprocket updater is already running');
      return;
    }

    console.log('🚀 Starting Shiprocket automatic updater...');
    this.isRunning = true;
    this.scheduleNextUpdate();
  }

  // Stop the automatic updater
  stop() {
    console.log('🛑 Stopping Shiprocket automatic updater...');
    this.isRunning = false;
  }

  // Schedule the next update
  scheduleNextUpdate() {
    if (!this.isRunning) return;

    setTimeout(async () => {
      if (this.isRunning) {
        await this.checkAllOrders();
        this.scheduleNextUpdate();
      }
    }, this.updateInterval);
  }

  // Check all orders for Shiprocket updates
  async checkAllOrders() {
    try {
      console.log('🔍 Checking all orders for Shiprocket updates...');

      // Find orders that have Shiprocket Order ID but might be missing tracking details
      // Also check orders that are confirmed but not yet shipped (in case courier was assigned)
      const ordersToCheck = await Order.find({
        shiprocketOrderId: { $exists: true, $ne: null },
        $or: [
          // Missing tracking information
          { courierName: { $exists: false } },
          { courierName: null },
          { courierName: '' },
          { trackingNumber: { $exists: false } },
          { trackingNumber: null },
          { trackingNumber: '' },
          { trackingUrl: { $exists: false } },
          { trackingUrl: null },
          { trackingUrl: '' },
          // Orders that might have been shipped but status not updated
          { orderStatus: 'confirmed' },
          { orderStatus: 'processing' }
        ]
      });

      console.log(`📦 Found ${ordersToCheck.length} orders to check for updates`);

      let updatedCount = 0;
      let errorCount = 0;

      for (const order of ordersToCheck) {
        try {
          console.log(`🔍 Checking order: ${order.orderId} (Status: ${order.orderStatus})`);
          const updated = await this.updateOrderFromShiprocket(order);
          if (updated) {
            updatedCount++;
          }
        } catch (error) {
          console.error(`❌ Error updating order ${order.orderId}:`, error.message);
          errorCount++;
        }
        
        // Add small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ Shiprocket update check completed:`);
      console.log(`   - Orders checked: ${ordersToCheck.length}`);
      console.log(`   - Orders updated: ${updatedCount}`);
      console.log(`   - Errors: ${errorCount}`);

    } catch (error) {
      console.error('❌ Error in Shiprocket updater:', error);
    }
  }

  // Update a single order from Shiprocket
  async updateOrderFromShiprocket(order) {
    try {
      console.log(`🔍 Checking updates for order: ${order.orderId} (Shiprocket ID: ${order.shiprocketOrderId})`);

      const shiprocketDetails = await shiprocket.checkAndUpdateOrderDetails(order.shiprocketOrderId);
      
      if (!shiprocketDetails || !shiprocketDetails.data) {
        console.log(`ℹ️ No details available for order ${order.orderId}`);
        return false;
      }

      const data = shiprocketDetails.data;
      let updated = false;
      const updates = [];

      // Check for new shipment ID
      if (data.shipment_id && data.shipment_id !== order.shiprocketShipmentId) {
        order.shiprocketShipmentId = data.shipment_id;
        updated = true;
        updates.push(`Shipment ID: ${data.shipment_id}`);
        console.log(`✅ Updated Shipment ID for ${order.orderId}: ${data.shipment_id}`);
      }
      
      // Check for new AWB code
      if (data.awb_code && data.awb_code !== '' && data.awb_code !== order.trackingNumber) {
        order.trackingNumber = data.awb_code;
        updated = true;
        updates.push(`AWB Code: ${data.awb_code}`);
        console.log(`✅ Updated AWB Code for ${order.orderId}: ${data.awb_code}`);
      }
      
      // Check for new courier name
      if (data.courier_name && data.courier_name !== '' && data.courier_name !== order.courierName) {
        order.courierName = data.courier_name;
        updated = true;
        updates.push(`Courier: ${data.courier_name}`);
        console.log(`✅ Updated Courier Name for ${order.orderId}: ${data.courier_name}`);
      }
      
      // Check for new tracking URL
      if (data.tracking_url && data.tracking_url !== '' && data.tracking_url !== order.trackingUrl) {
        order.trackingUrl = data.tracking_url;
        updated = true;
        updates.push(`Tracking URL: ${data.tracking_url}`);
        console.log(`✅ Updated Tracking URL for ${order.orderId}: ${data.tracking_url}`);
      }
      
      // Update order status based on Shiprocket status
      if (data.status) {
        let newStatus = order.orderStatus;
        switch (data.status.toLowerCase()) {
          case 'picked_up':
          case 'in_transit':
            newStatus = 'shipped';
            break;
          case 'delivered':
            newStatus = 'delivered';
            break;
          case 'failed':
            newStatus = 'failed';
            break;
          default:
            // Keep existing status
            break;
        }
        
        if (newStatus !== order.orderStatus) {
          order.orderStatus = newStatus;
          updated = true;
          updates.push(`Status: ${newStatus}`);
          console.log(`✅ Updated Order Status for ${order.orderId}: ${newStatus}`);
        }
      }

      // Update notes with tracking information
      if (updated) {
        const updateNote = `Shiprocket update: ${updates.join(', ')} - ${new Date().toISOString()}`;
        order.notes = order.notes ? `${order.notes} | ${updateNote}` : updateNote;
        
        await order.save();
        console.log(`✅ Order ${order.orderId} updated successfully with: ${updates.join(', ')}`);
        return true;
      } else {
        console.log(`ℹ️ No updates needed for order ${order.orderId}`);
        return false;
      }

    } catch (error) {
      console.error(`❌ Error updating order ${order.orderId}:`, error.message);
      
      // Add error note to order
      const errorNote = `Shiprocket update failed: ${error.message} - ${new Date().toISOString()}`;
      order.notes = order.notes ? `${order.notes} | ${errorNote}` : errorNote;
      
      try {
        await order.save();
      } catch (saveError) {
        console.error(`❌ Failed to save error note for order ${order.orderId}:`, saveError.message);
      }
      
      throw error;
    }
  }

  // Manual update for a specific order
  async updateSpecificOrder(orderId) {
    try {
      const order = await Order.findOne({ orderId: orderId });
      
      if (!order) {
        throw new Error('Order not found');
      }

      if (!order.shiprocketOrderId) {
        throw new Error('Order does not have a Shiprocket Order ID');
      }

      return await this.updateOrderFromShiprocket(order);

    } catch (error) {
      console.error(`❌ Error updating specific order ${orderId}:`, error.message);
      throw error;
    }
  }
}

// Create singleton instance
const shiprocketUpdater = new ShiprocketUpdater();

module.exports = shiprocketUpdater; 