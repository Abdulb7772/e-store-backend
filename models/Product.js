const mongoose = require('mongoose');

const variantStockSchema = new mongoose.Schema(
  {
    color: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { _id: false },
);

const colorImageMapSchema = new mongoose.Schema(
  {
    color: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    subCategory: {
      type: String,
      trim: true,
      default: '',
    },
    dressType: {
      type: String,
      trim: true,
      default: '',
      alias: 'dresstype',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    salePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },
    promotionTag: {
      type: String,
      enum: ['', 'new-arrivals', 'top-sales'],
      default: '',
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    colors: {
      type: [String],
      default: [],
    },
    sizes: {
      type: [String],
      default: [],
    },
    variantStock: {
      type: [variantStockSchema],
      default: [],
    },
    colorImageMap: {
      type: [colorImageMapSchema],
      default: [],
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    coverImageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Product', productSchema);
