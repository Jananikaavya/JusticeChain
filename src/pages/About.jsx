export default function About() {
  const problems = [
    { icon: '🔓', title: 'Evidence Tampering', description: 'Manual record handling allows intentional or accidental corruption of evidence' },
    { icon: '📋', title: 'Manual Record Keeping', description: 'Paper-based systems prone to loss, degradation, and inconsistencies' },
    { icon: '🔒', title: 'Lack of Transparency', description: 'Limited visibility into case progress and decision-making processes' },
    { icon: '⏱️', title: 'Delayed Verification', description: 'Slow evidence authentication and case processing timelines' },
  ]

  const solutions = [
    { icon: '🔐', title: 'Immutable Records', description: 'Blockchain technology ensures all records are permanent and tamper-proof' },
    { icon: '✓', title: 'Evidence Integrity', description: 'Cryptographic hashing verifies the authenticity of all digital evidence' },
    { icon: '📊', title: 'Full Audit Trails', description: 'Complete transaction history records all access, modifications, and actions' },
    { icon: '👤', title: 'Role-Based Access', description: 'Granular permissions ensure authorized personnel access appropriate information' },
  ]

  const workflowSteps = [
    { number: '01', title: 'Investigation', description: 'Evidence collected and recorded by law enforcement' },
    { number: '02', title: 'Case Filing', description: 'Case registered with verified evidence and testimonies' },
    { number: '03', title: 'Evidence Review', description: 'Forensic analysis and authentication by experts' },
    { number: '04', title: 'Hearing', description: 'Court proceedings with transparent access to evidence' },
    { number: '05', title: 'Verdict', description: 'Final judgment recorded permanently' },
  ]

  

  return (
    <div className="page-shell space-y-16">
      <div className="absolute -top-16 -left-12 h-56 w-56 rounded-full bg-rose-200 page-orb animate-blob" />
      <div className="absolute top-12 right-6 h-60 w-60 rounded-full bg-sky-200 page-orb animate-floatSlow" />

      <section className="page-hero text-center animate-slideInUp">
        <h1 className="page-section-title text-4xl sm:text-5xl font-bold text-slate-900">About JusticeChain</h1>
        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto">
          JusticeChain is a secure digital platform designed to modernize criminal and judicial record management
          through transparency, integrity, and accountability.
        </p>
      </section>

      <section>
        <div className="text-center mb-8">
          <h2 className="page-section-title text-3xl font-bold text-slate-900">The Problem</h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            Legacy systems expose evidence and case records to loss, delay, and integrity risk.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((item, i) => (
            <div key={i} className="page-card p-6">
              <div className="text-4xl">{item.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="text-sm mt-2 text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="text-center mb-8">
          <h2 className="page-section-title text-3xl font-bold text-slate-900">Our Solution</h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            A verifiable justice workflow that protects evidence integrity and improves accountability.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutions.map((item, i) => (
            <div key={i} className="page-card p-6">
              <div className="text-4xl">{item.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="text-sm mt-2 text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-card page-card-strong p-8">
        <h2 className="page-section-title text-3xl font-bold text-slate-900 mb-4">System Vision</h2>
        <p className="text-slate-600 max-w-3xl">
          JusticeChain envisions a justice system where records are immutable, processes are transparent, and trust
          is established through verifiable digital evidence.
        </p>
      </section>

      <section>
        <div className="text-center mb-8">
          <h2 className="page-section-title text-3xl font-bold text-slate-900">Case Workflow</h2>
        </div>
        <div className="grid gap-4">
          {workflowSteps.map((step, i) => (
            <div key={i} className="page-card p-6 flex items-center gap-5">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 text-white flex items-center justify-center font-bold">
                {step.number}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="text-sm text-slate-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="text-center">
        <h2 className="page-section-title text-3xl font-bold text-slate-900">Ready to Experience Transparent Justice?</h2>
        <p className="text-slate-600 mt-3">Explore how JusticeChain transforms the justice system.</p>
      </section>
    </div>
  )
}
