const mongoose = require('mongoose');

// Address schema for shipping and billing
const addressSchema = new mongoose.Schema({
  houseName: { type: String, required: true },
  streetArea: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  pincode: { type: String, required: true }
}, { _id: false });

// Order items schema
const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: false }, // Made optional to accept title instead
  title: { type: String, required: false }, // Added to accept title from frontend
  description: { type: String, default: '' }, // Added description field
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  img: { type: String, default: '' }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  // Razorpay specific fields
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentId: {
    type: String,
    required: false, // Made optional - will be set during payment capture
    unique: true,
    sparse: true // Allows multiple null values
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Payment details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'authorized', 'captured', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: ''
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  
  // Order details
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  orderItems: {
    type: [orderItemSchema],
    required: true
  },
  orderTotal: {
    type: Number,
    required: true
  },
  
  // Address details
  shippingAddress: {
    type: addressSchema,
    required: true
  },
  billingAddress: {
    type: addressSchema,
    required: true
  },
  
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Webhook and security
  webhookStatus: {
    type: String,
    enum: ['received', 'verified', 'failed'],
    default: 'received'
  },
  signatureValid: {
    type: Boolean,
    default: false
  },
  razorpaySignature: {
    type: String,
    default: ''
  },
  
  // Additional fields
  couponCode: {
    type: String,
    default: ''
  },
  rewardPointsUsed: {
    type: Number,
    default: 0
  },
  
  // Error handling
  errorCode: {
    type: String
  },
  errorDescription: {
    type: String
  },
  
  // Timestamps
  capturedAt: {
    type: Date
  },
  refundedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
paymentSchema.index({ userId: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema); 