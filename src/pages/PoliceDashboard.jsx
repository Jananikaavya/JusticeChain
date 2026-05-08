import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getSession, clearSession, verifyRoleOnBlockchain } from "../utils/auth";
import DashboardSwitcher from "../components/DashboardSwitcher";

const TABS = ["Cases", "Evidence", "Suspects", "Witnesses", "Investigation Notes", "Activity Logs", "Verification"];
const CASE_STATUSES = ["DRAFT", "REGISTERED", "PENDING_APPROVAL", "APPROVED", "IN_FORENSIC_ANALYSIS", "ANALYSIS_COMPLETE", "HEARING", "CLOSED"];

const getApiBase = () =>
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getPinataGateway = () =>
  import.meta.env.VITE_PINATA_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/";

const getContractAddress = () =>
  import.meta.env.VITE_JUSTICECHAIN_CONTRACT || "";

const CONTRACT_ABI = [
  "event CaseCreated(uint256 caseId, address police)",
  "function createCase()",
  "function addEvidence(uint256 caseId, string ipfsHash)"
];

const formatDate = (value) =>
  value ? new Date(value).toLocaleString() : "-";

const getEvidencePreviewType = (mimeType = "", fileName = "") => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif")) return "image";
  if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov")) return "video";
  if (lower.endsWith(".pdf")) return "pdf";
  return "other";
};

const resolveIpfsUrl = (evidence) => {
  if (!evidence) return "";
  if (evidence.pinataUrl) return evidence.pinataUrl;
  if (evidence.pinataIpfsGatewayUrl?.startsWith("ipfs://")) {
    return `${getPinataGateway()}${evidence.pinataIpfsGatewayUrl.replace("ipfs://", "")}`;
  }
  if (evidence.ipfsHash) return `${getPinataGateway()}${evidence.ipfsHash}`;
  return "";
};

export default function PoliceDashboard() {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState(() => getSession());
  const [activeTab, setActiveTab] = useState("Cases");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [evidenceList, setEvidenceList] = useState([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState("");
  const [suspects, setSuspects] = useState([]);
  const [witnesses, setWitnesses] = useState([]);
  const [investigationNotes, setInvestigationNotes] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // Track count changes for animations
  const [previousCounts, setPreviousCounts] = useState({});
  const [countChangeIndicators, setCountChangeIndicators] = useState({});

  const [newCaseForm, setNewCaseForm] = useState({
    title: "",
    caseNumber: "",
    description: "",
    location: "",
    priority: "MEDIUM",
    policeStation: "",
    latitude: "",
    longitude: ""
  });

  const [newSuspectForm, setNewSuspectForm] = useState({
    name: "",
    dateOfBirth: "",
    nationality: "",
    address: ""
  });

  const [newWitnessForm, setNewWitnessForm] = useState({
    name: "",
    contact: "",
    statement: ""
  });

  const [newInvestigationNoteForm, setNewInvestigationNoteForm] = useState({
    title: "",
    content: ""
  });

  const [chainState, setChainState] = useState({
    provider: null,
    signer: null,
    address: "",
    roleVerified: false
  });

  const [busy, setBusy] = useState({
    loading: false,
    evidenceLoading: false,
    createAction: false,
    uploadAction: false
  });

  const [toasts, setToasts] = useState([]);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [filePreviewType, setFilePreviewType] = useState("");

  const selectedCase = useMemo(
    () => cases.find((item) => item._id === selectedCaseId) || null,
    [cases, selectedCaseId]
  );

  const selectedEvidence = useMemo(
    () => evidenceList.find((item) => item._id === selectedEvidenceId) || null,
    [evidenceList, selectedEvidenceId]
  );

  // Calculate statistics for sidebar
  const stats = {
    totalCases: cases.length,
    draftCases: cases.filter(c => c.status === "DRAFT").length,
    pendingCases: cases.filter(c => ["PENDING_APPROVAL", "REGISTERED"].includes(c.status)).length,
    approvedCases: cases.filter(c => c.status === "APPROVED").length,
    inForensic: cases.filter(c => c.status === "IN_FORENSIC_ANALYSIS").length,
    readyForHearing: cases.filter(c => ["ANALYSIS_COMPLETE", "HEARING"].includes(c.status)).length,
    closedCases: cases.filter(c => c.status === "CLOSED").length,
    totalEvidence: evidenceList.length,
    totalSuspects: suspects.length,
    totalWitnesses: witnesses.length,
    totalNotes: investigationNotes.length
  };

  // Detect count changes and show indicators
  useEffect(() => {
    const countKeys = ['totalCases', 'totalEvidence', 'totalSuspects', 'totalWitnesses', 'totalNotes'];
    const newIndicators = {};
    
    countKeys.forEach(key => {
      if (previousCounts[key] !== undefined && previousCounts[key] !== stats[key]) {
        newIndicators[key] = stats[key] > previousCounts[key] ? 'increase' : 'decrease';
        setTimeout(() => {
          setCountChangeIndicators(prev => ({ ...prev, [key]: null }));
        }, 1000);
      }
    });

    if (Object.keys(newIndicators).length > 0) {
      setCountChangeIndicators(newIndicators);
    }
    
    setPreviousCounts({
      totalCases: stats.totalCases,
      totalEvidence: stats.totalEvidence,
      totalSuspects: stats.totalSuspects,
      totalWitnesses: stats.totalWitnesses,
      totalNotes: stats.totalNotes
    });
  }, [stats.totalCases, stats.totalEvidence, stats.totalSuspects, stats.totalWitnesses, stats.totalNotes]);

  const addToast = (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const getContract = (signer) => {
    const contractAddress = getContractAddress();
    if (!contractAddress) {
      throw new Error("Contract address not configured");
    }
    return new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
  };

  const createCaseOnChain = async () => {
    if (!chainState.signer) {
      throw new Error("Wallet not connected");
    }
    const contract = getContract(chainState.signer);
    const tx = await contract.createCase();
    const receipt = await tx.wait();
    const iface = new ethers.Interface(CONTRACT_ABI);
    const event = receipt.logs
      .map((log) => {
        try {
          return iface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === "CaseCreated");

    const chainCaseId = event?.args?.caseId ? Number(event.args.caseId) : null;
    if (!chainCaseId) {
      throw new Error("Failed to read blockchain case ID");
    }

    return { chainCaseId, txHash: tx.hash };
  };

  const addEvidenceOnChain = async (blockchainCaseId, ipfsHash) => {
    if (!chainState.signer) {
      throw new Error("Wallet not connected");
    }
    const contract = getContract(chainState.signer);
    const tx = await contract.addEvidence(blockchainCaseId, ipfsHash);
    await tx.wait();
    return {
      txHash: tx.hash,
      blockchainHash: ethers.keccak256(ethers.toUtf8Bytes(ipfsHash))
    };
  };

  useEffect(() => {
    setSessionState(getSession());
  }, []);

  useEffect(() => {
    if (!sessionState) {
      navigate("/login");
      return;
    }
    if (!sessionState?.token) {
      return;
    }
    loadUser();
    ensureWallet();
    // Real-time polling
    const interval = setInterval(() => {
      setLastUpdateTime(new Date());
      if (selectedCaseId) {
        fetchEvidenceByCase(selectedCaseId);
        fetchSuspectsByCase(selectedCaseId);
        fetchWitnessesByCase(selectedCaseId);
        fetchInvestigationNotes(selectedCaseId);
      } else {
        fetchCases();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [sessionState?.token, selectedCaseId]);

  const loadUser = async () => {
    try {
      const response = await fetch(`${getApiBase()}/api/auth/user/me`, {
        headers: { Authorization: `Bearer ${sessionState.token}` }
      });

      if (!response.ok) {
        throw new Error("Failed to load user");
      }

      const data = await response.json();
      localStorage.setItem("user", JSON.stringify(data.user));
      setSessionState({ ...data.user, token: sessionState.token });

      if (data.user?.isVerified && data.user?.wallet && data.user?.role) {
        const verification = await verifyRoleOnBlockchain(data.user.wallet, data.user.role);
        setChainState((prev) => ({ ...prev, roleVerified: verification.verified || false }));
        if (!verification.verified && verification.error) {
          addToast("warning", verification.error);
        }
      } else {
        setChainState((prev) => ({ ...prev, roleVerified: false }));
      }

      fetchCases();
    } catch (error) {
      addToast("error", "Session expired. Please log in again.");
      clearSession();
      navigate("/login");
    }
  };

  useEffect(() => {
    if (!selectedCaseId) {
      setEvidenceList([]);
      setSuspects([]);
      setWitnesses([]);
      setInvestigationNotes([]);
      setSelectedEvidenceId("");
      return;
    }
    fetchEvidenceByCase(selectedCaseId);
    fetchSuspectsByCase(selectedCaseId);
    fetchWitnessesByCase(selectedCaseId);
    fetchInvestigationNotes(selectedCaseId);
  }, [selectedCaseId]);

  const ensureWallet = async () => {
    try {
      if (!window.ethereum) {
        addToast("warning", "MetaMask not installed");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setChainState({
        provider,
        signer,
        address: accounts[0],
        roleVerified: false
      });

      // Verify role
      if (sessionState?.wallet && sessionState?.role) {
        const verification = await verifyRoleOnBlockchain(sessionState.wallet, sessionState.role);
        setChainState((prev) => ({ ...prev, roleVerified: verification.verified || false }));
        if (verification.verified) {
          addToast("success", "✅ Police role verified on blockchain");
        }
      }
    } catch (error) {
      console.warn("Wallet connection failed:", error.message);
    }
  };

  const apiFetch = async (path, options = {}) => {
    const headers = {
      ...(options.headers || {})
    };
    if (sessionState?.token) {
      headers.Authorization = `Bearer ${sessionState.token}`;
    }
    const response = await fetch(`${getApiBase()}${path}`, {
      ...options,
      headers
    });
    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }
    if (!response.ok) {
      const message = payload?.message || "Request failed";
      throw new Error(message);
    }
    return payload;
  };

  const fetchCases = async () => {
    try {
      setBusy((prev) => ({ ...prev, loading: true }));
      const data = await apiFetch("/api/cases/my-cases");
      setCases(data.cases || []);
    } catch (error) {
      addToast("error", error.message);
    } finally {
      setBusy((prev) => ({ ...prev, loading: false }));
    }
  };

  const createCase = async () => {
    if (!newCaseForm.title || !newCaseForm.caseNumber) {
      addToast("warning", "Fill in required fields");
      return;
    }
    if (!chainState.roleVerified) {
      addToast("warning", "Blockchain role verification required");
      return;
    }
    try {
      setBusy((prev) => ({ ...prev, createAction: true }));
      const chainResult = await createCaseOnChain();
      const data = await apiFetch("/api/cases/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCaseForm,
          blockchainCaseId: chainResult.chainCaseId,
          blockchainCaseTxHash: chainResult.txHash
        })
      });
      addToast("success", "Case created successfully");
      setNewCaseForm({
        title: "",
        caseNumber: "",
        description: "",
        location: "",
        priority: "MEDIUM",
        policeStation: "",
        latitude: "",
        longitude: ""
      });
      fetchCases();
    } catch (error) {
      addToast("error", error.message);
    } finally {
      setBusy((prev) => ({ ...prev, createAction: false }));
    }
  };

  const fetchEvidenceByCase = async (caseId) => {
    try {
      setBusy((prev) => ({ ...prev, evidenceLoading: true }));
      const data = await apiFetch(`/api/evidence/case/${caseId}`);
      setEvidenceList(data.evidences || data.evidence || []);
    } catch (error) {
      console.warn("Failed to fetch evidence:", error.message);
    } finally {
      setBusy((prev) => ({ ...prev, evidenceLoading: false }));
    }
  };

  const uploadEvidence = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedCaseId) {
      addToast("warning", "Select a case first");
      return;
    }
    if (!selectedCase?.blockchainCaseId) {
      addToast("warning", "Case is not registered on blockchain");
      return;
    }
    if (!chainState.roleVerified) {
      addToast("warning", "Blockchain role verification required");
      return;
    }

    try {
      setBusy((prev) => ({ ...prev, uploadAction: true }));
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caseId", selectedCaseId);
      formData.append("title", file.name);
      formData.append("description", "Uploaded from Police Dashboard");
      formData.append("evidenceType", "DIGITAL");

      const response = await apiFetch("/api/evidence/upload", {
        method: "POST",
        body: formData
      });

      if (!response?.evidence?.ipfsHash) {
        throw new Error("Missing IPFS hash from upload");
      }

      const chainResult = await addEvidenceOnChain(
        Number(selectedCase.blockchainCaseId),
        response.evidence.ipfsHash
      );

      await apiFetch(`/api/evidence/${response.evidence._id}/blockchain`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockchainTxHash: chainResult.txHash,
          blockchainHash: chainResult.blockchainHash,
          smartContractAddress: getContractAddress()
        })
      });

      addToast("success", response.message || "Evidence uploaded successfully");
      fetchEvidenceByCase(selectedCaseId);
      setFilePreviewUrl("");
      setFilePreviewType("");
    } catch (error) {
      console.error("Evidence upload failed:", error);
      addToast("error", error.message);
    } finally {
      setBusy((prev) => ({ ...prev, uploadAction: false }));
    }
  };

  const fetchSuspectsByCase = async (caseId) => {
    try {
      const data = await apiFetch(`/api/cases/${caseId}/suspects`);
      setSuspects(data.suspects || []);
    } catch (error) {
      console.warn("Failed to fetch suspects:", error.message);
    }
  };

  const addSuspect = async () => {
    if (!newSuspectForm.name) {
      addToast("warning", "Enter suspect name");
      return;
    }
    try {
      await apiFetch(`/api/cases/${selectedCaseId}/suspects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSuspectForm)
      });
      addToast("success", "Suspect added");
      setNewSuspectForm({ name: "", dateOfBirth: "", nationality: "", address: "" });
      fetchSuspectsByCase(selectedCaseId);
    } catch (error) {
      addToast("error", error.message);
    }
  };

  const fetchWitnessesByCase = async (caseId) => {
    try {
      const data = await apiFetch(`/api/cases/${caseId}/witnesses`);
      setWitnesses(data.witnesses || []);
    } catch (error) {
      console.warn("Failed to fetch witnesses:", error.message);
    }
  };

  const addWitness = async () => {
    if (!newWitnessForm.name) {
      addToast("warning", "Enter witness name");
      return;
    }
    try {
      await apiFetch(`/api/cases/${selectedCaseId}/witnesses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWitnessForm)
      });
      addToast("success", "Witness added");
      setNewWitnessForm({ name: "", contact: "", statement: "" });
      fetchWitnessesByCase(selectedCaseId);
    } catch (error) {
      addToast("error", error.message);
    }
  };

  const fetchInvestigationNotes = async (caseId) => {
    try {
      const data = await apiFetch(`/api/cases/${caseId}/investigation-notes`);
      setInvestigationNotes(data.notes || []);
    } catch (error) {
      console.warn("Failed to fetch notes:", error.message);
    }
  };

  const addInvestigationNote = async () => {
    if (!newInvestigationNoteForm.title || !newInvestigationNoteForm.content) {
      addToast("warning", "Fill in all fields");
      return;
    }
    try {
      await apiFetch(`/api/cases/${selectedCaseId}/investigation-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvestigationNoteForm)
      });
      addToast("success", "Investigation note added");
      setNewInvestigationNoteForm({ title: "", content: "" });
      fetchInvestigationNotes(selectedCaseId);
    } catch (error) {
      addToast("error", error.message);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewType = getEvidencePreviewType(file.type, file.name);
    const reader = new FileReader();

    reader.onload = () => {
      setFilePreviewUrl(reader.result);
      setFilePreviewType(previewType);
    };
    reader.readAsDataURL(file);
  };

  if (!sessionState) return <div className="p-10 text-center">Redirecting...</div>;

  const sidebarTabs = [
    { id: "dashboard", label: "📊 Dashboard", icon: "", count: stats.totalCases, highlight: true },
    { id: "cases", label: "📋 My Cases", icon: "", count: stats.totalCases },
    { id: "draft", label: "📝 Draft", icon: "", count: stats.draftCases },
    { id: "pending", label: "⏳ Pending", icon: "", count: stats.pendingCases },
    { id: "approved", label: "✅ Approved", icon: "", count: stats.approvedCases },
    { id: "forensic", label: "🔬 In Forensic", icon: "", count: stats.inForensic },
    { id: "hearing", label: "⚖️ Hearing", icon: "", count: stats.readyForHearing },
    { id: "evidence", label: "🔍 Evidence", icon: "", count: stats.totalEvidence },
    { id: "suspects", label: "👤 Suspects", icon: "", count: stats.totalSuspects },
    { id: "witnesses", label: "👥 Witnesses", icon: "", count: stats.totalWitnesses },
    { id: "notes", label: "📝 Notes", icon: "", count: stats.totalNotes },
    { id: "logs", label: "📋 Activity Logs", icon: "" },
    { id: "verify", label: "⛓️ Verification", icon: "" }
  ];

  const handleTabChange = (tabId) => {
    const tabMapping = {
      dashboard: "Cases", cases: "Cases", draft: "Cases", pending: "Cases", approved: "Cases", forensic: "Cases", hearing: "Cases",
      evidence: "Evidence", suspects: "Suspects", witnesses: "Witnesses", notes: "Investigation Notes", logs: "Activity Logs", verify: "Verification"
    };
    setActiveTab(tabMapping[tabId] || "Cases");
    setIsSidebarOpen(false);
  };

  return (
    <div className="dashboard-shell min-h-screen overflow-x-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="absolute inset-0 login-bg-grid opacity-10" />
      <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-blue-200 page-orb animate-blob" />
      <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-indigo-200 page-orb animate-floatSlow" />
      <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-cyan-200 page-orb animate-glowPulse" />

      <div className="relative z-10">
        <DashboardSwitcher currentRole="POLICE" />

        <nav className="sticky top-0 z-30 border-b border-blue-200/60 bg-slate-950/90 text-white backdrop-blur-xl shadow-[0_18px_40px_-28px_rgba(15,23,42,0.6)] animate-fadeInDown">
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
                <h1 className="text-xl font-bold sm:text-2xl">👮 Police Dashboard</h1>
                <p className="text-xs text-white/70 sm:text-sm">Case Management & Investigation</p>
              </div>
            </div>
            <button
              onClick={() => {
                clearSession();
                navigate("/login");
              }}
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

          <aside className={`fixed inset-y-0 left-0 z-40 w-80 border-r border-blue-200/70 bg-white/90 p-5 shadow-2xl backdrop-blur-xl transition-transform duration-300 lg:static lg:z-auto lg:block lg:translate-x-0 lg:rounded-[2rem] lg:border lg:shadow-[0_20px_60px_-20px_rgba(15,23,42,0.22)] ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
            <div className="flex h-full flex-col gap-5 overflow-y-auto">
              <div className="flex items-center justify-between lg:justify-start lg:gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Navigation</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">Police Hub</h2>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="rounded-full bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200 lg:hidden"
                  aria-label="Close sidebar"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white shadow-lg">
                <p className="text-xs uppercase tracking-[0.24em] text-white/70">Real-time monitoring</p>
                <p className="mt-2 text-lg font-bold">Cases Overview</p>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <div>
                    <p className="text-xs text-white/70">Dashboard refresh</p>
                    <p className="font-semibold">Every 10s</p>
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
                      (activeTab === "Cases" && tab.id === "cases") || 
                      (activeTab === "Evidence" && tab.id === "evidence") || 
                      (activeTab === "Suspects" && tab.id === "suspects") || 
                      (activeTab === "Witnesses" && tab.id === "witnesses") || 
                      (activeTab === "Investigation Notes" && tab.id === "notes") || 
                      (activeTab === "Activity Logs" && tab.id === "logs") || 
                      (activeTab === "Verification" && tab.id === "verify")
                        ? "border-blue-900 bg-blue-900 text-white shadow-lg"
                        : "border-blue-200 bg-white text-blue-900 hover:border-blue-300 hover:bg-blue-50"
                    } ${tab.highlight ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg">{tab.icon}</span>
                      <span className="font-semibold">{tab.label}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {typeof tab.count === "number" && (
                        <>
                          {countChangeIndicators[['totalCases', 'draftCases', 'pendingCases', 'approvedCases', 'inForensic', 'readyForHearing', 'totalEvidence', 'totalSuspects', 'totalWitnesses', 'totalNotes'].indexOf(Object.keys(stats).find(k => stats[k] === tab.count))] === 'increase' && (
                            <span className="text-xs font-bold text-emerald-500 animate-bounce">📈 +1</span>
                          )}
                          <span className={`min-w-8 rounded-full px-2.5 py-1 text-center text-xs font-bold transition ${
                            activeTab !== "Cases" || tab.id !== "cases" ? "bg-blue-100 text-blue-900" : "bg-white/15 text-white"
                          }`}>
                            {tab.count}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </nav>

              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Updated</p>
                <p className="mt-2 text-sm font-semibold text-blue-900">{lastUpdateTime.toLocaleTimeString()}</p>
                <button
                  onClick={() => {
                    fetchCases();
                    setLastUpdateTime(new Date());
                  }}
                  className="mt-4 w-full rounded-2xl bg-blue-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Refresh Now
                </button>
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1 animate-fadeInUp lg:pl-2">
            <div className="rounded-[2rem] border border-blue-200/70 bg-white/80 p-4 shadow-[0_22px_60px_-28px_rgba(15,23,42,0.32)] backdrop-blur-xl sm:p-6">
              {/* Verification Banner */}
              <div className={`mb-6 p-4 rounded-lg ${chainState.roleVerified ? "bg-green-100 border-l-4 border-green-600" : "bg-yellow-100 border-l-4 border-yellow-600"}`}>
                <p className={`font-semibold ${chainState.roleVerified ? "text-green-800" : "text-yellow-800"}`}>
                  {chainState.roleVerified ? "✅ Police role verified on blockchain" : "🔄 Waiting blockchain verification..."}
                </p>
              </div>

              {/* CASES TAB */}
              {activeTab === "Cases" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Case Creation Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-900">Register New Case (FIR)</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Case Title"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={newCaseForm.title}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, title: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Case Number"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={newCaseForm.caseNumber}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, caseNumber: e.target.value })}
                  />
                  <textarea
                    placeholder="Description"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    rows="3"
                    value={newCaseForm.description}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, description: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={newCaseForm.location}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, location: e.target.value })}
                  />
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={newCaseForm.priority}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, priority: e.target.value })}
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Police Station"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={newCaseForm.policeStation}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, policeStation: e.target.value })}
                  />
                  <button
                    onClick={createCase}
                    disabled={busy.createAction || !chainState.roleVerified}
                    className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {busy.createAction ? "Creating..." : "Register Case"}
                  </button>
                </div>
              </div>
            </div>

            {/* Cases List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-900">My Cases ({cases.length})</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cases.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => setSelectedCaseId(c._id)}
                      className={`p-4 rounded-lg cursor-pointer border-2 transition ${
                        selectedCaseId === c._id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <p className="font-semibold text-gray-800">{c.title}</p>
                      <p className="text-sm text-gray-600">Case #: {c.caseNumber}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                          c.priority === "CRITICAL" ? "bg-red-200 text-red-800" :
                          c.priority === "HIGH" ? "bg-orange-200 text-orange-800" :
                          c.priority === "MEDIUM" ? "bg-yellow-200 text-yellow-800" :
                          "bg-green-200 text-green-800"
                        }`}>
                          {c.priority}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded font-semibold">{c.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EVIDENCE TAB */}
        {activeTab === "Evidence" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-900">Upload Evidence</h2>
                {selectedCaseId ? (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-blue-300 rounded p-6 text-center cursor-pointer hover:bg-blue-50">
                      <input
                        type="file"
                        onChange={(e) => {
                          handleFileSelect(e);
                          uploadEvidence(e);
                        }}
                        className="hidden"
                        id="evidence-upload"
                        disabled={busy.uploadAction || !chainState.roleVerified}
                      />
                      <label htmlFor="evidence-upload" className="cursor-pointer w-full block">
                        <p className="text-sm font-semibold text-gray-700">📎 Click to upload evidence</p>
                        <p className="text-xs text-gray-500 mt-1">Auto-uploaded to IPFS & Blockchain</p>
                      </label>
                    </div>
                    {busy.uploadAction && <p className="text-center text-gray-600">Uploading...</p>}
                    {filePreviewUrl && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold mb-2">Preview:</p>
                        {filePreviewType === "image" && <img src={filePreviewUrl} alt="preview" className="w-full rounded"/>}
                        {filePreviewType === "video" && <video src={filePreviewUrl} controls className="w-full rounded"/>}
                        {filePreviewType === "pdf" && <p className="text-xs text-gray-600">PDF Document</p>}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">Select a case from the Cases tab to upload evidence</p>
                )}
              </div>
            </div>

            {/* Evidence List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-900">Evidence Items ({evidenceList.length})</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {evidenceList.map((evidence) => (
                    <div
                      key={evidence._id}
                      onClick={() => setSelectedEvidenceId(evidence._id)}
                      className={`p-4 rounded-lg cursor-pointer border-2 transition ${
                        selectedEvidenceId === evidence._id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <p className="font-semibold text-gray-800">{evidence.title || evidence.fileName}</p>
                      <p className="text-sm text-gray-600">Type: {evidence.mimeType}</p>
                      <p className="text-xs text-gray-500 mt-1">Uploaded: {formatDate(evidence.uploadedAt)}</p>
                      {evidence.ipfsHash && (
                        <p className="text-xs text-green-600 mt-1">✓ IPFS: {evidence.ipfsHash.substring(0, 10)}...</p>
                      )}
                    </div>
                  ))}
                </div>

                {selectedEvidence && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Evidence Details</h3>
                    <p className="text-sm"><strong>ID:</strong> {selectedEvidence.evidenceId}</p>
                    <p className="text-sm"><strong>Size:</strong> {(selectedEvidence.fileSize / 1024).toFixed(2)} KB</p>
                    {selectedEvidence.ipfsHash && (
                      <a
                        href={resolveIpfsUrl(selectedEvidence)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm mt-2 block"
                      >
                        View on IPFS Gateway →
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUSPECTS TAB */}
        {activeTab === "Suspects" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-900">Add Suspect</h2>
                {selectedCaseId ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Suspect Name"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={newSuspectForm.name}
                      onChange={(e) => setNewSuspectForm({ ...newSuspectForm, name: e.target.value })}
                    />
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={newSuspectForm.dateOfBirth}
                      onChange={(e) => setNewSuspectForm({ ...newSuspectForm, dateOfBirth: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Nationality"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={newSuspectForm.nationality}
                      onChange={(e) => setNewSuspectForm({ ...newSuspectForm, nationality: e.target.value })}
                    />
                    <textarea
                      placeholder="Address"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      rows="3"
                      value={newSuspectForm.address}
                      onChange={(e) => setNewSuspectForm({ ...newSuspectForm, address: e.target.value })}
                    />
                    <button
                      onClick={addSuspect}
                      className="w-full bg-red-600 text-white py-2 rounded font-semibold hover:bg-red-700"
                    >
                      Add Suspect
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-600">Select a case first</p>
                )}
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-900">Suspects in Case ({suspects.length})</h2>
                <div className="space-y-3">
                  {suspects.map((suspect) => (
                    <div key={suspect._id} className="p-4 border border-gray-200 rounded-lg">
                      <p className="font-semibold text-gray-800">{suspect.name}</p>
                      <p className="text-sm text-gray-600">DOB: {formatDate(suspect.dateOfBirth)}</p>
                      <p className="text-sm text-gray-600">Nationality: {suspect.nationality}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WITNESSES TAB */}
        {activeTab === "Witnesses" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-900">Add Witness</h2>
                {selectedCaseId ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Witness Name"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={newWitnessForm.name}
                      onChange={(e) => setNewWitnessForm({ ...newWitnessForm, name: e.target.value })}
                    />
                    <input
                      type="tel"
                      placeholder="Contact"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={newWitnessForm.contact}
                      onChange={(e) => setNewWitnessForm({ ...newWitnessForm, contact: e.target.value })}
                    />
                    <textarea
                      placeholder="Statement"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      rows="4"
                      value={newWitnessForm.statement}
                      onChange={(e) => setNewWitnessForm({ ...newWitnessForm, statement: e.target.value })}
                    />
                    <button
                      onClick={addWitness}
                      className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700"
                    >
                      Add Witness
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-600">Select a case first</p>
                )}
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-900">Witnesses in Case ({witnesses.length})</h2>
                <div className="space-y-3">
                  {witnesses.map((witness) => (
                    <div key={witness._id} className="p-4 border border-gray-200 rounded-lg">
                      <p className="font-semibold text-gray-800">{witness.name}</p>
                      <p className="text-sm text-gray-600">Contact: {witness.contact}</p>
                      <p className="text-sm text-gray-600 mt-2">{witness.statement}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INVESTIGATION NOTES TAB */}
        {activeTab === "Investigation Notes" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-900">Add Note</h2>
                {selectedCaseId ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Note Title"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={newInvestigationNoteForm.title}
                      onChange={(e) => setNewInvestigationNoteForm({ ...newInvestigationNoteForm, title: e.target.value })}
                    />
                    <textarea
                      placeholder="Note Content"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      rows="5"
                      value={newInvestigationNoteForm.content}
                      onChange={(e) => setNewInvestigationNoteForm({ ...newInvestigationNoteForm, content: e.target.value })}
                    />
                    <button
                      onClick={addInvestigationNote}
                      className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700"
                    >
                      Save Note
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-600">Select a case first</p>
                )}
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-900">Investigation Notes ({investigationNotes.length})</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {investigationNotes.map((note) => (
                    <div key={note._id} className="p-4 border border-gray-200 rounded-lg">
                      <p className="font-semibold text-gray-800">{note.title}</p>
                      <p className="text-sm text-gray-600 mt-2">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-2">Added: {formatDate(note.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVITY LOGS TAB */}
        {activeTab === "Activity Logs" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-900">Activity Logs</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activityLogs.length === 0 ? (
                <p className="text-gray-600">No activity recorded yet</p>
              ) : (
                activityLogs.map((log) => (
                  <div key={log._id} className="p-3 bg-gray-50 rounded border-l-4 border-blue-600">
                    <p className="text-sm font-semibold text-gray-800">{log.action}</p>
                    <p className="text-xs text-gray-600">{log.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(log.timestamp)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VERIFICATION TAB */}
        {activeTab === "Verification" && (
          <div className="space-y-6">
            {/* Blockchain Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-900">⛓️ Blockchain Status</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p><strong>Wallet:</strong> {chainState.address ? chainState.address.substring(0, 10) + "..." : "Not connected"}</p>
                  <p className="mt-2"><strong>Role Status:</strong> <span className={chainState.roleVerified ? "text-green-600 font-semibold" : "text-yellow-600 font-semibold"}>
                    {chainState.roleVerified ? "✅ Verified on Blockchain" : "⏳ Pending Verification"}
                  </span></p>
                  <p className="mt-2"><strong>Network:</strong> <span className="text-purple-600 font-semibold">Sepolia Testnet</span></p>
                </div>
                <button
                  onClick={ensureWallet}
                  className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700"
                >
                  Reconnect Wallet
                </button>
              </div>
            </div>

            {/* Case Blockchain Info */}
            {selectedCase && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-900">📋 Case Blockchain Info</h2>
                {selectedCase.blockchainCaseId ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border-l-4 border-green-600 rounded">
                      <p><strong>✅ Case on Blockchain:</strong></p>
                      <p className="text-sm text-gray-700 mt-1"><strong>Blockchain Case ID:</strong> {selectedCase.blockchainCaseId}</p>
                      {selectedCase.blockchainCaseTxHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${selectedCase.blockchainCaseTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm mt-2 block"
                        >
                          🔗 View on Sepolia Etherscan →
                        </a>
                      )}
                    </div>
                    {selectedCase.blockchainApprovalTxHash && (
                      <div className="p-3 bg-blue-50 border-l-4 border-blue-600 rounded">
                        <p><strong>✅ Case Approved on Blockchain</strong></p>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${selectedCase.blockchainApprovalTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm mt-2 block"
                        >
                          🔗 View Approval TX →
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">No blockchain case ID. Create a new case to register on blockchain.</p>
                )}
              </div>
            )}

            {/* Evidence Blockchain Info */}
            {selectedEvidence && selectedEvidence.blockchainTxHash && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-900">📦 Evidence Blockchain Info</h2>
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border-l-4 border-green-600 rounded">
                    <p className="font-semibold text-green-800">✅ Evidence Stored on Blockchain</p>
                    
                    <div className="mt-3 space-y-2 text-sm">
                      <p><strong>Evidence ID:</strong> <code className="bg-gray-200 px-2 py-1 rounded text-xs">{selectedEvidence.evidenceId}</code></p>
                      
                      <p><strong>IPFS Hash (on-chain):</strong></p>
                      <code className="block bg-gray-200 px-3 py-2 rounded text-xs break-all">{selectedEvidence.ipfsHash}</code>
                      
                      {selectedEvidence.pinataUrl && (
                        <>
                          <p><strong>View File on IPFS:</strong></p>
                          <a
                            href={selectedEvidence.pinataUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline block"
                          >
                            🌐 Open on Pinata Gateway →
                          </a>
                        </>
                      )}
                      
                      <p><strong>Blockchain Transaction:</strong></p>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${selectedEvidence.blockchainTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline block"
                      >
                        🔗 View on Etherscan →
                      </a>
                      
                      <p><strong>Uploaded At:</strong> {formatDate(selectedEvidence.uploadedAt)}</p>
                      <p><strong>File Hash (SHA256):</strong> <code className="bg-gray-200 px-2 py-1 rounded text-xs">{selectedEvidence.sha256Hash?.substring(0, 32)}...</code></p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!selectedCase && (
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                <p className="text-blue-800">Select a case and evidence to view blockchain verification details</p>
              </div>
            )}
          </div>
        )}
            </div>
          </main>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg text-white ${
              toast.type === "success" ? "bg-green-600" :
              toast.type === "error" ? "bg-red-600" :
              toast.type === "warning" ? "bg-yellow-600" :
              "bg-blue-600"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
