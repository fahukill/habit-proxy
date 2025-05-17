const mongoose = require("mongoose");

const motivationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: String, required: true }, // format: YYYY-MM-DD
});

module.exports =
  mongoose.models.Motivation || mongoose.model("Motivation", motivationSchema);
