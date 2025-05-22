// proxy/src/utils/generateAIReport.js
const Objective = require("../models/Objective");
const Habit = require("../models/Habit");
const HabitLog = require("../models/HabitLog");
const Report = require("../models/Report");
const { buildAIPrompt } = require("./aiPromptBuilder");
const { callOpenAI } = require("./openaiClient");
const User = require("../models/User");

async function generateAIReport(userId, type = "report") {
  const [user, objective, habits, logs, reports] = await Promise.all([
    User.findById(userId), // ✅ NEW
    Objective.findOne({ userId }),
    Habit.find({ userId }),
    HabitLog.find({ userId }),
    Report.find({ userId }).sort({ createdAt: -1 }).limit(3),
  ]);
  const prompt = buildAIPrompt(
    objective,
    habits,
    logs,
    reports,
    user?.firstName || "there" // ✅ pass name or fallback
  );
  const response = await callOpenAI(prompt);

  const newReport = await Report.create({
    userId,
    type,
    summary: response,
  });

  return newReport;
}

module.exports = { generateAIReport };
