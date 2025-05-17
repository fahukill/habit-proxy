const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const habitController = require("../controllers/habitController");

router.post("/create", authMiddleware, habitController.createHabit);
router.get("/all", authMiddleware, habitController.getAllHabits);
router.post("/log", authMiddleware, habitController.logHabit);
router.put("/:id", authMiddleware, habitController.updateHabit);
router.delete("/:id", authMiddleware, habitController.deleteHabit);

module.exports = router;
