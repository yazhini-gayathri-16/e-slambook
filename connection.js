const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000, // Increase socket timeout to 45 seconds
    });
    console.log('📡 MongoDB connected successfully!');
  } catch (err) {
    console.log('❌ MongoDB connection error:', err.message);
    throw err; // Re-throw the error to be caught in app.js
  }
};

module.exports = connectDB;