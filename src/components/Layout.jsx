import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/services', label: 'Services' },
    { to: '/contact', label: 'Contact' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50 border-b-2 border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              <span className="text-3xl">⚖️</span>
              <span>Justice Chain</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive(link.to)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-blue-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive(link.to)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-800 to-blue-900 text-white mt-16 border-t border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <span className="text-2xl sm:text-3xl">⚖️</span>
                Justice Chain
              </h3>
              <p className="text-blue-100 text-xs sm:text-sm">
                Blockchain-based justice system ensuring transparency and trust in legal proceedings.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-base sm:text-lg font-semibold text-blue-400">Quick Links</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                {navLinks.map((link) => (
                  <li key={link.to}>
                    <Link 
                      to={link.to}
                      className="text-blue-100 hover:text-white transition-colors"
                    >
                      → {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-base sm:text-lg font-semibold text-blue-400">Contact</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-blue-100">
                <li>📧 Email: info@justicechain.com</li>
                <li>📱 Phone: +1 (555) 123-4567</li>
                <li>📍 Location: New York, NY</li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-blue-700 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-blue-100 text-xs sm:text-sm text-center sm:text-left">
                &copy; 2026 Justice Chain. All rights reserved.
              </p>
              <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm flex-wrap justify-center">
                <a href="#" className="text-blue-100 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="text-blue-100 hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="text-blue-100 hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
