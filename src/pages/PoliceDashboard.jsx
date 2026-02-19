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

  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [evidenceList, setEvidenceList] = useState([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState("");
  const [suspects, setSuspects] = useState([]);
  const [witnesses, setWitnesses] = useState([]);
  const [investigationNotes, setInvestigationNotes] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

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

  const addToast = (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
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
  }, [sessionState?.token]);

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
    try {
      setBusy((prev) => ({ ...prev, createAction: true }));
      const data = await apiFetch("/api/cases/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCaseForm)
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
      setEvidenceList(data.evidence || []);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <DashboardSwitcher currentRole="POLICE" />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Police Dashboard</h1>
          <p className="text-gray-600">Case Registration, Evidence Management & Investigation</p>
        </div>

        {/* Verification Banner */}
        <div className={`p-4 rounded-lg mb-6 ${chainState.roleVerified ? "bg-green-100 border-l-4 border-green-600" : "bg-yellow-100 border-l-4 border-yellow-600"}`}>
          <p className={`font-semibold ${chainState.roleVerified ? "text-green-800" : "text-yellow-800"}`}>
            {chainState.roleVerified ? "✅ Police role verified on blockchain" : "🔄 Waiting blockchain verification..."}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-900">Blockchain Status</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p><strong>Wallet:</strong> {chainState.address ? chainState.address.substring(0, 10) + "..." : "Not connected"}</p>
                <p className="mt-2"><strong>Role Status:</strong> <span className={chainState.roleVerified ? "text-green-600 font-semibold" : "text-yellow-600 font-semibold"}>
                  {chainState.roleVerified ? "✅ Verified on Blockchain" : "⏳ Pending Verification"}
                </span></p>
              </div>
              <button
                onClick={ensureWallet}
                className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700"
              >
                Reconnect Wallet
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 space-y-2">
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
