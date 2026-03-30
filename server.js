const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
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
