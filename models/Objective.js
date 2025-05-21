const mongoose = require("mongoose");

const ObjectiveSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  text: { type: String, default: "" },
});

module.exports = mongoose.model("Objective", ObjectiveSchema);
