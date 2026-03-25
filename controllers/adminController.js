const Product = require('../models/Product');

const dashboardData = {
  stats: {
    totalRevenue: 409500,
    totalOrders: 2969,
    totalUsers: 8346,
    totalProducts: 1284,
    revenueGrowthPct: 18.2,
    ordersGrowthPct: 12.5,
    usersGrowthPct: 8.1,
    productsGrowthPct: -3.4,
  },
  revenueData: [
    { month: 'Jan', revenue: 18400, orders: 142 },
    { month: 'Feb', revenue: 22700, orders: 178 },
    { month: 'Mar', revenue: 19500, orders: 155 },
    { month: 'Apr', revenue: 27800, orders: 214 },
    { month: 'May', revenue: 31200, orders: 243 },
    { month: 'Jun', revenue: 28900, orders: 221 },
    { month: 'Jul', revenue: 35600, orders: 275 },
    { month: 'Aug', revenue: 33100, orders: 258 },
    { month: 'Sep', revenue: 39400, orders: 302 },
    { month: 'Oct', revenue: 42800, orders: 330 },
    { month: 'Nov', revenue: 51200, orders: 395 },
    { month: 'Dec', revenue: 58900, orders: 456 },
  ],
  categoryData: [
    { name: 'Men', value: 38 },
    { name: 'Women', value: 34 },
    { name: 'Kids', value: 16 },
    { name: 'Accessories', value: 12 },
  ],
  recentOrders: [
    { id: '#ORD-8521', customer: 'Sophia Williams', product: 'Classic Leather Jacket', amount: 189.99, status: 'Delivered', date: 'Dec 28, 2024' },
    { id: '#ORD-8520', customer: 'James Anderson', product: 'Slim Fit Chinos', amount: 64.99, status: 'Processing', date: 'Dec 28, 2024' },
    { id: '#ORD-8519', customer: 'Emily Johnson', product: 'Floral Summer Dress', amount: 79.99, status: 'Pending', date: 'Dec 27, 2024' },
    { id: '#ORD-8518', customer: 'Noah Martinez', product: 'Air Cushion Sneakers', amount: 129.99, status: 'Shipped', date: 'Dec 27, 2024' },
    { id: '#ORD-8517', customer: 'Ava Thomas', product: 'Cashmere Sweater', amount: 149.99, status: 'Delivered', date: 'Dec 26, 2024' },
    { id: '#ORD-8516', customer: 'Liam Brown', product: 'Denim Jacket', amount: 94.99, status: 'Cancelled', date: 'Dec 26, 2024' },
  ],
};

const products = [
  {
    id: 'PRD-001',
    name: 'Classic Leather Jacket',
    category: 'Men',
    subCategory: 'Jackets',
    brand: 'Zara',
    price: 189.99,
    stock: 42,
    colors: ['Black'],
    sizes: ['M', 'L', 'XL'],
    variantStock: [
      { color: 'Black', size: 'M', stock: 14 },
      { color: 'Black', size: 'L', stock: 16 },
      { color: 'Black', size: 'XL', stock: 12 },
    ],
    imageUrl: '',
  },
  {
    id: 'PRD-002',
    name: 'Slim Fit Chinos',
    category: 'Men',
    subCategory: 'Formals',
    brand: "Levi's",
    price: 64.99,
    stock: 87,
    colors: ['Navy', 'Beige'],
    sizes: ['S', 'M', 'L', 'XL'],
    variantStock: [
      { color: 'Navy', size: 'S', stock: 10 },
      { color: 'Navy', size: 'M', stock: 12 },
      { color: 'Navy', size: 'L', stock: 11 },
      { color: 'Navy', size: 'XL', stock: 9 },
      { color: 'Beige', size: 'S', stock: 12 },
      { color: 'Beige', size: 'M', stock: 13 },
      { color: 'Beige', size: 'L', stock: 11 },
      { color: 'Beige', size: 'XL', stock: 9 },
    ],
    imageUrl: '',
  },
];

const orders = [
  { id: '#ORD-8521', customer: 'Sophia Williams', email: 'sophia@email.com', product: 'Classic Leather Jacket', date: 'Dec 28, 2024', amount: 189.99, status: 'Delivered', items: 1 },
  { id: '#ORD-8520', customer: 'James Anderson', email: 'james@email.com', product: 'Slim Fit Chinos x 2', date: 'Dec 28, 2024', amount: 129.98, status: 'Processing', items: 2 },
  { id: '#ORD-8519', customer: 'Emily Johnson', email: 'emily@email.com', product: 'Floral Summer Dress', date: 'Dec 27, 2024', amount: 79.99, status: 'Pending', items: 1 },
  { id: '#ORD-8518', customer: 'Noah Martinez', email: 'noah@email.com', product: 'Air Cushion Sneakers', date: 'Dec 27, 2024', amount: 129.99, status: 'Shipped', items: 1 },
  { id: '#ORD-8517', customer: 'Ava Thomas', email: 'ava@email.com', product: 'Cashmere Sweater', date: 'Dec 26, 2024', amount: 149.99, status: 'Delivered', items: 1 },
  { id: '#ORD-8516', customer: 'Liam Brown', email: 'liam@email.com', product: 'Denim Jacket', date: 'Dec 26, 2024', amount: 94.99, status: 'Cancelled', items: 1 },
  { id: '#ORD-8515', customer: 'Mia Davis', email: 'mia@email.com', product: 'Running Shoes Pro + Tee', date: 'Dec 25, 2024', amount: 154.98, status: 'Delivered', items: 2 },
  { id: '#ORD-8514', customer: 'Oliver Wilson', email: 'oliver@email.com', product: 'Formal Blazer', date: 'Dec 25, 2024', amount: 179.99, status: 'Shipped', items: 1 },
  { id: '#ORD-8513', customer: 'Isabella Moore', email: 'isabella@email.com', product: 'Sequin Evening Gown', date: 'Dec 24, 2024', amount: 249.99, status: 'Delivered', items: 1 },
  { id: '#ORD-8512', customer: 'Ethan Clark', email: 'ethan@email.com', product: 'Kids Graphic Hoodie x 3', date: 'Dec 24, 2024', amount: 149.97, status: 'Processing', items: 3 },
  { id: '#ORD-8511', customer: 'Charlotte Lewis', email: 'charlotte@email.com', product: 'Crossbody Handbag', date: 'Dec 23, 2024', amount: 69.99, status: 'Delivered', items: 1 },
  { id: '#ORD-8510', customer: 'Benjamin Hall', email: 'ben@email.com', product: 'Pleated Midi Skirt', date: 'Dec 23, 2024', amount: 54.99, status: 'Pending', items: 1 },
];

const users = [
  { id: 'USR-0101', name: 'Sophia Williams', email: 'sophia@email.com', role: 'Customer', status: 'Active', orders: 12, spent: 1240.5, joined: 'Jan 12, 2024' },
  { id: 'USR-0102', name: 'James Anderson', email: 'james@email.com', role: 'Customer', status: 'Active', orders: 7, spent: 680, joined: 'Feb 3, 2024' },
  { id: 'USR-0103', name: 'Emily Johnson', email: 'emily@email.com', role: 'Moderator', status: 'Active', orders: 3, spent: 215, joined: 'Mar 18, 2024' },
  { id: 'USR-0104', name: 'Noah Martinez', email: 'noah@email.com', role: 'Customer', status: 'Suspended', orders: 2, spent: 130, joined: 'Apr 5, 2024' },
  { id: 'USR-0105', name: 'Ava Thomas', email: 'ava@email.com', role: 'Customer', status: 'Active', orders: 18, spent: 2310.75, joined: 'Jan 29, 2024' },
  { id: 'USR-0106', name: 'Liam Brown', email: 'liam@email.com', role: 'Customer', status: 'Pending', orders: 0, spent: 0, joined: 'Dec 20, 2024' },
  { id: 'USR-0107', name: 'Mia Davis', email: 'mia@email.com', role: 'Customer', status: 'Active', orders: 9, spent: 870.5, joined: 'May 14, 2024' },
  { id: 'USR-0108', name: 'Oliver Wilson', email: 'oliver@email.com', role: 'Admin', status: 'Active', orders: 1, spent: 179.99, joined: 'Jun 1, 2024' },
  { id: 'USR-0109', name: 'Isabella Moore', email: 'isabella@email.com', role: 'Customer', status: 'Active', orders: 22, spent: 3450, joined: 'Nov 8, 2023' },
  { id: 'USR-0110', name: 'Ethan Clark', email: 'ethan@email.com', role: 'Customer', status: 'Active', orders: 6, spent: 590, joined: 'Jul 22, 2024' },
  { id: 'USR-0111', name: 'Charlotte Lewis', email: 'charlotte@email.com', role: 'Customer', status: 'Suspended', orders: 4, spent: 340, joined: 'Aug 9, 2024' },
  { id: 'USR-0112', name: 'Benjamin Hall', email: 'ben@email.com', role: 'Customer', status: 'Active', orders: 5, spent: 420, joined: 'Sep 16, 2024' },
];

exports.getDashboard = async (req, res) => {
  res.status(200).json({
    success: true,
    data: dashboardData,
  });
};

exports.getProducts = async (req, res) => {
  try {
    const dbProducts = await Product.find().sort({ createdAt: -1 }).lean();

    if (dbProducts.length > 0) {
      return res.status(200).json({
        success: true,
        data: dbProducts,
      });
    }

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      data: products,
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
      imageUrls,
      coverImageUrl,
      imageUrl,
    } = req.body;

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
        return res.status(400).json({
          success: false,
          message: `Invalid color-size variant: ${color} / ${size}`,
        });
      }

      if (!Number.isFinite(stockValue) || stockValue < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid stock for variant: ${color} / ${size}`,
        });
      }

      seenCombos.add(key);
      normalizedVariantStock.push({
        color,
        size,
        stock: Math.floor(stockValue),
      });
    }

    if (seenCombos.size !== requiredCombos.size) {
      return res.status(400).json({
        success: false,
        message: 'Please provide stock for every selected color-size combination',
      });
    }

    const totalStock = normalizedVariantStock.reduce((sum, item) => sum + item.stock, 0);

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

    const product = await Product.create({
      name: String(name).trim(),
      description: String(description || '').trim(),
      brand: String(brand).trim(),
      category: String(category).trim(),
      subCategory: String(subCategory || '').trim(),
      price: Number(price),
      stock: totalStock,
      colors,
      sizes,
      variantStock: normalizedVariantStock,
      imageUrls: normalizedImageUrls,
      coverImageUrl: finalCoverImageUrl,
      imageUrl: finalCoverImageUrl,
    });

    return res.status(201).json({
      success: true,
      data: product,
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

exports.getOrders = async (req, res) => {
  res.status(200).json({
    success: true,
    data: orders,
  });
};

exports.getUsers = async (req, res) => {
  res.status(200).json({
    success: true,
    data: users,
  });
};
