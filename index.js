const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const habitRoutes = require("./routes/habits");
const reportRoutes = require("./routes/reports");
const settingsRoutes = require("./routes/settings");
const userRoutes = require("./routes/user");

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

connectDB();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const clientKey = req.headers["authorization"];
  if (clientKey !== `Bearer ${API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

app.use("/auth", authRoutes);
app.use("/habits", habitRoutes);
app.use("/reports", reportRoutes);
app.use("/settings", settingsRoutes);
app.use("/user", userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Server error" });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
