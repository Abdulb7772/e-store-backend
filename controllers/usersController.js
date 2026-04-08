const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// @desc    Upload profile picture
// @route   POST /api/users/upload-picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = req.file.originalname.split('.').pop();
    const filename = `profile-${userId}-${timestamp}.${fileExtension}`;
    const filepath = path.join(uploadsDir, filename);

    console.log('[Users Controller] Uploading profile picture:', {
      userId,
      filename,
      filepath,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
      uploadsDir,
    });

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('[Users Controller] Created uploads directory:', uploadsDir);
    }

    // Save file
    fs.writeFileSync(filepath, req.file.buffer);
    console.log('[Users Controller] File saved successfully');

    // Verify file exists
    const fileExists = fs.existsSync(filepath);
    console.log('[Users Controller] File exists after save:', fileExists);

    // Generate public URL - use relative path for local development
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const imageUrl = `${backendUrl}/public/uploads/${filename}`;

    console.log('[Users Controller] Image URL config:', {
      BACKEND_URL: process.env.BACKEND_URL,
      backendUrl,
      filename,
      imageUrl,
    });

    // Update user with image URL
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: imageUrl },
      { new: true }
    );

    console.log('[Users Controller] User updated with profilePicture');

    res.status(200).json({
      success: true,
      message: 'Picture uploaded successfully',
      data: {
        profilePicture: imageUrl,
      },
    });
  } catch (error) {
    console.error('[Users Controller] Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading picture',
      error: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email, phone, address, profilePicture } = req.body;

    // Fetch current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update only provided fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phoneNumber = phone; // phoneNumber in DB, phone in request
    if (address !== undefined) user.address = address;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    // Save updated user
    await user.save();

    // Return updated user
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        emailPhone: user.emailPhone,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailPhone, // Map emailPhone to email for frontend
        phone: user.phoneNumber, // Map phoneNumber to phone for frontend
        address: user.address,
        profilePicture: user.profilePicture,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message,
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Clear invalid localhost URLs from profile pictures
    if (user.profilePicture && user.profilePicture.includes('localhost')) {
      console.log('[Users Controller] Clearing invalid localhost profilePicture URL:', user.profilePicture);
      user.profilePicture = null;
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        emailPhone: user.emailPhone,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailPhone,
        phone: user.phoneNumber,
        address: user.address,
        profilePicture: user.profilePicture,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message,
    });
  }
};

// @desc    Delete profile picture
// @route   DELETE /api/users/profile-picture
// @access  Private
exports.deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture to delete',
      });
    }

    // Extract filename from URL
    const filename = user.profilePicture.split('/').pop();
    const filepath = path.join(uploadsDir, filename);

    console.log('[Users Controller] Deleting profile picture:', {
      userId,
      profilePicture: user.profilePicture,
      filename,
      filepath,
    });

    // Delete file from filesystem if it exists
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log('[Users Controller] File deleted successfully:', filepath);
    }

    // Remove profilePicture from user document
    user.profilePicture = null;
    await user.save();

    console.log('[Users Controller] User profilePicture cleared from database');

    res.status(200).json({
      success: true,
      message: 'Profile picture deleted successfully',
      data: {
        profilePicture: null,
      },
    });
  } catch (error) {
    console.error('[Users Controller] Delete picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting profile picture',
      error: error.message,
    });
  }
};
