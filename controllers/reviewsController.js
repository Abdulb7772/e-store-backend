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
  deletedAt: review.deletedAt || undefined,
});

exports.getReviews = async (req, res) => {
  try {
    console.log('[Reviews Controller] GET /reviews', {
      type: req.query?.type,
      limit: req.query?.limit,
    });
    
    const reviewType = String(req.query?.type || '').trim().toLowerCase();
    const limit = Number(req.query?.limit || 0);
    const page = Math.max(1, Number(req.query?.page || 1));
    const query = { deletedAt: null };

    if (reviewType === 'product') {
      query.productName = { $ne: '' };
    } else if (reviewType === 'website') {
      query.productName = '';
    }

    const skip = (page - 1) * (limit || 10);
    let findQuery = Review.find(query).sort({ createdAt: -1 });

    if (Number.isFinite(limit) && limit > 0) {
      findQuery = findQuery.skip(skip).limit(Math.floor(limit));
    }

    const reviews = await findQuery.lean();
    const total = await Review.countDocuments(query);
    
    console.log('[Reviews Controller] Found', reviews.length, 'reviews (page', page, ')');

    return res.status(200).json({
      success: true,
      data: reviews.map(toReviewDto),
      pagination: {
        page,
        limit: limit || 10,
        total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      },
    });
  } catch (error) {
    console.error('[Reviews Controller] Error in getReviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load reviews',
      error: error.message,
    });
  }
};

exports.createReview = async (req, res) => {
  try {
    console.log('[Reviews Controller] POST /reviews', {
      body: req.body,
    });

    const customerName = String(req.body?.customerName || 'Anonymous').trim() || 'Anonymous';
    const comment = String(req.body?.comment || '').trim();
    const rawRating = Number(req.body?.rating || 0);
    const rating = Math.min(5, Math.max(1, Math.round(rawRating * 2) / 2));
    const productId = String(req.body?.productId || '').trim();
    const productName = String(req.body?.productName || '').trim();
    const externalId = String(req.body?.externalId || '').trim();

    if (!comment) {
      console.log('[Reviews Controller] Validation failed: missing comment');
      return res.status(400).json({
        success: false,
        message: 'comment is required',
      });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      console.log('[Reviews Controller] Validation failed: invalid rating', {
        rawRating,
        rating
      });
      return res.status(400).json({
        success: false,
        message: 'rating must be between 1 and 5',
      });
    }

    if (externalId) {
      const existing = await Review.findOne({ externalId }).lean();
      if (existing) {
        console.log('[Reviews Controller] Review already exists:', existing._id);
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

    console.log('[Reviews Controller] Review created successfully:', {
      id: created._id,
      customerName,
      rating,
    });

    return res.status(201).json({
      success: true,
      data: toReviewDto(created),
      message: 'Review added successfully',
    });
  } catch (error) {
    console.error('[Reviews Controller] Error in createReview:', error);
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

    console.log('[Reviews Controller] DELETE /reviews/:id', { id: reviewId });

    if (!reviewId) {
      console.log('[Reviews Controller] Validation failed: missing id');
      return res.status(400).json({
        success: false,
        message: 'review id is required',
      });
    }

    const deleted = await Review.findByIdAndUpdate(
      reviewId,
      { deletedAt: new Date() },
      { new: true }
    );

    if (!deleted) {
      console.log('[Reviews Controller] Review not found:', reviewId);
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    console.log('[Reviews Controller] Review soft deleted successfully:', reviewId);

    return res.status(200).json({
      success: true,
      data: { id: reviewId },
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('[Reviews Controller] Error in deleteReview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message,
    });
  }
};

exports.getDeletedReviews = async (req, res) => {
  try {
    console.log('[Reviews Controller] GET /reviews/deleted');
    
    const limit = Number(req.query?.limit || 10);
    const page = Math.max(1, Number(req.query?.page || 1));
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ deletedAt: { $ne: null } })
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Review.countDocuments({ deletedAt: { $ne: null } });

    console.log('[Reviews Controller] Found', reviews.length, 'deleted reviews');

    return res.status(200).json({
      success: true,
      data: reviews.map(toReviewDto),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Reviews Controller] Error in getDeletedReviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load deleted reviews',
      error: error.message,
    });
  }
};

exports.restoreReview = async (req, res) => {
  try {
    const reviewId = String(req.params?.id || '').trim();

    console.log('[Reviews Controller] RESTORE /reviews/:id', { id: reviewId });

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: 'review id is required',
      });
    }

    const restored = await Review.findByIdAndUpdate(
      reviewId,
      { deletedAt: null },
      { new: true }
    );

    if (!restored) {
      console.log('[Reviews Controller] Review not found:', reviewId);
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    console.log('[Reviews Controller] Review restored successfully:', reviewId);

    return res.status(200).json({
      success: true,
      data: toReviewDto(restored),
      message: 'Review restored successfully',
    });
  } catch (error) {
    console.error('[Reviews Controller] Error in restoreReview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to restore review',
      error: error.message,
    });
  }
};

exports.permanentlyDeleteOldReviews = async (req, res) => {
  try {
    console.log('[Reviews Controller] Permanently deleting reviews older than 1 month');

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const result = await Review.deleteMany({
      deletedAt: { $ne: null, $lte: oneMonthAgo },
    });

    console.log('[Reviews Controller] Permanently deleted', result.deletedCount, 'old reviews');

    return res.status(200).json({
      success: true,
      message: `Permanently deleted ${result.deletedCount} old reviews`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    console.error('[Reviews Controller] Error in permanentlyDeleteOldReviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to permanently delete old reviews',
      error: error.message,
    });
  }
};
