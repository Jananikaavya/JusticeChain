import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

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
import LawyerDashboard from './pages/LawyerDashboard'
import ForensicDashboard from './pages/ForensicDashboard'
import JudgeDashboard from './pages/JudgeDashboard'

function App() {
  return (
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
          path="/dashboard/lawyer"
          element={
            <ProtectedRoute allowedRole="LAWYER">
              <LawyerDashboard />
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
  )
}

export default App
