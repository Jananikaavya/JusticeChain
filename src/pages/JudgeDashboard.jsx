import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, clearSession } from "../utils/auth";
import DashboardSwitcher from "../components/DashboardSwitcher";

export default function JudgeDashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [evidenceChain, setEvidenceChain] = useState([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showVerdictForm, setShowVerdictForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("evidence");

  const [verdictForm, setVerdictForm] = useState({
    decision: "GUILTY"
  });

  // Fetch assigned cases
  useEffect(() => {
    if (session?.token) {
      fetchCases();
    }
  }, [session]);

  // Fetch evidence when case is selected
  useEffect(() => {
    if (selectedCaseId && session?.token) {
      fetchEvidenceByCase(selectedCaseId);
    }
  }, [selectedCaseId]);

  // Fetch evidence chain when evidence is selected
  useEffect(() => {
    if (selectedEvidenceId && session?.token) {
      fetchEvidenceChain(selectedEvidenceId);
    }
  }, [selectedEvidenceId]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/cases/my-cases", {
        headers: {
          Authorization: `Bearer ${session.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCases(data.cases || []);
      } else {
        setErrorMessage("Failed to fetch assigned cases");
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
      setErrorMessage("Error fetching cases");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvidenceByCase = async (caseId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/evidence/case/${caseId}`, {
        headers: {
          Authorization: `Bearer ${session.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEvidenceList(data.evidence || []);
      } else {
        setEvidenceList([]);
      }
    } catch (error) {
      console.error("Error fetching evidence:", error);
      setEvidenceList([]);
    }
  };

  const fetchEvidenceChain = async (evidenceId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/evidence/${evidenceId}/chain`, {
        headers: {
          Authorization: `Bearer ${session.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEvidenceChain(data.chain || []);
      } else {
        setEvidenceChain([]);
      }
    } catch (error) {
      console.error("Error fetching chain:", error);
      setEvidenceChain([]);
    }
  };

  const handleMarkImmutable = async (evidenceId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/evidence/${evidenceId}/immutable`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        setSuccessMessage("Evidence marked as IMMUTABLE and verified on blockchain!");
        if (selectedCaseId) {
          fetchEvidenceByCase(selectedCaseId);
        }
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || "Failed to mark evidence as immutable");
      }
    } catch (error) {
      console.error("Error marking immutable:", error);
      setErrorMessage("Error marking evidence as immutable");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVerdict = async (e) => {
    e.preventDefault();
    if (!selectedCaseId) {
      setErrorMessage("Please select a case");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/cases/${selectedCaseId}/verdict`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({
          decision: verdictForm.decision,
          caseId: selectedCaseId
        })
      });

      if (response.ok) {
        setSuccessMessage(`Verdict submitted: ${verdictForm.decision}. Case status updated!`);
        setShowVerdictForm(false);
        setVerdictForm({ decision: "GUILTY" });
        fetchCases();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || "Failed to submit verdict");
      }
    } catch (error) {
      console.error("Error submitting verdict:", error);
      setErrorMessage("Error submitting verdict");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
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

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardSwitcher />
      <nav className="bg-red-700 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">⚖️ Judge Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-800 px-4 py-2 rounded transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {successMessage && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            ❌ {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-2">Welcome, {session?.username}</h2>
          <p className="text-gray-600">Role: {session?.role} | Wallet: {session?.wallet?.slice(0, 10)}...</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Cases List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">📋 Cases for Hearing</h3>
            {loading && cases.length === 0 ? (
              <p className="text-gray-600">Loading cases...</p>
            ) : cases.length === 0 ? (
              <p className="text-gray-600 text-sm">No cases assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {cases.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => setSelectedCaseId(c._id)}
                    className={`p-3 rounded cursor-pointer border-2 transition ${
                      selectedCaseId === c._id
                        ? "border-red-600 bg-red-50"
                        : "border-gray-200 hover:border-red-400"
                    }`}
                  >
                    <p className="font-semibold text-sm">{c.caseId}</p>
                    <p className="text-xs text-gray-600">{c.title}</p>
                    <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evidence List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">📁 Evidence Review</h3>
            {!selectedCaseId ? (
              <p className="text-gray-600 text-sm">Select a case to review evidence.</p>
            ) : evidenceList.length === 0 ? (
              <p className="text-gray-600 text-sm">No evidence for this case.</p>
            ) : (
              <div className="space-y-2">
                {evidenceList.map((e) => (
                  <div
                    key={e._id}
                    onClick={() => setSelectedEvidenceId(e._id)}
                    className={`p-3 rounded cursor-pointer border-2 transition ${
                      selectedEvidenceId === e._id
                        ? "border-red-600 bg-red-50"
                        : "border-gray-200 hover:border-red-400"
                    }`}
                  >
                    <p className="font-semibold text-sm">{e.title}</p>
                    <p className="text-xs text-gray-600">{e.type}</p>
                    <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${getEvidenceStatusColor(e.status)}`}>
                      {e.status}
                    </span>
                    {e.isImmutable && <span className="ml-1 inline-block px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold">🔒 IMMUTABLE</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evidence Chain / Details */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            {!selectedEvidenceId ? (
              <div className="text-center py-8 text-gray-600">
                <p>Select evidence to view details</p>
              </div>
            ) : (
              <>
                <div className="border-b mb-4 pb-4">
                  <h3 className="text-lg font-bold mb-3">🔍 Evidence Details</h3>
                  {evidenceList.find(e => e._id === selectedEvidenceId) && (
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Title:</span> {evidenceList.find(e => e._id === selectedEvidenceId).title}</p>
                      <p><span className="font-semibold">Type:</span> {evidenceList.find(e => e._id === selectedEvidenceId).type}</p>
                      <p><span className="font-semibold">Status:</span> <span className={`px-2 py-1 rounded ${getEvidenceStatusColor(evidenceList.find(e => e._id === selectedEvidenceId).status)}`}>{evidenceList.find(e => e._id === selectedEvidenceId).status}</span></p>
                      {evidenceList.find(e => e._id === selectedEvidenceId).analysisReport && (
                        <p><span className="font-semibold">Analysis:</span> {evidenceList.find(e => e._id === selectedEvidenceId).analysisReport.substring(0, 100)}...</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {evidenceList.find(e => e._id === selectedEvidenceId)?.status !== "IMMUTABLE" && (
                    <button
                      onClick={() => handleMarkImmutable(selectedEvidenceId)}
                      disabled={loading}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition disabled:bg-gray-400"
                    >
                      {loading ? "Processing..." : "🔒 Mark Evidence as IMMUTABLE"}
                    </button>
                  )}
                  {evidenceList.find(e => e._id === selectedEvidenceId)?.status === "IMMUTABLE" && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-center font-bold">
                      ✅ Evidence is IMMUTABLE on Blockchain
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t pt-4">
                  <h4 className="font-bold mb-3">📜 Chain of Custody</h4>
                  {evidenceChain.length === 0 ? (
                    <p className="text-sm text-gray-600">No chain entries yet.</p>
                  ) : (
                    <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                      {evidenceChain.map((entry, idx) => (
                        <div key={idx} className="border-l-2 border-gray-300 pl-3 py-2">
                          <p className="font-semibold">{entry.action}</p>
                          <p className="text-xs text-gray-600">By: {entry.performedBy?.slice(0, 10) || "System"}</p>
                          <p className="text-xs text-gray-600">{new Date(entry.timestamp).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Verdict Form */}
        {selectedCaseId && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6 border-l-4 border-red-600">
            <h3 className="text-lg font-bold mb-4">⚖️ Submit Verdict</h3>
            <form onSubmit={handleSubmitVerdict} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={verdictForm.decision}
                onChange={(e) => setVerdictForm({ ...verdictForm, decision: e.target.value })}
                className="border border-gray-300 rounded p-2 font-semibold"
              >
                <option value="GUILTY">GUILTY</option>
                <option value="NOT_GUILTY">NOT GUILTY</option>
                <option value="ACQUITTED">ACQUITTED</option>
                <option value="DISMISSED">DISMISSED</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition disabled:bg-gray-400"
              >
                {loading ? "Submitting..." : "Submit Verdict"}
              </button>
              <p className="text-sm text-gray-600 self-center">
                This will close the case and make all evidence immutable on blockchain.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
