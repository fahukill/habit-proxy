const express = require("express");
const router = express.Router();
const { callOpenAI } = require("../utils/openaiClient");
const { buildHabitSuggestionPrompt } = require("../utils/aiPromptBuilder");

router.post("/ai/habit-suggestions", async (req, res) => {
  const { goals } = req.body;

  if (!Array.isArray(goals) || goals.length === 0) {
    return res.status(400).json({ error: "Goals are required." });
  }

  const prompt = buildHabitSuggestionPrompt(goals);

  try {
    const aiResponse = await callOpenAI(prompt);

    const suggestions = aiResponse
      .split("\n")
      .map((line) => line.replace(/^\d+\.?\s*/, "").trim())
      .filter(Boolean);

    res.json({ suggestions });
  } catch (err) {
    console.error("AI habit suggestion error:", err);
    res.status(500).json({ error: "Failed to generate habit suggestions." });
  }
});

module.exports = router;
