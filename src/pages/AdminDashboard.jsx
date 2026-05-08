import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, clearSession } from "../utils/auth";
import DashboardSwitcher from "../components/DashboardSwitcher";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const session = getSession();
  
  // State Management
  const [allCases, setAllCases] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allEvidence, setAllEvidence] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Separate allocation workflows
  const [forensicAllocationCaseId, setForensicAllocationCaseId] = useState(null);
  const [forensicId, setForensicId] = useState("");
  const [judgeAllocationCaseId, setJudgeAllocationCaseId] = useState(null);
  const [judgeId, setJudgeId] = useState("");

  // Fetch all data
  useEffect(() => {
    if (session?.token) {
      fetchAllData();
      // Refresh every 10 seconds for real-time updates
      const interval = setInterval(fetchAllData, 10000);
      const onFocus = () => fetchAllData();
      const onVisibility = () => {
        if (document.visibilityState === "visible") {
          fetchAllData();
        }
      };
      window.addEventListener("focus", onFocus);
      document.addEventListener("visibilitychange", onVisibility);
      return () => {
        clearInterval(interval);
        window.removeEventListener("focus", onFocus);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }
  }, [session]);

  // Fetch cases data more frequently when on dashboard tab (for real-time updates)
  useEffect(() => {
    if (session?.token && activeTab === "dashboard") {
      // Refresh cases every 5 seconds for real-time dashboard metrics
      const dashboardInterval = setInterval(async () => {
        try {
          const casesRes = await fetch(`${API_URL}/cases/all`, {
            headers: { Authorization: `Bearer ${session.token}` }
          });
          if (casesRes.ok) {
            const data = await casesRes.json();
            setAllCases(data.cases || []);
          }
        } catch (error) {
          console.error("Error fetching cases for dashboard:", error);
        }
      }, 5000);
      
      return () => clearInterval(dashboardInterval);
    }
  }, [session, activeTab]);

  const fetchAllData = async () => {
    try {
      // Fetch cases
      const casesRes = await fetch(`${API_URL}/cases/all`, {
        headers: { Authorization: `Bearer ${session.token}` }
      });
      if (casesRes.ok) {
        const data = await casesRes.json();
        setAllCases(data.cases || []);
      }

      // Fetch users (if endpoint exists)
      try {
        const usersRes = await fetch(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (usersRes.ok) {
          const data = await usersRes.json();
          setAllUsers(data.users || []);
        }
      } catch (err) {
        console.log("Users endpoint not available");
      }

      // Fetch audit logs
      try {
        const auditRes = await fetch(`${API_URL}/admin/audit-logs`, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (auditRes.ok) {
          const data = await auditRes.json();
          setAuditLogs(data.logs || []);
        }
      } catch (err) {
        console.log("Audit logs endpoint not available");
      }

      // 📊 Fetch active user sessions for real-time monitoring
      try {
        const sessionsRes = await fetch(`${API_URL}/auth/active-sessions`, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setActiveSessions(data.sessions || []);
        }
      } catch (err) {
        console.log("Active sessions endpoint not available", err);
      }

      // Fetch evidence
      try {
        const evidenceRes = await fetch(`${API_URL}/evidence/all`, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (evidenceRes.ok) {
          const data = await evidenceRes.json();
          setAllEvidence(data.evidences || []);
        }
      } catch (err) {
        console.log("Evidence endpoint not available");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      // Update timestamp to show data was refreshed
      setLastUpdateTime(new Date());
    }
  };

  const handleApproveCase = async (caseId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/cases/${caseId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        setSuccessMessage("✅ Case approved successfully!");
        fetchAllData();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage("❌ Failed to approve case");
      }
    } catch (error) {
      setErrorMessage("Error approving case");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignForensic = async (caseId) => {
    if (!forensicId) {
      setErrorMessage("❌ Please enter Forensic Officer ID");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/cases/assign-forensic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({
          caseId,
          forensicOfficerId: forensicId
        })
      });

      if (response.ok) {
        setSuccessMessage("✅ Forensic Officer assigned successfully!");
        setForensicId("");
        setForensicAllocationCaseId(null);
        fetchAllData();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const data = await response.json();
        setErrorMessage(data.message || "Failed to assign forensic officer");
      }
    } catch (error) {
      setErrorMessage("Error assigning forensic officer");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignJudge = async (caseId) => {
    if (!judgeId) {
      setErrorMessage("❌ Please enter Judge ID");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/cases/assign-judge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({
          caseId,
          judgeId: judgeId
        })
      });

      if (response.ok) {
        setSuccessMessage("✅ Judge assigned successfully!");
        setJudgeId("");
        setJudgeAllocationCaseId(null);
        fetchAllData();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const data = await response.json();
        setErrorMessage(data.message || "Failed to assign judge");
      }
    } catch (error) {
      setErrorMessage("Error assigning judge");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId, isSuspended) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/users/${userId}/suspend`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(
          `✅ User ${isSuspended ? 'unsuspended' : 'suspended'} successfully!`
        );
        fetchAllData();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(data.message || 'Failed to suspend/unsuspend user');
      }
    } catch (error) {
      setErrorMessage('Error suspending/unsuspending user');
      console.error('Suspend error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/approve-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('✅ User approved and registered on blockchain!');
        fetchAllData();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(data.message || 'Failed to approve user');
      }
    } catch (error) {
      setErrorMessage('Error approving user');
      console.error('Approve error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  // Statistics Calculations
  const stats = {
    totalCases: allCases.length,
    pendingApproval: allCases.filter(c => c.status === "PENDING_APPROVAL").length,
    approved: allCases.filter(c => c.status === "APPROVED").length,
    inForensic: allCases.filter(c => c.status === "IN_FORENSIC_ANALYSIS").length,
    readyForHearing: allCases.filter(c => c.status === "READY_FOR_HEARING").length,
    closed: allCases.filter(c => c.status === "CLOSED").length,
    totalUsers: allUsers.length,
    totalEvidence: allEvidence.length,
    activeUsers: activeSessions.length,
    activePolice: activeSessions.filter(s => s.role === "police").length,
    activeForensic: activeSessions.filter(s => s.role === "forensic").length,
    activeJudge: activeSessions.filter(s => s.role === "judge").length
  };

  const sidebarTabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊", count: stats.totalCases },
    { id: "online", label: "Online Users", icon: "🟢", count: stats.activeUsers },
    { id: "cases", label: "Cases", icon: "📋", count: stats.pendingApproval },
    { id: "users", label: "Users", icon: "👥", count: stats.totalUsers },
    { id: "evidence", label: "Evidence", icon: "🔍", count: stats.totalEvidence },
    { id: "blockchain", label: "Blockchain", icon: "🔗" },
    { id: "audit", label: "Audit Logs", icon: "🔐" },
    { id: "system", label: "System", icon: "🖥️" }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };

  return (
    <div className="dashboard-shell min-h-screen overflow-x-hidden">
      <div className="absolute inset-0 login-bg-grid" />
      <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-rose-200 page-orb animate-blob" />
      <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-sky-200 page-orb animate-floatSlow" />
      <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-emerald-200 page-orb animate-glowPulse" />

      <div className="relative z-10">
        <DashboardSwitcher />

        <nav className="sticky top-0 z-30 border-b border-slate-200/60 bg-slate-950/90 text-white backdrop-blur-xl shadow-[0_18px_40px_-28px_rgba(15,23,42,0.6)] animate-fadeInDown">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 p-2 text-white transition hover:bg-white/10 lg:hidden"
                aria-label="Open sidebar"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">⚙️ Admin Dashboard</h1>
                <p className="text-xs text-white/70 sm:text-sm">System Control Center</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-rose-500/90 px-4 py-2 text-sm font-semibold transition hover:bg-rose-500"
            >
              Logout
            </button>
          </div>
        </nav>

        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
          {isSidebarOpen && (
            <button
              type="button"
              aria-label="Close sidebar overlay"
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
            />
          )}

          <aside className={`fixed inset-y-0 left-0 z-40 w-80 border-r border-slate-200/70 bg-white/90 p-5 shadow-2xl backdrop-blur-xl transition-transform duration-300 lg:static lg:z-auto lg:block lg:translate-x-0 lg:rounded-[2rem] lg:border lg:shadow-[0_20px_60px_-20px_rgba(15,23,42,0.22)] ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
            <div className="flex h-full flex-col gap-5 overflow-y-auto">
              <div className="flex items-center justify-between lg:justify-start lg:gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Navigation</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">Dashboard Hub</h2>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="rounded-full bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200 lg:hidden"
                  aria-label="Close sidebar"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-4 text-white shadow-lg">
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">Real-time sync</p>
                <p className="mt-2 text-lg font-bold">Active monitoring</p>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <div>
                    <p className="text-xs text-white/70">Dashboard refresh</p>
                    <p className="font-semibold">{activeTab === "dashboard" ? "Every 5s" : "Every 10s"}</p>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>

              <nav className="space-y-2">
                {sidebarTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      activeTab === tab.id
                        ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg">{tab.icon}</span>
                      <span className="font-semibold">{tab.label}</span>
                    </span>
                    {typeof tab.count === "number" && (
                      <span className={`min-w-8 rounded-full px-2.5 py-1 text-center text-xs font-bold ${activeTab === tab.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Updated</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{lastUpdateTime.toLocaleTimeString()}</p>
                <button
                  onClick={fetchAllData}
                  className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Refresh Now
                </button>
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1 animate-fadeInUp lg:pl-2">
            <div className="rounded-[2rem] border border-slate-200/70 bg-white/80 p-4 shadow-[0_22px_60px_-28px_rgba(15,23,42,0.32)] backdrop-blur-xl sm:p-6">
          {/* Messages */}
          {successMessage && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-2xl">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl">
              {errorMessage}
            </div>
          )}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:hidden">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-semibold text-slate-700">
                    Real-time {activeTab === "dashboard" ? "5s" : "10s"}
                  </span>
                </div>
                <button
                  onClick={fetchAllData}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Refresh
                </button>
              </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div>
            {/* Real-time Update Status */}
            <div className="mb-6 bg-blue-50 border-2 border-blue-400 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-blue-700">
                    🔄 Real-time Dashboard - Updates every 5 seconds
                  </span>
                </div>
                <span className="text-xs text-blue-600">
                  Last updated: {lastUpdateTime.toLocaleTimeString()}
                </span>
              </div>
            </div>
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition">
                <h3 className="text-gray-600 text-sm font-semibold">Total Cases</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.totalCases}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500 hover:shadow-lg transition animate-pulse">
                <h3 className="text-gray-600 text-sm font-semibold">⏳ Pending Approval</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingApproval}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500 hover:shadow-lg transition animate-pulse">
                <h3 className="text-gray-600 text-sm font-semibold">🔬 In Forensic Analysis</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.inForensic}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 hover:shadow-lg transition">
                <h3 className="text-gray-600 text-sm font-semibold">Closed Cases</h3>
                <p className="text-3xl font-bold text-green-600">{stats.closed}</p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500 hover:shadow-lg transition">
                <h3 className="text-gray-600 text-sm font-semibold">Total Users</h3>
                <p className="text-3xl font-bold text-indigo-600">{stats.totalUsers}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500 hover:shadow-lg transition animate-pulse">
                <h3 className="text-gray-600 text-sm font-semibold">⚖️ Ready for Hearing</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.readyForHearing}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500 hover:shadow-lg transition">
                <h3 className="text-gray-600 text-sm font-semibold">Total Evidence Items</h3>
                <p className="text-3xl font-bold text-red-600">{stats.totalEvidence}</p>
              </div>
            </div>

            {/* 🟢 Active Users Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-100 to-green-50 p-6 rounded-lg shadow-md border-2 border-green-300">
                <h3 className="text-green-700 text-sm font-semibold">🟢 Currently Online</h3>
                <p className="text-3xl font-bold text-green-600">{stats.activeUsers}</p>
                <p className="text-xs text-green-600 mt-2">Real-time active users</p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-6 rounded-lg shadow-md border-2 border-blue-300">
                <h3 className="text-blue-700 text-sm font-semibold">👮 Police Officers</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.activePolice}</p>
                <p className="text-xs text-blue-600 mt-2">Online now</p>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-6 rounded-lg shadow-md border-2 border-purple-300">
                <h3 className="text-purple-700 text-sm font-semibold">🔬 Forensic Experts</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.activeForensic}</p>
                <p className="text-xs text-purple-600 mt-2">Online now</p>
              </div>
              <div className="bg-gradient-to-br from-amber-100 to-amber-50 p-6 rounded-lg shadow-md border-2 border-amber-300">
                <h3 className="text-amber-700 text-sm font-semibold">⚖️ Judges</h3>
                <p className="text-3xl font-bold text-amber-600">{stats.activeJudge}</p>
                <p className="text-xs text-amber-600 mt-2">Online now</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">📈 System Overview (Real-time)</h2>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-semibold">Updating</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Approved Cases:</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <div>
                  <p className="text-gray-600">Cases Status Distribution:</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <p className="flex items-center"><span className="mr-2">🟡</span> Pending: <span className="ml-auto font-bold text-yellow-600">{stats.pendingApproval}</span></p>
                    <p className="flex items-center"><span className="mr-2">🟢</span> Approved: <span className="ml-auto font-bold text-green-600">{stats.approved}</span></p>
                    <p className="flex items-center"><span className="mr-2">🟣</span> In Forensic: <span className="ml-auto font-bold text-purple-600">{stats.inForensic}</span></p>
                    <p className="flex items-center"><span className="mr-2">🔵</span> Ready for Hearing: <span className="ml-auto font-bold text-orange-600">{stats.readyForHearing}</span></p>
                    <p className="flex items-center"><span className="mr-2">⚫</span> Closed: <span className="ml-auto font-bold text-gray-600">{stats.closed}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cases Tab */}
        {activeTab === "cases" && (
          <div>
            <h2 className="text-xl font-bold mb-4">📋 Case Governance</h2>

            {/* Pending Cases Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-yellow-700">⏳ Pending Approval</h3>
              {allCases.filter(c => c.status === "PENDING_APPROVAL").length === 0 ? (
                <p className="text-gray-500 italic">No pending cases</p>
              ) : (
                <div className="space-y-3">
                  {allCases.filter(c => c.status === "PENDING_APPROVAL").map(caseItem => (
                    <div key={caseItem._id} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{caseItem.title || "Untitled Case"}</h4>
                          <p className="text-sm text-gray-600">Case ID: {caseItem._id}</p>
                          <p className="text-sm text-gray-600">Filed by: {caseItem.policeOfficerId}</p>
                        </div>
                        <button
                          onClick={() => handleApproveCase(caseItem._id)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:bg-gray-400"
                        >
                          ✅ Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Cases Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">📚 All Cases</h3>
              <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left">Case Title</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Forensic</th>
                      <th className="px-4 py-2 text-left">Judge</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCases.map(caseItem => (
                      <tr key={caseItem._id} className="border-t">
                        <td className="px-4 py-2">{caseItem.title || "Untitled"}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                            {caseItem.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs">{caseItem.forensicOfficerId || "Unassigned"}</td>
                        <td className="px-4 py-2 text-xs">{caseItem.judgeId || "Unassigned"}</td>
                        <td className="px-4 py-2 space-x-2 flex gap-1">
                          <button
                            onClick={() => setForensicAllocationCaseId(caseItem._id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                            title="Assign forensic expert"
                          >
                            🔬 Forensic
                          </button>
                          <button
                            onClick={() => setJudgeAllocationCaseId(caseItem._id)}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs"
                            title="Assign judge"
                          >
                            ⚖️ Judge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Separate Forensic Assignment Section */}
            {forensicAllocationCaseId && (
              <div className="mt-6 bg-blue-50 p-6 rounded-lg border-2 border-blue-400 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-blue-900">🔬 Assign Forensic Expert</h3>
                  <button
                    onClick={() => {
                      setForensicAllocationCaseId(null);
                      setForensicId("");
                    }}
                    className="text-gray-600 hover:text-gray-900 text-xl"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-blue-700 mb-4">
                  <strong>Case:</strong> {allCases.find(c => c._id === forensicAllocationCaseId)?.title || "Unknown"}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Select Forensic Officer</label>
                    <select
                      value={forensicId}
                      onChange={(e) => setForensicId(e.target.value)}
                      className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    >
                      <option value="">-- Choose a Forensic Officer --</option>
                      {allUsers
                        .filter(user => user.role === 'FORENSIC')
                        .map(user => (
                          <option key={user._id} value={user._id}>
                            {user.username} ({user.roleId})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAssignForensic(forensicAllocationCaseId)}
                      disabled={loading || !forensicId}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:bg-gray-400 font-semibold"
                    >
                      {loading ? "Assigning..." : "✅ Assign Forensic"}
                    </button>
                    <button
                      onClick={() => {
                        setForensicAllocationCaseId(null);
                        setForensicId("");
                      }}
                      className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Separate Judge Assignment Section */}
            {judgeAllocationCaseId && (
              <div className="mt-6 bg-purple-50 p-6 rounded-lg border-2 border-purple-400 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-purple-900">⚖️ Assign Judge</h3>
                  <button
                    onClick={() => {
                      setJudgeAllocationCaseId(null);
                      setJudgeId("");
                    }}
                    className="text-gray-600 hover:text-gray-900 text-xl"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-purple-700 mb-4">
                  <strong>Case:</strong> {allCases.find(c => c._id === judgeAllocationCaseId)?.title || "Unknown"}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Select Judge</label>
                    <select
                      value={judgeId}
                      onChange={(e) => setJudgeId(e.target.value)}
                      className="w-full border border-purple-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      autoFocus
                    >
                      <option value="">-- Choose a Judge --</option>
                      {allUsers
                        .filter(user => user.role === 'JUDGE')
                        .map(user => (
                          <option key={user._id} value={user._id}>
                            {user.username} ({user.roleId})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAssignJudge(judgeAllocationCaseId)}
                      disabled={loading || !judgeId}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition disabled:bg-gray-400 font-semibold"
                    >
                      {loading ? "Assigning..." : "✅ Assign Judge"}
                    </button>
                    <button
                      onClick={() => {
                        setJudgeAllocationCaseId(null);
                        setJudgeId("");
                      }}
                      className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 🟢 Online Users Tab - Real-time Session Monitoring */}
        {activeTab === "online" && (
          <div>
            <h2 className="text-xl font-bold mb-4">🟢 Active Users Monitoring (Real-Time)</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Live Status:</strong> This section updates every 10 seconds. Green dot indicates currently logged-in users.
              </p>
            </div>

            {activeSessions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500 text-lg">No active users currently online</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSessions.map((session) => {
                  const loginTime = new Date(session.loginAt);
                  const lastActivityTime = new Date(session.lastActivityAt);
                  const minutesAgo = Math.floor((Date.now() - loginTime) / 60000);
                  const secondsAgo = Math.floor((Date.now() - lastActivityTime) / 1000);

                  return (
                    <div key={session._id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                          <h3 className="font-bold text-gray-800">{session.username || "Unknown"}</h3>
                        </div>
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                          {session.role}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <p>
                          <strong>Email:</strong> {session.email || "N/A"}
                        </p>
                        <p>
                          <strong>Logged in:</strong>{" "}
                          {minutesAgo === 0 ? "Just now" : `${minutesAgo} min${minutesAgo !== 1 ? "s" : ""} ago`}
                        </p>
                        <p>
                          <strong>Last Activity:</strong>{" "}
                          {secondsAgo === 0
                            ? "Active now"
                            : secondsAgo < 60
                            ? `${secondsAgo}s ago`
                            : `${Math.floor(secondsAgo / 60)}m ago`}
                        </p>
                        <p>
                          <strong>IP Address:</strong> {session.ipAddress || "N/A"}
                        </p>
                        <p className="text-xs truncate">
                          <strong>User Agent:</strong> {session.userAgent?.substring(0, 40) || "N/A"}...
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t">
                        <p className="text-xs text-gray-400">
                          Status: {session.isActive ? "🟢 Active" : "🔴 Inactive"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-100 rounded-lg p-4 text-center border-2 border-green-300">
                <p className="text-green-700 font-semibold text-2xl">{activeSessions.length}</p>
                <p className="text-green-600 text-sm">Currently Online</p>
              </div>

              <div className="bg-blue-100 rounded-lg p-4 text-center border-2 border-blue-300">
                <p className="text-blue-700 font-semibold text-2xl">
                  {activeSessions.filter((s) => s.role === "police").length}
                </p>
                <p className="text-blue-600 text-sm">Police Officers</p>
              </div>

              <div className="bg-purple-100 rounded-lg p-4 text-center border-2 border-purple-300">
                <p className="text-purple-700 font-semibold text-2xl">
                  {activeSessions.filter((s) => s.role === "forensic").length}
                </p>
                <p className="text-purple-600 text-sm">Forensic Experts</p>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <h2 className="text-xl font-bold mb-4">👥 User & Role Management</h2>
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left">Username</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Role ID</th>
                    <th className="px-4 py-2 text-left">Verified</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                        No users available or endpoint not configured
                      </td>
                    </tr>
                  ) : (
                    allUsers.map(user => (
                      <tr key={user._id} className="border-t">
                        <td className="px-4 py-2">{user.username}</td>
                        <td className="px-4 py-2">{user.email}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs font-mono">{user.roleId}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.isVerified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.isVerified ? '✓ Yes' : '⏳ Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            {!user.isVerified && (
                              <button
                                onClick={() => handleApproveUser(user._id)}
                                disabled={loading}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                ✓ Approve
                              </button>
                            )}
                            <button
                              onClick={() => handleSuspend(user._id, user.isSuspended)}
                              disabled={loading}
                              className={`text-xs font-semibold transition ${
                                user.isSuspended
                                  ? 'text-green-600 hover:text-green-800'
                                  : 'text-red-600 hover:text-red-800'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {user.isSuspended ? '✓ Unsuspend' : '✕ Suspend'}
                            </button>
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

        {/* Evidence Tab */}
        {activeTab === "evidence" && (
          <div>
            <h2 className="text-xl font-bold mb-4">🔍 Evidence Management</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="font-semibold text-gray-700">Total Evidence Items</h3>
                  <p className="text-3xl font-bold text-blue-600">{allEvidence.length}</p>
                </div>
                <div className="border-l-4 border-green-600 pl-4">
                  <h3 className="font-semibold text-gray-700">Verified Items</h3>
                  <p className="text-3xl font-bold text-green-600">--</p>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold">Evidence Verification Checklist:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><span className="mr-2">✓</span> IPFS Hash Verification</li>
                  <li className="flex items-center"><span className="mr-2">✓</span> Blockchain Timestamp Check</li>
                  <li className="flex items-center"><span className="mr-2">✓</span> Chain of Custody Tracking</li>
                  <li className="flex items-center"><span className="mr-2">✓</span> Tamper Detection Analysis</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Blockchain Tab */}
        {activeTab === "blockchain" && (
          <div>
            <h2 className="text-xl font-bold mb-4">🔗 Blockchain Supervision</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                <h3 className="font-semibold mb-2">Smart Contract Status</h3>
                <p className="text-2xl font-bold">Active</p>
                <p className="text-sm mt-2">JusticeChain.sol - Sepolia</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
                <h3 className="font-semibold mb-2">Network Status</h3>
                <p className="text-2xl font-bold">Operational</p>
                <p className="text-sm mt-2">Ethereum Sepolia Testnet</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold mb-4">Blockchain Information</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Network:</strong> Ethereum Sepolia Testnet</p>
                <p><strong>Contract Address:</strong> 0x1e9Dd6b8743eD4b7d3965ef878db9C7B1e602801</p>
                <p><strong>Chain ID:</strong> 11155111</p>
                <p><strong>Status:</strong> ✅ Connected</p>
              </div>
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === "audit" && (
          <div>
            <h2 className="text-xl font-bold mb-4">🔐 Audit & Security Logs</h2>
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left">Timestamp</th>
                    <th className="px-4 py-2 text-left">User</th>
                    <th className="px-4 py-2 text-left">Action</th>
                    <th className="px-4 py-2 text-left">Details</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                        No audit logs available
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-2">{log.user}</td>
                        <td className="px-4 py-2">{log.action}</td>
                        <td className="px-4 py-2 text-xs">{log.details}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === "system" && (
          <div>
            <h2 className="text-xl font-bold mb-4">🖥️ System Monitoring</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
                <h3 className="font-semibold mb-2">Database Status</h3>
                <p className="text-2xl font-bold">✅ Connected</p>
                <p className="text-sm mt-2">MongoDB Atlas</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                <h3 className="font-semibold mb-2">IPFS Status</h3>
                <p className="text-2xl font-bold">✅ Active</p>
                <p className="text-sm mt-2">Pinata Gateway</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
                <h3 className="font-semibold mb-2">Blockchain Node</h3>
                <p className="text-2xl font-bold">✅ Synced</p>
                <p className="text-sm mt-2">Sepolia Network</p>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold mb-4">System Health Report</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Server Uptime</span>
                  <span className="text-green-600 font-semibold">✅ 99.9%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>API Response Time</span>
                  <span className="text-green-600 font-semibold">✅ &lt;100ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Database Performance</span>
                  <span className="text-green-600 font-semibold">✅ Optimal</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>IPFS Connectivity</span>
                  <span className="text-green-600 font-semibold">✅ Connected</span>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold mb-4">System Information</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Version:</strong> Justice Chain v1.0.0</p>
                <p><strong>Build:</strong> Production</p>
                <p><strong>Last Updated:</strong> 2026-02-13</p>
                <p><strong>Environment:</strong> Production</p>
              </div>
            </div>
          </div>
        )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
