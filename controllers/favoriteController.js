const mongoose = require('mongoose');
const Favorite = require('../models/Favorite');
const Product = require('../models/Product');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get current user's favorites
// @route   GET /api/favorites
// @access  Private
exports.getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate('product')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: favorites.length,
      data: favorites,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites',
      error: error.message,
    });
  }
};

// @desc    Add product to current user's favorites
// @route   POST /api/favorites/:productId
// @access  Private
exports.addFavorite = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product id',
      });
    }

    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const favorite = await Favorite.findOneAndUpdate(
      { user: req.user._id, product: productId },
      { $setOnInsert: { user: req.user._id, product: productId } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).populate('product');

    res.status(200).json({
      success: true,
      message: 'Product added to favorites',
      data: favorite,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding favorite',
      error: error.message,
    });
  }
};

// @desc    Remove product from current user's favorites
// @route   DELETE /api/favorites/:productId
// @access  Private
exports.removeFavorite = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product id',
      });
    }

    const favorite = await Favorite.findOneAndDelete({
      user: req.user._id,
      product: productId,
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite item not found for this user',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product removed from favorites',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing favorite',
      error: error.message,
    });
  }
};
