const DeclinedOrder = require('./DeclinedOrder');

async function storeDeclinedOrder(orderDoc, options = {}, session = null) {
  const declineReason = String(options?.declineReason || '').trim();

  const payload = {
    originalOrderId: orderDoc._id,
    orderNumber: String(orderDoc.orderNumber || '').trim(),
    declineReason,
    orderSnapshot: orderDoc.toObject ? orderDoc.toObject() : orderDoc,
  };

  const [doc] = await DeclinedOrder.create([payload], session ? { session } : undefined);
  return doc;
}

module.exports = {
  storeDeclinedOrder,
};
