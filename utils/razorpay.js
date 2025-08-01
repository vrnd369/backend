const Razorpay = require('razorpay');
const crypto = require('crypto');

// Check if Razorpay keys are available
const hasRazorpayKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

// Initialize Razorpay instance
const razorpay = hasRazorpayKeys ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
}) : null;

// Verify webhook signature
const verifyWebhookSignature = (body, signature) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay key secret not available for signature verification');
      return false;
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body, 'utf8')
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

// Generate order ID for logging
const generateOrderId = () => {
  return 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

module.exports = {
  razorpay,
  verifyWebhookSignature,
  generateOrderId,
  hasRazorpayKeys
}; 