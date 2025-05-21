const mongoose = require("mongoose");
const Objective = require("../models/Objective");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: "habit-sync-ai",
  });

  const userId = "68297aced3b860dfe9013588";

  const result = await Objective.findOneAndUpdate(
    { userId },
    {
      text: "I want to lose weight and gain muscle. I workout 4x/week for 20–30 mins and focus on lifting.",
    },
    { new: true, upsert: true }
  );

  console.log("✅ Re-seeded:", result);
  process.exit();
}

run();
