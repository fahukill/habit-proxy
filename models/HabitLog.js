const mongoose = require("mongoose");

const habitLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
    },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.HabitLog || mongoose.model("HabitLog", habitLogSchema);
