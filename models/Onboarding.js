import mongoose from "mongoose";

const onboardingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: String,
    timezone: String,
    habits: [String],
    motivation: String,
  },
  { timestamps: true }
);

const Onboarding =
  mongoose.models.Onboarding || mongoose.model("Onboarding", onboardingSchema);
export default Onboarding;
