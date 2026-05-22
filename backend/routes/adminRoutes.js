const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// 🚀 FIXED: Added the missing import for your JWT middleware!
const { requireJWT } = require("../middleware/auth");

// POST /api/admin/login
router.post("/login", adminController.loginAdmin);

// 🚀 NEW: Protect the update route so only a logged-in admin can change credentials
router.put("/credentials", requireJWT, adminController.updateCredentials);

// 🚀 NEW: Dedicated Internal System Routes
router.get("/logs", requireJWT, adminController.getAdminLogs);
router.get("/states", requireJWT, adminController.getAdminStates);
router.get("/villages/search", requireJWT, adminController.searchAdminVillages);


router.get("/analytics/chart", requireJWT, adminController.getChartAnalytics);

router.get("/analytics/overview", requireJWT, adminController.getOverviewStats);

router.post("/villages", requireJWT, adminController.createAdminVillage);

router.delete("/villages/:id", requireJWT, adminController.deleteAdminVillage);

router.put("/villages/:id", requireJWT, adminController.updateAdminVillage);

router.delete("/logs/purge", requireJWT, adminController.purgeOldLogs);

router.get("/settings", requireJWT, adminController.getPlatformSettings);
router.put("/settings", requireJWT, adminController.updatePlatformSettings);

// uthentication of public contac form
router.get("/leads", adminController.getLeads);
router.put("/leads/:id/status", adminController.updateLeadStatus);

module.exports = router;