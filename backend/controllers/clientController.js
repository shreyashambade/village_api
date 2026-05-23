const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pool = require("../db/index");
const crypto = require("crypto");
const bcrypt = require("bcrypt"); // 🚀 NEW: Security hashing

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');



// ── PRISMA 7 ADAPTER SETUP ──
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 1. REGISTER NEW CLIENT (PRD Section 9.1)
exports.registerClient = async (req, res) => {
  try {
    const { company, email, password, phone } = req.body;

    // 🛡️ Require password now
    if (!company || !email || !password) {
      return res.status(400).json({ error: "Company, email, and password are required." });
    }

    const existingClient = await prisma.client.findUnique({ where: { email } });
    if (existingClient) return res.status(400).json({ error: "Client exists." });

    // 🔐 Hash the password before saving to DB
    const passwordHash = await bcrypt.hash(password, 10);

    const newClient = await prisma.client.create({
      data: { 
        company, 
        email, 
        passwordHash, 
        phone: phone || null,
        status: "PENDING_APPROVAL", // 🛑 Locked until Admin approves
        plan: "FREE", 
        limit: 5000 
      }
    });

    res.status(201).json({ 
      success: true, 
      message: "Registration successful. Pending admin approval.",
      data: { id: newClient.id, email: newClient.email, status: newClient.status } 
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// 🚀 NEW: 1.5 REAL LOGIN FLOW
exports.loginClient = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: "Email and password required." });

    const client = await prisma.client.findUnique({ where: { email } });
    if (!client) return res.status(404).json({ error: "Invalid credentials." });


    // 🛡️ THE FIX: Catch old legacy accounts so the server doesn't crash!
    if (!client.passwordHash) {
      return res.status(401).json({ error: "Legacy account detected. Please register a new workspace with a password." });
    }

    // 🔐 Verify hashed password
    const isMatch = await bcrypt.compare(password, client.passwordHash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials." });

    res.json({ 
      success: true, 
      data: { id: client.id, email: client.email, status: client.status, company: client.company } 
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 2. GET USAGE (For Dev Portal)
exports.getClientUsage = async (req, res) => {
  try {
    const { email } = req.params;
    const client = await prisma.client.findUnique({ where: { email } });
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json({ success: true, data: client });
  } catch (error) {
    console.error("Fetch Usage Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 3. GET ALL CLIENTS (For Admin Dashboard)
exports.getAllClients = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
    res.status(200).json({ success: true, data: clients });
  } catch (error) {
    console.error("Fetch All Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 4. REVOKE ACCESS
exports.revokeClientAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedClient = await prisma.client.update({
      where: { id: id },
      data: { status: "Suspended" }
    });
    res.json({ success: true, data: updatedClient });
  } catch (error) {
    console.error("Revoke Access Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 5. RESET API KEY
exports.resetApiKey = async (req, res) => {
  try {
    const { id } = req.params; // This is the clientId

    // 1. Generate standard PRD format keys
    const rawKey = 'ak_' + crypto.randomBytes(16).toString('hex');
    const rawSecret = 'as_' + crypto.randomBytes(16).toString('hex');
    
    // 2. Hash the secret before saving
    const secretHash = await bcrypt.hash(rawSecret, 10);

    // 3. Revoke old active keys for this user (since they clicked 'Roll')
    await prisma.apiKey.updateMany({
      where: { clientId: id, status: 'Active' },
      data: { status: 'Revoked' }
    });

    // 4. Save the new key to the new ApiKey table
    const newKey = await prisma.apiKey.create({
      data: {
        name: "Production Key",
        key: rawKey,
        secretHash: secretHash,
        clientId: id,
        status: "Active"
      }
    });

    res.json({
      success: true,
      data: {
        apiKey: rawKey,
        apiSecret: rawSecret // We send this back to show the user ONCE
      }
    });
  } catch (error) {
    console.error("Reset Key Error:", error);
    res.status(500).json({ success: false, error: "Failed to generate API key." });
  }
};

// 6. REACTIVATE ACCESS
exports.reactivateClientAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedClient = await prisma.client.update({
      where: { id: id },
      data: { status: "Active" }
    });
    res.json({ success: true, data: updatedClient });
  } catch (error) {
    console.error("Reactivate Access Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── B2B CLIENT: GET DASHBOARD DATA 
exports.getClientDashboardData = async (req, res) => {
  try {
    const { email } = req.query;
    
    const client = await prisma.client.findUnique({ 
      where: { email },
      include: { apiKeys: { orderBy: { createdAt: 'desc' } } } 
    });
    
    if (!client) return res.status(404).json({ success: false });

    // 1. Format the API Keys for the table
    const mappedKeys = client.apiKeys.map(k => ({
      id: k.id,
      name: k.name,
      key: k.key.substring(0, 8) + "****************" + k.key.substring(k.key.length - 4),
      fullKey: k.key, 
      created: k.createdAt.toLocaleDateString(),
      lastUsed: k.lastUsedAt ? k.lastUsedAt.toLocaleDateString() : "Never",
      status: k.status
    }));

    // 🚀 2. NEW: Fetch actual API logs for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogs = await prisma.api_logs.findMany({
      where: {
        client_id: client.id,
        created_at: { gte: sevenDaysAgo }
      },
      select: { created_at: true }
    });

    // 3. Create an empty template for the last 7 days (e.g., { "May 15": 0, "May 16": 0 })
    const usageMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      usageMap[dateStr] = 0;
    }

    // 4. Loop through the real database logs and count them up!
    recentLogs.forEach(log => {
      if (log.created_at) {
        const dateStr = log.created_at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (usageMap[dateStr] !== undefined) {
          usageMap[dateStr]++;
        }
      }
    });

    // 5. Convert to the array format Recharts expects: [{ date: "May 17", requests: 12 }]
    const finalUsageData = Object.keys(usageMap).map(date => ({
      date,
      requests: usageMap[date]
    }));

    res.json({
      success: true,
      data: {
        profile: { id: client.id, company: client.company, email: client.email, plan: client.plan, usage: client.usage, limit: client.limit, status: client.status },
        metrics: { avgLatency: 45, successRate: 100 }, 
        usageData: finalUsageData, // 🚀 Replaced the empty array with the real aggregated data!
        keys: mappedKeys.length > 0 ? mappedKeys : [{ id: 'none', name: 'No Active Keys', key: 'No_Key_Configure...', fullKey: '', created: '-', lastUsed: '-', status: 'Pending' }]
      }
    });
  } catch (error) {
    console.error("Dashboard Data Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// ── PUT /api/clients/:id/profile ──
exports.updateClientProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { company, email } = req.body;

    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Invalid Client ID." });
    }

    const pool = require("../db");

    const result = await pool.query(
      `UPDATE clients SET company = $1, email = $2, "updatedAt" = NOW() WHERE id::text = $3 RETURNING *`,
      [company, email, String(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    // ✅ FIX 3: Return rows[0] — an object, not the full array
    res.json({ success: true, data: result.rows[0], message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile Update Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update profile." });
  }
};


// ────────────────────────────────────────────────────────────────────────
// REVOKE SPECIFIC API KEY (PRD Section 9.3)
// ────────────────────────────────────────────────────────────────────────
exports.revokeSpecificKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { status: 'Revoked' }
    });
    
    res.json({ success: true, message: "Key revoked permanently." });
  } catch (error) {
    console.error("Revoke Key Error:", error);
    res.status(500).json({ success: false, error: "Failed to revoke key." });
  }
};



// 🚀 Generate 2FA 
exports.generate2FA = async (req, res) => {
  const { email } = req.body;

  try {
    const secret = speakeasy.generateSecret({ 
      name: `VillageAPI (${email})` 
    });

    await prisma.client.update({
      where: { email },
      data: { twoFactorSecret: secret.base32 }
    });

    QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) throw err;
      res.json({ success: true, qrCodeUrl: data_url, secret: secret.base32 });
    });

  } catch (error) {
    console.error("2FA Gen Error:", error);
    res.status(500).json({ success: false, message: "Could not generate 2FA secret" });
  }
};

// 🚀 Verify 2FA
exports.verify2FA = async (req, res) => {
  const { email, token } = req.body;

  try {
    const client = await prisma.client.findUnique({ where: { email } });
    
    if (!client || !client.twoFactorSecret) {
      return res.status(400).json({ success: false, message: "2FA not set up." });
    }

    const verified = speakeasy.totp.verify({
      secret: client.twoFactorSecret,
      encoding: 'base32',
      token: token
    });

    if (verified) {
      await prisma.client.update({
        where: { email },
        data: { is2FAEnabled: true }
      });
      res.json({ success: true, message: "2FA Successfully Enabled!" });
    } else {
      res.status(400).json({ success: false, message: "Invalid 6-digit code. Try again." });
    }

  } catch (error) {
    console.error("2FA Verify Error:", error);
    res.status(500).json({ success: false, message: "Server error verifying code" });
  }
};



// 🚀 Disable 2FA
exports.disable2FA = async (req, res) => {
  const { email } = req.body;

  try {
    // Set is2FAEnabled to false and wipe the secret
    await prisma.client.update({
      where: { email },
      data: { 
        is2FAEnabled: false,
        twoFactorSecret: null 
      }
    });

    res.json({ success: true, message: "2FA successfully disabled." });
  } catch (error) {
    console.error("Disable 2FA Error:", error);
    res.status(500).json({ success: false, message: "Could not disable 2FA" });
  }
};


