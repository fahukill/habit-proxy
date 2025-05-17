router.post("/onboarding", authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, habits } = req.body;

    await User.findByIdAndUpdate(req.userId, {
      firstName,
      lastName,
    });

    if (Array.isArray(habits)) {
      const Habit = require("../models/Habit");
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

router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Failed to get user" });
  }
});

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
