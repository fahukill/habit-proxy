const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { generateAIReport } = require("../utils/generateAIReport");
const Report = require("../models/Report");
const ReportActivity = require("../models/ReportActivity");

// GET /api/reports
router.get("/", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reports = await Report.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments({ userId: req.userId });
    //console.log("🔍 Page:", page, "Reports:", reports.length, "Total:", total);

    res.json({ reports, total });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// POST /api/reports
router.post("/", authMiddleware, async (req, res) => {
  try {
    const report = await generateAIReport(req.userId);

    // ✅ Log activity (manual generation)
    await ReportActivity.create({
      userId: req.userId,
      reportId: report._id.toString(),
      type: "manual",
    });

    res.json(report);
  } catch (err) {
    console.error("Failed to generate report:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

module.exports = router;
