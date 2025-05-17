const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

router.post("/signup", async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });
    await user.save();

    res.status(201).json({ message: "User created", userId: user._id });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

module.exports = router;
