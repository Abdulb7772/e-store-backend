const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    color: { type: String, trim: true },
    size: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'Order requires at least one item',
      },
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'cash'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    stripePaymentIntentId: { type: String, trim: true },
    subtotal: { type: Number, required: true, min: 0 },
    codFee: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'confirmed',
    },
    approved: {
      type: Boolean,
      default: false,
    },
    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Order', orderSchema);
