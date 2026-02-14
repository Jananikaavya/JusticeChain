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
    <div className="space-y-16">

      {/* INTRO */}
      <section className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white rounded-3xl p-12 text-center">
        <h1 className="text-5xl font-black">About JusticeChain</h1>
        <p className="mt-6 text-lg text-blue-100 max-w-3xl mx-auto">
          JusticeChain is a secure digital platform designed to modernize criminal and judicial record management
          through transparency, integrity, and accountability.
        </p>
      </section>

      {/* PROBLEMS */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8">The Problem</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((item, i) => (
            <div key={i} className="bg-red-50 p-6 rounded-2xl border">
              <div className="text-4xl">{item.icon}</div>
              <h3 className="font-bold mt-4">{item.title}</h3>
              <p className="text-sm mt-2 text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOLUTIONS */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8">Our Solution</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutions.map((item, i) => (
            <div key={i} className="bg-green-50 p-6 rounded-2xl border">
              <div className="text-4xl">{item.icon}</div>
              <h3 className="font-bold mt-4">{item.title}</h3>
              <p className="text-sm mt-2 text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VISION */}
      <section className="bg-blue-50 rounded-3xl p-10">
        <h2 className="text-3xl font-bold mb-4">System Vision</h2>
        <p className="text-gray-700 max-w-3xl">
          JusticeChain envisions a justice system where records are immutable, processes are transparent,
          and trust is established through verifiable digital evidence.
        </p>
      </section>

      {/* WORKFLOW */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8">Case Workflow</h2>
        <div className="space-y-6">
          {workflowSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-6">
              <div className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                {step.number}
              </div>
              <div>
                <h3 className="font-bold">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      
      {/* CTA */}
      <section className="text-center">
        <h2 className="text-3xl font-bold">Ready to Experience Transparent Justice?</h2>
        <p className="text-gray-600 mt-3">Explore how JusticeChain transforms the justice system.</p>
      </section>

    </div>
  )
}
