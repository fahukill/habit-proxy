const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || "", {
  dbName: "habit-sync-ai"
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

// Test route
app.get("/", (req, res) => {
  res.send("HabitSyncAI Render Proxy is live!");
});

// Create user route
app.post("/api/users", async (req, res) => {
  const { name, email, password, subscription } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  try {
    const User = mongoose.model("User", new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      subscription: { type: String, enum: ["Free", "Pro", "Coach"], default: "Free" }
    }));

    const user = await User.create({ name, email, password, subscription });
    res.status(201).json({ id: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
