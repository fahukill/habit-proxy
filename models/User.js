// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: String,
    lastName: String,
    timezone: String,
    subscription: {
      type: String,
      enum: ["Free", "Pro", "Coach"],
      default: "Free",
    },
    renewalDate: String,
    notifications: {
      aiReports: { type: Boolean, default: true },
      streakReminders: { type: Boolean, default: true },
      weeklySummary: { type: Boolean, default: true },
      accountActivity: { type: Boolean, default: true },
    },
    startOfWeek: {
      type: String,
      enum: ["Sunday", "Monday"],
      default: "Sunday",
    },
    coachingTone: {
      type: String,
      enum: ["Uplifting", "Tough Love", "Humorous"],
      default: "Uplifting",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
