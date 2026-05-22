import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { LayoutDashboard, Key, BookOpen, Settings, Copy, Plus, RefreshCw, Trash2, CheckCircle2, Activity, Zap, Shield, Save, CreditCard, Lock, AlertTriangle, Users, Terminal, Code, LogOut, AlertCircle , Eye, EyeOff} from 'lucide-react';

// CORRECT — same folder
import ApiDocs from "./ApiDocs";

import { useIsMobile } from './useWindowSize';

export default function ClientDashboard({ onOpenDocs , onClosePortal }) {

  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [regPhone, setRegPhone] = useState("");

  const [userEmail, setUserEmail] = useState(localStorage.getItem("villageApiUserEmail"));
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [regCompany, setRegCompany] = useState("");

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const [activeTab, setActiveTab] = useState("API Keys"); 
  const [copiedKey, setCopiedKey] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [docLang, setDocLang] = useState("curl");

  const [editCompany, setEditCompany] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [twoFactor, setTwoFactor] = useState(false);

  const [showApiDocs, setShowApiDocs] = useState(false);


  // 🔐 2FA State Management
  const [is2FAEnabled, setIs2FAEnabled] = useState(false); // Connect this to your user's actual db status later!
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [tokenInput, setTokenInput] = useState("");


  // 🚀 NEW: The lookup dictionary for plan limits
  const PLAN_LIMITS = {
    FREE: 5000,
    PREMIUM: 50000,
    PRO: 300000,
    UNLIMITED: 1000000
  };



  // 🌟 TRACK MOUSE POSITION FOR THE GLOW EFFECT
 useEffect(() => {
  const handleMouseMove = (e) => {
    // clientX and clientY track the mouse relative to the browser window
    document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
  };
  window.addEventListener('mousemove', handleMouseMove);
  return () => window.removeEventListener('mousemove', handleMouseMove);
}, []);

  useEffect(() => {
    if (!userEmail) return;

    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/api/clients/me/dashboard?email=${encodeURIComponent(userEmail)}`);
        const result = await response.json();
        if (result.success) {
          setDashboardData(result.data);
          setEditCompany(result.data.profile.company);
          setEditEmail(result.data.profile.email);
        } else {
          // 🚀 STOP THE LOOP: Show the error instead of logging out!
          alert("Backend Error: " + (result.message || "Failed to load dashboard."));
        }
      } catch (error) {
        console.error("Failed to load client data", error);
        alert("Network Error: Could not connect to backend.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, [userEmail]);

  const handleAuth = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (isLoginMode) {
        // 🔐 LOGIN FLOW
        if (!regEmail || !regPassword) { setAuthError("Email and Password are required to log in."); setAuthLoading(false); return; }
        
        const response = await fetch(`http://localhost:3000/api/clients/login`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: regEmail, password: regPassword })
        });
        const result = await response.json();
        
        if (response.ok && result.success) {
          localStorage.setItem("villageApiUserEmail", regEmail);
          // 🚀 FIX: Save the actual JWT token from the backend so billing works!
          localStorage.setItem("villageClientToken", result.token);
          setUserEmail(regEmail);
          // 🚀 Wipes the password from memory instantly after success
          setRegPassword("");

        } else { setAuthError(result.error || "Invalid credentials."); }
        
      } else {
        // 📝 REGISTER FLOW
        if (!regCompany || !regEmail || !regPassword) { setAuthError("Company, Email, and Password are required."); setAuthLoading(false); return; }
        
        const response = await fetch("http://localhost:3000/api/clients/register", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company: regCompany, email: regEmail, password: regPassword, phone: regPhone })
        });
        const result = await response.json();
        
        if (response.ok) {
          alert("Registration successful! Your account is pending admin approval.");
          setIsLoginMode(true); // Switch to login mode
          setRegPassword(""); // Clear password for safety
        } else { setAuthError(result.error || result.message || "Failed to register."); }
      }
    } catch (err) { setAuthError("Network Error. Ensure backend is running."); } 
    finally { setAuthLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("villageApiUserEmail");
    localStorage.removeItem("villageClientToken"); // 🚀 FIXED: Delete the billing token!
    setUserEmail(null);
    setDashboardData(null); 
    setRegPassword(""); // 🚀 Explicitly clears the password box
    setRegCompany("");
    setRegEmail("");
    setRegPhone("");
    setAuthError(null);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text); setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRegenerateKey = async (clientId) => {
    if (!clientId) return;
    if (!window.confirm("Are you sure? Your old API key will instantly stop working!")) return;

    try {
      const response = await fetch(`http://localhost:3000/api/clients/${clientId}/reset`, { method: "PUT" });
      const result = await response.json();
      
      if (response.ok) {
        const newKey = result.data.apiKey; 
        setDashboardData(prev => ({
          ...prev,
          keys: prev.keys.map((k, index) => {
            if (index === 0) {
              return { ...k, fullKey: newKey, key: newKey.substring(0, 16) + "...", lastUsed: "Just generated", status: "Active" };
            }
            return k;
          })
        }));
        alert("Success! Your new API key is ready.");
      } else {
        alert("Server Error: " + result.message);
      }
    } catch (error) { alert("Network Error: Could not connect to server."); }
  };


  const handleRevokeSpecificKey = async (keyId) => {
    if (!window.confirm("Are you sure? This key will instantly stop working and cannot be recovered.")) return;

    try {
      const response = await fetch(`http://localhost:3000/api/clients/keys/${keyId}/revoke`, { method: "PUT" });
      if (response.ok) {
        // Update the UI locally so it instantly turns red without refreshing the page!
        setDashboardData(prev => ({
          ...prev,
          keys: prev.keys.map(k => k.id === keyId ? { ...k, status: "Revoked" } : k)
        }));
      } else {
        alert("Failed to revoke key.");
      }
    } catch (error) {
      alert("Network Error: Could not connect to server.");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/api/clients/${dashboardData.profile.id}/profile`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: editCompany, email: editEmail })
      });
      if (response.ok) {
        setDashboardData(prev => ({ ...prev, profile: { ...prev.profile, company: editCompany, email: editEmail } }));
        localStorage.setItem("villageApiUserEmail", editEmail); setUserEmail(editEmail);
        alert("Profile updated successfully!");
      }
    } catch (error) { alert("Network Error"); }
  };


  const handleUpgradePlan = async (planId) => {
    try {
      // Assuming you store the client's JWT in localStorage just like the admin token
      const clientToken = localStorage.getItem("villageClientToken"); 
      
      const response = await fetch("http://localhost:3000/api/clients/billing/checkout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${clientToken}`
        },
        body: JSON.stringify({ planId: planId, email: userEmail })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Stripe requires us to redirect the entire browser window to their secure payment page
        window.location.href = result.url; 
      } else {
        alert("Billing Error: " + result.message);
      }
    } catch (error) {
      alert("Network Error: Could not connect to billing server.");
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/clients/billing/portal", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail })
      });
      const data = await response.json();
      
      if (data.success) {
        window.location.href = data.url; // Redirect to Stripe Portal!
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Error connecting to billing system.");
    }
  };

  const sidebarItems = [
    { icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { icon: <Key size={18} />, label: "API Keys" },
    { icon: <BookOpen size={18} />, label: "Documentation" },
    { icon: <Settings size={18} />, label: "Account Settings" },
  ];

  // 💎 THE CLEAN GLASS & GLOW STYLES
  const CustomStyles = () => (
  <style>{`
    /* 1. Global Background Glow */
    .dashboard-wrapper {
      position: relative;
      background: #030712;
      overflow: hidden;
    }

    .dashboard-wrapper::before {
      content: "";
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      
      /* LAYER 1: The "Core" - A small, brighter center */
      background-image: radial-gradient(
        500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), 
        rgba(16, 185, 129, 0.12), 
        transparent 60%
      ),
      /* LAYER 2: The "Ambiance" - A huge, very faint outer glow to prevent circles */
      radial-gradient(
        800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), 
        rgba(16, 185, 129, 0.04), 
        transparent 70%
      );
      
      z-index: 0;
      pointer-events: none;
      
      /* The Secret: Extra blur to smudge the mathematical edges of the circle */
      filter: blur(60px);
    }

    /* 2. Simplified Glass Cards (No internal mouse glow) */
    .glow-card {
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      position: relative;
      z-index: 1; /* Keeps content above the background light */
      transition: all 0.3s ease;
    }

    .glow-btn-green {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white !important;
      border: none !important;
      box-shadow: 
        0 0 15px rgba(16, 185, 129, 0.4),  /* Soft outer glow */
        0 0 5px rgba(16, 185, 129, 0.6);   /* Sharp inner glow */
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .glow-btn-green:hover {
      transform: translateY(-1px);
      box-shadow: 
        0 0 25px rgba(16, 185, 129, 0.6), 
        0 0 10px rgba(16, 185, 129, 0.8);
      filter: brightness(1.1);
    }

    .glow-btn-green:active {
      transform: translateY(0px);
    }
    
    .glass-input {
      background: rgba(3, 7, 18, 0.5) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }

    /* 🚀 NEW: Header Glowing Button Effects */
    .header-glow-btn {
      padding: 8px 16px;
      background: rgba(14, 165, 233, 0.05);
      border: 1px solid rgba(14, 165, 233, 0.4);
      color: #0ea5e9;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .header-glow-btn:hover {
      background: rgba(14, 165, 233, 0.15);
      border-color: #0ea5e9;
      color: white;
      box-shadow: 0 0 20px rgba(14, 165, 233, 0.5);
      transform: translateY(-2px);
    }

  `}</style>
);

// 🚀 Function 1: Ask backend for the QR Code
  const handleInitiate2FA = async () => {
    // Grab the logged-in user's email from localStorage!
    const currentUserEmail = localStorage.getItem("villageApiUserEmail");

    if (!currentUserEmail) {
      alert("Error: Could not find logged-in user email.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/clients/auth/2fa/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUserEmail }) // <-- Sent successfully!
      });
      const data = await response.json();
      
      if (data.success) {
        setQrCodeUrl(data.qrCodeUrl);
        setShow2FAModal(true); // Pop open the scanner modal!
      } else {
        alert("Failed to generate 2FA: " + data.message);
      }
    } catch (error) {
      console.error("Failed to initiate 2FA", error);
    }
  };

  // 🚀 Function 2: Send the 6-digit code to verify
  const handleVerify2FA = async () => {
    const currentUserEmail = localStorage.getItem("villageApiUserEmail");

    try {
      const response = await fetch("http://localhost:3000/api/clients/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUserEmail, token: tokenInput }) // <-- Send the 6 digits!
      });
      const data = await response.json();
      
      if (data.success) {
        setIs2FAEnabled(true); // Flip the toggle ON visually
        setShow2FAModal(false); // Close the modal
        setTokenInput(""); // Clear the input
        alert("Two-Factor Authentication is now ENABLED! 🛡️");
      } else {
        alert("Invalid code. Please try again.");
      }
    } catch (error) {
      console.error("Failed to verify 2FA", error);
    }
  };


  // 🚀 Function 3: Turn off 2FA
  const handleDisable2FA = async () => {
    // Safety check before disabling!
    const confirmDisable = window.confirm("Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.");
    if (!confirmDisable) return;

    const currentUserEmail = localStorage.getItem("villageApiUserEmail");

    try {
      const response = await fetch("http://localhost:3000/api/clients/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUserEmail }) 
      });
      const data = await response.json();
      
      if (data.success) {
        setIs2FAEnabled(false); // Flip the toggle OFF visually
        alert("Two-Factor Authentication has been disabled.");
      } else {
        alert("Failed to disable 2FA: " + data.message);
      }
    } catch (error) {
      console.error("Failed to disable 2FA", error);
    }
  };


  const isMobile = useIsMobile();


  if (!userEmail) {
    return (
      <div style={{ display: "flex", width: "100%", height: "100vh", backgroundColor: "#030712", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <CustomStyles />
        <div className="glow-card" style={{ zIndex: 10, borderRadius: 16, padding: "40px", width: "100%", maxWidth: "450px", animation: "fadeUp 0.5s ease forwards" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>🚀</div>
            <h1 style={{ color: "white", fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>{isLoginMode ? "Welcome Back" : "Create Workspace"}</h1>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>{isLoginMode ? "Enter your email to access your Developer Portal." : "Set up your company profile to generate an API key."}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {!isLoginMode && <input type="text" placeholder="Company Name (e.g. CropSense AI)" value={regCompany} onChange={(e) => setRegCompany(e.target.value)} className="glass-input" style={{ width: "100%", padding: "12px 16px", borderRadius: 8, color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }} />} {!isLoginMode && <input type="tel" placeholder="Phone Number (Optional)" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="glass-input" style={{ width: "100%", padding: "12px 16px", borderRadius: 8, color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }} />}
            <input type="email" placeholder="Developer Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}  className="glass-input" style={{ width: "100%", padding: "12px 16px", borderRadius: 8, color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            <div style={{ position: "relative", width: "100%" }}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password (Min 8 characters)" 
                value={regPassword} 
                onChange={(e) => setRegPassword(e.target.value)} 
                className="glass-input" 
                style={{ width: "100%", padding: "12px 40px 12px 16px", borderRadius: 8, color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {authError && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 13 }}><AlertCircle size={14} /> {authError}</div>}
            
            <button onClick={handleAuth} disabled={authLoading} style={{ width: "100%", padding: "12px", borderRadius: 10, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", border: "none", cursor: authLoading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, marginTop: 8 }}>
              {authLoading ? "Authenticating..." : (isLoginMode ? "Log In" : "Register")}
            </button>
            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginTop: 8 }}>{isLoginMode ? "Don't have an account? " : "Already have an account? "}<span onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(null); }} style={{ color: "#10b981", cursor: "pointer", fontWeight: 600 }}>{isLoginMode ? "Sign up" : "Log in"}</span></p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) return <div style={{ height: "100vh", background: "#030712", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Live Data...</div>;
  if (!dashboardData) return <div style={{ height: "100vh", background: "#030712", color: "white", display: "flex", flexDirection: "column", gap: 16, alignItems: "center", justifyContent: "center" }}><p style={{ color: "#ef4444" }}>Error connecting to database.</p><button onClick={handleLogout} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: 8, cursor: "pointer" }}>Return to Login</button></div>;


  // ────────────────────────────────────────────────────────────────────────
  // PENDING APPROVAL LOCK SCREEN (PRD 9.1)
  // ────────────────────────────────────────────────────────────────────────
  if (dashboardData.profile.status === "PENDING_APPROVAL") {
    return (
      <div className="dashboard-wrapper" style={{ display: "flex", width: "100%", height: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <CustomStyles />
        <div className="glow-card" style={{ zIndex: 10, borderRadius: 16, padding: "40px", width: "100%", maxWidth: "450px", textAlign: "center", animation: "fadeUp 0.5s ease forwards" }}>
           <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>⏳</div>
           <h1 style={{ color: "white", fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Approval Pending</h1>
           <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>Your account has been created successfully, but it is currently waiting for administrator review. You will receive an email once approved.</p>
           <button onClick={handleLogout} className="glow-btn-green" style={{ width: "100%", padding: "12px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Return to Login</button>
        </div>
      </div>
    );
  }

  const chartData = dashboardData.usageData && dashboardData.usageData.length > 0 ? dashboardData.usageData : [{ date: "Today", requests: 0 }];
  const liveApiKey = dashboardData.keys?.fullKey || 'YOUR_API_KEY'; 

  return (
    <div className="dashboard-wrapper" style={{ display: "flex", flexDirection: isMobile ? "column" : "row", width: "100%", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <CustomStyles />
      
      {/* ── CLIENT SIDEBAR ── */}
        <div style={{ 
          width: isMobile ? "100%" : "260px", 
          borderBottom: isMobile ? "1px solid rgba(255,255,255,0.05)" : "none",
          borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.05)", 
          padding: "24px", 
          background: "rgba(15,23,42,0.25)", 
          backdropFilter: "blur(16px)", 
          display: "flex", 
          flexDirection: isMobile ? "row" : "column", 
          
          /* 🚀 THE FIX: Only center and space-out items on mobile! On desktop, align to top. */
          alignItems: isMobile ? "center" : "stretch",
          justifyContent: isMobile ? "space-between" : "flex-start",
          
          flexWrap: "wrap",
          zIndex: 50,
          position: isMobile ? "relative" : "sticky",
          top: 0,
          height: isMobile ? "auto" : "100vh",
          boxSizing: "border-box"
        }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isMobile ? 0 : 40 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🚀</div>
          <div><p style={{ margin: 0, color: "white", fontWeight: 700, fontSize: 16 }}>VillageAPI</p><p style={{ margin: 0, color: "#10b981", fontSize: 11, fontWeight: 600 }}>DEVELOPER PORTAL</p></div>
        </div>

        <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 8, flexWrap: "wrap" }}>
          {sidebarItems.map((item, i) => {
            const isActive = activeTab === item.label;
            return (
              <div key={i} onClick={() => setActiveTab(item.label)} style={{ display: "flex", alignItems: "center", gap: 12, padding: isMobile ? "8px 12px" : "12px 16px", borderRadius: 12, cursor: "pointer", background: isActive ? "rgba(16,185,129,0.15)" : "transparent", color: isActive ? "#10b981" : "#64748b", border: isActive ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent", transition: "all 0.2s" }}>
                {item.icon} {!isMobile && <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 500 }}>{item.label}</span>}
              </div>
            );
          })}
        </div>


        <div style={{ 
          position: isMobile ? "relative" : "absolute", 
          bottom: isMobile ? "auto" : 24, 
          left: isMobile ? "auto" : 24, 
          right: isMobile ? "auto" : 24, 
          width: isMobile ? "100%" : "auto", 
          marginTop: isMobile ? 16 : 0 
        }}>
          <button onClick={handleLogout} style={{ width: "100%", padding: "10px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}><LogOut size={14} /> Sign Out</button>

          <div className="glow-card" style={{ padding: "16px", borderRadius: "12px" }}>
              <p style={{ margin: "0 0 4px", color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>CURRENT PLAN</p>
              <p style={{ margin: "0 0 12px", color: "white", fontSize: 16, fontWeight: 700 }}>{dashboardData.profile.plan} Tier</p>
              
              {/* 🚀 FIXED: Progress bar math now uses the dictionary */}
              <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${Math.min((dashboardData.profile.usage / PLAN_LIMITS[dashboardData.profile.plan || "FREE"]) * 100, 100)}%`, height: "100%", background: "#10b981", borderRadius: 3 }} />
              </div>
              
              {/* 🚀 FIXED: Text display now uses the dictionary */}
              <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: 12 }}>
                {dashboardData.profile?.usage?.toLocaleString() || 0} / {PLAN_LIMITS[dashboardData.profile?.plan || "FREE"].toLocaleString()} reqs
              </p>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxHeight: isMobile ? "none" : "100vh", zIndex: 10 }}>

       {/* 🚀 NEW HEADER */}
        <div style={{ padding: isMobile ? "16px" : "16px 40px", display: "flex", justifyContent: "flex-end", gap: "12px", background: "rgba(15,23,42,0.25)", backdropFilter:"blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.05)", zIndex: 50, flexShrink:0 }}>
          
          {(activeTab === "API Keys" || activeTab === "Documentation") && (
            <button 
              onClick={onOpenDocs}
              className="glow-btn-green"
              style={{ padding: "8px 16px", borderRadius: "8px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
            >
              Test in API Docs →
            </button>
          )}

          <button type = "button" onClick={onClosePortal} className="header-glow-btn">
            ✕ Close
          </button>
        </div>

        {/* 🚀 SCROLLABLE CONTENT AREA */}
        <div style={{ flex: 1, padding: isMobile ? "16px" : "40px", overflowY: isMobile ? "visible" : "auto" }}>



        
        {activeTab === "Dashboard" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>
             <h1 style={{ color: "white", fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>Welcome back, {dashboardData.profile.company}!</h1>
             <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 32px" }}>Here is how your application is interacting with VillageAPI.</p>
             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 32 }}>
               {[
                 { 
                   title: "Total Plan Usage", 
                   value: dashboardData.profile?.usage?.toLocaleString() || "0", 
                   sub: dashboardData.profile?.custom_daily_limit ? `of ${dashboardData.profile.custom_daily_limit.toLocaleString()} custom limit` : `Plan Default`, 
                   icon: <Activity size={20} color="#10b981" />, 
                   alert: false 
                 },
                 { title: "Avg Latency", value: `${dashboardData.metrics?.avgLatency || 0}ms`, sub: "Fast & Optimal", icon: <Zap size={20} color="#10b981" /> },
                 { title: "Success Rate", value: `${dashboardData.metrics?.successRate || 100}%`, sub: "All time", icon: <Shield size={20} color="#8b5cf6" /> },
               ].map((stat, i) => (
                 <div key={i} className="glow-card" style={{ border: stat.alert ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "20px" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}><p style={{ margin: 0, color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>{stat.title}</p><div style={{ padding: 8, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>{stat.icon}</div></div>
                   <h3 style={{ margin: "0 0 8px", color: stat.alert ? "#f59e0b" : "white", fontSize: 32, fontWeight: 800 }}>{stat.value}</h3><p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>{stat.sub}</p>
                 </div>
               ))}
             </div>
             <div className="glow-card" style={{ borderRadius: 12, padding: "24px" }}>
              <h3 style={{ margin: "0 0 24px", color: "white", fontSize: 16, fontWeight: 700 }}>API Traffic (Last 7 Days)</h3>
              <div style={{ width: '100%', height: "350px", minHeight: "350px", position: "relative" }}>
                <ResponsiveContainer width="99%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                    <defs><linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', color: 'white' }} itemStyle={{ color: '#10b981', fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="requests" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReqs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "API Keys" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
               <div>
                 <h1 style={{ color: "white", fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>API Keys</h1>
                 <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Manage your authentication keys. Do not share these publicly.</p>
               </div>
               <button 
                  onClick={() => handleRegenerateKey(dashboardData.profile.id)}
                  className="glow-btn-green"
                  style={{ 
                    padding: "10px 20px", /* Slightly wider for better impact */
                    borderRadius: "10px", 
                    fontWeight: 700, 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px" 
                  }}
                >
                  <RefreshCw size={18} /> Generate API Key
                </button>
             </div>

             <div className="glow-card" style={{ borderRadius: 12, overflow: "hidden" }}>
               <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                 <thead>
                   <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                     <th style={{ padding: "20px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>KEY NAME</th>
                     <th style={{ padding: "20px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>API KEY</th>
                     <th style={{ padding: "20px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>CREATED / LAST USED</th>
                     <th style={{ padding: "20px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>STATUS</th>
                     <th style={{ padding: "20px 24px", textAlign: "right" }}>ACTIONS</th>
                   </tr>
                 </thead>
                 <tbody>
                   {dashboardData.keys.map((k) => (
                     <tr key={k.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                       <td style={{ padding: "20px 24px", color: "white", fontWeight: 600, fontSize: 14 }}>{k.name}</td>
                       <td style={{ padding: "20px 24px" }}>
                         <div className="glass-input" style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 8, width: "fit-content" }}>
                           <code style={{ color: "#10b981", fontSize: 13 }}>{k.key}</code>
                           <button onClick={() => handleCopy(k.fullKey)} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", display: "flex" }}>{copiedKey === k.fullKey ? <CheckCircle2 size={16} color="#10b981" /> : <Copy size={16} />}</button>
                         </div>
                       </td>
                       <td style={{ padding: "20px 24px" }}><p style={{ margin: 0, color: "white", fontSize: 13 }}>{k.created}</p><p style={{ margin: 0, color: "#64748b", fontSize: 11 }}>{k.lastUsed}</p></td>
                       <td style={{ padding: "20px 24px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: k.status === 'Active' ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: k.status === 'Active' ? "#10b981" : "#ef4444" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: k.status === 'Active' ? "#10b981" : "#ef4444" }} />{k.status}</span></td>
                       <td style={{ padding: "20px 24px", textAlign: "right" }}>
                           <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                             <button onClick={() => alert("Rotate feature coming soon: This will issue a new Secret for this specific key.")} className="glass-input" style={{ padding: "8px", borderRadius: "8px", color: "white", cursor: "pointer" }} title="Rotate Secret"><RefreshCw size={16} /></button>
                             <button onClick={() => handleRevokeSpecificKey(k.id)} 
                              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", padding: "8px", borderRadius: "8px", color: "#ef4444", cursor: "pointer" }} 
                              title="Delete Key"
                            >
                              <Trash2 size={16} /></button>
                           </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === "Documentation" && (
           <div style={{ animation: "fadeUp 0.4s ease forwards" }}>
             <h1 style={{ color: "white", fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>Developer Documentation</h1>
             <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 32px" }}>Integrate VillageAPI into your application using your preferred language.</p>
             <div className="glow-card" style={{ borderRadius: 12, overflow: "hidden" }}>
               <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(3,7,18,0.4)" }}>
                 <button onClick={() => setDocLang("curl")} style={{ flex: 1, padding: "16px", background: docLang === "curl" ? "rgba(16,185,129,0.1)" : "transparent", color: docLang === "curl" ? "#10b981" : "#94a3b8", border: "none", borderBottom: docLang === "curl" ? "2px solid #10b981" : "2px solid transparent", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Terminal size={16}/> cURL</button>
                 <button onClick={() => setDocLang("node")} style={{ flex: 1, padding: "16px", background: docLang === "node" ? "rgba(16,185,129,0.1)" : "transparent", color: docLang === "node" ? "#10b981" : "#94a3b8", border: "none", borderBottom: docLang === "node" ? "2px solid #10b981" : "2px solid transparent", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Code size={16}/> Node.js</button>
                 <button onClick={() => setDocLang("python")} style={{ flex: 1, padding: "16px", background: docLang === "python" ? "rgba(16,185,129,0.1)" : "transparent", color: docLang === "python" ? "#10b981" : "#94a3b8", border: "none", borderBottom: docLang === "python" ? "2px solid #10b981" : "2px solid transparent", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Code size={16}/> Python</button>
               </div>
               <div style={{ padding: "32px" }}>
                 <h3 style={{ color: "white", margin: "0 0 16px", fontSize: 18 }}>Authentication & Basic Request</h3>
                 <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>All API requests require your unique API key to be passed in the `X-API-Key` header.</p>
                 <div style={{ position: "relative" }}>
                   <button onClick={() => handleCopy(docLang === "curl" ? `curl -X GET "https://api.villageapi.com/v1/states" -H "X-API-Key: ${liveApiKey}"` : docLang === "node" ? `fetch('https://api.villageapi.com/v1/states', {\n  headers: { 'X-API-Key': '${liveApiKey}' }\n})\n  .then(res => res.json())\n  .then(console.log);` : `import requests\n\nheaders = {'X-API-Key': '${liveApiKey}'}\nresponse = requests.get('https://api.villageapi.com/v1/states', headers=headers)\nprint(response.json())`)} style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", padding: 6, borderRadius: 6, cursor: "pointer" }}><Copy size={14}/></button>
                   <pre className="glass-input" style={{ padding: "20px", borderRadius: 8, color: "#10b981", fontSize: 13, overflowX: "auto", margin: 0 }}>
                    {docLang === "curl" && `curl -X GET "https://api.villageapi.com/v1/states" \\
                      -H "X-API-Key: ${liveApiKey}"`}
                    {docLang === "node" && `fetch('https://api.villageapi.com/v1/states', {
                      headers: {
                        'X-API-Key': '${liveApiKey}'
                      }
                    })
                      .then(response => response.json())
                      .then(data => console.log(data));`}
                    {docLang === "python" && `import requests

                    url = "https://api.villageapi.com/v1/states"
                    headers = {
                        "X-API-Key": "${liveApiKey}"
                    }

                    response = requests.get(url, headers=headers)
                    print(response.json())`}
                   </pre>
                 </div>
                 <button onClick={() => window.open("https://village-location-api.onrender.com/api-docs/", "_blank")} style={{ marginTop: 32, padding: "12px 24px", background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><BookOpen size={18} /> View Full Swagger Documentation</button>
               </div>
             </div>
           </div>
        )}

        {activeTab === "Account Settings" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>
             <div style={{ marginBottom: 40 }}>
               <h1 style={{ color: "white", fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>Workspace Settings</h1>
               <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Manage your team profile, billing, and security preferences.</p>
             </div>
             <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
                <div className="glow-card" style={{ borderRadius: 12, padding: "32px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 16 }}><Users size={20} color="#10b981" /><h2 style={{ color: "white", fontSize: 16, fontWeight: 700, margin: 0 }}>Company Profile</h2></div>
                  <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div><label style={{ display: "block", margin: "0 0 8px", color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>COMPANY NAME</label><input type="text" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} className="glass-input" style={{ width: "100%", boxSizing: "border-box", padding: "12px", borderRadius: "8px", color: "white", outline: "none" }} /></div>
                    <div><label style={{ display: "block", margin: "0 0 8px", color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>BILLING EMAIL</label><input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="glass-input" style={{ width: "100%", boxSizing: "border-box", padding: "12px", borderRadius: "8px", color: "white", outline: "none" }} /></div>
                    <button type="submit" style={{ padding: "12px", background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: 8 }}><Save size={18} /> Save Changes</button>
                  </form>
                </div>
                <div className="glow-card" style={{ borderRadius: 12, padding: "32px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 16 }}><Lock size={20} color="#0ea5e9" /><h2 style={{ color: "white", fontSize: 16, fontWeight: 700, margin: 0 }}>Authentication & Security</h2></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <label className="glass-input" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: 16, borderRadius: 12 }}>
                      <div><span style={{ color: "white", fontWeight: 600, fontSize: 14, display: "block", marginBottom: 4 }}>Two-Factor Authentication</span><span style={{ color: "#94a3b8", fontSize: 12 }}>Require 2FA for all workspace members.</span></div>
                      {/* Dynamic 2FA Toggle Switch */}
                        <div 
                          onClick={() => {
                            if (!is2FAEnabled) {
                              handleInitiate2FA();
                            } else {
                              handleDisable2FA();
                            }
                          }}
                          style={{ 
                            width: "44px", 
                            height: "24px", 
                            borderRadius: "12px", 
                            background: is2FAEnabled ? "#10b981" : "rgba(255,255,255,0.1)", /* Turns vibrant green when ON */
                            position: "relative", 
                            cursor: "pointer", 
                            transition: "background 0.3s ease",
                            flexShrink: 0
                          }}
                        >
                          <div style={{ 
                            width: "20px", 
                            height: "20px", 
                            borderRadius: "50%", 
                            background: "white", 
                            position: "absolute", 
                            top: "2px", 
                            left: is2FAEnabled ? "22px" : "2px", /* Slides to the right when ON */
                            transition: "left 0.3s ease",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                          }} />
                        </div>
                    </label>
                  </div>
                </div>

                {/* 🚀 NEW: FULL 4-TIER BILLING & SUBSCRIPTION CARD */}
                <div className="glow-card" style={{ gridColumn: "1 / -1", borderRadius: 12, padding: "32px", marginTop: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 16 }}>
                    <CreditCard size={20} color="#8b5cf6" />
                    <h2 style={{ color: "white", fontSize: 16, fontWeight: 700, margin: 0 }}>Plan & Billing</h2>

                    {/* 🚀 NEW: The Manage Billing Button */}
                    <button onClick={handleManageBilling} style={{ marginLeft:"auto", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
                      Manage Subscription
                    </button>

                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 20 }}>
                    
                    {/* 1. Free Plan */}
                    <div style={{ padding: "24px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(3,7,18,0.5)", position: "relative" }}>
                      {dashboardData.profile?.plan === "FREE" && <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.1)", color: "#e2e8f0", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>CURRENT</div>}
                      <h3 style={{ color: "white", margin: "0 0 8px", fontSize: 18 }}>Free Tier</h3>
                      <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 16px" }}>5,000 requests / day</p>
                      <h2 style={{ color: "white", margin: "0 0 24px", fontSize: 24 }}>$0<span style={{ fontSize: 14, color: "#64748b" }}>/mo</span></h2>
                      <button disabled style={{ width: "100%", padding: "10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "none", fontWeight: 600 }}>Default Plan</button>
                    </div>

                    {/* 2. Premium Plan */}
                    <div style={{ padding: "24px", borderRadius: "12px", border: "1px solid rgba(16,185,129,0.5)", background: "rgba(16,185,129,0.05)", position: "relative" }}>
                      {dashboardData.profile?.plan === "PREMIUM" && <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(16,185,129,0.2)", color: "#10b981", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>CURRENT</div>}
                      <h3 style={{ color: "white", margin: "0 0 8px", fontSize: 18 }}>Premium</h3>
                      <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 16px" }}>50,000 requests / day</p>
                      <h2 style={{ color: "white", margin: "0 0 24px", fontSize: 24 }}>$49<span style={{ fontSize: 14, color: "#64748b" }}>/mo</span></h2>
                      <button 
                        onClick={() => handleUpgradePlan("PREMIUM")}
                        disabled={dashboardData.profile?.plan === "PREMIUM"}
                        style={{ width: "100%", padding: "10px", borderRadius: 8, background: dashboardData.profile?.plan === "PREMIUM" ? "rgba(16,185,129,0.2)" : "#10b981", color: "white", border: "none", fontWeight: 600, cursor: dashboardData.profile?.plan === "PREMIUM" ? "default" : "pointer", transition: "0.2s" }}
                      >
                        {dashboardData.profile?.plan === "PREMIUM" ? "Current Plan" : "Upgrade to Premium"}
                      </button>
                    </div>

                    {/* 3. Pro Plan */}
                    <div style={{ padding: "24px", borderRadius: "12px", border: "1px solid rgba(139,92,246,0.5)", background: "rgba(139,92,246,0.05)", position: "relative" }}>
                      {dashboardData.profile?.plan === "PRO" && <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(139,92,246,0.2)", color: "#8b5cf6", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>CURRENT</div>}
                      <h3 style={{ color: "white", margin: "0 0 8px", fontSize: 18 }}>Pro Tier</h3>
                      <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 16px" }}>300,000 requests / day</p>
                      <h2 style={{ color: "white", margin: "0 0 24px", fontSize: 24 }}>$199<span style={{ fontSize: 14, color: "#64748b" }}>/mo</span></h2>
                      <button 
                        onClick={() => handleUpgradePlan("PRO")}
                        disabled={dashboardData.profile?.plan === "PRO"}
                        style={{ width: "100%", padding: "10px", borderRadius: 8, background: dashboardData.profile?.plan === "PRO" ? "rgba(139,92,246,0.2)" : "#8b5cf6", color: "white", border: "none", fontWeight: 600, cursor: dashboardData.profile?.plan === "PRO" ? "default" : "pointer", transition: "0.2s" }}
                      >
                        {dashboardData.profile?.plan === "PRO" ? "Current Plan" : "Upgrade to Pro"}
                      </button>
                    </div>

                    {/* 4. Unlimited Plan */}
                    <div style={{ padding: "24px", borderRadius: "12px", border: "1px solid rgba(14,165,233,0.5)", background: "rgba(14,165,233,0.05)", position: "relative" }}>
                      {dashboardData.profile?.plan === "UNLIMITED" && <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(14,165,233,0.2)", color: "#0ea5e9", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>CURRENT</div>}
                      <h3 style={{ color: "white", margin: "0 0 8px", fontSize: 18 }}>Unlimited</h3>
                      <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 16px" }}>1,000,000 requests / day</p>
                      <h2 style={{ color: "white", margin: "0 0 24px", fontSize: 24 }}>$499<span style={{ fontSize: 14, color: "#64748b" }}>/mo</span></h2>
                      <button 
                        onClick={() => handleUpgradePlan("UNLIMITED")}
                        disabled={dashboardData.profile?.plan === "UNLIMITED"}
                        style={{ width: "100%", padding: "10px", borderRadius: 8, background: dashboardData.profile?.plan === "UNLIMITED" ? "rgba(14,165,233,0.2)" : "#0ea5e9", color: "white", border: "none", fontWeight: 600, cursor: dashboardData.profile?.plan === "UNLIMITED" ? "default" : "pointer", transition: "0.2s" }}
                      >
                        {dashboardData.profile?.plan === "UNLIMITED" ? "Current Plan" : "Go Unlimited"}
                      </button>
                    </div>

                  </div>
                </div>
                {/* 🚀 END OF BILLING CARD */}

             </div>
          </div>
        )}

        </div> {/* 🚀 CLOSE THE SCROLLABLE CONTENT AREA */}

      </div>

      {/* 🔐 2FA SETUP MODAL */}
      {show2FAModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(8px)", zIndex: 100 }}>
          <div className="glow-card" style={{ background: "#0f172a", padding: "32px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", width: "100%", maxWidth: "400px", textAlign: "center" }}>
            
            <h2 style={{ color: "white", margin: "0 0 8px", fontSize: 20 }}>Set Up 2FA</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 24px" }}>Scan this QR code with Google Authenticator or Authy.</p>
            
            {/* The QR Code Image */}
            {qrCodeUrl ? (
              <div style={{ background: "white", padding: "16px", borderRadius: "12px", display: "inline-block", marginBottom: "24px" }}>
                <img src={qrCodeUrl} alt="2FA QR Code" style={{ width: "200px", height: "200px" }} />
              </div>
            ) : (
              <p style={{ color: "#38bdf8" }}>Generating secure code...</p>
            )}

            {/* The 6-Digit Input */}
            <input 
              type="text" 
              placeholder="Enter 6-digit code" 
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              maxLength={6}
              style={{ width: "100%", padding: "12px", background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "white", borderRadius: "8px", fontSize: 18, textAlign: "center", letterSpacing: "4px", marginBottom: "24px", outline: "none" }}
            />

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShow2FAModal(false)} style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: "8px", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleVerify2FA} className="glow-btn-green" style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                Verify & Enable
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}