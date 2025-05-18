const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ✅ Adjust to your local DB config:
const mongoURI = "mongodb://localhost:27017/habit-sync-ai";
const User = require("../models/User"); // Adjust path if needed

mongoose.connect(mongoURI).then(async () => {
  const email = "handyhukill@gmail.com";
  const newPassword = "Hdfx!973";

  const user = await User.findOne({ email });

  if (!user) {
    console.log("❌ User not found.");
    return process.exit(1);
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  console.log("✅ Password reset complete.");

  process.exit();
});
