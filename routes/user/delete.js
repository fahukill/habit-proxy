const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const Habit = require("../../models/Habit");
const HabitLog = require("../../models/HabitLog");
const Report = require("../../models/Report");

router.post("/delete", async (req, res) => {
  try {
    await Habit.deleteMany({ userId: req.userId });
    await HabitLog.deleteMany({ userId: req.userId });
    await Report.deleteMany({ userId: req.userId });
    const result = await User.findByIdAndDelete(req.userId);
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ message: "User account deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete account" });
  }
});

module.exports = router;
