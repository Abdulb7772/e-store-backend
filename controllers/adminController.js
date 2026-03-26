const Product = require('../models/Product');
const User = require('../models/User');
const {
  upsertProductStock,
  getStocksByProductIds,
  deleteProductStock,
} = require('../stocks/stockService');

const ALLOWED_PROMOTION_TAGS = new Set(['', 'new-arrivals', 'top-sales']);

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const roundToCurrency = (value) => Math.round(Number(value) * 100) / 100;

const makeSkuCandidate = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let value = 'SKU-';

  for (let i = 0; i < 8; i += 1) {
    value += chars[Math.floor(Math.random() * chars.length)];
  }

  return value;
};

const generateUniqueSku = async (usedSkus = new Set()) => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const sku = makeSkuCandidate();

    if (usedSkus.has(sku)) {
      continue;
    }

    const exists = await Product.exists({ sku });
    if (!exists) {
      usedSkus.add(sku);
      return sku;
    }
  }

  throw new Error('Unable to generate unique SKU');
};

const validateAndNormalizeVariantStock = (colors = [], sizes = [], variantStock = []) => {
  if (!Array.isArray(variantStock) || variantStock.length === 0) {
    return { error: 'variantStock is required' };
  }

  const requiredCombos = new Set();
  colors.forEach((color) => {
    sizes.forEach((size) => {
      requiredCombos.add(`${color}__${size}`);
    });
  });

  const normalizedVariantStock = [];
  const seenCombos = new Set();

  for (const entry of variantStock) {
    const color = String(entry.color || '');
    const size = String(entry.size || '');
    const stockValue = Number(entry.stock);
    const key = `${color}__${size}`;

    if (!requiredCombos.has(key)) {
      return { error: `Invalid color-size variant: ${color} / ${size}` };
    }

    if (!Number.isFinite(stockValue) || stockValue < 0) {
      return { error: `Invalid stock for variant: ${color} / ${size}` };
    }

    seenCombos.add(key);
    normalizedVariantStock.push({
      color,
      size,
      stock: Math.floor(stockValue),
    });
  }

  if (seenCombos.size !== requiredCombos.size) {
    return { error: 'Please provide stock for every selected color-size combination' };
  }

  const totalStock = normalizedVariantStock.reduce((sum, item) => sum + item.stock, 0);
  return { normalizedVariantStock, totalStock };
};

const normalizeColorImageMap = (colors = [], imageUrls = [], colorImageMap = []) => {
  if (!Array.isArray(colorImageMap) || colorImageMap.length === 0) {
    return [];
  }

  const allowedColors = new Set(colors.map((color) => String(color || '').trim().toLowerCase()));
  const allowedUrls = new Set(imageUrls.map((url) => String(url || '').trim()));
  const seenColors = new Set();
  const normalized = [];

  for (const entry of colorImageMap) {
    const color = String(entry?.color || '').trim();
    const imageUrl = String(entry?.imageUrl || '').trim();
    const colorKey = color.toLowerCase();

    if (!color || !imageUrl) {
      continue;
    }

    if (!allowedColors.has(colorKey) || !allowedUrls.has(imageUrl) || seenColors.has(colorKey)) {
      continue;
    }

    seenColors.add(colorKey);
    normalized.push({ color, imageUrl });
  }

  return normalized;
};

exports.getDashboard = async (req, res) => {
  try {
    const [totalProducts, totalUsers] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalRevenue: 0,
          totalOrders: 0,
          totalUsers,
          totalProducts,
        },
        revenueData: [],
        categoryData: [],
        recentOrders: [],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data',
      error: error.message,
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const category = String(req.query?.category || '').trim();
    const normalizedPromotionTag = String(req.query?.promotionTag || '').trim().toLowerCase();
    const limit = Number(req.query?.limit || 0);

    if (normalizedPromotionTag && !ALLOWED_PROMOTION_TAGS.has(normalizedPromotionTag)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid promotion tag filter',
      });
    }

    const query = {};

    if (category) {
      query.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
    }

    if (normalizedPromotionTag) {
      query.promotionTag = normalizedPromotionTag;
    }

    let productsQuery = Product.find(query).sort({ createdAt: -1 });

    if (Number.isFinite(limit) && limit > 0) {
      productsQuery = productsQuery.limit(Math.floor(limit));
    }

    const dbProducts = await productsQuery.lean();

    if (dbProducts.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const usedSkus = new Set(
      dbProducts
        .map((product) => String(product.sku || '').trim())
        .filter((sku) => sku.length > 0),
    );

    const skuHydratedProducts = [];
    for (const product of dbProducts) {
      if (product.sku && String(product.sku).trim().length > 0) {
        skuHydratedProducts.push(product);
        continue;
      }

      const sku = await generateUniqueSku(usedSkus);
      await Product.updateOne({ _id: product._id }, { $set: { sku } });
      skuHydratedProducts.push({ ...product, sku });
    }

    const stockMap = await getStocksByProductIds(skuHydratedProducts.map((product) => product._id));
    const hydratedProducts = skuHydratedProducts.map((product) => {
      const stockDoc = stockMap.get(String(product._id));

      if (!stockDoc) {
        return product;
      }

      return {
        ...product,
        variantStock: stockDoc.variantStock,
        stock: stockDoc.totalStock,
      };
    });

    return res.status(200).json({
      success: true,
      data: hydratedProducts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load products',
      error: error.message,
    });
  }
};

// @desc    Create product
// @route   POST /api/admin/products
// @access  Public (can be protected later)
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      brand,
      category,
      subCategory,
      price,
      colors,
      sizes,
      variantStock,
      colorImageMap,
      imageUrls,
      coverImageUrl,
      imageUrl,
    } = req.body;
    const dressType = req.body?.dressType ?? req.body?.dresstype;

    if (!name || !brand || !category) {
      return res.status(400).json({
        success: false,
        message: 'name, brand and category are required',
      });
    }

    if (!Array.isArray(colors) || colors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one color is required',
      });
    }

    if (!Array.isArray(sizes) || sizes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one size is required',
      });
    }

    if (!Array.isArray(variantStock) || variantStock.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'variantStock is required',
      });
    }

    const validation = validateAndNormalizeVariantStock(colors, sizes, variantStock);
    if (validation.error) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const { normalizedVariantStock, totalStock } = validation;

    const normalizedImageUrls = Array.isArray(imageUrls)
      ? imageUrls
          .map((url) => String(url || '').trim())
          .filter((url) => url.length > 0)
      : [];

    const normalizedCoverImage = String(coverImageUrl || imageUrl || '').trim();
    if (normalizedCoverImage && !normalizedImageUrls.includes(normalizedCoverImage)) {
      normalizedImageUrls.unshift(normalizedCoverImage);
    }

    const finalCoverImageUrl = normalizedCoverImage || normalizedImageUrls[0] || '';
    const normalizedColorImageMap = normalizeColorImageMap(colors, normalizedImageUrls, colorImageMap);
    const sku = await generateUniqueSku();

    const product = await Product.create({
      name: String(name).trim(),
      description: String(description || '').trim(),
      brand: String(brand).trim(),
      sku,
      category: String(category).trim(),
      subCategory: String(subCategory || '').trim(),
      dressType: String(dressType || '').trim(),
      price: Number(price),
      originalPrice: Number(price),
      salePercentage: 0,
      isOnSale: false,
      promotionTag: '',
      stock: totalStock,
      colors,
      sizes,
      colorImageMap: normalizedColorImageMap,
      imageUrls: normalizedImageUrls,
      coverImageUrl: finalCoverImageUrl,
      imageUrl: finalCoverImageUrl,
    });

    await upsertProductStock(product._id, normalizedVariantStock);

    return res.status(201).json({
      success: true,
      data: {
        ...product.toObject(),
        variantStock: normalizedVariantStock,
        stock: totalStock,
      },
      message: 'Product created successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    });
  }
};

// @desc    Update product
// @route   PUT /api/admin/products/:id
// @access  Public (can be protected later)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      brand,
      category,
      subCategory,
      price,
      colors,
      sizes,
      variantStock,
      colorImageMap,
      imageUrls,
      coverImageUrl,
      imageUrl,
    } = req.body;
    const dressType = req.body?.dressType ?? req.body?.dresstype;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product id is required',
      });
    }

    if (!name || !brand || !category) {
      return res.status(400).json({
        success: false,
        message: 'name, brand and category are required',
      });
    }

    if (!Array.isArray(colors) || colors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one color is required',
      });
    }

    if (!Array.isArray(sizes) || sizes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one size is required',
      });
    }

    if (!Array.isArray(variantStock) || variantStock.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'variantStock is required',
      });
    }

    const existingProduct = await Product.findById(id).lean();
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const validation = validateAndNormalizeVariantStock(colors, sizes, variantStock);
    if (validation.error) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const { normalizedVariantStock, totalStock } = validation;

    const normalizedImageUrls = Array.isArray(imageUrls)
      ? imageUrls
          .map((url) => String(url || '').trim())
          .filter((url) => url.length > 0)
      : [];

    const normalizedCoverImage = String(coverImageUrl || imageUrl || '').trim();
    if (normalizedCoverImage && !normalizedImageUrls.includes(normalizedCoverImage)) {
      normalizedImageUrls.unshift(normalizedCoverImage);
    }

    const finalCoverImageUrl = normalizedCoverImage || normalizedImageUrls[0] || '';
    const normalizedColorImageMap = normalizeColorImageMap(colors, normalizedImageUrls, colorImageMap);

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          name: String(name).trim(),
          description: String(description || '').trim(),
          brand: String(brand).trim(),
          category: String(category).trim(),
          subCategory: String(subCategory || '').trim(),
          dressType: String(dressType || '').trim(),
          price: Number(price),
          // Keep originalPrice in sync when product is not on sale.
          originalPrice: existingProduct.isOnSale ? existingProduct.originalPrice : Number(price),
          stock: totalStock,
          colors,
          sizes,
          colorImageMap: normalizedColorImageMap,
          imageUrls: normalizedImageUrls,
          coverImageUrl: finalCoverImageUrl,
          imageUrl: finalCoverImageUrl,
        },
      },
      { new: true },
    ).lean();

    await upsertProductStock(id, normalizedVariantStock);

    return res.status(200).json({
      success: true,
      data: {
        ...updatedProduct,
        variantStock: normalizedVariantStock,
        stock: totalStock,
      },
      message: 'Product updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message,
    });
  }
};

// @desc    Update promotion tag for a product
// @route   PUT /api/admin/products/:id/promotion-tag
// @access  Public (can be protected later)
exports.updateProductPromotionTag = async (req, res) => {
  try {
    const { id } = req.params;
    const normalizedTag = String(req.body?.promotionTag || '').trim().toLowerCase();

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product id is required',
      });
    }

    if (!ALLOWED_PROMOTION_TAGS.has(normalizedTag)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid promotion tag',
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: { promotionTag: normalizedTag } },
      { new: true },
    ).lean();

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedProduct,
      message: 'Promotion tag updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update promotion tag',
      error: error.message,
    });
  }
};

// @desc    Apply sale discount to one product
// @route   PUT /api/admin/products/:id/sale
// @access  Public (can be protected later)
exports.applyProductSale = async (req, res) => {
  try {
    const { id } = req.params;
    const discountPercentage = Number(req.body?.discountPercentage);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product id is required',
      });
    }

    if (!Number.isFinite(discountPercentage) || discountPercentage <= 0 || discountPercentage >= 100) {
      return res.status(400).json({
        success: false,
        message: 'discountPercentage must be a number between 0 and 100',
      });
    }

    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const basePrice = Number(product.originalPrice) > 0 ? Number(product.originalPrice) : Number(product.price);
    const discountedPrice = roundToCurrency(basePrice * (1 - discountPercentage / 100));

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          originalPrice: basePrice,
          salePercentage: discountPercentage,
          isOnSale: true,
          price: discountedPrice,
        },
      },
      { new: true },
    ).lean();

    return res.status(200).json({
      success: true,
      data: updatedProduct,
      message: 'Product added to sale successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to apply product sale',
      error: error.message,
    });
  }
};

// @desc    End sale for one product
// @route   PUT /api/admin/products/:id/sale/end
// @access  Public (can be protected later)
exports.endProductSale = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product id is required',
      });
    }

    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const restoredPrice = Number(product.originalPrice) > 0 ? Number(product.originalPrice) : Number(product.price);

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          price: restoredPrice,
          salePercentage: 0,
          isOnSale: false,
        },
      },
      { new: true },
    ).lean();

    return res.status(200).json({
      success: true,
      data: updatedProduct,
      message: 'Product sale ended successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to end product sale',
      error: error.message,
    });
  }
};

// @desc    Apply sale discount to all products in a category
// @route   PUT /api/admin/products/sale/category
// @access  Public (can be protected later)
exports.applyCategorySale = async (req, res) => {
  try {
    const category = String(req.body?.category || '').trim();
    const discountPercentage = Number(req.body?.discountPercentage);

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'category is required',
      });
    }

    if (!Number.isFinite(discountPercentage) || discountPercentage <= 0 || discountPercentage >= 100) {
      return res.status(400).json({
        success: false,
        message: 'discountPercentage must be a number between 0 and 100',
      });
    }

    const products = await Product.find({ category }).select('_id price originalPrice').lean();

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found for this category',
      });
    }

    const operations = products.map((product) => {
      const basePrice = Number(product.originalPrice) > 0 ? Number(product.originalPrice) : Number(product.price);
      const discountedPrice = roundToCurrency(basePrice * (1 - discountPercentage / 100));

      return {
        updateOne: {
          filter: { _id: product._id },
          update: {
            $set: {
              originalPrice: basePrice,
              salePercentage: discountPercentage,
              isOnSale: true,
              price: discountedPrice,
            },
          },
        },
      };
    });

    await Product.bulkWrite(operations);

    return res.status(200).json({
      success: true,
      data: {
        category,
        discountPercentage,
        updatedCount: products.length,
      },
      message: 'Category sale applied successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to apply category sale',
      error: error.message,
    });
  }
};

// @desc    End sale discount for all products in a category
// @route   PUT /api/admin/products/sale/category/end
// @access  Public (can be protected later)
exports.endCategorySale = async (req, res) => {
  try {
    const category = String(req.body?.category || '').trim();

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'category is required',
      });
    }

    const products = await Product.find({ category }).select('_id price originalPrice').lean();

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found for this category',
      });
    }

    const operations = products.map((product) => {
      const restoredPrice = Number(product.originalPrice) > 0 ? Number(product.originalPrice) : Number(product.price);

      return {
        updateOne: {
          filter: { _id: product._id },
          update: {
            $set: {
              price: restoredPrice,
              salePercentage: 0,
              isOnSale: false,
            },
          },
        },
      };
    });

    await Product.bulkWrite(operations);

    return res.status(200).json({
      success: true,
      data: {
        category,
        updatedCount: products.length,
      },
      message: 'Category sale ended successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to end category sale',
      error: error.message,
    });
  }
};

// @desc    Update product stock (separate stock storage)
// @route   PUT /api/admin/products/:id/stock
// @access  Public (can be protected later)
exports.updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { variantStock } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product id is required',
      });
    }

    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const validation = validateAndNormalizeVariantStock(product.colors || [], product.sizes || [], variantStock);
    if (validation.error) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const { normalizedVariantStock, totalStock } = validation;

    await upsertProductStock(id, normalizedVariantStock);
    await Product.findByIdAndUpdate(id, { $set: { stock: totalStock } });

    return res.status(200).json({
      success: true,
      data: {
        productId: id,
        variantStock: normalizedVariantStock,
        stock: totalStock,
      },
      message: 'Product stock updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update product stock',
      error: error.message,
    });
  }
};

// @desc    Backfill missing dressType values for legacy products
// @route   POST /api/admin/products/backfill/dress-type
// @access  Public (can be protected later)
exports.backfillProductDressType = async (req, res) => {
  try {
    const copiedLegacy = await Product.updateMany(
      {
        $and: [
          { dressType: { $exists: false } },
          { dresstype: { $exists: true } },
        ],
      },
      [
        {
          $set: {
            dressType: {
              $trim: {
                input: { $ifNull: ['$dresstype', ''] },
              },
            },
          },
        },
      ],
    );

    const filledMissing = await Product.updateMany(
      {
        $or: [{ dressType: { $exists: false } }, { dressType: null }],
      },
      {
        $set: { dressType: '' },
      },
    );

    return res.status(200).json({
      success: true,
      data: {
        copiedLegacy: copiedLegacy.modifiedCount || 0,
        filledMissing: filledMissing.modifiedCount || 0,
      },
      message: 'dressType backfill completed',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to backfill dressType',
      error: error.message,
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Public (can be protected later)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product id is required',
      });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await deleteProductStock(id);

    return res.status(200).json({
      success: true,
      data: deletedProduct,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message,
    });
  }
};

exports.getOrders = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: [],
  });
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('firstName lastName username emailPhone role isActive createdAt').sort({ createdAt: -1 }).lean();
    const normalizedUsers = users.map((user) => ({
      ...user,
      role: user.role === 'user' ? 'customer' : user.role,
    }));

    return res.status(200).json({
      success: true,
      data: normalizedUsers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load users',
      error: error.message,
    });
  }
};
