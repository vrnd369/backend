# Shiprocket Tracking Explanation

## 🔍 **Why AWB Shows "Not Found"**

When you test the tracking with AWB numbers like `AWB1753772756979`, you get "AWB not found" because:

### **Normal Shiprocket Order Lifecycle:**

1. **📦 Order Created** → Status: "NEW" → **No AWB yet**
2. **🚚 Courier Assigned** → Status: "ASSIGNED" → **Still no AWB**
3. **📦 Package Picked Up** → Status: "PICKED UP" → **AWB assigned here**
4. **🚛 In Transit** → Status: "IN TRANSIT" → **AWB active**
5. **✅ Delivered** → Status: "DELIVERED" → **AWB completed**

## ⏰ **Timeline for AWB Assignment:**

- **Order Creation**: 0-2 hours → No AWB
- **Courier Assignment**: 2-24 hours → No AWB  
- **Package Pickup**: 24-48 hours → **AWB becomes available**
- **Tracking Active**: After pickup → **AWB works in tracking system**

## 📋 **What to Show Users:**

### **For New Orders (No AWB yet):**
```
✅ Order Status: Confirmed
📦 Shipment ID: 906922174
🚚 Status: Order created, awaiting courier pickup
⏰ Tracking: Will be available after courier pickup
📧 You'll receive tracking details via email & SMS
```

### **For Orders with AWB:**
```
✅ Order Status: Confirmed
📦 Shipment ID: 906922174
🚚 Courier: DTDC Express
📋 AWB Number: AWB123456789
🔗 Track Package: [Click to track]
```

## 🎯 **Frontend Implementation:**

### **Check if AWB is available:**
```javascript
if (order.trackingNumber && order.trackingNumber !== '') {
  // Show tracking button and AWB number
  showTrackingInfo(order.trackingNumber, order.courierName);
} else {
  // Show "tracking will be available" message
  showPendingTrackingMessage();
}
```

### **Pending Tracking Message:**
```javascript
function showPendingTrackingMessage() {
  return `
    <div class="tracking-pending">
      <h3>✅ Order Confirmed</h3>
      <p>Your order has been successfully created and is being processed.</p>
      <p>📦 Shipment ID: ${order.shiprocketShipmentId}</p>
      <p>⏰ Tracking will be available once the courier picks up your package.</p>
      <p>📧 You'll receive tracking details via email and SMS when available.</p>
    </div>
  `;
}
```

## 🔧 **Backend Response Examples:**

### **New Order (No AWB):**
```json
{
  "orderId": "ORD1753775108960HB7BH",
  "orderStatus": "confirmed",
  "shiprocketOrderId": "910618760",
  "shiprocketShipmentId": "906922174",
  "courierName": null,
  "trackingNumber": null,
  "trackingUrl": null
}
```

### **Order with AWB:**
```json
{
  "orderId": "ORD1753775108960HB7BH", 
  "orderStatus": "confirmed",
  "shiprocketOrderId": "910618760",
  "shiprocketShipmentId": "906922174",
  "courierName": "DTDC Express",
  "trackingNumber": "AWB123456789",
  "trackingUrl": "https://tracking.example.com/..."
}
```

## 📱 **User Communication:**

### **Email/SMS Template:**
```
🎉 Order Confirmed!

Order ID: ORD1753775108960HB7BH
Shipment ID: 906922174

Your order is being processed. Tracking details will be sent once the courier picks up your package.

Thank you for your order!
```

### **When AWB becomes available:**
```
📦 Your package is on the way!

Order ID: ORD1753775108960HB7BH
AWB Number: AWB123456789
Courier: DTDC Express

Track your package: [LINK]

Estimated delivery: 3-5 days
```

## ✅ **Summary:**

- **"AWB not found" is normal** for new orders
- **AWB is assigned when courier picks up** the package
- **Show appropriate messages** based on order status
- **Keep users informed** about the process
- **Real tracking works** once AWB is assigned

This is the standard behavior for all e-commerce shipping systems! 🚚 