// proxy/routes/objective.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Objective = require("../models/Objective");
console.log("✅ /api/objective route loaded");

router.get("/get", authMiddleware, async (req, res) => {
  try {
    console.log("🧠 Incoming userId:", req.userId, typeof req.userId);

    const doc = await Objective.findOne({ userId: req.userId });
    console.log("📦 Query result:", doc);

    if (!doc) {
      console.warn("⚠️ No match for userId:", req.userId);
    } else {
      console.log("📦 Found objective:", doc.text);
    }

    res.json({ objective: doc?.text || "" });
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch objective" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { objective } = req.body;

  if (typeof objective !== "string") {
    return res.status(400).json({ error: "Invalid objective" });
  }

  try {
    const updated = await Objective.findOneAndUpdate(
      { userId: req.userId },
      { text: objective },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Objective saved", data: updated });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ error: "Failed to save objective" });
  }
});

module.exports = router;
