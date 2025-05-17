const express = require("express");
const router = express.Router();
const Habit = require("../../models/Habit");
const HabitLog = require("../../models/HabitLog");

const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");
const stream = require("stream");

router.get("/export", async (req, res) => {
  const { format } = req.query;

  try {
    const habits = await Habit.find({ userId: req.userId });
    const logs = await HabitLog.find({ userId: req.userId });
    if (!habits.length && !logs.length) {
      return res.status(404).json({ error: "No habit data found" });
    }

    if (format === "json") {
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=habit_data.json"
      );
      res.setHeader("Content-Type", "application/json");
      return res.send(JSON.stringify({ habits, logs }, null, 2));
    }

    if (format === "csv") {
      const fields = ["habitId", "habitName", "date", "note"];
      const data = logs.map((log) => ({
        habitId: log.habitId,
        habitName:
          habits.find((h) => h._id.equals(log.habitId))?.name || "Unknown",
        date: log.date.toISOString().split("T")[0],
        note: log.note || "",
      }));
      const parser = new Parser({ fields });
      const csv = parser.parse(data);
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=habit_data.csv"
      );
      res.setHeader("Content-Type", "text/csv");
      return res.send(csv);
    }

    if (format === "pdf") {
      const doc = new PDFDocument();
      const pass = new stream.PassThrough();
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=habit_data.pdf"
      );
      res.setHeader("Content-Type", "application/pdf");
      doc.pipe(pass);

      doc
        .fontSize(16)
        .text("HabitSyncAI – Habit Log History", { underline: true })
        .moveDown();

      habits.forEach((habit) => {
        doc.fontSize(12).text(`Habit: ${habit.name}`);
        const habitLogs = logs.filter((l) => l.habitId.equals(habit._id));
        habitLogs.forEach((log) => {
          doc
            .fontSize(10)
            .text(
              `• ${log.date.toISOString().split("T")[0]}: ${log.note || "✓"}`
            );
        });
        doc.moveDown();
      });

      doc.end();
      pass.pipe(res);
      return;
    }

    return res.status(400).json({ error: "Invalid export format" });
  } catch (err) {
    console.error("Export error:", err);
    return res.status(500).json({ error: "Failed to export data" });
  }
});

module.exports = router;
