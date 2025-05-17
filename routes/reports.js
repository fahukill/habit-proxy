const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const reportController = require("../controllers/reportController");

router.get("/generate", authMiddleware, reportController.generateReport);
router.get("/history", authMiddleware, reportController.getReportHistory);

module.exports = router;
