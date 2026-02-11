import { useNavigate } from "react-router-dom";
import { getSession, clearSession } from "../utils/auth";

export default function JudgeDashboard() {
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-red-700 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Judge Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-800 px-4 py-2 rounded"
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
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h3 className="text-lg font-semibold mb-2">📋 Cases to Review</h3>
              <p className="text-3xl font-bold text-red-600">9</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold mb-2">✅ Completed</h3>
              <p className="text-3xl font-bold text-green-600">45</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-2">⏳ In Progress</h3>
              <p className="text-3xl font-bold text-blue-600">12</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Cases Pending Review</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-300 p-2">Case ID</th>
                    <th className="border border-gray-300 p-2">Type</th>
                    <th className="border border-gray-300 p-2">Filed Date</th>
                    <th className="border border-gray-300 p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2">CASE_J001</td>
                    <td className="border border-gray-300 p-2">Criminal</td>
                    <td className="border border-gray-300 p-2">2026-02-10</td>
                    <td className="border border-gray-300 p-2">
                      <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                        Review
                      </button>
                    </td>
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
