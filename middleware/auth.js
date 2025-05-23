const User = require("../models/User");

module.exports = async (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Missing x-user-id header" });
  }

  try {
    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    req.userId = user._id.toString();
    req.firstName = user.firstName;
    req.lastName = user.lastName;
    req.email = user.email;
    req.subscription = user.subscription || "Free";

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Server error in auth middleware" });
  }
};
