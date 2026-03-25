# E-commerce Backend API

Backend for e-commerce application with authentication using MVC pattern.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file (already created) with:
   - PORT
   - MONGODB_URI
   - JWT_SECRET
   - JWT_EXPIRE

3. **Run the server:**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes

#### Sign Up
- **POST** `/api/auth/signup`
- **Body:**
  ```json
  {
    "emailPhone": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```

#### Sign In
- **POST** `/api/auth/signin`
- **Body:**
  ```json
  {
    "username": "user@example.com",
    "password": "password123"
  }
  ```
  Note: Username can be email, phone, or generated username

#### Get Profile (Protected)
- **GET** `/api/auth/me`
- **Headers:** `Authorization: Bearer <token>`

## Project Structure

```
Backend/
├── config/
│   └── database.js       # MongoDB connection
├── controllers/
│   └── authController.js # Auth business logic
├── middleware/
│   └── authMiddleware.js # JWT authentication
├── models/
│   └── User.js          # User model
├── routes/
│   └── authRoutes.js    # Auth routes
├── .env                 # Environment variables
├── server.js            # Entry point
└── package.json         # Dependencies
```

## Features

- User registration and login
- Password hashing with bcrypt
- JWT authentication
- MongoDB integration
- MVC architecture
- CORS enabled
- Error handling

## Database Schema

### User Model
- emailPhone (String, required, unique)
- username (String, unique, auto-generated)
- password (String, required, hashed)
- firstName (String, required)
- lastName (String, required)
- role (String, enum: ['user', 'admin'])
- isActive (Boolean, default: true)
- timestamps (createdAt, updatedAt)
