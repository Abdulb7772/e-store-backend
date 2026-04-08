const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'https://e-store-client-bhwm.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder
const publicPath = path.join(__dirname, 'public');
console.log('[Server] Environment Config:', {
  BACKEND_URL: process.env.BACKEND_URL,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
});
console.log('[Server] Serving static files from:', publicPath);
app.use('/public', express.static(publicPath, { maxAge: '1d' }));

// Debug route to check environment and file status
app.get('/api/debug', (req, res) => {
  const fs = require('fs');
  const uploadsPath = path.join(publicPath, 'uploads');
  const stats = fs.existsSync(uploadsPath) ? fs.statSync(uploadsPath) : null;
  const files = fs.existsSync(uploadsPath) ? fs.readdirSync(uploadsPath) : [];
  
  res.json({
    status: 'ok',
    env: {
      BACKEND_URL: process.env.BACKEND_URL,
      NODE_ENV: process.env.NODE_ENV,
    },
    paths: {
      publicPath,
      uploadsPath,
    },
    uploads: {
      exists: fs.existsSync(uploadsPath),
      isDirectory: stats ? stats.isDirectory() : false,
      files: files.slice(0, 10), // Show first 10 files
      count: files.length,
    },
  });
});

// Test static file serving
app.get('/api/test-static', (req, res) => {
  const fs = require('fs');
  const uploadsPath = path.join(publicPath, 'uploads');
  const exists = fs.existsSync(uploadsPath);
  const files = exists ? fs.readdirSync(uploadsPath) : [];
  res.json({
    staticPath: publicPath,
    uploadsPath,
    uploadsExists: exists,
    files,
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/usersRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/reviews', require('./routes/reviewsRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'E-commerce API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
