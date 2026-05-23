import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Database, Activity, Clock, LayoutDashboard, Key, Settings, Search, MoreVertical, Edit2, Trash2, MapPin, Filter, Download, AlertTriangle, Shield, HardDrive, LogOut} from 'lucide-react';

import { useIsMobile } from './useWindowSize';



export default function AdminDashboard({ onBackToDemo }) {

  const [updateEmail, setUpdateEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [adminToken, setAdminToken] = useState(localStorage.getItem("villageAdminToken"));
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState("Overview");
  const [openDropdownId, setOpenDropdownId] = useState(null);
  
  const [clients, setClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);

  const [liveVillages, setLiveVillages] = useState([]);
  const [villageSearch, setVillageSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAddVillageModalOpen, setIsAddVillageModalOpen] = useState(false);

  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [subDistrictsList, setSubDistrictsList] = useState([]);

  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [selectedStateName, setSelectedStateName] = useState("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [selectedSubDistrictName, setSelectedSubDistrictName] = useState("");

  const [modalStateCode, setModalStateCode] = useState("");
  const [modalDistrictsList, setModalDistrictsList] = useState([]);
  const [modalDistrictCode, setModalDistrictCode] = useState("");
  const [modalSubDistrictsList, setModalSubDistrictsList] = useState([]);
  const [modalSubDistrictId, setModalSubDistrictId] = useState("");
  const [modalVillageName, setModalVillageName] = useState("");
  const [modalVillageCode, setModalVillageCode] = useState("");

  const [apiLogs, setApiLogs] = useState([]);
  const [chartAnalytics, setChartAnalytics] = useState([]);
  const [overviewStats, setOverviewStats] = useState({ totalVillages: 642810, todaysRequests: 0, avgLatency: 0 });
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  
  const [logStatusFilter, setLogStatusFilter] = useState("");
  const [logEndpointFilter, setLogEndpointFilter] = useState("");
  const [logSearchQuery, setLogSearchQuery] = useState("");

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [globalRateLimit, setGlobalRateLimit] = useState(5000);


  const [freeLimit, setFreeLimit] = useState(5000);
  const [premiumLimit, setPremiumLimit] = useState(50000);
  const [proLimit, setProLimit] = useState(300000);
  const [unlimitedLimit, setUnlimitedLimit] = useState(1000000);


  // 🚀 THE REAL SALES LEADS STATE
  const [leadsData, setLeadsData] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  // 🚀 FETCH LEADS FROM POSTGRESQL
  useEffect(() => {
    if (activeTab === "Sales Leads" && adminToken) {
      const fetchLeads = async () => {
        setIsLoadingLeads(true);
        try {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/leads`, {
            headers: { "Authorization": `Bearer ${adminToken}` }
          });
          const result = await res.json();
          if (result.success) {
            setLeadsData(result.data);
          }
        } catch (err) {
          console.error("Failed to connect to Sales Leads database.", err);
        } finally {
          setIsLoadingLeads(false);
        }
      };
      fetchLeads();
    }
  }, [activeTab, adminToken]);

  // 🚀 UPDATE LEAD STATUS IN POSTGRESQL
  const handleStatusChange = async (id, newStatus) => {
    // 1. Optimistic UI Update (Instantly changes the color on screen so it feels blazing fast)
    setLeadsData(prev => prev.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));

    // 2. Actually save the new status to the backend
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/leads/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
         alert("Database Error: Failed to save status update.");
      }
    } catch (error) {
       alert("Network Error: Could not reach the server to save status.");
    }
  };

  



 useEffect(() => {
    const closeMenu = () => setOpenDropdownId(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
    const fetchLiveClients = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/clients/`);
        const result = await response.json();
        if (response.ok) setClients(result.data); 
      } catch (error) { console.error("Fetch error:", error); } 
      finally { setIsLoadingClients(false); }
    };
    fetchLiveClients();
  }, []);

  // 🌍 1. Fetch the entire nested Geographic Structure from our new Admin endpoint
  useEffect(() => {
    const fetchGeoTree = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/states`, { 
          headers: { "Authorization": `Bearer ${adminToken}` } 
        });
        const result = await res.json();
        if (result.success) setStatesList(result.data);
      } catch (err) { console.error("Failed to load geographic structure layout."); }
    };
    if (adminToken) fetchGeoTree();
  }, [adminToken]);

  // 🗺️ 2. Cascade Districts locally from memory when State selection updates (No extra network calls!)
  useEffect(() => {
    if (!selectedStateCode) { setDistrictsList([]); setSelectedDistrictCode(""); setSelectedDistrictName(""); return; }
    const activeState = statesList.find(s => String(s.state_code) === String(selectedStateCode));
    if (activeState && activeState.districts) {
      setDistrictsList(activeState.districts);
    } else {
      setDistrictsList([]);
    }
    setSelectedDistrictCode(""); setSelectedDistrictName("");
  }, [selectedStateCode, statesList]);

  // 📍 3. Cascade Sub-Districts locally from memory when District updates
  useEffect(() => {
    if (!selectedDistrictCode) { setSubDistrictsList([]); setSelectedSubDistrictName(""); return; }
    const activeDistrict = districtsList.find(d => String(d.district_code) === String(selectedDistrictCode));
    if (activeDistrict && activeDistrict.subdistricts) {
      setSubDistrictsList(activeDistrict.subdistricts);
    } else {
      setSubDistrictsList([]);
    }
    setSelectedSubDistrictName("");
  }, [selectedDistrictCode, districtsList]);

  // 🏪 4. Handle Cascading logic inside the "Add Location" modal
  useEffect(() => {
    if (!modalStateCode) { setModalDistrictsList([]); setModalDistrictCode(""); return; }
    const activeState = statesList.find(s => String(s.state_code) === String(modalStateCode));
    setModalDistrictsList(activeState ? activeState.districts || [] : []);
    setModalDistrictCode("");
  }, [modalStateCode, statesList]);

  useEffect(() => {
    if (!modalDistrictCode) { setModalSubDistrictsList([]); setModalSubDistrictId(""); return; }
    const activeDistrict = modalDistrictsList.find(d => String(d.district_code) === String(modalDistrictCode));
    setModalSubDistrictsList(activeDistrict ? activeDistrict.subsubdistricts || activeDistrict.subdistricts || [] : []);
    setModalSubDistrictId("");
  }, [modalDistrictCode, modalDistrictsList]);

  // 📊 5. Fetch Live Admin Traffic Logs (FIXED: Calls setApiLogs instead of setLogs)
  useEffect(() => {
    if (activeTab === "API Logs" && adminToken) {
      const fetchLogs = async () => {
        try {
          setIsLoadingLogs(true);
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/logs`, {
            headers: { "Authorization": `Bearer ${adminToken}` }
          });
          const result = await res.json();
          if (result.success) setApiLogs(result.data);
        } catch (err) {
          console.error("Error connecting to log server:", err);
        } finally {
          setIsLoadingLogs(false);
        }
      };
      fetchLogs();
    }
  }, [activeTab, adminToken]);


  // 📊 Fetch Live Chart Traffic Analytics over the last 30 days
  useEffect(() => {
    const fetchLiveChart = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/analytics/chart`, {
          headers: { "Authorization": `Bearer ${adminToken}` }
        });
        const result = await res.json();
        if (result.success) setChartAnalytics(result.data);
      } catch (err) {
        console.error("Failed to connect to analytics chart engine:", err);
      }
    };
    if (activeTab === "Overview" && adminToken) fetchLiveChart();
  }, [activeTab, adminToken]);

  useEffect(() => {
    const fetchOverviewStats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/analytics/overview`, {
          headers: { "Authorization": `Bearer ${adminToken}` }
        });
        const result = await res.json();
        if (result.success) setOverviewStats(result.data);
      } catch (err) {
        console.error("Failed to connect to overview statistics container:", err);
      }
    };
    if (activeTab === "Overview" && adminToken) fetchOverviewStats();
  }, [activeTab, adminToken]);


  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/settings`, { headers: { "Authorization": `Bearer ${adminToken}` } });
        const result = await res.json();
        if (result.success) {
          setMaintenanceMode(result.data.maintenance_mode);
          setFreeLimit(result.data.free_limit || 5000);
          setPremiumLimit(result.data.premium_limit || 50000);
          setProLimit(result.data.pro_limit || 300000);
          setUnlimitedLimit(result.data.unlimited_limit || 1000000);
        }
      } catch (err) { console.error("Failed to fetch platform settings."); }
    };
    if (activeTab === "Settings" && adminToken) fetchSettings();
  }, [activeTab, adminToken]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem("villageAdminToken", data.token);
        setAdminToken(data.token);
      } else {
        setLoginError("Invalid credentials.");
      }
    } catch (err) {
      setLoginError("Network Error. Is the backend running?");
    }
  };

  const handleAdminLogout = () => {
    // 1. Remove the token to lock the door
    localStorage.removeItem("villageAdminToken");
    setAdminToken(null);
    
    // 2. Wipe the input fields clean for the next person!
    setAdminEmail("");
    setAdminPassword("");
    setLoginError("");
  };


  const handleUpdateCredentials = async () => {
    if (!currentPassword) return alert("You must enter your current password to make changes.");
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/credentials`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}` 
        },
        body: JSON.stringify({ newEmail: updateEmail, currentPassword, newPassword })
      });
      
      const data = await res.json();
      if (data.success) {
        alert("Success! Please log in again with your new credentials.");
        handleAdminLogout(); // Kick them out so they test the new login!
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Network error.");
    }
  };


  const handleLiveVillageSearch = async (e) => {
    e.preventDefault();
    if (villageSearch.trim().length < 2) {
      alert("Please enter at least 2 characters to search your database.");
      return;
    }
    
    // Find the correct subdistrictId from your loaded list matching the selection name
    const matchedSubDistrict = subDistrictsList.find(s => s.subdistrict_name === selectedSubDistrictName);
    const subId = matchedSubDistrict ? matchedSubDistrict.id : "";

    setIsSearching(true);
    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/api/admin/villages/search?query=${encodeURIComponent(villageSearch)}`;
      if (subId) url += `&subdistrictId=${subId}`;

      const res = await fetch(url, { 
        headers: { "Authorization": `Bearer ${adminToken}` }  
      });
      const result = await res.json();
      
      if (res.ok && result.success) { 
        setLiveVillages(result.data); 
      } else { 
        alert("Search failed: " + result.message); 
      }
    } catch (err) { 
      alert("Network Error: Could not connect to Admin API database engine."); 
    } finally { 
      setIsSearching(false); }
  };

  const handleAddVillageSubmit = async (e) => {
    e.preventDefault();
    if (!modalSubDistrictId) {
      alert("Please select a Sub-District first.");
      return;
    }
    
    const newVillage = {
      village_name: modalVillageName,
      subdistrict_id: modalSubDistrictId,
      village_code: modalVillageCode || null
    };

    try {
      // 🚀 FIXED: Pointing to your dedicated secure Admin endpoint!
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/villages`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}` // Using your secure logged-in session token!
        },
        body: JSON.stringify(newVillage)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert("Success! Village permanently added to PostgreSQL.");
        setIsAddVillageModalOpen(false);
        setModalVillageName(""); setModalVillageCode(""); setModalSubDistrictId(""); setModalDistrictCode(""); setModalStateCode("");
        setVillageSearch(""); setLiveVillages([]); 
      } else {
        alert("Database Error: " + (result.message || "Could not write record."));
      }
    } catch (error) { 
      alert("Network Error while writing to database."); 
    }
  };


  const handleDeleteVillage = async (villageId, villageName) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete the village "${villageName}"?`)) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/villages/${villageId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${adminToken}`
        }
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert("Location completely wiped from database.");
        // Instantly remove it from the displayed list so you don't have to reload!
        setLiveVillages(liveVillages.filter(v => v.value !== villageId));
      } else {
        alert("Error: " + (result.message || "Could not delete location."));
      }
    } catch (error) {
      alert("Network Error: Connection to database engine lost.");
    }
  };


  const handleEditVillage = async (villageId, currentName) => {
    const newName = window.prompt("Update Village Name:", currentName);
    if (newName === null) return; // Administrator hit cancel
    if (newName.trim() === "") return alert("Village name cannot be empty!");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/villages/${villageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({ village_name: newName.trim() })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert("Location updated inside database!");
        
        // 🚀 Dynamic State Mapping: Instantly redraw row with the new name text!
        setLiveVillages(liveVillages.map(v => 
          v.value === villageId 
            ? { ...v, hierarchy: { ...v.hierarchy, village: newName.trim() } } 
            : v
        ));
      } else {
        alert("Error: " + (result.message || "Could not modify record."));
      }
    } catch (error) {
      alert("Network Error: Engine communication failed.");
    }
  };

  const handleSaveConfig = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
        body: JSON.stringify({ 
          maintenance_mode: maintenanceMode, 
          free_limit: freeLimit,
          premium_limit: premiumLimit,
          pro_limit: proLimit,
          unlimited_limit: unlimitedLimit
        })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        alert("✅ " + result.message);
      } else {
        alert("Error: " + result.message);
      }
    } catch (error) { alert("Network Error saving configuration."); }
  };


  const handlePurgeLogs = async () => {
    // 🚨 Strict confirmation check before destroying data
    const confirmPurge = window.confirm(
      "🚨 DANGER ZONE: You are about to permanently delete all API request logs older than 30 days. This action CANNOT be undone. Are you absolutely sure?"
    );

    if (!confirmPurge) return; // Admin chickened out (which is good!)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/logs/purge`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${adminToken}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`Storage cleared! 🗑️ ${result.deletedCount} old logs were permanently wiped from PostgreSQL.`);
        // Optionally, you can trigger a re-fetch of your overview stats here if you want them to update instantly
      } else {
        alert("Error: " + (result.message || "Failed to purge database."));
      }
    } catch (error) {
      alert("Network Error: Could not communicate with the database engine.");
    }
  };

 
  const handleViewDetails = (client) => { setSelectedClient(client); setOpenDropdownId(null); };
  
  const handleResetKey = async (clientId) => {
    if (!window.confirm("Are you sure? The old API key will instantly stop working!")) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/clients/${clientId}/reset`, { method: "PUT" });
      const result = await response.json();
      if (response.ok) {
        setClients(clients.map(c => c.id === clientId ? { ...c, apiKey: result.data.apiKey } : c));
        setOpenDropdownId(null);
      }
    } catch (error) { alert("Network Error"); }
  };

  const handleRevokeAccess = async (clientId) => {
    if (!window.confirm("Are you sure you want to suspend this client's API access?")) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/clients/${clientId}/revoke`, { method: "PUT" });
      if (response.ok) {
        setClients(clients.map(c => c.id === clientId ? { ...c, status: "Suspended" } : c));
        setOpenDropdownId(null);
      }
    } catch (error) { alert("Network Error"); }
  };

  const handleReactivateAccess = async (clientId) => {
    if (!window.confirm("Restore this client's API access?")) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/clients/${clientId}/reactivate`, { method: "PUT" });
      if (response.ok) {
        setClients(clients.map(c => c.id === clientId ? { ...c, status: "Active" } : c));
        setOpenDropdownId(null);
      }
    } catch (error) { alert("Network Error"); }
  };

  
  // ────────────────────────────────────────────────────────────────────────
  // 🚀 COMPILER-SAFE SEARCH FILTER LOGIC (Bypasses any optional chaining bugs)
  // ────────────────────────────────────────────────────────────────────────
  const filteredLogs = apiLogs.filter(log => {
    // 1. Filter by Status Code
    const matchStatus = logStatusFilter === "" || 
      (logStatusFilter === "200" && log.status_code >= 200 && log.status_code < 300) ||
      (logStatusFilter === "400" && log.status_code >= 400 && log.status_code < 500) ||
      (logStatusFilter === "500" && log.status_code >= 500);

    // 2. Filter by Endpoint
    const matchEndpoint = logEndpointFilter === "" || (log.endpoint && log.endpoint.includes(logEndpointFilter));

    // 3. Filter by Search Query
    const searchStr = logSearchQuery.toLowerCase().trim();
    if (searchStr === "") return matchStatus && matchEndpoint;

    const companyName = log.Client?.company?.toLowerCase() || "";
    
    // 🚀 FIXED: Reads safely from the direct api_keys lookup block
    const primaryApiKey = log.api_keys?.api_key?.toLowerCase() || "";
    
    const fallbackLabel = log.Client ? "" : "internal system super admin session token";

    const matchSearch = 
      companyName.includes(searchStr) || 
      primaryApiKey.includes(searchStr) ||
      fallbackLabel.includes(searchStr);

    return matchStatus && matchEndpoint && matchSearch;
  });



  const exportLogsCSV = () => {
    if (filteredLogs.length === 0) return alert("No data to export!");
    let csvContent = "Timestamp,Status,Method,Endpoint,Response Time,Client,API Key\n";
    filteredLogs.forEach(log => {
      const time = new Date(log.created_at).toLocaleString('en-IN', { hour12: false });
      const client = log.Client?.company || "Internal System";
      const key = log.Client ? "B2B Authorized Key" : "Admin JWT Session";
      csvContent += `"${time}",${log.status_code},${log.method},"${log.endpoint}",${log.response_time}ms,"${client}","${key}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `village_api_logs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportLogsJSON = () => {
    if (filteredLogs.length === 0) return alert("No data to export!");
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `village_api_logs_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sidebarItems = [
    { icon: <LayoutDashboard size={18} />, label: "Overview" },
    { icon: <Users size={18} />, label: "B2B Users" },
    { icon: <Database size={18} />, label: "Village Master" },
    { icon: <Key size={18} />, label: "API Logs" },

    { icon: <Activity size={18} />, label: "Sales Leads" },
    { icon: <Settings size={18} />, label: "Settings" },
  ];

  const isMobile = useIsMobile();

 if (!adminToken) {
    return (
      <div style={{ display: "flex", height: "100vh", backgroundColor: "#030712", alignItems: "center", justifyContent: "center", backgroundImage: "radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.15), transparent 50%)" }}>
        <form onSubmit={handleAdminLogin} style={{ background: "rgba(15,23,42,0.8)", backdropFilter: "blur(20px)", padding: "48px", borderRadius: "24px", width: "100%", maxWidth: "420px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
          
          <div style={{ background: "rgba(16,185,129,0.1)", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", border: "1px solid rgba(16,185,129,0.2)" }}>
            <Shield size={40} color="#10b981" />
          </div>
          
          <h1 style={{ color: "white", margin: "0 0 8px", fontSize: 28, fontWeight: 800 }}>Admin Access</h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 32px" }}>Enter your system credentials to continue.</p>

          <div style={{ marginBottom: 16, textAlign: "left" }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 8, paddingLeft: 4 }}>SYSTEM EMAIL</label>
            <input 
              type="email" 
              placeholder="admin@villageapi.com" 
              value={adminEmail} 
              onChange={e => setAdminEmail(e.target.value)} 
              style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none", boxSizing: "border-box", fontSize: 15, transition: "border-color 0.2s" }} 
              onFocus={(e) => e.target.style.borderColor = "#10b981"} 
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"} 
            />
          </div>

          <div style={{ marginBottom: 24, textAlign: "left" }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 8, paddingLeft: 4 }}>MASTER PASSWORD</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={adminPassword} 
              onChange={e => setAdminPassword(e.target.value)} 
              style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none", boxSizing: "border-box", fontSize: 15, transition: "border-color 0.2s" }} 
              onFocus={(e) => e.target.style.borderColor = "#10b981"} 
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"} 
            />
          </div>

          {loginError && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "12px", borderRadius: "8px", marginBottom: "24px", fontSize: 13, fontWeight: 600 }}>
              {loginError}
            </div>
          )}

          <button 
            type="submit" 
            style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "transform 0.1s, boxShadow 0.2s" }} 
            onMouseOver={(e) => e.target.style.boxShadow = "0 10px 15px -3px rgba(16,185,129,0.3)"} 
            onMouseOut={(e) => e.target.style.boxShadow = "none"} 
            onMouseDown={(e) => e.target.style.transform = "scale(0.98)"} 
            onMouseUp={(e) => e.target.style.transform = "scale(1)"}
          >
            Authenticate
          </button>
        </form>
      </div>
    );
  }

  return (

    <div style={{ display: "flex",flexDirection: isMobile ? "column" : "row", width: "100%", zIndex: 10 }}>
      <style>{adminCss}</style>
      
      {/* ── SIDEBAR ── */}
        <div style={{ 
          width: isMobile ? "100%" : "260px", 
          borderBottom: isMobile ? "1px solid rgba(255,255,255,0.05)" : "none",
          borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.05)", 
          padding: "24px", 
          background: "rgba(15,23,42,0.25)", 
          backdropFilter: "blur(16px)", 
          height: isMobile ? "auto" : "100vh", 
          position: isMobile ? "relative" : "sticky", 
          top: 0, 
          display: "flex", 
          flexDirection: isMobile ? "row" : "column", /* Stacks nav elements horizontally if screen is small */
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          zIndex: 50,
          boxSizing: "border-box"
        }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isMobile ? 0 : 40 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🌍</div>
          <div><p style={{ margin: 0, color: "white", fontWeight: 700, fontSize: 16 }}>VillageAPI</p><p style={{ margin: 0, color: "#0ea5e9", fontSize: 11, fontWeight: 600 }}>ADMIN PORTAL</p></div>
        </div>
        
        <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 8, flexWrap: "wrap" }}>
          {sidebarItems.map((item, i) => {
            const isActive = activeTab === item.label;
            return (
              <div key={i} onClick={() => setActiveTab(item.label)} style={{ display: "flex", alignItems: "center", gap: 12, padding: isMobile ? "8px 12px" : "12px 16px", borderRadius: 12, cursor: "pointer", background: isActive ? "rgba(14,165,233,0.15)" : "transparent", color: isActive ? "#0ea5e9" : "#64748b", border: isActive ? "1px solid rgba(14,165,233,0.3)" : "1px solid transparent", transition: "all 0.2s" }}>
                {item.icon} {!isMobile && <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 500 }}>{item.label}</span>}
              </div>
            );
          })}
        </div>

        {/* 🚀 NEW: LOGOUT BUTTON PUSHED TO THE BOTTOM */}
        <div style={{ marginTop: isMobile ? 0 : "auto", paddingTop: isMobile ? 0 : "24px", borderTop: isMobile ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
          <button 
            onClick={handleAdminLogout} 
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "10px 16px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.2)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
          >
            <LogOut size={14} /> {isMobile ? "Sign Out" : "Secure Sign Out"}
          </button>
        </div>

      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxHeight: isMobile ? "none" : "100vh" }}>

        {/* 🚀 NEW HEADER: Stops the overlap */}
        <div style={{ padding: isMobile ? "16px" : "16px 40px", display: "flex", justifyContent: "flex-end", background: "rgba(15,23,42,0.25)", backdropFilter:"blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.05)", zIndex: 40, flexShrink: 0 }}>
          <button 
            onClick={onBackToDemo}
            className="header-glow-btn"
          >
            ← Back to Demo
          </button>
        </div>

        
        {/* 🚀 SCROLLABLE CONTENT AREA */}
        <div style={{ flex: 1, padding: isMobile ? "16px" : "40px", overflowY: isMobile ? "visible" : "auto" }}>
        
        {activeTab === "Overview" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards", marginTop: "16px" }}>
             <h1 style={{ color: "white", fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>Platform Overview</h1>
             <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 32px" }}>Monitor your location intelligence API performance.</p>
             <div style={{ 
               display: "grid", 
               gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))", 
               gap: isMobile ? "16px" : "20px", 
               marginBottom: 32 
             }}>
               {[
                 { title: "Total Villages", value: overviewStats.totalVillages.toLocaleString(), trend: "Live Tracking", icon: <Database size={20} color="#0ea5e9" /> },
                 { title: "Active B2B Users", value: clients.length.toString(), trend: "Live from Postgres", icon: <Users size={20} color="#10b981" /> },
                 { title: "Today's Requests", value: overviewStats.todaysRequests.toLocaleString(), trend: "Real-time Traffic", icon: <Activity size={20} color="#f59e0b" /> },
                 { title: "Avg Latency", value: `${overviewStats.avgLatency}ms`, trend: "Optimal (SLA <100ms)", icon: <Clock size={20} color="#8b5cf6" /> },
               ].map((stat, i) => (
                 <div key={i} className="glow-card" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "20px" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}><p style={{ margin: 0, color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>{stat.title}</p><div style={{ padding: 8, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>{stat.icon}</div></div>
                   <h3 style={{ margin: "0 0 8px", color: "white", fontSize: 32, fontWeight: 800 }}>{stat.value}</h3><p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>{stat.trend}</p>
                 </div>
               ))}
             </div>
             <div className="glow-card" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "24px" }}>
              <h3 style={{ margin: "0 0 24px", color: "white", fontSize: 16, fontWeight: 700 }}>API Requests (Last 30 Days)</h3>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartAnalytics} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: '12px', color: 'white' }} itemStyle={{ color: '#0ea5e9', fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="requests" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#030712', stroke: '#0ea5e9', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#0ea5e9', stroke: 'rgba(14,165,233,0.3)', strokeWidth: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "B2B Users" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards", marginTop: "16px" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
               <div><h1 style={{ color: "white", fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>B2B Users</h1><p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Manage clients, API keys, and track usage limits.</p></div>
             </div>
             <div className="glow-card" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, paddingBottom: "100px" }}>
               <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                 <thead>
                   <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                     <th style={{ padding: "16px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>COMPANY</th>
                     <th style={{ padding: "16px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>PLAN</th>
                     <th style={{ padding: "16px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>USAGE</th>
                     <th style={{ padding: "16px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>STATUS</th>
                     <th style={{ padding: "16px 24px" }}></th>
                   </tr>
                 </thead>
                 <tbody>
                   {clients.map((user) => (
                     <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                       <td style={{ padding: "16px 24px" }}><p style={{ margin: 0, color: "white", fontSize: 14, fontWeight: 600 }}>{user.company}</p><p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>{user.email}</p></td>
                       <td style={{ padding: "16px 24px" }}><span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.05)", color: "#cbd5e1" }}>{user.plan}</span></td>
                       <td style={{ padding: "16px 24px" }}><p style={{ margin: 0, color: "white", fontSize: 13, fontWeight: 500 }}>{user.usage?.toLocaleString() || 0} / {user.custom_daily_limit ? user.custom_daily_limit.toLocaleString() : "Plan Default"}</p></td>
                       <td style={{ padding: "16px 24px" }}>
                         {user.status === "Active" ? (
                           <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(16,185,129,0.1)", color: "#10b981" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />Active</span>
                         ) : (
                           <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />Suspended</span>
                         )}
                       </td>
                       <td style={{ padding: "16px 24px", textAlign: "right", position: "relative" }}>
                         <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === user.id ? null : user.id); }} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer" }}><MoreVertical size={18} /></button>
                         {openDropdownId === user.id && (
                           <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: "30px", right: "40px", width: "160px", background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px", zIndex: 50, boxShadow: "0 10px 25px rgba(0,0,0,0.5)", textAlign: "left" }}>
                             <button onClick={() => handleViewDetails(user)} style={{ width: "100%", padding: "8px 12px", background: "transparent", border: "none", color: "white", fontSize: 13, textAlign: "left", cursor: "pointer", borderRadius: 4 }}>View Details</button>
                             <button onClick={() => handleResetKey(user.id)} style={{ width: "100%", padding: "8px 12px", background: "transparent", border: "none", color: "white", fontSize: 13, textAlign: "left", cursor: "pointer", borderRadius: 4 }}>Reset Key</button>
                             <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "4px 0" }}></div>
                             {user.status === "Active" ? (
                               <button onClick={() => handleRevokeAccess(user.id)} style={{ width: "100%", padding: "8px 12px", background: "transparent", border: "none", color: "#ef4444", fontSize: 13, textAlign: "left", cursor: "pointer", borderRadius: 4 }}>Suspend</button>
                             ) : (
                               <button onClick={() => handleReactivateAccess(user.id)} style={{ width: "100%", padding: "8px 12px", background: "transparent", border: "none", color: "#10b981", fontSize: 13, textAlign: "left", cursor: "pointer", borderRadius: 4 }}>Reactivate</button>
                             )}
                           </div>
                         )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === "Village Master" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards", marginTop: "16px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
              <div>
                <h1 style={{ color: "white", fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>Village Master</h1>
                <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Search and edit live geographical data from PostgreSQL.</p>
              </div>
              
              <button 
                onClick={() => setIsAddVillageModalOpen(true)}
                className="glow-btn" 
                style={{ padding: "10px 20px", background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", }}
              >
                <MapPin size={16} /> Add Location
              </button>
            </div>

            <div className="glow-card" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "24px", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Filter size={16} color="#0ea5e9" />
                <h3 style={{ margin: 0, color: "white", fontSize: 14, fontWeight: 700 }}>Data Filters</h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                
                <select 
                  value={selectedStateCode} 
                  onChange={(e) => {
                    setSelectedStateCode(e.target.value);
                    setSelectedStateName(e.target.options[e.target.selectedIndex].text === "All States" ? "" : e.target.options[e.target.selectedIndex].text);
                  }}
                  style={{ background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "8px", outline: "none", fontSize: "14px", cursor: "pointer", colorScheme: "dark" }}
                >
                  <option value="" style={{ background: "#0f172a", color: "white" }}>All States</option>
                  {statesList.map(state => <option key={state.id} value={state.state_code} style={{ background: "#0f172a", color: "white" }}>{state.state_name}</option>)}
                </select>

                <select 
                  value={selectedDistrictCode} 
                  onChange={(e) => {
                    setSelectedDistrictCode(e.target.value);
                    setSelectedDistrictName(e.target.options[e.target.selectedIndex].text === "All Districts" ? "" : e.target.options[e.target.selectedIndex].text);
                  }}
                  disabled={!selectedStateCode}
                  style={{ background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: selectedStateCode ? "white" : "#475569", padding: "12px", borderRadius: "8px", outline: "none", fontSize: "14px", cursor: selectedStateCode ? "pointer" : "not-allowed", colorScheme: "dark" }}
                >
                  <option value="" style={{ background: "#0f172a", color: "white" }}>All Districts</option>
                  {districtsList.map(dist => <option key={dist.id} value={dist.district_code} style={{ background: "#0f172a", color: "white" }}>{dist.district_name}</option>)}
                </select>

                <select 
                  value={selectedSubDistrictName} 
                  onChange={(e) => setSelectedSubDistrictName(e.target.value)}
                  disabled={!selectedDistrictCode}
                  style={{ background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: selectedDistrictCode ? "white" : "#475569", padding: "12px", borderRadius: "8px", outline: "none", fontSize: "14px", cursor: selectedDistrictCode ? "pointer" : "not-allowed", colorScheme: "dark" }}
                >
                  <option value="" style={{ background: "#0f172a", color: "white" }}>All Sub-Districts</option>
                  {subDistrictsList.map(sub => <option key={sub.id} value={sub.subdistrict_name} style={{ background: "#0f172a", color: "white" }}>{sub.subdistrict_name}</option>)}
                </select>

              </div>

              <form onSubmit={handleLiveVillageSearch} style={{ display: "flex", gap: "16px" }}>
                 <div style={{ flex: 1, display: "flex", alignItems: "center", background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "12px 16px" }}>
                    <Search size={18} color="#64748b" style={{ marginRight: 12 }} />
                    <input 
                      type="text" 
                      placeholder="Type a village name (e.g. 'Mandhal'). Filters above will apply automatically!" 
                      value={villageSearch}
                      onChange={(e) => setVillageSearch(e.target.value)}
                      style={{ background: "transparent", border: "none", color: "white", outline: "none", fontSize: 14, width: "100%" }} 
                    />
                  </div>
                  <button type="submit" style={{ padding: "0 24px", background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.3)", borderRadius: "8px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                    {isSearching ? "Searching..." : "Search DB"}
                  </button>
              </form>
            </div>

            <div className="glow-card" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, overflow: "hidden", minHeight: "300px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <th style={{ padding: "16px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>DB ID</th>
                    <th style={{ padding: "16px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>VILLAGE NAME</th>
                    <th style={{ padding: "16px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>SUB-DISTRICT</th>
                    <th style={{ padding: "16px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>DISTRICT & STATE</th>
                    <th style={{ padding: "16px 24px", textAlign: "right" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {liveVillages.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>Select your filters, enter a village name, and click 'Search DB'.</td></tr>
                  ) : (
                    liveVillages.map((village, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "16px 24px", color: "#64748b", fontFamily: "monospace", fontSize: 13 }}>{village.value}</td>
                        <td style={{ padding: "16px 24px", color: "white", fontWeight: 600, fontSize: 14 }}>{village.hierarchy.village}</td>
                        <td style={{ padding: "16px 24px", color: "#cbd5e1", fontSize: 13 }}>{village.hierarchy.subDistrict}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <p style={{ margin: 0, color: "white", fontSize: 13 }}>{village.hierarchy.district}</p>
                          <p style={{ margin: 0, color: "#64748b", fontSize: 11 }}>{village.hierarchy.state}</p>
                        </td>
                        <td style={{ padding: "16px 24px", textAlign: "right" }}>
                           <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                             <button onClick={() => handleEditVillage(village.value, village.hierarchy.village)} style={{ background: "rgba(14,165,233,0.1)", border: "none", padding: "8px", borderRadius: "6px", color: "#0ea5e9", cursor: "pointer" }}><Edit2 size={16} /></button>
                             <button onClick={() => handleDeleteVillage(village.value, village.hierarchy.village)} style={{ background: "rgba(239,68,68,0.1)", border: "none", padding: "8px", borderRadius: "6px", color: "#ef4444", cursor: "pointer" }}><Trash2 size={16} /></button>
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 🚀 LIVE API LOGS TAB */}
        {activeTab === "API Logs" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards", marginTop: "16px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
              <div>
                <h1 style={{ color: "white", fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>API Logs</h1>
                <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Monitor real-time API traffic, debug errors, and track endpoint performance.</p>
              </div>
              
              <div style={{ display: "flex", gap: "12px", }}>
                <button 
                  onClick={exportLogsCSV}
                  className="glow-btn" 
                  style={{ padding: "10px 16px", background: "rgba(15,23,42,0.8)", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Download size={16}/> Export CSV
                </button>
                <button 
                  onClick={exportLogsJSON}
                  className="glow-btn" 
                  style={{ padding: "10px 16px", background: "rgba(15,23,42,0.8)", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Database size={16}/> Export JSON
                </button>
              </div>
            </div>

            <div className="glow-card" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "20px", marginBottom: "24px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <select 
                  value={logStatusFilter}
                  onChange={(e) => setLogStatusFilter(e.target.value)}
                  style={{ flex: 1, minWidth: "150px", background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "10px", borderRadius: "8px", outline: "none", fontSize: "13px", colorScheme: "dark" }}
                >
                  <option value="" style={{ background: "#0f172a", color: "white" }}>All Status Codes</option>
                  <option value="200" style={{ background: "#0f172a", color: "white" }}>2xx Success</option>
                  <option value="400" style={{ background: "#0f172a", color: "white" }}>4xx Client Errors</option>
                  <option value="500" style={{ background: "#0f172a", color: "white" }}>5xx Server Errors</option>
                </select>

                {/* 🚀 FIXED: Value maps to actual DB path keyword now */}
                {/* 🚀 FIXED: All Endpoints Added for Keyword Filtering */}
                <select 
                  value={logEndpointFilter}
                  onChange={(e) => setLogEndpointFilter(e.target.value)}
                  style={{ flex: 1, minWidth: "150px", background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "10px", borderRadius: "8px", outline: "none", fontSize: "13px", colorScheme: "dark" }}
                >
                  <option value="" style={{ background: "#0f172a", color: "white" }}>All Endpoints</option>
                  <option value="states" style={{ background: "#0f172a", color: "white" }}>GET /states</option>
                  <option value="districts" style={{ background: "#0f172a", color: "white" }}>GET /districts</option>
                  <option value="subdistricts" style={{ background: "#0f172a", color: "white" }}>GET /subdistricts</option>
                  <option value="villages" style={{ background: "#0f172a", color: "white" }}>GET /villages</option>
                  <option value="search" style={{ background: "#0f172a", color: "white" }}>GET /search</option>
                  <option value="autocomplete" style={{ background: "#0f172a", color: "white" }}>GET /autocomplete</option>
                </select>

                <div style={{ flex: 2, minWidth: "200px", display: "flex", alignItems: "center", background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px" }}>
                  <Search size={16} color="#64748b" style={{ marginRight: 10 }} />
                  <input 
                    type="text" 
                    placeholder="Search by Business Name " 
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    style={{ background: "transparent", border: "none", color: "white", outline: "none", fontSize: 13, width: "100%" }} 
                  />
                </div>
            </div>

            <div className="glow-card" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <th style={{ padding: "16px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>TIMESTAMP</th>
                    <th style={{ padding: "16px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>STATUS</th>
                    <th style={{ padding: "16px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>ENDPOINT</th>
                    <th style={{ padding: "16px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>RESPONSE TIME</th>
                    <th style={{ padding: "16px 24px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>CLIENT & API KEY</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingLogs ? (
                     <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading live traffic logs...</td></tr>
                  ) : filteredLogs.length === 0 ? (
                     <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No API logs match your filters.</td></tr>
                  ) : (
                    filteredLogs.map((log, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "16px 24px", color: "#94a3b8", fontSize: 13 }}>
                          {new Date(log.created_at).toLocaleString('en-IN', { hour12: false })}
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{ 
                            padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700",
                            background: log.status_code >= 200 && log.status_code < 300 ? "rgba(16,185,129,0.1)" : log.status_code === 429 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                            color: log.status_code >= 200 && log.status_code < 300 ? "#10b981" : log.status_code === 429 ? "#f59e0b" : "#ef4444"
                          }}>
                            {log.status_code}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px", color: "white", fontFamily: "monospace", fontSize: 13 }}>
                          <span style={{ color: "#64748b", marginRight: "8px" }}>{log.method}</span>
                          {log.endpoint}
                        </td>
                        <td style={{ padding: "16px 24px", color: "#cbd5e1", fontSize: 13 }}>{log.response_time}ms</td>
                        <td style={{ padding: "16px 24px" }}>
                          {log.Client ? (
                            <>
                              <p style={{ margin: 0, color: "white", fontSize: 13, fontWeight: 600 }}>{log.Client.company}</p>
                              <code style={{ color: "#0ea5e9", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.5px" }}>
                                {/* 🚀 FIXED: Uses safe checking before slicing strings to stop any WSD crashes! */}
                                {log.api_keys?.api_key 
                                  ? `${log.api_keys.api_key.substring(0, 8)}...${log.api_keys.api_key.substring(log.api_keys.api_key.length - 4)}`
                                  : "ak_••••••••"}
                              </code>
                            </>
                          ) : (
                            <>
                              <p style={{ margin: 0, color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>⚙️ Internal System</p>
                              <code style={{ color: "#64748b", fontSize: 11 }}>Super Admin Token (JWT)</code>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {activeTab === "Sales Leads" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards", marginTop: "16px" }}>
             <h1 style={{ color: "white", fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>Inbound Leads</h1>
             <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 32px" }}>Manage contact requests and enterprise API inquiries from the landing page.</p>

             <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
               {isLoadingLeads ? (
                 <div className="glow-card" style={{ background: "rgba(15,23,42,0.6)", borderRadius: 16, padding: "40px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                   <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading inbound leads from database...</p>
                 </div>
               ) : leadsData.length === 0 ? (
                 <div className="glow-card" style={{ background: "rgba(15,23,42,0.6)", borderRadius: 16, padding: "40px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                   <p style={{ color: "#94a3b8", fontSize: 14 }}>No leads found. When a user fills out the contact form on your landing page, it will appear here instantly.</p>
                 </div>
               ) : (
                 leadsData.map((lead) => (
                   <div key={lead.id} className={`glow-card-lead ${lead.status}`} style={{ background: "rgba(15,23,42,0.6)", borderRadius: 16, padding: "24px" }}>

                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                       <div>
                         <h3 style={{ margin: "0 0 4px", color: "white", fontSize: 18, fontWeight: 700 }}>{lead.full_name}</h3>
                         <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>📧 {lead.email} &nbsp; | &nbsp; 📞 {lead.phone || "N/A"}</p>
                       </div>

                       <select
                         value={lead.status}
                         onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                         style={{ background: "rgba(3,7,18,0.5)", padding: "8px 12px", borderRadius: "8px", color: lead.status === "NEW" ? "#10b981" : lead.status === "CONTACTED" ? "#f59e0b" : "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", outline: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, colorScheme: "dark" }}
                       >
                         <option value="NEW" style={{ background: "#0f172a", color: "white" }}>🟢 NEW</option>
                         <option value="CONTACTED" style={{ background: "#0f172a", color: "white" }}>🟡 CONTACTED</option>
                         <option value="CLOSED" style={{ background: "#0f172a", color: "white" }}>⚪ CLOSED</option>
                       </select>
                     </div>

                     <div style={{ background: "rgba(3,7,18,0.5)", padding: "12px", borderRadius: "8px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                       <p style={{ margin: 0, color: "#cbd5e1", fontSize: 12, fontWeight: 600 }}> ADDRESS:</p>
                       <p style={{ margin: "4px 0 0", color: "white", fontSize: 14 }}>
                         {lead.village}, {lead.subdistrict}, {lead.district}, {lead.state}
                       </p>
                     </div>

                     <p style={{ margin: 0, color: "#cbd5e1", fontSize: 14, lineHeight: 1.6, background: "rgba(3,7,18,0.5)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                       "{lead.message}"
                     </p>

                     <div style={{ marginTop: "16px", textAlign: "right" }}>
                        <p style={{ margin: 0, color: "#64748b", fontSize: 11 }}>Submitted: {new Date(lead.created_at).toLocaleString()}</p>
                     </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        )}
        


        {/* 🚀 NEW: SETTINGS TAB */}
        {activeTab === "Settings" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards", marginTop: "16px" }}>
            <div style={{ marginBottom: 40 }}>
              <h1 style={{ color: "white", fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>Platform Settings</h1>
              <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Configure global limits, manage admin access, and control platform health.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              
              {/* PLATFORM CONFIGURATION */}
              <div className="glow-card" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 16 }}>
                  <Settings size={20} color="#0ea5e9" />
                  <h2 style={{ color: "white", fontSize: 16, fontWeight: 700, margin: 0 }}>General Configuration</h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                      <div>
                        <span style={{ color: "white", fontWeight: 600, fontSize: 14, display: "block" }}>Maintenance Mode</span>
                        <span style={{ color: "#64748b", fontSize: 12 }}>Temporarily blocks all external API requests with a 503 status.</span>
                      </div>
                      <div 
                        onClick={() => setMaintenanceMode(!maintenanceMode)}
                        style={{ width: 44, height: 24, background: maintenanceMode ? "#ef4444" : "rgba(255,255,255,0.1)", borderRadius: 999, position: "relative", transition: "0.2s" }}
                      >
                        <div style={{ width: 20, height: 20, background: "white", borderRadius: "50%", position: "absolute", top: 2, left: maintenanceMode ? 22 : 2, transition: "0.2s" }} />
                      </div>
                    </label>
                  </div>

                  {/* --- ENTERPRISE PLAN MANAGEMENT --- */}
                  <div style={{ marginTop: 8, padding: "20px", background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <h3 style={{ color: "white", fontSize: 14, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#0ea5e9" }}>✦</span> API Rate Limits (Per Day)
                    </h3>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {/* Free Tier */}
                      <div>
                        <label style={{ display: "block", color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>Free Tier</label>
                        <input 
                          type="number" 
                          value={freeLimit}
                          onChange={(e) => setFreeLimit(e.target.value)}
                          style={{ width: "100%", boxSizing: "border-box", padding: "10px", borderRadius: "6px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none" }} 
                        />
                      </div>

                      {/* Premium Tier */}
                      <div>
                        <label style={{ display: "block", color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>Premium Tier</label>
                        <input 
                          type="number" 
                          value={premiumLimit}
                          onChange={(e) => setPremiumLimit(e.target.value)}
                          style={{ width: "100%", boxSizing: "border-box", padding: "10px", borderRadius: "6px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(16,185,129,0.3)", color: "white", outline: "none" }} 
                        />
                      </div>

                      {/* Pro Tier */}
                      <div>
                        <label style={{ display: "block", color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>Pro Tier</label>
                        <input 
                          type="number" 
                          value={proLimit}
                          onChange={(e) => setProLimit(e.target.value)}
                          style={{ width: "100%", boxSizing: "border-box", padding: "10px", borderRadius: "6px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(14,165,233,0.3)", color: "white", outline: "none" }} 
                        />
                      </div>

                      {/* Unlimited Tier */}
                      <div>
                        <label style={{ display: "block", color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>Unlimited Tier</label>
                        <input 
                          type="number" 
                          value={unlimitedLimit}
                          onChange={(e) => setUnlimitedLimit(e.target.value)}
                          style={{ width: "100%", boxSizing: "border-box", padding: "10px", borderRadius: "6px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(139,92,246,0.3)", color: "white", outline: "none" }} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button onClick={handleSaveConfig} style={{ padding: "12px", background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
                    Save Configuration
                  </button>
                </div>
              </div>

              {/* SECURITY & ADMIN ACCESS */}
              <div className="glow-card" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 16 }}>
                  <Shield size={20} color="#10b981" />
                  <h2 style={{ color: "white", fontSize: 16, fontWeight: 700, margin: 0 }}>Admin Security</h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", margin: "0 0 8px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>NEW ADMIN EMAIL (Optional)</label>
                    <input type="email" value={updateEmail} onChange={e => setUpdateEmail(e.target.value)} placeholder="new.admin@company.com" style={{ width: "100%", boxSizing: "border-box", padding: "12px", borderRadius: "8px", background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", margin: "0 0 8px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>NEW PASSWORD (Optional)</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" style={{ width: "100%", boxSizing: "border-box", padding: "12px", borderRadius: "8px", background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none" }} />
                  </div>
                  <div style={{ marginTop: 8, paddingTop: 16, borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
                    <label style={{ display: "block", margin: "0 0 8px", color: "#ef4444", fontSize: 12, fontWeight: 600 }}>CURRENT PASSWORD (Required to save)</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Verify your identity" style={{ width: "100%", boxSizing: "border-box", padding: "12px", borderRadius: "8px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", color: "white", outline: "none" }} />
                  </div>
                  <button onClick={handleUpdateCredentials} style={{ padding: "12px", background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
                    Update Admin Credentials
                  </button>
                </div>
              </div>

              {/* DATA MANAGEMENT (DANGER ZONE) */}
              <div className="glow-card" style={{ gridColumn: "1 / -1", background: "rgba(15,23,42,0.6)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 16, padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 16 }}>
                  <AlertTriangle size={20} color="#ef4444" />
                  <h2 style={{ color: "#ef4444", fontSize: 16, fontWeight: 700, margin: 0 }}>Danger Zone</h2>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(239,68,68,0.05)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.1)" }}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <div style={{ background: "rgba(239,68,68,0.1)", padding: "12px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", height: "fit-content" }}>
                      <HardDrive size={24} color="#ef4444" />
                    </div>
                    <div>
                      <h3 style={{ color: "white", fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>Purge Old API Logs</h3>
                      <p style={{ color: "#94a3b8", fontSize: 13, margin: 0, maxWidth: "500px" }}>Permanently delete API request logs older than 30 days to free up PostgreSQL storage space. This action cannot be undone.</p>
                    </div>
                  </div>
                  <button onClick={handlePurgeLogs} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", padding: "10px 20px", borderRadius: "8px", color: "#ef4444", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                    Purge Database
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

       </div> {/* Close Main Content Flex Column */}


      </div>

      {isAddVillageModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(3,7,18,0.8)", backdropFilter: "blur(5px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="glow-card" style={{ background: "rgba(15,23,42,0.95)", padding: "32px", borderRadius: "16px", width: "500px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h2 style={{ margin: "0 0 24px", color: "white", fontSize: 20, fontWeight: 700 }}>Add New Location</h2>
            
            <form onSubmit={handleAddVillageSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", margin: "0 0 8px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>STATE</label>
                  <select required value={modalStateCode} onChange={(e) => setModalStateCode(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none", fontSize: 13, colorScheme: "dark" }}>
                    <option value="" style={{ background: "#0f172a", color: "white" }}>Select State</option>
                    {statesList.map(s => <option key={s.id} value={s.state_code} style={{ background: "#0f172a", color: "white" }}>{s.state_name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", margin: "0 0 8px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>DISTRICT</label>
                  <select required disabled={!modalStateCode} value={modalDistrictCode} onChange={(e) => setModalDistrictCode(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: modalStateCode ? "white" : "#475569", outline: "none", fontSize: 13, colorScheme: "dark" }}>
                    <option value="" style={{ background: "#0f172a", color: "white" }}>Select District</option>
                    {modalDistrictsList.map(d => <option key={d.id} value={d.district_code} style={{ background: "#0f172a", color: "white" }}>{d.district_name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", margin: "0 0 8px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>SUB-DISTRICT</label>
                <select required disabled={!modalDistrictCode} value={modalSubDistrictId} onChange={(e) => setModalSubDistrictId(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: modalDistrictCode ? "white" : "#475569", outline: "none", fontSize: 13, colorScheme: "dark" }}>
                  <option value="" style={{ background: "#0f172a", color: "white" }}>Select Sub-District</option>
                  {modalSubDistrictsList.map(sd => <option key={sd.id} value={sd.id} style={{ background: "#0f172a", color: "white" }}>{sd.subdistrict_name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", margin: "0 0 8px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>NEW VILLAGE NAME</label>
                <input required type="text" value={modalVillageName} onChange={(e) => setModalVillageName(e.target.value)} placeholder="e.g. Mandhal" style={{ width: "100%", boxSizing: "border-box", padding: "12px", borderRadius: "8px", background: "rgba(3,7,18,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none" }} />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button type="button" onClick={() => setIsAddVillageModalOpen(false)} style={{ flex: 1, padding: "12px", background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>Save to Database</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedClient && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(3,7,18,0.8)", backdropFilter: "blur(5px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="glow-card" style={{ background: "rgba(15,23,42,0.95)", padding: "32px", borderRadius: "16px", width: "450px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h2 style={{ margin: "0 0 24px", color: "white", fontSize: 20, fontWeight: 700 }}>Client Profile</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div><p style={{ margin: "0 0 4px", color: "#64748b", fontSize: 12 }}>COMPANY</p><p style={{ margin: 0, color: "white", fontSize: 16, fontWeight: 600 }}>{selectedClient.company}</p></div>
              <div><p style={{ margin: "0 0 4px", color: "#64748b", fontSize: 12 }}>EMAIL</p><p style={{ margin: 0, color: "white", fontSize: 14 }}>{selectedClient.email}</p></div>
              <div><p style={{ margin: "0 0 4px", color: "#64748b", fontSize: 12 }}>CLIENT ID (UUID)</p><code style={{ color: "#94a3b8", fontSize: 12 }}>{selectedClient.id}</code></div>
            </div>
            <button onClick={() => setSelectedClient(null)} style={{ marginTop: "32px", width: "100%", padding: "12px", background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>Close Profile</button>
          </div>
        </div>
      )}
    </div>
  );
}

const adminCss = `
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); border-radius: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.5); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(14, 165, 233, 0.5); }

 /* 🚀 BASE STATE: The top and bottom borders */
  .glow-card-lead {
     border: 1px solid rgba(255,255,255,0.05) !important;
     box-shadow: 0 4px 6px rgba(0,0,0,0.2) !important;
     transform: translateY(0px) !important; 
     transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  /* 🚀 STATUS ACCENTS: The thick left and right borders based on status! */
  .glow-card-lead.NEW {
     border-left: 4px solid #10b981 !important;
     border-right: 4px solid #10b981 !important;
  }
  .glow-card-lead.CONTACTED {
     border-left: 4px solid #f59e0b !important;
     border-right: 4px solid #f59e0b !important;
  }
  .glow-card-lead.CLOSED {
     border-left: 4px solid #64748b !important;
     border-right: 4px solid #64748b !important;
  }

  /* 🚀 HOVER STATES: The card floats up and the top/bottom borders light up to match */
  .glow-card-lead.NEW:hover { 
      border-color: #10b981 !important; 
      box-shadow: 0 12px 25px rgba(16,185,129,0.2) !important; 
      transform: translateY(-4px) !important; 
  }
  .glow-card-lead.CONTACTED:hover { 
      border-color: #f59e0b !important; 
      box-shadow: 0 12px 25px rgba(245,158,11,0.2) !important; 
      transform: translateY(-4px) !important; 
  }
  .glow-card-lead.CLOSED:hover { 
      border-color: #64748b !important; 
      box-shadow: 0 12px 25px rgba(100,116,139,0.3) !important; 
      transform: translateY(-4px) !important; 
  }

  /* 🚀 NEW: Header Glowing Button Effect */
  .header-glow-btn {
    padding: 8px 16px;
    background: rgba(14, 165, 233, 0.05); /* Very faint blue tint */
    border: 1px solid rgba(14, 165, 233, 0.4);
    color: #0ea5e9;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 10px rgba(14, 165, 233, 0.1);
  }

  .header-glow-btn:hover {
    background: rgba(14, 165, 233, 0.15);
    border-color: #0ea5e9;
    color: white; /* Text lights up white on hover! */
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.5), inset 0 0 10px rgba(14, 165, 233, 0.2);
    transform: translateY(-2px); /* Physical lift motion */
  }

  .header-glow-btn:active {
    transform: translateY(0px); /* Pushes down when clicked */
  }
`;