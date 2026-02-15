export default function Services() {
  const roleServices = [
    {
      title: 'Police Services',
      description:
        'Operational tools for lawful case intake, evidence handling, and real-time investigation tracking.',
      functions: ['Case registration', 'Evidence upload', 'Case tracking']
    },
    {
      title: 'Forensic Services',
      description:
        'Digital and laboratory workflows for evidence analysis with secure, verifiable reporting.',
      functions: ['Evidence analysis', 'Report submission', 'Evidence verification']
    },
    {
      title: 'Judicial Services',
      description:
        'Structured judicial workflows to review records, validate evidence, and document court outcomes.',
      functions: ['Case review', 'Evidence validation', 'Hearing management', 'Verdict recording']
    },
    {
      title: 'Administrative Services',
      description:
        'System governance and oversight to ensure secure access, compliance, and audit readiness.',
      functions: ['User management', 'Access control', 'System monitoring', 'Audit logs']
    }
  ]

  const systemWideServices = [
    {
      title: 'Evidence Verification',
      description: 'Cryptographic checks for chain-of-custody integrity across all submissions.'
    },
    {
      title: 'Audit Trail',
      description: 'Tamper-evident activity logs with actor, timestamp, and action history.'
    },
    {
      title: 'Record Immutability',
      description: 'Blockchain-backed records prevent unauthorized modification or deletion.'
    },
    {
      title: 'Role-Based Access',
      description: 'Granular permissions aligned with statutory responsibilities and oversight.'
    }
  ]

  return (
    <div className="page-shell space-y-16 pb-12">
      <div className="absolute -top-20 -left-10 h-56 w-56 rounded-full bg-rose-200 page-orb animate-blob" />
      <div className="absolute top-16 right-6 h-64 w-64 rounded-full bg-sky-200 page-orb animate-floatSlow" />

      <section className="page-hero text-center animate-slideInUp">
        <div className="flex flex-wrap justify-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          <span className="page-chip rounded-full px-3 py-1">Government Services Portal</span>
          <span className="page-chip rounded-full px-3 py-1">JusticeChain Capabilities</span>
        </div>
        <h1 className="page-section-title mt-6 text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900">
          Services of JusticeChain
        </h1>
        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          JusticeChain delivers core system functionalities for a blockchain-based criminal and judicial record
          management system. These services define official, role-aligned operations for secure case handling,
          evidence governance, and judicial outcomes.
        </p>
      </section>

      <section className="space-y-6 animate-fadeInDown">
        <div className="text-center">
          <h2 className="page-section-title text-3xl font-bold text-slate-900">System-Wide Services</h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            Baseline services enforced across all roles and modules.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {systemWideServices.map((service, index) => (
            <div
              key={service.title}
              className="page-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{ animationDelay: `${0.2 + index * 0.08}s` }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {service.title}
                </h3>
                <span className="text-lg text-emerald-600 font-bold">✓</span>
              </div>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6 animate-slideInUp">
        <div className="text-center">
          <h2 className="page-section-title text-3xl font-bold text-slate-900">Role-Based Services</h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            Each service area reflects statutory responsibilities and specialized workflows. All functions are logged,
            verified, and time-stamped on the JusticeChain ledger.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {roleServices.map((service, index) => (
            <div
              key={service.title}
              className="page-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{ animationDelay: `${0.3 + index * 0.1}s` }}
            >
              <div className="bg-gradient-to-r from-emerald-600 to-sky-600 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{service.title}</h3>
                  <span className="text-2xl">{service.title.split(' ')[0].charAt(0)}</span>
                </div>
                <p className="mt-2 text-sm text-white/80">{service.description}</p>
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Key Functions
                </p>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  {service.functions.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-600" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="page-dark-panel text-white p-8 sm:p-10 shadow-2xl animate-slideInUp">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="page-section-title text-2xl sm:text-3xl font-bold">Complete Digital Justice Ecosystem</h2>
            <p className="mt-3 text-sm sm:text-base text-white/80 max-w-3xl">
              Together, these services establish a secure, end-to-end justice workflow where every case action,
              evidence artifact, and judicial decision is authenticated, auditable, and preserved with legal-grade
              integrity.
            </p>
          </div>
          <div className="rounded-2xl border border-white/30 bg-white/10 px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
            Integrity. Transparency. Accountability.
          </div>
        </div>
      </section>
    </div>
  )
}
