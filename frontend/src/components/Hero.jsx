export default function Hero({ onAdminClick, onPortalClick }) {
  // Styles specifically for the Hero component
  const navStyle = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(15, 23, 42, 0.99)", backdropFilter: "blur(16px)",
    position: "sticky", top: 0, zIndex: 50,
  };

  const navLogo = {
    width: 32, height: 32, borderRadius: 8, background: "rgba(59,130,246,0.15)",
    border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center",
  };

  const navLink = {
    fontSize: 13, fontWeight: 600, color: "#3b82f6", textDecoration: "none",
    padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(59,130,246,0.3)",
    background: "rgba(59,130,246,0.08)", transition: "all 0.2s",
  };

  const heroSection = {
    textAlign: "center", padding: "60px 24px 40px", maxWidth: 680, margin: "0 auto",
  };

  return (
    <>
      {/* Top nav bar */}
      <nav style={navStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={navLogo}>
            <span style={{ fontSize: 16 }}>🌍</span>
          </div>
          <div>
            <p style={{ margin: 0, color: "white", fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em" }}>VillageAPI</p>
            <p style={{ margin: 0, color: "#475569", fontSize: 11 }}>Location Intelligence Platform</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Admin Button */}
            <button 
              onClick={onAdminClick} 
              className="glow-btn" 
              style={{ padding: "7px 16px", borderRadius: 8, background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.3)", cursor: "pointer", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}
            >
                🛡️ Console
            </button>

          {/* Developer Portal Button */}
          {onPortalClick && (
             <button 
               onClick={onPortalClick} 
               className="glow-btn" 
               style={{ padding: "7px 16px", borderRadius: 8, background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", cursor: "pointer", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}
             >
               💻 Developers
             </button>
          )}
            
          
       </div>
      </nav>

      {/* Hero */}
      <div style={heroSection}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 999, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", marginBottom: 20 ,maxWidth:800, margin: "0 auto"}}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
          <span style={{ fontSize: 12, color: "#60a5fa", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>POWERING ADDRESS SEARCH ACROSS INDIA</span>
        </div>
        <h1 style={{ color: "white", fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 12px", lineHeight: 1.1 }}>
          <div>India’s Most Comprehensive</div>
          <div><span style={{ color: "#3b82f6" }}> Location & Address</span></div>
          <div>API Platform</div>
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
          600,000+ villages across India. Real-time autocomplete, hierarchical search, standardized address APIs.
        </p>
      </div>
    </>
  );
}