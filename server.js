// server.js
require('dotenv').config(); // Load .env first
const express = require("express"); // Framework for building APIs
const cors = require("cors");// Middleware for handling cross-origin requests
const path = require("path");// Node.js module for working with file/directory paths
const connectDB = require("./db"); // MongoDB connection function

// Initialize Express app
const app = express();
// Use the PORT from .env, or default to 3000 if not set
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());// Allow cross-origin requests
app.use(express.json());// Parse incoming JSON requests automatically
app.use(express.urlencoded({ extended: true }));// Parse incoming form-data
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

// Import route files and mount them on paths
const registerRoutes = require("./routes/registerRoutes");
const loginRoutes = require("./routes/login");
const profileRoutes = require("./routes/profileRoutes");
const postRoutes = require("./routes/postRoutes");
const aadhaarRoutes = require("./routes/aadhaarRoutes");
// Each of these sets up a "base URL" for the routes
app.use("/api/register", registerRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/verify-aadhaar", aadhaarRoutes);
// Serve uploaded files (e.g. profile pictures) from "public/uploads" folder
app.use("/uploads", express.static("public/uploads"));

// Start server only after MongoDB is connected
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  });
});
