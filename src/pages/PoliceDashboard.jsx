import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, clearSession } from "../utils/auth";
import DashboardSwitcher from "../components/DashboardSwitcher";

export default function PoliceDashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Case form state
  const [caseForm, setCaseForm] = useState({
    title: "",
    description: "",
    caseNumber: "",
    location: "",
    priority: "MEDIUM"
  });

  // Evidence form state
  const [evidenceForm, setEvidenceForm] = useState({
    title: "",
    description: "",
    type: "PHYSICAL",
    file: null
  });

  // Fetch user's cases
  useEffect(() => {
    if (session?.token) {
      fetchCases();
    }
  }, [session]);

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
        setErrorMessage("Failed to fetch cases");
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
      setErrorMessage("Error fetching cases");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/cases/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify(caseForm)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(`Case created successfully! ID: ${data.case.caseId}`);
        setCaseForm({ title: "", description: "", caseNumber: "", location: "", priority: "MEDIUM" });
        setShowCaseForm(false);
        fetchCases();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || "Failed to create case");
      }
    } catch (error) {
      console.error("Error creating case:", error);
      setErrorMessage("Error creating case");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!selectedCaseId || !evidenceForm.file) {
      setErrorMessage("Please select a case and a file");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", evidenceForm.title);
      formData.append("description", evidenceForm.description);
      formData.append("type", evidenceForm.type);
      formData.append("file", evidenceForm.file);
      formData.append("caseId", selectedCaseId);

      const response = await fetch("http://localhost:5000/api/evidence/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(`Evidence uploaded successfully! ID: ${data.evidence.evidenceId}`);
        setEvidenceForm({ title: "", description: "", type: "PHYSICAL", file: null });
        setShowEvidenceForm(false);
        setSelectedCaseId(null);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || "Failed to upload evidence");
      }
    } catch (error) {
      console.error("Error uploading evidence:", error);
      setErrorMessage("Error uploading evidence");
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

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardSwitcher />
      <nav className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">🚔 Police Dashboard</h1>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setShowCaseForm(!showCaseForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            + Register New Case
          </button>
          <button
            onClick={() => setShowEvidenceForm(!showEvidenceForm)}
            disabled={cases.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:bg-gray-400"
          >
            + Upload Evidence
          </button>
        </div>

        {/* Case Registration Form */}
        {showCaseForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-600">
            <h3 className="text-lg font-bold mb-4">📋 Register New Case</h3>
            <form onSubmit={handleCreateCase} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Case Title"
                value={caseForm.title}
                onChange={(e) => setCaseForm({ ...caseForm, title: e.target.value })}
                className="border border-gray-300 rounded p-2"
                required
              />
              <input
                type="text"
                placeholder="Case Number"
                value={caseForm.caseNumber}
                onChange={(e) => setCaseForm({ ...caseForm, caseNumber: e.target.value })}
                className="border border-gray-300 rounded p-2"
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={caseForm.location}
                onChange={(e) => setCaseForm({ ...caseForm, location: e.target.value })}
                className="border border-gray-300 rounded p-2"
                required
              />
              <select
                value={caseForm.priority}
                onChange={(e) => setCaseForm({ ...caseForm, priority: e.target.value })}
                className="border border-gray-300 rounded p-2"
              >
                <option value="LOW">Priority: Low</option>
                <option value="MEDIUM">Priority: Medium</option>
                <option value="HIGH">Priority: High</option>
                <option value="CRITICAL">Priority: Critical</option>
              </select>
              <textarea
                placeholder="Description"
                value={caseForm.description}
                onChange={(e) => setCaseForm({ ...caseForm, description: e.target.value })}
                className="border border-gray-300 rounded p-2 md:col-span-2"
                rows="3"
                required
              ></textarea>
              <div className="md:col-span-2 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition disabled:bg-gray-400"
                >
                  {loading ? "Creating..." : "Create Case"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCaseForm(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 rounded transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Evidence Upload Form */}
        {showEvidenceForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-green-600">
            <h3 className="text-lg font-bold mb-4">📁 Upload Evidence</h3>
            <form onSubmit={handleUploadEvidence} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block font-semibold mb-2">Select Case</label>
                <select
                  value={selectedCaseId || ""}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2"
                  required
                >
                  <option value="">-- Choose a case --</option>
                  {cases.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.caseId} - {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Evidence Title"
                value={evidenceForm.title}
                onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })}
                className="border border-gray-300 rounded p-2"
                required
              />
              <select
                value={evidenceForm.type}
                onChange={(e) => setEvidenceForm({ ...evidenceForm, type: e.target.value })}
                className="border border-gray-300 rounded p-2"
              >
                <option value="PHYSICAL">Physical</option>
                <option value="DIGITAL">Digital</option>
                <option value="DOCUMENT">Document</option>
                <option value="VIDEO">Video</option>
                <option value="AUDIO">Audio</option>
                <option value="IMAGE">Image</option>
              </select>
              <div className="md:col-span-2">
                <label className="block font-semibold mb-2">Upload File</label>
                <input
                  type="file"
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, file: e.target.files[0] })}
                  className="w-full border border-gray-300 rounded p-2"
                  required
                />
                {evidenceForm.file && (
                  <p className="text-sm text-gray-600 mt-1">File: {evidenceForm.file.name} ({(evidenceForm.file.size / 1024 / 1024).toFixed(2)} MB)</p>
                )}
              </div>
              <textarea
                placeholder="Evidence Description"
                value={evidenceForm.description}
                onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                className="border border-gray-300 rounded p-2 md:col-span-2"
                rows="3"
                required
              ></textarea>
              <div className="md:col-span-2 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition disabled:bg-gray-400"
                >
                  {loading ? "Uploading..." : "Upload Evidence"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEvidenceForm(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 rounded transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Cases List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">📊 My Cases</h3>
          {loading && cases.length === 0 ? (
            <p className="text-gray-600">Loading cases...</p>
          ) : cases.length === 0 ? (
            <p className="text-gray-600">No cases filed yet. Click "Register New Case" to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-300 p-3 text-left">Case ID</th>
                    <th className="border border-gray-300 p-3 text-left">Title</th>
                    <th className="border border-gray-300 p-3 text-left">Status</th>
                    <th className="border border-gray-300 p-3 text-left">Priority</th>
                    <th className="border border-gray-300 p-3 text-center">Evidence</th>
                    <th className="border border-gray-300 p-3 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3 font-mono text-sm">{c.caseId}</td>
                      <td className="border border-gray-300 p-3">{c.title}</td>
                      <td className="border border-gray-300 p-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-3">
                        <span className={`px-2 py-1 rounded text-sm font-semibold ${
                          c.priority === "CRITICAL" ? "bg-red-100 text-red-800" :
                          c.priority === "HIGH" ? "bg-orange-100 text-orange-800" :
                          c.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{c.evidence?.length || 0}</span>
                      </td>
                      <td className="border border-gray-300 p-3 text-sm text-gray-600">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
