const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// --- CORS SETUP: Allow local and deployed frontend domains ---
// TODO: Replace 'https://your-frontend-domain.com' with your actual deployed frontend URL
const allowedOrigins = [
  'http://localhost:3000',
  'https://ottomanmitten.com'
];

// Place CORS middleware at the very top, before any routes
const app = express();
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

// ✅ Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'EMAIL_USER', 'EMAIL_PASS', 'GOOGLE_CLIENT_ID'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// ✅ Check for JWT_SECRET (optional for development)
if (!process.env.JWT_SECRET) {
  console.log('⚠️  JWT_SECRET not found. Using default secret for development.');
  console.log('   Add JWT_SECRET to your .env file for production.');
  process.env.JWT_SECRET = 'development-jwt-secret-change-in-production';
}

// ✅ Check for optional Razorpay variables
const razorpayVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
const missingRazorpayVars = razorpayVars.filter(envVar => !process.env[envVar]);

if (missingRazorpayVars.length > 0) {
  console.log('⚠️  Razorpay keys not found. Payment features will be disabled.');
  console.log('   Missing:', missingRazorpayVars.join(', '));
  console.log('   Add these to enable payment functionality.');
}

app.use(bodyParser.json());

// Handle preflight requests
app.options('*', cors());

// ✅ MongoDB connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Atlas connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('🔁 Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Route registration with logging and validation
function safeUse(path, router) {
  if (!path || typeof path !== 'string' || !path.trim()) {
    console.error('❌ Attempted to register route with invalid path:', path);
    return;
  }
  console.log('Registering route:', path);
  app.use(path, router);
}

// ✅ Routes - Support both /api/* and /* patterns for frontend compatibility
safeUse('/api/auth', require('./routes/auth'));
safeUse('/auth', require('./routes/auth')); // Add support for /auth/* endpoints
safeUse('/api/cart', require('./routes/cart'));
safeUse('/cart', require('./routes/cart')); // Add support for /cart/* endpoints
safeUse('/api/wishlist', require('./routes/wishlist'));
safeUse('/wishlist', require('./routes/wishlist')); // Add support for /wishlist/* endpoints
safeUse('/api/contact', require('./routes/contact'));
safeUse('/contact', require('./routes/contact')); // Add support for /contact/* endpoints
safeUse('/api/payment', require('./routes/payment'));
safeUse('/payment', require('./routes/payment')); // Add support for /payment/* endpoints

// ✅ Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Root route
app.get('/', (req, res) => {
  res.send('🎯 Backend server is running and MongoDB Atlas is connected!');
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
});

// Catch-all route to log malformed requests and prevent crash
app.use('*', (req, res) => {
  console.error('❌ Malformed or unknown route requested:', req.originalUrl);
  res.status(404).json({
    status: 'error',
    message: 'Route not found or malformed',
    requested: req.originalUrl
  });
});

app.use(express.static(path.join(__dirname, 'public')));
