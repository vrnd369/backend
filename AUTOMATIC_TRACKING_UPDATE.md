# 🚚 Automatic Tracking Update System

## Overview

This system automatically updates order tracking details when payment is marked as "paid" and a Shiprocket shipment ID exists. It also provides manual refresh functionality for real-time tracking updates.

## 🔧 Implementation Details

### 1. Automatic Tracking Update

**Trigger:** When payment is verified and marked as "paid" in `POST /payment/verify-payment`

**Process:**
1. Check if payment status is "paid" and `shiprocketShipmentId` exists
2. Call Shiprocket tracking API: `GET /v1/external/courier/track?shipment_id=...`
3. Extract `awb_code`, `courier_name`, and `track_url` from response
4. Update order document fields:
   - `trackingNumber` (from `awb_code`)
   - `courierName` (from `courier_name`)
   - `trackingUrl` (from `track_url`)

### 2. Manual Refresh Tracking

**Endpoint:** `POST /orders/refresh-tracking/:orderId`

**Process:**
1. Verify order belongs to authenticated user
2. Check if `shiprocketShipmentId` exists
3. Call Shiprocket tracking API
4. Update order with new tracking details
5. Return updated order information

## 📋 API Endpoints

### Automatic Update (Payment Verification)
```
POST /payment/verify-payment
```
- **Authentication:** Required
- **Trigger:** Automatic after payment verification
- **Updates:** `trackingNumber`, `courierName`, `trackingUrl`

### Manual Refresh
```
POST /orders/refresh-tracking/:orderId
```
- **Authentication:** Required
- **Parameters:** `orderId` (path parameter)
- **Response:**
```json
{
  "status": "success",
  "message": "Tracking details refreshed successfully",
  "updated": true,
  "updates": {
    "trackingNumber": "1234567890",
    "courierName": "DTDC Express",
    "trackingUrl": "https://tracking.url"
  },
  "order": {
    "orderId": "ORD123456",
    "orderStatus": "confirmed",
    "shiprocketOrderId": "12345",
    "shiprocketShipmentId": "67890",
    "courierName": "DTDC Express",
    "trackingNumber": "1234567890",
    "trackingUrl": "https://tracking.url"
  }
}
```

### Get Shipment Details
```
GET /orders/:orderId/shipment-details
```
- **Authentication:** Required
- **Returns:** Complete shipment details including tracking information

## 🔄 Workflow

### Payment Flow with Automatic Tracking
1. User completes payment
2. `POST /payment/verify-payment` is called
3. Payment is verified and order status updated to "paid"
4. Shiprocket order is created
5. **Automatic tracking update is triggered**
6. Tracking details are fetched and updated in order
7. Response includes updated tracking information

### Manual Refresh Flow
1. User clicks "Refresh" on order tracking UI
2. `POST /orders/refresh-tracking/:orderId` is called
3. Latest tracking details are fetched from Shiprocket
4. Order is updated with new tracking information
5. Updated details are returned to frontend

## 🛡️ Error Handling

### Automatic Update Errors
- If tracking API fails, order creation continues
- Error is logged but doesn't affect payment verification
- User can manually refresh later

### Manual Refresh Errors
- Returns appropriate error messages
- Handles missing shipment IDs
- Validates order ownership

## 📊 Tracking Data Structure

### Order Document Fields
```javascript
{
  trackingNumber: String,    // AWB code from Shiprocket
  courierName: String,       // Courier name from Shiprocket
  trackingUrl: String,       // Tracking URL from Shiprocket
  shiprocketShipmentId: String, // Shiprocket shipment ID
  shiprocketOrderId: String  // Shiprocket order ID
}
```

### Shiprocket API Response
```javascript
{
  data: {
    awb_code: "1234567890",
    courier_name: "DTDC Express",
    track_url: "https://tracking.url"
  }
}
```

## 🎯 Frontend Integration

### Automatic Updates
- No frontend action required
- Tracking details are automatically available after payment
- Check `shipmentDetails` in order response

### Manual Refresh
```javascript
// Call manual refresh
const refreshTracking = async (orderId) => {
  try {
    const response = await fetch(`/api/orders/refresh-tracking/${orderId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.updated) {
      // Update UI with new tracking details
      updateTrackingUI(data.order);
    } else {
      // Show "No updates available" message
      showNoUpdatesMessage();
    }
  } catch (error) {
    // Handle error
    showErrorMessage(error.message);
  }
};
```

### UI Components
```javascript
// Refresh button component
const RefreshTrackingButton = ({ orderId, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh(orderId);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <button 
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="refresh-tracking-btn"
    >
      {isRefreshing ? 'Refreshing...' : 'Refresh Tracking'}
    </button>
  );
};
```

## 🧪 Testing

### Test File: `test_automatic_tracking_update.js`
- Tests complete payment flow with automatic tracking
- Tests manual refresh functionality
- Verifies order history updates
- Tests error handling

### Test Commands
```bash
# Run the test
node test_automatic_tracking_update.js

# Expected output includes:
# ✅ Payment verification successful
# ✅ Automatic tracking update attempt
# ✅ Manual refresh tracking functionality
# ✅ Order history update verification
```

## ⚠️ Important Notes

1. **Timing:** Tracking details may not be immediately available for new orders
2. **Normal Behavior:** This is expected - tracking becomes available when courier picks up the package
3. **Error Resilience:** Automatic updates don't block payment verification
4. **User Experience:** Manual refresh provides immediate feedback to users
5. **Data Consistency:** All updates are atomic and logged for debugging

## 🔍 Monitoring

### Console Logs
- `🔄 Auto-updating tracking details for shipment: [shipmentId]`
- `✅ Auto-updated tracking number: [number]`
- `✅ Auto-updated courier name: [name]`
- `✅ Auto-updated tracking URL: [url]`
- `❌ Auto-tracking update failed: [error]`

### Database Updates
- All tracking updates are saved to the order document
- Updates are logged with timestamps
- Failed updates don't affect order creation

## 🚀 Deployment

### Backend Changes
1. Updated `utils/shiprocket.js` with `autoUpdateTrackingDetails()` method
2. Enhanced `routes/payment.js` with automatic tracking update
3. Added `routes/orders.js` with manual refresh endpoint

### Frontend Integration
1. Add refresh button to order tracking UI
2. Handle automatic updates in order response
3. Implement error handling for tracking failures
4. Show appropriate loading states

This system ensures that tracking details are automatically updated when available, while providing manual refresh capability for immediate user feedback. 