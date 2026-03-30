const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const DeclinedOrder = require('../declined-orders/DeclinedOrder');

const normalizeVariantKey = (value = '') => String(value || '').trim().toLowerCase();
const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const restoreStockFromOrder = async (orderDoc, session) => {
  const items = Array.isArray(orderDoc?.items) ? orderDoc.items : [];
  if (items.length === 0) return;

  const restoreDemand = new Map();

  items.forEach((item) => {
    const productId = String(item?.productId || '').trim();
    if (!productId) return;

    const color = String(item?.color || '').trim();
    const size = String(item?.size || '').trim();
    const quantity = Math.max(1, Number(item?.quantity) || 1);
    const key = `${productId}__${normalizeVariantKey(color)}__${normalizeVariantKey(size)}`;

    const existing = restoreDemand.get(key);
    if (existing) {
      existing.quantity += quantity;
    } else {
      restoreDemand.set(key, { productId, color, size, quantity });
    }
  });

  if (restoreDemand.size === 0) return;

  const productIds = Array.from(new Set(Array.from(restoreDemand.values()).map((item) => item.productId)));

  const [products, stocks] = await Promise.all([
    Product.find({ _id: { $in: productIds } }).session(session),
    Stock.find({ productId: { $in: productIds } }).session(session),
  ]);

  const productMap = new Map(products.map((product) => [String(product._id), product]));
  const stockMap = new Map(stocks.map((stock) => [String(stock.productId), stock]));
  const nextVariantStockByProduct = new Map();

  for (const demand of restoreDemand.values()) {
    const productDoc = productMap.get(demand.productId);
    if (!productDoc) continue;

    if (!nextVariantStockByProduct.has(demand.productId)) {
      const stockDoc = stockMap.get(demand.productId);
      const sourceVariants = Array.isArray(stockDoc?.variantStock) && stockDoc.variantStock.length > 0
        ? stockDoc.variantStock
        : productDoc.variantStock;

      nextVariantStockByProduct.set(
        demand.productId,
        (Array.isArray(sourceVariants) ? sourceVariants : []).map((item) => ({
          color: String(item.color || '').trim(),
          size: String(item.size || '').trim(),
          stock: Math.max(0, Number(item.stock) || 0),
        })),
      );
    }

    const variants = nextVariantStockByProduct.get(demand.productId) || [];
    const variantIndex = variants.findIndex(
      (entry) =>
        normalizeVariantKey(entry.color) === normalizeVariantKey(demand.color)
        && normalizeVariantKey(entry.size) === normalizeVariantKey(demand.size),
    );

    if (variantIndex >= 0) {
      variants[variantIndex].stock += demand.quantity;
      continue;
    }

    variants.push({
      color: demand.color,
      size: demand.size,
      stock: demand.quantity,
    });
  }

  const stockBulkOps = [];
  const productBulkOps = [];

  for (const [productId, variants] of nextVariantStockByProduct.entries()) {
    const nextTotalStock = variants.reduce((sum, item) => sum + Math.max(0, Number(item.stock) || 0), 0);

    stockBulkOps.push({
      updateOne: {
        filter: { productId },
        update: {
          $set: {
            variantStock: variants,
            totalStock: nextTotalStock,
          },
        },
        upsert: true,
      },
    });

    productBulkOps.push({
      updateOne: {
        filter: { _id: productId },
        update: {
          $set: {
            variantStock: variants,
            stock: nextTotalStock,
          },
        },
      },
    });
  }

  if (stockBulkOps.length > 0) {
    await Stock.bulkWrite(stockBulkOps, { session });
  }

  if (productBulkOps.length > 0) {
    await Product.bulkWrite(productBulkOps, { session });
  }
};

const buildOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `EST-${timestamp}-${suffix}`;
};

exports.createOrder = async (req, res) => {
  try {
    const { customer, items, paymentMethod, paymentStatus, stripePaymentIntentId, subtotal, codFee, totalAmount } = req.body || {};

    if (!customer?.fullName || !customer?.email || !customer?.phone || !customer?.address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide complete customer details.',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required.',
      });
    }

    if (paymentMethod !== 'card' && paymentMethod !== 'cash') {
      return res.status(400).json({
        success: false,
        message: 'Payment method must be card or cash.',
      });
    }

    const TAX_RATE_CARD = 0.05;
    const TAX_RATE_CASH = 0.17;
    const DEFAULT_COD_FEE = 100;

    const normalizedItems = items.map((item) => {
      const quantity = Math.max(1, Math.round(Number(item.quantity || 1)));
      const price = Math.max(0, Number(item.price || 0));

      return {
        productId: String(item.productId || ''),
        name: String(item.name || '').trim(),
        brand: String(item.brand || '').trim(),
        imageUrl: String(item.imageUrl || '').trim(),
        color: String(item.color || 'Default').trim(),
        size: String(item.size || 'One Size').trim(),
        price,
        quantity,
      };
    });

    const computedSubtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const safeSubtotal = Number.isFinite(Number(subtotal)) && Number(subtotal) > 0
      ? Math.max(0, Number(subtotal))
      : computedSubtotal;

    const safeCodFee = paymentMethod === 'cash'
      ? (Number.isFinite(Number(codFee)) ? Math.max(0, Number(codFee)) : DEFAULT_COD_FEE)
      : 0;

    const providedTotal = Number(totalAmount);
    const inferredTax = safeSubtotal * (paymentMethod === 'card' ? TAX_RATE_CARD : TAX_RATE_CASH);
    const safeTotalAmount = Number.isFinite(providedTotal) && providedTotal > 0
      ? Math.max(0, providedTotal)
      : safeSubtotal + inferredTax + safeCodFee;

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const demandByVariant = new Map();

      normalizedItems.forEach((item) => {
        const productId = String(item.productId || '').trim();
        if (!productId) {
          throw new Error(`Product id is required for item ${item.name || 'unknown'}`);
        }

        const color = String(item.color || '').trim();
        const size = String(item.size || '').trim();
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const key = `${productId}__${normalizeVariantKey(color)}__${normalizeVariantKey(size)}`;

        const current = demandByVariant.get(key);
        if (current) {
          current.quantity += quantity;
        } else {
          demandByVariant.set(key, {
            productId,
            color,
            size,
            quantity,
          });
        }
      });

      const productIds = Array.from(
        new Set(Array.from(demandByVariant.values()).map((item) => item.productId)),
      );

      const [products, stocks] = await Promise.all([
        Product.find({ _id: { $in: productIds } }).session(session),
        Stock.find({ productId: { $in: productIds } }).session(session),
      ]);

      const productMap = new Map(products.map((product) => [String(product._id), product]));
      const stockMap = new Map(stocks.map((stock) => [String(stock.productId), stock]));
      const nextVariantStockByProduct = new Map();

      for (const demand of demandByVariant.values()) {
        const productDoc = productMap.get(demand.productId);
        if (!productDoc) {
          throw new Error(`Product not found for item ${demand.productId}`);
        }

        if (!nextVariantStockByProduct.has(demand.productId)) {
          const stockDoc = stockMap.get(demand.productId);
          const sourceVariants = Array.isArray(stockDoc?.variantStock) && stockDoc.variantStock.length > 0
            ? stockDoc.variantStock
            : productDoc.variantStock;

          nextVariantStockByProduct.set(
            demand.productId,
            (Array.isArray(sourceVariants) ? sourceVariants : []).map((item) => ({
              color: String(item.color || '').trim(),
              size: String(item.size || '').trim(),
              stock: Math.max(0, Number(item.stock) || 0),
            })),
          );
        }

        const currentVariants = nextVariantStockByProduct.get(demand.productId) || [];
        const variantIndex = currentVariants.findIndex(
          (item) =>
            normalizeVariantKey(item.color) === normalizeVariantKey(demand.color)
            && normalizeVariantKey(item.size) === normalizeVariantKey(demand.size),
        );

        if (variantIndex < 0) {
          throw new Error(
            `Variant not found for ${productDoc.name}: ${demand.color || 'N/A'} / ${demand.size || 'N/A'}`,
          );
        }

        const currentStock = Math.max(0, Number(currentVariants[variantIndex].stock) || 0);
        if (currentStock < demand.quantity) {
          throw new Error(
            `Insufficient stock for ${productDoc.name} (${demand.color || 'N/A'} / ${demand.size || 'N/A'})`,
          );
        }

        currentVariants[variantIndex].stock = currentStock - demand.quantity;
      }

      const stockBulkOps = [];
      const productBulkOps = [];

      for (const [productId, nextVariants] of nextVariantStockByProduct.entries()) {
        const nextTotalStock = nextVariants.reduce(
          (sum, item) => sum + Math.max(0, Number(item.stock) || 0),
          0,
        );

        stockBulkOps.push({
          updateOne: {
            filter: { productId },
            update: {
              $set: {
                variantStock: nextVariants,
                totalStock: nextTotalStock,
              },
            },
            upsert: true,
          },
        });

        productBulkOps.push({
          updateOne: {
            filter: { _id: productId },
            update: {
              $set: {
                variantStock: nextVariants,
                stock: nextTotalStock,
              },
            },
          },
        });
      }

      if (stockBulkOps.length > 0) {
        await Stock.bulkWrite(stockBulkOps, { session });
      }

      if (productBulkOps.length > 0) {
        await Product.bulkWrite(productBulkOps, { session });
      }

      const [order] = await Order.create([
        {
          orderNumber: buildOrderNumber(),
          customer: {
            fullName: String(customer.fullName).trim(),
            email: String(customer.email).trim(),
            phone: String(customer.phone).trim(),
            address: String(customer.address).trim(),
          },
          items: normalizedItems,
          paymentMethod,
          paymentStatus: paymentStatus === 'paid' ? 'paid' : 'pending',
          stripePaymentIntentId: stripePaymentIntentId ? String(stripePaymentIntentId) : undefined,
          subtotal: safeSubtotal,
          codFee: safeCodFee,
          totalAmount: safeTotalAmount,
          approved: false,
        },
      ], { session });

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        success: true,
        message: 'Order created successfully.',
        data: order,
      });
    } catch (transactionError) {
      await session.abortTransaction();
      session.endSession();

      const message = transactionError instanceof Error ? transactionError.message : 'Failed to create order.';
      return res.status(400).json({
        success: false,
        message,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create order.',
      error: error.message,
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order.',
      error: error.message,
    });
  }
};

exports.getOrderHistory = async (req, res) => {
  try {
    const email = String(req.query?.email || '').trim();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const safeEmailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const [activeOrders, declinedOrders] = await Promise.all([
      Order.find({ 'customer.email': safeEmailRegex }).sort({ createdAt: -1 }).lean(),
      DeclinedOrder.find({ 'orderSnapshot.customer.email': safeEmailRegex }).sort({ declinedAt: -1 }).lean(),
    ]);

    const normalizedActive = activeOrders.map((order) => ({
      id: String(order._id),
      orderNumber: String(order.orderNumber || '').trim(),
      status: String(order.status || '').trim().toLowerCase() === 'confirmed'
        ? 'waiting'
        : (String(order.status || '').trim().toLowerCase() || 'waiting'),
      paymentStatus: String(order.paymentStatus || '').trim().toLowerCase() || 'pending',
      paymentMethod: String(order.paymentMethod || '').trim().toLowerCase(),
      subtotal: Math.max(0, Number(order.subtotal) || 0),
      codFee: Math.max(0, Number(order.codFee) || 0),
      totalAmount: Math.max(0, Number(order.totalAmount) || 0),
      approved: Boolean(order.approved),
      approvedAt: order.approvedAt,
      createdAt: order.createdAt,
      items: Array.isArray(order.items) ? order.items : [],
      isDeclined: false,
      declineReason: '',
    }));

    const normalizedDeclined = declinedOrders.map((entry) => {
      const snapshot = entry.orderSnapshot || {};
      return {
        id: String(entry.originalOrderId || entry._id),
        orderNumber: String(entry.orderNumber || snapshot.orderNumber || '').trim(),
        status: 'declined',
        paymentStatus: String(snapshot.paymentStatus || 'pending').trim().toLowerCase(),
        paymentMethod: String(snapshot.paymentMethod || '').trim().toLowerCase(),
        subtotal: Math.max(0, Number(snapshot.subtotal) || 0),
        codFee: Math.max(0, Number(snapshot.codFee) || 0),
        totalAmount: Math.max(0, Number(snapshot.totalAmount) || 0),
        approved: Boolean(snapshot.approved),
        approvedAt: snapshot.approvedAt,
        createdAt: entry.declinedAt || snapshot.createdAt,
        items: Array.isArray(snapshot.items) ? snapshot.items : [],
        isDeclined: true,
        declineReason: String(entry.declineReason || '').trim(),
      };
    });

    const merged = [...normalizedActive, ...normalizedDeclined].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime() || 0;
      const bTime = new Date(b.createdAt || 0).getTime() || 0;
      return bTime - aTime;
    });

    return res.status(200).json({
      success: true,
      data: merged,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load order history',
      error: error.message,
    });
  }
};

exports.getOrderHistoryById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const email = String(req.query?.email || '').trim();

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order id is required',
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const safeEmailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const order = await Order.findOne({ _id: orderId, 'customer.email': safeEmailRegex }).lean();
    if (order) {
      return res.status(200).json({
        success: true,
        data: {
          id: String(order._id),
          orderNumber: String(order.orderNumber || '').trim(),
          status: String(order.status || '').trim().toLowerCase() === 'confirmed'
            ? 'waiting'
            : (String(order.status || '').trim().toLowerCase() || 'waiting'),
          paymentStatus: String(order.paymentStatus || '').trim().toLowerCase() || 'pending',
          paymentMethod: String(order.paymentMethod || '').trim().toLowerCase(),
          subtotal: Math.max(0, Number(order.subtotal) || 0),
          codFee: Math.max(0, Number(order.codFee) || 0),
          totalAmount: Math.max(0, Number(order.totalAmount) || 0),
          approved: Boolean(order.approved),
          approvedAt: order.approvedAt,
          createdAt: order.createdAt,
          items: Array.isArray(order.items) ? order.items : [],
          isDeclined: false,
          declineReason: '',
        },
      });
    }

    const declined = await DeclinedOrder.findOne({
      originalOrderId: orderId,
      'orderSnapshot.customer.email': safeEmailRegex,
    }).lean();

    if (!declined) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const snapshot = declined.orderSnapshot || {};

    return res.status(200).json({
      success: true,
      data: {
        id: String(declined.originalOrderId || declined._id),
        orderNumber: String(declined.orderNumber || snapshot.orderNumber || '').trim(),
        status: 'declined',
        paymentStatus: String(snapshot.paymentStatus || 'pending').trim().toLowerCase(),
        paymentMethod: String(snapshot.paymentMethod || '').trim().toLowerCase(),
        subtotal: Math.max(0, Number(snapshot.subtotal) || 0),
        codFee: Math.max(0, Number(snapshot.codFee) || 0),
        totalAmount: Math.max(0, Number(snapshot.totalAmount) || 0),
        approved: Boolean(snapshot.approved),
        approvedAt: snapshot.approvedAt,
        createdAt: declined.declinedAt || snapshot.createdAt,
        items: Array.isArray(snapshot.items) ? snapshot.items : [],
        isDeclined: true,
        declineReason: String(declined.declineReason || '').trim(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load order details',
      error: error.message,
    });
  }
};

exports.cancelOrderByUser = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { orderId } = req.params;
    const email = String(req.query?.email || req.body?.email || '').trim();

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order id is required',
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const safeEmailRegex = new RegExp(`^${escapeRegex(email)}$`, 'i');

    session.startTransaction();

    const order = await Order.findOne({
      _id: orderId,
      'customer.email': safeEmailRegex,
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const normalizedStatus = String(order.status || '').trim().toLowerCase();
    if (['shipped', 'delivered', 'cancelled'].includes(normalizedStatus)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'This order can no longer be cancelled',
      });
    }

    await restoreStockFromOrder(order, session);

    order.status = 'cancelled';
    await order.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      data: {
        id: String(order._id),
        status: 'cancelled',
      },
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};
