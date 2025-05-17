const express = require("express");
const router = express.Router();
const User = require("../../models/User");

router.get("/coaching-tone", async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("coachingTone");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ tone: user.coachingTone || "Uplifting" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/coaching-tone", async (req, res) => {
  const { tone } = req.body;
  const allowed = ["Uplifting", "Tough Love", "Humorous"];
  if (!allowed.includes(tone)) {
    return res.status(400).json({ error: "Invalid tone option" });
  }

  try {
    const result = await User.findByIdAndUpdate(req.userId, {
      coachingTone: tone,
    });
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ message: "Tone updated" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
