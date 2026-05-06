const rateLimit = require("express-rate-limit");

// Daily limits per plan
const PLAN_LIMITS = {
    free : 5000,
    premium : 50000,
    pro : 300000,
    unlimited : 1000000
};


// Burst limits per minute per plan
const BURST_LIMITS = {
    free : 100,
    premium : 500,
    pro : 2000,
    unlimited : 5000
};


// Pre-create one limiter per plan at startup
// express-rate-limit requires instances to be created at app init, not per request
const dailyLimiters = {};
const burstLimiters = {};

for (const [plan, max] of Object.entries(PLAN_LIMITS)) {
    dailyLimiters[plan] = rateLimit({
        windowMs: 24 * 60 * 60 * 1000,
        max,
        keyGenerator: (req) => req.headers["x-api-key"] || "anonymous",
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                errorCode: "RATE_LIMITED",
                message: `Daily quota of ${max} requests exceeded. Resets at midnight.`
            });
        },
        standardHeaders: true,
        legacyHeaders: false,
        validate: { ip: false }
    });
}


for (const [plan, max] of Object.entries(BURST_LIMITS)) {
    burstLimiters[plan] = rateLimit({
        windowMs: 60 * 1000,
        max,
        keyGenerator: (req) => req.headers["x-api-key"] || "anonymous",
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                errorCode: "RATE_LIMITED",
                message: `Burst limit of ${max} requests/minute exceeded. Slow down.`
            });
        },
        standardHeaders: true,
        legacyHeaders: false,
        validate: { ip: false }
    });
}


//Middleware: picks the right limiter based on req.user.plan
exports.dailyLimiter = (req, res, next) => {
    const plan = req.user?.plan || "free";
    const limiter = dailyLimiters[plan] || dailyLimiters.free;
    limiter(req, res, next);
};
 
exports.burstLimiter = (req, res, next) => {
    const plan = req.user?.plan || "free";
    const limiter = burstLimiters[plan] || burstLimiters.free;
    limiter(req, res, next);
};


// 3.Auth Route limiter  (prevent brute foce on login)
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max : 20,
    handler : (req, res) => {
        res.status(429).json({
            success: false,
            errorCode : "RATE_LIMITED",
            message : "Two many attempts. Please try again after 15 minutes"
        });
    },

    standardHeaders : true,
    legacyHeaders : false,
    validate: { ip : false }
});