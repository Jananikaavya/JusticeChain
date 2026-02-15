import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { config, projectId } from './utils/walletConfig'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { getSession } from './utils/auth'

// Public Pages
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import Contact from './pages/Contact'

// Auth Pages
import Login from './pages/Login'
import Register from './pages/Register'

// Dashboard Pages
import AdminDashboard from './pages/AdminDashboard'
import PoliceDashboard from './pages/PoliceDashboard'
import ForensicDashboard from './pages/ForensicDashboard'
import JudgeDashboard from './pages/JudgeDashboard'

// Setup queryClient
const queryClient = new QueryClient()

// Create Web3Modal
createWeb3Modal({
  wagmiConfig: config,
  projectId
})

function App() {
  const DashboardRedirect = () => {
    const session = getSession();
    if (!session) {
      return <Navigate to="/login" replace />;
    }

    switch (session.role) {
      case "ADMIN":
        return <Navigate to="/dashboard/admin" replace />;
      case "POLICE":
        return <Navigate to="/dashboard/police" replace />;
      case "FORENSIC":
        return <Navigate to="/dashboard/forensic" replace />;
      case "JUDGE":
        return <Navigate to="/dashboard/judge" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  };

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Routes with Layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            {/* Auth Routes (No Layout) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* Protected Dashboard Routes */}
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/police"
              element={
                <ProtectedRoute allowedRole="POLICE">
                  <PoliceDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/forensic"
              element={
                <ProtectedRoute allowedRole="FORENSIC">
                  <ForensicDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/judge"
              element={
                <ProtectedRoute allowedRole="JUDGE">
                  <JudgeDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
