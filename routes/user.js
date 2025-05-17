const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const userController = require("../controllers/userController");

// Routes mapped to controller handlers
router.get("/notifications", authMiddleware, userController.notificationsGet);
router.post("/notifications", authMiddleware, userController.notificationsPost);
router.post("/change-password", authMiddleware, userController.changePassword);
router.get("/coaching-tone", authMiddleware, userController.getCoachingTone);
router.post("/coaching-tone", authMiddleware, userController.setCoachingTone);
router.get("/activity-log", authMiddleware, userController.activityLog);
router.post("/email-reports", authMiddleware, userController.emailReports);
router.get("/export", authMiddleware, userController.exportData);
router.get("/export-reports", authMiddleware, userController.exportReports);
router.post("/reset", authMiddleware, userController.resetUser);
router.post("/start-of-week", authMiddleware, userController.startOfWeek);
router.post("/subscription", authMiddleware, userController.updateSubscription);
router.delete("/delete", authMiddleware, userController.deleteAccount);

module.exports = router;
