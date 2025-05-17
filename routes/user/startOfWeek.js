const express = require("express");
const router = express.Router();
const User = require("../../models/User");

router.get("/start-of-week", async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("startOfWeek");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ startOfWeek: user.startOfWeek || "Sunday" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/start-of-week", async (req, res) => {
  const { startOfWeek } = req.body;
  if (!["Sunday", "Monday"].includes(startOfWeek)) {
    return res.status(400).json({ error: "Invalid value" });
  }

  try {
    const result = await User.findByIdAndUpdate(req.userId, { startOfWeek });
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ message: "Updated" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
