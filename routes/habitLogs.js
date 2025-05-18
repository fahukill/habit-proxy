const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const HabitLog = require("../models/HabitLog");

// GET /api/habit-logs
router.get("/", authMiddleware, async (req, res) => {
  try {
    const logs = await HabitLog.find({ userId: req.userId }).sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    console.error("Failed to fetch habit logs:", err);
    res.status(500).json({ error: "Could not fetch habit logs" });
  }
});

// POST /api/habit-logs
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { habitId, note, date } = req.body;

    const log = new HabitLog({
      userId: req.userId,
      habitId,
      note,
      date: date ? new Date(date) : new Date(),
    });

    await log.save();
    res.status(201).json(log);
  } catch (err) {
    console.error("Failed to create habit log:", err);
    res.status(500).json({ error: "Could not create habit log" });
  }
});

module.exports = router;
