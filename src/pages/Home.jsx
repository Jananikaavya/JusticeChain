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
    <div className="page-shell">
      <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-rose-200 page-orb animate-blob" />
      <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-sky-300 page-orb animate-floatSlow" />
      <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-emerald-300 page-orb animate-glowPulse" />

      <div className="relative z-10 space-y-12 pb-12">
        <section className="page-hero animate-slideInUp">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="page-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
                JusticeChain Platform
              </span>
              <h2 className="page-section-title mt-6 text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                Code for truth. Chain for trust. System for justice.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                When evidence is tamper-proof, truth becomes permanent. JusticeChain ensures justice is transparent, authenticated, and always verifiable.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="page-button-primary rounded-2xl px-6 py-3 text-sm font-semibold text-white transition"
                >
                  Access System
                </button>
                <button
                  onClick={() => navigate('/services')}
                  className="page-button-secondary rounded-2xl px-6 py-3 text-sm font-semibold text-slate-700 transition"
                >
                  Explore Services
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="page-card p-4 text-center">
                  <div className="text-3xl mb-2">{metric.icon}</div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
                  <p className="text-xl font-bold text-slate-800 mt-2">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6 animate-fadeInDown" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="page-section-title text-2xl sm:text-3xl font-bold text-slate-900">Choose Your Terminal</h2>
            <span className="page-chip rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Role Access
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role, idx) => (
              <button
                key={idx}
                onClick={() => navigate('/login')}
                className="page-card group p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                style={{ animationDelay: `${0.5 + idx * 0.12}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-3xl">{role.icon}</div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Terminal</span>
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-900">{role.name}</p>
                <div className="mt-4 h-1 w-10 bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-300 group-hover:w-16" />
              </button>
            ))}
          </div>
        </section>

        <section className="page-card page-card-strong p-6 sm:p-8 animate-slideInUp" style={{ animationDelay: '0.95s' }}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white text-lg">⚡</div>
              <h2 className="page-section-title text-2xl sm:text-3xl font-bold text-slate-900">Live Justice Activity</h2>
            </div>
            <span className="page-chip rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Realtime</span>
          </div>

          <div className="space-y-3">
            {activityFeed.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 transition hover:-translate-y-0.5 hover:shadow-md" style={{ animationDelay: `${1.0 + idx * 0.08}s` }}>
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 break-words">{item.action}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.time}</p>
                </div>
                <span className="text-emerald-600 font-bold">✓</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6 animate-fadeInDown" style={{ animationDelay: '1.4s' }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-sky-500 flex items-center justify-center text-white text-lg">🗺️</div>
            <h2 className="page-section-title text-2xl sm:text-3xl font-bold text-slate-900">Live Justice Map</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stateData.map((data, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedState(data)}
                className="page-card cursor-pointer p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                style={{ animationDelay: `${1.45 + idx * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">{data.state}</h3>
                  <span className="text-2xl">📍</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-xs font-semibold text-slate-500">Cases</span>
                    <span className="text-lg font-bold text-sky-600">{data.cases}</span>
                  </div>
                  <div className="flex justify-between items-center rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-xs font-semibold text-slate-500">Evidence</span>
                    <span className="text-lg font-bold text-emerald-600">{data.evidence}</span>
                  </div>
                  <div className="flex justify-between items-center rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-xs font-semibold text-slate-500">Labs</span>
                    <span className="text-lg font-bold text-rose-600">{data.labs}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedState && (
            <div className="page-card page-card-strong p-6 animate-slideInUp">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">State Overview</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{selectedState.state}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-lg font-bold text-sky-600">{selectedState.cases}</p>
                  <p className="text-xs text-slate-500 mt-1">Cases</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-600">{selectedState.evidence}</p>
                  <p className="text-xs text-slate-500 mt-1">Evidence</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-rose-600">{selectedState.labs}</p>
                  <p className="text-xs text-slate-500 mt-1">Labs</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="page-dark-panel text-white p-6 sm:p-8 space-y-6 animate-slideInUp" style={{ animationDelay: '2.2s' }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-lg">🎛️</div>
            <h2 className="page-section-title text-2xl sm:text-3xl font-bold">Case Control Panel</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Search Case ID</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Enter Case ID (e.g., 1024)..."
                  value={searchCaseId}
                  onChange={(e) => setSearchCaseId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchCase()}
                  className="page-input flex-1 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none"
                />
                <button
                  onClick={handleSearchCase}
                  className="page-button-primary rounded-2xl px-6 py-3 text-sm font-semibold text-white transition"
                >
                  Search
                </button>
              </div>
              {caseStatus && (
                <div className="rounded-2xl bg-emerald-500/20 border border-emerald-400/40 p-3 text-sm">
                  <p className="font-semibold">✓ {caseStatus}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Quick Actions</label>
              <div className="space-y-3">
                <button className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/20">
                  Verify Evidence
                </button>
                <button className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/20">
                  Audit Trail
                </button>
                <button className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/20">
                  Track Case
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 animate-fadeInDown" style={{ animationDelay: '2.55s' }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-lg">🛡️</div>
            <h2 className="page-section-title text-2xl sm:text-3xl font-bold text-slate-900">System Integrity Monitor</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Blockchain Status', value: 'Active', icon: '⛓️' },
              { label: 'Data Integrity', value: '100%', icon: '📊' },
              { label: 'Tampering Attempts', value: '0', icon: '⚠️' },
              { label: 'Unauthorized Access', value: 'Blocked', icon: '🔒' },
            ].map((stat, idx) => (
              <div key={idx} className="page-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl" style={{ animationDelay: `${2.6 + idx * 0.1}s` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                    <p className="mt-3 text-xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6 animate-fadeInDown" style={{ animationDelay: '3.0s' }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-lg">📈</div>
            <h2 className="page-section-title text-2xl sm:text-3xl font-bold text-slate-900">Performance Metrics</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, idx) => (
              <div key={metric.label} className="page-card p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl" style={{ animationDelay: `${3.05 + idx * 0.1}s` }}>
                <div className="text-3xl mb-3">{metric.icon}</div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{metric.value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

