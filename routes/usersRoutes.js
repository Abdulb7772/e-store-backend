const express = require('express');
const multer = require('multer');
const router = express.Router();
const { updateProfile, getProfile, uploadProfilePicture, deleteProfilePicture } = require('../controllers/usersController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/upload-picture', protect, upload.single('profilePicture'), uploadProfilePicture);
router.delete('/profile-picture', protect, deleteProfilePicture);

module.exports = router;
