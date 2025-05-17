const express = require("express");
const router = express.Router();
const Habit = require("../../models/Habit");
const HabitLog = require("../../models/HabitLog");
const Report = require("../../models/Report");
const authMiddleware = require("../../middleware/auth");

router.post("/reset", authMiddleware, async (req, res) => {
  try {
    await Habit.deleteMany({ userId: req.userId });
    await HabitLog.deleteMany({ userId: req.userId });
    await Report.deleteMany({ userId: req.userId });
    return res.json({ message: "Data reset complete" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to reset data" });
  }
});

module.exports = router;
