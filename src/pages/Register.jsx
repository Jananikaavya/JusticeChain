import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = 'http://localhost:5000/api/auth';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-600">
          Justice Chain
        </h2>
        <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Register
        </h3>

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg">
            <h4 className="text-green-800 font-bold mb-2">✅ Registration Successful!</h4>
            <p className="text-green-700 text-sm mb-3">Check your email for your Role ID</p>
            <div className="bg-white p-3 rounded border border-green-300 mb-3">
              <p className="text-xs text-gray-600">Your Role ID:</p>
              <p className="text-lg font-bold text-green-700">{successRoleId}</p>
            </div>
            <p className="text-green-700 text-xs">You will be redirected to login in a moment...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {!success && (
          <>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>💡 Tip:</strong> You'll need MetaMask wallet to connect during login. Make sure you have it installed!
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              placeholder="Choose a username"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="your.email@example.com"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Role ID will be sent to this email</p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Select Your Role
            </label>
            <select
              name="role"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              
              <option value="POLICE">Police</option>
              <option value="FORENSIC">Forensic Officer</option>
              <option value="JUDGE">Judge</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">A unique Role ID will be generated for you</p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter password (min 6 characters)"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registering..." : "Register"}
          </button>

          <p className="text-center text-gray-600 text-sm">
            Already have an account?{" "}
            <span
              onClick={() => !loading && navigate("/login")}
              className="text-blue-600 cursor-pointer hover:underline font-semibold"
            >
              Login here
            </span>
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            disabled={loading}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition disabled:opacity-50"
          >
            Back to Home
          </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

