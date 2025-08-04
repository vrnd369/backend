# Real-time Shiprocket Integration (No Mock Data)

## 🎯 **WHAT CHANGED:**

- **❌ Removed all mock data** from Shiprocket integration
- **✅ Only real Shiprocket data** is saved to database
- **✅ Empty/null values** when real data is not available
- **✅ Real-time updates** when Shiprocket assigns IDs
- **✅ Webhook support** for automatic updates
- **✅ Background automatic updater** checks every 30 minutes
- **✅ Manual update endpoint** for immediate checks

## 📊 **DATABASE BEHAVIOR:**

### **When Order is Created (No Real IDs Yet):**
```javascript
{
  orderId: "ORD1753775108960HB7BH",
  orderStatus: "confirmed",
  shiprocketOrderId: "910618760",        // ✅ Real Shiprocket Order ID
  shiprocketShipmentId: "906922174",     // ✅ Real Shipment ID
  courierName: null,                     // ❌ Empty - not assigned yet
  trackingNumber: null,                  // ❌ Empty - AWB not assigned yet
  trackingUrl: null                      // ❌ Empty - not available yet
}
```

### **When Real IDs are Assigned (via Webhook/Auto-updater):**
```javascript
{
  orderId: "ORD1753775108960HB7BH",
  orderStatus: "shipped",
  shiprocketOrderId: "910618760",        // ✅ Real Shiprocket Order ID
  shiprocketShipmentId: "906922174",     // ✅ Real Shipment ID
  courierName: "DTDC Express",           // ✅ Real courier assigned
  trackingNumber: "AWB123456789",        // ✅ Real AWB assigned
  trackingUrl: "https://tracking.url"    // ✅ Real tracking URL
}
```

## 🔄 **REAL-TIME UPDATE PROCESS:**

### **1. Order Creation:**
```javascript
// Only saves real data from Shiprocket
if (responseData.order_id) {
  order.shiprocketOrderId = responseData.order_id;
}
if (responseData.shipment_id) {
  order.shiprocketShipmentId = responseData.shipment_id;
}
// courierName, trackingNumber, trackingUrl remain null/empty
```

### **2. Automatic Updates (Every 30 minutes):**
```javascript
// Background job checks all orders for updates
const ordersToCheck = await Order.find({
  shiprocketOrderId: { $exists: true, $ne: null },
  $or: [
    { courierName: { $exists: false } },
    { courierName: null },
    { courierName: '' },
    { trackingNumber: { $exists: false } },
    { trackingNumber: null },
    { trackingNumber: '' }
  ]
});
```

### **3. Manual Update Check:**
```javascript
// Endpoint: POST /api/orders/check-shiprocket-updates/:orderId
// Immediately check for updates from Shiprocket
const shiprocketDetails = await shiprocket.checkAndUpdateOrderDetails(order.shiprocketOrderId);
```

### **4. Webhook Updates (Real-time):**
```javascript
// Shiprocket webhook endpoint: /api/orders/shiprocket-webhook
// Updates database when real IDs are assigned
if (awb_code && awb_code !== '') {
  order.trackingNumber = awb_code;  // ✅ Real AWB
}
if (courier_name && courier_name !== '') {
  order.courierName = courier_name;  // ✅ Real courier
}
```

## 🎯 **FRONTEND IMPLEMENTATION:**

### **Check for Real Data:**
```javascript
function displayOrderDetails(order) {
  const hasRealTracking = order.trackingNumber && order.trackingNumber !== '';
  const hasRealCourier = order.courierName && order.courierName !== '';
  
  if (hasRealTracking && hasRealCourier) {
    // Show real tracking information
    return `
      <div class="tracking-active">
        <h3>📦 Your package is on the way!</h3>
        <p>Courier: ${order.courierName}</p>
        <p>AWB Number: ${order.trackingNumber}</p>
        <button onclick="trackPackage('${order.trackingNumber}')">
          Track Package
        </button>
      </div>
    `;
  } else {
    // Show pending message with refresh option
    return `
      <div class="tracking-pending">
        <h3>✅ Order Confirmed</h3>
        <p>Your order has been successfully created and is being processed.</p>
        <p>📦 Shipment ID: ${order.shiprocketShipmentId}</p>
        <p>⏰ Tracking details will be available once the courier picks up your package.</p>
        <p>📧 You'll receive tracking details via email and SMS when available.</p>
        <button onclick="checkForUpdates('${order.orderId}')">
          🔄 Check for Updates
        </button>
      </div>
    `;
  }
}

// Function to check for updates
async function checkForUpdates(orderId) {
  try {
    const response = await fetch(`/api/orders/check-shiprocket-updates/${orderId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.updated) {
      // Refresh the page or update UI
      location.reload();
    } else {
      alert('No new updates available yet. We\'ll notify you when tracking becomes available.');
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}
```

## 🔧 **API ENDPOINTS:**

### **1. Manual Update Check:**
```
POST /api/orders/check-shiprocket-updates/:orderId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "message": "Order updated with new Shiprocket details",
  "orderId": "ORD1753775108960HB7BH",
  "updated": true,
  "updates": {
    "trackingNumber": "AWB123456789",
    "courierName": "DTDC Express",
    "orderStatus": "shipped"
  },
  "order": {
    "orderId": "ORD1753775108960HB7BH",
    "orderStatus": "shipped",
    "shiprocketOrderId": "910618760",
    "shiprocketShipmentId": "906922174",
    "courierName": "DTDC Express",
    "trackingNumber": "AWB123456789",
    "trackingUrl": "https://tracking.url"
  }
}
```

### **2. Webhook Endpoint:**
```
POST /api/orders/shiprocket-webhook
```

**Webhook Payload:**
```json
{
  "order_id": "910618760",
  "shipment_id": "906922174",
  "awb_code": "AWB123456789",
  "courier_name": "DTDC Express",
  "status": "picked_up",
  "status_code": 2
}
```

## 🔄 **AUTOMATIC UPDATE SYSTEM:**

### **Background Job:**
- **Frequency**: Every 30 minutes
- **Checks**: All orders with Shiprocket Order ID but missing tracking details
- **Updates**: Database with real Shiprocket data when available
- **Logs**: Detailed console logs for monitoring

### **Server Startup:**
```javascript
// Automatically starts when server starts
if (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD) {
  const shiprocketUpdater = require('./utils/shiprocketUpdater');
  shiprocketUpdater.start();
  console.log('📦 Shiprocket automatic updater started');
}
```

## 📱 **USER EXPERIENCE:**

### **Order Confirmation Email:**
```
🎉 Order Confirmed!

Order ID: ORD1753775108960HB7BH
Shipment ID: 906922174

Your order is being processed. We'll notify you when tracking becomes available.

Thank you for your order!
```

### **Tracking Available Email:**
```
📦 Your package is on the way!

Order ID: ORD1753775108960HB7BH
AWB Number: AWB123456789
Courier: DTDC Express

Track your package: [LINK]

Estimated delivery: 3-5 days
```

## ✅ **BENEFITS:**

1. **✅ No Fake Data**: Only real Shiprocket IDs are used
2. **✅ Real-time Updates**: Database updates when real IDs are assigned
3. **✅ Automatic Background Updates**: Checks every 30 minutes
4. **✅ Manual Update Option**: Users can check for updates immediately
5. **✅ Webhook Support**: Real-time updates from Shiprocket
6. **✅ Accurate Tracking**: Real AWB numbers work in tracking system
7. **✅ User Transparency**: Clear communication about tracking availability
8. **✅ Professional Experience**: No confusing mock data

## 🚀 **DEPLOYMENT CHECKLIST:**

- [ ] Configure Shiprocket webhook URL in Shiprocket dashboard
- [ ] Test webhook endpoint with real Shiprocket data
- [ ] Update frontend to handle null/empty tracking data
- [ ] Add "Check for Updates" button in frontend
- [ ] Set up email notifications for tracking availability
- [ ] Monitor webhook logs for successful updates
- [ ] Monitor background updater logs
- [ ] Test manual update endpoint

## 🎯 **SUMMARY:**

**Complete real-time Shiprocket integration!** The system now:
- ✅ Only saves real Shiprocket data
- ✅ Shows empty/null when real data is not available
- ✅ Updates automatically every 30 minutes
- ✅ Provides manual update option
- ✅ Supports webhook real-time updates
- ✅ Provides clear user communication about tracking status

This ensures a professional, accurate, and transparent shipping experience with multiple update mechanisms! 🚚 