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
You are a habit-building assistant. Generate 3 highly relevant, real-world habit suggestions that align with the user's personal goals and preferences.

Input:
- User's goals: ${goals.join(", ")}
- Goal-tracking style: ${goalStyle || "Not specified"}
- Reminder frequency: ${reminderFrequency || "Not specified"}
- Unit system: ${unitSystem} (use this for any habit involving time, distance, weight, etc.)

Requirements:
1. Base your suggestions on the user's specific goals — do not be generic. Assume the user is ready to take daily or weekly action.
2. Each habit must be **actionable**, **realistic**, and **clearly tied to one or more goals**.
3. Return an **array of 3 habits in valid JSON format**, with no additional text.
4. Each habit must include:
   - title: A short, specific, action-oriented phrase (max 8 words).
   - customizationType: One of these keys — "timeOfDay", "focusArea", or "format" — indicating how the habit can be personalized.
   - options: 2–4 short customization options (each 1–4 words max).

✅ Example:
[
  {
    "title": "Run for 30 minutes",
    "customizationType": "timeOfDay",
    "options": ["Morning", "Afternoon", "Evening"]
  },
  ...
]

Respond with **ONLY valid JSON** — no explanation, no intro, no trailing comments.

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
