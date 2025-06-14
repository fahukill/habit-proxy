const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "custom"],
      required: true,
    },
    goal: {
      type: String,
      default: "",
    },
    days: {
      type: [String],
      default: [],
    },
    customization: { type: String },
    focusArea: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Habit || mongoose.model("Habit", habitSchema);
