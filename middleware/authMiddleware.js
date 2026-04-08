const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('[Auth Middleware] Token received:', token.substring(0, 20) + '...');
      console.log('[Auth Middleware] JWT_SECRET exists:', !!process.env.JWT_SECRET);

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[Auth Middleware] Token decoded, user ID:', decoded.id);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      console.log('[Auth Middleware] User found:', req.user ? req.user._id : 'NOT FOUND');

      if (!req.user) {
        console.error('[Auth Middleware] User not found in database');
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      next();
    } catch (error) {
      console.error('[Auth Middleware] Error:', {
        name: error.name,
        message: error.message,
        token: token ? token.substring(0, 20) + '...' : 'NO TOKEN',
      });
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
        error: error.message,
      });
    }
  } else {
    console.error('[Auth Middleware] No Bearer token in Authorization header');
    console.error('[Auth Middleware] Headers:', req.headers);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
    });
  }
};

// Admin middleware
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized as admin',
    });
  }
};
