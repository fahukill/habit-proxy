const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const authMiddleware = require("../../middleware/auth");

// GET current subscription and renewalDate
router.get("/subscription", authMiddleware, async (req, res) => {
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
router.post("/subscription", authMiddleware, async (req, res) => {
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

module.exports = router;
