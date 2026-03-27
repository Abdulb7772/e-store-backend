const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    const cartItems = await Cart.find({ user: req.user._id })
      .populate('product')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cartItems.length,
      data: cartItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: error.message,
    });
  }
};

// @desc    Add product to current user's cart
// @route   POST /api/cart/:productId
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const requestedQty = Number(req.body.quantity);
    const quantity = Number.isFinite(requestedQty) && requestedQty > 0 ? Math.floor(requestedQty) : 1;

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

    const cartItem = await Cart.findOneAndUpdate(
      { user: req.user._id, product: productId },
      {
        $setOnInsert: { user: req.user._id, product: productId },
        $inc: { quantity },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).populate('product');

    res.status(200).json({
      success: true,
      message: 'Product added to cart',
      data: cartItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding product to cart',
      error: error.message,
    });
  }
};

// @desc    Update quantity for current user's cart item
// @route   PUT /api/cart/:productId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = Number(req.body.quantity);

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product id',
      });
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a number greater than or equal to 1',
      });
    }

    const cartItem = await Cart.findOneAndUpdate(
      { user: req.user._id, product: productId },
      { quantity: Math.floor(quantity) },
      { new: true },
    ).populate('product');

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found for this user',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      data: cartItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating cart item',
      error: error.message,
    });
  }
};

// @desc    Remove product from current user's cart
// @route   DELETE /api/cart/:productId
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product id',
      });
    }

    const cartItem = await Cart.findOneAndDelete({
      user: req.user._id,
      product: productId,
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found for this user',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product removed from cart',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing product from cart',
      error: error.message,
    });
  }
};
