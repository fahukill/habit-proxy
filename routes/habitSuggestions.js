const express = require("express");
const router = express.Router();
const { callOpenAI } = require("../utils/openaiClient");

function buildHabitSuggestionPrompt(goals) {
  return `
Given the user's goals: ${goals.join(", ")}

Return 3 personalized habit suggestions in JSON format.
Each habit must include:
- title: short actionable phrase
- customizationType: a key like "timeOfDay", "focusArea", or "format"
- options: no more than 4 customization options, each 1–4 words max

Example:
[
  {
    "title": "Run for 30 minutes",
    "customizationType": "timeOfDay",
    "options": ["Morning", "Afternoon", "Evening"]
  },
  ...
]

Return ONLY valid JSON.
  `;
}

router.post("/ai/habit-suggestions", async (req, res) => {
  const { goals } = req.body;

  if (!Array.isArray(goals) || goals.length === 0) {
    return res.status(400).json({ error: "Goals are required." });
  }

  const prompt = buildHabitSuggestionPrompt(goals);

  try {
    const aiResponse = await callOpenAI(prompt);

    // Try to extract JSON block from the response
    const jsonMatch = aiResponse.match(/\[.*\]/s);
    if (!jsonMatch) throw new Error("No JSON found in AI response.");

    const suggestions = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(suggestions)) {
      throw new Error("Invalid JSON structure from AI.");
    }

    res.json({ suggestions });
  } catch (err) {
    console.error("AI habit suggestion error:", err);
    res
      .status(500)
      .json({ error: "Failed to generate structured habit suggestions." });
  }
});

module.exports = router;
