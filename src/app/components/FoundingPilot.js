'use client'
import { useState } from 'react'

export default function FoundingPilot() {
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    company_name: '',
    email: '',
    phone: '',
    website: '',
    city_state: '',
    contractor_type: '',
    active_projects: '',
    challenge: '',
    live_project: '',
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.full_name || !form.email) {
      alert('Full name and email are required')
      return
    }
    setSubmitting(true)

    const res = await fetch('/api/founding-pilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setSubmitted(true)
    } else {
      alert('Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <>
      {/* Pricing Card */}
      <div className="w-full rounded-2xl border border-gray-800 bg-gray-900 p-8 mt-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-white text-3xl font-bold">
              $199<span className="text-gray-400 text-lg font-normal">/month</span>
            </p>
            <p className="text-gray-500 text-sm mt-1">For 90 days · No setup fee</p>
          </div>
          <div className="text-right border border-yellow-500/40 bg-yellow-500/10 rounded-xl px-4 py-2">
            <p className="text-yellow-400 text-sm font-semibold">Founder pricing locked</p>
            <p className="text-yellow-500/70 text-xs mt-0.5">for 12 months after pilot</p>
          </div>
        </div>

        <div className="border-t border-gray-800 mb-6" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            'Done-for-you setup for 1 live project',
            'Admin + GC + client portal',
            'Unlimited homeowner and subcontractor access',
            'Weekly founder support for 90 days',
            'Founder pricing locked for 12 months',
            "One active project configured around updates, blockers, and Tomorrow's Plan",
          ].map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-300 text-sm">{feature}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mb-6">
          <p className="text-yellow-400 text-sm font-semibold mb-1">30-day promise</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            In 30 days, you will have one live project running through DECKARC Tracker
            with client updates, blocker tracking, and Tomorrow's Plan in one place.
          </p>
        </div>

        <p className="text-center text-gray-500 text-sm italic mb-6">
          Start with one project. No need to move your whole business at once.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-8 py-3 text-sm transition"
          >
            Apply for Founding Pilot →
          </button>
          <button className="border border-gray-700 hover:border-gray-600 text-white font-semibold rounded-xl px-8 py-3 text-sm transition">
            Book a 10-Minute Walkthrough
          </button>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {submitted ? (
              <div className="p-10 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-gray-900 text-2xl font-bold mb-2">Application Submitted!</h2>
                <p className="text-gray-500 text-sm mb-6">
                  We will contact you within 24 hours at {form.email}.
                </p>
                <button
                  onClick={() => { setShowForm(false); setSubmitted(false) }}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-8 py-3 text-sm transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                  <h2 className="text-gray-900 text-xl font-bold">
                    Apply for DECKARC Founding Pilot
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl transition ml-4"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  3 spots available. We'll contact you within 24 hours.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Row 1 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Full Name *
                      </label>
                      <input
                        name="full_name" required
                        value={form.full_name}
                        onChange={handleChange}
                        placeholder="Jane Smith"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Company Name
                      </label>
                      <input
                        name="company_name"
                        value={form.company_name}
                        onChange={handleChange}
                        placeholder="Smith Remodeling LLC"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400"
                      />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Email *
                      </label>
                      <input
                        name="email" type="email" required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="jane@smithremodeling.com"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Phone
                      </label>
                      <input
                        name="phone" type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="(704) 555-0100"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400"
                      />
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Website
                      </label>
                      <input
                        name="website"
                        value={form.website}
                        onChange={handleChange}
                        placeholder="www.smithremodeling.com"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        City / State
                      </label>
                      <input
                        name="city_state"
                        value={form.city_state}
                        onChange={handleChange}
                        placeholder="Charlotte, NC"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400"
                      />
                    </div>
                  </div>

                  {/* Row 4 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Contractor Type
                      </label>
                      <select
                        name="contractor_type"
                        value={form.contractor_type}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400"
                      >
                        <option value="">Select...</option>
                        <option>General Contractor</option>
                        <option>Remodeling Contractor</option>
                        <option>Home Builder</option>
                        <option>Specialty Contractor</option>
                        <option>Subcontractor</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Number of Active Projects
                      </label>
                      <select
                        name="active_projects"
                        value={form.active_projects}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400"
                      >
                        <option value="">Select range...</option>
                        <option>1 - 3</option>
                        <option>4 - 10</option>
                        <option>11 - 25</option>
                        <option>25+</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 5 */}
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Biggest Coordination Challenge
                    </label>
                    <select
                      name="challenge"
                      value={form.challenge}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400"
                    >
                      <option value="">Select...</option>
                      <option>Daily updates from subcontractors</option>
                      <option>Client communication</option>
                      <option>Permit and inspection tracking</option>
                      <option>Delay and milestone tracking</option>
                      <option>All of the above</option>
                    </select>
                  </div>

                  {/* Row 6 */}
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      One live project you may want to test DECKARC on
                    </label>
                    <textarea
                      name="live_project"
                      value={form.live_project}
                      onChange={handleChange}
                      rows={3}
                      placeholder="e.g. 1,200 sq ft addition in Charlotte, NC — currently in framing phase..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="text-gray-500 hover:text-gray-700 text-sm transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-gray-700 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold rounded-xl px-8 py-3 text-sm transition"
                    >
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>

                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}