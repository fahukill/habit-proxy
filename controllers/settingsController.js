const User = require("../models/User");

module.exports = {
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.userId).select("-password");
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Failed to load profile" });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const updated = await User.findByIdAndUpdate(req.userId, req.body, { new: true });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  },
};
