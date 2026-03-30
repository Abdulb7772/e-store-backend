const express = require('express');
const { createOrder, getOrderById, getOrderHistory, getOrderHistoryById, cancelOrderByUser } = require('../controllers/orderController');

const router = express.Router();

router.post('/', createOrder);
router.get('/history', getOrderHistory);
router.get('/history/:orderId', getOrderHistoryById);
router.post('/history/:orderId/cancel', cancelOrderByUser);
router.get('/:orderId', getOrderById);

module.exports = router;
