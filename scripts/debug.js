// debug.js
const mongoose = require("mongoose");
const Objective = require("./models/Objective");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: "habit-sync-ai",
  });

  const docs = await Objective.find({});
  console.log("📊 All objectives:", docs);

  const byUserId = await Objective.findOne({
    userId: "68297aced3b860dfe9013588",
  });
  console.log("🔍 By userId string:", byUserId);
}

run();
