import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Home() {
  const navigate = useNavigate()
  const [searchCaseId, setSearchCaseId] = useState('')
  const [caseStatus, setCaseStatus] = useState('')
  const [selectedState, setSelectedState] = useState(null)
  const [activityFeed] = useState([
    { id: 1, action: 'FIR registered in Chennai', time: '2 mins ago', icon: '📝' },
    { id: 2, action: 'Evidence uploaded in Coimbatore', time: '5 mins ago', icon: '📦' },
    { id: 3, action: 'Forensic report completed in Madurai', time: '8 mins ago', icon: '🔬' },
    { id: 4, action: 'Judge reviewed Case #2041', time: '12 mins ago', icon: '⚖️' },
    { id: 5, action: 'Blockchain seal confirmed in Bangalore', time: '15 mins ago', icon: '⛓️' },
    { id: 6, action: 'Evidence verified in Delhi', time: '18 mins ago', icon: '✓' },
  ])

  const stateData = [
    { state: 'Tamil Nadu', cases: 245, evidence: 1240, labs: 8 },
    { state: 'Karnataka', cases: 198, evidence: 956, labs: 6 },
    { state: 'Maharashtra', cases: 312, evidence: 1580, labs: 10 },
    { state: 'Delhi', cases: 287, evidence: 1420, labs: 9 },
    { state: 'Gujarat', cases: 156, evidence: 780, labs: 5 },
    { state: 'Telangana', cases: 189, evidence: 890, labs: 6 },
  ]

  const metrics = [
    { label: 'Avg Resolution', value: '45 Days', icon: '📊' },
    { label: 'Verification Rate', value: '99.8%', icon: '✓' },
    { label: 'Processing Speed', value: '24 hrs', icon: '⚡' },
    { label: 'Review Rate', value: '94%', icon: '⚖️' },
  ]

  const roles = [
    { name: 'Police Terminal', icon: '👮', color: 'from-blue-500 to-blue-600' },
    { name: 'Forensic Terminal', icon: '🔬', color: 'from-purple-500 to-purple-600' },
    { name: 'Judge Terminal', icon: '⚖️', color: 'from-red-500 to-red-600' },
    { name: 'Admin Terminal', icon: '🛡️', color: 'from-gray-700 to-gray-800' },
  ]

  const handleSearchCase = () => {
    if (searchCaseId.trim()) {
      setCaseStatus(`Case #${searchCaseId} - Status: Under Forensic Review | Evidence: Verified | Next: Judicial Review`)
    }
  }

  return (
    <div className="space-y-12 pb-12">
      {/* ========== 1. OPENING SECTION - HERO ========== */}
      <section className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white py-16 sm:py-20 md:py-24 lg:py-32 rounded-2xl shadow-2xl text-center animate-slideInUp px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 md:mb-8 leading-tight">
          Code for truth. Chain for trust.System for justice
        </h2>
        <p className="text-lg sm:text-xl md:text-2xl text-blue-100 mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed">
         “When evidence is tamper-proof, truth becomes permanent.” JusticeChain ensures justice is never corrupted, always transparent, and permanently verifiable.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
          <button
            onClick={() => navigate('/login')}
            className="bg-white text-blue-600 px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-blue-50 transition transform hover:scale-105 active:scale-95 shadow-lg w-full sm:w-auto"
          >
            🔐 Access System
          </button>
        </div>
      </section>

      {/* ========== 2. ROLE ACCESS GATEWAY - TERMINAL STYLE ========== */}
      <section className="space-y-4 animate-fadeInDown px-4 sm:px-6" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8 sm:mb-12">Choose Your Terminal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {roles.map((role, idx) => (
            <button
              key={idx}
              onClick={() => navigate('/login')}
              className={`group bg-gradient-to-br ${role.color} text-white p-6 sm:p-8 md:p-10 rounded-2xl hover:shadow-2xl transition-all transform hover:scale-110 hover:-translate-y-2 active:scale-95 duration-300 relative overflow-hidden animate-slideInUp border border-opacity-20 border-white`}
              style={{ animationDelay: `${0.5 + idx * 0.12}s` }}
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4 group-hover:scale-125 transition-transform duration-300">{role.icon}</div>
                <p className="font-bold text-base sm:text-lg group-hover:text-xl transition-all duration-300">{role.name}</p>
                <div className="mt-3 h-1 w-0 group-hover:w-full bg-white transition-all duration-300 mx-auto"></div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ========== 3. JUSTICE ACTIVITY FEED - VERTICAL TIMELINE ========== */}
      <section className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-xl p-6 sm:p-8 md:p-10 animate-slideInUp px-4 sm:px-6" style={{ animationDelay: '0.95s' }}>
        <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl">⚡</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Live Justice Activity</h2>
        </div>
        
        <div className="relative">
          <div className="absolute left-3 sm:left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-blue-300"></div>
          
          <div className="space-y-3 sm:space-y-4 pl-3 sm:pl-6">
            {activityFeed.map((item, idx) => (
              <div key={item.id} className="group relative animate-slideInUp" style={{ animationDelay: `${1.0 + idx * 0.08}s` }}>
                <div className="absolute -left-6 sm:-left-9 top-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 border-3 sm:border-4 border-white group-hover:scale-125 transition-transform duration-300"></div>
                
                <div className="bg-white p-3 sm:p-4 md:p-5 rounded-xl border-2 border-transparent group-hover:border-blue-600 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer transform group-hover:translate-x-2">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className="text-2xl sm:text-3xl group-hover:scale-125 transition-transform duration-300 flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-bold text-sm sm:text-base break-words">{item.action}</p>
                      <p className="text-gray-500 text-xs mt-1">⏰ {item.time}</p>
                    </div>
                    <span className="text-blue-600 font-bold text-xl group-hover:scale-150 transition-transform duration-300">✓</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 4. LIVE JUSTICE MAP - ENHANCED GRID ========== */}
      <section className="space-y-6 sm:space-y-8 animate-fadeInDown px-4 sm:px-6" style={{ animationDelay: '1.4s' }}>
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl">🗺️</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Live Justice Map</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stateData.map((data, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedState(data)}
              className="group relative animate-slideInUp"
              style={{ animationDelay: `${1.45 + idx * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-300 -z-10"></div>
              
              <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl border-2 border-gray-200 group-hover:border-purple-600 cursor-pointer transition-all duration-300 transform group-hover:scale-105 group-hover:-translate-y-1 shadow-lg hover:shadow-2xl">
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{data.state}</h3>
                  <span className="text-2xl sm:text-3xl group-hover:scale-125 transition-transform duration-300">📍</span>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition">
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">Cases</span>
                    <span className="text-xl sm:text-2xl font-bold text-blue-600">{data.cases}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition">
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">Evidence</span>
                    <span className="text-xl sm:text-2xl font-bold text-purple-600">{data.evidence}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition">
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">Labs</span>
                    <span className="text-xl sm:text-2xl font-bold text-red-600">{data.labs}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedState && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-5 sm:p-6 md:p-8 rounded-2xl border-l-4 border-purple-600 animate-slideInUp shadow-xl">
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <span className="text-3xl sm:text-4xl">📊</span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 font-semibold">STATE OVERVIEW</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{selectedState.state}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-4 sm:mt-6">
              <div className="text-center">
                <p className="text-lg sm:text-xl font-bold text-blue-600">{selectedState.cases}</p>
                <p className="text-xs text-gray-600 mt-1">Cases</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-xl font-bold text-purple-600">{selectedState.evidence}</p>
                <p className="text-xs text-gray-600 mt-1">Evidence</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-xl font-bold text-red-600">{selectedState.labs}</p>
                <p className="text-xs text-gray-600 mt-1">Labs</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========== 5. CASE CONTROL PANEL - MODERN LAYOUT ========== */}
      <section className="bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 text-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8 animate-slideInUp px-4 sm:px-6" style={{ animationDelay: '2.2s' }}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-bold text-lg sm:text-xl">🎛️</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Case Control Panel</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Search Case - Large */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 group">
            <label className="text-xs sm:text-sm font-semibold text-blue-300">🔍 Search Case ID</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="text"
                placeholder="Enter Case ID (e.g., 1024)..."
                value={searchCaseId}
                onChange={(e) => setSearchCaseId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchCase()}
                className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl text-gray-900 font-mono text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-blue-400 bg-white transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/50"
              />
              <button onClick={handleSearchCase} className="bg-gradient-to-r from-blue-500 to-blue-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105 active:scale-95 text-sm sm:text-base w-full sm:w-auto">
                🔎 Search
              </button>
            </div>
            {caseStatus && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 sm:p-4 rounded-xl text-white border border-green-400 animate-slideInUp shadow-lg text-sm sm:text-base">
                <p className="font-semibold">✓ {caseStatus}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-3 sm:space-y-4">
            <label className="text-xs sm:text-sm font-semibold text-blue-300">⚡ Quick Actions</label>
            <div className="space-y-2 sm:space-y-3">
              <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 hover:shadow-2xl hover:shadow-blue-500/50 text-sm sm:text-base">
                ✓ Verify Evidence
              </button>
              <button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 hover:shadow-2xl hover:shadow-purple-500/50 text-sm sm:text-base">
                📋 Audit Trail
              </button>
              <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 hover:shadow-2xl hover:shadow-green-500/50 text-sm sm:text-base">
                📍 Track Case
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 6. INTEGRITY MONITOR - STATUS DASHBOARD ========== */}
      <section className="space-y-6 sm:space-y-8 animate-fadeInDown px-4 sm:px-6" style={{ animationDelay: '2.55s' }}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl">🛡️</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">System Integrity Monitor</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: 'Blockchain Status', value: '✓ Active', color: 'from-green-50 to-emerald-50', dotColor: 'bg-green-600', icon: '⛓️' },
            { label: 'Data Integrity', value: '100%', color: 'from-green-50 to-emerald-50', dotColor: 'bg-green-600', icon: '📊' },
            { label: 'Tampering Attempts', value: '0', color: 'from-red-50 to-rose-50', dotColor: 'bg-red-600', icon: '⚠️' },
            { label: 'Unauthorized Access', value: 'Blocked', color: 'from-blue-50 to-cyan-50', dotColor: 'bg-blue-600', icon: '🔒' },
          ].map((stat, idx) => (
            <div key={idx} className="group animate-slideInUp" style={{ animationDelay: `${2.6 + idx * 0.1}s` }}>
              <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-300 -z-10"></div>
              
              <div className={`bg-gradient-to-br ${stat.color} p-5 sm:p-6 md:p-8 rounded-2xl border-2 border-gray-200 group-hover:border-gray-600 transition-all duration-300 transform group-hover:scale-105 group-hover:-translate-y-2 shadow-lg hover:shadow-2xl relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-1 h-full ${stat.dotColor} opacity-0 group-hover:opacity-100 transition duration-300`}></div>
                
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-2">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 group-hover:text-gray-700 transition">{stat.value}</p>
                  </div>
                  <span className="text-2xl sm:text-3xl group-hover:scale-125 transition-transform duration-300 flex-shrink-0">{stat.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== 7. PERFORMANCE METRICS - CARD LAYOUT ========== */}
      <section className="space-y-6 sm:space-y-8 animate-fadeInDown px-4 sm:px-6" style={{ animationDelay: '3.0s' }}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl">📈</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Performance Metrics</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {metrics.map((metric, idx) => (
            <div key={idx} className="group relative animate-slideInUp" style={{ animationDelay: `${3.05 + idx * 0.1}s` }}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-yellow-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-300 -z-10"></div>
              
              <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl border-2 border-gray-200 group-hover:border-orange-600 transition-all duration-300 transform group-hover:scale-105 group-hover:-translate-y-2 shadow-lg hover:shadow-2xl text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-yellow-50 opacity-0 group-hover:opacity-100 transition duration-300 -z-10"></div>
                
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 group-hover:scale-125 transition-transform duration-300">{metric.icon}</div>
                <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 sm:mb-3 group-hover:text-gray-700 transition">{metric.label}</p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">{metric.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

