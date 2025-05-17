// proxy/models/Report.js
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  content: { type: String },
  tags: [String],
  date: { type: Date, default: () => new Date() },
});

module.exports =
  mongoose.models.Report || mongoose.model("Report", reportSchema);
