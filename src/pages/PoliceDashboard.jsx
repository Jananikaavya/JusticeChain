import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getSession, clearSession } from "../utils/auth";
import DashboardSwitcher from "../components/DashboardSwitcher";

const CASE_TIMELINE = [
  "REGISTERED",
  "APPROVED",
  "FORENSIC",
  "INVESTIGATION",
  "COURT",
  "CLOSED"
];

const EVIDENCE_TYPES = [
  "PHYSICAL",
  "DIGITAL",
  "DOCUMENT",
  "VIDEO",
  "AUDIO",
  "IMAGE"
];

const SUSPECT_STATUSES = ["UNDER_WATCH", "ARRESTED", "RELEASED"];

const AI_TAGS = ["face", "weapon", "vehicle"];

const CONTRACT_ABI = [
  "function registerCase(string caseId, address policeWallet)",
  "function addEvidence(string caseId, string ipfsHash, string evidenceHash)",
  "function policeRoleHash() view returns (bytes32)"
];

const DEFAULT_FORM = {
  caseForm: {
    title: "",
    caseNumber: "",
    description: "",
    location: "",
    priority: "MEDIUM"
  },
  evidenceForm: {
    title: "",
    description: "",
    type: "PHYSICAL",
    file: null,
    geo: null,
    aiTags: []
  },
  noteForm: {
    note: ""
  },
  suspectForm: {
    name: "",
    age: "",
    address: "",
    status: "UNDER_WATCH"
  },
  witnessForm: {
    name: "",
    statement: "",
    file: null
  },
  transferForm: {
    type: "STATION",
    target: "",
    reason: ""
  },
  forensicForm: {
    instructions: ""
  },
  hearingForm: {
    report: ""
  }
};

const emptyChainState = {
  provider: null,
  signer: null,
  address: "",
  chainId: "",
  roleVerified: false
};

const getApiBase = () =>
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getContractAddress = () =>
  import.meta.env.VITE_JUSTICECHAIN_CONTRACT || "";

const toastTimeoutMs = 4000;

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const sha256FromString = async (value) => {
  const data = new TextEncoder().encode(value);
  return toHex(await crypto.subtle.digest("SHA-256", data));
};

const sha256FromFile = async (file) => {
  const data = await file.arrayBuffer();
  return toHex(await crypto.subtle.digest("SHA-256", data));
};

export default function PoliceDashboard() {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState(() => getSession());

  const [activeTab, setActiveTab] = useState("Cases");
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [evidence, setEvidence] = useState([]);
  const [notes, setNotes] = useState([]);
  const [suspects, setSuspects] = useState([]);
  const [witnesses, setWitnesses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [chainState, setChainState] = useState(emptyChainState);

  const [caseForm, setCaseForm] = useState(DEFAULT_FORM.caseForm);
  const [evidenceForm, setEvidenceForm] = useState(DEFAULT_FORM.evidenceForm);
  const [noteForm, setNoteForm] = useState(DEFAULT_FORM.noteForm);
  const [suspectForm, setSuspectForm] = useState(DEFAULT_FORM.suspectForm);
  const [witnessForm, setWitnessForm] = useState(DEFAULT_FORM.witnessForm);
  const [transferForm, setTransferForm] = useState(DEFAULT_FORM.transferForm);
  const [forensicForm, setForensicForm] = useState(DEFAULT_FORM.forensicForm);
  const [hearingForm, setHearingForm] = useState(DEFAULT_FORM.hearingForm);

  const [busy, setBusy] = useState({
    loading: false,
    caseAction: false,
    evidenceAction: false,
    noteAction: false,
    suspectAction: false,
    witnessAction: false,
    transferAction: false,
    forensicAction: false,
    hearingAction: false,
    verifyAction: false
  });

  const [toasts, setToasts] = useState([]);
  const [verification, setVerification] = useState({});

  const selectedCase = useMemo(
    () => cases.find((item) => item._id === selectedCaseId) || null,
    [cases, selectedCaseId]
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
    fetchLogs();
  }, [sessionState?.token]);

  useEffect(() => {
    if (!selectedCaseId) {
      setEvidence([]);
      setNotes([]);
      setSuspects([]);
      setWitnesses([]);
      return;
    }

    fetchEvidence(selectedCaseId);
    fetchNotes(selectedCaseId);
    fetchSuspects(selectedCaseId);
    fetchWitnesses(selectedCaseId);
  }, [selectedCaseId]);

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

  const apiFetch = async (path, options = {}, config = {}) => {
    const { allowNotFound = false, skipAuth = false } = config;
    const headers = {
      ...(options.headers || {})
    };

    if (!skipAuth && sessionState?.token) {
      headers.Authorization = `Bearer ${sessionState.token}`;
    }

    const response = await fetch(`${getApiBase()}${path}`, {
      ...options,
      headers
    });

    if (response.status === 404 && allowNotFound) {
      return { notFound: true };
    }

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

    const roleVerified = await verifyPoliceRole(contract);

    setChainState({
      provider,
      signer,
      address,
      chainId: network?.chainId?.toString() || "",
      roleVerified
    });

    if (!roleVerified) {
      addToast("error", "Police role verification failed on-chain.");
    }

    return { provider, signer, address, contract, roleVerified };
  };

  const verifyPoliceRole = async (contract) => {
    try {
      if (!contract) {
        return false;
      }
      const onChainHash = await contract.policeRoleHash();
      const expectedHash = ethers.id("POLICE");
      return onChainHash.toLowerCase() === expectedHash.toLowerCase();
    } catch (error) {
      console.error("Role verification failed:", error);
      return false;
    }
  };

  const signPayload = async (payload) => {
    const sessionWallet = sessionState?.wallet || "";
    const dataToSign = `${payload}|${sessionWallet}|${Date.now()}`;

    const chain = chainState.signer ? chainState : await ensureWallet();
    if (!chain?.signer) {
      return { signature: "", signedPayload: dataToSign };
    }

    const signature = await chain.signer.signMessage(dataToSign);
    return { signature, signedPayload: dataToSign };
  };

  const fetchCases = async () => {
    try {
      if (!sessionState?.token) {
        return;
      }
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

  const fetchEvidence = async (caseId) => {
    try {
      if (!sessionState?.token) {
        return;
      }
      setBusyState("loading", true);
      const data = await apiFetch(`/api/evidence/by-case/${caseId}`);
      setEvidence(data.evidence || []);
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("loading", false);
    }
  };

  const fetchNotes = async (caseId) => {
    try {
      if (!sessionState?.token) {
        return;
      }
      const data = await apiFetch(`/api/investigation/notes/${caseId}`);
      setNotes(data.notes || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSuspects = async (caseId) => {
    try {
      if (!sessionState?.token) {
        return;
      }
      const data = await apiFetch(`/api/suspects/${caseId}`);
      setSuspects(data.suspects || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchWitnesses = async (caseId) => {
    try {
      if (!sessionState?.token) {
        return;
      }
      const data = await apiFetch(`/api/witnesses/${caseId}`);
      setWitnesses(data.witnesses || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLogs = async () => {
    try {
      if (!sessionState?.token) {
        return;
      }
      const data = await apiFetch(
        "/api/logs/my-actions",
        {},
        { allowNotFound: true }
      );
      if (data?.notFound) {
        setLogs([]);
        return;
      }
      setLogs(data.logs || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const handleCreateCase = async (mode) => {
    try {
      setBusyState("caseAction", true);
      if (mode === "SUBMIT") {
        const chain = chainState.signer ? chainState : await ensureWallet();
        if (!chain?.roleVerified) {
          throw new Error("Police role verification required.");
        }
      }

      const payload = { ...caseForm, mode };
      const { signature, signedPayload } = await signPayload(
        JSON.stringify(payload)
      );

      const data = await apiFetch("/api/cases/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, signature, signedPayload })
      });

      if (mode === "SUBMIT") {
        const chain = chainState.signer ? chainState : await ensureWallet();
        if (chain?.signer && chain.roleVerified) {
          const contract = new ethers.Contract(
            getContractAddress(),
            CONTRACT_ABI,
            chain.signer
          );
          await contract.registerCase(data.case.caseId, chain.address);
        }
      }

      addToast("success", "Case saved successfully.");
      setCaseForm(DEFAULT_FORM.caseForm);
      fetchCases();
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("caseAction", false);
    }
  };

  const handleUploadEvidence = async () => {
    if (!selectedCaseId || !evidenceForm.file) {
      addToast("error", "Select a case and attach a file.");
      return;
    }

    try {
      setBusyState("evidenceAction", true);
      const chain = chainState.signer ? chainState : await ensureWallet();
      if (!chain?.roleVerified) {
        throw new Error("Police role verification required.");
      }

      const hash = await sha256FromFile(evidenceForm.file);
      const { signature, signedPayload } = await signPayload(hash);

      const formData = new FormData();
      formData.append("caseId", selectedCaseId);
      formData.append("title", evidenceForm.title);
      formData.append("description", evidenceForm.description);
      formData.append("type", evidenceForm.type);
      formData.append("file", evidenceForm.file);
      formData.append("sha256", hash);
      formData.append("signature", signature);
      formData.append("signedPayload", signedPayload);
      formData.append("aiTags", JSON.stringify(evidenceForm.aiTags));
      if (evidenceForm.geo) {
        formData.append("geo", JSON.stringify(evidenceForm.geo));
      }

      const data = await apiFetch("/api/evidence/upload", {
        method: "POST",
        body: formData
      });

      if (chain?.signer && chain.roleVerified) {
        const contract = new ethers.Contract(
          getContractAddress(),
          CONTRACT_ABI,
          chain.signer
        );
        await contract.addEvidence(
          selectedCase?.caseId || selectedCaseId,
          data.evidence?.ipfsCid || "",
          hash
        );
      }

      addToast("success", "Evidence uploaded successfully.");
      setEvidenceForm(DEFAULT_FORM.evidenceForm);
      fetchEvidence(selectedCaseId);
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("evidenceAction", false);
    }
  };

  const handleVerifyEvidence = async (evidenceId) => {
    try {
      setBusyState("verifyAction", true);
      const data = await apiFetch(`/api/evidence/verify/${evidenceId}`, {
        method: "POST"
      });
      setVerification((prev) => ({
        ...prev,
        [evidenceId]: data
      }));
      addToast("success", "Evidence verification complete.");
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("verifyAction", false);
    }
  };

  const handleAddNote = async () => {
    if (!noteForm.note.trim()) {
      addToast("error", "Note cannot be empty.");
      return;
    }

    try {
      setBusyState("noteAction", true);
      const timestamp = new Date().toISOString();
      const hash = await sha256FromString(`${noteForm.note}|${timestamp}`);
      const payload = {
        caseId: selectedCaseId,
        note: noteForm.note,
        timestamp,
        hash
      };

      await apiFetch("/api/investigation/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      addToast("success", "Note added.");
      setNoteForm(DEFAULT_FORM.noteForm);
      fetchNotes(selectedCaseId);
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("noteAction", false);
    }
  };

  const handleAddSuspect = async () => {
    try {
      setBusyState("suspectAction", true);
      const payload = { caseId: selectedCaseId, ...suspectForm };
      await apiFetch("/api/suspects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      addToast("success", "Suspect added.");
      setSuspectForm(DEFAULT_FORM.suspectForm);
      fetchSuspects(selectedCaseId);
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("suspectAction", false);
    }
  };

  const handleAddWitness = async () => {
    try {
      setBusyState("witnessAction", true);
      const formData = new FormData();
      formData.append("caseId", selectedCaseId);
      formData.append("name", witnessForm.name);
      formData.append("statement", witnessForm.statement);

      if (witnessForm.file) {
        const hash = await sha256FromFile(witnessForm.file);
        formData.append("file", witnessForm.file);
        formData.append("sha256", hash);
      }

      await apiFetch("/api/witnesses", {
        method: "POST",
        body: formData
      });

      addToast("success", "Witness statement recorded.");
      setWitnessForm(DEFAULT_FORM.witnessForm);
      fetchWitnesses(selectedCaseId);
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("witnessAction", false);
    }
  };

  const handleTransferRequest = async () => {
    if (!transferForm.target || !transferForm.reason) {
      addToast("error", "Provide target and reason for transfer.");
      return;
    }

    try {
      setBusyState("transferAction", true);
      const payload = { caseId: selectedCaseId, ...transferForm };
      await apiFetch("/api/cases/transfer-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      addToast("success", "Transfer request submitted.");
      setTransferForm(DEFAULT_FORM.transferForm);
      fetchCases();
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("transferAction", false);
    }
  };

  const handleSendToForensic = async () => {
    if (!forensicForm.instructions.trim()) {
      addToast("error", "Provide forensic instructions.");
      return;
    }

    try {
      setBusyState("forensicAction", true);
      await apiFetch("/api/cases/send-to-forensic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: selectedCaseId,
          instructions: forensicForm.instructions
        })
      });

      addToast("success", "Case sent to forensic.");
      setForensicForm(DEFAULT_FORM.forensicForm);
      fetchCases();
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("forensicAction", false);
    }
  };

  const handleRequestHearing = async () => {
    if (!hearingForm.report.trim()) {
      addToast("error", "Attach final investigation report.");
      return;
    }

    try {
      setBusyState("hearingAction", true);
      await apiFetch("/api/cases/request-hearing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: selectedCaseId,
          report: hearingForm.report
        })
      });

      addToast("success", "Hearing request submitted.");
      setHearingForm(DEFAULT_FORM.hearingForm);
      fetchCases();
    } catch (error) {
      console.error(error);
      addToast("error", error.message);
    } finally {
      setBusyState("hearingAction", false);
    }
  };

  const handleGeoTag = () => {
    if (!navigator.geolocation) {
      addToast("error", "Geolocation is not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setEvidenceForm((prev) => ({
          ...prev,
          geo: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
        }));
        addToast("success", "GPS location captured.");
      },
      () => {
        addToast("error", "Unable to capture GPS location.");
      }
    );
  };

  const handleToggleAiTag = (tag) => {
    setEvidenceForm((prev) => {
      const next = prev.aiTags.includes(tag)
        ? prev.aiTags.filter((item) => item !== tag)
        : [...prev.aiTags, tag];
      return { ...prev, aiTags: next };
    });
  };

  const handleSelectCase = (value) => {
    setSelectedCaseId(value);
    setEvidenceForm(DEFAULT_FORM.evidenceForm);
    setNoteForm(DEFAULT_FORM.noteForm);
    setSuspectForm(DEFAULT_FORM.suspectForm);
    setWitnessForm(DEFAULT_FORM.witnessForm);
  };

  const getStatusStep = (status) =>
    CASE_TIMELINE.findIndex((step) => step === status);

  const isEvidenceLocked = () => selectedCase?.status === "SENT_TO_FORENSIC";

  const tabs = ["Cases", "Evidence", "Investigation", "Communication", "Logs"];

  return (
    <div className="dashboard-shell min-h-screen text-slate-900">
      <div className="absolute inset-0 login-bg-grid" />
      <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-rose-200 page-orb animate-blob" />
      <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-sky-200 page-orb animate-floatSlow" />
      <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-emerald-200 page-orb animate-glowPulse" />

      <div className="relative z-10">
        <DashboardSwitcher />
        <nav className="dashboard-nav animate-fadeInDown text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              JusticeChain Police Command
            </h1>
            <p className="text-sm text-slate-300">
              Digital FIR and Evidence Collection Authority
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={ensureWallet}
              className="rounded-lg bg-emerald-400/90 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-white/20 transition hover:bg-emerald-400"
            >
              {chainState.address ? "Wallet Connected" : "Connect Wallet"}
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-rose-500/90 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-white/20 transition hover:bg-rose-500"
            >
              Logout
            </button>
          </div>
          </div>
        </nav>

        <div className="mx-auto max-w-7xl px-6 py-6 animate-fadeInUp">
        <div className="mb-6 rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.7)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-slate-900">
                Officer: {sessionState?.username}
              </p>
              <p className="text-sm text-slate-500">
                Role: {sessionState?.role} | Wallet: {sessionState?.wallet || "Not linked"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">Chain ID</p>
                <p>{chainState.chainId || "Not connected"}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Role Verified</p>
                <p>{chainState.roleVerified ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {toasts.length > 0 && (
          <div className="fixed right-6 top-20 z-50 space-y-2">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`rounded-xl px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur ${
                  toast.type === "success"
                    ? "bg-emerald-500/95 text-white"
                    : "bg-rose-500/95 text-white"
                }`}
              >
                {toast.message}
              </div>
            ))}
          </div>
        )}

        {activeTab === "Cases" && (
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.7)] backdrop-blur">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  FIR Registration
                </h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Draft or Submit
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Case Title"
                  value={caseForm.title}
                  onChange={(event) =>
                    setCaseForm({ ...caseForm, title: event.target.value })
                  }
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Case Number"
                  value={caseForm.caseNumber}
                  onChange={(event) =>
                    setCaseForm({ ...caseForm, caseNumber: event.target.value })
                  }
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={caseForm.location}
                  onChange={(event) =>
                    setCaseForm({ ...caseForm, location: event.target.value })
                  }
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                />
                <select
                  value={caseForm.priority}
                  onChange={(event) =>
                    setCaseForm({ ...caseForm, priority: event.target.value })
                  }
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="LOW">Priority: Low</option>
                  <option value="MEDIUM">Priority: Medium</option>
                  <option value="HIGH">Priority: High</option>
                  <option value="CRITICAL">Priority: Critical</option>
                </select>
                <textarea
                  placeholder="Case description"
                  value={caseForm.description}
                  onChange={(event) =>
                    setCaseForm({ ...caseForm, description: event.target.value })
                  }
                  className="h-24 w-full rounded border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                />
                <div className="md:col-span-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCreateCase("DRAFT")}
                    disabled={busy.caseAction}
                    className="flex-1 rounded bg-slate-600 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                  >
                    {busy.caseAction ? "Saving..." : "Save Draft"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateCase("SUBMIT")}
                    disabled={busy.caseAction}
                    className="flex-1 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {busy.caseAction ? "Submitting..." : "Submit to Admin"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.7)] backdrop-blur">
                <h3 className="text-base font-semibold text-slate-900">
                  Transfer or Jurisdiction Request
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Submit station transfer or jurisdiction change request.
                </p>
                <div className="mt-4 space-y-3">
                  <select
                    value={transferForm.type}
                    onChange={(event) =>
                      setTransferForm({
                        ...transferForm,
                        type: event.target.value
                      })
                    }
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="STATION">Transfer to Station</option>
                    <option value="JURISDICTION">Jurisdiction Change</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Target station or jurisdiction"
                    value={transferForm.target}
                    onChange={(event) =>
                      setTransferForm({
                        ...transferForm,
                        target: event.target.value
                      })
                    }
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  />
                  <textarea
                    placeholder="Reason for request"
                    value={transferForm.reason}
                    onChange={(event) =>
                      setTransferForm({
                        ...transferForm,
                        reason: event.target.value
                      })
                    }
                    className="h-24 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleTransferRequest}
                    disabled={!selectedCaseId || busy.transferAction}
                    className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {busy.transferAction ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.7)] backdrop-blur">
                <h3 className="text-base font-semibold text-slate-900">
                  Case Status Timeline
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Review progress for selected case.
                </p>
                {!selectedCase ? (
                  <p className="mt-4 text-sm text-slate-400">
                    Select a case to view timeline.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {CASE_TIMELINE.map((stage, index) => {
                      const isActive =
                        getStatusStep(selectedCase.status) >= index;
                      return (
                        <div key={stage} className="flex items-center gap-3">
                          <span
                            className={`h-3 w-3 rounded-full ${
                              isActive ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          />
                          <p
                            className={`text-sm font-semibold ${
                              isActive ? "text-slate-900" : "text-slate-400"
                            }`}
                          >
                            {stage}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.7)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">
                  My Cases
                </h3>
                <select
                  value={selectedCaseId}
                  onChange={(event) => handleSelectCase(event.target.value)}
                  className="rounded border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Select a case</option>
                  {cases.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.caseId} - {item.title}
                    </option>
                  ))}
                </select>
              </div>
              {busy.loading ? (
                <p className="text-sm text-slate-400">Loading cases...</p>
              ) : cases.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No cases yet. Start with FIR registration.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="p-3">Case ID</th>
                        <th className="p-3">Title</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cases.map((item) => (
                        <tr
                          key={item._id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="p-3 font-mono text-xs">
                            {item.caseId}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            {item.title}
                          </td>
                          <td className="p-3">
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              {item.priority}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Evidence" && (
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.7)] backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Evidence Upload
                </h2>
                {isEvidenceLocked() && (
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                    Evidence locked for forensic
                  </span>
                )}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <select
                  value={selectedCaseId}
                  onChange={(event) => handleSelectCase(event.target.value)}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                >
                  <option value="">Select a case</option>
                  {cases.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.caseId} - {item.title}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Evidence Title"
                  value={evidenceForm.title}
                  onChange={(event) =>
                    setEvidenceForm({
                      ...evidenceForm,
                      title: event.target.value
                    })
                  }
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  disabled={isEvidenceLocked()}
                />
                <select
                  value={evidenceForm.type}
                  onChange={(event) =>
                    setEvidenceForm({
                      ...evidenceForm,
                      type: event.target.value
                    })
                  }
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  disabled={isEvidenceLocked()}
                >
                  {EVIDENCE_TYPES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="Evidence description"
                  value={evidenceForm.description}
                  onChange={(event) =>
                    setEvidenceForm({
                      ...evidenceForm,
                      description: event.target.value
                    })
                  }
                  className="h-24 w-full rounded border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                  disabled={isEvidenceLocked()}
                />
                <div className="md:col-span-2">
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*,application/pdf"
                    onChange={(event) =>
                      setEvidenceForm({
                        ...evidenceForm,
                        file: event.target.files[0]
                      })
                    }
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    disabled={isEvidenceLocked()}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Camera capture supported on mobile browsers.
                  </p>
                </div>
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleGeoTag}
                    className="rounded border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Capture GPS
                  </button>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>AI Tags:</span>
                    {AI_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleAiTag(tag)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          evidenceForm.aiTags.includes(tag)
                            ? "bg-slate-900 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                {evidenceForm.geo && (
                  <p className="text-xs text-slate-500 md:col-span-2">
                    GPS: {evidenceForm.geo.lat.toFixed(5)},
                    {evidenceForm.geo.lng.toFixed(5)}
                  </p>
                )}
                <div className="md:col-span-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleUploadEvidence}
                    disabled={busy.evidenceAction || isEvidenceLocked()}
                    className="flex-1 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {busy.evidenceAction ? "Uploading..." : "Upload Evidence"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.7)] backdrop-blur">
              <h3 className="text-base font-semibold text-slate-900">
                Evidence Chain of Custody
              </h3>
              {evidence.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">
                  No evidence uploaded for this case.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {evidence.map((item) => (
                    <div
                      key={item._id}
                      className="rounded border border-slate-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleVerifyEvidence(item._id)}
                          disabled={busy.verifyAction}
                          className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Verify Evidence
                        </button>
                      </div>
                      <div className="mt-2 grid gap-2 text-xs text-slate-500">
                        <p>Uploaded by: {item.uploadedBy || "-"}</p>
                        <p>
                          Uploaded at:{" "}
                          {item.uploadedAt
                            ? new Date(item.uploadedAt).toLocaleString()
                            : "-"}
                        </p>
                        <p>Accessed by: {item.accessedBy || "-"}</p>
                        <p>Verified by: {item.verifiedBy || "-"}</p>
                        <p>SHA-256: {item.sha256 || "-"}</p>
                        <p>IPFS CID: {item.ipfsCid || "-"}</p>
                        <p>Blockchain Tx: {item.blockchainTx || "-"}</p>
                        {verification[item._id] && (
                          <div className="rounded bg-emerald-50 p-2 text-emerald-700">
                            <p>Verified on IPFS</p>
                            <p>Hash matches blockchain</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Investigation" && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
            <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.7)] backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-900">
                Investigation Notes
              </h2>
              <p className="text-sm text-slate-500">
                Daily notes are hashed for integrity.
              </p>
              <div className="mt-4 space-y-3">
                <textarea
                  placeholder="Add daily investigation note"
                  value={noteForm.note}
                  onChange={(event) =>
                    setNoteForm({ note: event.target.value })
                  }
                  className="h-24 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={busy.noteAction || !selectedCaseId}
                  className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {busy.noteAction ? "Saving..." : "Add Note"}
                </button>
              </div>
              <div className="mt-6 space-y-3">
                {notes.map((item) => (
                  <div
                    key={item._id}
                    className="rounded border border-slate-200 p-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {item.note}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.timestamp
                        ? new Date(item.timestamp).toLocaleString()
                        : "-"}
                    </p>
                    <p className="text-xs text-slate-400">Hash: {item.hash}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.7)] backdrop-blur">
                <h3 className="text-base font-semibold text-slate-900">
                  Suspect Management
                </h3>
                <div className="mt-4 grid gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={suspectForm.name}
                    onChange={(event) =>
                      setSuspectForm({ ...suspectForm, name: event.target.value })
                    }
                    className="rounded border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    value={suspectForm.age}
                    onChange={(event) =>
                      setSuspectForm({ ...suspectForm, age: event.target.value })
                    }
                    className="rounded border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={suspectForm.address}
                    onChange={(event) =>
                      setSuspectForm({
                        ...suspectForm,
                        address: event.target.value
                      })
                    }
                    className="rounded border border-slate-200 px-3 py-2 text-sm"
                  />
                  <select
                    value={suspectForm.status}
                    onChange={(event) =>
                      setSuspectForm({
                        ...suspectForm,
                        status: event.target.value
                      })
                    }
                    className="rounded border border-slate-200 px-3 py-2 text-sm"
                  >
                    {SUSPECT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddSuspect}
                    disabled={busy.suspectAction || !selectedCaseId}
                    className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {busy.suspectAction ? "Saving..." : "Add Suspect"}
                  </button>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  {suspects.map((item) => (
                    <div key={item._id} className="rounded bg-slate-50 p-2">
                      {item.name} - {item.status}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.7)] backdrop-blur">
                <h3 className="text-base font-semibold text-slate-900">
                  Witness Statements
                </h3>
                <div className="mt-4 grid gap-3">
                  <input
                    type="text"
                    placeholder="Witness name"
                    value={witnessForm.name}
                    onChange={(event) =>
                      setWitnessForm({ ...witnessForm, name: event.target.value })
                    }
                    className="rounded border border-slate-200 px-3 py-2 text-sm"
                  />
                  <textarea
                    placeholder="Statement"
                    value={witnessForm.statement}
                    onChange={(event) =>
                      setWitnessForm({
                        ...witnessForm,
                        statement: event.target.value
                      })
                    }
                    className="h-24 rounded border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="file"
                    onChange={(event) =>
                      setWitnessForm({
                        ...witnessForm,
                        file: event.target.files[0]
                      })
                    }
                    className="rounded border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddWitness}
                    disabled={busy.witnessAction || !selectedCaseId}
                    className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {busy.witnessAction ? "Saving..." : "Add Witness"}
                  </button>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  {witnesses.map((item) => (
                    <div key={item._id} className="rounded bg-slate-50 p-2">
                      {item.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Communication" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.7)] backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-900">
                Send Case to Forensic
              </h2>
              <p className="text-sm text-slate-500">
                Provide detailed instructions for the forensic lab.
              </p>
              <textarea
                placeholder="Forensic instructions"
                value={forensicForm.instructions}
                onChange={(event) =>
                  setForensicForm({ instructions: event.target.value })
                }
                className="mt-4 h-32 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleSendToForensic}
                disabled={busy.forensicAction || !selectedCaseId}
                className="mt-4 w-full rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy.forensicAction ? "Sending..." : "Send to Forensic"}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.7)] backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-900">
                Request Judge Hearing
              </h2>
              <p className="text-sm text-slate-500">
                Submit final investigation report for judicial review.
              </p>
              <textarea
                placeholder="Final investigation report"
                value={hearingForm.report}
                onChange={(event) =>
                  setHearingForm({ report: event.target.value })
                }
                className="mt-4 h-32 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleRequestHearing}
                disabled={busy.hearingAction || !selectedCaseId}
                className="mt-4 w-full rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {busy.hearingAction ? "Submitting..." : "Request Hearing"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "Logs" && (
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.7)] backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-900">
              Activity Logs
            </h2>
            <p className="text-sm text-slate-500">
              Audit trail of all police actions.
            </p>
            <div className="mt-4 space-y-3">
              {logs.length === 0 ? (
                <p className="text-sm text-slate-400">No activity yet.</p>
              ) : (
                logs.map((item) => (
                  <div
                    key={item._id}
                    className="rounded border border-slate-200 p-3 text-sm text-slate-600"
                  >
                    <p className="font-semibold text-slate-800">
                      {item.action}
                    </p>
                    <p>{item.details}</p>
                    <p className="text-xs text-slate-400">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "-"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

