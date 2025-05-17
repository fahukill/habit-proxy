const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const Report = require("../../models/Report");
const ReportActivity = require("../../models/ReportActivity");

const sendEmail = require("../../utils/sendEmail");

router.post("/email-reports", async (req, res) => {
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

module.exports = router;
