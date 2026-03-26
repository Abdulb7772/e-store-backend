const Stock = require('../models/Stock');

const sanitizeVariantStock = (variantStock = []) =>
  variantStock.map((item) => ({
    color: String(item.color || '').trim(),
    size: String(item.size || '').trim(),
    stock: Math.max(0, Math.floor(Number(item.stock) || 0)),
  }));

const totalFromVariantStock = (variantStock = []) =>
  variantStock.reduce((sum, item) => sum + Math.max(0, Number(item.stock) || 0), 0);

async function upsertProductStock(productId, variantStock) {
  const normalized = sanitizeVariantStock(variantStock);
  const totalStock = totalFromVariantStock(normalized);

  const doc = await Stock.findOneAndUpdate(
    { productId },
    {
      $set: {
        variantStock: normalized,
        totalStock,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  ).lean();

  return doc;
}

async function getStocksByProductIds(productIds) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return new Map();
  }

  const docs = await Stock.find({ productId: { $in: productIds } }).lean();
  return new Map(docs.map((doc) => [String(doc.productId), doc]));
}

async function deleteProductStock(productId) {
  await Stock.deleteOne({ productId });
}

module.exports = {
  upsertProductStock,
  getStocksByProductIds,
  deleteProductStock,
};
