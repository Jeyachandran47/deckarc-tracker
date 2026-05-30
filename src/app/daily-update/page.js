'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

export default function DailyUpdatePage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    work_completed: '',
    work_planned_tomorrow: '',
    blockers: '',
    material_issues: '',
    permit_updates: '',
    inspection_updates: '',
    weather_issues: '',
    delay_reason: '',
  })

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (!profile) { router.push('/login'); return }

      // Only subcontractors and GCs submit daily updates
      if (profile.role === 'client' || profile.role === 'gc') {
        router.push('/dashboard')
        return
      }

      setProfile(profile)

      const { data: projects } = await supabase
        .from('projects').select('project_id, project_name').eq('status', 'active')

      setProjects(projects || [])
      setLoading(false)
    }

    loadData()
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.project_id) {
      alert('Please select a project')
      return
    }

    const { error } = await supabase
      .from('daily_updates')
      .insert([{ ...form, user_id: profile.id }])

    if (error) {
      alert('Error submitting update: ' + error.message)
      return
    }

    setSubmitted(true)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-white text-2xl font-bold mb-2">Daily Update</h1>
        <p className="text-gray-400 text-sm mb-8">Submit your end-of-day progress report</p>

        {submitted ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-white text-xl font-semibold mb-2">Update Submitted!</h2>
            <p className="text-gray-400 text-sm mb-6">Your daily update has been recorded successfully.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setSubmitted(false); setForm({ ...form, work_completed: '', work_planned_tomorrow: '', blockers: '', material_issues: '', permit_updates: '', inspection_updates: '', weather_issues: '', delay_reason: '' }) }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-5 py-2 text-sm transition"
              >
                Submit Another
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg px-5 py-2 text-sm transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Project + Date */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-white font-semibold">Project Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Project *</label>
                  <select
                    required
                    value={form.project_id}
                    onChange={e => setForm({ ...form, project_id: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Select project...</option>
                    {projects.map(p => (
                      <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Work */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-white font-semibold">Work Progress</h2>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Work Completed Today *</label>
                <textarea required rows="3"
                  value={form.work_completed}
                  onChange={e => setForm({ ...form, work_completed: e.target.value })}
                  placeholder="Describe what was accomplished today..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Plan for Tomorrow</label>
                <textarea rows="3"
                  value={form.work_planned_tomorrow}
                  onChange={e => setForm({ ...form, work_planned_tomorrow: e.target.value })}
                  placeholder="What will be worked on tomorrow..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Issues */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-white font-semibold">Issues & Blockers</h2>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Blockers</label>
                <textarea rows="2"
                  value={form.blockers}
                  onChange={e => setForm({ ...form, blockers: e.target.value })}
                  placeholder="Anything blocking progress..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Material Issues</label>
                  <textarea rows="2"
                    value={form.material_issues}
                    onChange={e => setForm({ ...form, material_issues: e.target.value })}
                    placeholder="Material delays, shortages..."
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Weather Issues</label>
                  <textarea rows="2"
                    value={form.weather_issues}
                    onChange={e => setForm({ ...form, weather_issues: e.target.value })}
                    placeholder="Rain, wind, temperature..."
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Delay Reason</label>
                <input type="text"
                  value={form.delay_reason}
                  onChange={e => setForm({ ...form, delay_reason: e.target.value })}
                  placeholder="If delayed, explain why..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Permits & Inspections */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-white font-semibold">Permits & Inspections Notes</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Permit Updates</label>
                  <textarea rows="2"
                    value={form.permit_updates}
                    onChange={e => setForm({ ...form, permit_updates: e.target.value })}
                    placeholder="Note any permit observations (admin updates status in project)..."
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Inspection Updates</label>
                  <textarea rows="2"
                    value={form.inspection_updates}
                    onChange={e => setForm({ ...form, inspection_updates: e.target.value })}
                    placeholder="Note any inspection observations (admin updates result in project)..."
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl py-4 text-sm transition"
            >
              Submit Daily Update
            </button>
          </form>
        )}
      </main>
    </div>
  )
}