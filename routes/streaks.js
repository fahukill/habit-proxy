const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const HabitLog = require("../models/HabitLog");
const {
  calculateStreaksFromLogs,
} = require("../utils/calculateStreaksFromLogs");

router.get("/", authMiddleware, async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: "Missing start or end date" });
  }

  try {
    const logs = await HabitLog.find({
      userId: req.userId,
      date: { $gte: start, $lte: end },
    }).populate("habitId", "name");

    const streaks = calculateStreaksFromLogs(logs);

    res.json(streaks);
  } catch (err) {
    console.error("Failed to fetch streaks:", err);
    res.status(500).json({ error: "Could not fetch streaks" });
  }
});

module.exports = router;
