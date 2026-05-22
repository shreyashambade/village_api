import { useState, useEffect } from 'react'; // 📻 NEW: Added useEffect
import { Key, Copy, CheckCircle, Activity, Shield, AlertCircle } from 'lucide-react';

export default function B2BPortal() {
  const [apiKey, setApiKey] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 📻 NEW: Added State for real usage and limit
  const [usage, setUsage] = useState(0); 
  const [limit, setLimit] = useState(5000); 

  // 📻 NEW: useEffect to check if the user already generated a key previously
  useEffect(() => {
    const savedEmail = localStorage.getItem("villageApiUserEmail");
    if (savedEmail) {
      fetchClientData(savedEmail);
    }
  }, []);

  // 📻 NEW: Function to fetch live data from PostgreSQL
  const fetchClientData = async (emailToFetch) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/clients/usage/${emailToFetch}`);
      const result = await response.json();
      if (response.ok) {
        setApiKey(result.data.apiKey);
        setCompany(result.data.company);
        setEmail(result.data.email);
        setUsage(result.data.usage);
        setLimit(result.data.limit);
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!company || !email) {
      setError("Company and Email are required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3000/api/clients/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, email })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate key");
      }

      // 📻 NEW: Set usage to 0, update limit, and save email to browser storage!
      setApiKey(result.data.apiKey);
      setUsage(0);
      setLimit(result.data.limit);
      localStorage.setItem("villageApiUserEmail", email);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem("villageApiUserEmail"); // Clears the memory
    setApiKey(null); // Hides the key
    setCompany("");  // Clears the form
    setEmail("");
    setUsage(0);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 📻 NEW: Calculate the exact percentage for the green bar
  const progressPercentage = limit > 0 ? (usage / limit) * 100 : 0;

  return (
    <div style={{ padding: "60px 24px", maxWidth: 900, margin: "0 auto", animation: "fadeUp 0.5s ease forwards" }}>
      
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ color: "white", fontSize: 32, fontWeight: 800, margin: "0 0 8px" }}>Developer Portal</h1>
        <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>Manage your VillageAPI credentials and monitor usage.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 24 }}>
        
        {/* ── CARD 1: API Key Management ── */}
        <div className="glow-card" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "28px", backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ padding: 10, background: "rgba(14,165,233,0.1)", borderRadius: 10 }}><Key size={20} color="#0ea5e9" /></div>
            <h2 style={{ color: "white", fontSize: 18, fontWeight: 700, margin: 0 }}>Authentication</h2>
          </div>
          
          <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
            Your API key grants access to the VillageAPI network. Keep it secure and never expose it in client-side code.
          </p>

          {!apiKey ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Sleek Input Fields */}
              <input 
                type="text" 
                placeholder="Company Name" 
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 8, background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
              <input 
                type="email" 
                placeholder="Developer Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 8, background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
              
              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 12 }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button 
                onClick={handleGenerateKey} 
                disabled={isLoading}
                className="glow-btn" 
                style={{ width: "100%", padding: "12px", borderRadius: 10, background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)", color: "white", border: "none", cursor: isLoading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? "Loading..." : "Generate X-API-Key"}
              </button>
            </div>
          ) : (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <p style={{ margin: "0 0 8px", color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Your Secret Key</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <code style={{ flex: 1, background: "rgba(3,7,18,0.8)", padding: "12px 16px", borderRadius: 8, color: "#38bdf8", border: "1px solid rgba(14,165,233,0.3)", fontSize: 14, letterSpacing: "0.05em", wordBreak: "break-all" }}>
                  {apiKey}
                </code>
                <button onClick={copyToClipboard} className="glow-btn" style={{ padding: "12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer" }}>
                  {copied ? <CheckCircle size={18} color="#10b981" /> : <Copy size={18} />}
                </button>
              </div>
              {copied && <p style={{ color: "#10b981", fontSize: 12, margin: "8px 0 0", animation: "fadeUp 0.2s ease" }}>Copied to clipboard!</p>}

              {/* Add this new button right here! */}
              <button 
                onClick={handleLogout} 
                style={{ marginTop: "24px", width: "100%", padding: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.2)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
              >
                Sign Out / Switch Account
              </button>
            </div>
          )}
        </div>

        {/* ── CARD 2: Usage & Limits ── */}
        <div className="glow-card" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "28px", backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ padding: 10, background: "rgba(16,185,129,0.1)", borderRadius: 10 }}><Activity size={20} color="#10b981" /></div>
              <h2 style={{ color: "white", fontSize: 18, fontWeight: 700, margin: 0 }}>Free Tier Plan</h2>
            </div>
            <span style={{ padding: "4px 10px", background: "rgba(255,255,255,0.05)", borderRadius: 6, color: "#cbd5e1", fontSize: 11, fontWeight: 600 }}>Active</span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 500 }}>Daily Requests</span>
              
              {/* 📻 NEW: Dynamic Text! Replaced hardcoded 0 / 5,000 */}
              <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>
                {usage.toLocaleString()} <span style={{ color: "#64748b", fontWeight: 500 }}>/ {limit.toLocaleString()}</span>
              </span>

            </div>
            <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
              
              {/* 📻 NEW: Dynamic Width! Replaced width: "0%" */}
              <div style={{ 
                width: `${progressPercentage}%`, 
                height: "100%", 
                background: "#10b981", 
                boxShadow: "0 0 10px #10b981", 
                borderRadius: 4,
                transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" // Smooth animation
              }}></div>

            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
            <Shield size={16} color="#64748b" />
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>Rate limit resets at midnight IST.</p>
          </div>
        </div>

      </div>
    </div>
  );
}