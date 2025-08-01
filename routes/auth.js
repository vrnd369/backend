const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sendOTPEmail = require('../utils/mailer'); // Function to send OTP email
const { saveOTP, verifyOTP } = require('../utils/otpStore'); // In-memory OTP store
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// JWT Secret - in production, use a strong secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('🔐 Authentication attempt:', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    endpoint: req.originalUrl
  });

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ 
      status: 'error',
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log('❌ Token verification failed:', err.message);
      return res.status(403).json({ 
        status: 'error',
        message: 'Invalid or expired token' 
      });
    }

    try {
      console.log('🔍 Looking up user with ID:', decoded.userId);
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        console.log('❌ User not found for ID:', decoded.userId);
        return res.status(404).json({ 
          status: 'error',
          message: 'User not found' 
        });
      }
      
      console.log('✅ User authenticated:', {
        userId: user._id,
        firstName: user.firstName,
        email: user.email,
        hasShippingAddress: !!user.shippingAddress,
        hasBillingAddress: !!user.billingAddress
      });
      
      req.user = user;
      next();
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return res.status(500).json({ 
        status: 'error',
        message: 'Authentication failed' 
      });
    }
  });
};

// Send OTP Route
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ 
    status: 'error',
    message: 'Email is required' 
  });

  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid email format' 
      });
    }

    // Generate 6-digit OTP as string
    const otp = crypto.randomInt(100000, 999999).toString();
    console.log('Generated OTP for:', email);

    // Send OTP email
    await sendOTPEmail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`
    });
    console.log('OTP email sent successfully to:', email);

    // Save OTP in in-memory store with timestamp
    saveOTP(email, otp);
    console.log('OTP saved to store for:', email);

    res.status(200).json({ 
      status: 'success',
      message: 'OTP sent to email' 
    });
  } catch (error) {
    console.error('Error in send-otp route:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to send OTP', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Verify OTP Route
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ 
    status: 'error',
    message: 'Email and OTP are required' 
  });

  const valid = verifyOTP(email, otp);
  if (valid) {
    return res.status(200).json({ 
      status: 'success',
      message: 'OTP verified' 
    });
  } else {
    return res.status(400).json({ 
      status: 'error',
      message: 'Invalid or expired OTP' 
    });
  }
});

// Signup Route - only after OTP verification in frontend
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password, phone, houseName, streetArea, city, state, country, pincode, profileDetails } = req.body;

  // Log incoming signup data
  console.log('Signup attempt:', { firstName, lastName, email, phone, houseName });

  try {
    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      console.error('Signup error: Missing required fields', { firstName, lastName, email, password });
      return res.status(400).json({ 
        status: 'error',
        message: 'Missing required fields',
        details: 'First name, last name, email, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Signup error: Invalid email format', email);
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid email format' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      console.error('Signup error: Password too short');
      return res.status(400).json({ 
        status: 'error',
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error('Signup error: User already exists', email);
      return res.status(400).json({ 
        status: 'error',
        message: 'User already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create full name from firstName and lastName
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || email.split('@')[0];

    // Build address object if address fields are provided
    let shippingAddress = null;
    let billingAddress = null;
    if (houseName && streetArea && city && state && country && pincode) {
      shippingAddress = { houseName, streetArea, city, state, country, pincode };
      billingAddress = { houseName, streetArea, city, state, country, pincode };
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone: phone || '',
      shippingAddress,
      billingAddress,
      profileDetails: profileDetails || null,
      cart: [],
      wishlist: []
    });

    await newUser.save();
    
    // Generate JWT token
    const token = generateToken(newUser._id);
    
    // Log successful signup
    console.log('User created successfully:', newUser);

    // Extract flat address fields for frontend navbar convenience
    const shippingAddressObj = newUser.shippingAddress || {};
    const billingAddressObj = newUser.billingAddress || {};
    
    // Return success with token and full user object including flat address fields
    res.status(201).json({ 
      status: 'success',
      message: 'User created successfully',
      token: token,
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        // Nested address objects
        shippingAddress: newUser.shippingAddress,
        billingAddress: newUser.billingAddress,
        // Flat address fields for frontend navbar
        houseName: shippingAddressObj.houseName || '',
        streetArea: shippingAddressObj.streetArea || '',
        city: shippingAddressObj.city || '',
        state: shippingAddressObj.state || '',
        country: shippingAddressObj.country || '',
        pincode: shippingAddressObj.pincode || '',
        // Other fields
        profileDetails: newUser.profileDetails,
        cart: newUser.cart,
        wishlist: newUser.wishlist,
        orderHistory: newUser.orderHistory,
        profilePic: newUser.profilePic,
        createdAt: newUser.createdAt
      }
    });
  } catch (err) {
    console.error('Signup error:', err, { firstName, lastName, email, phone, houseName });
    res.status(500).json({ 
      status: 'error',
      message: 'Server error during signup',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Login Route - Supports both email and mobile number
router.post('/login', async (req, res) => {
  const { email, password, mobile } = req.body;

  try {
    let user;
    
    // Check if login is by email or mobile
    if (email) {
      user = await User.findOne({ email });
    } else if (mobile) {
      user = await User.findOne({ phone: mobile });
    } else {
      return res.status(400).json({ 
        status: 'error',
        message: 'Email or mobile number is required' 
      });
    }

    if (!user) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid credentials' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Extract flat address fields for frontend navbar convenience
    const shippingAddress = user.shippingAddress || {};
    const billingAddress = user.billingAddress || {};
    
    // Return all user fields including flat address fields
    res.status(200).json({ 
      status: 'success',
      message: 'Login successful',
      token: token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        // Nested address objects
        shippingAddress: user.shippingAddress,
        billingAddress: user.billingAddress,
        // Flat address fields for frontend navbar
        houseName: shippingAddress.houseName || '',
        streetArea: shippingAddress.streetArea || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        country: shippingAddress.country || '',
        pincode: shippingAddress.pincode || '',
        // Other fields
        profileDetails: user.profileDetails,
        cart: user.cart,
        wishlist: user.wishlist,
        orderHistory: user.orderHistory,
        profilePic: user.profilePic,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error', 
      error: err.message 
    });
  }
});

// Mobile Login Route (for explicit mobile number login)
router.post('/mobile-login', async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Mobile number and password are required' 
    });
  }

  try {
    const user = await User.findOne({ phone: mobile });
    if (!user) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid mobile number or password' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid mobile number or password' 
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Extract flat address fields for frontend navbar convenience
    const shippingAddress = user.shippingAddress || {};
    const billingAddress = user.billingAddress || {};
    
    // Return all user fields including flat address fields
    res.status(200).json({ 
      status: 'success',
      message: 'Mobile login successful',
      token: token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        // Nested address objects
        shippingAddress: user.shippingAddress,
        billingAddress: user.billingAddress,
        // Flat address fields for frontend navbar
        houseName: shippingAddress.houseName || '',
        streetArea: shippingAddress.streetArea || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        country: shippingAddress.country || '',
        pincode: shippingAddress.pincode || '',
        // Other fields
        profileDetails: user.profileDetails,
        cart: user.cart,
        wishlist: user.wishlist,
        orderHistory: user.orderHistory,
        profilePic: user.profilePic,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Mobile login error:', err);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error', 
      error: err.message 
    });
  }
});

// Get current user profile (protected route)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 /auth/profile endpoint called for user:', req.user._id);
    
    const user = req.user;
    
    // Extract flat address fields for frontend navbar convenience
    const shippingAddress = user.shippingAddress || {};
    const billingAddress = user.billingAddress || {};
    
    // Log the address data being sent
    console.log('📦 Shipping address data:', JSON.stringify(shippingAddress, null, 2));
    console.log('📦 Flat address fields being sent:');
    console.log('  - firstName:', user.firstName);
    console.log('  - city:', shippingAddress.city || '');
    console.log('  - pincode:', shippingAddress.pincode || '');
    console.log('  - houseName:', shippingAddress.houseName || '');
    console.log('  - streetArea:', shippingAddress.streetArea || '');
    console.log('  - state:', shippingAddress.state || '');
    console.log('  - country:', shippingAddress.country || '');
    
    const responseData = {
      status: 'success',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        // Nested address objects
        shippingAddress: user.shippingAddress,
        billingAddress: user.billingAddress,
        // Flat address fields for frontend navbar
        houseName: shippingAddress.houseName || '',
        streetArea: shippingAddress.streetArea || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        country: shippingAddress.country || '',
        pincode: shippingAddress.pincode || '',
        // Other fields
        profileDetails: user.profileDetails,
        cart: user.cart,
        wishlist: user.wishlist,
        orderHistory: user.orderHistory,
        profilePic: user.profilePic,
        createdAt: user.createdAt
      }
    };
    
    console.log('✅ Sending profile response with navbar fields');
    res.status(200).json(responseData);
  } catch (err) {
    console.error('❌ Error in /auth/profile:', err);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch profile', 
      details: err.message 
    });
  }
});

// Update user profile (protected route)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Profile update request:', req.user._id, req.body);
    const { firstName, lastName, phone, profilePic, shippingAddress, billingAddress } = req.body;
    
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone, profilePic, shippingAddress, billingAddress },
      { new: true }
    ).select('-password');
    
    if (!updated) {
      console.log('User not found for ID:', req.user._id);
      return res.status(404).json({ 
        status: 'error',
        message: 'User not found' 
      });
    }
    
    // Extract flat address fields for frontend navbar convenience
    const shippingAddressObj = updated.shippingAddress || {};
    const billingAddressObj = updated.billingAddress || {};
    
    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      user: {
        _id: updated._id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        phone: updated.phone,
        // Nested address objects
        shippingAddress: updated.shippingAddress,
        billingAddress: updated.billingAddress,
        // Flat address fields for frontend navbar
        houseName: shippingAddressObj.houseName || '',
        streetArea: shippingAddressObj.streetArea || '',
        city: shippingAddressObj.city || '',
        state: shippingAddressObj.state || '',
        country: shippingAddressObj.country || '',
        pincode: shippingAddressObj.pincode || '',
        // Other fields
        profileDetails: updated.profileDetails,
        cart: updated.cart,
        wishlist: updated.wishlist,
        orderHistory: updated.orderHistory,
        profilePic: updated.profilePic,
        createdAt: updated.createdAt
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to update profile', 
      details: err.message 
    });
  }
});

// Update profile details (protected)
router.post('/update-profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, address, phoneNumber } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    // Only allow update if profileDetails is missing
    if (!user.profileDetails) {
      user.profileDetails = { fullName, address, phoneNumber };
      await user.save();
      return res.status(200).json({ status: 'success', message: 'Profile updated successfully', profileDetails: user.profileDetails });
    } else {
      // If profile already exists, do not overwrite
      return res.status(400).json({ status: 'error', message: 'Profile already completed' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Error updating profile' });
  }
});

// Get profile details (protected)
router.get('/get-profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
    const profileComplete = !!(user.profileDetails && user.profileDetails.fullName && user.profileDetails.address);
    res.status(200).json({ status: 'success', profileDetails: user.profileDetails, profileComplete });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Error fetching profile' });
  }
});

// Note: Duplicate routes removed - using the first implementation above

// Update user profile by userId (for frontend compatibility)
router.put('/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const { 
    firstName, 
    lastName, 
    phone, 
    profilePic, 
    shippingAddress, 
    billingAddress,
    // Flat address fields for frontend compatibility
    houseName,
    streetArea,
    city,
    state,
    country,
    pincode
  } = req.body;

  if (!userId || userId === 'undefined' || userId.length !== 24) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Invalid or missing userId',
      details: `Received userId: ${userId}`
    });
  }

  // Build address objects from flat fields if provided
  let finalShippingAddress = shippingAddress;
  let finalBillingAddress = billingAddress;
  
  if (houseName && streetArea && city && state && country && pincode) {
    const addressObject = { houseName, streetArea, city, state, country, pincode };
    finalShippingAddress = addressObject;
    finalBillingAddress = addressObject;
  }

  try {
    const updated = await User.findByIdAndUpdate(
      userId,
      { 
        firstName, 
        lastName, 
        phone, 
        profilePic, 
        shippingAddress: finalShippingAddress, 
        billingAddress: finalBillingAddress 
      },
      { new: true }
    ).select('-password');
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    
    // Extract flat address fields for frontend navbar convenience
    const shippingAddressObj = updated.shippingAddress || {};
    const billingAddressObj = updated.billingAddress || {};
    
    res.status(200).json({ 
      status: 'success', 
      message: 'Profile updated successfully', 
      user: {
        _id: updated._id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        phone: updated.phone,
        // Nested address objects
        shippingAddress: updated.shippingAddress,
        billingAddress: updated.billingAddress,
        // Flat address fields for frontend navbar
        houseName: shippingAddressObj.houseName || '',
        streetArea: shippingAddressObj.streetArea || '',
        city: shippingAddressObj.city || '',
        state: shippingAddressObj.state || '',
        country: shippingAddressObj.country || '',
        pincode: shippingAddressObj.pincode || '',
        // Other fields
        profileDetails: updated.profileDetails,
        cart: updated.cart,
        wishlist: updated.wishlist,
        orderHistory: updated.orderHistory,
        profilePic: updated.profilePic,
        createdAt: updated.createdAt
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update profile', details: err.message });
  }
});

// Google OAuth login endpoint
router.post('/google', async (req, res) => {
  const { credential, phone, houseName, streetArea, city, state, country, pincode, profileDetails } = req.body;
  
  if (!credential) {
    console.error('No credential provided in request');
    return res.status(400).json({ 
      status: 'error',
      message: 'No credential provided' 
    });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error('Google Client ID is not configured');
    return res.status(500).json({ 
      status: 'error',
      message: 'Server configuration error' 
    });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload.email) {
      throw new Error('No email provided in Google token');
    }

    let user = await User.findOne({ email: payload.email });
    const [firstName, ...lastNameParts] = (payload.name || '').split(' ');
    const lastName = lastNameParts.join(' ');

    // Build address object if address fields are provided
    let shippingAddress = null;
    let billingAddress = null;
    if (houseName && streetArea && city && state && country && pincode) {
      shippingAddress = { houseName, streetArea, city, state, country, pincode };
      billingAddress = { houseName, streetArea, city, state, country, pincode };
    }

    if (!user) {
      // Create new user with all available fields
      user = await User.create({
        firstName: firstName || '',
        lastName: lastName || '',
        email: payload.email,
        password: payload.sub, // Not used for Google login
        phone: phone || '',
        shippingAddress,
        billingAddress,
        profileDetails: profileDetails || null,
        cart: [],
        wishlist: [],
      });
    } else {
      // Update firstName/lastName and any new fields from frontend
      user = await User.findOneAndUpdate(
        { email: payload.email },
        {
          $set: {
            firstName: firstName || '',
            lastName: lastName || '',
            phone: phone || user.phone || '',
            shippingAddress: shippingAddress || user.shippingAddress || null,
            billingAddress: billingAddress || user.billingAddress || null,
            profileDetails: profileDetails || user.profileDetails || null
          }
        },
        { new: true }
      );
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return full user object
    res.status(200).json({ 
      status: 'success',
      message: 'Google authentication successful',
      token: token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        shippingAddress: user.shippingAddress,
        billingAddress: user.billingAddress,
        profileDetails: user.profileDetails,
        cart: user.cart,
        wishlist: user.wishlist,
        orderHistory: user.orderHistory,
        profilePic: user.profilePic,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ 
      status: 'error',
      message: 'Google authentication failed', 
      error: err.message
    });
  }
});

// One-time endpoint to update all users with missing firstName/lastName
router.post('/fix-names', async (req, res) => {
  try {
    const users = await User.find({});
    let updatedCount = 0;
    for (const user of users) {
      if ((!user.firstName || !user.lastName) && user.name) {
        const [firstName, ...lastNameParts] = user.name.split(' ');
        const lastName = lastNameParts.join(' ');
        user.firstName = firstName || '';
        user.lastName = lastName || '';
        await user.save();
        updatedCount++;
      }
    }
    res.json({ 
      status: 'success',
      message: `Updated ${updatedCount} users with firstName/lastName.` 
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error',
      message: err.message 
    });
  }
});

// Get user profile by ID (protected route)
router.get('/profile/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id.length !== 24) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid or missing user ID',
        details: `Received id: ${id}`
      });
    }
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ 
      status: 'error',
      message: 'User not found' 
    });
    
    // Extract flat address fields for frontend navbar convenience
    const shippingAddress = user.shippingAddress || {};
    const billingAddress = user.billingAddress || {};
    
    // Return all profile fields including flat address fields
    res.status(200).json({
      status: 'success',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        // Nested address objects
        shippingAddress: user.shippingAddress,
        billingAddress: user.billingAddress,
        // Flat address fields for frontend navbar
        houseName: shippingAddress.houseName || '',
        streetArea: shippingAddress.streetArea || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        country: shippingAddress.country || '',
        pincode: shippingAddress.pincode || '',
        // Other fields
        profileDetails: user.profileDetails,
        cart: user.cart,
        wishlist: user.wishlist,
        orderHistory: user.orderHistory,
        profilePic: user.profilePic,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch profile', 
      details: err.message 
    });
  }
});

// Update user profile by userId (for frontend compatibility)
router.put('/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const { 
    firstName, 
    lastName, 
    email, 
    phone, 
    profilePic, 
    shippingAddress, 
    billingAddress, 
    profileDetails, 
    cart, 
    wishlist, 
    orderHistory,
    // Flat address fields for frontend compatibility
    houseName,
    streetArea,
    city,
    state,
    country,
    pincode
  } = req.body;

  if (!userId || userId === 'undefined' || userId.length !== 24) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Invalid or missing userId',
      details: `Received userId: ${userId}`
    });
  }

  // Validate required fields
  if (!firstName || !lastName || !email) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields',
      details: 'firstName, lastName, and email are required'
    });
  }

  // Build address objects from flat fields if provided
  let finalShippingAddress = shippingAddress;
  let finalBillingAddress = billingAddress;
  
  if (houseName && streetArea && city && state && country && pincode) {
    const addressObject = { houseName, streetArea, city, state, country, pincode };
    finalShippingAddress = addressObject;
    finalBillingAddress = addressObject;
  }

  try {
    const updated = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        email,
        phone: phone || '',
        profilePic: profilePic || '',
        shippingAddress: finalShippingAddress || null,
        billingAddress: finalBillingAddress || null,
        profileDetails: profileDetails || null,
        cart: cart || [],
        wishlist: wishlist || [],
        orderHistory: orderHistory || []
      },
      { new: true }
    ).select('-password');
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    // Extract flat address fields for frontend navbar convenience
    const shippingAddress = updated.shippingAddress || {};
    const billingAddress = updated.billingAddress || {};
    
    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      user: {
        _id: updated._id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        phone: updated.phone,
        // Nested address objects
        shippingAddress: updated.shippingAddress,
        billingAddress: updated.billingAddress,
        // Flat address fields for frontend navbar
        houseName: shippingAddress.houseName || '',
        streetArea: shippingAddress.streetArea || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        country: shippingAddress.country || '',
        pincode: shippingAddress.pincode || '',
        // Other fields
        profileDetails: updated.profileDetails,
        cart: updated.cart,
        wishlist: updated.wishlist,
        orderHistory: updated.orderHistory,
        profilePic: updated.profilePic,
        createdAt: updated.createdAt
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update profile', details: err.message });
  }
});

module.exports = router;
