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

// POST /api/habit-logs — Create or update a log with a note
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { habitId, note, date } = req.body;

    const parsedDate = dayjs(date || new Date())
      .startOf("day")
      .toDate();

    const updatedLog = await HabitLog.findOneAndUpdate(
      {
        userId: req.userId,
        habitId,
        date: parsedDate,
      },
      { note },
      { new: true, upsert: true }
    );

    res.status(201).json(updatedLog);
  } catch (err) {
    console.error("Failed to save habit log:", err);
    res.status(500).json({ error: "Could not save habit log" });
  }
});

// GET /api/habit-logs/:habitId/:date — Load note for habit on a date
router.get("/:habitId/:date", authMiddleware, async (req, res) => {
  const { habitId, date } = req.params;

  try {
    const parsedDate = dayjs(date).startOf("day").toDate();

    const log = await HabitLog.findOne({
      userId: req.userId,
      habitId,
      date: parsedDate,
    });

    res.status(200).json({ note: log?.note || "" });
  } catch (err) {
    console.error("Failed to load habit note:", err);
    res.status(500).json({ error: "Could not load habit note" });
  }
});

module.exports = router;
