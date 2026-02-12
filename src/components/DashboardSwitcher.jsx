import { useNavigate } from 'react-router-dom';
import { getSession, clearSession } from '../utils/auth';

/**
 * DashboardSwitcher Component
 * 
 * This component provides role-based dashboard access.
 * It shows available dashboards based on the current user's role.
 * 
 * How it works:
 * 1. User logs in with any role (ADMIN, POLICE, LAWYER, FORENSIC, JUDGE)
 * 2. ProtectedRoute ensures only authenticated users can access dashboards
 * 3. Each dashboard is restricted to its specific role
 * 4. This switcher helps navigate between dashboards (for testing)
 */

const DashboardSwitcher = () => {
  const navigate = useNavigate();
  const session = getSession();

  // Only show switcher for ADMIN users
  if (session?.role !== 'ADMIN') {
    return null;
  }

  const dashboards = [
    { role: 'ADMIN', name: '🛡️ Admin Dashboard', path: '/dashboard/admin' },
    { role: 'POLICE', name: '👮 Police Dashboard', path: '/dashboard/police' },
    { role: 'LAWYER', name: '⚖️ Lawyer Dashboard', path: '/dashboard/lawyer' },
    { role: 'FORENSIC', name: '🔬 Forensic Dashboard', path: '/dashboard/forensic' },
    { role: 'JUDGE', name: '🏛️ Judge Dashboard', path: '/dashboard/judge' }
  ];

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="fixed top-0 right-0 bg-white shadow-lg rounded-bl-lg p-4 z-50">
      <div className="text-sm font-semibold mb-3">
        Logged in as: <span className="text-blue-600">{session?.role}</span>
      </div>
      
      <div className="space-y-2 mb-4 border-b pb-4">
        <p className="text-xs text-gray-600 font-semibold">Dashboard Access:</p>
        {dashboards.map((dashboard) => (
          <button
            key={dashboard.role}
            onClick={() => navigate(dashboard.path)}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
              session?.role === dashboard.role
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {dashboard.name}
          </button>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition"
      >
        Logout
      </button>
    </div>
  );
};

export default DashboardSwitcher;
