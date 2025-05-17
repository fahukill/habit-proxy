const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const authMiddleware = require("../../middleware/auth");

// GET current subscription
router.get("/subscription", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("subscription");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ subscription: user.subscription });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST update subscription
router.post("/subscription", authMiddleware, async (req, res) => {
  const { subscription } = req.body;
  const allowed = ["Free", "Pro", "Coach"];
  if (!allowed.includes(subscription)) {
    return res.status(400).json({ error: "Invalid tier" });
  }

  try {
    await User.findByIdAndUpdate(req.userId, { subscription });
    return res.json({ message: "Subscription updated" });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
