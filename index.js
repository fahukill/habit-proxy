const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || "", {
  dbName: "habit-sync-ai"
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
const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  subscription: {
    type: String,
    enum: ["Free", "Pro", "Coach"],
    default: "Free"
  }
}));

// Habit model
const Habit = mongoose.model("Habit", new mongoose.Schema({
  name: String,
  frequency: { type: String, enum: ["daily", "weekly", "monthly"] },
  userId: String
}));

// Test route
app.get("/", (req, res) => {
  res.send("HabitSyncAI Proxy API is running.");
});

// Create user
app.post("/api/users", async (req, res) => {
  const { name, email, password, subscription } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });
  try {
    const user = await User.create({ name, email, password, subscription });
    res.status(201).json({ id: user._id });
  } catch (err) {
    console.error(err);
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
  if (!userId || !name || !frequency) return res.status(400).json({ error: "Missing data" });

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
