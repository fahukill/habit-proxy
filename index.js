app.post("/api/users", async (req, res) => {
  const clientKey = req.headers["authorization"];
  if (clientKey !== `Bearer ${process.env.API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { name, email, password, subscription } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const User = mongoose.model(
      "User",
      new mongoose.Schema({
        name: String,
        email: String,
        password: String,
        subscription: {
          type: String,
          enum: ["Free", "Pro", "Coach"],
          default: "Free",
        },
      })
    );

    const user = await User.create({ name, email, password, subscription });
    res.status(201).json({ id: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});
