const rateLimit = require("express-rate-limit");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pool = require("../db");

// ── PRISMA 7 ADAPTER SETUP (Matching auth.js) ──
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 🚀 1. IN-MEMORY CACHE (Crucial for Performance)
// We cache the settings for 1 minute so we don't crash the database by querying it on every single API hit.
let cachedSettings = null;
let lastCacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

const getPlatformSettings = async () => {
    const now = Date.now();
    if (cachedSettings && (now - lastCacheTime < CACHE_TTL)) {
        return cachedSettings; // Return fast cached version
    }
    
    try {
        const settings = await prisma.platform_settings.findUnique({ where: { id: 1 } });
        if (settings) {
            cachedSettings = settings;
            lastCacheTime = now;
        }
        return cachedSettings;
    } catch (error) {
        console.error("Rate Limiter DB Error:", error);
        // Fallback to PRD defaults if DB disconnects
        return { maintenance_mode: false, free_limit: 5000, premium_limit: 50000, pro_limit: 300000, unlimited_limit: 1000000 };
    }
};

// 🧠 2. DYNAMIC DAILY LIMIT CALCULATOR
const getDynamicDailyLimit = async (req) => {
    const settings = await getPlatformSettings();
    
    // 🛑 KILL-SWITCH: If maintenance mode is ON, set limit to 0 instantly!
    if (settings.maintenance_mode) return 0; 

    // 🌟 CUSTOM OVERRIDE: If the admin set a custom limit for this B2B client, respect it!
    if (req.user && req.user.custom_daily_limit) {
        return req.user.custom_daily_limit;
    }

    // 🏢 PLAN-BASED LIMITS: Otherwise, use the global UI settings
    const plan = req.user?.plan?.toUpperCase() || "FREE";
    switch (plan) {
        case "UNLIMITED": return settings.unlimited_limit;
        case "PRO": return settings.pro_limit;
        case "PREMIUM": return settings.premium_limit;
        default: return settings.free_limit;
    }
};

// ⚡ 3. DYNAMIC BURST LIMIT CALCULATOR (Per Minute)
const getBurstLimit = (req) => {
    const plan = req.user?.plan?.toUpperCase() || "FREE";
    switch (plan) {
        case "UNLIMITED": return 5000;
        case "PRO": return 2000;
        case "PREMIUM": return 500;
        default: return 100;
    }
};

// 🛡️ 4. THE DAILY MIDDLEWARE
exports.dailyLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: async (req, res) => await getDynamicDailyLimit(req), // 🚀 Pulls dynamically!
    keyGenerator: (req) => req.headers["x-api-key"] || "anonymous",
    handler: async (req, res) => {
        const settings = await getPlatformSettings();
        
        // Handle Maintenance Mode Response
        if (settings.maintenance_mode) {
            return res.status(503).json({
                success: false,
                errorCode: "MAINTENANCE_MODE",
                message: "VillageAPI is currently undergoing maintenance. Please try again shortly."
            });
        }
        
        // Handle Normal Quota Exceeded
        res.status(429).json({
            success: false,
            errorCode: "DAILY_QUOTA_EXCEEDED",
            message: "Your daily API quota has been reached. Please upgrade your plan or wait until midnight IST."
        });
    },
    standardHeaders: true, 
    legacyHeaders: false,
    validate: { ip: false }
});

// 💨 5. THE BURST MIDDLEWARE
exports.burstLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: (req, res) => getBurstLimit(req), 
    keyGenerator: (req) => req.headers["x-api-key"] || "anonymous",
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            errorCode: "BURST_LIMIT_EXCEEDED",
            message: "You are making requests too quickly. Please slow down and respect your plan's burst limits."
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { ip: false }
});

// 🔒 6. AUTH ROUTE BRUTE-FORCE PROTECTION
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            errorCode: "RATE_LIMITED",
            message: "Too many login attempts. Please try again after 15 minutes."
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { ip: false }
});