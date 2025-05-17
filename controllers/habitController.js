const Habit = require("../models/Habit");

module.exports = {
  createHabit: async (req, res) => {
    try {
      const habit = new Habit({ ...req.body, userId: req.userId });
      await habit.save();
      res.status(201).json(habit);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create habit" });
    }
  },

  getAllHabits: async (req, res) => {
    try {
      const habits = await Habit.find({ userId: req.userId });
      res.json(habits);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch habits" });
    }
  },

  logHabit: async (req, res) => {
    try {
      // Extend with log schema or method if needed
      res.json({ message: "Habit logged" });
    } catch (err) {
      res.status(500).json({ error: "Failed to log habit" });
    }
  },

  updateHabit: async (req, res) => {
    try {
      const updated = await Habit.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        req.body,
        { new: true }
      );
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to update habit" });
    }
  },

  deleteHabit: async (req, res) => {
    try {
      await Habit.deleteOne({ _id: req.params.id, userId: req.userId });
      res.json({ message: "Habit deleted" });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete habit" });
    }
  },
};
