'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

export default function ProjectsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    address: '',
    project_type: '',
    start_date: '',
    expected_finish_date: '',
    status: 'active',
    notes: '',
  })

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!prof) { router.push('/login'); return }

if (prof.role === 'client') {
  router.push('/dashboard')
  return
}
    setProfile(prof)

      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      setProjects(projectData || [])
      setLoading(false)
    }
    loadData()
  }, [router])

  const isAdmin = profile?.role === 'admin'
  const isAdminOrGC = profile?.role === 'admin' || profile?.role === 'gc'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.project_name || !formData.client_name) {
      alert('Project name and client name are required')
      return
    }

    if (editingId) {
      const { error } = await supabase
        .from('projects')
        .update(formData)
        .eq('project_id', editingId)
      if (error) { alert('Error updating project: ' + error.message); return }
      setProjects(projects.map(p => p.project_id === editingId ? { ...p, ...formData } : p))
    } else {
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert([formData])
        .select()
      if (error) { alert('Error creating project: ' + error.message); return }
      setProjects([newProject[0], ...projects])
    }

    setFormData({
      project_name: '', client_name: '', address: '', project_type: '',
      start_date: '', expected_finish_date: '', status: 'active', notes: '',
    })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (project) => {
    setFormData({
      project_name: project.project_name,
      client_name: project.client_name,
      address: project.address || '',
      project_type: project.project_type || '',
      start_date: project.start_date || '',
      expected_finish_date: project.expected_finish_date || '',
      status: project.status,
      notes: project.notes || '',
    })
    setEditingId(project.project_id)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      project_name: '', client_name: '', address: '', project_type: '',
      start_date: '', expected_finish_date: '', status: 'active', notes: '',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar profile={profile} />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-3xl font-bold">Projects</h1>
            {!isAdmin && (
              <p className="text-gray-500 text-sm mt-1">
                Viewing as {profile?.role} — read only
              </p>
            )}
          </div>

          {/* Only admin sees + New Project */}
          {isAdmin && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-6 py-3 transition"
            >
              + New Project
            </button>
          )}
        </div>

        {/* Add/Edit Form — admin only */}
        {isAdmin && showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
            <h2 className="text-white text-xl font-semibold mb-6">
              {editingId ? 'Edit Project' : 'Add New Project'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Project Name *</label>
                  <input
                    type="text" required value={formData.project_name}
                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Client Name *</label>
                  <input
                    type="text" required value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-gray-400 text-sm mb-1 block">Address</label>
                  <input
                    type="text" value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Project Type</label>
                  <input
                    type="text" value={formData.project_type}
                    onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                    placeholder="e.g., Room Addition, Remodel"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option>active</option>
                    <option>on-hold</option>
                    <option>completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Start Date</label>
                  <input
                    type="date" value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Expected Finish Date</label>
                  <input
                    type="date" value={formData.expected_finish_date}
                    onChange={(e) => setFormData({ ...formData, expected_finish_date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-gray-400 text-sm mb-1 block">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-6 py-3 transition">
                  {editingId ? 'Update Project' : 'Create Project'}
                </button>
                <button type="button" onClick={handleCancel}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg px-6 py-3 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-gray-400">No projects yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.project_id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">{project.project_name}</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Client: <span className="text-orange-400">{project.client_name}</span>
                    </p>
                    {project.address && (
                      <p className="text-gray-500 text-sm">{project.address}</p>
                    )}
                    {project.project_type && (
                      <p className="text-gray-500 text-sm">Type: {project.project_type}</p>
                    )}
                    {project.notes && (
                      <p className="text-gray-500 text-sm mt-2">{project.notes}</p>
                    )}
                  </div>

                  <div className="text-right ml-4 flex flex-col items-end gap-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'active' ? 'bg-green-500/10 text-green-400'
                      : project.status === 'on-hold' ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {project.status}
                    </span>

                    <div className="flex gap-3">
                      {/* Edit — admin only */}
                      {isAdmin && (
                        <button
                          onClick={() => handleEdit(project)}
                          className="text-orange-400 hover:text-orange-300 text-sm transition"
                        >
                          Edit
                        </button>
                      )}
                      {/* View Tasks — all roles */}
                      <button
                        onClick={() => router.push(`/projects/${project.project_id}`)}
                        className="text-blue-400 hover:text-blue-300 text-sm transition"
                      >
                        View Tasks
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}