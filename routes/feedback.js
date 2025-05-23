const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const sendEmail = require("../lib/emailClient");

router.post("/", authMiddleware, async (req, res) => {
  const { message, pageUrl, userAgent } = req.body;
  const userId = req.userId;
  const firstName = req.firstName;
  const lastName = req.lastName;
  const email = req.email;
  const subscription = req.subscription;

  if (!message) {
    return res.status(400).json({ error: "Feedback message is required" });
  }

  try {
    await sendEmail({
      to: process.env.FEEDBACK_RECEIVER_EMAIL, // e.g. "forest@habitsyncai.com"
      subject: `📝 Feedback from User ${userId}`,
      html: `
  <p><strong>User ID:</strong> ${userId}</p>
  <p><strong>Page:</strong> ${pageUrl}</p>
  <p><strong>User Agent:</strong> ${userAgent}</p>
  <p><strong>Name:</strong> ${firstName} ${lastName}</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Subscription:</strong> ${subscription}</p>
  <p><strong>Message:</strong></p>
  <pre>${message}</pre>
`,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Failed to send feedback email:", err);
    res.status(500).json({ error: "Failed to send feedback email" });
  }
});

module.exports = router;
