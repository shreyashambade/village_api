import { useEffect, useState, useRef } from "react";
import Select, { components } from "react-select";

const API_BASE = "https://village-location-api.onrender.com/api/v1";
const HEADERS = { "X-API-Key": "ak_fe091cc73306163f81f23676a7062f6e" };

const DropdownIndicator = (props) => (
  <components.DropdownIndicator {...props}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
  </components.DropdownIndicator>
);

const LoadingIndicator = () => (
  <div style={{ paddingRight: 12 }}>
    <div style={{ width: 16, height: 16, border: "2px solid rgba(14,165,233,0.2)", borderTopColor: "#0ea5e9", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
  </div>
);

// ── NEON GLOW FOR DROPDOWNS ───────────────────────────────────────────────────
const rsStyles = {
  control: (p, s) => ({ ...p, background: "rgba(15,23,42,0.6)", borderRadius: 12, minHeight: 52, padding: "0 4px", transition: "all 0.3s", cursor: "pointer",
    border: s.isFocused ? "1.5px solid #0ea5e9" : "1.5px solid rgba(255,255,255,0.1)", 
    // This adds the neon glow when you click the dropdown!
    boxShadow: s.isFocused ? "0 0 25px rgba(14,165,233,0.3), inset 0 0 10px rgba(14,165,233,0.1)" : "none", 
    "&:hover": { borderColor: "#0ea5e9" } 
  }),
  menu: (p) => ({ ...p, background: "rgba(15,23,42,0.95)", border: "1px solid rgba(14,165,233,0.3)", borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 20px rgba(14,165,233,0.1)", zIndex: 999, backdropFilter: "blur(10px)" }),
  option: (p, s) => ({ ...p, background: s.isFocused ? "rgba(14,165,233,0.15)" : "transparent", color: s.isFocused ? "white" : "#94a3b8", padding: "11px 16px", fontSize: 14, cursor: "pointer", transition: "all 0.15s" }),
  singleValue: (p) => ({ ...p, color: "white", fontSize: 15, fontWeight: 500 }),
  input: (p) => ({ ...p, color: "white", fontSize: 15 }),
  placeholder: (p) => ({ ...p, color: "#64748b", fontSize: 14 }),
  indicatorSeparator: () => ({ display: "none" }),
};

function FField({ label, error, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.04em" }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>{hint}</p>}
      {error && <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>{error}</p>}
    </div>
  );
}

export default function LocationForm({ onAddressChange, onSuccess }) {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [showVillageDropdown, setShowVillageDropdown] = useState(false);
  const villageInputRef = useRef(null);

  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedSubdistrict, setSelectedSubdistrict] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [villageSearch, setVillageSearch] = useState("");

  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubdistricts, setLoadingSubdistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [loadingAutocomplete, setLoadingAutocomplete] = useState(false);

  const [form, setForm] = useState({ fullName: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // APIs
  useEffect(() => { fetch(`${API_BASE}/states`, { headers: HEADERS }).then(r => r.json()).then(d => setStates(d.data || [])).catch(console.error); }, []);
  useEffect(() => { if (!selectedState) return; setLoadingDistricts(true); fetch(`${API_BASE}/states/${selectedState.value}/districts`, { headers: HEADERS }).then(r => r.json()).then(d => { setDistricts(d.data || []); setSelectedDistrict(null); setSelectedSubdistrict(null); setSelectedVillage(null); setVillageSearch(""); setSubdistricts([]); setVillages([]); }).catch(console.error).finally(() => setLoadingDistricts(false)); }, [selectedState]);
  useEffect(() => { if (!selectedDistrict) return; setLoadingSubdistricts(true); fetch(`${API_BASE}/districts/${selectedDistrict.value}/subdistricts`, { headers: HEADERS }).then(r => r.json()).then(d => { setSubdistricts(d.data || []); setSelectedSubdistrict(null); setSelectedVillage(null); setVillageSearch(""); setVillages([]); }).catch(console.error).finally(() => setLoadingSubdistricts(false)); }, [selectedDistrict]);
  useEffect(() => { if (!selectedSubdistrict) return; setLoadingVillages(true); fetch(`${API_BASE}/subdistricts/${selectedSubdistrict.value}/villages?page=1&limit=200`, { headers: HEADERS }).then(r => r.json()).then(d => { setVillages(d.data || []); setSelectedVillage(null); setVillageSearch(""); }).catch(console.error).finally(() => setLoadingVillages(false)); }, [selectedSubdistrict]);
  
  useEffect(() => {
    if (!villageSearch || villageSearch.trim().length < 2) { setAutocompleteResults([]); setShowVillageDropdown(false); return; }
    if (selectedVillage && villageSearch === selectedVillage.label) return;
    const t = setTimeout(() => {
      setLoadingAutocomplete(true);
      fetch(`${API_BASE}/autocomplete?q=${encodeURIComponent(villageSearch.trim())}&hierarchyLevel=village`, { headers: HEADERS })
        .then(r => r.json()).then(d => { setAutocompleteResults(d.data || []); setShowVillageDropdown(true); }).catch(console.error).finally(() => setLoadingAutocomplete(false));
    }, 280);
    return () => clearTimeout(t);
  }, [villageSearch]);

  useEffect(() => {
    const h = (e) => { if (villageInputRef.current && !villageInputRef.current.contains(e.target)) setShowVillageDropdown(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const filteredVillages = villages.filter(v => v.village_name?.toLowerCase().includes(villageSearch.toLowerCase()) || v.label?.toLowerCase().includes(villageSearch.toLowerCase()));
  const computedAddress = selectedVillage ? selectedVillage.fullAddress : [villageSearch, selectedSubdistrict?.label, selectedDistrict?.label, selectedState?.label, "India"].filter(Boolean).join(", ");

  useEffect(() => { onAddressChange(computedAddress); }, [computedAddress, onAddressChange]);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required";
    if (!form.phone.trim() || form.phone.length < 10) e.phone = "Valid phone required";
    if (!selectedState) e.state = "Required";
    if (!selectedVillage && !villageSearch.trim()) e.village = "Required";
    if (!form.message.trim()) e.message = "Required";
    return e;
  };

  // 🚀 FIXED: Added 'async' so we can await the backend!
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    
    setSubmitting(true);

    try {
      // 🚀 THE REAL BACKEND CALL
      const response = await fetch("http://localhost:3000/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.fullName,
          email: form.email,
          phone: form.phone,
          state: selectedState?.label || "",
          district: selectedDistrict?.label || "",
          subdistrict: selectedSubdistrict?.label || "",
          village: selectedVillage?.label || villageSearch || "",
          message: form.message
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Only show the green success screen IF the database actually saved it!
        onSuccess({ form, fullAddress: computedAddress }); 
      } else {
        alert("Server Error: " + (result.message || "Failed to submit."));
      }
    } catch (error) {
      console.error(error);
      alert("Network Error: Could not reach the backend server.");
    } finally {
      setSubmitting(false);
    }
  };

  const formPanel = { padding: "32px 0 32px 32px" };
  const stepBar = { display: "flex", alignItems: "center", gap: 4, marginBottom: 24, flexWrap: "wrap" };
  const fi = { width: "100%", padding: "13px 16px", borderRadius: 12, fontSize: 14, background: "rgba(15,23,42,0.6)", color: "white", border: "1.5px solid rgba(255,255,255,0.1)", outline: "none", boxSizing: "border-box" };
  const fErr = { border: "1.5px solid #ef4444" };
  const primaryBtn = { width: "100%", padding: "13px 20px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)", color: "white", border: "none", cursor: "pointer", letterSpacing: "0.02em" };
  const ghostBtn = { padding: "13px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, background: "transparent", color: "#94a3b8", border: "1.5px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "all 0.2s" };

  return (
    <div style={formPanel}>
      <div style={stepBar}>
        {["Personal Info", "Location", "Message"].map((label, i) => {
          const n = i + 1; const active = step === n; const done = step > n;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => setStep(n)}>
              {/* NEON STEP CIRCLES */}
              <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: done ? "#10b981" : active ? "#0ea5e9" : "rgba(255,255,255,0.05)", color: "white", transition: "all 0.3s", boxShadow: active ? "0 0 15px rgba(14,165,233,0.5)" : "none" }}>{done ? "✓" : n}</div>
              <span style={{ fontSize: 12, color: active ? "white" : "#64748b", fontWeight: active ? 600 : 400, transition: "color 0.3s" }}>{label}</span>
              {i < 2 && <div style={{ width: 24, height: 1, background: done ? "#10b981" : "rgba(255,255,255,0.1)", margin: "0 4px", transition: "background 0.3s", boxShadow: done ? "0 0 8px #10b981" : "none" }} />}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* ADDED className="glow-input" to inputs and "glow-btn" to buttons */}
        <div style={{ display: step === 1 ? "flex" : "none", flexDirection: "column", gap: 14, animation: "fadeUp 0.3s ease" }}>
          <FField label="Full Name" error={errors.fullName}><input name="fullName" value={form.fullName} onChange={e => { setForm({ ...form, fullName: e.target.value }); setErrors({ ...errors, fullName: "" }); }} placeholder="John Doe" className="glow-input" style={{ ...fi, ...(errors.fullName ? fErr : {}) }} /></FField>
          <FField label="Business Email" error={errors.email}><input name="email" type="email" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: "" }); }} placeholder="john@company.com" className="glow-input" style={{ ...fi, ...(errors.email ? fErr : {}) }} /></FField>
          <FField label="Phone Number" error={errors.phone}><input name="phone" type="tel" value={form.phone} onChange={e => { setForm({ ...form, phone: e.target.value }); setErrors({ ...errors, phone: "" }); }} placeholder="+91 9XXXXXXXXX" className="glow-input" style={{ ...fi, ...(errors.phone ? fErr : {}) }} /></FField>
          <button type="button" onClick={() => { const e = {}; if (!form.fullName.trim()) e.fullName = "Required"; if (!form.email.includes("@")) e.email = "Valid email required"; if (form.phone.length < 10) e.phone = "Valid phone required"; if (Object.keys(e).length > 0) { setErrors(e); return; } setStep(2); }} className="glow-btn" style={primaryBtn}>Continue →</button>
        </div>

        <div style={{ display: step === 2 ? "flex" : "none", flexDirection: "column", gap: 14, animation: "fadeUp 0.3s ease" }}>
          <FField label="State" error={errors.state}><Select options={states.map(s => ({ value: s.state_code, label: s.state_name }))} value={selectedState} onChange={v => { setSelectedState(v); setErrors({ ...errors, state: "" }); }} placeholder="Search state..." isClearable isSearchable components={{ DropdownIndicator }} styles={rsStyles} /></FField>
          <FField label="District"><Select options={districts.map(d => ({ value: d.district_code, label: d.district_name }))} value={selectedDistrict} onChange={setSelectedDistrict} placeholder={loadingDistricts ? "Loading..." : "Search district..."} isClearable isSearchable isDisabled={!selectedState || loadingDistricts} isLoading={loadingDistricts} components={{ DropdownIndicator, LoadingIndicator }} styles={rsStyles} /></FField>
          <FField label="Sub-District / Block"><Select options={subdistricts.map(s => ({ value: s.subdistrict_code, label: s.subdistrict_name }))} value={selectedSubdistrict} onChange={setSelectedSubdistrict} placeholder={loadingSubdistricts ? "Loading..." : "Search sub-district..."} isClearable isSearchable isDisabled={!selectedDistrict || loadingSubdistricts} isLoading={loadingSubdistricts} components={{ DropdownIndicator, LoadingIndicator }} styles={rsStyles} /></FField>
          <FField label="Village / Area" error={errors.village} hint={selectedSubdistrict ? "Type to filter or search all India" : "Search any village across India"}>
            <div ref={villageInputRef} style={{ position: "relative" }}>
              <input value={villageSearch} onChange={e => { setVillageSearch(e.target.value); setSelectedVillage(null); setErrors({ ...errors, village: "" }); }} onFocus={() => (autocompleteResults.length > 0 || filteredVillages.length > 0) && setShowVillageDropdown(true)} placeholder={loadingVillages ? "Loading villages..." : "Search village or area..."} disabled={loadingVillages} className="glow-input" style={{ ...fi, paddingRight: 44, ...(errors.village ? fErr : {}), ...(selectedVillage ? { borderColor: "#10b981", boxShadow: "0 0 15px rgba(16,185,129,0.3)" } : {}) }} />
              <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>
                {loadingAutocomplete && <div style={{ width: 14, height: 14, border: "2px solid rgba(14,165,233,0.2)", borderTopColor: "#0ea5e9", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
                {selectedVillage && !loadingAutocomplete && <span style={{ color: "#10b981", fontSize: 14, textShadow: "0 0 8px rgba(16,185,129,0.5)" }}>✓</span>}
                {villageSearch && !loadingAutocomplete && <span style={{ color: "#64748b", cursor: "pointer", fontSize: 14, marginLeft: 4 }} onClick={() => { setVillageSearch(""); setSelectedVillage(null); setShowVillageDropdown(false); }}>✕</span>}
              </div>
              {showVillageDropdown && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "rgba(15,23,42,0.95)", border: "1px solid rgba(14,165,233,0.3)", borderRadius: 14, zIndex: 100, maxHeight: 240, overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 20px rgba(14,165,233,0.1)", backdropFilter: "blur(10px)" }}>
                  {(() => {
                    const list = autocompleteResults.length > 0 ? autocompleteResults : filteredVillages.slice(0, 10).map(v => ({ value: v.id, label: v.village_name || v.label, fullAddress: `${v.village_name || v.label}, ${selectedSubdistrict?.label || ""}, ${selectedDistrict?.label || ""}, ${selectedState?.label || ""}, India`, hierarchy: { subDistrict: selectedSubdistrict?.label, district: selectedDistrict?.label, state: selectedState?.label } }));
                    if (list.length === 0) return <div style={{ padding: "14px 16px", color: "#64748b", fontSize: 13 }}>No results for "{villageSearch}"</div>;
                    return list.map((v, i) => (
                      <div key={i} onClick={() => { setSelectedVillage(v); setVillageSearch(v.label); setShowVillageDropdown(false); setErrors({ ...errors, village: "" }); }} style={{ padding: "11px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(14,165,233,0.15)"; e.currentTarget.style.paddingLeft = "18px"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.paddingLeft = "14px"; }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><span style={{ fontSize: 14, marginTop: 1 }}>📍</span><div><p style={{ color: "white", fontWeight: 600, margin: 0, fontSize: 14 }}>{v.label}</p>{v.hierarchy && <p style={{ color: "#64748b", margin: 0, fontSize: 12 }}>{[v.hierarchy.subDistrict, v.hierarchy.district, v.hierarchy.state].filter(Boolean).join(" · ")}</p>}</div></div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </FField>
          <div style={{ display: "flex", gap: 10 }}><button type="button" onClick={() => setStep(1)} className="glow-btn" style={ghostBtn}>← Back</button><button type="button" onClick={() => { if (!selectedState) { setErrors({ ...errors, state: "Required" }); return; } setStep(3); }} className="glow-btn" style={{ ...primaryBtn, flex: 1 }}>Continue →</button></div>
        </div>

        <div style={{ display: step === 3 ? "flex" : "none", flexDirection: "column", gap: 14, animation: "fadeUp 0.3s ease" }}>
          <FField label="Message" error={errors.message}><textarea name="message" value={form.message} onChange={e => { setForm({ ...form, message: e.target.value }); setErrors({ ...errors, message: "" }); }} placeholder="How can we help you?" rows={5} className="glow-input" style={{ ...fi, resize: "vertical", ...(errors.message ? fErr : {}) }} /></FField>
          <div className="glow-card" style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ color: "#0ea5e9", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px", textShadow: "0 0 10px rgba(14,165,233,0.3)" }}>Submission Summary</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[["👤", form.fullName || "—"], ["📧", form.email || "—"], ["📞", form.phone || "—"], ["📍", computedAddress || "No address selected"]].map(([icon, val], i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><span style={{ fontSize: 12 }}>{icon}</span><span style={{ color: "#cbd5e1", fontSize: 12 }}>{val}</span></div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}><button type="button" onClick={() => setStep(2)} className="glow-btn" style={ghostBtn}>← Back</button><button type="submit" className="glow-btn" style={{ ...primaryBtn, flex: 1, opacity: submitting ? 0.7 : 1 }} disabled={submitting}>{submitting ? "Submitting..." : "Submit Request →"}</button></div>
        </div>
      </form>
    </div>
  );
}