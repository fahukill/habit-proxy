const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    subscription: {
      type: String,
      enum: ["free", "pro", "coach"],
      default: "free",
    },
    image: String,

    // Preferences & Settings
    startOfWeek: {
      type: String,
      enum: ["Sunday", "Monday"],
      default: "Sunday",
    },
    coachingTone: {
      type: String,
      enum: ["Uplifting", "Tough love 💪", "Humorous", "Neutral"],
      default: "Uplifting",
    },
    notifications: {
      aiReports: { type: Boolean, default: true },
      streakReminders: { type: Boolean, default: true },
      weeklySummary: { type: Boolean, default: true },
      accountActivity: { type: Boolean, default: true },
    },

    // Onboarding + Goal Info (moved from Onboarding.js)
    bigGoal: { type: String },
    focusAreas: [String],
    selectedHabits: [String],
    habitCustomizations: {
      type: Map,
      of: String,
      default: {},
    },
    regenCount: { type: Number, default: 0 },
    motivationStyle: String,
    timeCommitment: String,
    goalStyle: String,
    wantsSuggestions: String,
    wantsAISuggestions: String,
    reminderFrequency: String,
    timezone: String,
    isAISubscriber: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
