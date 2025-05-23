const express = require("express");
const router = express.Router();

const generateWelcomeEmail = require("../../lib/emailTemplates/welcomeEmail");
const sendWelcomeEmail = require("../../lib/emailWelcome");

router.post("/", async (req, res) => {
  const { email, firstName } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Missing recipient email" });
  }

  try {
    const { subject, html } = generateWelcomeEmail({ firstName });

    await sendWelcomeEmail({ to: email, subject, html });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Failed to send welcome email:", err);
    res.status(500).json({ error: "Failed to send welcome email" });
  }
});

module.exports = router;
