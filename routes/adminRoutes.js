const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getProducts,
  createProduct,
  getOrders,
  getUsers,
} = require('../controllers/adminController');

// For now these are open to simplify local admin development.
// You can protect these with auth middleware once admin auth is wired:
// router.use(protect, admin);
router.get('/dashboard', getDashboard);
router.get('/products', getProducts);
router.post('/products', createProduct);
router.get('/orders', getOrders);
router.get('/users', getUsers);

module.exports = router;
