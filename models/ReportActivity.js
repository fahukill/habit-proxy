import mongoose from "mongoose";

const ReportActivity =
  mongoose.models.ReportActivity ||
  mongoose.model(
    "ReportActivity",
    new mongoose.Schema({
      userId: String,
      reportId: String,
      type: { type: String, enum: ["manual", "auto"], required: true },
      timestamp: { type, default: () => new Date() },
    })
  );
