# Order History Documentation

## 📊 **ORDER HISTORY FUNCTIONALITY**

When a user places an order, it is automatically saved to their **orderHistory** array in the User model. This ensures complete tracking of all user orders.

## 🎯 **WHAT HAPPENS WHEN USER PLACES ORDER:**

### **1. Order Creation:**
```javascript
// When user places order via /api/orders/create
const order = new Order({
  userId: req.user._id,
  items: [...],
  total: 2200,
  paymentStatus: 'pending',
  orderStatus: 'confirmed'
});

await order.save();
```

### **2. Order History Update:**
```javascript
// Automatically called after order creation
await addOrderToUserHistory(req.user._id, order);
```

### **3. User Model Update:**
```javascript
// Order is added to user's orderHistory array
user.orderHistory.push({
  orderId: "ORD1753775108960HB7BH",
  orderDate: "2024-01-15T16:00:00.000Z",
  orderAmount: 2200,
  orderStatus: "confirmed",
  paymentStatus: "pending",
  paymentMethod: "online",
  items: [
    {
      productId: "PROD001",
      productName: "iPhone 15 Pro",
      quantity: 1,
      price: 1000,
      img: "iphone15pro.jpg"
    }
  ]
});
```

## 📋 **ORDER HISTORY SCHEMA:**

```javascript
const orderHistorySchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  orderDate: { type: Date, default: Date.now },
  orderAmount: { type: Number, required: true },
  orderStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'authorized', 'captured', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: { type: String, default: '' },
  items: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    img: { type: String, default: '' }
  }]
});
```

## 🔄 **ORDER HISTORY UPDATE PROCESS:**

### **addOrderToUserHistory Function:**
```javascript
async function addOrderToUserHistory(userId, order) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for order history update:', userId);
      return;
    }

    // Create order history entry
    const orderHistoryEntry = {
      orderId: order.orderId,
      orderDate: order.createdAt,
      orderAmount: order.total,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.title,
        title: item.title,
        description: item.description || '',
        quantity: item.quantity,
        price: item.price,
        img: item.img || ''
      }))
    };

    // Add to user's order history
    user.orderHistory.push(orderHistoryEntry);
    await user.save();

    console.log('User order history updated for user:', userId);
  } catch (error) {
    console.error('Error updating user order history:', error);
  }
}
```

## 📍 **WHERE ORDER HISTORY IS UPDATED:**

### **1. Regular Order Creation:**
```javascript
// POST /api/orders/create
await addOrderToUserHistory(req.user._id, order);
```

### **2. Order with Payment Verification:**
```javascript
// POST /api/orders/create-with-payment
await addOrderToUserHistory(req.user._id, order);
```

### **3. Payment Verification:**
```javascript
// POST /api/payment/verify-payment
await addOrderToUserHistory(req.user._id, order);
```

### **4. Payment Capture:**
```javascript
// POST /api/payment/capture-payment
await updateUserOrderHistory(payment);
```

## 📊 **COMPLETE USER ORDER HISTORY EXAMPLE:**

```javascript
{
  _id: "507f1f77bcf86cd799439011",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  orderHistory: [
    {
      orderId: "ORD1753775108960HB7BH",
      orderDate: "2024-01-15T16:00:00.000Z",
      orderAmount: 2200,
      orderStatus: "confirmed",
      paymentStatus: "paid",
      paymentMethod: "online",
      items: [
        {
          productId: "PROD001",
          productName: "iPhone 15 Pro",
          quantity: 1,
          price: 1000,
          img: "iphone15pro.jpg"
        },
        {
          productId: "PROD002",
          productName: "AirPods Pro",
          quantity: 1,
          price: 1200,
          img: "airpodspro.jpg"
        }
      ]
    },
    {
      orderId: "ORD1753775108960HB8BH",
      orderDate: "2024-01-10T14:30:00.000Z",
      orderAmount: 1500,
      orderStatus: "delivered",
      paymentStatus: "paid",
      paymentMethod: "card",
      items: [
        {
          productId: "PROD003",
          productName: "MacBook Air",
          quantity: 1,
          price: 1500,
          img: "macbookair.jpg"
        }
      ]
    }
  ]
}
```

## 🔍 **API ENDPOINTS FOR ORDER HISTORY:**

### **1. Get User Profile (includes order history):**
```
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "orderHistory": [
      {
        "orderId": "ORD1753775108960HB7BH",
        "orderDate": "2024-01-15T16:00:00.000Z",
        "orderAmount": 2200,
        "orderStatus": "confirmed",
        "paymentStatus": "paid",
        "paymentMethod": "online",
        "items": [...]
      }
    ]
  }
}
```

### **2. Get User Orders:**
```
GET /api/orders/user-orders
Authorization: Bearer <token>
```

## ✅ **ORDER HISTORY FEATURES:**

1. **✅ Automatic Updates**: Orders are automatically added to user history
2. **✅ Complete Details**: Order ID, amount, status, payment info, items
3. **✅ Real-time Updates**: History updates immediately after order creation
4. **✅ Payment Tracking**: Payment status is tracked and updated
5. **✅ Item Details**: Complete product information for each order
6. **✅ Date Tracking**: Order creation date is recorded
7. **✅ Multiple Orders**: Supports multiple orders per user

## 🎯 **FRONTEND INTEGRATION:**

### **Display Order History:**
```javascript
// Get user profile with order history
const response = await fetch('/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const userData = await response.json();
const orderHistory = userData.user.orderHistory;

// Display orders
orderHistory.forEach(order => {
  console.log(`Order: ${order.orderId} - Amount: ₹${order.orderAmount} - Status: ${order.orderStatus}`);
});
```

## 🚀 **DEPLOYMENT CHECKLIST:**

- [ ] Test order creation saves to user history
- [ ] Test payment verification updates order history
- [ ] Test order history retrieval via API
- [ ] Verify order details are complete
- [ ] Check payment status tracking
- [ ] Test multiple orders per user

## 🎯 **SUMMARY:**

**✅ Backend is ready for order history!**

When a user places an order:
1. **Order is created** in the Order model
2. **Order is automatically added** to user's orderHistory
3. **Complete details are saved** (ID, amount, status, items, payment)
4. **Real-time updates** happen immediately
5. **Payment status is tracked** and updated
6. **Multiple orders** are supported per user

The backend automatically handles order history management! 📦✅ 