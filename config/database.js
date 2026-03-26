const mongoose = require('mongoose');
const Product = require('../models/Product');

const backfillProductDressType = async () => {
  // Migrate legacy docs so dressType is always present in MongoDB.
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

  const copiedCount = copiedLegacy.modifiedCount || 0;
  const filledCount = filledMissing.modifiedCount || 0;

  if (copiedCount > 0 || filledCount > 0) {
    console.log(
      `Product dressType migration applied. Copied legacy: ${copiedCount}, filled missing: ${filledCount}`,
    );
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await backfillProductDressType();
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.warn('Continuing without database connection. Some DB-backed endpoints may fail.');
  }
};

module.exports = connectDB;
