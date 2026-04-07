const DeclinedOrder = require('../models/DeclinedOrder');

async function storeDeclinedOrder(order, declineReason = '', session = null) {
  const declineReasonStr = String(declineReason || '').trim();

  const payload = {
    originalOrderId: order._id,
    orderNumber: String(order.orderNumber || '').trim(),
    declineReason: declineReasonStr,
    orderSnapshot: order.toObject ? order.toObject() : order,
    declinedAt: new Date(),
  };

  const createOptions = session ? { session } : {};
  const [doc] = await DeclinedOrder.create([payload], createOptions);
  
  return doc;
}

module.exports = {
  storeDeclinedOrder,
};
