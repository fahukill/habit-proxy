const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const HabitLog = require("../models/HabitLog");
const dayjs = require("dayjs");

// GET /api/habit-logs
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const query = { userId: req.userId };

    if (date) {
      const start = dayjs(date).startOf("day").toDate();
      const end = dayjs(date).endOf("day").toDate();
      query.date = { $gte: start, $lte: end };
    }

    const logs = await HabitLog.find(query).sort({ date: -1 });
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

    // ✅ FIXED: use dayjs to ensure correct local midnight
    const dayjs = require("dayjs");
    const parsedDate = dayjs(date || new Date()).format("YYYY-MM-DD");

    const log = new HabitLog({
      userId: req.userId,
      habitId,
      note,
      date: parsedDate,
    });

    await log.save();
    res.status(201).json(log);
  } catch (err) {
    console.error("Failed to create habit log:", err);
    res.status(500).json({ error: "Could not create habit log" });
  }
});

module.exports = router;
