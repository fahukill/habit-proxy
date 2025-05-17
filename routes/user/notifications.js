const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const authMiddleware = require("../../middleware/auth");

router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("notifications");
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json(user.notifications || {});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/notifications", authMiddleware, async (req, res) => {
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

module.exports = router;
