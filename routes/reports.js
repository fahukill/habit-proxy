const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { generateAIReport } = require("../utils/generateAIReport");
const Report = require("../models/Report");

// GET /api/reports
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (!req.userId) {
      console.warn("⚠️ No userId found in request");
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("🔍 Fetching reports for userId:", req.userId);

    const reports = await Report.find({ userId: req.userId }).sort({
      createdAt: -1,
    });

    res.json(reports);
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// POST /api/reports
router.post("/", authMiddleware, async (req, res) => {
  try {
    const report = await generateAIReport(req.userId, "report");
    res.status(201).json(report);
  } catch (error) {
    console.error("Failed to generate report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

module.exports = router;
