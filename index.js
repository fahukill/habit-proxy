const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const OpenAI = require("openai");

const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: "https://www.habitsyncai.com",
    methods: ["GET", "POST", "OPTIONS", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
  })
);

app.options("*", cors()); // Allow preflight

mongoose
  .connect(process.env.MONGODB_URI || "", { dbName: "habit-sync-ai" })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

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
  console.log("✅ Proxy booted. Listening on /api/* routes...");
});

app.post("/api/user", async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    subscription = "Free",
  } = req.body;
  console.log("▶️ Received signup request:", {
    firstName,
    lastName,
    email,
    subscription,
  });

  if (!firstName || !lastName || !email || !password) {
    console.warn("❌ Missing fields in signup");
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.warn("⚠️ Email already in use:", email);
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

    console.log("✅ User created:", newUser._id.toString());

    if (["Pro", "Coach"].includes(subscription)) {
      try {
        const customer = await stripe.customers.create({
          email,
          name: `${firstName} ${lastName}`,
          metadata: {
            userId: newUser._id.toString(),
            tier: subscription,
          },
        });
        console.log("💳 Stripe customer created:", customer.id);
      } catch (stripeErr) {
        console.error("🚨 Stripe error:", stripeErr.message);
      }
    }

    return res.status(201).json({ id: newUser._id });
  } catch (err) {
    console.error("🔥 Signup error:", err.message || err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("▶️ Login attempt:", email);

  if (!email || !password) {
    console.warn("❌ Missing login fields");
    return res.status(400).json({ message: "Missing credentials" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.warn("❌ No user found for:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn("❌ Incorrect password for:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      subscription: user.subscription,
    });
  } catch (err) {
    console.error("🔥 Login error:", err.message || err);
    res.status(500).json({ message: "Server error" });
  }
});

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
