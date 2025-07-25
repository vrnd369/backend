const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Save or update wishlist
router.post('/update', async (req, res) => {
  const { userId, wishlist } = req.body;

  // Log the incoming request for debugging
  console.log('Received wishlist update:', { userId, wishlist });

  if (!userId) {
    console.error('Wishlist update error: Missing userId');
    return res.status(400).json({ message: 'User ID is required' });
  }

  if (!Array.isArray(wishlist)) {
    console.error('Wishlist update error: Wishlist is not an array', wishlist);
    return res.status(400).json({ message: 'Wishlist must be an array' });
  }

  try {
    // Validate wishlist items
    const validWishlist = wishlist.every(item => {
      const hasValidId = (item && (item.id || item.productId));
      const hasValidPrice = (item && typeof item.price === 'number' && item.price >= 0);
      const hasValidTitle = (item && typeof item.title === 'string');
      
      if (!hasValidId || !hasValidPrice || !hasValidTitle) {
        console.warn('Invalid wishlist item:', {
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
      console.error('Wishlist update error: Invalid wishlist items', wishlist);
      return res.status(400).json({ 
        message: 'Invalid wishlist items. Each item must have an ID, price, and title.',
        wishlist 
      });
    }

    // Normalize wishlist items to have consistent structure
    const normalizedWishlist = wishlist.map(item => ({
      id: item.id || item.productId,
      productId: item.id || item.productId,
      price: item.price,
      title: item.title,
      img: item.img || '',
      description: item.description || 'Premium quality product'
    }));

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
      console.error('Wishlist update error: User not found', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
      message: 'Wishlist updated successfully',
      wishlist: updatedUser.wishlist 
    });
  } catch (error) {
    console.error('Error updating wishlist:', error, { userId, wishlist });
    res.status(500).json({ 
      message: 'Error updating wishlist', 
      error: error.message,
      userId,
      wishlist
    });
  }
});

// Load wishlist by user ID
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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

    res.status(200).json({ wishlist: normalizedWishlist });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ 
      message: 'Error fetching wishlist', 
      error: error.message 
    });
  }
});

module.exports = router; 