// routes/aadhaarRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Utility: Generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * POST /api/verify-aadhaar/request-otp
 * Request Aadhaar OTP (simulated)
 */
router.post("/request-otp", async (req, res) => {
  const { username, aadhaarNumber } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 5 * 60000); // Expires in 5 minutes

    user.aadhaarNumber = aadhaarNumber;
    user.aadhaarOtp = otp;
    user.aadhaarOtpExpiry = expiry;
    await user.save();

    // Simulate sending OTP
    console.log(`🔐 Simulated OTP for user ${username}: ${otp}`);

    res.json({ message: "OTP has been sent to your registered contact (simulated)." });
  } catch (error) {
    console.error("❌ Error sending Aadhaar OTP:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/verify-aadhaar/submit-otp
 * Submit Aadhaar OTP for verification
 */
router.post("/submit-otp", async (req, res) => {
  const { username, otp } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (
      user.aadhaarOtp === otp &&
      user.aadhaarOtpExpiry &&
      user.aadhaarOtpExpiry > new Date()
    ) {
      user.aadhaarVerified = true;
      user.aadhaarOtp = null;
      user.aadhaarOtpExpiry = null;
      await user.save();

      return res.json({ message: "✅ Aadhaar verified successfully." });
    } else {
      return res.status(400).json({ error: "❌ Invalid or expired OTP." });
    }
  } catch (error) {
    console.error("❌ Error verifying Aadhaar OTP:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
