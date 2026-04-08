const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    emailPhone: {
      type: String,
      required: [true, 'Please provide email or phone number'],
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'Please provide first name'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Please provide last name'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'staff', 'manager'],
      default: 'customer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create username from emailPhone if not provided
userSchema.pre('save', async function (next) {
  if (!this.username) {
    // Extract username from email or use phone number
    if (this.emailPhone.includes('@')) {
      this.username = this.emailPhone.split('@')[0];
    } else {
      this.username = this.emailPhone;
    }
    
    // Make sure username is unique by adding random suffix if needed
    let usernameExists = await this.constructor.findOne({ username: this.username });
    let counter = 1;
    while (usernameExists) {
      this.username = `${this.username}${counter}`;
      usernameExists = await this.constructor.findOne({ username: this.username });
      counter++;
    }
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
