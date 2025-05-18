require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const OpenAI = require("openai");
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const { sendReportEmail } = require("./utils/email");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const { sendReportEmail } = require("./utils/email");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();

const { z } = require("zod");

const LogEntrySchema = z.object({
  habitId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  note: z.string().optional(),
});

/* ----------------------------- MODELS ----------------------------- */
const Onboarding = require("./models/Onboarding");
const Motivation = require("./models/Motivation");
const User = require("./models/User");
const Habit = require("./models/Habit");
const HabitLog = require("./models/HabitLog");
const ReportActivity = require("./models/ReportActivity");
const Report = require("./models/Report");
const Onboarding = require("./models/Onboarding");
const Motivation = require("./models/Motivation");
const User = require("./models/User");
const Habit = require("./models/Habit");
const HabitLog = require("./models/HabitLog");
const ReportActivity = require("./models/ReportActivity");
const Report = require("./models/Report");

/* ----------------------------- MIDDLEWARE ----------------------------- */
app.use(express.json());
app.use(
  cors({
    origin: ["https://www.habitsyncai.com", "http://localhost:3000"],
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
    console.log("✅ Hashed password:", hashedPassword);
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
    console.warn("❌ Missing credentials");
    return res.status(400).json({ message: "Missing credentials" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.warn("❌ No user found for:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("🔍 Found user:", user.email);
    console.log("🔐 Incoming password:", password);
    console.log("🔐 Stored hash:", user.password);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔍 bcrypt.compare result:", isMatch);

    if (!isMatch) {
      console.warn("❌ Incorrect password for:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

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
    console.error("🔥 Login error:", err.message || err);
    return res.status(500).json({ message: "Server error" });
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

  try {
    const today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: timezone,
    }).format(new Date());

    const existing = await Motivation.findOne({ userId, date: today });
    if (existing) return res.json({ message: existing.message });
  try {
    const today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: timezone,
    }).format(new Date());

    const existing = await Motivation.findOne({ userId, date: today });
    if (existing) return res.json({ message: existing.message });

    const user = await User.findById(userId).lean();
    const habits = await Habit.find({ userId }).lean();
    const logs = await HabitLog.find({ userId }).lean();

    const prompt = `
    const user = await User.findById(userId).lean();
    const habits = await Habit.find({ userId }).lean();
    const logs = await HabitLog.find({ userId }).lean();

    const prompt = `
You're an encouraging wellness coach. Write 1–2 short sentences of personalized motivation.

User: ${user?.firstName || "friend"}
Habits:\n${habits.map((h) => `- ${h.name}: ${h.goal || "no goal"}`).join("\n")}
Total logs: ${logs.length}
Habits:\n${habits.map((h) => `- ${h.name}: ${h.goal || "no goal"}`).join("\n")}
Total logs: ${logs.length}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
    });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
    });

    const message =
      completion.choices?.[0]?.message?.content?.trim() ||
      "You're doing great! Keep it up.";
    const message =
      completion.choices?.[0]?.message?.content?.trim() ||
      "You're doing great! Keep it up.";

    await Motivation.create({ userId, message, date: today });

    return res.json({ message });
  } catch (err) {
    console.error("💥 encouragement error:", err.message);
    return res.json({ message: "You're doing great! (fallback)" }); // fallback to prevent CORS+502
  }
    await Motivation.create({ userId, message, date: today });

    return res.json({ message });
  } catch (err) {
    console.error("💥 encouragement error:", err.message);
    return res.json({ message: "You're doing great! (fallback)" }); // fallback to prevent CORS+502
  }
});

/* ----------------------------- ROUTES: DEFAULT ----------------------------- */
app.get("/", (req, res) => {
  res.send("HabitSyncAI Proxy API is running.");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

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
