const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('🔐 Cart authentication attempt:', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    endpoint: req.originalUrl,
    method: req.method
  });

  if (!token) {
    console.log('❌ No token provided for cart operation');
    return res.status(401).json({ 
      status: 'error',
      message: 'Access token required' 
    });
  }

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log('❌ Token verification failed for cart:', err.message);
      return res.status(403).json({ 
        status: 'error',
        message: 'Invalid or expired token' 
      });
    }

    try {
      console.log('🔍 Looking up user for cart operation:', decoded.userId);
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        console.log('❌ User not found for cart operation:', decoded.userId);
        return res.status(404).json({ 
          status: 'error',
          message: 'User not found' 
        });
      }
      
      console.log('✅ User authenticated for cart operation:', {
        userId: user._id,
        firstName: user.firstName,
        email: user.email
      });
      
      req.user = user;
      next();
    } catch (error) {
      console.error('❌ Cart authentication error:', error);
      return res.status(500).json({ 
        status: 'error',
        message: 'Authentication failed' 
      });
    }
  });
};

// ✅ Save or update cart (now with authentication)
router.post('/update', authenticateToken, async (req, res) => {
  const { cart } = req.body;
  const userId = req.user._id;

  // Log the incoming request for debugging
  console.log('🛒 Cart update request received:', { 
    userId, 
    cartLength: cart ? cart.length : 0,
    cart: cart 
  });

  if (!cart) {
    console.error('❌ Cart update error: No cart data provided');
    return res.status(400).json({ 
      status: 'error',
      message: 'Cart data is required' 
    });
  }

  if (!Array.isArray(cart)) {
    console.error('❌ Cart update error: Cart is not an array', cart);
    return res.status(400).json({ 
      status: 'error',
      message: 'Cart must be an array' 
    });
  }

  try {
    // Validate and normalize cart items
    const normalizedCart = cart.map((item, index) => {
      console.log(`📦 Processing cart item ${index}:`, item);
      
      // Ensure all required fields exist with proper types
      const normalizedItem = {
        id: String(item.id || item.productId || ''),
        productId: String(item.id || item.productId || ''),
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        title: String(item.title || ''),
        img: String(item.img || ''),
        description: String(item.description || 'Premium quality product')
      };

      console.log(`✅ Normalized item ${index}:`, normalizedItem);

      // Log any potential issues
      if (!normalizedItem.id || !normalizedItem.price || !normalizedItem.title) {
        console.warn('⚠️ Potentially invalid cart item:', {
          original: item,
          normalized: normalizedItem
        });
      }

      return normalizedItem;
    });

    // Validate the normalized cart
    const validCart = normalizedCart.every(item => 
      item.id && 
      item.quantity > 0 && 
      item.price >= 0 && 
      item.title
    );

    if (!validCart) {
      console.error('❌ Cart update error: Invalid cart items after normalization', normalizedCart);
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid cart items. Each item must have an ID, quantity, price, and title.',
        cart: normalizedCart
      });
    }

    console.log('📋 Normalized cart ready for database:', normalizedCart);

    // Use findOneAndUpdate to avoid version conflicts
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { cart: normalizedCart },
      { 
        new: true, // Return the updated document
        runValidators: true, // Run schema validators
        upsert: false // Don't create if doesn't exist
      }
    );

    if (!updatedUser) {
      console.error('❌ Cart update error: User not found', userId);
      return res.status(404).json({ 
        status: 'error',
        message: 'User not found' 
      });
    }

    console.log('✅ Cart updated successfully for user:', userId);
    console.log('📦 Cart items count:', updatedUser.cart.length);
    console.log('📦 Cart items:', updatedUser.cart);
    
    // Verify cart was saved to user profile
    const verifyUser = await User.findById(userId);
    console.log('✅ Cart verification - User cart items:', verifyUser.cart.length);

    // Send back the normalized cart
    res.status(200).json({ 
      status: 'success',
      message: 'Cart updated successfully',
      cart: updatedUser.cart 
    });
  } catch (error) {
    // Log detailed error information
    console.error('❌ Cart update error:', {
      error: error.message,
      stack: error.stack,
      userId,
      cart
    });

    res.status(500).json({ 
      status: 'error',
      message: 'Error updating cart',
      error: error.message
    });
  }
});

// ✅ Load cart by user ID (now with authentication)
router.get('/my-cart', authenticateToken, async (req, res) => {
  const userId = req.user._id;

  console.log('🛒 Cart load request for user:', userId);

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ Cart load error: User not found', userId);
      return res.status(404).json({ 
        status: 'error',
        message: 'User not found' 
      });
    }

    console.log('📦 User cart from database:', user.cart);

    // Ensure cart items have consistent structure
    const normalizedCart = (user.cart || []).map(item => ({
      id: String(item.id || item.productId || ''),
      productId: String(item.id || item.productId || ''),
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      title: String(item.title || ''),
      img: String(item.img || ''),
      description: String(item.description || 'Premium quality product')
    }));

    console.log('✅ Cart loaded successfully for user:', userId);
    console.log('📦 Cart items count:', normalizedCart.length);
    console.log('📦 Normalized cart:', normalizedCart);

    res.status(200).json({ 
      status: 'success',
      cart: normalizedCart 
    });
  } catch (error) {
    console.error('❌ Error fetching cart:', {
      error: error.message,
      stack: error.stack,
      userId
    });
    
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching cart',
      error: error.message
    });
  }
});

// Keep the old route for backward compatibility
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  console.log('🛒 Cart load request (legacy) for user:', userId);

  if (!userId) {
    return res.status(400).json({ 
      status: 'error',
      message: 'User ID is required' 
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ Cart load error (legacy): User not found', userId);
      return res.status(404).json({ 
        status: 'error',
        message: 'User not found' 
      });
    }

    // Ensure cart items have consistent structure
    const normalizedCart = (user.cart || []).map(item => ({
      id: String(item.id || item.productId || ''),
      productId: String(item.id || item.productId || ''),
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      title: String(item.title || ''),
      img: String(item.img || ''),
      description: String(item.description || 'Premium quality product')
    }));

    console.log('✅ Cart loaded successfully (legacy) for user:', userId);
    console.log('📦 Cart items count:', normalizedCart.length);

    res.status(200).json({ 
      status: 'success',
      cart: normalizedCart 
    });
  } catch (error) {
    console.error('❌ Error fetching cart (legacy):', {
      error: error.message,
      stack: error.stack,
      userId
    });
    
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching cart',
      error: error.message
    });
  }
});

module.exports = router;
