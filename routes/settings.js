const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const settingsController = require("../controllers/settingsController");

router.get("/profile", authMiddleware, settingsController.getProfile);
router.post("/profile", authMiddleware, settingsController.updateProfile);

module.exports = router;
