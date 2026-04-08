const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { emailPhone, password, firstName, lastName, address, phoneNumber, role } = req.body;
    const allowedRoles = new Set(['customer', 'admin', 'staff', 'manager']);
    const normalizedRole = allowedRoles.has(role) ? role : 'customer';

    // Validate input
    if (!emailPhone || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ emailPhone });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email/phone',
      });
    }

    // Create user
    const user = await User.create({
      emailPhone,
      password,
      firstName,
      lastName,
      address,
      phoneNumber,
      role: normalizedRole,
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          _id: user._id,
          emailPhone: user.emailPhone,
          email: user.emailPhone,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          address: user.address,
          phone: user.phoneNumber,
          profilePicture: user.profilePicture,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/signin
// @access  Public
exports.signin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password',
      });
    }

    // Check for user (can login with username, email, or phone)
    const user = await User.findOne({
      $or: [
        { username },
        { emailPhone: username },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        emailPhone: user.emailPhone,
        email: user.emailPhone,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        phone: user.phoneNumber,
        profilePicture: user.profilePicture,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error signing in',
      error: error.message,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        emailPhone: user.emailPhone,
        email: user.emailPhone,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        phone: user.phoneNumber,
        profilePicture: user.profilePicture,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message,
    });
  }
};
