const mongoose = require('mongoose');

const declinedOrderSchema = new mongoose.Schema(
  {
    originalOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      trim: true,
      default: '',
    },
    declineReason: {
      type: String,
      trim: true,
      default: '',
    },
    declinedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    orderSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('DeclinedOrder', declinedOrderSchema);
