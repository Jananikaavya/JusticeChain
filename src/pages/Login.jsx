import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WalletConnect from "../components/WalletConnect";
import { setSession, verifyRoleOnBlockchain } from "../utils/auth";

const ADMIN_WALLET = "0x7f1F93f7d1F58AC2644A28b74bd3063123C25CdD"; // Admin wallet address
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/+$/, "");
const API_URL = `${API_BASE_URL}/api/auth`;

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [wallet, setWallet] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Update isAdmin state when wallet changes
  useEffect(() => {
    if (wallet) {
      // Normalize both addresses to lowercase for comparison
      const normalizedWallet = wallet.toLowerCase();
      const normalizedAdmin = ADMIN_WALLET.toLowerCase();
      
      console.log("Connected Wallet:", normalizedWallet);
      console.log("Admin Wallet:", normalizedAdmin);
      console.log("Match:", normalizedWallet === normalizedAdmin);
      
      if (normalizedWallet === normalizedAdmin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }
  }, [wallet]);

  const handleLogin = async () => {
    setError("");

    // 1. Wallet must be connected
    if (!wallet) {
      setError("Please connect MetaMask");
      return;
    }

    // Normalize addresses for comparison
    const normalizedWallet = wallet.toLowerCase();
    const normalizedAdmin = ADMIN_WALLET.toLowerCase();

    // 2. Admin login (wallet only, no username/password needed)
    if (normalizedWallet === normalizedAdmin) {
      setSession({ role: "ADMIN", wallet, username: "Admin" });
      navigate("/dashboard/admin");
      return;
    }

    // 3. Normal user login (username and password required)
    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          wallet
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setSession({ ...data.user, token: data.token });

      // Verify role on blockchain
      setVerifying(true);
      const verification = await verifyRoleOnBlockchain(data.user.wallet, data.user.role);
      setVerifying(false);

      if (!verification.verified) {
        console.warn("⚠️ Role verification warning:", verification.error);
        // Don't block login, but warn user
      }

      // Redirect by role
      if (data.user.role === "ADMIN") navigate("/dashboard/admin");
      else if (data.user.role === "POLICE") navigate("/dashboard/police");
      else if (data.user.role === "FORENSIC") navigate("/dashboard/forensic");
      else if (data.user.role === "JUDGE") navigate("/dashboard/judge");
      else navigate("/");

    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen login-screen relative overflow-hidden">
      <div className="absolute inset-0 login-bg-grid" />
      <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-rose-200 login-orb animate-blob" />
      <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-sky-200 login-orb animate-floatSlow" />
      <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-emerald-200 login-orb animate-glowPulse" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="flex flex-col justify-center text-slate-900 animate-fadeInDown">
              <span className="inline-flex w-fit items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700 login-chip">
                Justice Chain
              </span>
              <h2 className="login-title mt-6 text-4xl font-bold leading-tight sm:text-5xl">
                Secure, traceable access for modern investigations.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Connect your wallet, verify your role, and enter the command center with a tamper-proof identity trail.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-full px-4 py-2 login-chip">Blockchain audit trail</span>
                <span className="rounded-full px-4 py-2 login-chip">Role-based access</span>
                <span className="rounded-full px-4 py-2 login-chip">Encrypted sessions</span>
              </div>
            </div>

            <div className="login-card login-sheen rounded-3xl p-8 shadow-xl animate-fadeInUp">
              <div className="flex items-center justify-between">
                <h3 className="login-title text-2xl font-bold text-slate-900">Login</h3>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Secure Access
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Use your wallet for admin access or enter credentials for assigned roles.
              </p>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-slate-700">
                <strong>Admin:</strong> Connect your admin wallet (no username or password needed).
              </div>

              <div className="mt-6 space-y-4">
                {!isAdmin && (
                  <>
                    <input
                      type="text"
                      placeholder="Username"
                      className="login-input w-full rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                    />

                    <input
                      type="password"
                      placeholder="Password"
                      className="login-input w-full rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />

                    <input
                      type="text"
                      placeholder="Role ID (from registration email)"
                      className="login-input w-full rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none"
                      value={roleId}
                      onChange={(e) => setRoleId(e.target.value)}
                      disabled={loading}
                    />
                  </>
                )}

                <WalletConnect onConnect={setWallet} />

                {wallet && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="mb-2 break-all text-xs text-slate-600">
                      <strong>Connected:</strong> {wallet}
                    </p>
                    {isAdmin ? (
                      <p className="text-sm font-semibold text-emerald-700">Admin wallet detected.</p>
                    ) : (
                      <p className="text-sm text-orange-700">Regular user wallet.</p>
                    )}
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="login-button w-full rounded-2xl py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

                <p className="text-center text-sm text-slate-600">
                  New user?{" "}
                  <span
                    onClick={() => navigate("/register")}
                    className="cursor-pointer font-semibold text-sky-700 hover:underline"
                  >
                    Register here
                  </span>
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

