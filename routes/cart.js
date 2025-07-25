const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ Save or update cart
router.post('/update', async (req, res) => {
  const { userId, cart } = req.body;

  // Log the incoming request for debugging
  console.log('Received cart update:', { userId, cart });

  if (!userId) {
    console.error('Cart update error: Missing userId');
    return res.status(400).json({ message: 'User ID is required' });
  }

  if (!Array.isArray(cart)) {
    console.error('Cart update error: Cart is not an array', cart);
    return res.status(400).json({ message: 'Cart must be an array' });
  }

  try {
    // Validate and normalize cart items
    const normalizedCart = cart.map(item => {
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

      // Log any potential issues
      if (!normalizedItem.id || !normalizedItem.price || !normalizedItem.title) {
        console.warn('Potentially invalid cart item:', {
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
      console.error('Cart update error: Invalid cart items after normalization', normalizedCart);
      return res.status(400).json({ 
        message: 'Invalid cart items. Each item must have an ID, quantity, price, and title.',
        cart: normalizedCart
      });
    }

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
      console.error('Cart update error: User not found', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Send back the normalized cart
    res.status(200).json({ 
      message: 'Cart updated successfully',
      cart: updatedUser.cart 
    });
  } catch (error) {
    // Log detailed error information
    console.error('Cart update error:', {
      error: error.message,
      stack: error.stack,
      userId,
      cart
    });

    res.status(500).json({ 
      message: 'Error updating cart',
      error: error.message
    });
  }
});

// ✅ Load cart by user ID
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

    res.status(200).json({ cart: normalizedCart });
  } catch (error) {
    console.error('Error fetching cart:', {
      error: error.message,
      stack: error.stack,
      userId
    });
    
    res.status(500).json({ 
      message: 'Error fetching cart',
      error: error.message
    });
  }
});

module.exports = router;
