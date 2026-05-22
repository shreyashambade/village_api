const express = require("express");
const router = express.Router();
const { submitContactForm } = require("../controllers/publicController");
const rateLimit = require("express-rate-limit");

// 🛡️ Anti-Spam: Limit contact form submissions to 3 per hour per IP
const contactLimiter = rateLimit({ 
    windowMs: 60 * 60 * 1000, 
    max: 3, 
    message: { success: false, message: "Too many requests. Try again later." } 
});

router.post("/contact", contactLimiter, submitContactForm);

module.exports = router;