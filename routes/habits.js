const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Habit = require("../models/Habit");
const HabitLog = require("../models/HabitLog");
const { z } = require("zod");

const HabitSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  days: z.array(z.string()).optional(),
});

const HabitLogSchema = z.object({
  habitId: z.string().min(1),
  note: z.string().max(500).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
});

// ✅ GET /api/habits — fetch all habits for the user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId });
    res.json(habits);
  } catch (err) {
    console.error("Failed to fetch habits:", err);
    res.status(500).json({ error: "Could not fetch habits" });
  }
});

// ✅ GET /api/habits/log?date=YYYY-MM-DD — logs for a specific day
router.get("/log", authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: "Missing 'date' query parameter" });
    }

    const logs = await HabitLog.find({
      userId: req.userId,
      date: date, // ✅ direct string match
    });

    res.status(200).json(logs);
  } catch (err) {
    console.error("Failed to fetch habit logs by date:", err);
    res.status(500).json({ error: "Could not fetch logs" });
  }
});

// ✅ POST /api/habits/log — log a habit entry
router.post("/log", authMiddleware, async (req, res) => {
  try {
    const dayjs = require("dayjs");

    const result = HabitLogSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: "Invalid habit log", details: result.error.flatten() });
    }

    const { habitId, note, date } = result.data;
    const logDate = dayjs(date).format("YYYY-MM-DD");

    const existingLog = await HabitLog.findOne({
      userId: req.userId,
      habitId,
      date: logDate,
    });

    if (existingLog) {
      return res.status(200).json(existingLog);
    }

    const log = new HabitLog({
      userId: req.userId,
      habitId,
      note,
      date: logDate,
    });

    await log.save();
    return res.status(201).json(log);
  } catch (err) {
    console.error("❌ Failed to log habit:", err);
    return res.status(500).json({ error: "Could not log habit" });
  }
});

// ✅ POST /api/habits — create a new habit
router.post("/", authMiddleware, async (req, res) => {
  try {
    const result = HabitSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten(),
      });
    }

    const { name, frequency, days } = result.data;

    const habit = new Habit({
      userId: req.userId,
      name,
      frequency,
      days: Array.isArray(days) ? days : [],
    });

    await habit.save();
    res.status(201).json(habit);
  } catch (err) {
    console.error("Failed to create habit:", err);
    res.status(500).json({ error: "Could not create habit" });
  }
});
module.exports = router;
