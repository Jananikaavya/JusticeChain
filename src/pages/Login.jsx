import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WalletConnect from "../components/WalletConnect";
import { setSession } from "../utils/auth";

const ADMIN_WALLET = "0x7f1F93f7d1F58AC2644A28b74bd3063123C25CdD"; // Admin wallet address

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [wallet, setWallet] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

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

  const handleLogin = () => {
    // 1. Wallet must be connected
    if (!wallet) {
      alert("Please connect MetaMask");
      return;
    }

    // Normalize addresses for comparison
    const normalizedWallet = wallet.toLowerCase();
    const normalizedAdmin = ADMIN_WALLET.toLowerCase();

    // 2. Admin login (wallet only, no username/password needed)
    if (normalizedWallet === normalizedAdmin) {
      setSession({ role: "ADMIN", wallet, username: "Admin" });
      navigate("/admin");
      return;
    }

    // 3. Normal user login (username and password required)
    if (!username || !password) {
      alert("Please enter username and password");
      return;
    }

    const data = localStorage.getItem(username);

    if (!data) {
      alert("User not found");
      return;
    }

    const user = JSON.parse(data);

    // 4. Validate credentials (password and wallet must match)
    if (user.password === password && user.wallet === wallet) {
      // 5. Set session after success
      setSession(user);

      // 6. Redirect by role
      if (user.role === "POLICE") navigate("/dashboard/police");
      if (user.role === "LAWYER") navigate("/dashboard/lawyer");
      if (user.role === "JUDGE") navigate("/dashboard/judge");
    } else {
      alert("Invalid username, password, or wallet");
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
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Login
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

