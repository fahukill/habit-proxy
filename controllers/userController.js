const User = require("../models/User");
const ReportActivity = require("../models/ReportActivity");
const { Parser } = require("json2csv");
const sendEmail = require("../utils/sendEmail");

module.exports = {

// From activityLog.js
const ReportActivity = require("../../models/ReportActivity");
const authMiddleware = require("../../middleware/auth");
const { Parser } = require("json2csv");

get("/activity-log", authMiddleware, async (req, res) => => {
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

// From changePassword.js
const bcrypt = require("bcryptjs");

const User = require("../../models/User"); // Adjust path as needed
const authMiddleware = require("../../middleware/auth");

post("/change-password", authMiddleware, async (req, res) => => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  try {
    const user = await User.findById(userId);
    if (!user || !user.password)
      return res
        .status(400)
        .json({ error: "User not found or no password set." });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(403).json({ error: "Current password is incorrect." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: "Password updated." });
  } catch (err) {
    console.error("Password update error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// From coachingTone.js
const User = require("../../models/User");
const authMiddleware = require("../../middleware/auth");

get("/coaching-tone", authMiddleware, async (req, res) => => {
  try {
    const user = await User.findById(req.userId).select("coachingTone");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ tone: user.coachingTone || "Uplifting" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

post("/coaching-tone", authMiddleware, async (req, res) => => {
  const { tone } = req.body;
  const allowed = ["Uplifting", "Tough Love", "Humorous"];
  if (!allowed.includes(tone)) {
    return res.status(400).json({ error: "Invalid tone option" });
  }

  try {
    const result = await User.findByIdAndUpdate(req.userId, {
      coachingTone: tone,
    });
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ message: "Tone updated" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// From delete.js
const User = require("../../models/User");
const Habit = require("../../models/Habit");
const HabitLog = require("../../models/HabitLog");
const Report = require("../../models/Report");
const authMiddleware = require("../../middleware/auth");

post("/delete", authMiddleware, async (req, res) => => {
  try {
    await Habit.deleteMany({ userId: req.userId });
    await HabitLog.deleteMany({ userId: req.userId });
    await Report.deleteMany({ userId: req.userId });
    const result = await User.findByIdAndDelete(req.userId);
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ message: "User account deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete account" });
  }
});

// From email-reports.js
const User = require("../../models/User");
const Report = require("../../models/Report");
const ReportActivity = require("../../models/ReportActivity");
const authMiddleware = require("../../middleware/auth");
const sendEmail = require("../../utils/sendEmail");

post("/email-reports", authMiddleware, async (req, res) => => {
  try {
    const user = await User.findById(req.userId);
    const reports = await Report.find({ userId: req.userId }).sort({
      createdAt: -1,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!user.email || !reports.length) {
      return res.status(400).json({ error: "Missing email or reports" });
    }

    const html = `
      <h2>Your HabitSyncAI Report History</h2>
      ${reports
        .map(
          (r, i) => `
        <h4>Report #${i + 1}</h4>
        <p><strong>Date:</strong> ${new Date(
          r.createdAt
        ).toLocaleDateString()}</p>
        <p>${r.content}</p>
        <hr/>
      `
        )
        .join("")}
    `;

    await sendEmail({
      to: user.email,
      subject: "Your HabitSyncAI Report History",
      html,
    });

    await ReportActivity.create({
      userId: req.userId,
      reportId: null,
      type: "email",
      timestamp: new Date(),
    });

    res.json({ message: "Reports emailed" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// From export.js
const Habit = require("../../models/Habit");
const HabitLog = require("../../models/HabitLog");
const authMiddleware = require("../../middleware/auth");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");
const stream = require("stream");

get("/export", authMiddleware, async (req, res) => => {
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

// From exportReports.js
const Report = require("../../models/Report");
const authMiddleware = require("../../middleware/auth");
const PDFDocument = require("pdfkit");
const stream = require("stream");

get("/export-reports", authMiddleware, async (req, res) => => {
  const { format } = req.query;

  try {
    const reports = await Report.find({ userId: req.userId }).sort({
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to export reports" });
  }
});

// From notifications.js
const User = require("../../models/User");
const authMiddleware = require("../../middleware/auth");

get("/notifications", authMiddleware, async (req, res) => => {
  try {
    const user = await User.findById(req.userId).select("notifications");
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json(user.notifications || {});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

post("/notifications", authMiddleware, async (req, res) => => {
  try {
    const result = await User.findByIdAndUpdate(req.userId, {
      notifications: req.body,
    });
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ message: "Preferences updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// From reset.js
const Habit = require("../../models/Habit");
const HabitLog = require("../../models/HabitLog");
const Report = require("../../models/Report");
const authMiddleware = require("../../middleware/auth");

post("/reset", authMiddleware, async (req, res) => => {
  try {
    await Habit.deleteMany({ userId: req.userId });
    await HabitLog.deleteMany({ userId: req.userId });
    await Report.deleteMany({ userId: req.userId });
    return res.json({ message: "Data reset complete" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to reset data" });
  }
});

// From startOfWeek.js
const User = require("../../models/User");
const authMiddleware = require("../../middleware/auth");

get("/start-of-week", authMiddleware, async (req, res) => => {
  try {
    const user = await User.findById(req.userId).select("startOfWeek");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ startOfWeek: user.startOfWeek || "Sunday" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

post("/start-of-week", authMiddleware, async (req, res) => => {
  const { startOfWeek } = req.body;
  if (!["Sunday", "Monday"].includes(startOfWeek)) {
    return res.status(400).json({ error: "Invalid value" });
  }

  try {
    const result = await User.findByIdAndUpdate(req.userId, { startOfWeek });
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ message: "Updated" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// From subscription.js
const User = require("../../models/User");
const authMiddleware = require("../../middleware/auth");

// GET current subscription and renewalDate
get("/subscription", authMiddleware, async (req, res) => => {
  try {
    const user = await User.findById(req.userId).select(
      "subscription renewalDate"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      subscription: user.subscription,
      renewalDate: user.renewalDate || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST update subscription (placeholder for Stripe logic)
post("/subscription", authMiddleware, async (req, res) => => {
  const { subscription } = req.body;
  const allowed = ["Free", "Pro", "Coach"];

  if (!allowed.includes(subscription)) {
    return res.status(400).json({ error: "Invalid tier" });
  }

  try {
    const update = { subscription };

    // Optional: Set renewalDate only if switching to a paid tier
    if (subscription === "Pro" || subscription === "Coach") {
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      update.renewalDate = oneMonthLater;
    } else {
      update.renewalDate = null; // Clear if going back to Free
    }

    const result = await User.findByIdAndUpdate(req.userId, update);
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ message: "Subscription updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

};
