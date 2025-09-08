const express = require("express");
const router = express.Router();
const User = require("../models/User");

// POST /api/register
router.post("/", async (req, res) => { //Extracts from the request body which comes from the frontend form submission.
  const { fullName, email, phone, address, username, password } = req.body;

  try {
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const newUser = new User({ fullName, email, phone, address, username, password });
    await newUser.save();

    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    res.status(500).json({ message: "Error registering user", error: err });
  }
});

module.exports = router;
