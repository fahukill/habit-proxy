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
      const parsedDate = dayjs(date).format("YYYY-MM-DD");
      query.date = new Date(parsedDate); // exact match on day
    }

    const logs = await HabitLog.find(query).sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    console.error("Failed to fetch habit logs:", err);
    res.status(500).json({ error: "Could not fetch habit logs" });
  }
});

// POST /api/habit-logs — Always create a new log (no overwrite)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { habitId, note = "", date } = req.body;

    // Parse date to UTC 00:00:00 for consistency
    const parsedDate = new Date(dayjs(date).format("YYYY-MM-DD"));

    const newLog = new HabitLog({
      userId: req.userId,
      habitId,
      date: parsedDate,
      note,
    });

    await newLog.save();
    res.status(201).json(newLog);
  } catch (err) {
    console.error("Failed to save habit log:", err);
    res.status(500).json({ error: "Could not save habit log" });
  }
});

// PATCH /api/habit-logs/:id — Update note
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { note } = req.body;
    const updated = await HabitLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { note },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    console.error("Failed to update note:", err);
    res.status(500).json({ error: "Could not update note" });
  }
});

// DELETE /api/habit-logs/:id — Remove log
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await HabitLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    res.status(204).end();
  } catch (err) {
    console.error("Failed to delete note:", err);
    res.status(500).json({ error: "Could not delete note" });
  }
});

module.exports = router;
