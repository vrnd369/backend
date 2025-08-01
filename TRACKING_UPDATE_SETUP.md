# Tracking Update Setup Guide

## 🎯 **Problem Solved:**
When you ship a product from the Shiprocket website, the tracking information (AWB code, courier name) will automatically update in your database and frontend.

## 🔧 **How It Works:**

### **1. Webhook Configuration (Primary Method)**
When you assign a courier and generate AWB in Shiprocket dashboard, it sends a webhook to your backend:

```json
{
  "order_id": "910618760",
  "shipment_id": "906922174", 
  "awb_code": "AWB123456789",
  "courier_name": "DTDC Express",
  "status": "shipped",
  "tracking_url": "https://tracking.dtdc.com/track?awb=AWB123456789"
}
```

### **2. Background Updater (Backup Method)**
Every 15 minutes, your backend automatically checks for tracking updates from Shiprocket API.

### **3. Manual Update Check**
Users can manually check for updates via the frontend.

## 🚀 **Setup Instructions:**

### **Step 1: Configure Webhook in Shiprocket Dashboard**

1. **Log into your Shiprocket Dashboard**
2. **Go to Settings** → **Webhooks** (or **API Settings**)
3. **Add New Webhook** with these details:

```
Webhook URL: https://your-backend-domain.com/api/orders/shiprocket-webhook
Events to Listen: 
- Order Status Updates
- Shipment Created
- AWB Generated
- Courier Assigned
```

### **Step 2: Test Webhook Configuration**

1. **Create an order in your website**
2. **Go to Shiprocket dashboard**
3. **Assign a courier and generate AWB**
4. **Check your backend logs for webhook receipt**
5. **Verify database is updated with tracking info**

### **Step 3: Monitor Webhook Logs**

Your backend will log webhook activity:
```
📦 Shiprocket webhook received: { order_id: "910618760", ... }
✅ Updated AWB Code: AWB123456789
✅ Updated Courier Name: DTDC Express
✅ Order updated successfully with real Shiprocket data
```

## 📊 **Database Updates:**

### **Before Shipping (Order Created):**
```javascript
{
  orderId: "ORD1753860857432C0VCO",
  shiprocketOrderId: "910618760",
  shiprocketShipmentId: "906922174",
  courierName: null,           // ❌ Not assigned yet
  trackingNumber: null,         // ❌ AWB not generated yet
  trackingUrl: null,           // ❌ Not available yet
  orderStatus: "confirmed"
}
```

### **After Shipping (Webhook Received):**
```javascript
{
  orderId: "ORD1753860857432C0VCO",
  shiprocketOrderId: "910618760",
  shiprocketShipmentId: "906922174",
  courierName: "DTDC Express", // ✅ Real courier assigned
  trackingNumber: "AWB123456789", // ✅ Real AWB generated
  trackingUrl: "https://tracking.dtdc.com/track?awb=AWB123456789", // ✅ Real tracking URL
  orderStatus: "shipped"       // ✅ Status updated
}
```

## 🔍 **Troubleshooting:**

### **Issue 1: Webhook Not Received**
**Symptoms:** Tracking info not updating when you ship from Shiprocket
**Solutions:**
1. Check webhook URL is correct in Shiprocket dashboard
2. Verify your backend is accessible from internet
3. Check backend logs for webhook errors
4. Test webhook endpoint manually

### **Issue 2: Order Not Found**
**Symptoms:** Webhook received but order not found
**Solutions:**
1. Verify Shiprocket Order ID matches database
2. Check order exists in your database
3. Ensure order has `shiprocketOrderId` field

### **Issue 3: Background Updater Not Working**
**Symptoms:** No automatic updates every 15 minutes
**Solutions:**
1. Check backend logs for updater activity
2. Verify Shiprocket credentials are correct
3. Ensure updater is started in server.js

## 🧪 **Testing:**

### **Test Webhook Manually:**
```bash
node test_tracking_updates.js
```

### **Test Background Updater:**
```bash
# Check logs for updater activity
# Should see: "🔍 Checking all orders for Shiprocket updates..."
```

### **Test Manual Update:**
```bash
# Use the endpoint: POST /api/orders/check-shiprocket-updates/:orderId
```

## 📋 **API Endpoints:**

### **1. Webhook Endpoint:**
```
POST /api/orders/shiprocket-webhook
```
- Receives webhooks from Shiprocket
- Updates database with tracking info
- Returns success/error response

### **2. Manual Update Check:**
```
POST /api/orders/check-shiprocket-updates/:orderId
```
- Manually check for tracking updates
- Requires authentication
- Returns updated order details

### **3. Shipment Details:**
```
GET /api/orders/:orderId/shipment-details
```
- Get comprehensive shipment information
- Includes real-time tracking data
- Requires authentication

## ✅ **Verification Checklist:**

- [ ] Webhook URL configured in Shiprocket dashboard
- [ ] Backend accessible from internet
- [ ] Shiprocket credentials are correct
- [ ] Background updater is running
- [ ] Webhook endpoint is working
- [ ] Database updates are working
- [ ] Frontend displays tracking info
- [ ] Manual update checks work

## 🎉 **Expected Results:**

1. **✅ Real-time tracking updates** when you ship from Shiprocket
2. **✅ Automatic database updates** via webhooks
3. **✅ Background checks** every 15 minutes
4. **✅ Manual update capability** for immediate checks
5. **✅ Frontend displays** tracking information
6. **✅ No manual intervention** required

## 🆘 **Support:**

If you're still having issues:

1. **Check backend logs** for webhook activity
2. **Verify Shiprocket credentials** are correct
3. **Test webhook endpoint** manually
4. **Contact Shiprocket support** for webhook configuration
5. **Check your backend deployment** is accessible

## 📞 **Next Steps:**

1. **Configure webhook in Shiprocket dashboard**
2. **Test with a real order**
3. **Monitor webhook logs**
4. **Verify tracking updates work**
5. **Deploy to production**

---

**🎯 Goal:** When you ship a product from Shiprocket website, tracking information automatically appears in your database and frontend without any manual work. 