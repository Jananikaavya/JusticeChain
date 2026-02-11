export default function Services() {
  const services = [
    {
      title: 'Case Management',
      description: 'Secure and transparent management of legal cases with real-time updates',
      icon: '📋'
    },
    {
      title: 'Document Storage',
      description: 'Immutable storage of legal documents on blockchain',
      icon: '📄'
    },
    {
      title: 'Legal Consultation',
      description: 'Connect with verified legal professionals for consultation',
      icon: '👨‍⚖️'
    },
    {
      title: 'Evidence Management',
      description: 'Secure handling and verification of case evidence',
      icon: '🔍'
    },
    {
      title: 'Smart Contracts',
      description: 'Automated legal agreements with blockchain enforcement',
      icon: '📜'
    },
    {
      title: 'Dispute Resolution',
      description: 'Efficient and fair alternative dispute resolution mechanisms',
      icon: '⚖️'
    }
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-gray-800">Our Services</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="text-5xl mb-4">{service.icon}</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">{service.title}</h3>
            <p className="text-gray-600">{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
