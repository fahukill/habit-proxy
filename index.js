const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI || "", {
    dbName: "habit-sync-ai",
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware to check API key
app.use((req, res, next) => {
  const clientKey = req.headers["authorization"];
  if (clientKey !== `Bearer ${API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// User model
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    subscription: {
      type: String,
      enum: ["Free", "Pro", "Coach"],
      default: "Free",
    },
  })
);

// Habit model
const Habit = mongoose.model(
  "Habit",
  new mongoose.Schema({
    name: String,
    frequency: { type: String, enum: ["daily", "weekly", "monthly"] },
    userId: String,
  })
);

// Test route
app.get("/", (req, res) => {
  res.send("HabitSyncAI Proxy API is running.");
});

// Create user
app.post("/api/users", async (req, res) => {
  const { name, email, password } = req.body;
  const subscription = (req.body.subscription || "Free").trim();

  if (!email || !password)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already in use" });

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      subscription,
    });

    // 🔐 Create Stripe customer if Pro or Coach
    if (["Pro", "Coach"].includes(subscription)) {
      try {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        await stripe.customers.create({
          name,
          email,
          metadata: {
            userId: user._id.toString(),
            tier: subscription,
          },
        });
      } catch (err) {
        console.error("Stripe customer creation failed:", err);
      }
    }

    res.status(201).json({ id: user._id });
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all habits for a user
app.get("/api/habits", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const habits = await Habit.find({ userId });
    res.json(habits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add a new habit
app.post("/api/habits", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { name, frequency } = req.body;
  if (!userId || !name || !frequency)
    return res.status(400).json({ error: "Missing data" });

  try {
    const habit = await Habit.create({ name, frequency, userId });
    res.status(201).json(habit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a habit
app.delete("/api/habits/:id", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const habitId = req.params.id;

  try {
    const deleted = await Habit.findOneAndDelete({ _id: habitId, userId });
    if (deleted) res.json({ success: true });
    else res.status(404).json({ error: "Not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Log user in by email/password (mocked for now — no session issued)
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing credentials" });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });

    const bcrypt = require("bcryptjs");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: "Invalid email or password" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      subscription: user.subscription,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Habit Log model
const HabitLog = mongoose.model(
  "HabitLog",
  new mongoose.Schema({
    userId: String,
    habitId: String,
    date: String,
  })
);

// Log a habit
app.post("/api/habit-log", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { habitId, date } = req.body;
  if (!userId || !habitId)
    return res.status(400).json({ error: "Missing data" });

  try {
    const today = date || new Date().toISOString().split("T")[0];
    const log = await HabitLog.create({ userId, habitId, date: today });
    res.status(201).json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user's habit logs
app.get("/api/habit-log", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const logs = await HabitLog.find({ userId });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Report model
const Report = mongoose.model(
  "Report",
  new mongoose.Schema({
    userId: String,
    date: String,
    content: String,
  })
);

// Get all reports
app.get("/api/reports", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const reports = await Report.find({ userId }).sort({ date: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Generate a new report (mock content)
app.post("/api/reports", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  const date = new Date().toISOString();
  try {
    const content = "This is a sample AI-generated report.";
    const report = await Report.create({ userId, date, content });
    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Streak route (mocked for now)
app.get("/api/streaks", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  res.json({ daily: 3, weekly: 1, monthly: 0 }); // mock data
});

// Onboarding model
const Onboarding = mongoose.model(
  "Onboarding",
  new mongoose.Schema({
    userId: String,
    objective: String,
  })
);

// Save onboarding objective
app.post("/api/onboarding", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { objective } = req.body;
  if (!userId || !objective)
    return res.status(400).json({ error: "Missing data" });

  try {
    const doc = await Onboarding.findOneAndUpdate(
      { userId },
      { objective },
      { upsert: true, new: true }
    );
    res.status(200).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get onboarding objective
app.get("/api/onboarding", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const doc = await Onboarding.findOne({ userId });
    res.status(200).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete user and their data
app.delete("/api/user", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    await Promise.all([
      User.deleteOne({ _id: userId }),
      Habit.deleteMany({ userId }),
      HabitLog.deleteMany({ userId }),
      Report.deleteMany({ userId }),
      Onboarding.deleteMany({ userId }),
    ]);
    res.status(200).json({ message: "Account and data deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// Log a habit entry
app.post("/api/habit-log", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { habitId, note = "" } = req.body;
  if (!userId || !habitId)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const Log =
      mongoose.models.HabitLog ||
      mongoose.model(
        "HabitLog",
        new mongoose.Schema({
          habitId: String,
          userId: String,
          note: String,
          date: { type: Date, default: () => new Date() },
        })
      );
    await Log.create({ habitId, userId, note });
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Fetch all habit logs for the user
app.get("/api/habit-log", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const Log =
      mongoose.models.HabitLog ||
      mongoose.model(
        "HabitLog",
        new mongoose.Schema({
          habitId: String,
          userId: String,
          note: String,
          date: { type: Date, default: () => new Date() },
        })
      );
    const logs = await Log.find({ userId }).sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Generate a fake AI report (placeholder)
app.post("/api/reports", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  res
    .status(201)
    .json({ message: "Your personalized report has been generated." });
});

// Get saved reports (placeholder)
app.get("/api/reports", async (req, res) => {
  res.json([{ date: new Date(), content: "Sample report data." }]);
});

// Get streaks (mocked)
app.get("/api/streaks", async (req, res) => {
  res.json([
    { habit: "Run", streak: 5 },
    { habit: "Read", streak: 3 },
  ]);
});

// Save onboarding objective
app.post("/api/onboarding", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { objective } = req.body;
  if (!userId || !objective)
    return res.status(400).json({ error: "Missing fields" });

  const Onboarding =
    mongoose.models.Objective ||
    mongoose.model(
      "Objective",
      new mongoose.Schema({
        userId: String,
        objective: String,
      })
    );

  await Onboarding.findOneAndUpdate(
    { userId },
    { objective },
    { upsert: true }
  );

  res.json({ success: true });
});

// Get onboarding objective
app.get("/api/onboarding", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  const entry = await Onboarding.findOne({ userId });
  res.json(entry || {});
});

// Generate and save AI report (real model, placeholder logic)
app.post("/api/reports", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const content = "Here is your AI-generated habit report (stub).";
    const report = await Report.create({ userId, content, tags: ["ai"] });
    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Return reports for the user
app.get("/api/reports", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const reports = await Report.find({ userId }).sort({ date: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// CRON route: regenerate latest report (stub)
app.post("/api/cron/generate-reports", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const content = "Generated by CRON AI (stub).";
    const report = await Report.create({ userId, content, tags: ["cron"] });
    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Habit log model and streak calculation
const Log =
  mongoose.models.HabitLog ||
  mongoose.model(
    "HabitLog",
    new mongoose.Schema({
      habitId: String,
      userId: String,
      note: String,
      date: { type: Date, default: () => new Date() },
    })
  );
app.get("/api/streaks", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const logs = await Log.find({ userId });
    const streaks = {};

    logs.forEach((log) => {
      const key = log.habitId;
      const date = new Date(log.date).toISOString().split("T")[0];
      if (!streaks[key]) streaks[key] = new Set();
      streaks[key].add(date);
    });

    const results = Object.entries(streaks).map(([habitId, days]) => ({
      habitId,
      streak: days.size,
    }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const { Configuration, OpenAIApi } = require("openai");

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

// AI-powered report generation
app.post("/api/reports", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const logs = await Log.find({ userId }).sort({ date: -1 }).limit(50);
    const logText = logs
      .map(
        (log) =>
          `- ${log.habitId}: ${log.note || "No notes"} (${new Date(
            log.date
          ).toLocaleDateString("en-US")})`
      )
      .join("\n");

    const prompt = `You are a motivational wellness coach. Based on the user's recent habit logs, write a short 2-paragraph report that summarizes their efforts and encourages them to continue.\n\nHabit logs:\n${logText}`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const content =
      completion.data.choices[0]?.message?.content || "AI report unavailable.";

    const report = await Report.create({
      userId,
      content,
      tags: ["ai", "openai"],
    });
    res.status(201).json(report);
  } catch (err) {
    console.error("OpenAI report error:", err);
    res.status(500).json({ error: "AI generation failed" });
  }
});
