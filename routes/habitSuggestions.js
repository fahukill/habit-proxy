const express = require("express");
const router = express.Router();
const { callOpenAI } = require("../utils/openaiClient");
const { getUnitSystem } = require("../utils/timezoneUtils");

function buildHabitSuggestionPrompt(
  goals,
  goalStyle,
  reminderFrequency,
  unitSystem
) {
  return `
Given the user's goals: ${goals.join(", ")}

User's goal-tracking style: ${goalStyle || "Not specified"}
User's reminder preference: ${reminderFrequency || "Not specified"}
Use the ${unitSystem} measurement system for any suggestions that include units.

Return 3 personalized habit suggestions in JSON format.

All suggesteed habits should be actionable and specific to the user's goals. 


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

Respond with ONLY valid JSON.
`.trim();
}

router.post("/ai/habit-suggestions", async (req, res) => {
  const { goals, goalStyle, reminderFrequency, timezone = "UTC" } = req.body;

  if (!Array.isArray(goals) || goals.length === 0) {
    return res.status(400).json({ error: "Goals are required." });
  }

  const unitSystem = getUnitSystem(timezone); // 🛠 FIXED: moved here
  const prompt = buildHabitSuggestionPrompt(
    goals,
    goalStyle,
    reminderFrequency,
    unitSystem
  );

  try {
    const aiResponse = await callOpenAI(prompt);

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
