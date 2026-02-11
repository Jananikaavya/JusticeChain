import { useNavigate } from "react-router-dom";
import { getSession, clearSession } from "../utils/auth";

export default function PoliceDashboard() {
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Police Dashboard</h1>
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
          <h2 className="text-xl font-bold mb-4">Welcome, {session?.username}</h2>
          <p className="text-gray-600 mb-4">Role ID: {session?.roleId}</p>
          <p className="text-gray-600 mb-4">Wallet: {session?.wallet?.slice(0, 10)}...</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-2">📋 Filed Cases</h3>
              <p className="text-3xl font-bold text-blue-600">12</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold mb-2">✅ Resolved Cases</h3>
              <p className="text-3xl font-bold text-green-600">8</p>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h3 className="text-lg font-semibold mb-2">⏳ Pending Cases</h3>
              <p className="text-3xl font-bold text-yellow-600">4</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Recent Cases</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-300 p-2">Case ID</th>
                    <th className="border border-gray-300 p-2">Status</th>
                    <th className="border border-gray-300 p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2">CASE_001</td>
                    <td className="border border-gray-300 p-2">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                    </td>
                    <td className="border border-gray-300 p-2">2026-02-11</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
