// Import required modules
const express = require("express");
const multer = require("multer"); // For file uploads
const path = require("path");
const twilio = require("twilio"); // For sending SMS
const SkillPost = require("../models/SkillPost");// MongoDB model for posts
const User = require("../models/User");// MongoDB model for users


const router = express.Router();
// Twilio account credentials
const accountSid = "ACb28d1959fe239b245f2c13a26994ca0b";
const authToken = "cba4310fb3cc329dfe5fbb3334c8b30d";
const client = twilio(accountSid, authToken);

// ✅ POST: Send SMS to skill post owner with user contact
router.post("/connect/:postId", async (req, res) => {
  try {
    const { postId } = req.params;// Extract post ID from URL
    const { phone } = req.body; // This is the sender’s contact number
// Find the post in the database
    const post = await SkillPost.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
// SMS message body
    const message = `Hi ${post.name}, someone is interested in your skill "${post.title}". You can contact them at ${phone}.`;
// Send SMS using Twilio
    const sms = await client.messages.create({
      body: message,
      from: "+17625852136", // your Twilio number
      to: `+91${post.contact}` // receiver's contact
    });

    console.log("📨 SMS sent:", sms.sid);
    res.json({ success: true, message: "SMS sent to the post owner" });
  } catch (error) {
    console.error("❌ SMS error:", error.message);
    res.status(500).json({ error: "Failed to send SMS" });
  }
});

// Multer config for storing uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // Save images in 'public/uploads'
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname; // Unique filename
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// POST with image upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
     // Extract fields from request body
    const { title, description, category, location, availability, type, name, contact, tag, status } = req.body;
    const image = req.file ? "/uploads/" + req.file.filename : null; // Store uploaded image path
// Create new post object
    const newPost = new SkillPost({
      title,
      description,
      category,
      location,
      availability,
      type,
      name,
      contact,
      tag,
      status,
      image,
    });
// Save to MongoDB
    await newPost.save();
    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.error("❌ Error saving post:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET all posts
router.get("/", async (req, res) => {
  try {
    // Fetch posts from DB, latest first
    const posts = await SkillPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error("❌ Error fetching posts:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
