require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

// Routes
const apiRoutes = require("./routes/apiRoutes");
const authRoutes = require("./routes/auth");
const habitRoutes = require("./routes/habits");
const habitLogRoutes = require("./routes/habitLogs");

// User feature modules
const onboardingRoutes = require("./routes/user"); // handles /onboarding, /update, /
const notificationsRoutes = require("./routes/user/notifications");
const subscriptionRoutes = require("./routes/user/subscription");
const exportRoutes = require("./routes/user/export");
const reportRoutes = require("./routes/user/exportReports");
const emailReportRoutes = require("./routes/user/email-reports");
const activityLogRoutes = require("./routes/user/activityLog");
const coachingToneRoutes = require("./routes/user/coachingTone");
const changePasswordRoutes = require("./routes/user/changePassword");
const resetRoutes = require("./routes/user/reset");
const startOfWeekRoutes = require("./routes/user/startOfWeek");

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  // console.log("➡️ Incoming request:", req.method, req.path);
  next();
});
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
    credentials: true,
  })
);
app.options("*", cors());

// Route Usage
app.use("/api", apiRoutes);
app.use("/auth", authRoutes);
app.use("/user", onboardingRoutes);
app.use("/user", notificationsRoutes);
app.use("/user", subscriptionRoutes);
app.use("/user", exportRoutes);
app.use("/user", reportRoutes);
app.use("/user", emailReportRoutes);
app.use("/user", activityLogRoutes);
app.use("/user", coachingToneRoutes);
app.use("/user", changePasswordRoutes);
app.use("/user", resetRoutes);
app.use("/user", startOfWeekRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/habit-logs", habitLogRoutes);
app.use("/api/reports", require("./routes/reports"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/objective", require("./routes/objective"));
app.use("/api/feedback", require("./routes/feedback"));
app.use("/api/email/welcome", require("./routes/email/welcome"));
app.use("/api/streaks", require("./routes/streaks"));
app.use((req, res, next) => {
  const openPaths = ["/favicon.ico", "/robots.txt", "/manifest.json"];
  if (openPaths.includes(req.path)) return next();

  const clientKey = req.headers["authorization"];
  if (clientKey !== `Bearer ${process.env.API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// DB Connection
mongoose
  .connect(process.env.MONGODB_URI, { dbName: "habit-sync-ai" })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Health Check
app.get("/", (_, res) => {
  res.send("HabitSyncAI Proxy API is running.");
});

// Start Server
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on port ${port}`));
