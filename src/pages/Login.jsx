import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WalletConnect from "../components/WalletConnect";
import { setSession } from "../utils/auth";

const ADMIN_WALLET = "0x7f1F93f7d1F58AC2644A28b74bd3063123C25CdD"; // Admin wallet address
const API_URL = 'http://localhost:5000/api/auth';

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [wallet, setWallet] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      
      setSession(data.user);

      // Redirect by role
      if (data.user.role === "ADMIN") navigate("/dashboard/admin");
      else if (data.user.role === "POLICE") navigate("/dashboard/police");
      else if (data.user.role === "LAWYER") navigate("/dashboard/lawyer");
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-2 text-center text-blue-600">
          Justice Chain
        </h2>
        <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Login
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            <strong>Admin:</strong> Connect your admin wallet (no username/password needed)
          </p>
        </div>

        <div className="space-y-4">
          {!isAdmin && (
            <>
              <input
                type="text"
                placeholder="Username"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />

              <input
                type="text"
                placeholder="Role ID (from registration email)"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                disabled={loading}
              />
            </>
          )}

          <WalletConnect onConnect={setWallet} />

          {wallet && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-gray-600 break-all mb-2">
                <strong>Connected:</strong> {wallet}
              </p>
              {isAdmin ? (
                <p className="text-sm text-green-700 font-semibold">✓ Admin wallet detected!</p>
              ) : (
                <p className="text-sm text-orange-700">Regular user wallet</p>
              )}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-center text-gray-600 text-sm">
            New user?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-blue-600 cursor-pointer hover:underline font-semibold"
            >
              Register here
            </span>
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

