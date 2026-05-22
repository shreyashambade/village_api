export default function InfoPanel({ fullAddress }) {
  const leftPanel = { padding: "32px 32px 32px 0", borderRight: "1px solid rgba(255,255,255,0.05)" };
  const statsGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 };
  // Notice we made the borders lighter and backgrounds more transparent for the glass effect
  const statCard = { background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px" };
  const featureList = { background: "rgba(15,23,42,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "18px 20px", marginBottom: 20 };
  const featureItem = { display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" };
  const addressPreview = { background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 12, padding: "14px 16px" };

  return (
    <div style={leftPanel}>
      <div style={statsGrid}>
        {[
          { n: "600K+", l: "Villages" }, { n: "700+", l: "Districts" },
          { n: "36", l: "States & UTs" }, { n: "<100ms", l: "Response Time" },
        ].map((s, i) => (
          /* ADDED 'glow-card' HERE */
          <div key={i} className="glow-card" style={statCard}>
            <p style={{ color: "white", fontWeight: 800, fontSize: 20, margin: "0 0 2px" }}>{s.n}</p>
            <p style={{ color: "#64748b", fontSize: 11, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* ADDED 'glow-card' HERE */}
      <div className="glow-card" style={featureList}>
        <p style={{ color: "#0ea5e9", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px", textShadow: "0 0 10px rgba(14,165,233,0.3)" }}>Platform Features</p>
        {[
          ["🔍", "Real-time autocomplete"], ["🏗️", "State-to-Village Hierarchy"],
          ["⚡", "Enterprise-Grade Speed"], ["🔐", "Secure B2B Integration"],
          ["📊", "Real-time Usage Dashboard"], ["🗺️", "Standardized Address Data"],
        ].map(([icon, text], i) => (
          <div key={i} style={featureItem}>
            <span style={{ fontSize: 15 }}>{icon}</span>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>{text}</span>
          </div>
        ))}
      </div>

      {fullAddress && (
        <div className="glow-card" style={addressPreview}>
          <p style={{ color: "#0ea5e9", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>📍 Address Preview</p>
          <p style={{ color: "white", fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1.6 }}>{fullAddress}</p>
        </div>
      )}
    </div>
  );
}