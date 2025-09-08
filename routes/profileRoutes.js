const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET user profile by username
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Respond with selected profile fields
    res.json({
      username: user.username,
      fullName: user.fullName || "",     // Optional
      email: user.email,
      phone: user.phone || "",           // Optional
      address: user.address || "",       // Optional
      profileImage: user.profilePic || ""
    });
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update user profile by username
router.put("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const updateData = req.body;

    // Only allow specific fields to be updated for safety
    const allowedFields = ["fullName", "email", "phone", "address", "profilePic", "password"];
    const filteredUpdate = {};

    for (const key of allowedFields) {
      if (updateData[key]) {
        filteredUpdate[key] = updateData[key];
      }
    }

    // Update user and return the new version
    const updatedUser = await User.findOneAndUpdate(
      { username },
      filteredUpdate,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "✅ Profile updated successfully",
      user: {
        username: updatedUser.username,
        fullName: updatedUser.fullName || "",
        email: updatedUser.email,
        phone: updatedUser.phone || "",
        address: updatedUser.address || "",
        profileImage: updatedUser.profilePic || ""
      }
    });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
