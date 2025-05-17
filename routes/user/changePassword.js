const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../../models/User"); // Adjust path as needed

router.post("/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  try {
    const user = await User.findById(userId);
    if (!user || !user.password)
      return res
        .status(400)
        .json({ error: "User not found or no password set." });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(403).json({ error: "Current password is incorrect." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: "Password updated." });
  } catch (err) {
    console.error("Password update error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
