const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // or change to your SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendReportEmail(to, content) {
  return transporter.sendMail({
    from: `"HabitSyncAI" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Weekly Habit Report",
    text: content,
  });
}

module.exports = { sendReportEmail };
