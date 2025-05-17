const { default: axios } = require("axios");

module.exports = {
  generateReport: async (req, res) => {
    try {
      const userId = req.userId;
      const habits = req.body.habits || [];
      const goal = req.body.goal || "";

      const prompt = `You're an expert habit coach. Based on the user's habits and goal, generate a weekly motivational report.\n\nGoal: ${goal}\nHabits: ${habits.map(h => h.name).join(", ")}`;

      const response = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-4",
        messages: [
          { role: "system", content: "You generate motivational weekly reports based on user habits." },
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      });

      const report = response.data.choices[0].message.content;
      res.json({ report });
    } catch (err) {
      console.error("AI Report Error:", err?.response?.data || err.message);
      res.status(500).json({ error: "Failed to generate AI report" });
    }
  },

  getReportHistory: async (req, res) => {
    try {
      res.json([]); // Replace with real DB query
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch report history" });
    }
  },
};
