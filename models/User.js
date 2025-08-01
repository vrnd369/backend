const mongoose = require('mongoose');

const productItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  productId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  img: { type: String, default: '' },
  description: { type: String, default: 'Premium quality product' }
}, { _id: false });

const cartItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  productId: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: true, min: 0 },
  title: { type: String, required: true },
  img: { type: String, default: '' },
  description: { type: String, default: 'Premium quality product' }
}, { _id: false });

// Address schema for shipping and billing
const addressSchema = new mongoose.Schema({
  houseName: { type: String, required: true },
  streetArea: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  pincode: { type: String, required: true }
}, { _id: false });

// Order history schema
const orderHistorySchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  orderDate: { type: Date, default: Date.now },
  orderAmount: { type: Number, required: true },
  orderStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'authorized', 'captured', 'failed', 'refunded'],
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
}, { _id: false });

// Profile details schema
const profileDetailsSchema = new mongoose.Schema({
  fullName: { type: String },
  address: { type: String },
  // Add more fields as needed
  phoneNumber: { type: String },
  // You can add more profile fields here
}, { _id: false });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: { type: String, default: '' },
  shippingAddress: {
    type: addressSchema,
    default: null
  },
  billingAddress: {
    type: addressSchema,
    default: null
  },
  profilePic: { type: String, default: '' },
  profileDetails: {
    type: profileDetailsSchema,
    default: null
  },
  orderHistory: {
    type: [orderHistorySchema],
    default: []
  },
  wishlist: {
    type: [productItemSchema],
    default: []
  },
  cart: {
    type: [cartItemSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { 
  optimisticConcurrency: false // Disable version conflicts
});

module.exports = mongoose.model('User', userSchema);
