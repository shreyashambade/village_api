const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pool = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "changeme_in_production";

// ── PRISMA 7 ADAPTER SETUP ──
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 1. JWT middleware (for dashboard routes)
// Validates the Authorization: Bearer <token> header
// 1. JWT middleware (for dashboard routes)
// Validates the Authorization: Bearer <token> header
// 1. JWT middleware (for dashboard routes)
// Validates the Authorization: Bearer <token> header
exports.requireJWT = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Authorization header missing or malformed" });
    }
 
    const token = authHeader.split(" ")[1]; 
 
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
       
        req.user = decoded; 
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Token is invalid or expired" });
    }
};
 
// 2. Api Key middleware (for /api/v1/* routes)
// Validates X-API-Key header, attaches user + plan to req
exports.requireApiKey = async (req, res, next) => {
    const apiKey = req.headers["x-api-key"];
 
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            errorCode: "INVALID_API_KEY",
            message: "X-API-Key header is required"
        });
    }
 
    try {
        // 1. Look up the key in the new ApiKey table, and include the client data
        const keyRecord = await prisma.apiKey.findUnique({
            where: { key: apiKey },
            include: { client: true }
        });
 
        // If the key doesn't exist OR it was revoked, reject them
        if (!keyRecord || keyRecord.status !== "Active") {
            return res.status(401).json({
                success: false,
                errorCode: "INVALID_API_KEY",
                message: "API key is invalid or revoked"
            });
        }
 
        const client = keyRecord.client;
 
        // 2. Check user account is active
        if (client.status !== "Active") {
            return res.status(403).json({
                success: false,
                errorCode: "ACCESS_DENIED",
                message: "Your account is not active"
            });
        }
 
        // 3. Attach user info to request (Logger and RateLimiter need this!)
        // 3. Attach user info to request (Logger and RateLimiter need this!)
        req.user = {
            userId:   client.id,
            email:    client.email,
            plan:     client.plan, 
            apiKeyId: keyRecord.id,
            // 🚀 NEW: Pass the custom limit to the rate limiter!
            custom_daily_limit: client.custom_daily_limit 
        };
 
        // 4. Update usage count for the client
        prisma.client.update({
            where: { id: client.id },
            data: { usage: { increment: 1 } }
        }).catch(err => console.error("Prisma usage update error:", err.message));

        // 5. Update the 'Last Used' timestamp for this specific key
        prisma.apiKey.update({
            where: { id: keyRecord.id },
            data: { lastUsedAt: new Date() }
        }).catch(err => console.error("Prisma key update error:", err.message));
 
        next();
 
    } catch (err) {
        console.error("requireApiKey error:", err.message);
        return res.status(500).json({
            success: false,
            errorCode: "INTERNAL_ERROR",
            message: "Auth check failed"
        });
    }
};