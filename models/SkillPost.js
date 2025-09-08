// models/SkillPost.js
const mongoose = require("mongoose");

const skillPostSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    category: String,
    location: String,
    availability: String,
    type: String, // Offer or Request
    name: String,
    contact: String,
    tag: String,
    status: String,
    image: String, // New field for uploaded image path
  },
  { timestamps: true }
);

module.exports = mongoose.model("SkillPost", skillPostSchema);
