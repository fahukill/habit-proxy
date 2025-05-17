const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  frequency: { type: String, enum: ["daily", "weekly", "monthly"], default: "daily" },
  goal: String,
});

module.exports = mongoose.model("Habit", habitSchema);
