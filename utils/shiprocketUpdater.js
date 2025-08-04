const Order = require('../models/Order');
const shiprocket = require('./shiprocket');

class ShiprocketUpdater {
  constructor() {
    this.isRunning = false;
    this.checkInterval = 5 * 60 * 1000; // 5 minutes
    this.maxRetries = 3;
    this.retryDelay = 30 * 1000; // 30 seconds
  }

  // Enhanced tracking update with retry logic
  async updateTrackingDetails(shipmentId, retryCount = 0) {
    try {
      console.log(`🔄 Updating tracking details for shipment: ${shipmentId} (attempt ${retryCount + 1})`);
      
      if (!shipmentId || shipmentId === 'undefined' || shipmentId === 'null') {
        console.log('⚠️ Invalid shipment ID for tracking update');
        return null;
      }

      const trackingData = await shiprocket.trackShipment(shipmentId);
      
      if (trackingData) {
        // Shiprocket returns data with shipment ID as key
        const shipmentKey = Object.keys(trackingData)[0];
        const data = trackingData[shipmentKey]?.tracking_data;
        
        if (data) {
          const updates = {};
          
          // Extract tracking details from shipment_track array
          if (data.shipment_track && data.shipment_track.length > 0) {
            const trackInfo = data.shipment_track[0];
            
            if (trackInfo.awb_code && trackInfo.awb_code !== '' && trackInfo.awb_code !== 'null') {
              updates.trackingNumber = trackInfo.awb_code;
              console.log('✅ Found AWB code:', trackInfo.awb_code);
            }
            
            if (trackInfo.courier_name && trackInfo.courier_name !== '' && trackInfo.courier_name !== 'null') {
              updates.courierName = trackInfo.courier_name;
              console.log('✅ Found courier name:', trackInfo.courier_name);
            }
          }
          
          // Extract tracking URL from main tracking_data
          if (data.track_url && data.track_url !== '' && data.track_url !== 'null') {
            updates.trackingUrl = data.track_url;
            console.log('✅ Found tracking URL:', data.track_url);
          }
          
          if (Object.keys(updates).length > 0) {
            console.log('✅ Tracking details extracted successfully:', updates);
            return updates;
          } else {
            console.log('ℹ️ No valid tracking details found in response');
            return null;
          }
        } else {
          console.log('ℹ️ No tracking data available yet');
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Tracking update failed (attempt ${retryCount + 1}):`, error.message);
      
      // Retry logic for network errors or temporary failures
      if (retryCount < this.maxRetries && (
        error.message.includes('network') || 
        error.message.includes('timeout') ||
        error.response?.status >= 500
      )) {
        console.log(`🔄 Retrying in ${this.retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.updateTrackingDetails(shipmentId, retryCount + 1);
      }
      
      return null;
    }
  }

  // Update order with tracking details
  async updateOrderTracking(orderId, shipmentId) {
    try {
      console.log(`📦 Updating order ${orderId} with tracking details from shipment ${shipmentId}`);
      
      const order = await Order.findOne({ orderId: orderId });
      if (!order) {
        console.log('❌ Order not found:', orderId);
        return false;
      }

      const trackingUpdates = await this.updateTrackingDetails(shipmentId);
      
      if (trackingUpdates) {
        let updated = false;
        
        if (trackingUpdates.trackingNumber && trackingUpdates.trackingNumber !== order.trackingNumber) {
          order.trackingNumber = trackingUpdates.trackingNumber;
          updated = true;
          console.log('✅ Updated tracking number:', trackingUpdates.trackingNumber);
        }
        
        if (trackingUpdates.courierName && trackingUpdates.courierName !== order.courierName) {
          order.courierName = trackingUpdates.courierName;
          updated = true;
          console.log('✅ Updated courier name:', trackingUpdates.courierName);
        }
        
        if (trackingUpdates.trackingUrl && trackingUpdates.trackingUrl !== order.trackingUrl) {
          order.trackingUrl = trackingUpdates.trackingUrl;
          updated = true;
          console.log('✅ Updated tracking URL:', trackingUpdates.trackingUrl);
        }
        
        if (updated) {
          await order.save();
          console.log('✅ Order updated with tracking details');
          return true;
        } else {
          console.log('ℹ️ No new tracking updates to apply');
          return false;
        }
      } else {
        console.log('ℹ️ No tracking updates available');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error updating order tracking:', error);
      return false;
    }
  }

  // Periodic check for orders with missing tracking details
  async checkPendingTrackingUpdates() {
    if (this.isRunning) {
      console.log('⚠️ Tracking update check already running, skipping...');
      return;
    }

    this.isRunning = true;
    
    try {
      console.log('🔍 Checking for orders with pending tracking updates...');
      
      // Find orders that have shipment IDs but missing tracking details
      const pendingOrders = await Order.find({
        shiprocketShipmentId: { $exists: true, $ne: null, $ne: '' },
        $or: [
          { trackingNumber: { $exists: false } },
          { trackingNumber: null },
          { trackingNumber: '' },
          { courierName: { $exists: false } },
          { courierName: null },
          { courierName: '' }
        ]
      });

      console.log(`📊 Found ${pendingOrders.length} orders with pending tracking updates`);

      for (const order of pendingOrders) {
        try {
          console.log(`🔄 Checking tracking for order: ${order.orderId}, shipment: ${order.shiprocketShipmentId}`);
          
          const updated = await this.updateOrderTracking(order.orderId, order.shiprocketShipmentId);
          
          if (updated) {
            console.log(`✅ Successfully updated tracking for order: ${order.orderId}`);
          } else {
            console.log(`ℹ️ No updates available for order: ${order.orderId}`);
          }
          
          // Small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ Error updating order ${order.orderId}:`, error.message);
        }
      }
      
      console.log('✅ Completed tracking update check');
      
    } catch (error) {
      console.error('❌ Error in tracking update check:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Start periodic tracking updates
  startPeriodicUpdates() {
    console.log('🚀 Starting periodic tracking updates...');
    
    // Run initial check
    this.checkPendingTrackingUpdates();
    
    // Set up periodic checks
    setInterval(() => {
      this.checkPendingTrackingUpdates();
    }, this.checkInterval);
    
    console.log(`⏰ Periodic tracking updates scheduled every ${this.checkInterval / 1000 / 60} minutes`);
  }

  // Stop periodic updates
  stopPeriodicUpdates() {
    console.log('🛑 Stopping periodic tracking updates...');
    this.isRunning = false;
  }

  // Manual update for specific order
  async manualUpdateOrder(orderId) {
    try {
      console.log(`🔧 Manual tracking update for order: ${orderId}`);
      
      const order = await Order.findOne({ orderId: orderId });
      if (!order) {
        throw new Error('Order not found');
      }

      if (!order.shiprocketShipmentId) {
        throw new Error('No shipment ID available for tracking');
      }

      const updated = await this.updateOrderTracking(orderId, order.shiprocketShipmentId);
      
      return {
        success: true,
        updated: updated,
        order: {
          orderId: order.orderId,
          shiprocketShipmentId: order.shiprocketShipmentId,
          trackingNumber: order.trackingNumber,
          courierName: order.courierName,
          trackingUrl: order.trackingUrl
        }
      };
      
    } catch (error) {
      console.error('❌ Manual update failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ShiprocketUpdater(); 