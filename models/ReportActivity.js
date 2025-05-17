import mongoose from "mongoose";

const ReportActivity =
  mongoose.models.ReportActivity ||
  mongoose.model(
    "ReportActivity",
    new mongoose.Schema({
      userId: { type: String, required: true },
      reportId: { type: String, required: true },
      type: { type: String, enum: ["manual", "auto"], required: true },
      timestamp: { type: Date, default: () => new Date() },
    })
  );

export default ReportActivity;
