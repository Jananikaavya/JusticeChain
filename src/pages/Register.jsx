import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Generate unique Role ID based on role and timestamp
const generateRoleId = (role) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const rolePrefix = role.toUpperCase().substring(0, 4);
  return `${rolePrefix}_${timestamp}_${random}`;
};

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "LAWYER"
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      alert("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    
    // Generate Role ID automatically
    const roleId = generateRoleId(formData.role);
    
    // Simulate registration
    setTimeout(() => {
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        roleId: roleId,
        wallet: null
      };
      
      // Store by username (for login)
      localStorage.setItem(formData.username, JSON.stringify(userData));
      
      alert(`Registration successful!\n\nYour Role ID: ${roleId}\n\nPlease save this ID for login. You can now login with your username and password.`);
      setLoading(false);
      navigate("/login");
    }, 1000);
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
              required
            />
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
            >
              <option value="LAWYER">Lawyer</option>
              <option value="JUDGE">Judge</option>
              <option value="POLICE">Police</option>
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
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>

          <p className="text-center text-gray-600 text-sm">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-blue-600 cursor-pointer hover:underline font-semibold"
            >
              Login here
            </span>
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
          >
            Back to Home
          </button>
        </form>
      </div>
    </div>
  );
}

