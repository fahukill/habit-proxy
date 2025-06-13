// models/Objective.js
const mongoose = require("mongoose");

const objectiveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    text: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Objective || mongoose.model("Objective", objectiveSchema);
