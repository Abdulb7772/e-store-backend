const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      trim: true,
      default: 'Anonymous',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    productId: {
      type: String,
      trim: true,
      default: '',
    },
    productName: {
      type: String,
      trim: true,
      default: '',
    },
    externalId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Review', reviewSchema);
