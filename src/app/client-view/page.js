'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

export default function ClientViewPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      if (!profile) { router.push('/login'); return }

      setProfile(profile)

      // Load all active projects
      const { data: projects } = await supabase
        .from('projects').select('*').eq('status', 'active')

      // For each project load its tasks
      const enriched = await Promise.all((projects || []).map(async (project) => {
        const { data: tasks } = await supabase
          .from('tasks').select('*').eq('project_id', project.project_id)

        const { data: aiReports } = await supabase
          .from('ai_reports')
          .select('*')
          .eq('project_id', project.project_id)
          .eq('report_type', 'client_update')
          .order('created_date', { ascending: false })
          .limit(1)

        const completed = tasks?.filter(t => t.status === 'completed') || []
        const upcoming = tasks?.filter(t => t.status === 'pending') || []
        const inProgress = tasks?.filter(t => t.status === 'in-progress') || []
        const progress = tasks?.length > 0
          ? Math.round((completed.length / tasks.length) * 100) : 0

        return {
          ...project,
          completed,
          upcoming,
          inProgress,
          progress,
          latestClientUpdate: aiReports?.[0]?.report_text || null,
        }
      }))

      setProjects(enriched)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar profile={profile} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-white text-2xl font-bold">Your Projects</h1>
          <p className="text-gray-400 text-sm mt-1">Live progress updates from the DECKARC team</p>
        </div>

        {projects.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-gray-400">No active projects at this time.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map(project => (
              <div key={project.project_id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6">

                {/* Project header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-white text-xl font-bold">{project.project_name}</h2>
                    <p className="text-gray-400 text-sm mt-1">{project.project_type}</p>
                    {project.address && (
                      <p className="text-gray-500 text-sm">{project.address}</p>
                    )}
                  </div>
                  <span className="bg-green-500/10 text-green-400 text-xs font-medium px-3 py-1 rounded-full">
                    In Progress
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Overall Progress</span>
                    <span className="text-orange-400 font-semibold">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div
                      className="bg-orange-500 rounded-full h-3 transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {project.start_date && (
                    <div className="bg-gray-800 rounded-xl p-3">
                      <p className="text-gray-500 text-xs">Start Date</p>
                      <p className="text-white text-sm font-medium mt-1">{project.start_date}</p>
                    </div>
                  )}
                  {project.expected_finish_date && (
                    <div className="bg-gray-800 rounded-xl p-3">
                      <p className="text-gray-500 text-xs">Expected Completion</p>
                      <p className="text-white text-sm font-medium mt-1">{project.expected_finish_date}</p>
                    </div>
                  )}
                </div>

                {/* Milestones */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  {/* Completed */}
                  <div>
                    <p className="text-green-400 text-sm font-medium mb-2">
                      ✅ Completed ({project.completed.length})
                    </p>
                    <div className="space-y-1">
                      {project.completed.slice(0, 4).map(t => (
                        <div key={t.task_id}
                          className="bg-green-500/5 border border-green-500/20 rounded-lg px-3 py-2">
                          <p className="text-gray-300 text-xs">{t.task_name}</p>
                        </div>
                      ))}
                      {project.completed.length > 4 && (
                        <p className="text-gray-500 text-xs pl-1">
                          +{project.completed.length - 4} more completed
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Upcoming */}
                  <div>
                    <p className="text-blue-400 text-sm font-medium mb-2">
                      🔜 Coming Up ({project.upcoming.length})
                    </p>
                    <div className="space-y-1">
                      {project.upcoming.slice(0, 4).map(t => (
                        <div key={t.task_id}
                          className="bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2">
                          <p className="text-gray-300 text-xs">{t.task_name}</p>
                          {t.planned_finish && (
                            <p className="text-gray-500 text-xs mt-0.5">By {t.planned_finish}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Latest AI client update */}
                {project.latestClientUpdate && (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                    <p className="text-orange-400 text-xs font-semibold mb-2">
                      📋 Latest Update from DECKARC
                    </p>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                      {project.latestClientUpdate}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}