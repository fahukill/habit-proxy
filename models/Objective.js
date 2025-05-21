const mongoose = require("mongoose");

const ObjectiveSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  text: { type: String, default: "" },
});

module.exports = mongoose.model("Objective", ObjectiveSchema);
