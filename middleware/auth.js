// Simple authentication middleware
// In production, you should use JWT tokens or session-based auth

const User = require('../models/User');

const authenticateUser = async (req, res, next) => {
  try {
    const userId = req.headers['user-id'] || req.body.userId || req.params.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. User ID is missing.'
      });
    }

    // Validate user ID format
    if (userId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Optional authentication - doesn't fail if user not found
const optionalAuth = async (req, res, next) => {
  try {
    const userId = req.headers['user-id'] || req.body.userId || req.params.userId;
    
    if (userId && userId.length === 24) {
      const user = await User.findById(userId);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue even if auth fails
  }
};

module.exports = {
  authenticateUser,
  optionalAuth
}; 