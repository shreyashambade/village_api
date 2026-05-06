const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");


const JWT_SECRET = process.env.JWT_SECRET || "changeme_in_production";


//helper func :  generate api keys and secret
function generateApiKey() {
    return "ak_" + crypto.randomBytes(16).toString("hex");
}

function generateApiSecret() {
    return "as_" + crypto.randomBytes(16).toString("hex");
}

// 1.Register
exports.register = async (req, res) => {
    try {
        const { email, password, business_name } = req.body;

        if(!email || !password || !business_name) {
            return res.status(400).json({
                success: false,
                errorCode: "INVALID_QUERY",
                message: "email, password and business_name are required"
            });
        }

        //check if email is already exist
        const existing = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if(existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                errorCode: "INVALID_QUERY",
                message: "Email already registered"
            });
        }

        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);


        //insert user (pendings untill admin aprroves)
        const result = await pool.query(
            `INSERT INTO users ( email, password, business_name, plan_type, status)
            VALUES ( $1, $2, $3, 'free', 'pending')
            RETURNING id, email, business_name, plan_type,status`,
            [email,hashedPassword,business_name]
        );

        res.status(201).json({
            success: true,
            message: "Registration successful. Your account is pending admin approval.",
            data: result.rows[0]
        });
    } catch (err) {
        console.error("Register error:", err.message);

        if (err.code === "23505") {
            return res.status(500).json({
            success: false,
            errorCode: "INVALID_QUERY",
            message: "Email already registered"
        });
        }
        
        res.status(500).json({
            success: false,
            errorCode: "INTERNAL_ERROR",
            message: "Registration failed"
        });
    }
};


// 2.Login
exports.login = async (req, res) => {
    try {
        const { email,password} = req.body;

        if( !email || !password) {
            return res.status(400).json({
                success: false,
                errorCode: "INVALID_QUERY",
                message: "email and password are required"
            });
        }

        //find user
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                errorCode: "INVALID_API_KEY",
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        //check account status
        if (user.status === "pending") {
            return res.status(403).json({
                success: false,
                errorCode: "ACCESS_DENIED",
                message: "Your account is pending admin approval"
            });
        }

        if (user.status === "suspended") {
            return res.status(403).json({
                success: false,
                errorCode: "ACCESS_DENIED",
                message: "Your account has been suspended"
            });
        }

        //verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                errorCode: "INVALID_API_KEY",
                message: "Invalid email or password"
            });
        }

        //generate JWT (expires in 24 h)
        const token = jwt.sign(
            { userId: user.id, email: user.email, plan: user.plan_type },
            JWT_SECRET,
            { expiresIn: "24h" }
        );


        res.json({
            success: true,
            message: "Login successful",
            token: token,
            data: {
                id:            user.id,
                email:         user.email,
                business_name: user.business_name,
                plan_type:     user.plan_type,
                status:        user.status
            }
        });

    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({
            success: false,
            errorCode: "INTERNAL_ERROR",
            message: "Login failed"
        });

    }
};


// 3.Generate Api Key
exports.generateKey = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { key_name } = req.body;
 
        if (!key_name) {
            return res.status(400).json({
                success: false,
                errorCode: "INVALID_QUERY",
                message: "key_name is required (e.g. 'Production Server')"
            });
        }
 
        // Max 5 active keys per user (PRD spec)
        const keyCount = await pool.query(
            "SELECT COUNT(*) FROM api_keys WHERE user_id = $1 AND status = 'active'",
            [userId]
        );
        if (parseInt(keyCount.rows[0].count) >= 5) {
            return res.status(400).json({
                success: false,
                errorCode: "ACCESS_DENIED",
                message: "Maximum of 5 active API keys allowed per account"
            });
        }
 
        const apiKey    = generateApiKey();
        const apiSecret = generateApiSecret();
        const secretHash = await bcrypt.hash(apiSecret, 10);
 
        const result = await pool.query(
            `INSERT INTO api_keys (user_id, key_name, api_key, api_secret, status)
             VALUES ($1, $2, $3, $4, 'active')
             RETURNING id, key_name, api_key, created_at`,
            [userId, key_name, apiKey, secretHash]
        );
 
        res.status(201).json({
            success: true,
            message: "API key created. Store your secret safely — it will not be shown again.",
            data: {
                ...result.rows[0],
                api_secret: apiSecret   // shown ONCE, not stored in plaintext
            }
        });
 
    } catch (err) {
        console.error("generateKey error:", err.message);
        res.status(500).json({
            success: false,
            errorCode: "INTERNAL_ERROR",
            message: "Failed to generate API key"
        });
    }
};


// 4.List Api keys
exports.listKeys = async (req,res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT id, key_name, CONCAT(LEFT(api_key, 6), '****') AS api_key,
            status, created_at, last_used
            FROM api_keys
            WHERE user_id = $1
            ORDER BY created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (err) {
        console.error("listKeys error:", err.message);
        res.status(500).json({
            success: false,
            errorCode: "INTERNAL_ERROR",
            message: "Failed to fetch API keys"
        });
    }
};


// 5.Revoke Api Keys
exports.revokeKey = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id }  = req.params;
 
        const result = await pool.query(
            `UPDATE api_keys SET status = 'revoked'
             WHERE id = $1 AND user_id = $2
             RETURNING id, key_name, status`,
            [id, userId]
        );
 
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                errorCode: "NOT_FOUND",
                message: "API key not found or does not belong to your account"
            });
        }
 
        res.json({
            success: true,
            message: "API key revoked successfully",
            data: result.rows[0]
        });
 
    } catch (err) {
        console.error("revokeKey error:", err.message);
        res.status(500).json({
            success: false,
            errorCode: "INTERNAL_ERROR",
            message: "Failed to revoke API key"
        });
    }
};