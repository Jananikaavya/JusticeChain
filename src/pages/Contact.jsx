import { useState } from 'react'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    alert('Thank you for your message! We will get back to you soon.')
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="page-shell space-y-10">
      <div className="absolute -top-16 -left-12 h-56 w-56 rounded-full bg-rose-200 page-orb animate-blob" />
      <div className="absolute top-12 right-6 h-60 w-60 rounded-full bg-sky-200 page-orb animate-floatSlow" />

      <section className="page-hero text-center animate-slideInUp">
        <h1 className="page-section-title text-4xl sm:text-5xl font-bold text-slate-900">Contact Us</h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          Reach the JusticeChain team for onboarding, support, or platform collaboration.
        </p>
      </section>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="page-card p-8">
          <h2 className="page-section-title text-2xl font-bold text-slate-900 mb-6">Get in Touch</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-600 font-semibold mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="page-input w-full rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="page-input w-full rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none"
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-2">Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="page-input w-full rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none"
                placeholder="Message Subject"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-2">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
                className="page-input w-full rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none"
                placeholder="Your message..."
              ></textarea>
            </div>
            <button
              type="submit"
              className="page-button-primary w-full rounded-2xl py-3 text-sm font-semibold text-white transition"
            >
              Send Message
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="page-card p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Email</h3>
            <p className="text-slate-600">info@justicechain.com</p>
          </div>
          <div className="page-card p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Phone</h3>
            <p className="text-slate-600">+1 (555) 123-4567</p>
          </div>
          <div className="page-card p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Address</h3>
            <p className="text-slate-600">123 Justice Street<br />Legal City, LC 12345<br />United States</p>
          </div>
          <div className="page-card p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Business Hours</h3>
            <p className="text-slate-600">Monday - Friday: 9:00 AM - 6:00 PM<br />Saturday - Sunday: Closed</p>
          </div>
        </div>
      </div>
    </div>
  )
}
