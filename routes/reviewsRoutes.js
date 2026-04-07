const express = require('express');
const router = express.Router();
const { 
  getReviews, 
  createReview, 
  deleteReview,
  getDeletedReviews,
  restoreReview,
  permanentlyDeleteOldReviews,
} = require('../controllers/reviewsController');

router.get('/', getReviews);
router.get('/deleted', getDeletedReviews);
router.post('/', createReview);
router.delete('/:id', deleteReview);
router.patch('/:id/restore', restoreReview);
router.post('/cleanup/old-deleted', permanentlyDeleteOldReviews);

module.exports = router;
