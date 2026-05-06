const pool = require("../db");
const crypto = require("crypto");

// logging middleware
//Records every /api/v1/* request to api_logs table
//Also adds requestId to req so controllers can include it in meta

exports.requestLogger = (req, res, next) => {
    //generate unique request id for the request
    req.requestId =  "req_" + crypto.randomBytes(6).toString("hex");
    req.startTime = Date.now();

    // After response is sent, log it to DB
    res.on("finish", () => {
        const responseTime = Date.now() - req.startTime;
        const userId    = req.user?.userId    || null;
        const apiKeyId  = req.user?.apiKeyId  || null;
        const endpoint  = req.path            || null;
        const method    = req.method          || null;
        const statusCode = res.statusCode     || null;
        const ipRaw     = req.ip || req.headers["x-forwarded-for"] || null;

         // Mask last octet of IP for privacy (e.g. 192.168.1.xxx)
         const ipMasked = ipRaw
            ? ipRaw.replace(/(\d+)$/, "xxx")
            : null;

        // Fire and forget — don't slow down the response
        pool.query(
            `INSERT INTO api_logs (user_id, api_key_id, endpoint, method, status_code, response_time, ip_address) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, apiKeyId, endpoint, method, statusCode, responseTime, ipMasked]
        ).catch(err =>{
            console.error("api_logs insert error:", err.message);
        });
    });
    next();
};