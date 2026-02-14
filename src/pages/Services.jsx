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
    <div className="space-y-16 pb-12">
      <section className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white rounded-3xl p-10 sm:p-12 text-center shadow-2xl animate-slideInUp">
        <div className="flex flex-wrap justify-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
          <span className="rounded-full border border-blue-300/40 bg-white/5 px-3 py-1">
            Government Services Portal
          </span>
          <span className="rounded-full border border-blue-300/40 bg-white/5 px-3 py-1">
            JusticeChain Capabilities
          </span>
        </div>
        <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-black">
          Services of JusticeChain
        </h1>
        <p className="mt-5 text-base sm:text-lg text-blue-100 max-w-3xl mx-auto leading-relaxed">
          JusticeChain delivers core system functionalities for a blockchain-based criminal and
          judicial record management system. These services define official, role-aligned operations
          for secure case handling, evidence governance, and judicial outcomes.
        </p>
      </section>

      <section className="space-y-6 animate-fadeInDown">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">System-Wide Services</h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Baseline services enforced across all roles and modules.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {systemWideServices.map((service, index) => (
            <div
              key={service.title}
              className="group bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              style={{ animationDelay: `${0.2 + index * 0.08}s` }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-700">
                  {service.title}
                </h3>
                <span className="text-xl text-blue-600 font-bold">✓</span>
              </div>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6 animate-slideInUp">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Role-Based Services</h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Each service area reflects statutory responsibilities and specialized workflows. All
            functions are logged, verified, and time-stamped on the JusticeChain ledger.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {roleServices.map((service, index) => (
            <div
              key={service.title}
              className="group bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
              style={{ animationDelay: `${0.3 + index * 0.1}s` }}
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{service.title}</h3>
                  <span className="text-2xl">{service.title.split(' ')[0].charAt(0)}</span>
                </div>
                <p className="mt-2 text-sm text-blue-100">{service.description}</p>
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Key Functions
                </p>
                <ul className="mt-4 space-y-3 text-sm text-gray-700">
                  {service.functions.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-gray-900 via-blue-950 to-gray-900 text-white rounded-3xl p-8 sm:p-10 shadow-2xl animate-slideInUp">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Complete Digital Justice Ecosystem</h2>
            <p className="mt-3 text-sm sm:text-base text-blue-100 max-w-3xl">
              Together, these services establish a secure, end-to-end justice workflow where every
              case action, evidence artifact, and judicial decision is authenticated, auditable, and
              preserved with legal-grade integrity.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-400/40 bg-white/10 px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
            Integrity. Transparency. Accountability.
          </div>
        </div>
      </section>
    </div>
  )
}
