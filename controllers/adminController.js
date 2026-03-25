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
  { id: 'PRD-001', name: 'Classic Leather Jacket', category: 'Men', brand: 'Zara', price: 189.99, stock: 42, status: 'Active' },
  { id: 'PRD-002', name: 'Slim Fit Chinos', category: 'Men', brand: "Levi's", price: 64.99, stock: 87, status: 'Active' },
  { id: 'PRD-003', name: 'Floral Summer Dress', category: 'Women', brand: 'H&M', price: 79.99, stock: 0, status: 'Out of Stock' },
  { id: 'PRD-004', name: 'Air Cushion Sneakers', category: 'Men', brand: 'Nike', price: 129.99, stock: 34, status: 'Active' },
  { id: 'PRD-005', name: 'Cashmere Sweater', category: 'Women', brand: 'Zara', price: 149.99, stock: 21, status: 'Active' },
  { id: 'PRD-006', name: 'Denim Jacket', category: 'Men', brand: "Levi's", price: 94.99, stock: 56, status: 'Active' },
  { id: 'PRD-007', name: 'Pleated Midi Skirt', category: 'Women', brand: 'H&M', price: 54.99, stock: 0, status: 'Out of Stock' },
  { id: 'PRD-008', name: 'Running Shoes Pro', category: 'Men', brand: 'Adidas', price: 119.99, stock: 15, status: 'Active' },
  { id: 'PRD-009', name: 'Sequin Evening Gown', category: 'Women', brand: 'Zara', price: 249.99, stock: 8, status: 'Active' },
  { id: 'PRD-010', name: 'Kids Graphic Hoodie', category: 'Kids', brand: 'Puma', price: 49.99, stock: 63, status: 'Active' },
  { id: 'PRD-011', name: 'Formal Blazer', category: 'Men', brand: 'Zara', price: 179.99, stock: 0, status: 'Draft' },
  { id: 'PRD-012', name: 'Crossbody Handbag', category: 'Accessories', brand: 'H&M', price: 69.99, stock: 30, status: 'Active' },
  { id: 'PRD-013', name: 'Ankle Strap Heels', category: 'Women', brand: 'Zara', price: 89.99, stock: 22, status: 'Active' },
  { id: 'PRD-014', name: 'Kids Denim Overalls', category: 'Kids', brand: "Levi's", price: 44.99, stock: 48, status: 'Active' },
  { id: 'PRD-015', name: 'Oversized Tee', category: 'Men', brand: 'Nike', price: 34.99, stock: 120, status: 'Active' },
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
  res.status(200).json({
    success: true,
    data: products,
  });
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
