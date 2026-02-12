import { useNavigate } from "react-router-dom";
import { getSession, clearSession } from "../utils/auth";
import DashboardSwitcher from "../components/DashboardSwitcher";

export default function LawyerDashboard() {
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardSwitcher />
      <nav className="bg-purple-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Lawyer Dashboard</h1>
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
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold mb-2">⚖️ Active Cases</h3>
              <p className="text-3xl font-bold text-purple-600">7</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold mb-2">✅ Won Cases</h3>
              <p className="text-3xl font-bold text-green-600">5</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-2">📄 Documents</h3>
              <p className="text-3xl font-bold text-blue-600">23</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">My Cases</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-300 p-2">Case ID</th>
                    <th className="border border-gray-300 p-2">Status</th>
                    <th className="border border-gray-300 p-2">Client</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2">CASE_LP001</td>
                    <td className="border border-gray-300 p-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </td>
                    <td className="border border-gray-300 p-2">John Doe</td>
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
