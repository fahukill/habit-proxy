const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com", // 📍 Namecheap SMTP server
  port: 465, // 📍 SSL port (use 587 if you want TLS instead)
  secure: true, // 📍 true for 465 (SSL), false for 587 (TLS)
  auth: {
    user: process.env.EMAIL_WELCOME_SENDER, // 📧 full email address (e.g. support@habitsyncai.com)
    pass: process.env.EMAIL_WELCOME_PASSWORD, // 🔑 mailbox password or app-specific password
  },
});

async function sendWelcomeEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"HabitSyncAI" <${process.env.EMAIL_WELCOME_SENDER}>`,
      to,
      subject,
      html,
    });

    console.log("📨 Welcome email sent:", {
      to,
      messageId: info.messageId,
      response: info.response,
    });

    return info;
  } catch (err) {
    console.error("❌ Failed to send welcome email:", err);
    throw err;
  }
}

module.exports = sendWelcomeEmail;
