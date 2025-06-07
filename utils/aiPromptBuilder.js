const dayjs = require("dayjs");

function buildAIPrompt(
  objective,
  habits,
  logs,
  reports = [],
  firstName = "there"
) {
  const header = `You are a helpful AI coach generating personalized feedback based on a user's habit tracking data. Write a personalized message to ${firstName}. Use their name in the greeting.`;
  const objSection = `\n\n📌 Objective:\n${
    objective?.text || "No objective set."
  }`;

  const habitSection = `\n\n📋 Habits:\n${
    habits
      .map(
        (h) =>
          `- ${h.name} (${h.frequency})${
            h.description ? ": " + h.description : ""
          }`
      )
      .join("\n") || "No habits found."
  }`;

  const logSection = `\n\n📅 Logs:\n${
    logs.length > 0
      ? logs
          .map((log) => {
            const habit = habits.find((h) => h._id.equals(log.habitId));
            const habitName = habit ? habit.name : "Unknown Habit";
            return `• ${dayjs(log.date).format("MM-DD-YYYY")}: ${habitName} — ${
              log.note || "(no note)"
            }`;
          })
          .join("\n")
      : "No recent logs."
  }`;

  const reportSummary =
    reports.length > 0
      ? `\n\n📊 Previous Reports Summary:\n${reports
          .slice(-3)
          .map(
            (r) =>
              `• ${dayjs(r.createdAt).format("MM-DD-YYYY")}: ${
                r.summary || "(no summary)"
              }`
          )
          .join("\n")}`
      : "\n\nNo previous reports found.";

  const instructions = `\n\n🧠 Generate a motivating message, highlight one positive trend, one suggestion for improvement, and keep the tone aligned with the user's progress.`;

  return `${header}${objSection}${habitSection}${logSection}${reportSummary}${instructions}`;
}

// ✅ NEW: AI prompt builder for habit suggestions from onboarding goals
function buildHabitSuggestionPrompt(goals) {
  const intro = `A user is starting to use a habit tracking app. These are the goals they selected during onboarding:\n${goals
    .map((g) => `- ${g}`)
    .join("\n")}`;

  const instructions = `
Suggest exactly 3 simple, effective daily or weekly habits that will help the user achieve these goals.
Only return the list in this format:

1. [Habit one]
2. [Habit two]
3. [Habit three]

Do not add any extra explanation or greeting.
`;

  return `${intro}\n${instructions}`;
}

module.exports = {
  buildAIPrompt,
  buildHabitSuggestionPrompt, // 👈 export the new function
};
