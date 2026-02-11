import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  
  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-r from-gray-900 to-blue-800 text-white rounded-lg shadow-lg p-12">
        <h1 className="text-5xl font-bold mb-4">Welcome to Justice Chain</h1>
        <p className="text-xl mb-6">Transparent, Secure, and Decentralized Justice Management</p>
        <button onClick={() => navigate("/login")}
        className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
          Get Started
        </button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-xl font-bold mb-2">Secure</h3>
          <p className="text-gray-600">Blockchain-based security ensures data integrity and protection</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-2">Transparent</h3>
          <p className="text-gray-600">Complete visibility into case management and legal proceedings</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-xl font-bold mb-2">Efficient</h3>
          <p className="text-gray-600">Streamlined processes for faster case resolution</p>
        </div>
      </section>
    </div>
  )
}
