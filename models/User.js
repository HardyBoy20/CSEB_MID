// models/User.js
const mongoose = require("mongoose");
// Mongoose is the ODM (Object Data Modeling) library for MongoDB.
// It helps define a schema for our MongoDB collections and makes CRUD operations easier.

// Create the schema for the "User" collection in MongoDB
const userSchema = new mongoose.Schema({
  fullName: String, // User's full name
  email: String, // Email address of the user
  phone: String, // Contact number of the user
  address: String, // Physical address of the user
  username: { type: String, unique: true }, // Username (must be unique to prevent duplicates)
  password: String, // Password for authentication
  profilePic: String // Path or URL to the user's profile picture
});
// Export the model so it can be used in other parts of the application.
// The model name "User" will be stored in MongoDB as the collection "users"
module.exports = mongoose.model("User", userSchema);
