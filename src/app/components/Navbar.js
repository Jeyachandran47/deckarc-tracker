'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

const roleColors = {
  admin: 'bg-orange-500',
  gc: 'bg-blue-500',
  subcontractor: 'bg-green-500',
  client: 'bg-purple-500',
}

const roleLabels = {
  admin: 'Admin',
  gc: 'General Contractor',
  subcontractor: 'Subcontractor',
  client: 'Client',
}

export default function Navbar({ profile }) {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link href="/dashboard">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <span className="text-white font-bold text-lg">DECKARC</span>
          </div>
        </Link>

        {/* Nav links — role based */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition">Dashboard</Link>
          {(profile?.role === 'admin' || profile?.role === 'gc') && (
            <Link href="/projects" className="text-gray-400 hover:text-white transition">Projects</Link>
          )}
          {profile?.role === 'admin' && (
            <>
              <Link href="/alerts" className="text-gray-400 hover:text-white transition">Alerts</Link>
              <Link href="/reports" className="text-gray-400 hover:text-white transition">Reports</Link>
            </>
          )}
          {profile?.role === 'client' && (
            <Link href="/client-view" className="text-gray-400 hover:text-white transition">
              My Projects
            </Link>
          )}
          {profile?.role === 'subcontractor' && (
            <Link href="/daily-update" className="text-gray-400 hover:text-white transition">Daily Update</Link>
          )}
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-3">
          <span className={`text-white text-xs font-medium px-2 py-1 rounded-full ${roleColors[profile?.role]}`}>
            {roleLabels[profile?.role]}
          </span>
          <span className="text-gray-400 text-sm hidden md:block">{profile?.full_name}</span>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 text-sm transition"
          >
            Logout
          </button>
        </div>

      </div>
    </nav>
  )
}