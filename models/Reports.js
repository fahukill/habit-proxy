const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  userId: String,
  content: String,
  tags: [String],
  date: { type: Date, default: () => new Date() },
});

module.exports =
  mongoose.models.Report || mongoose.model("Report", reportSchema);
