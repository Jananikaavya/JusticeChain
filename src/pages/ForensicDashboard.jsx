import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getSession, clearSession } from "../utils/auth";
import DashboardSwitcher from "../components/DashboardSwitcher";

const TABS = ["Cases", "Evidence", "Reports", "Verification", "Logs"];
const CASE_TIMELINE = ["REGISTERED", "APPROVED", "FORENSIC", "COURT", "CLOSED"];

const CONTRACT_ABI = [
  "function forensic(address) view returns (bool)",
  "function submitForensicReport(uint256 caseId, string ipfsHash)",
  "function verifyReport(uint256 caseId) view returns (bytes32)",
  "function verifyEvidence(uint256 caseId, uint256 index) view returns (bytes32)",
  "function logAccess(uint256 caseId)"
];

const toastTimeoutMs = 4000;

const getApiBase = () =>
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getContractAddress = () =>
  import.meta.env.VITE_JUSTICECHAIN_CONTRACT || "";

const getPinataGateway = () =>
  import.meta.env.VITE_PINATA_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/";

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const sha256FromString = async (value) => {
  const data = new TextEncoder().encode(value);
  return toHex(await crypto.subtle.digest("SHA-256", data));
};

const sha256FromBuffer = async (buffer) =>
  toHex(await crypto.subtle.digest("SHA-256", buffer));

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

const parseChainCaseId = (caseItem) => {
  if (!caseItem) return null;
  if (typeof caseItem.blockchainCaseId === "number") return caseItem.blockchainCaseId;
  const caseNumber = `${caseItem.caseNumber || ""}`.match(/\d+/g)?.join("");
  if (caseNumber) return Number(caseNumber);
  const caseIdDigits = `${caseItem.caseId || ""}`.match(/\d+/g)?.join("");
  if (caseIdDigits) return Number(caseIdDigits);
  return null;
};

const emptyChainState = {
  provider: null,
  signer: null,
  address: "",
  chainId: "",
  roleVerified: false,
  contract: null
};

export default function ForensicDashboard() {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState(() => getSession());
  const [activeTab, setActiveTab] = useState("Cases");

  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [evidenceList, setEvidenceList] = useState([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState("");
  const [verificationResults, setVerificationResults] = useState({});
  const [activityLogs, setActivityLogs] = useState([]);
  const [chainState, setChainState] = useState(emptyChainState);

  const [reportForm, setReportForm] = useState({
    observations: "",
    analysis: "",
    conclusion: ""
  });

  const [busy, setBusy] = useState({
    loading: false,
    evidenceLoading: false,
    verifyAction: false,
    reportAction: false,
    courtAction: false
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
      return;
    }
    fetchEvidenceByCase(selectedCaseId);
  }, [selectedCaseId]);

  useEffect(() => {
    if (!selectedEvidenceId || !selectedEvidence) {
      return;
    }
    logActivity("VIEWED_EVIDENCE", `Viewed evidence ${selectedEvidence.evidenceId}`, {
      evidenceId: selectedEvidenceId
    });
    logAccessOnChain();
  }, [selectedEvidenceId, selectedEvidence]);

  const addToast = (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, toastTimeoutMs);
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
      throw new Error(message);
    }

    return payload;
  };

  const ensureWallet = async () => {
    if (!window.ethereum) {
      addToast("error", "MetaMask is not available in this browser.");
      return null;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();

    const contractAddress = getContractAddress();
    const contract = contractAddress
      ? new ethers.Contract(contractAddress, CONTRACT_ABI, signer)
      : null;

    const roleVerified = await verifyForensicRole(contract, address);

    setChainState({
      provider,
      signer,
      address,
      chainId: network?.chainId?.toString() || "",
      roleVerified,
      contract
    });

    if (!roleVerified) {
      addToast("error", "Forensic role verification failed on-chain.");
    }

    return { provider, signer, address, contract, roleVerified };
  };

  const verifyForensicRole = async (contract, address) => {
    try {
      if (!contract || !address) {
        return false;
      }
      if (typeof contract.forensic !== "function") {
        return true;
      }
      return await contract.forensic(address);
    } catch (error) {
      console.error("Forensic role verification failed:", error);
      return false;
    }
  };

  const signPayload = async (payload) => {
    const chain = chainState.signer ? chainState : await ensureWallet();
    if (!chain?.signer) {
      return { signature: "", signedPayload: payload };
    }

    const signature = await chain.signer.signMessage(payload);
    return { signature, signedPayload: payload };
  };

  const logActivity = (action, description, metadata = {}) => {
    setActivityLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        action,
        description,
        timestamp: new Date().toISOString(),
        metadata
      },
      ...prev
    ]);
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

  const logAccessOnChain = async () => {
    try {
      if (!selectedCase) return;
      const chainCaseId = parseChainCaseId(selectedCase);
      if (!chainCaseId) return;
      const chain = chainState.signer ? chainState : await ensureWallet();
      if (!chain?.contract) return;
      await chain.contract.logAccess(chainCaseId);
    } catch (error) {
      console.error("Access log on-chain failed:", error);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const handleVerifyEvidence = async () => {
    if (!selectedEvidence || !selectedCase) {
      addToast("error", "Select evidence to verify.");
      return;
    }

    try {
      setBusyState("verifyAction", true);

      const ipfsUrl = resolveIpfsUrl(selectedEvidence);
      const verificationPayload = {
        caseId: selectedCase.caseId,
        evidenceId: selectedEvidence.evidenceId,
        ipfsHash: selectedEvidence.ipfsHash,
        sha256Hash: selectedEvidence.sha256Hash,
        timestamp: new Date().toISOString()
      };

      const verificationHash = await sha256FromString(
        JSON.stringify(verificationPayload)
      );
      const { signature } = await signPayload(verificationHash);

      const ipfsAvailable = ipfsUrl
        ? (await fetch(ipfsUrl, { method: "HEAD" })).ok
        : false;

      let contentHashMatches = false;
      if (ipfsUrl && ipfsAvailable) {
        const response = await fetch(ipfsUrl);
        const buffer = await response.arrayBuffer();
        const computedHash = await sha256FromBuffer(buffer);
        contentHashMatches = computedHash === selectedEvidence.sha256Hash;
      }

      const onChainHash = ethers.keccak256(
        ethers.toUtf8Bytes(selectedEvidence.ipfsHash || "")
      );

      let blockchainMatches = false;
      let onChainEvidenceHash = "";

      const chainCaseId = parseChainCaseId(selectedCase);
      const evidenceIndex = evidenceList.findIndex(
        (item) => item._id === selectedEvidence._id
      );

      const chain = chainState.signer ? chainState : await ensureWallet();

      if (chain?.contract && chainCaseId !== null && evidenceIndex >= 0) {
        try {
          onChainEvidenceHash = await chain.contract.verifyEvidence(
            chainCaseId,
            evidenceIndex
          );
          blockchainMatches =
            onChainEvidenceHash?.toLowerCase() === onChainHash.toLowerCase();
        } catch (error) {
          console.error("On-chain evidence verification failed:", error);
        }
      } else if (selectedEvidence.blockchainHash) {
        blockchainMatches =
          selectedEvidence.blockchainHash.toLowerCase() ===
          onChainHash.toLowerCase();
        onChainEvidenceHash = selectedEvidence.blockchainHash;
      }

      const result = {
        ipfsAvailable,
        contentHashMatches,
        blockchainMatches,
        signature,
        verificationHash,
        onChainEvidenceHash,
        checkedAt: new Date().toISOString()
      };

      setVerificationResults((prev) => ({
        ...prev,
        [selectedEvidence._id]: result
      }));

      logActivity("VERIFIED_EVIDENCE", `Verified ${selectedEvidence.title}`, {
        evidenceId: selectedEvidence._id,
        verificationHash
      });

      addToast("success", "Verification completed.");
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("verifyAction", false);
    }
  };

  const uploadReportToIpfs = async (payload) => {
    const pinataJwt = import.meta.env.VITE_PINATA_JWT || "";
    if (!pinataJwt) {
      return { ipfsHash: "", gatewayUrl: "", skipped: true };
    }

    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pinataJwt}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || "Failed to upload report to IPFS");
    }

    const data = await response.json();
    const ipfsHash = data.IpfsHash || "";
    return {
      ipfsHash,
      gatewayUrl: ipfsHash ? `${getPinataGateway()}${ipfsHash}` : "",
      skipped: false
    };
  };

  const handleSubmitReport = async (event) => {
    event.preventDefault();
    if (!selectedEvidence || !selectedCase) {
      addToast("error", "Select evidence to submit a report.");
      return;
    }

    try {
      setBusyState("reportAction", true);

      const reportPayload = {
        caseId: selectedCase.caseId,
        evidenceId: selectedEvidence.evidenceId,
        observations: reportForm.observations,
        analysis: reportForm.analysis,
        conclusion: reportForm.conclusion,
        analyst: sessionState?.username || "",
        createdAt: new Date().toISOString()
      };

      const reportHash = await sha256FromString(JSON.stringify(reportPayload));
      const { signature } = await signPayload(reportHash);

      const ipfsUpload = await uploadReportToIpfs(reportPayload);
      if (ipfsUpload.skipped) {
        addToast("error", "Pinata token missing. Report hash saved without IPFS upload.");
      }

      const chainCaseId = parseChainCaseId(selectedCase);
      const chain = chainState.signer ? chainState : await ensureWallet();
      if (chain?.contract && chain?.roleVerified && chainCaseId !== null) {
        try {
          await chain.contract.submitForensicReport(chainCaseId, ipfsUpload.ipfsHash || reportHash);
        } catch (error) {
          console.error("On-chain report submission failed:", error);
          addToast("error", "Blockchain report submission failed.");
        }
      }

      await apiFetch(`/api/evidence/${selectedEvidence._id}/analysis`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          analysisReport: `Observations:\n${reportForm.observations}\n\nAnalysis:\n${reportForm.analysis}\n\nConclusion:\n${reportForm.conclusion}`,
          analysisNotes: `Report Hash: ${reportHash}\nIPFS: ${ipfsUpload.ipfsHash || "N/A"}\nSignature: ${signature || "N/A"}`,
          reportHash,
          reportIpfsHash: ipfsUpload.ipfsHash,
          signature
        })
      });

      logActivity("UPLOADED_REPORT", `Submitted report for ${selectedEvidence.title}`, {
        reportHash,
        ipfsHash: ipfsUpload.ipfsHash
      });

      setReportForm({ observations: "", analysis: "", conclusion: "" });
      addToast("success", "Forensic report submitted.");
      await fetchEvidenceByCase(selectedCaseId);
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("reportAction", false);
    }
  };

  const handleSubmitToCourt = async () => {
    if (!selectedCase) {
      addToast("error", "Select a case to submit.");
      return;
    }

    try {
      setBusyState("courtAction", true);
      await apiFetch(`/api/cases/${selectedCase._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: "HEARING" })
      });

      logActivity("SENT_TO_COURT", `Case ${selectedCase.caseId} sent to court`, {
        caseId: selectedCase._id
      });

      addToast("success", "Case submitted to court.");
      await fetchCases();
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("courtAction", false);
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
      COURT: "bg-orange-100 text-orange-800",
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

  const currentVerification = selectedEvidenceId
    ? verificationResults[selectedEvidenceId]
    : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardSwitcher />
      <nav className="bg-purple-700 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">🔬 Forensic Dashboard</h1>
            <p className="text-sm text-purple-100">
              Evidence integrity, reporting, and chain-of-custody
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="space-y-3 mb-6">
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

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-2">Welcome, {sessionState?.username}</h2>
          <p className="text-gray-600">
            Role: {sessionState?.role} | Wallet: {sessionState?.wallet?.slice(0, 12) || "-"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-2 mb-6 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-purple-600 text-white"
                  : "text-purple-700 hover:bg-purple-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">Assigned Cases</h3>
            {busy.loading ? (
              <p className="text-gray-600 text-sm">Loading cases...</p>
            ) : cases.length === 0 ? (
              <p className="text-gray-600 text-sm">No cases assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {cases.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedCaseId(item._id)}
                    className={`p-3 rounded cursor-pointer border-2 transition ${
                      selectedCaseId === item._id
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-purple-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{item.caseId}</p>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Police: {item.registeredBy?.username || "-"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created: {formatDate(item.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {activeTab === "Cases" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Case Timeline</h3>
                  <button
                    onClick={handleSubmitToCourt}
                    disabled={!selectedCase || busy.courtAction}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded transition disabled:bg-gray-300"
                  >
                    {busy.courtAction ? "Submitting..." : "Submit to Court"}
                  </button>
                </div>
                {!selectedCase ? (
                  <p className="text-sm text-gray-600">Select a case to view timeline.</p>
                ) : (
                  <div className="space-y-3">
                    {CASE_TIMELINE.map((status, index) => {
                      const completed = selectedCase.status === status ||
                        selectedCase.status === "IN_FORENSIC_ANALYSIS" && status === "FORENSIC" ||
                        selectedCase.status === "HEARING" && status === "COURT";
                      const timelineEntry = selectedCase.timeline?.find(
                        (entry) => entry.status === status ||
                          (status === "FORENSIC" && entry.status === "IN_FORENSIC_ANALYSIS") ||
                          (status === "COURT" && entry.status === "HEARING")
                      );
                      return (
                        <div
                          key={status}
                          className={`flex items-start gap-3 p-3 border rounded ${
                            completed ? "border-purple-300 bg-purple-50" : "border-gray-200"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              completed ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{status}</p>
                            <p className="text-xs text-gray-500">
                              {timelineEntry ? formatDate(timelineEntry.timestamp) : "Pending"}
                            </p>
                            {timelineEntry?.notes && (
                              <p className="text-xs text-gray-600 mt-1">
                                {timelineEntry.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Evidence" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold mb-4">Evidence Viewer (Read Only)</h3>
                {!selectedCase ? (
                  <p className="text-sm text-gray-600">Select a case to view evidence.</p>
                ) : busy.evidenceLoading ? (
                  <p className="text-sm text-gray-600">Loading evidence...</p>
                ) : evidenceList.length === 0 ? (
                  <p className="text-sm text-gray-600">No evidence uploaded for this case.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {evidenceList.map((item) => (
                      <div
                        key={item._id}
                        className={`border rounded p-4 cursor-pointer transition ${
                          selectedEvidenceId === item._id
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                        onClick={() => setSelectedEvidenceId(item._id)}
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-sm">{item.title}</h4>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${getEvidenceStatusColor(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">Type: {item.type}</p>
                        <p className="text-xs text-gray-500">Uploaded by: {item.uploadedBy?.username || "-"}</p>
                        <p className="text-xs text-gray-500">Uploaded: {formatDate(item.uploadedAt)}</p>
                        <p className="text-xs text-gray-500 break-all">IPFS: {item.ipfsHash || "-"}</p>
                        <p className="text-xs text-gray-500 break-all">SHA-256: {item.sha256Hash || "-"}</p>
                        <p className="text-xs text-gray-500 break-all">Tx: {item.blockchainTxHash || "-"}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedEvidence && (
                  <div className="mt-6 border-t pt-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-base">Preview</h4>
                      <a
                        href={resolveIpfsUrl(selectedEvidence)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-purple-700 hover:underline"
                      >
                        Download from IPFS
                      </a>
                    </div>
                    <div className="mt-4">
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
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Reports" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold mb-4">Forensic Report</h3>
                {!selectedEvidence ? (
                  <p className="text-sm text-gray-600">Select evidence to add a report.</p>
                ) : (
                  <form onSubmit={handleSubmitReport} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Observations</label>
                      <textarea
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                        rows="3"
                        value={reportForm.observations}
                        onChange={(event) =>
                          setReportForm((prev) => ({
                            ...prev,
                            observations: event.target.value
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Analysis</label>
                      <textarea
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                        rows="4"
                        value={reportForm.analysis}
                        onChange={(event) =>
                          setReportForm((prev) => ({
                            ...prev,
                            analysis: event.target.value
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Conclusion</label>
                      <textarea
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                        rows="3"
                        value={reportForm.conclusion}
                        onChange={(event) =>
                          setReportForm((prev) => ({
                            ...prev,
                            conclusion: event.target.value
                          }))
                        }
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={busy.reportAction}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded transition disabled:bg-gray-300"
                    >
                      {busy.reportAction ? "Submitting..." : "Submit Report"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {activeTab === "Verification" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Evidence Verification</h3>
                  <button
                    onClick={handleVerifyEvidence}
                    disabled={!selectedEvidence || busy.verifyAction}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded transition disabled:bg-gray-300"
                  >
                    {busy.verifyAction ? "Verifying..." : "Verify Evidence"}
                  </button>
                </div>
                {!selectedEvidence ? (
                  <p className="text-sm text-gray-600">Select evidence to verify.</p>
                ) : currentVerification ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Verified on IPFS</span>
                      <span className={currentVerification.ipfsAvailable ? "text-green-600" : "text-red-600"}>
                        {currentVerification.ipfsAvailable ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hash matches blockchain</span>
                      <span className={currentVerification.blockchainMatches ? "text-green-600" : "text-red-600"}>
                        {currentVerification.blockchainMatches ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Integrity confirmed</span>
                      <span className={currentVerification.contentHashMatches ? "text-green-600" : "text-red-600"}>
                        {currentVerification.contentHashMatches ? "Yes" : "No"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Checked: {formatDate(currentVerification.checkedAt)}</p>
                    <p className="text-xs text-gray-500 break-all">Signature: {currentVerification.signature || "-"}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No verification data yet.</p>
                )}
              </div>
            )}

            {activeTab === "Logs" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold mb-4">Activity Logs</h3>
                {activityLogs.length === 0 ? (
                  <p className="text-sm text-gray-600">No activity recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="border rounded p-3">
                        <div className="flex justify-between">
                          <p className="text-sm font-semibold">{log.action}</p>
                          <p className="text-xs text-gray-500">{formatDate(log.timestamp)}</p>
                        </div>
                        <p className="text-sm text-gray-700">{log.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedEvidence?.chainOfCustody?.length ? (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold mb-2">Chain of Custody</h4>
                    <div className="space-y-2">
                      {selectedEvidence.chainOfCustody.map((entry, index) => (
                        <div key={`${entry.timestamp}-${index}`} className="border rounded p-3 text-sm">
                          <p className="font-semibold">{entry.action}</p>
                          <p className="text-xs text-gray-500">{formatDate(entry.timestamp)}</p>
                          <p className="text-xs text-gray-600">By: {entry.performedBy?.username || "-"}</p>
                          <p className="text-xs text-gray-600">{entry.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
