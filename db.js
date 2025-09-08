// db.js
// Import Mongoose (Object Document Mapper library for MongoDB)
const mongoose = require('mongoose');
require('dotenv').config(); // load .env early

// Define an async function to connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;// Get MongoDB URI from environment variables
    if (!mongoUri) {// If the URI is missing, throw an error
      throw new Error("MONGO_URI is not defined in .env file");
    }
// Connect to MongoDB using mongoose
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
// If successful, log confirmation
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err.message);// If there’s an error, log the message
    process.exit(1); // Stop server if DB fails
  }
};
// Export the function so server.js (and others) can use it
module.exports = connectDB;
