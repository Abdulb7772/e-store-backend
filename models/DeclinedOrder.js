const mongoose = require('mongoose');

const declinedOrderSchema = new mongoose.Schema(
  {
    originalOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    orderNumber: String,
    declineReason: String,
    orderSnapshot: mongoose.Schema.Types.Mixed,
    declinedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('declinedorders', declinedOrderSchema);
