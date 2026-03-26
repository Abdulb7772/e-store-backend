const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getProducts,
  createProduct,
  updateProduct,
  updateProductPromotionTag,
  applyProductSale,
  endProductSale,
  applyCategorySale,
  endCategorySale,
  updateProductStock,
  backfillProductDressType,
  deleteProduct,
  getOrders,
  getUsers,
} = require('../controllers/adminController');

// For now these are open to simplify local admin development.
// You can protect these with auth middleware once admin auth is wired:
// router.use(protect, admin);
router.get('/dashboard', getDashboard);
router.get('/products', getProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.put('/products/:id/promotion-tag', updateProductPromotionTag);
router.put('/products/:id/sale', applyProductSale);
router.put('/products/:id/sale/end', endProductSale);
router.put('/products/sale/category', applyCategorySale);
router.put('/products/sale/category/end', endCategorySale);
router.put('/products/:id/stock', updateProductStock);
router.post('/products/backfill/dress-type', backfillProductDressType);
router.delete('/products/:id', deleteProduct);
router.get('/orders', getOrders);
router.get('/users', getUsers);

module.exports = router;
