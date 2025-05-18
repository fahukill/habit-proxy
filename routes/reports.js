// proxy/src/routes/reports.js or reports.ts
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

router.get("/", authMiddleware, async (req, res) => {
  const Report = require("../models/Report");

  try {
    const reports = await Report.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    res.json(reports);
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const Report = require("../models/Report");

  try {
    const newReport = new Report({
      userId: req.userId,
      generatedBy: "manual",
      content: "This is a placeholder report", // TODO: Replace with AI logic
    });

    await newReport.save();
    res.status(201).json(newReport);
  } catch (error) {
    console.error("Failed to generate report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

module.exports = router;
