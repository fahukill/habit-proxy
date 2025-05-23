const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com", // 📍 Namecheap SMTP server
  port: 465, // 📍 SSL port (use 587 if you want TLS instead)
  secure: true, // 📍 true for 465 (SSL), false for 587 (TLS)
  auth: {
    user: process.env.EMAIL_SENDER, // 📧 full email address (e.g. support@habitsyncai.com)
    pass: process.env.EMAIL_PASSWORD, // 🔑 mailbox password or app-specific password
  },
});

async function sendEmail({ to, subject, html }) {
  return transporter.sendMail({
    from: process.env.EMAIL_SENDER,
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;
