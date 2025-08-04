const axios = require('axios');

class ShiprocketAPI {
  constructor() {
    this.baseURL = 'https://apiv2.shiprocket.in/v1';
    this.token = null;
    this.tokenExpiry = null;
  }

  // Authenticate with Shiprocket
  async authenticate() {
    try {
      console.log('🔐 Authenticating with Shiprocket...');
      
      const response = await axios.post(`${this.baseURL}/external/auth/login`, {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD
      });

      if (response.data && response.data.token) {
        this.token = response.data.token;
        this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        console.log('✅ Shiprocket authentication successful');
        return this.token;
      } else {
        throw new Error('Authentication failed - no token received');
      }
    } catch (error) {
      console.error('❌ Shiprocket authentication failed:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get authentication token (refresh if needed)
  async getToken() {
    if (!this.token || Date.now() > this.tokenExpiry) {
      await this.authenticate();
    }
    return this.token;
  }

  // Create order in Shiprocket
  async createOrder(orderData) {
    try {
      const token = await this.getToken();
      console.log('📦 Creating Shiprocket order...');

      // Add required fields that were missing
      const enhancedOrderData = {
        ...orderData,
        payment_method: orderData.payment_method || 'Prepaid',
        shipping_is_billing: orderData.shipping_is_billing || true,
        length: orderData.length || 10,
        breadth: orderData.breadth || 10,
        height: orderData.height || 10,
        weight: orderData.weight || 0.5
      };

      console.log('Enhanced order data:', JSON.stringify(enhancedOrderData, null, 2));

      const response = await axios.post(`${this.baseURL}/external/orders/create/adhoc`, enhancedOrderData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Shiprocket order created successfully');
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      // Return the actual response from Shiprocket (no mock data)
      return response.data;
    } catch (error) {
      console.error('❌ Shiprocket order creation failed:', error.response?.data || error.message);
      throw error; // Re-throw the error - no mock responses
    }
  }

  // Calculate shipping rates
  async calculateShipping(pickupPincode, deliveryPincode, weight) {
    try {
      const token = await this.getToken();
      console.log('🚚 Calculating shipping rates...');

      const response = await axios.get(`${this.baseURL}/external/courier/serviceability`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          pickup_postcode: pickupPincode,
          delivery_postcode: deliveryPincode,
          weight: weight,
          cod: 0
        }
      });

      console.log('✅ Shipping rates calculated');
      return response.data;
    } catch (error) {
      console.error('❌ Shipping rate calculation failed:', error.response?.data || error.message);
      throw error; // Re-throw the error - no mock responses
    }
  }

  // Track shipment
  async trackShipment(shipmentId) {
    try {
      const token = await this.getToken();
      console.log('📋 Tracking shipment:', shipmentId);

      const response = await axios.get(`${this.baseURL}/external/courier/track/shipment/${shipmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Shipment tracking retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Shipment tracking failed:', error.response?.data || error.message);
      throw error; // Re-throw the error - no mock responses
    }
  }

  // Auto-update tracking details when payment is paid and shipment exists
  async autoUpdateTrackingDetails(shipmentId) {
    try {
      console.log('🔄 Auto-updating tracking details for shipment:', shipmentId);
      
      if (!shipmentId || shipmentId === 'undefined' || shipmentId === 'null') {
        console.log('⚠️ Invalid shipment ID for auto-update');
        return null;
      }

      const trackingData = await this.trackShipment(shipmentId);
      
      if (trackingData) {
        // Shiprocket returns data with shipment ID as key
        const shipmentKey = Object.keys(trackingData)[0];
        const data = trackingData[shipmentKey]?.tracking_data;
        
        if (data) {
          const updates = {};
          
          // Extract tracking details from shipment_track array
          if (data.shipment_track && data.shipment_track.length > 0) {
            const trackInfo = data.shipment_track[0];
            
            if (trackInfo.awb_code && trackInfo.awb_code !== '') {
              updates.trackingNumber = trackInfo.awb_code;
            }
            
            if (trackInfo.courier_name && trackInfo.courier_name !== '') {
              updates.courierName = trackInfo.courier_name;
            }
          }
          
          // Extract tracking URL from main tracking_data
          if (data.track_url && data.track_url !== '') {
            updates.trackingUrl = data.track_url;
          }
          
          console.log('✅ Auto-update tracking details extracted:', updates);
          return updates;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Auto-update tracking failed:', error.message);
      return null;
    }
  }

  // Get courier list - Fixed endpoint
  async getCourierList() {
    try {
      const token = await this.getToken();
      console.log('📋 Getting courier list...');

      // Use the correct Shiprocket API endpoint for courier list
      const response = await axios.get(`${this.baseURL}/external/courier/serviceability`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          pickup_postcode: '110001', // Delhi
          delivery_postcode: '400001', // Mumbai
          weight: 0.5,
          cod: 0
        }
      });

      console.log('✅ Courier list retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Courier list retrieval failed:', error.response?.data || error.message);
      throw error; // Re-throw the error - no mock responses
    }
  }

  // Check and update order details from Shiprocket
  async checkAndUpdateOrderDetails(shiprocketOrderId) {
    try {
      const token = await this.getToken();
      console.log('🔍 Checking order details from Shiprocket:', shiprocketOrderId);

      const response = await axios.get(`${this.baseURL}/external/orders/show/${shiprocketOrderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Order details retrieved from Shiprocket');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to check order details:', error.response?.data || error.message);
      
      // Provide more specific error information
      if (error.response?.status === 400) {
        throw new Error(`Shiprocket order not found: ${shiprocketOrderId} - ${error.response?.data?.message || 'Invalid order ID'}`);
      } else if (error.response?.status === 401) {
        throw new Error('Shiprocket authentication failed - please check credentials');
      } else if (error.response?.status === 429) {
        throw new Error('Too many requests to Shiprocket API - please try again later');
      } else {
        throw new Error(`Shiprocket API error: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  // Get order status updates
  async getOrderStatus(shiprocketOrderId) {
    try {
      const token = await this.getToken();
      console.log('📊 Getting order status from Shiprocket:', shiprocketOrderId);

      const response = await axios.get(`${this.baseURL}/external/orders/show/${shiprocketOrderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Order status retrieved from Shiprocket');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get order status:', error.response?.data || error.message);
      throw error;
    }
  }

  // Cancel order
  async cancelOrder(shipmentId) {
    try {
      const token = await this.getToken();
      console.log('❌ Cancelling Shiprocket order:', shipmentId);

      const response = await axios.post(`${this.baseURL}/external/orders/cancel`, {
        ids: [shipmentId]
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Shiprocket order cancelled successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Shiprocket order cancellation failed:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new ShiprocketAPI(); 