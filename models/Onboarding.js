const mongoose = require("mongoose");

const onboardingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    name: String,
    timezone: String,
    habits: [String],
    motivation: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Onboarding || mongoose.model("Onboarding", onboardingSchema);
