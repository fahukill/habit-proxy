const mongoose = require("mongoose");

const reportActivitySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  reportId: { type: String, required: true },
  type: { type: String, enum: ["manual", "auto"], required: true },
  timestamp: { type: Date, default: () => new Date() },
});

module.exports =
  mongoose.models.ReportActivity ||
  mongoose.model("ReportActivity", reportActivitySchema);
