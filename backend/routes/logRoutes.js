const express = require("express");
const router = express.Router();
const { getApiLogs } = require("../controllers/logController");
const { requireJWT } = require("../middleware/auth"); // 🚀 NEW: Import the JWT bouncer

// GET /api/v1/logs (Admin Route to view traffic)
// 🚀 NEW: Add requireJWT right before getApiLogs
router.get("/", requireJWT, getApiLogs); 

module.exports = router;