export default function About() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-gray-800">About Justice Chain</h1>
      
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Our Mission</h2>
        <p className="text-gray-700 leading-relaxed">
          Justice Chain is dedicated to revolutionizing the legal system through blockchain technology. 
          We believe in creating a transparent, secure, and efficient platform for justice delivery that 
          serves all stakeholders in the legal ecosystem.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Our Vision</h2>
        <p className="text-gray-700 leading-relaxed">
          To build a globally accessible, decentralized justice system that ensures equal access to legal 
          remedies and maintains the highest standards of integrity and transparency.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Why Justice Chain?</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Immutable record-keeping using blockchain technology</li>
          <li>24/7 accessibility to case information and updates</li>
          <li>Reduced processing time and administrative overhead</li>
          <li>Enhanced security and privacy protection</li>
          <li>Fair and transparent decision-making processes</li>
        </ul>
      </div>
    </div>
  )
}
