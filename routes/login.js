const express = require("express");
const router = express.Router();
// Express Router lets us define routes in separate files and then use them in the main app.
const User = require("../models/User"); // MongoDB model

// Import the User model from models/User.js
// This is how we interact with the "users" collection in MongoDB.

// Handle POST request to "/"
// This will be triggered when the frontend sends a login request.
router.post("/", async (req, res) => { 
  const { username, password } = req.body; // Extract username and password from the request body

  try {
    const user = await User.findOne({ username });// Search for a user in MongoDB with the given username
// If the user doesn't exist OR the password doesn't match → send error
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
// If credentials match → send success response
    res.status(200).json({ message: "Login successful", username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Server error" }); // If something goes wrong with the DB or server
  }
});

module.exports = router; // Export this router so it can be used in server.js
