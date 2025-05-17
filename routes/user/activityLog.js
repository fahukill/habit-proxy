const express = require("express");
const router = express.Router();
const ReportActivity = require("../../models/ReportActivity");
const authMiddleware = require("../../middleware/auth");
const { Parser } = require("json2csv");

router.get("/activity-log", authMiddleware, async (req, res) => {
  const { format } = req.query;

  try {
    const activity = await ReportActivity.find({ userId: req.userId }).sort({
      timestamp: -1,
    });

    if (!activity.length) {
      return res.status(404).json({ error: "No activity found" });
    }

    if (format === "json") {
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=activity_log.json"
      );
      res.setHeader("Content-Type", "application/json");
      return res.send(JSON.stringify(activity, null, 2));
    }

    if (format === "csv") {
      const data = activity.map((log) => ({
        type: log.type,
        reportId: log.reportId || "",
        timestamp: new Date(log.timestamp).toISOString(),
      }));

      const parser = new Parser({ fields: ["type", "reportId", "timestamp"] });
      const csv = parser.parse(data);

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=activity_log.csv"
      );
      res.setHeader("Content-Type", "text/csv");
      return res.send(csv);
    }

    return res.status(400).json({ error: "Invalid format" });
  } catch (err) {
    console.error("Activity log error:", err);
    return res.status(500).json({ error: "Failed to export activity log" });
  }
});

module.exports = router;
