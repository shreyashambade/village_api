const pool = require("../db");
const crypto = require("crypto");

exports.requestLogger = (req, res, next) => {

    if (req.originalUrl.startsWith('/api/admin')) {
      return next(); 
  }

    req.requestId =  "req_" + crypto.randomBytes(6).toString("hex");
    req.startTime = Date.now();

    res.on("finish", () => {
        const responseTime = Date.now() - req.startTime;
        
        const userIdRaw   = req.user?.userId    || null;
        const apiKeyIdRaw = req.user?.apiKeyId  || null;

        let userId = null;
        let apiKeyId = null;
        let clientId = null;

        // 🧠 SMART ROUTING: If the ID is a string, it's a new B2B Client!
        if (typeof userIdRaw === 'string') {
            clientId = userIdRaw;
        } else {
            // Otherwise, it's from the old legacy integer system
            userId = userIdRaw;
            apiKeyId = apiKeyIdRaw;
        }

        const endpoint  = req.path            || null;
        const method    = req.method          || null;
        const statusCode = res.statusCode     || null;
        const ipRaw     = req.ip || req.headers["x-forwarded-for"] || null;
        const ipMasked  = ipRaw ? ipRaw.replace(/(\d+)$/, "xxx") : null;

        // Save safely to whichever column is correct!
        pool.query(
            `INSERT INTO api_logs (user_id, api_key_id, client_id, endpoint, method, status_code, response_time, ip_address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [userId, apiKeyId, clientId, endpoint, method, statusCode, responseTime, ipMasked]
        ).catch(err => console.error("api_logs insert error:", err.message));
    });
    next();
};