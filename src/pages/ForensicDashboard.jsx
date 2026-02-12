import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, clearSession } from "../utils/auth";
import DashboardSwitcher from "../components/DashboardSwitcher";

export default function ForensicDashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const [cases, setCases] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [analysisForm, setAnalysisForm] = useState({
    analysisReport: "",
    analysisNotes: ""
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

  const handleSubmitAnalysis = async (e) => {
    e.preventDefault();
    if (!selectedEvidenceId) {
      setErrorMessage("Please select evidence to analyze");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/evidence/${selectedEvidenceId}/analysis`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify(analysisForm)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(`Analysis submitted successfully for evidence!`);
        setAnalysisForm({ analysisReport: "", analysisNotes: "" });
        setShowAnalysisForm(false);
        setSelectedEvidenceId(null);
        if (selectedCaseId) {
          fetchEvidenceByCase(selectedCaseId);
        }
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || "Failed to submit analysis");
      }
    } catch (error) {
      console.error("Error submitting analysis:", error);
      setErrorMessage("Error submitting analysis");
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
    <div className="min-h-screen bg-gray-100">      <DashboardSwitcher />      <nav className="bg-purple-600 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">🔬 Forensic Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cases List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">📋 Assigned Cases</h3>
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
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-purple-400"
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
            <h3 className="text-lg font-bold mb-4">📁 Evidence for Analysis</h3>
            {!selectedCaseId ? (
              <p className="text-gray-600 text-sm">Select a case to view evidence.</p>
            ) : evidenceList.length === 0 ? (
              <p className="text-gray-600 text-sm">No evidence uploaded for this case.</p>
            ) : (
              <div className="space-y-2">
                {evidenceList.map((e) => (
                  <div
                    key={e._id}
                    onClick={() => setSelectedEvidenceId(e._id)}
                    className={`p-3 rounded cursor-pointer border-2 transition ${
                      selectedEvidenceId === e._id
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-purple-400"
                    }`}
                  >
                    <p className="font-semibold text-sm">{e.title}</p>
                    <p className="text-xs text-gray-600">{e.type}</p>
                    <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${getEvidenceStatusColor(e.status)}`}>
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analysis Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {!selectedEvidenceId ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Select evidence to analyze</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-4">🔍 Analysis Report</h3>
                <form onSubmit={handleSubmitAnalysis} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Analysis Report</label>
                    <textarea
                      value={analysisForm.analysisReport}
                      onChange={(e) => setAnalysisForm({ ...analysisForm, analysisReport: e.target.value })}
                      placeholder="Detailed findings and analysis..."
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                      rows="4"
                      required
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Additional Notes</label>
                    <textarea
                      value={analysisForm.analysisNotes}
                      onChange={(e) => setAnalysisForm({ ...analysisForm, analysisNotes: e.target.value })}
                      placeholder="Any additional notes..."
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                      rows="3"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded transition disabled:bg-gray-400"
                  >
                    {loading ? "Submitting..." : "Submit Analysis"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
