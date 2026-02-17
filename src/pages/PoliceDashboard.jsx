import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API = "http://localhost:5000/api";

export default function PoliceDashboard() {
  const [user, setUser] = useState(null);
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

  const token = localStorage.getItem("token");

  /* -------------------- INIT -------------------- */
  useEffect(() => {
    loadUser();
    connectWallet();
  }, []);

  const loadUser = async () => {
    try {
      const res = await axios.get(`${API}/auth/user/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.user);
      checkRoleOnChain(res.data.user.wallet, res.data.user.role);
    } catch {
      toast.error("Session expired");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- WALLET -------------------- */
  const connectWallet = async () => {
    if (!window.ethereum) return toast.error("Install MetaMask");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setWallet(accounts[0]);
  };

  /* -------------------- BLOCKCHAIN VERIFY -------------------- */
  const checkRoleOnChain = async (walletAddress, role) => {
    try {
      const res = await axios.post(`${API}/auth/verify-role-onchain`, {
        walletAddress,
        role
      });
      setRoleVerified(res.data.verified);
    } catch {
      toast.error("Blockchain verification failed");
    }
  };

  /* -------------------- CASES -------------------- */
  const fetchCases = async () => {
    const res = await axios.get(`${API}/cases`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setCases(res.data);
  };

  const createCase = async (mode) => {
    if (!roleVerified && mode === "SUBMIT")
      return toast.warning("Blockchain verification required");

    try {
      await axios.post(
        `${API}/cases`,
        { ...newCase, status: mode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Case ${mode === "DRAFT" ? "saved" : "submitted"}`);
      fetchCases();
    } catch {
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
      await axios.post(`${API}/evidence/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Evidence uploaded to IPFS + Blockchain");
    } catch {
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
