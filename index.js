const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const OpenAI = require("openai");
<<<<<<< HEAD

=======
const cron = require("node-cron");
>>>>>>> 4c6a1e2 (Refactor: Remove unused controllers, routes, and middleware; consolidate user and habit management logic into index.js; implement AI report generation and motivation features; update user profile handling; enhance error handling and validation.)
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const { sendReportEmail } = require("./utils/email");

const app = express();

const { z } = require("zod");

const LogEntrySchema = z.object({
  habitId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  note: z.string().optional(),
});

<<<<<<< HEAD
=======
const ReportActivity =
  mongoose.models.ReportActivity ||
  mongoose.model(
    "ReportActivity",
    new mongoose.Schema({
      userId: String,
      reportId: String,
      type: { type: String, enum: ["manual", "auto"], required: true },
      timestamp: { type: Date, default: () => new Date() },
    })
  );

>>>>>>> 4c6a1e2 (Refactor: Remove unused controllers, routes, and middleware; consolidate user and habit management logic into index.js; implement AI report generation and motivation features; update user profile handling; enhance error handling and validation.)
/* ----------------------------- MODELS ----------------------------- */
const Onboarding =
  mongoose.models.Onboarding ||
  mongoose.model(
    "Onboarding",
    new mongoose.Schema({
      userId: String,
      objective: String,
      name: String,
      timezone: String,
      habits: Array,
      motivation: String,
    })
  );

const Motivation =
  mongoose.models.Motivation ||
  mongoose.model(
    "Motivation",
    new mongoose.Schema({
      userId: String,
      message: String,
      date: String,
    })
  );

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
      userId: String,
      name: String,
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        required: true,
      },
      days: [String],
      createdAt: { type: Date, default: () => new Date() },
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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ----------------------------- MIDDLEWARE ----------------------------- */
app.use(express.json());
app.use(
  cors({
    origin: "https://www.habitsyncai.com",
    methods: ["GET", "POST", "OPTIONS", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-id",
      "x-timezone", // ✅ allow this
    ],
  })
);
app.options("*", cors());
mongoose
  .connect(process.env.MONGODB_URI || "", { dbName: "habit-sync-ai" })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use((req, res, next) => {
  const clientKey = req.headers["authorization"];
  if (clientKey !== `Bearer ${API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

/* ----------------------------- ROUTES ----------------------------- */
// Will complete next
/* ----------------------------- ROUTES: AUTH ----------------------------- */
app.post("/api/user", async (req, res) => {
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

    if (["Pro", "Coach"].includes(subscription)) {
      try {
        await stripe.customers.create({
          email,
          name: `${firstName} ${lastName}`,
          metadata: { userId: newUser._id.toString(), tier: subscription },
        });
      } catch (stripeErr) {
        console.error("Stripe error:", stripeErr.message);
      }
    }

    return res.status(201).json({ id: newUser._id });
  } catch (err) {
    console.error("Signup error:", err.message || err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
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

    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      subscription: user.subscription,
    });
  } catch (err) {
    console.error("Login error:", err.message || err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------------------- ROUTES: HABITS ----------------------------- */
app.post("/api/habits", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { name, frequency, days } = req.body;

  if (!userId || !name || !frequency) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const habit = await Habit.create({ userId, name, frequency, days });
    res.status(201).json(habit);
  } catch (err) {
    res.status(500).json({ error: "Failed to save habit" });
  }
});

app.get("/api/habits", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const habits = await Habit.find({ userId });
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: "Failed to load habits" });
  }
});

app.put("/api/habits/:id", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { id } = req.params;
  const { name, frequency, days, goal } = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: id, userId },
      { name, frequency, days, goal },
      { new: true }
    );
    res.json(habit);
  } catch (err) {
    res.status(500).json({ error: "Failed to update habit" });
  }
});

app.delete("/api/habits/:id", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { id } = req.params;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await Habit.deleteOne({ _id: id, userId });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete habit" });
  }
});

/* ----------------------------- ROUTES: HABIT LOGS ----------------------------- */
app.post("/api/habit-logs", async (req, res) => {
  const userId = req.headers["x-user-id"];

  // Combine the userId into the body for validation
  const result = LogEntrySchema.safeParse({
    ...req.body,
    userId,
  });

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  let { habitId, date, note, timezone } = result.data;

  if (!date && timezone) {
    try {
      const now = new Date();
      const localDate = new Intl.DateTimeFormat("sv-SE", {
        timeZone: timezone,
      }).format(now);
      date = localDate; // e.g. "2024-06-16"
    } catch {
      console.warn("⚠️ Invalid timezone provided:", timezone);
      date = new Date().toLocaleDateString("sv-SE");
    }
  }

  try {
    const log = await HabitLog.create({ userId, habitId, date, note });
    res.status(201).json(log);
  } catch (err) {
    console.error("🔥 Error saving log:", err);
    res.status(500).json({ error: "Failed to save log" });
  }
});

app.get("/api/habit-logs", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { start, end } = req.query;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const query = {
    userId,
    ...(start && end
      ? { date: { $gte: new Date(start), $lte: new Date(end) } }
      : {}),
  };

  try {
    const logs = await HabitLog.find(query);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to load logs" });
  }
});

/* ----------------------------- ROUTES: OBJECTIVE / ONBOARDING ----------------------------- */
app.get("/api/objective", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const obj = await Onboarding.findOne({ userId });
  res.json({ objective: obj?.objective || "" });
});

app.post("/api/onboarding", async (req, res) => {
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

/* ----------------------------- ROUTES: AI REPORT / ENCOURAGEMENT ----------------------------- */
app.post("/api/reports", async (req, res) => {
  const timezone = req.headers["x-timezone"] || "UTC";
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const logs = await HabitLog.find({ userId }).sort({ date: -1 }).limit(50);
    const logText = logs
      .map((log) => {
        const localDate = new Intl.DateTimeFormat("sv-SE", {
          timeZone: timezone,
        }).format(new Date(log.date));
        return `- ${log.habitId}: ${log.note || "No notes"} (${localDate})`;
      })
      .join("\n");

    const prompt = `You are a motivational wellness coach. Based on the user's recent habit logs, write a short 2-paragraph report that summarizes their efforts and encourages them to continue.

Habit logs:
${logText}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const content =
      completion.choices?.[0]?.message?.content || "AI report unavailable.";
    const report = await Report.create({ userId, content, tags: ["ai"] });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: "AI generation failed" });
  }
});

app.get("/api/encouragement", async (req, res) => {
  const timezone = req.headers["x-timezone"] || "UTC";
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: timezone }).format(
    new Date()
  );
  const existing = await Motivation.findOne({ userId, date: today });
  if (existing) return res.json({ message: existing.message });

  const user = await User.findById(userId);
  const habits = await Habit.find({ userId });
  const logs = await HabitLog.find({ userId });

  const streakCount = logs.length;
  const prompt = `
You're an encouraging wellness coach. Write 1–2 short sentences of personalized motivation.

User: ${user?.firstName || "friend"}
Habits:
${habits.map((h) => `• ${h.name} — ${h.goal || "No goal provided"}`).join("\n")}

This user has logged ${streakCount} habit entries.

Respond as if you're speaking directly to ${
    user?.firstName || "them"
  }, with warmth, motivation, and support.
`;

  const aiRes = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: prompt }],
  });

  const message =
    aiRes.choices[0]?.message?.content?.trim() ||
    "Keep pushing forward, you're doing great!";

  await Motivation.create({ userId, message, date: today });
  res.json({ message });
});

/* ----------------------------- ROUTES: DEFAULT ----------------------------- */
app.get("/", (req, res) => {
  res.send("HabitSyncAI Proxy API is running.");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

<<<<<<< HEAD
=======
cron.schedule("0 0 * * 0", async () => {
  const users = await User.find({});
  for (const user of users) {
    const logs = await HabitLog.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(50);
    const logText = logs
      .map((log) => `- ${log.habitId}: ${log.note || "No notes"}`)
      .join("\n");

    const prompt = `Write a short 2-paragraph report based on these logs:\n${logText}`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const content =
      completion.choices?.[0]?.message?.content || "AI report unavailable.";
    const report = await Report.create({
      userId: user._id,
      content,
      tags: ["ai", "auto"],
    });

    await ReportActivity.create({
      userId: user._id,
      reportId: report._id,
      type: "auto",
    });

    // TODO: email report to user.email
    await sendReportEmail(user.email, content);
  }
});

>>>>>>> 4c6a1e2 (Refactor: Remove unused controllers, routes, and middleware; consolidate user and habit management logic into index.js; implement AI report generation and motivation features; update user profile handling; enhance error handling and validation.)
app.patch("/api/habit-logs/:id", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { id } = req.params;
  const { note } = req.body;

  if (!userId || !id || typeof note !== "string") {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const updated = await HabitLog.findOneAndUpdate(
      { _id: id, userId },
      { note },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    console.error("🔥 Failed to update note:", err);
    res.status(500).json({ error: "Failed to update note" });
  }
});

app.delete("/api/habit-logs/:id", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { id } = req.params;

  if (!userId || !id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await HabitLog.deleteOne({ _id: id, userId });
    res.status(204).end();
  } catch (err) {
    console.error("🔥 Failed to delete note:", err);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

app.get("/api/profile", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await User.findById(userId).lean();
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    subscription: user.subscription,
  });
});

app.put("/api/profile", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { firstName, lastName } = req.body;

  if (!userId || !firstName || !lastName)
    return res.status(400).json({ error: "Missing fields" });

  const user = await User.findByIdAndUpdate(
    userId,
    { firstName, lastName },
    { new: true }
  );

  res.json({
    firstName: user.firstName,
    lastName: user.lastName,
  });
});

const userNotificationsRoute = require("./routes/user/notifications");
app.use("/user", userNotificationsRoute);

const subscriptionRoute = require("./routes/user/subscription");
app.use("/user", subscriptionRoute);

const exportRoute = require("./routes/user/export");
app.use("/user", exportRoute);

const reportRoutes = require("./routes/user/exportReports");
const emailReportRoutes = require("./routes/user/email-reports"); // ✅

app.use("/user", reportRoutes);
app.use("/user", emailReportRoutes);

const activityLogRoute = require("./routes/user/activityLog");
app.use("/user", activityLogRoute);

const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);
