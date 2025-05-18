const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Habit = require("../models/Habit");
const authMiddleware = require("../middleware/auth"); // adjust if necessary

// POST /user/onboarding
router.post("/onboarding", authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, habits } = req.body;

    await User.findByIdAndUpdate(req.userId, { firstName, lastName });

    if (Array.isArray(habits) && habits.length > 0) {
      const habitDocs = habits.map((h) => ({
        ...h,
        userId: req.userId,
      }));
      await Habit.insertMany(habitDocs);
    }

    res.json({ message: "Onboarding complete" });
  } catch (err) {
    console.error("Onboarding error:", err);
    res.status(500).json({ error: "Failed onboarding" });
  }
});

// GET /user/
router.get("/", authMiddleware, async (req, res) => {
  console.log("req.userId", req.userId);
  console.log("headers", req.headers);
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// POST /user/update
router.post("/update", authMiddleware, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.userId, req.body, {
      new: true,
    }).select("-password");

    if (!updated) return res.status(404).json({ error: "User not found" });

    res.json(updated);
  } catch (err) {
    console.error("User update error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});
// ✅ NEW: GET /user/subscription
router.get("/subscription", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("subscription");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ subscription: user.subscription });
  } catch (err) {
    console.error("Get subscription error:", err);
    res.status(500).json({ error: "Failed to get subscription" });
  }
});

// ✅ NEW: GET /user/notifications
router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "notificationPreferences"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.notificationPreferences || {});
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ error: "Failed to get notifications" });
  }
});

// ✅ NEW: POST /user/notifications
router.post("/notifications", authMiddleware, async (req, res) => {
  try {
    const preferences = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { notificationPreferences: preferences },
      { new: true }
    ).select("notificationPreferences");

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.notificationPreferences);
  } catch (err) {
    console.error("Update notifications error:", err);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

module.exports = router;
