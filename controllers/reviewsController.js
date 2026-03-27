const Review = require('../models/Review');

const toReviewDto = (review) => ({
  id: String(review._id),
  customerName: String(review.customerName || 'Anonymous'),
  rating: Number(review.rating || 0),
  comment: String(review.comment || ''),
  productId: String(review.productId || ''),
  productName: String(review.productName || ''),
  externalId: String(review.externalId || ''),
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

exports.getReviews = async (req, res) => {
  try {
    const reviewType = String(req.query?.type || '').trim().toLowerCase();
    const limit = Number(req.query?.limit || 0);
    const query = {};

    if (reviewType === 'product') {
      query.productName = { $ne: '' };
    } else if (reviewType === 'website') {
      query.productName = '';
    }

    let findQuery = Review.find(query).sort({ createdAt: -1 });

    if (Number.isFinite(limit) && limit > 0) {
      findQuery = findQuery.limit(Math.floor(limit));
    }

    const reviews = await findQuery.lean();

    return res.status(200).json({
      success: true,
      data: reviews.map(toReviewDto),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load reviews',
      error: error.message,
    });
  }
};

exports.createReview = async (req, res) => {
  try {
    const customerName = String(req.body?.customerName || 'Anonymous').trim() || 'Anonymous';
    const comment = String(req.body?.comment || '').trim();
    const rawRating = Number(req.body?.rating || 0);
    const rating = Math.min(5, Math.max(1, Math.round(rawRating * 2) / 2));
    const productId = String(req.body?.productId || '').trim();
    const productName = String(req.body?.productName || '').trim();
    const externalId = String(req.body?.externalId || '').trim();

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'comment is required',
      });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'rating must be between 1 and 5',
      });
    }

    if (externalId) {
      const existing = await Review.findOne({ externalId }).lean();
      if (existing) {
        return res.status(200).json({
          success: true,
          data: toReviewDto(existing),
          message: 'Review already exists',
        });
      }
    }

    const created = await Review.create({
      customerName,
      rating,
      comment,
      productId,
      productName,
      externalId,
    });

    return res.status(201).json({
      success: true,
      data: toReviewDto(created),
      message: 'Review added successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message,
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const reviewId = String(req.params?.id || '').trim();

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: 'review id is required',
      });
    }

    const deleted = await Review.findByIdAndDelete(reviewId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: { id: reviewId },
      message: 'Review deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message,
    });
  }
};
