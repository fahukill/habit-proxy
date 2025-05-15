// Fixed version with corrected syntax and cleaned structure
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const OpenAI = require("openai");

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

// Models
const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      password: String,
      subscription: {
        type: String,
        enum: ["Free", "Pro", "Coach"],
        default: "Free",
      },
    })
  );

const Habit =
  mongoose.models.Habit ||
  mongoose.model(
    "Habit",
    new mongoose.Schema({
      name: String,
      frequency: { type: String, enum: ["daily", "weekly", "monthly"] },
      userId: String,
    })
  );

const HabitLog =
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

const Report =
  mongoose.models.Report ||
  mongoose.model(
    "Report",
    new mongoose.Schema({
      userId: String,
      content: String,
      tags: [String],
      date: { type: Date, default: () => new Date() },
    })
  );

const Onboarding =
  mongoose.models.Onboarding ||
  mongoose.model(
    "Onboarding",
    new mongoose.Schema({
      userId: String,
      objective: String,
    })
  );

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware to check API key
app.use((req, res, next) => {
  const clientKey = req.headers["authorization"];
  if (clientKey !== `Bearer ${API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

app.get("/", (req, res) => {
  res.send("HabitSyncAI Proxy API is running.");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Example cleaned route: AI-powered report generation
app.post("/api/reports", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const logs = await HabitLog.find({ userId }).sort({ date: -1 }).limit(50);
    const logText = logs
      .map(
        (log) =>
          `- ${log.habitId}: ${log.note || "No notes"} (${new Date(
            log.date
          ).toLocaleDateString("en-US")})`
      )
      .join("\n");

    const prompt = `You are a motivational wellness coach. Based on the user's recent habit logs, write a short 2-paragraph report that summarizes their efforts and encourages them to continue.\n\nHabit logs:\n${logText}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const content =
      completion.choices?.[0]?.message?.content || "AI report unavailable.";
    const report = await Report.create({ userId, content, tags: ["ai"] });
    res.status(201).json(report);
  } catch (err) {
    console.error("OpenAI report error:", err);
    res.status(500).json({ error: "AI generation failed" });
  }
});
