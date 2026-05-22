const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pool = require("../db");

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET || "changeme_in_production";

exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  // 1. Check if the Admin exists in the database
  let admin = await prisma.admin.findUnique({ where: { email } });

  // 2. AUTO-SETUP: If DB is empty, create the first admin using your default credentials
  if (!admin && email === "admin@villageapi.com" && password === "villageadmin2026") {
    const hashedPassword = await bcrypt.hash(password, 10);
    admin = await prisma.admin.create({ 
      data: { email: "admin@villageapi.com", password: hashedPassword } 
    });
  }

  if (!admin) return res.status(401).json({ success: false, message: "Invalid credentials" });

  // 3. Verify Password using bcrypt
  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

  // 4. Generate JWT
  const token = jwt.sign({ role: "super_admin", email: admin.email, adminId: admin.id }, JWT_SECRET, { expiresIn: "24h" });
  return res.json({ success: true, token });
};

// 🚀 NEW: Update Email and/or Password
exports.updateCredentials = async (req, res) => {
  const { newEmail, currentPassword, newPassword } = req.body;
  const adminId = req.user.adminId; // Extracted safely from the JWT token!

  try {
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    
    // Must provide current password to make changes
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Incorrect current password." });

    const updateData = {};
    if (newEmail) updateData.email = newEmail;
    if (newPassword) updateData.password = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({ where: { id: adminId }, data: updateData });
    
    res.json({ success: true, message: "Credentials updated successfully! Please log in again." });
  } catch (error) {
    console.error("Update Admin Error:", error);
    res.status(500).json({ success: false, message: "Failed to update credentials." });
  }
};

// 🚀 NEW: Fetch all platform logs with B2B Client context
exports.getAdminLogs = async (req, res) => {
  try {
    const logs = await prisma.api_logs.findMany({
      orderBy: { created_at: "desc" },
      take: 200, 
      include: {
        ApiKey : true, // 🚀 Pull the direct key string used for this specific log entry!
        Client: true,   // Pull the business company details
      }
    });
    return res.json({ success: true, data: logs });
  } catch (error) {
    console.error("Admin Logs Fetch Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load system logs." });
  }
};

// 🚀 NEW: Fetch all states, districts, and subdistricts for the Village Master filters
exports.getAdminStates = async (req, res) => {
  try {
    const geoStructure = await prisma.states.findMany({
      orderBy: { state_name: "asc" },
      include: {
        districts: {
          orderBy: { district_name: "asc" },
          include: {
            subdistricts: {
              orderBy: { subdistrict_name: "asc" }
            }
          }
        }
      }
    });
    return res.json({ success: true, data: geoStructure });
  } catch (error) {
    console.error("Admin Geo Fetch Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load geographic structure." });
  }
};

// 🚀 NEW: Handle administrative queries for specific villages
// 🚀 Handle administrative queries for specific villages (Formatted for Dashboard table mapping)
exports.searchAdminVillages = async (req, res) => {
  try {
    const { query, subdistrictId } = req.query;
    
    const whereClause = {};
    if (subdistrictId) whereClause.subdistrict_id = parseInt(subdistrictId);
    if (query) whereClause.village_name = { contains: query.trim(), mode: "insensitive" };

    const villages = await prisma.villages.findMany({
      where: whereClause,
      take: 50,
      include: {
        subdistricts: {
          include: {
            districts: {
              include: { states: true }
            }
          }
        }
      }
    });

    // Format data payload structure precisely to prevent frontend UI mapping crashes!
    const formattedVillages = villages.map(v => ({
      value: v.id,
      hierarchy: {
        village: v.village_name,
        subDistrict: v.subdistricts?.subdistrict_name || "Unknown",
        district: v.subdistricts?.districts?.district_name || "Unknown",
        state: v.subdistricts?.districts?.states?.state_name || "Unknown"
      }
    }));

    return res.json({ success: true, data: formattedVillages });
  } catch (error) {
    console.error("Admin Village Search Error:", error);
    return res.status(500).json({ success: false, message: "Error searching village engine records." });
  }
};

// 🚀 NEW: Fetch live aggregated log counts for the last 30 days
exports.getChartAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Pull timestamps from the last 30 days
    const logs = await prisma.api_logs.findMany({
      where: {
        created_at: { gte: thirtyDaysAgo }
      },
      select: { created_at: true }
    });

    // Initialize an empty map for the last 30 days to fill gaps with 0 requests
    const dailyCounts = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }); // e.g., "May 17"
      dailyCounts[label] = 0;
    }

    // Populate the counts bucket
    logs.forEach(log => {
      if (log.created_at) {
        const label = new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
        if (dailyCounts[label] !== undefined) {
          dailyCounts[label]++;
        }
      }
    });

    // Format into the clean array required by Recharts
    const chartData = Object.keys(dailyCounts).map(date => ({
      date,
      requests: dailyCounts[date]
    }));

    return res.json({ success: true, data: chartData });
  } catch (error) {
    console.error("Chart Analytics Fetch Error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate system chart data." });
  }
};

// 🚀 NEW: Fetch live aggregate performance calculations for the top cards
exports.getOverviewStats = async (req, res) => {
  try {
    // 1. Get total live villages count directly from the table
    const totalVillages = await prisma.villages.count();

    // 2. Calculate Today's Requests (Since midnight today)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const todaysRequests = await prisma.api_logs.count({
      where: {
        created_at: { gte: startOfToday }
      }
    });

    // 3. Calculate Average Latency across all traffic
    const latencyAggregate = await prisma.api_logs.aggregate({
      _avg: {
        response_time: true
      }
    });
    
    // Round to nearest millisecond, default to 0 if table is empty
    const avgLatency = latencyAggregate._avg.response_time 
      ? Math.round(latencyAggregate._avg.response_time) 
      : 0;

    return res.json({
      success: true,
      data: {
        totalVillages,
        todaysRequests,
        avgLatency
      }
    });
  } catch (error) {
    console.error("Overview Stats Fetch Error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate system summary cards." });
  }
};


// 🚀 NEW: Securely insert a new location into the database via Super Admin session
exports.createAdminVillage = async (req, res) => {
  try {
    const { village_name, subdistrict_id, village_code } = req.body;

    if (!village_name || !subdistrict_id) {
      return res.status(400).json({ success: false, message: "Village name and Sub-District ID are required." });
    }

    const newVillage = await prisma.villages.create({
      data: {
        village_name,
        subdistrict_id: parseInt(subdistrict_id),
        village_code: village_code ? parseInt(village_code) : null
      }
    });

    return res.json({ success: true, data: newVillage });
  } catch (error) {
    console.error("Admin Village Creation Error:", error);
    return res.status(500).json({ success: false, message: "Database failure: Could not add location." });
  }
};

// 🚀 NEW: Permanently purge a specific village by its database ID
exports.deleteAdminVillage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Missing location identifier parameter." });
    }

    await prisma.villages.delete({
      where: { id: parseInt(id) }
    });

    return res.json({ success: true, message: "Location permanently purged from PostgreSQL." });
  } catch (error) {
    console.error("Admin Village Delete Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete location records." });
  }
};

// 🚀 NEW: Securely update an existing village's details by its database ID
exports.updateAdminVillage = async (req, res) => {
  try {
    const { id } = req.params;
    const { village_name } = req.body;

    if (!village_name || village_name.trim() === "") {
      return res.status(400).json({ success: false, message: "Village name cannot be empty." });
    }

    const updatedVillage = await prisma.villages.update({
      where: { id: parseInt(id) },
      data: { village_name: village_name.trim() }
    });

    return res.json({ success: true, message: "Location updated successfully.", data: updatedVillage });
  } catch (error) {
    console.error("Admin Village Update Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update location details." });
  }
};

// 🚨 DANGER ZONE: Permanently wipe API logs older than 30 days
exports.purgeOldLogs = async (req, res) => {
  try {
    // Calculate the exact date 30 days ago from right now
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete all records older than that date
    const purgeResult = await prisma.api_logs.deleteMany({
      where: {
        created_at: {
          lt: thirtyDaysAgo // "lt" stands for Less Than (older than)
        }
      }
    });

    return res.json({ 
      success: true, 
      message: `Successfully purged ${purgeResult.count} old API logs.`,
      deletedCount: purgeResult.count
    });
  } catch (error) {
    console.error("Database Purge Error:", error);
    return res.status(500).json({ success: false, message: "Database failure: Could not execute purge." });
  }
};

// 🚀 PRD COMPLIANT: Get Platform Settings
exports.getPlatformSettings = async (req, res) => {
  try {
    let settings = await prisma.platform_settings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.platform_settings.create({ 
        data: { id: 1, maintenance_mode: false, free_limit: 5000, premium_limit: 50000, pro_limit: 300000, unlimited_limit: 1000000 } 
      });
    }
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Get Settings Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load platform settings." });
  }
};

// 🚀 PRD COMPLIANT & BULLETPROOF: Update Platform Settings
exports.updatePlatformSettings = async (req, res) => {
  try {
    const { maintenance_mode, free_limit, premium_limit, pro_limit, unlimited_limit } = req.body;
    
    const updatedSettings = await prisma.platform_settings.upsert({
      where: { id: 1 },
      update: { 
        maintenance_mode: Boolean(maintenance_mode), 
        // 🛡️ Added fallback defaults (||) so empty boxes never crash the database
        free_limit: parseInt(free_limit) || 5000,
        premium_limit: parseInt(premium_limit) || 50000,
        pro_limit: parseInt(pro_limit) || 300000,
        unlimited_limit: parseInt(unlimited_limit) || 1000000
      },
      create: { 
        id: 1, 
        maintenance_mode: Boolean(maintenance_mode), 
        free_limit: parseInt(free_limit) || 5000,
        premium_limit: parseInt(premium_limit) || 50000,
        pro_limit: parseInt(pro_limit) || 300000,
        unlimited_limit: parseInt(unlimited_limit) || 1000000
      }
    });

    return res.json({ success: true, message: "PRD Configuration saved securely!", data: updatedSettings });
  } catch (error) {
    console.error("Update Settings Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update configuration." });
  }
};


// GET ALL LEADS
exports.getLeads = async (req, res) => {
    try {
        const leads = await prisma.contact_requests.findMany({
            orderBy: { created_at: 'desc' } // Newest first
        });
        res.json({ success: true, data: leads });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch leads" });
    }
};

// UPDATE LEAD STATUS
exports.updateLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await prisma.contact_requests.update({
            where: { id },
            data: { status }
        });
        res.json({ success: true, message: "Status updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status" });
    }
};