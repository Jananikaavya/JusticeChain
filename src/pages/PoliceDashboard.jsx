import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { getSession, clearSession, getRoleVerificationStatus } from "../utils/auth";
import DashboardSwitcher from "../components/DashboardSwitcher";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export default function PoliceDashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getSession());
  const [wallet, setWallet] = useState("");
  const [roleVerified, setRoleVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  const [cases, setCases] = useState([]);
  const [newCase, setNewCase] = useState({
    title: "",
    caseNumber: "",
    description: "",
    location: "",
    priority: "LOW",
    status: "DRAFT"
  });

  /* -------------------- INIT -------------------- */
  useEffect(() => {
    setSession(getSession());
  }, []);

  useEffect(() => {
    if (!session) {
      navigate("/login");
      return;
    }
    if (!session?.token) {
      setLoading(false);
      return;
    }
    loadUser();
    connectWallet();
  }, [session?.token]);

  const loadUser = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/user/me`, {
        headers: { Authorization: `Bearer ${session.token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load user');
      }
      
      const data = await response.json();
      
      // Verify role on blockchain
      if (data.user?.wallet && data.user?.role) {
        await checkRoleOnChain(data.user.wallet, data.user.role);
      }
      
      fetchCases();
    } catch (error) {
      toast.error("Session expired or failed to load user");
      clearSession();
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- WALLET -------------------- */
  const connectWallet = async () => {
    if (!window.ethereum) return toast.error("Install MetaMask");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWallet(accounts[0]);
    } catch (error) {
      toast.error("Failed to connect wallet");
    }
  };

  /* -------------------- BLOCKCHAIN VERIFY -------------------- */
  const checkRoleOnChain = async (walletAddress, role) => {
    try {
      const response = await fetch(`${API_URL}/auth/check-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({
          wallet: walletAddress,
          role: role
        })
      });

      if (!response.ok) {
        console.warn("Role verification endpoint not available");
        setRoleVerified(false);
        return;
      }

      const data = await response.json();
      setRoleVerified(data.verified || false);
      
      if (data.verified) {
        toast.success("✓ Police role verified on blockchain");
      } else {
        toast.warning("⚠️ Police role not yet verified on blockchain");
      }
    } catch (error) {
      console.warn("Blockchain verification failed:", error.message);
      setRoleVerified(false);
    }
  };

  /* -------------------- CASES -------------------- */
  const fetchCases = async () => {
    try {
      const response = await fetch(`${API_URL}/cases`, {
        headers: { Authorization: `Bearer ${session.token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch cases');
      
      const data = await response.json();
      setCases(data.cases || []);
    } catch (error) {
      toast.error("Failed to load cases");
    }
  };

  const createCase = async (mode) => {
    if (!roleVerified && mode === "SUBMIT")
      return toast.warning("Blockchain verification required");

    try {
      const response = await fetch(`${API_URL}/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({ ...newCase, status: mode })
      });

      if (!response.ok) throw new Error('Failed to create case');

      toast.success(`Case ${mode === "DRAFT" ? "saved" : "submitted"}`);
      setNewCase({
        title: "",
        caseNumber: "",
        description: "",
        location: "",
        priority: "LOW",
        status: "DRAFT"
      });
      fetchCases();
    } catch (error) {
      toast.error("Failed to create case");
    }
  };

  /* -------------------- EVIDENCE -------------------- */
  const uploadEvidence = async (caseId, file) => {
    if (!roleVerified) return toast.warning("Verify role first");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("caseId", caseId);

    try {
      const response = await fetch(`${API_URL}/evidence/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      toast.success("Evidence uploaded to IPFS + Blockchain");
    } catch (error) {
      toast.error("Evidence upload failed");
    }
  };

  /* -------------------- UI -------------------- */
  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Police Dashboard</h1>

      {/* Verification Banner */}
      {!roleVerified ? (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4">
          🔄 Blockchain role verification pending.
          You can view data but cannot perform critical actions.
        </div>
      ) : (
        <div className="bg-green-100 text-green-800 p-3 rounded mb-4">
          ✅ Role verified on blockchain.
        </div>
      )}

      {/* Create Case */}
      <div className="bg-white shadow p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Create FIR</h2>
        <input
          placeholder="Title"
          className="input"
          onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
        />
        <input
          placeholder="Case Number"
          className="input"
          onChange={(e) =>
            setNewCase({ ...newCase, caseNumber: e.target.value })
          }
        />
        <textarea
          placeholder="Description"
          className="input"
          onChange={(e) =>
            setNewCase({ ...newCase, description: e.target.value })
          }
        />
        <input
          placeholder="Location"
          className="input"
          onChange={(e) =>
            setNewCase({ ...newCase, location: e.target.value })
          }
        />

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => createCase("DRAFT")}
            className="bg-gray-500 text-white px-3 py-1 rounded"
          >
            Save Draft
          </button>
          <button
            onClick={() => createCase("SUBMIT")}
            disabled={!roleVerified}
            className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            Submit Case
          </button>
        </div>
      </div>

      {/* Case List */}
      <div className="bg-white shadow p-4 rounded">
        <h2 className="font-semibold mb-2">My Cases</h2>
        {cases.map((c) => (
          <div key={c._id} className="border p-2 mb-2 rounded">
            <p>
              <b>{c.title}</b> – {c.status}
            </p>

            <input
              type="file"
              disabled={!roleVerified || c.status === "FORENSIC"}
              onChange={(e) => uploadEvidence(c._id, e.target.files[0])}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
