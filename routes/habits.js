router.post("/log", authMiddleware, async (req, res) => {
  try {
    const { habitId, note, date } = req.body;

    // You can create a HabitLog model separately if needed
    const HabitLog = require("../models/HabitLog");

    const log = new HabitLog({
      userId: req.userId,
      habitId,
      note,
      date: date ? new Date(date) : new Date(),
    });

    await log.save();
    res.status(201).json(log);
  } catch (err) {
    console.error("Failed to log habit:", err);
    res.status(500).json({ error: "Could not log habit" });
  }
});
