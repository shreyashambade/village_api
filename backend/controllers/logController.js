const pool = require("../db");

exports.getApiLogs = async (req, res) => {
  try {
    // 🚀 FIXED: Removed the dead 'users' table and pointed to the new 'api_key' table
    const query = `
      SELECT 
        l.created_at,
        l.status_code,
        l.method,
        l.endpoint,
        l.response_time,
        k.key AS actual_api_key,
        c.company AS client_company,
        c.email AS client_email
      FROM api_logs l
      LEFT JOIN api_key k ON l.api_key_id = k.id
      LEFT JOIN clients c ON l.client_id = c.id
      ORDER BY l.created_at DESC
      LIMIT 1000
    `;
    
    const result = await pool.query(query);

    // 🚀 FIXED: Formatted the JSON to match exactly what AdminDashboard.jsx expects (ApiKey and Client)
    const formattedLogs = result.rows.map(row => ({
      created_at: row.created_at,
      status_code: row.status_code,
      method: row.method,
      endpoint: row.endpoint,
      response_time: row.response_time,
      Client: row.client_company ? {
        company: row.client_company,
        email: row.client_email
      } : null,
      ApiKey: {
        key: row.actual_api_key || "ak_••••••••" 
      }
    }));

    res.json({ success: true, count: formattedLogs.length, data: formattedLogs });
  } catch (error) {
    console.error("Fetch Logs Error:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch API logs" });
  }
};