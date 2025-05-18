// routes/apiRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const OpenAI = require("openai");

const Onboarding = require("../models/Onboarding");
const Motivation = require("../models/Motivation");
const User = require("../models/User");
const Habit = require("../models/Habit");
const HabitLog = require("../models/HabitLog");
const Report = require("../models/Report");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LogEntrySchema = z.object({
  habitId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  note: z.string().optional(),
});

// AUTH
router.post("/user", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const subscription = (req.body.subscription || "Free").trim();

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      subscription,
    });

    return res.status(201).json({ id: newUser._id });
  } catch (err) {
    console.error("Signup error:", err.message || err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    return res.json({
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      image:
        user.image ||
        `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}`,
      subscription: user.subscription || "Free",
    });
  } catch (err) {
    console.error("Login error:", err.message || err);
    return res.status(500).json({ message: "Server error" });
  }
});

// OBJECTIVE / ONBOARDING
router.get("/objective", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const obj = await Onboarding.findOne({ userId });
  res.json({ objective: obj?.objective || "" });
});

router.post("/onboarding", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { objective } = req.body;

  if (!userId || !objective) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    const doc = await Onboarding.findOneAndUpdate(
      { userId },
      { objective },
      { upsert: true, new: true }
    );
    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ENCOURAGEMENT
router.get("/encouragement", async (req, res) => {
  const timezone = req.headers["x-timezone"] || "UTC";
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: timezone,
    }).format(new Date());

    const existing = await Motivation.findOne({ userId, date: today });
    if (existing) return res.json({ message: existing.message });

    const user = await User.findById(userId).lean();
    const habits = await Habit.find({ userId }).lean();
    const logs = await HabitLog.find({ userId }).lean();

    const prompt = `You're an encouraging wellness coach. Write 1–2 short sentences of personalized motivation.\n\nUser: ${
      user?.firstName || "friend"
    }\nHabits:\n${habits
      .map((h) => `- ${h.name}: ${h.goal || "no goal"}`)
      .join("\n")}\nTotal logs: ${logs.length}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
    });

    const message =
      completion.choices?.[0]?.message?.content?.trim() ||
      "You're doing great! Keep it up.";

    await Motivation.create({ userId, message, date: today });

    return res.json({ message });
  } catch (err) {
    console.error("💥 encouragement error:", err.message);
    return res.json({ message: "You're doing great! (fallback)" });
  }
});

module.exports = router;
