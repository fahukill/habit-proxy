
const mongoose = require("mongoose");
const axios = require("axios");

const API_KEY = process.env.API_KEY;
const PROXY_URL = process.env.PROXY_URL;
const MONGODB_URI = process.env.MONGODB_URI;

const User = mongoose.model("User", new mongoose.Schema({ email: String }));

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: "habit-sync-ai" });
    const users = await User.find({}, "_id");
    const userIds = users.map((u) => u._id.toString());

    for (const userId of userIds) {
      try {
        const res = await axios.post(`${PROXY_URL}/api/cron/generate-reports`, {}, {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "x-user-id": userId,
          },
        });
        console.log(`✔️ Report created for ${userId}`);
      } catch (err) {
        console.error(`❌ Error for ${userId}:`, err.response?.data || err.message);
      }
    }
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
