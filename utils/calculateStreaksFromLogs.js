const dayjs = require("dayjs");

function calculateStreaksFromLogs(logs) {
  const streaksByHabit = {};

  // Group logs by habitId
  for (const log of logs) {
    if (!log.habitId) continue;

    const habitId = (log.habitId._id || log.habitId).toString();
    const dateStr = dayjs(log.date).format("YYYY-MM-DD");

    if (!streaksByHabit[habitId]) {
      streaksByHabit[habitId] = {
        dates: new Set(),
        habitName: log.habitId.name || "Unnamed Habit",
      };
    }

    streaksByHabit[habitId].dates.add(dateStr);
  }

  const result = [];

  for (const [habitId, { dates, habitName }] of Object.entries(
    streaksByHabit
  )) {
    const sortedDates = Array.from(dates)
      .map((d) => dayjs(d))
      .sort((a, b) => a.diff(b));

    let currentStreak = 0;
    let longestStreak = 0;
    let streakCounter = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        streakCounter = 1;
      } else {
        const diff = sortedDates[i].diff(sortedDates[i - 1], "day");
        if (diff === 1) {
          streakCounter++;
        } else if (diff > 1) {
          longestStreak = Math.max(longestStreak, streakCounter);
          streakCounter = 1;
        }
      }
    }

    longestStreak = Math.max(longestStreak, streakCounter);

    // Check if last log was yesterday or today for current streak
    const today = dayjs().startOf("day");
    const lastDate = sortedDates[sortedDates.length - 1];

    if (
      lastDate &&
      (lastDate.isSame(today, "day") ||
        lastDate.add(1, "day").isSame(today, "day"))
    ) {
      currentStreak = streakCounter;
    } else {
      currentStreak = 0;
    }

    result.push({
      habitId,
      habitName,
      current: currentStreak,
      longest: longestStreak,
    });
  }

  return result;
}

module.exports = { calculateStreaksFromLogs };
