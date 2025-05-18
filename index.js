const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const apiRoutes = require("./routes/apiRoutes");
const userRoutes = require("./routes/user/notifications");
const subscriptionRoutes = require("./routes/user/subscription");
const exportRoutes = require("./routes/user/export");
const reportRoutes = require("./routes/user/exportReports");
const emailReportRoutes = require("./routes/user/email-reports");
const activityLogRoutes = require("./routes/user/activityLog");
const authRoutes = require("./routes/auth");

// middleware
app.use(express.json());
app.use(
  cors({
    origin: ["https://www.habitsyncai.com", "http://localhost:3000"],
    methods: ["GET", "POST", "OPTIONS", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-id",
      "x-timezone",
    ],
  })
);
app.options("*", cors());

// db
mongoose
  .connect(process.env.MONGODB_URI, { dbName: "habit-sync-ai" })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// auth middleware
app.use((req, res, next) => {
  const clientKey = req.headers["authorization"];
  if (clientKey !== `Bearer ${process.env.API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// routes
app.use("/api", apiRoutes);
app.use("/user", userRoutes);
app.use("/user", subscriptionRoutes);
app.use("/user", exportRoutes);
app.use("/user", reportRoutes);
app.use("/user", emailReportRoutes);
app.use("/user", activityLogRoutes);
app.use("/auth", authRoutes);

app.get("/", (_, res) => {
  res.send("HabitSyncAI Proxy API is running.");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
