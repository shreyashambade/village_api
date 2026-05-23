import { useState, useEffect } from 'react';
import { Play, Code, CheckCircle, AlertCircle, Terminal, ChevronRight, LayoutList, Database } from 'lucide-react';

import { useIsMobile } from './useWindowSize';

const API_ENDPOINTS = [
  { id: "states", name: "Get All States", method: "GET", path: "/api/v1/states", params: [] },
  { id: "districts", name: "Get Districts", method: "GET", path: "/api/v1/states/:state_code/districts", params: [{ key: "state_code", type: "path", placeholder: "e.g., 27" }] },
  { id: "subdistricts", name: "Get Sub-Districts", method: "GET", path: "/api/v1/districts/:district_code/subdistricts", params: [{ key: "district_code", type: "path", placeholder: "e.g., 499" }] },
  { id: "villages", name: "Get Villages", method: "GET", path: "/api/v1/subdistricts/:subdistrict_code/villages", params: [{ key: "subdistrict_code", type: "path", placeholder: "e.g., 4236" }, { key: "page", type: "query", placeholder: "e.g., 1 (Optional)" }, { key: "limit", type: "query", placeholder: "e.g., 10 (Optional)" }] },
  { id: "search", name: "Search Villages", method: "GET", path: "/api/v1/search", params: [{ key: "q", type: "query", placeholder: "e.g., Shirur" }, { key: "state", type: "query", placeholder: "Optional State" }] },
  { id: "autocomplete", name: "Autocomplete", method: "GET", path: "/api/v1/autocomplete", params: [{ key: "q", type: "query", placeholder: "e.g., Shi" }] }
];

// 🎨 UPGRADED: Thunder Client color palette (Green keys, Blue values)
const syntaxHighlight = (json) => {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, undefined, 2);
  }
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let color = '#94a3b8'; // Default punctuation (Light Gray)
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        color = '#4ade80'; // Keys: Thunder Client Green
        return `<span style="color: ${color};">${match.replace(/:$/, '')}</span><span style="color: #94a3b8;">:</span>`;
      } else {
        color = '#38bdf8'; // Strings: Thunder Client Light Blue
      }
    } else if (/true|false|null/.test(match)) {
      color = '#38bdf8'; // Booleans/Null: Light Blue
    } else {
      color = '#38bdf8'; // Numbers: Light Blue
    }
    return `<span style="color: ${color};">${match}</span>`;
  });
};

export default function ApiDocs({ onCloseDocs }) {
  const [apiKey, setApiKey] = useState("");
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);
  
  const [activeEndpointIdx, setActiveEndpointIdx] = useState(0);
  const [queryParams, setQueryParams] = useState({});

  const activeEndpoint = API_ENDPOINTS[activeEndpointIdx];

  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchSavedKey = async () => {
      const savedEmail = localStorage.getItem("villageApiUserEmail");
      if (savedEmail) {
        try {
          // 🚀 Fetch from the updated dashboard endpoint that knows about the new ApiKey table
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/clients/me/dashboard?email=${encodeURIComponent(savedEmail)}`);
          const result = await res.json();
          
          if (result.success && result.data.keys.length > 0) {
            // 🔍 Automatically find the first 'Active' key and insert it
            const activeKey = result.data.keys.find(k => k.status === 'Active');
            if (activeKey && activeKey.fullKey) {
              setApiKey(activeKey.fullKey);
            }
          }
        } catch (err) {
          console.error("Could not fetch key.");
        }
      }
    };
    fetchSavedKey();
  }, []);

  const handleParamChange = (key, value) => {
    setQueryParams(prev => ({ ...prev, [key]: value }));
  };

  const handleTestApi = async () => {
    if (!apiKey) {
      setResponse({ error: "API key is missing. Please enter your pk_live_ key." });
      setStatus(401);
      return;
    }

    setIsLoading(true);
    setResponse(null);
    setStatus(null);

    let url = `${import.meta.env.VITE_API_BASE_URL}${activeEndpoint.path}`;
    let queryParts = [];

    for (const p of activeEndpoint.params) {
      const val = queryParams[p.key];
      
      if (p.type === 'path') {
        if (!val) {
          setResponse({ error: `Missing required path parameter: ${p.key}` });
          setStatus(400);
          setIsLoading(false);
          return;
        }
        url = url.replace(`:${p.key}`, encodeURIComponent(val));
      } else if (val) {
        queryParts.push(`${p.key}=${encodeURIComponent(val)}`);
      }
    }

    if (queryParts.length > 0) {
      url += `?${queryParts.join('&')}`;
    }

    try {
      const res = await fetch(url, {
        method: activeEndpoint.method,
        headers: { "X-API-Key": apiKey }
      });
      
      const data = await res.json();
      setStatus(res.status);
      setResponse({ _request_url: url, ...data });
    } catch (err) {
      setStatus(500);
      setResponse({ error: "Failed to connect to the server. Is Node.js running?" });
    } finally {
      setIsLoading(false);
    }
  };


  // 💎 MATCHING DASHBOARD STYLES
  const CustomStyles = () => (
    <style>{`
      /* 🚀 Header Glowing Button Effects */
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

  return (
   <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", animation: "fadeUp 0.5s ease forwards" }}>
      <CustomStyles />
      
      {/* 🚀 FIXED STICKY HEADER */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, padding: isMobile ? "16px" : "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(15, 23, 42, 0.25)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        
        {/* Title Area */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ padding: 12, background: "rgba(14,165,233,0.1)", borderRadius: 12, border: "1px solid rgba(14,165,233,0.2)" }}>
            <LayoutList size={28} color="#0ea5e9" />
          </div>
          <div>
            <h1 style={{ color: "white", fontSize: 28, fontWeight: 800, margin: "0 0 4px" }}>API Workspace</h1>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Test your live endpoints directly in the browser.</p>
          </div>
        </div>
        
        {/* Action Button Area */}
        <div>
          <button 
            onClick={onCloseDocs}
            className="header-glow-btn"
          >
            ← Back to Portal
          </button>
        </div>
      </div>

      {/* 🚀 SCROLLABLE CONTENT AREA */}
      <div style={{ flex: 1, padding: isMobile ? "16px" : "40px 24px", overflowY: "auto" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
  

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "260px 380px 1fr", gap: "24px", minHeight: "600px" }}>
        
        {/* ── COLUMN 1: SIDEBAR ── */}
        <div className="glow-card" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
            <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Collections</span>
          </div>
          <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto", flex: 1 }}>
            {API_ENDPOINTS.map((endpoint, idx) => (
              <button 
                key={endpoint.id}
                onClick={() => { setActiveEndpointIdx(idx); setResponse(null); setStatus(null); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: activeEndpointIdx === idx ? "rgba(14,165,233,0.15)" : "transparent", borderRadius: "8px", border: "none", color: activeEndpointIdx === idx ? "white" : "#94a3b8", cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: activeEndpointIdx === idx ? "#10b981" : "#64748b", fontSize: 10, fontWeight: 800 }}>{endpoint.method}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{endpoint.name}</span>
                </div>
                {activeEndpointIdx === idx && <ChevronRight size={14} color="#0ea5e9" />}
              </button>
            ))}
          </div>
        </div>

        {/* ── COLUMN 2: REQUEST BUILDER ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding:"10px" }}>
          
          <div className="glow-card" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Code size={16} color="#0ea5e9" />
              <h2 style={{ color: "white", fontSize: 14, fontWeight: 700, margin: 0 }}>Headers</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 6, padding: "8px 12px" }}>
              <span style={{ color: "#64748b", fontSize: 12, width: "80px" }}>X-API-Key</span>
              <input 
                type="text" 
                placeholder="pk_live_..." 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{ flex: 1, background: "transparent", border: "none", color: "#38bdf8", fontSize: 12, outline: "none", fontFamily: "monospace" }}
              />
            </div>
          </div>

          <div className="glow-card" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
             <h2 style={{ color: "white", fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>{activeEndpoint.name}</h2>
             
             <div style={{ display: "flex", alignItems: "center", background: "rgba(3,7,18,0.8)", padding: "10px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 24 }}>
               <span style={{ color: "#10b981", fontWeight: 800, marginRight: 12, fontSize: 12 }}>{activeEndpoint.method}</span>
               <span style={{ color: "white", fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{activeEndpoint.path}</span>
             </div>

             {activeEndpoint.params.length > 0 && (
               <div style={{ marginBottom: 24, flex: 1 }}>
                 <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Parameters</p>
                 <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                   {activeEndpoint.params.map(param => (
                     <div key={param.key} style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 6, padding: "8px 12px" }}>
                       <span style={{ color: param.type === 'path' ? "#f59e0b" : "#0ea5e9", fontFamily: "monospace", fontSize: 12, width: "120px" }}>
                         {param.type === 'path' ? `/:${param.key}` : `?${param.key}=`}
                       </span>
                       <input 
                          type="text" 
                          placeholder={param.placeholder}
                          value={queryParams[param.key] || ""}
                          onChange={(e) => handleParamChange(param.key, e.target.value)}
                          style={{ flex: 1, background: "transparent", border: "none", color: "white", outline: "none", fontSize: 13 }}
                       />
                     </div>
                   ))}
                 </div>
               </div>
             )}

             <button 
                onClick={handleTestApi} 
                disabled={isLoading}
                className="glow-btn" 
                style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px", borderRadius: 8, background: "white", color: "black", border: "none", cursor: isLoading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? "Sending..." : <><Play size={16} fill="black" /> Send Request</>}
              </button>
          </div>

        </div>

        {/* ── COLUMN 3: RESPONSE VIEWER (Restored original background!) ── */}
        <div className="glow-card" style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: isMobile ? "400px" : "auto" }}>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(3,7,18,0.5)", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Terminal size={16} color="#64748b" />
              <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em" }}>RESPONSE</span>
            </div>
            
            {status && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: status === 200 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", padding: "4px 8px", borderRadius: 4 }}>
                {status === 200 ? <CheckCircle size={14} color="#10b981" /> : <AlertCircle size={14} color="#ef4444" />}
                <span style={{ color: status === 200 ? "#10b981" : "#ef4444", fontSize: 12, fontWeight: 700 }}>
                  {status} {status === 200 ? "OK" : "Error"}
                </span>
              </div>
            )}
          </div>

          <div style={{ flex: 1, padding: "20px", background: "rgba(0,0,0,0.2)",maxHeight:"500px",overflowY:"auto", overflowX: "auto" }}>
            {response ? (
              <pre 
                style={{ margin: 0, fontFamily: "monospace", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(response) }}
              />
            ) : (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#475569", gap: 12 }}>
                <Database size={40} color="#1e293b" />
                <span style={{ fontSize: 13 }}>Hit Send Request to view JSON data.</span>
              </div>
            )}
          </div>
          
        </div>

      </div>
    </div>
    </div> 
  </div> 
  );
}