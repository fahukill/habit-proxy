const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Objective = require("../models/Objective");
const Habit = require("../../models/Habit");
const HabitLog = require("../models/HabitLog");
const Report = require("../models/Report");
const { buildAIPrompt } = require("../utils/aiPromptBuilder");
const { callOpenAI } = require("../utils/openaiClient"); // to be built

router.post("/encouragement", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const [objective, habits, logs, reports] = await Promise.all([
      Objective.findOne({ userId }),
      Habit.find({ userId }),
      HabitLog.find({ userId }),
      Report.find({ userId }).sort({ createdAt: -1 }).limit(3),
    ]);

    const prompt = buildAIPrompt(objective, habits, logs, reports);
    const aiResponse = await callOpenAI(prompt);

    res.status(200).json({ message: aiResponse });
  } catch (err) {
    console.error("AI encouragement error:", err);
    res.status(500).json({ error: "Failed to generate encouragement" });
  }
});

module.exports = router;
