const express = require("express");
const router = express.Router();
const ReportActivity = require("../../models/ReportActivity");

const PDFDocument = require("pdfkit");
const stream = require("stream");

router.get("/export-reports", async (req, res) => {
  const { format } = req.query;

  try {
    const reports = await ReportActivity.find({ userId: req.userId }).sort({
      createdAt: -1,
    });

    if (!reports.length) {
      return res.status(404).json({ error: "No reports found" });
    }

    if (format === "json") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=habit_reports.json`
      );
      res.setHeader("Content-Type", "application/json");
      return res.send(JSON.stringify(reports, null, 2));
    }

    if (format === "pdf") {
      const doc = new PDFDocument();
      const pass = new stream.PassThrough();

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=habit_reports.pdf`
      );
      res.setHeader("Content-Type", "application/pdf");
      doc.pipe(pass);

      doc
        .fontSize(16)
        .text("HabitSyncAI – Report History", { underline: true })
        .moveDown();

      reports.forEach((report, i) => {
        doc.fontSize(12).text(`Report #${i + 1}`, { bold: true });
        doc
          .fontSize(10)
          .text(`Date: ${new Date(report.createdAt).toLocaleDateString()}`);
        doc
          .moveDown()
          .text(report.content || "No content")
          .moveDown();
      });

      doc.end();
      pass.pipe(res);
      return;
    }

    return res.status(400).json({ error: "Invalid format" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Final export line
module.exports = router;
