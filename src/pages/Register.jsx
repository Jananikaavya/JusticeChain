import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/+$/, "");
const API_URL = `${API_BASE_URL}/api/auth`;

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "POLICE"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successRoleId, setSuccessRoleId] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    
    try {
      // Call register API
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Show success message instead of alert
      setSuccess(true);
      setSuccessRoleId(data.user.roleId);
      
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "POLICE"
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
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
                Create secure access to the justice ledger.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Register your role, receive a unique ID, and join the tamper-proof workflow trusted by agencies.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-full px-4 py-2 login-chip">Verified identity</span>
                <span className="rounded-full px-4 py-2 login-chip">Role-based access</span>
                <span className="rounded-full px-4 py-2 login-chip">Chain-of-custody ready</span>
              </div>
            </div>

            <div className="login-card login-sheen rounded-3xl p-8 shadow-xl animate-fadeInUp">
              <div className="flex items-center justify-between">
                <h3 className="login-title text-2xl font-bold text-slate-900">Register</h3>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  New Account
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Create your account and receive a Role ID for secure login.
              </p>

              {success && (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <h4 className="text-emerald-800 font-semibold mb-2">Registration successful.</h4>
                  <p className="text-emerald-700 text-sm mb-3">Check your email for your Role ID.</p>
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-200 mb-3">
                    <p className="text-xs text-slate-500">Your Role ID:</p>
                    <p className="text-lg font-bold text-emerald-700">{successRoleId}</p>
                  </div>
                  <p className="text-emerald-700 text-xs">Redirecting you to login...</p>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!success && (
                <>
                  <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-slate-700">
                    <strong>Tip:</strong> You will need MetaMask during login. Make sure it is installed.
                  </div>

                  <form onSubmit={handleRegister} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-2">Username</label>
                      <input
                        type="text"
                        name="username"
                        placeholder="Choose a username"
                        className="login-input w-full rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none"
                        value={formData.username}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        placeholder="your.email@example.com"
                        className="login-input w-full rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                      <p className="text-xs text-slate-500 mt-1">Role ID will be sent to this email.</p>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-2">Select Your Role</label>
                      <select
                        name="role"
                        className="login-input w-full rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none"
                        value={formData.role}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        <option value="POLICE">Police</option>
                        <option value="FORENSIC">Forensic Officer</option>
                        <option value="JUDGE">Judge</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-1">A unique Role ID will be generated for you.</p>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-2">Password</label>
                      <input
                        type="password"
                        name="password"
                        placeholder="Enter password (min 6 characters)"
                        className="login-input w-full rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-2">Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm password"
                        className="login-input w-full rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="login-button w-full rounded-2xl py-3 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Registering..." : "Register"}
                    </button>

                    <p className="text-center text-sm text-slate-600">
                      Already have an account?{" "}
                      <span
                        onClick={() => !loading && navigate("/login")}
                        className="cursor-pointer font-semibold text-sky-700 hover:underline"
                      >
                        Login here
                      </span>
                    </p>

                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      disabled={loading}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-50"
                    >
                      Back to Home
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

