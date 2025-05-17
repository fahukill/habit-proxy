const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  password: String,
  subscription: {
    type: String,
    enum: ["Free", "Pro", "Coach"],
    default: "Free",
  },
  notifications: {
    type: Object,
    default: {},
  },
});

module.exports = mongoose.model("User", userSchema);
