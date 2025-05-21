// scripts/migrateObjectives.js
const mongoose = require("mongoose");
require("dotenv").config();

const Objective = require("../models/Objective");

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: "habit-sync-ai",
  });

  const oldDocs = await Objective.find({
    userId: { $type: "objectId" }, // find ones using ObjectId
  });

  console.log(`🔍 Found ${oldDocs.length} objectives with ObjectId userIds.`);

  for (const doc of oldDocs) {
    const stringId = doc.userId.toString();

    // Check if a string-based doc already exists to prevent duplicate conflicts
    const existing = await Objective.findOne({ userId: stringId });
    if (existing) {
      console.warn(`⚠️ Skipping duplicate for userId: ${stringId}`);
      continue;
    }

    // Create a new doc with string userId and same text
    await Objective.create({
      userId: stringId,
      text: doc.text,
    });

    // Remove the old one
    await Objective.deleteOne({ _id: doc._id });

    console.log(`✅ Migrated: ${stringId}`);
  }

  console.log("🎉 Migration complete.");
  process.exit();
}

migrate();
