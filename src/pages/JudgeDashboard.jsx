import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, clearSession } from "../utils/auth";
import DashboardSwitcher from "../components/DashboardSwitcher";

const TABS = [
  "Overview",
  "Cases",
  "Evidence",
  "Reports",
  "Timeline",
  "Hearings",
  "Analytics"
];

const CASE_STATUSES = [
  "REGISTERED",
  "PENDING_APPROVAL",
  "APPROVED",
  "IN_FORENSIC_ANALYSIS",
  "ANALYSIS_COMPLETE",
  "HEARING",
  "CLOSED"
];

const getApiBase = () =>
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getPinataGateway = () =>
  import.meta.env.VITE_PINATA_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

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

export default function JudgeDashboard() {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState(() => getSession());

  const [activeTab, setActiveTab] = useState("Overview");
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [evidenceList, setEvidenceList] = useState([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState("");
  const [evidenceChain, setEvidenceChain] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
    dateFrom: "",
    dateTo: "",
    accused: ""
  });

  const [verdictForm, setVerdictForm] = useState({
    decision: "GUILTY",
    summary: "",
    html: ""
  });

  const [hearingForm, setHearingForm] = useState({
    date: "",
    time: "",
    notes: ""
  });

  const [hearingHistory, setHearingHistory] = useState([]);
  const [verificationState, setVerificationState] = useState({});

  const editorRef = useRef(null);

  const [busy, setBusy] = useState({
    loading: false,
    evidenceLoading: false,
    chainLoading: false,
    verdictAction: false,
    immutableAction: false,
    verifyAction: false
  });

  const [toasts, setToasts] = useState([]);

  const selectedCase = useMemo(
    () => cases.find((item) => item._id === selectedCaseId) || null,
    [cases, selectedCaseId]
  );

  const selectedEvidence = useMemo(
    () => evidenceList.find((item) => item._id === selectedEvidenceId) || null,
    [evidenceList, selectedEvidenceId]
  );

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
    fetchCases();
  }, [sessionState?.token]);

  useEffect(() => {
    if (!selectedCaseId) {
      setEvidenceList([]);
      setSelectedEvidenceId("");
      setEvidenceChain([]);
      setHearingHistory([]);
      return;
    }
    fetchEvidenceByCase(selectedCaseId);
    fetchHearings(selectedCaseId);
  }, [selectedCaseId]);

  useEffect(() => {
    if (!selectedEvidenceId) {
      setEvidenceChain([]);
      return;
    }
    fetchEvidenceChain(selectedEvidenceId);
  }, [selectedEvidenceId]);

  const addToast = (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const setBusyState = (key, value) => {
    setBusy((prev) => ({ ...prev, [key]: value }));
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
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return payload;
  };

  const fetchCases = async () => {
    try {
      setBusyState("loading", true);
      const data = await apiFetch("/api/cases/my-cases");
      setCases(data.cases || []);
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("loading", false);
    }
  };

  const fetchEvidenceByCase = async (caseId) => {
    try {
      setBusyState("evidenceLoading", true);
      const data = await apiFetch(`/api/evidence/case/${caseId}`);
      setEvidenceList(data.evidences || data.evidence || []);
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
      setEvidenceList([]);
    } finally {
      setBusyState("evidenceLoading", false);
    }
  };

  const fetchEvidenceChain = async (evidenceId) => {
    try {
      setBusyState("chainLoading", true);
      const data = await apiFetch(`/api/evidence/${evidenceId}/chain`);
      setEvidenceChain(data.chainOfCustody || data.chain || []);
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
      setEvidenceChain([]);
    } finally {
      setBusyState("chainLoading", false);
    }
  };

  const fetchHearings = async (caseId) => {
    try {
      const data = await apiFetch(`/api/cases/${caseId}/hearings`);
      setHearingHistory(data.hearings || []);
    } catch (error) {
      console.error(error);
      setHearingHistory([]);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const handleMarkImmutable = async () => {
    if (!selectedEvidenceId) {
      addToast("error", "Select evidence first.");
      return;
    }

    try {
      setBusyState("immutableAction", true);
      await apiFetch(`/api/evidence/${selectedEvidenceId}/immutable`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      addToast("success", "Evidence marked as immutable.");
      if (selectedCaseId) {
        fetchEvidenceByCase(selectedCaseId);
      }
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("immutableAction", false);
    }
  };

  const handleVerifyEvidence = async () => {
    if (!selectedEvidence) {
      addToast("error", "Select evidence to verify.");
      return;
    }

    try {
      setBusyState("verifyAction", true);
      const ipfsUrl = resolveIpfsUrl(selectedEvidence);
      const ipfsAvailable = ipfsUrl ? (await fetch(ipfsUrl, { method: "HEAD" })).ok : false;
      const timestampValid = Boolean(selectedEvidence.uploadedAt);
      const sourceAuthenticated = Boolean(selectedEvidence.uploadedBy);
      const hashVerified = Boolean(selectedEvidence.blockchainHash || selectedEvidence.blockchainTxHash);

      setVerificationState((prev) => ({
        ...prev,
        [selectedEvidence._id]: {
          ipfsAvailable,
          timestampValid,
          sourceAuthenticated,
          hashVerified,
          checkedAt: new Date().toISOString()
        }
      }));

      addToast("success", "Verification completed.");
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("verifyAction", false);
    }
  };

  const applyEditorCommand = (command, value = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    setVerdictForm((prev) => ({
      ...prev,
      html: editorRef.current.innerHTML
    }));
  };

  const handleEditorInput = () => {
    if (!editorRef.current) return;
    setVerdictForm((prev) => ({
      ...prev,
      html: editorRef.current.innerHTML
    }));
  };

  const handleSubmitVerdict = async (event) => {
    event.preventDefault();
    if (!selectedCaseId) {
      addToast("error", "Select a case to submit verdict.");
      return;
    }

    try {
      setBusyState("verdictAction", true);

      try {
        await apiFetch(`/api/cases/${selectedCaseId}/verdict`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            decision: verdictForm.decision,
            summary: verdictForm.summary,
            verdictHtml: verdictForm.html,
            caseId: selectedCaseId
          })
        });
      } catch (error) {
        if (error.status === 404) {
          await apiFetch(`/api/cases/${selectedCaseId}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: "CLOSED" })
          });
        } else {
          throw error;
        }
      }

      addToast("success", "Verdict submitted and case updated.");
      setVerdictForm({ decision: "GUILTY", summary: "", html: "" });
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      fetchCases();
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("verdictAction", false);
    }
  };

  const handleScheduleHearing = async (event) => {
    event.preventDefault();
    if (!hearingForm.date || !hearingForm.time) {
      addToast("error", "Provide date and time for the hearing.");
      return;
    }
    if (!selectedCaseId) {
      addToast("error", "Select a case before scheduling a hearing.");
      return;
    }

    try {
      const response = await apiFetch(`/api/cases/${selectedCaseId}/hearings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          date: hearingForm.date,
          time: hearingForm.time,
          notes: hearingForm.notes
        })
      });

      setHearingHistory((prev) => [response.hearing, ...prev]);
      setHearingForm({ date: "", time: "", notes: "" });
      addToast("success", "Hearing scheduled successfully.");
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      REGISTERED: "bg-blue-100 text-blue-800",
      PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      IN_FORENSIC_ANALYSIS: "bg-purple-100 text-purple-800",
      ANALYSIS_COMPLETE: "bg-indigo-100 text-indigo-800",
      HEARING: "bg-orange-100 text-orange-800",
      CLOSED: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getEvidenceStatusColor = (status) => {
    const colors = {
      UPLOADED: "bg-blue-100 text-blue-800",
      PENDING_ANALYSIS: "bg-yellow-100 text-yellow-800",
      ANALYZING: "bg-purple-100 text-purple-800",
      ANALYSIS_COMPLETE: "bg-green-100 text-green-800",
      VERIFIED: "bg-indigo-100 text-indigo-800",
      IMMUTABLE: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredCases = useMemo(() => {
    const searchLower = filters.search.trim().toLowerCase();
    const accusedLower = filters.accused.trim().toLowerCase();

    return cases.filter((item) => {
      const matchesSearch =
        !searchLower ||
        item.caseId?.toLowerCase().includes(searchLower) ||
        item.title?.toLowerCase().includes(searchLower) ||
        item.caseNumber?.toLowerCase().includes(searchLower);

      const matchesStatus =
        filters.status === "ALL" || item.status === filters.status;

      const createdAt = item.createdAt ? new Date(item.createdAt) : null;
      const fromOk = filters.dateFrom ? createdAt >= new Date(filters.dateFrom) : true;
      const toOk = filters.dateTo ? createdAt <= new Date(filters.dateTo) : true;

      const matchesAccused =
        !accusedLower ||
        item.accusedName?.toLowerCase().includes(accusedLower);

      return matchesSearch && matchesStatus && fromOk && toOk && matchesAccused;
    });
  }, [cases, filters]);

  const overviewStats = useMemo(() => {
    const total = cases.length;
    const pendingJudgments = cases.filter((item) => item.status === "HEARING").length;
    const today = new Date().toDateString();
    const todaysHearings = cases.filter(
      (item) => item.status === "HEARING" && new Date(item.updatedAt || item.createdAt).toDateString() === today
    ).length;
    return { total, pendingJudgments, todaysHearings };
  }, [cases]);

  const statusBreakdown = useMemo(() => {
    const counts = CASE_STATUSES.reduce((acc, status) => ({
      ...acc,
      [status]: 0
    }), {});
    cases.forEach((item) => {
      if (counts[item.status] !== undefined) {
        counts[item.status] += 1;
      }
    });
    return counts;
  }, [cases]);

  const lastSevenDays = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return {
        label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        key: date.toDateString(),
        count: 0
      };
    });

    cases.forEach((item) => {
      const created = new Date(item.createdAt || item.updatedAt);
      const found = days.find((day) => day.key === created.toDateString());
      if (found) {
        found.count += 1;
      }
    });

    return days;
  }, [cases]);

  const evidenceVerification = selectedEvidenceId
    ? verificationState[selectedEvidenceId]
    : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardSwitcher />
      <nav className="bg-gray-900 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Judge Dashboard</h1>
            <p className="text-sm text-gray-300">Hearing control, evidence review, verdict drafting</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="space-y-3">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded border text-sm shadow ${
                toast.type === "success"
                  ? "bg-green-100 border-green-300 text-green-800"
                  : "bg-red-100 border-red-300 text-red-800"
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-2">Welcome, {sessionState?.username}</h2>
          <p className="text-gray-600">
            Role: {sessionState?.role} | Wallet: {sessionState?.wallet?.slice(0, 12) || "-"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-2 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-500">Total Cases</p>
              <p className="text-3xl font-bold text-gray-900">{overviewStats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-500">Pending Judgments</p>
              <p className="text-3xl font-bold text-gray-900">{overviewStats.pendingJudgments}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-500">Today's Hearings</p>
              <p className="text-3xl font-bold text-gray-900">{overviewStats.todaysHearings}</p>
            </div>
          </div>
        )}

        {activeTab === "Cases" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-wrap gap-3 mb-4">
                <input
                  className="border border-gray-300 rounded px-3 py-2 text-sm w-full md:w-56"
                  placeholder="Search case ID or title"
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, search: event.target.value }))
                  }
                />
                <select
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                  value={filters.status}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, status: event.target.value }))
                  }
                >
                  <option value="ALL">All Statuses</option>
                  {CASE_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                  <option value="HEARING">HEARING</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
                <input
                  type="date"
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                  value={filters.dateFrom}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))
                  }
                />
                <input
                  type="date"
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                  value={filters.dateTo}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, dateTo: event.target.value }))
                  }
                />
                <input
                  className="border border-gray-300 rounded px-3 py-2 text-sm w-full md:w-56"
                  placeholder="Accused name"
                  value={filters.accused}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, accused: event.target.value }))
                  }
                />
              </div>

              {busy.loading ? (
                <p className="text-sm text-gray-600">Loading cases...</p>
              ) : filteredCases.length === 0 ? (
                <p className="text-sm text-gray-600">No cases match the filters.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-gray-500 border-b">
                      <tr>
                        <th className="py-2">Case ID</th>
                        <th className="py-2">Title</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCases.map((item) => (
                        <tr
                          key={item._id}
                          className={`border-b hover:bg-gray-50 cursor-pointer ${
                            selectedCaseId === item._id ? "bg-gray-100" : ""
                          }`}
                          onClick={() => setSelectedCaseId(item._id)}
                        >
                          <td className="py-2 font-semibold text-gray-900">{item.caseId}</td>
                          <td className="py-2 text-gray-700">{item.title}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2 text-gray-500">{formatDate(item.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Case Detail</h3>
              {!selectedCase ? (
                <p className="text-sm text-gray-600">Select a case to view details.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Case ID:</span> {selectedCase.caseId}</p>
                  <p><span className="font-semibold">Title:</span> {selectedCase.title}</p>
                  <p><span className="font-semibold">Status:</span> {selectedCase.status}</p>
                  <p><span className="font-semibold">Registered:</span> {formatDate(selectedCase.createdAt)}</p>
                  <p><span className="font-semibold">Priority:</span> {selectedCase.priority || "-"}</p>
                  <p><span className="font-semibold">Crime Type:</span> {selectedCase.caseDescription || "-"}</p>
                  <p><span className="font-semibold">Accused:</span> {selectedCase.accusedName || "Not provided"}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Evidence" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Evidence Types</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>Documents</li>
                <li>Images</li>
                <li>Videos</li>
                <li>Audio</li>
                <li>Forensic Files</li>
              </ul>
              <div className="mt-6 text-xs text-gray-500">
                Evidence is read-only. Use verification tools to validate integrity.
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Evidence List</h3>
              {!selectedCase ? (
                <p className="text-sm text-gray-600">Select a case to load evidence.</p>
              ) : busy.evidenceLoading ? (
                <p className="text-sm text-gray-600">Loading evidence...</p>
              ) : evidenceList.length === 0 ? (
                <p className="text-sm text-gray-600">No evidence for this case.</p>
              ) : (
                <div className="space-y-2">
                  {evidenceList.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => setSelectedEvidenceId(item._id)}
                      className={`p-3 rounded cursor-pointer border-2 transition ${
                        selectedEvidenceId === item._id
                          ? "border-gray-900 bg-gray-100"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-gray-600">{item.type}</p>
                      <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${getEvidenceStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Evidence Viewer</h3>
              {!selectedEvidence ? (
                <p className="text-sm text-gray-600">Select evidence to preview.</p>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold">{selectedEvidence.title}</p>
                    <p className="text-xs text-gray-500">Uploaded: {formatDate(selectedEvidence.uploadedAt)}</p>
                  </div>
                  {getEvidencePreviewType(selectedEvidence.mimeType, selectedEvidence.fileName) === "image" && (
                    <img
                      src={resolveIpfsUrl(selectedEvidence)}
                      alt={selectedEvidence.title}
                      className="max-h-64 rounded border"
                    />
                  )}
                  {getEvidencePreviewType(selectedEvidence.mimeType, selectedEvidence.fileName) === "video" && (
                    <video
                      controls
                      className="w-full max-h-72 rounded border"
                      src={resolveIpfsUrl(selectedEvidence)}
                    />
                  )}
                  {getEvidencePreviewType(selectedEvidence.mimeType, selectedEvidence.fileName) === "pdf" && (
                    <iframe
                      title="Evidence PDF"
                      src={resolveIpfsUrl(selectedEvidence)}
                      className="w-full h-72 border rounded"
                    />
                  )}
                  {getEvidencePreviewType(selectedEvidence.mimeType, selectedEvidence.fileName) === "other" && (
                    <p className="text-sm text-gray-600">No preview available for this file type.</p>
                  )}
                  <a
                    href={resolveIpfsUrl(selectedEvidence)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-gray-900 underline"
                  >
                    Download from IPFS
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Reports" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Forensic Reports</h3>
              {evidenceList.length === 0 ? (
                <p className="text-sm text-gray-600">Load a case to view reports.</p>
              ) : (
                <div className="space-y-3">
                  {evidenceList.map((item) => (
                    <div key={item._id} className="border rounded p-3">
                      <div className="flex justify-between">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <span className="text-xs text-gray-500">{item.analysisStatus || "PENDING"}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {item.analysisReport ? `${item.analysisReport.slice(0, 120)}...` : "No report submitted."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Judgment Editor</h3>
              <form onSubmit={handleSubmitVerdict} className="space-y-4">
                <select
                  value={verdictForm.decision}
                  onChange={(event) =>
                    setVerdictForm((prev) => ({ ...prev, decision: event.target.value }))
                  }
                  className="border border-gray-300 rounded p-2 text-sm w-full"
                >
                  <option value="GUILTY">GUILTY</option>
                  <option value="NOT_GUILTY">NOT GUILTY</option>
                  <option value="ACQUITTED">ACQUITTED</option>
                  <option value="DISMISSED">DISMISSED</option>
                </select>
                <input
                  className="border border-gray-300 rounded p-3 text-sm w-full"
                  placeholder="Verdict summary (plain text)"
                  value={verdictForm.summary}
                  onChange={(event) =>
                    setVerdictForm((prev) => ({ ...prev, summary: event.target.value }))
                  }
                />
                <div className="border border-gray-300 rounded">
                  <div className="flex flex-wrap gap-2 border-b bg-gray-50 p-2">
                    <button
                      type="button"
                      onClick={() => applyEditorCommand("bold")}
                      className="px-2 py-1 text-xs font-semibold border rounded"
                    >
                      Bold
                    </button>
                    <button
                      type="button"
                      onClick={() => applyEditorCommand("italic")}
                      className="px-2 py-1 text-xs font-semibold border rounded"
                    >
                      Italic
                    </button>
                    <button
                      type="button"
                      onClick={() => applyEditorCommand("underline")}
                      className="px-2 py-1 text-xs font-semibold border rounded"
                    >
                      Underline
                    </button>
                    <button
                      type="button"
                      onClick={() => applyEditorCommand("insertUnorderedList")}
                      className="px-2 py-1 text-xs font-semibold border rounded"
                    >
                      Bullets
                    </button>
                    <button
                      type="button"
                      onClick={() => applyEditorCommand("insertOrderedList")}
                      className="px-2 py-1 text-xs font-semibold border rounded"
                    >
                      Numbered
                    </button>
                  </div>
                  <p className="px-3 pt-2 text-xs text-gray-500">
                    Draft judgment with legal reasoning and references.
                  </p>
                  <div
                    ref={editorRef}
                    className="min-h-[160px] p-3 text-sm focus:outline-none"
                    contentEditable
                    onInput={handleEditorInput}
                    data-placeholder="Draft judgment with legal reasoning and references."
                    suppressContentEditableWarning
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy.verdictAction}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2 rounded transition disabled:bg-gray-300"
                >
                  {busy.verdictAction ? "Submitting..." : "Submit Verdict"}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "Timeline" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">Case Timeline</h3>
            {!selectedCase ? (
              <p className="text-sm text-gray-600">Select a case to view timeline.</p>
            ) : selectedCase.timeline?.length ? (
              <div className="space-y-3">
                {selectedCase.timeline.map((entry, index) => (
                  <div key={`${entry.status}-${index}`} className="border rounded p-3">
                    <div className="flex justify-between">
                      <p className="font-semibold text-sm">{entry.status}</p>
                      <p className="text-xs text-gray-500">{formatDate(entry.timestamp)}</p>
                    </div>
                    <p className="text-xs text-gray-600">{entry.notes || "-"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No timeline data available.</p>
            )}
          </div>
        )}

        {activeTab === "Hearings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Schedule Hearing</h3>
              <form onSubmit={handleScheduleHearing} className="space-y-4">
                <input
                  type="date"
                  className="border border-gray-300 rounded p-2 text-sm w-full"
                  value={hearingForm.date}
                  onChange={(event) =>
                    setHearingForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                />
                <input
                  type="time"
                  className="border border-gray-300 rounded p-2 text-sm w-full"
                  value={hearingForm.time}
                  onChange={(event) =>
                    setHearingForm((prev) => ({ ...prev, time: event.target.value }))
                  }
                />
                <textarea
                  className="border border-gray-300 rounded p-3 text-sm w-full"
                  rows="3"
                  placeholder="Hearing notes"
                  value={hearingForm.notes}
                  onChange={(event) =>
                    setHearingForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
                <button
                  type="submit"
                  className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2 rounded transition"
                >
                  Schedule Hearing
                </button>
              </form>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Hearing History</h3>
              {hearingHistory.length === 0 ? (
                <p className="text-sm text-gray-600">No hearing history recorded.</p>
              ) : (
                <div className="space-y-3">
                  {hearingHistory.map((record, index) => (
                    <div key={`${record.scheduledFor}-${index}`} className="border rounded p-3">
                      <div className="flex justify-between">
                        <p className="text-sm font-semibold">{selectedCase?.caseId || "Case"}</p>
                        <p className="text-xs text-gray-500">{formatDate(record.scheduledFor)}</p>
                      </div>
                      <p className="text-xs text-gray-600">Time: {record.time || "-"}</p>
                      <p className="text-xs text-gray-600">{record.notes || "-"}</p>
                      <p className="text-xs text-gray-500">Scheduled by: {record.createdBy?.username || "-"}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 text-xs text-gray-500">
                Real-time sessions and video conferencing integration pending.
              </div>
            </div>
          </div>
        )}

        {activeTab === "Analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Case Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {CASE_STATUSES.map((status) => (
                    <div key={status}>
                      <div className="flex justify-between text-sm">
                        <span>{status}</span>
                        <span>{statusBreakdown[status] || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded h-2">
                        <div
                          className="bg-gray-900 h-2 rounded"
                          style={{ width: `${Math.min(100, (statusBreakdown[status] || 0) * 15)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Last 7 Days (new cases)</p>
                  <div className="flex items-end gap-3 h-36">
                    {lastSevenDays.map((day) => (
                      <div key={day.key} className="flex flex-col items-center gap-2">
                        <div
                          className="w-6 bg-gray-900 rounded"
                          style={{ height: `${Math.max(8, day.count * 18)}px` }}
                        />
                        <span className="text-[10px] text-gray-500 text-center w-10">
                          {day.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Evidence Review Service</h3>
              {!selectedEvidence ? (
                <p className="text-sm text-gray-600">Select evidence to verify.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Hash verification</span>
                    <span className={evidenceVerification?.hashVerified ? "text-green-600" : "text-gray-500"}>
                      {evidenceVerification?.hashVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timestamp validation</span>
                    <span className={evidenceVerification?.timestampValid ? "text-green-600" : "text-gray-500"}>
                      {evidenceVerification?.timestampValid ? "Valid" : "Pending"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Source authentication</span>
                    <span className={evidenceVerification?.sourceAuthenticated ? "text-green-600" : "text-gray-500"}>
                      {evidenceVerification?.sourceAuthenticated ? "Valid" : "Pending"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>IPFS availability</span>
                    <span className={evidenceVerification?.ipfsAvailable ? "text-green-600" : "text-gray-500"}>
                      {evidenceVerification?.ipfsAvailable ? "Available" : "Pending"}
                    </span>
                  </div>
                  <button
                    onClick={handleVerifyEvidence}
                    disabled={busy.verifyAction}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-3 py-2 rounded transition disabled:bg-gray-300"
                  >
                    {busy.verifyAction ? "Verifying..." : "Run Verification"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Evidence" && selectedEvidence && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Evidence Integrity</h3>
              <button
                onClick={handleMarkImmutable}
                disabled={busy.immutableAction || selectedEvidence.status === "IMMUTABLE"}
                className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded transition disabled:bg-gray-300"
              >
                {busy.immutableAction ? "Processing..." : "Mark Immutable"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">IPFS CID</p>
                <p className="break-all text-gray-800">{selectedEvidence.ipfsHash || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">SHA-256 Hash</p>
                <p className="break-all text-gray-800">{selectedEvidence.sha256Hash || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Blockchain Tx</p>
                <p className="break-all text-gray-800">{selectedEvidence.blockchainTxHash || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getEvidenceStatusColor(selectedEvidence.status)}`}>
                  {selectedEvidence.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Evidence" && selectedEvidenceId && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">Chain of Custody</h3>
            {busy.chainLoading ? (
              <p className="text-sm text-gray-600">Loading chain of custody...</p>
            ) : evidenceChain.length === 0 ? (
              <p className="text-sm text-gray-600">No chain entries recorded.</p>
            ) : (
              <div className="space-y-3">
                {evidenceChain.map((entry, index) => (
                  <div key={`${entry.timestamp}-${index}`} className="border rounded p-3 text-sm">
                    <div className="flex justify-between">
                      <p className="font-semibold">{entry.action}</p>
                      <p className="text-xs text-gray-500">{formatDate(entry.timestamp)}</p>
                    </div>
                    <p className="text-xs text-gray-600">By: {entry.performedBy?.username || "System"}</p>
                    <p className="text-xs text-gray-600">{entry.details || "-"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
