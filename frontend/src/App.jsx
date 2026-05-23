import { useState , useEffect} from "react";
import Hero from "./components/Hero";
import InfoPanel from "./components/InfoPanel";
import LocationForm from "./components/LocationForm";
import AdminDashboard from "./components/AdminDashboard"; 
import ClientDashboard from "./components/ClientDashboard";
import ApiDocs from "./components/ApiDocs"; // 📻 NEW: Imported ApiDocs safely!

import { useIsMobile } from './components/useWindowSize';

export default function App() {
  const [fullAddress, setFullAddress] = useState("");
  const [submittedData, setSubmittedData] = useState(null);
  
 // Controls which screen is showing: "demo", "admin", "portal", or "docs"
  const [view, setView] = useState(localStorage.getItem("villageApiView") || "demo");

  // 1. Sync to local storage
  useEffect(() => {
    localStorage.setItem("villageApiView", view);
  }, [view]);


  // 2. Listen for the native browser BACK button
  useEffect(() => {
    const handlePopState = (event) => {
      // When the user hits the back button, read the history state and update React!
      if (event.state && event.state.view) {
        setView(event.state.view);
      } else {
        setView("demo");
      }
    };

    // Make sure the very first page load is registered in the history stack
    if (!window.history.state) {
      window.history.replaceState({ view: view }, '', view === 'demo' ? '/' : `/${view}`);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [view]);

  // 3. Custom Navigation Function (The Magic Fix)
  const navigateTo = (newView) => {
    // A. Figure out what the URL should look like
    const path = newView === "demo" ? "/" : `/${newView}`;
    
    // B. Push the new URL to the browser history!
    window.history.pushState({ view: newView }, "", path);
    
    // C. Actually change the screen in React
    setView(newView);
  };

  const [mousePos, setMousePos] = useState({ x: 500, y: 0 });

  const handleMouseMove = (e) => {
    setMousePos({ x: e.pageX, y: e.pageY });
  };

  const dynamicBgStyle = {
    minHeight: "100vh",
    backgroundColor: "#030712",
    backgroundImage: `
      radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(14, 165, 233, 0.12), rgba(3, 7, 18, 0) 80%),
      radial-gradient(1000px 400px at top center, rgba(14, 165, 233, 0.15) 0%, rgba(3, 7, 18, 0) 100%)
    `,
    backgroundRepeat: "no-repeat",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "white"
  };

  const isMobile = useIsMobile();




  // ── Admin Dashboard View ───────────────────────────────────────────────────
  if (view === "admin") {
    return (
      <div onMouseMove={handleMouseMove} style={dynamicBgStyle}>
        <style>{cssAnims}</style>
        
        {/* 🚀 Pass the setView function down as a prop! */}
        <AdminDashboard onBackToDemo={() => navigateTo("demo")} />
      </div>
    );
  }

  // ── B2B Developer Portal & API Docs View ───────────────────────────────────
  // 📻 NEW: Combined Portal and Docs into one zone so you can toggle between them!
  if (view === "portal" || view === "docs") {
    return (
      <div onMouseMove={handleMouseMove} style={dynamicBgStyle}>
        <style>{cssAnims}</style>
        
      
        {/* Render either the Portal or the Docs based on state */}
        {view === "portal" ? <ClientDashboard 
        onOpenDocs={() => navigateTo("docs")} 
        onClosePortal={() => navigateTo("demo")}
        /> : <ApiDocs onCloseDocs={() => navigateTo("portal")} />}
        
      </div>
    );
  }

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (submittedData) {
    return (
      <div onMouseMove={handleMouseMove} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24, ...dynamicBgStyle }}>
        <style>{cssAnims}</style>
        <div style={{ maxWidth: 520, width: "100%", animation: "fadeUp 0.5s ease forwards" }}>
          <div className="glow-card" style={glassCard}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 52, marginBottom: 12, animation: "pop 0.4s 0.2s ease both", textShadow: "0 0 30px rgba(34,197,94,0.6)" }}>✅</div>
              <h2 style={{ color: "white", fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>Request Submitted</h2>
              <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>We'll get back to you at <span style={{ color: "#0ea5e9", textShadow: "0 0 10px rgba(14,165,233,0.4)" }}>{submittedData.form.email}</span></p>
            </div>
            <button onClick={() => setSubmittedData(null)} className="glow-btn" style={primaryBtn}>Submit Another Request</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Layout (Demo Client) ──────────────────────────────────────────────
  return (
    <div onMouseMove={handleMouseMove} style={dynamicBgStyle}>
      <style>{cssAnims}</style>

      <Hero onAdminClick={() => navigateTo("admin")} onPortalClick={() => navigateTo("portal")} />
      {/* 🚀 NEW: Dynamic Flexbox that stacks on mobile! */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "40px" : "24px", /* Adds more breathing room between them on mobile */
        maxWidth: 1100,
        margin: "0 auto",
        padding: isMobile ? "0 16px 40px" : "0 24px 60px"
      }}>
        {/* We wrap them in flex: 1 so they take up equal space side-by-side on desktop */}
        <div style={{ flex: 1 }}>
          <InfoPanel fullAddress={fullAddress} />
        </div>
        <div style={{ flex: 1 }}>
          <LocationForm onAddressChange={(newAddress) => setFullAddress(newAddress)} onSuccess={(data) => setSubmittedData(data)} />
        </div>
      </div>
      <div style={footer}>
        <p style={{ margin: 0, color: "#475569", fontSize: 12 }}>© 2026 VillageAPI. India’s Location Intelligence Platform. @sraTechLabs</p>
      </div>
    </div>
  );
}

// ── Shared Layout Styles ──────────────────────────────────────────────────────

const glassCard = { background: "rgba(15,23,42,0.7)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "36px", backdropFilter: "blur(12px)" };
const primaryBtn = { width: "100%", padding: "13px 20px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)", color: "white", border: "none", cursor: "pointer", letterSpacing: "0.02em" };
const footer = { textAlign: "center", padding: "20px", borderTop: "1px solid rgba(255,255,255,0.05)" };

const cssAnims = `
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  
  .glow-input { transition: all 0.3s ease !important; }
  .glow-input:focus, textarea:focus {
    border-color: #0ea5e9 !important;
    box-shadow: 0 0 25px rgba(14, 165, 233, 0.3), inset 0 0 10px rgba(14, 165, 233, 0.1) !important;
    background: rgba(15, 23, 42, 0.95) !important;
  }

  .glow-btn { transition: all 0.3s ease !important; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); }
  .glow-btn:hover {
    filter: brightness(1.15);
    box-shadow: 0 0 30px rgba(14, 165, 233, 0.6) !important;
    transform: translateY(-2px);
  }

  .glow-card { transition: all 0.3s ease !important; }
  .glow-card:hover {
    border-color: rgba(14, 165, 233, 0.4) !important;
    box-shadow: 0 10px 40px rgba(14, 165, 233, 0.15) !important;
    transform: translateY(-2px);
  }
`;