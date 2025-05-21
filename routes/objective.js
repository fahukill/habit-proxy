// proxy/routes/objective.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Objective = require("../models/Objective");
const mongoose = require("mongoose"); // NEW

router.get("/", authMiddleware, async (req, res) => {
  let userObjectId;
  try {
    userObjectId = new mongoose.Types.ObjectId(req.userId); // CONVERT userId to ObjectId
  } catch {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    const doc = await Objective.findOne({ userId: userObjectId });
    res.json({ objective: doc?.text || "" });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch objective" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { objective } = req.body;

  if (typeof objective !== "string") {
    return res.status(400).json({ error: "Invalid objective" });
  }
  console.log("Saving objective:", objective, "for user:", req.userId);

  let userObjectId;
  try {
    userObjectId = new mongoose.Types.ObjectId(req.userId); // CONVERT userId to ObjectId
  } catch {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    const existing = await Objective.findOneAndUpdate(
      { userId: userObjectId },
      { text: objective },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Objective saved", data: existing });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ error: "Failed to save objective" });
  }
});

module.exports = router;
