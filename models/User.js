import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    timezone: String,

    subscription: {
      type: String,
      enum: ["Free", "Pro", "Coach"],
      default: "Free", // Capitalized to match frontend logic
    },
    renewalDate: {
      type: String,
    },
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

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
