const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('🔐 Wishlist authentication attempt:', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    endpoint: req.originalUrl,
    method: req.method
  });

  if (!token) {
    console.log('❌ No token provided for wishlist operation');
    return res.status(401).json({ 
      status: 'error',
      message: 'Access token required' 
    });
  }

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log('❌ Token verification failed for wishlist:', err.message);
      return res.status(403).json({ 
        status: 'error',
        message: 'Invalid or expired token' 
      });
    }

    try {
      console.log('🔍 Looking up user for wishlist operation:', decoded.userId);
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        console.log('❌ User not found for wishlist operation:', decoded.userId);
        return res.status(404).json({ 
          status: 'error',
          message: 'User not found' 
        });
      }
      
      console.log('✅ User authenticated for wishlist operation:', {
        userId: user._id,
        firstName: user.firstName,
        email: user.email
      });
      
      req.user = user;
      next();
    } catch (error) {
      console.error('❌ Wishlist authentication error:', error);
      return res.status(500).json({ 
        status: 'error',
        message: 'Authentication failed' 
      });
    }
  });
};

// Save or update wishlist (now with authentication)
router.post('/update', authenticateToken, async (req, res) => {
  const { wishlist } = req.body;
  const userId = req.user._id;

  // Log the incoming request for debugging
  console.log('💝 Wishlist update request received:', { 
    userId, 
    wishlistLength: wishlist ? wishlist.length : 0,
    wishlist: wishlist 
  });

  if (!wishlist) {
    console.error('❌ Wishlist update error: No wishlist data provided');
    return res.status(400).json({ 
      status: 'error',
      message: 'Wishlist data is required' 
    });
  }

  if (!Array.isArray(wishlist)) {
    console.error('❌ Wishlist update error: Wishlist is not an array', wishlist);
    return res.status(400).json({ 
      status: 'error',
      message: 'Wishlist must be an array' 
    });
  }

  try {
    // Validate wishlist items
    const validWishlist = wishlist.every((item, index) => {
      console.log(`💝 Processing wishlist item ${index}:`, item);
      
      const hasValidId = (item && (item.id || item.productId));
      const hasValidPrice = (item && typeof item.price === 'number' && item.price >= 0);
      const hasValidTitle = (item && typeof item.title === 'string');
      
      console.log(`✅ Wishlist item ${index} validation:`, {
        id: hasValidId,
        price: hasValidPrice,
        title: hasValidTitle
      });
      
      if (!hasValidId || !hasValidPrice || !hasValidTitle) {
        console.warn('⚠️ Invalid wishlist item:', {
          item,
          validations: {
            id: hasValidId,
            price: hasValidPrice,
            title: hasValidTitle
          }
        });
      }
      
      return hasValidId && hasValidPrice && hasValidTitle;
    });

    if (!validWishlist) {
      console.error('❌ Wishlist update error: Invalid wishlist items', wishlist);
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid wishlist items. Each item must have an ID, price, and title.',
        wishlist 
      });
    }

    // Normalize wishlist items to have consistent structure
    const normalizedWishlist = wishlist.map((item, index) => {
      const normalizedItem = {
        id: item.id || item.productId,
        productId: item.id || item.productId,
        price: item.price,
        title: item.title,
        img: item.img || '',
        description: item.description || 'Premium quality product'
      };
      
      console.log(`✅ Normalized wishlist item ${index}:`, normalizedItem);
      return normalizedItem;
    });

    console.log('📋 Normalized wishlist ready for database:', normalizedWishlist);

    // Use findOneAndUpdate to avoid version conflicts
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { wishlist: normalizedWishlist },
      { 
        new: true, // Return the updated document
        runValidators: true, // Run schema validators
        upsert: false // Don't create if doesn't exist
      }
    );

    if (!updatedUser) {
      console.error('❌ Wishlist update error: User not found', userId);
      return res.status(404).json({ 
        status: 'error',
        message: 'User not found' 
      });
    }

    console.log('✅ Wishlist updated successfully for user:', userId);
    console.log('💝 Wishlist items count:', updatedUser.wishlist.length);
    console.log('💝 Wishlist items:', updatedUser.wishlist);

    res.status(200).json({ 
      status: 'success',
      message: 'Wishlist updated successfully',
      wishlist: updatedUser.wishlist 
    });
  } catch (error) {
    console.error('❌ Error updating wishlist:', error, { userId, wishlist });
    res.status(500).json({ 
      status: 'error',
      message: 'Error updating wishlist', 
      error: error.message,
      userId,
      wishlist
    });
  }
});

// Load wishlist by user ID (now with authentication)
router.get('/my-wishlist', authenticateToken, async (req, res) => {
  const userId = req.user._id;

  console.log('💝 Wishlist load request for user:', userId);

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ Wishlist load error: User not found', userId);
      return res.status(404).json({ 
        status: 'error',
        message: 'User not found' 
      });
    }

    console.log('💝 User wishlist from database:', user.wishlist);

    // Ensure wishlist items have consistent structure
    const normalizedWishlist = (user.wishlist || []).map(item => ({
      id: item.id || item.productId,
      productId: item.id || item.productId,
      price: item.price,
      title: item.title,
      img: item.img || '',
      description: item.description || 'Premium quality product'
    }));

    console.log('✅ Wishlist loaded successfully for user:', userId);
    console.log('💝 Wishlist items count:', normalizedWishlist.length);
    console.log('💝 Normalized wishlist:', normalizedWishlist);

    res.status(200).json({ 
      status: 'success',
      wishlist: normalizedWishlist 
    });
  } catch (error) {
    console.error('❌ Error fetching wishlist:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching wishlist', 
      error: error.message 
    });
  }
});

// Keep the old route for backward compatibility
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  console.log('💝 Wishlist load request (legacy) for user:', userId);

  if (!userId) {
    return res.status(400).json({ 
      status: 'error',
      message: 'User ID is required' 
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ Wishlist load error (legacy): User not found', userId);
      return res.status(404).json({ 
        status: 'error',
        message: 'User not found' 
      });
    }

    // Ensure wishlist items have consistent structure
    const normalizedWishlist = (user.wishlist || []).map(item => ({
      id: item.id || item.productId,
      productId: item.id || item.productId,
      price: item.price,
      title: item.title,
      img: item.img || '',
      description: item.description || 'Premium quality product'
    }));

    console.log('✅ Wishlist loaded successfully (legacy) for user:', userId);
    console.log('💝 Wishlist items count:', normalizedWishlist.length);

    res.status(200).json({ 
      status: 'success',
      wishlist: normalizedWishlist 
    });
  } catch (error) {
    console.error('❌ Error fetching wishlist (legacy):', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching wishlist', 
      error: error.message 
    });
  }
});

module.exports = router; 