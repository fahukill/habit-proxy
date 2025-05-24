require("dotenv").config();
const mongoose = require("mongoose");
const dayjs = require("dayjs");
const HabitLog = require("../models/HabitLog");

async function fixDates() {
  try {
    const db =
      process.env.MONGODB_URI || "mongodb://localhost:27017/habit-sync-ai";
    await mongoose.connect(db);
    console.log("✅ Connected to MongoDB");
    console.log("🧭 Connected to DB:", mongoose.connection.name);

    const logs = await HabitLog.find({});
    console.log(`📦 Found ${logs.length} logs`);
    let updatedCount = 0;

    for (const log of logs) {
      const original = log.date;
      console.log(
        `🔍 Checking log ${log._id}: ${original} (${typeof original})`
      );

      if (
        typeof original === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(original)
      ) {
        console.log(`⏭️ Skipping valid log: ${original}`);
        continue;
      }

      let parsed = null;

      if (original instanceof Date) {
        parsed = dayjs(original);
      } else if (typeof original === "string") {
        parsed = dayjs(original);
        if (!parsed.isValid()) {
          const fallback = new Date(original);
          if (!isNaN(fallback)) {
            parsed = dayjs(fallback);
          }
        }
      }

      if (parsed && parsed.isValid()) {
        const formatted = parsed.format("YYYY-MM-DD");
        log.date = formatted;
        await log.save();
        console.log(`🔧 Fixed log ${log._id}: ${original} → ${formatted}`);
        updatedCount++;
      } else {
        console.warn(`⚠️ Could not parse date for log ${log._id}: ${original}`);
      }
    }

    console.log(`🎉 Migration complete. ${updatedCount} logs updated.`);
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixDates();
