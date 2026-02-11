import { useNavigate } from "react-router-dom";
import { getSession, clearSession } from "../utils/auth";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-900 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="p-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">System Administration</h2>
          <p className="text-gray-600 mb-4">Admin Wallet: {session?.wallet}</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-2">👥 Total Users</h3>
              <p className="text-3xl font-bold text-blue-600">156</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold mb-2">📋 Total Cases</h3>
              <p className="text-3xl font-bold text-green-600">432</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold mb-2">✅ Completed</h3>
              <p className="text-3xl font-bold text-purple-600">287</p>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h3 className="text-lg font-semibold mb-2">⏳ Pending</h3>
              <p className="text-3xl font-bold text-yellow-600">145</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Admin Functions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg font-semibold">
                Manage Users
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg font-semibold">
                Manage Cases
              </button>
              <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg font-semibold">
                View Audit Logs
              </button>
              <button className="bg-yellow-600 hover:bg-yellow-700 text-white p-4 rounded-lg font-semibold">
                System Settings
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
              <p className="text-gray-600">System is operating normally</p>
              <p className="text-gray-600 text-sm mt-2">Last updated: 2026-02-11 10:30 AM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
