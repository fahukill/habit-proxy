import mongoose from "mongoose";

const habitLogSchema = new mongoose.Schema({
  userId: { type, ref: "User", required: true },
  habitId: { type, ref: "Habit", required: true },
  date: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.models.HabitLog || mongoose.model("HabitLog", habitLogSchema);
