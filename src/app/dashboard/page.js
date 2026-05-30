"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    redAlertCount: 0,
    pendingPermits: 0,
    pendingInspections: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: prof } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      if (!prof) { router.push("/login"); return; }

      setProfile(prof);

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const in7Days = new Date(today)
      in7Days.setDate(today.getDate() + 7)
      const todayStr = new Date().toISOString().split('T')[0]

      const { data: projects } = await supabase
        .from("projects").select("project_id, status, projected_finish_date, expected_finish_date");

      const { count: redCount } = await supabase
        .from("alerts")
        .select("alert_id", { count: "exact", head: true })
        .eq("alert_level", "red")
        .eq("resolved_status", false);

      const { data: permits } = await supabase
        .from("permits").select("status");

      const { data: inspections } = await supabase
        .from("inspections").select("result");

      const { data: tasks } = await supabase
        .from("tasks").select("project_id, status, planned_finish");

      const { data: todayUpdates } = await supabase
        .from("daily_updates").select("project_id").eq("date", todayStr);

      // Delayed projects — projected finish is later than expected finish
      const delayedProjects = projects?.filter(p =>
        p.projected_finish_date &&
        p.expected_finish_date &&
        new Date(p.projected_finish_date) > new Date(p.expected_finish_date)
      ).length || 0

      // Milestones due soon — tasks due within 7 days, not completed
      const dueSoon = tasks?.filter(t => {
        if (t.status === 'completed') return false
        if (!t.planned_finish) return false
        const due = new Date(t.planned_finish)
        return due >= today && due <= in7Days
      }).length || 0

      // Missed milestones — tasks past due date, not completed
      const missedMilestones = tasks?.filter(t => {
        if (t.status === 'completed') return false
        if (!t.planned_finish) return false
        return new Date(t.planned_finish) < today
      }).length || 0

      // Missing daily updates — active projects with no update submitted today
      const activeProjectIds = projects
        ?.filter(p => p.status === 'active')
        .map(p => p.project_id) || []
      const updatedTodayIds = todayUpdates?.map(u => u.project_id) || []
      const missingUpdates = activeProjectIds.filter(
        pid => !updatedTodayIds.includes(pid)
      ).length

      setStats({
        totalProjects: projects?.length || 0,
        activeProjects: projects?.filter((p) => p.status !== "completed").length || 0,
        completedProjects: projects?.filter((p) => p.status === "completed").length || 0,
        redAlertCount: redCount || 0,
        pendingPermits: permits?.filter((p) => p.status === "pending").length || 0,
        pendingInspections: inspections?.filter((i) => !i.result).length || 0,
        delayedProjects,
        dueSoon,
        missedMilestones,
        missingUpdates,
      });

      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {profile?.full_name || "—"}
          </h1>
          <p className="mt-1 text-sm text-gray-400 capitalize">
            Role: <span className="text-orange-400 font-medium">{profile?.role}</span>
          </p>
        </div>

        {profile?.role === "admin"  && <AdminView  stats={stats} router={router} />}
        {profile?.role === "gc"     && <GCView     stats={stats} router={router} />}
        {profile?.role === "subcontractor" && <SubView  router={router} />}
        {profile?.role === "client" && <ClientView router={router} />}
      </main>
    </div>
  );
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────
function AdminView({ stats, router }) {
const cards = [
    { label: "Total Projects",        value: stats.totalProjects,      color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", link: "/projects" },
    { label: "Delayed Projects",      value: stats.delayedProjects,    color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30" },
    { label: "Milestones Due Soon",   value: stats.dueSoon,            color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
    { label: "Missed Milestones",     value: stats.missedMilestones,   color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30" },
    { label: "Pending Permits",       value: stats.pendingPermits,     color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
    { label: "Pending Inspections",   value: stats.pendingInspections, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
    { label: "Missing Daily Updates", value: stats.missingUpdates,     color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
    { label: "🔴 Red Alerts",         value: stats.redAlertCount,      color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    link: "/alerts" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            onClick={() => card.link && router.push(card.link)}
            className={`rounded-xl border ${card.border} ${card.bg} bg-gray-900 p-5 ${
              card.link ? "cursor-pointer hover:brightness-110 transition-all" : ""
            }`}
          >
            <p className="text-xs uppercase tracking-wider text-gray-500">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "View All Projects", href: "/projects",      desc: "Browse and manage all construction projects" },
          { label: "Alerts",            href: "/alerts",        desc: "Review and resolve active project alerts" },
          { label: "AI Reports",        href: "/reports",       desc: "View all AI-generated project summaries" },
        ].map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-left hover:border-orange-500/50 hover:bg-gray-800 transition-all"
          >
            <p className="font-semibold text-orange-400">{item.label}</p>
            <p className="mt-1 text-sm text-gray-400">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── GENERAL CONTRACTOR ──────────────────────────────────────────────────────
function GCView({ stats, router }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Active Projects",      value: stats.activeProjects,     color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30" },
          { label: "Pending Permits",      value: stats.pendingPermits,     color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
          { label: "Pending Inspections",  value: stats.pendingInspections, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border ${card.border} ${card.bg} bg-gray-900 p-5`}
          >
            <p className="text-xs uppercase tracking-wider text-gray-500">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { label: "View Projects",  href: "/projects",      desc: "View assigned projects, tasks, permits, and inspections" },
          { label: "Daily Update",   href: "/daily-update",  desc: "Submit today's site progress report" },
        ].map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-left hover:border-orange-500/50 hover:bg-gray-800 transition-all"
          >
            <p className="font-semibold text-orange-400">{item.label}</p>
            <p className="mt-1 text-sm text-gray-400">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── SUBCONTRACTOR ───────────────────────────────────────────────────────────
function SubView({ router }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-1">Subcontractor Portal</h2>
        <p className="text-gray-400 text-sm">
          Submit your daily progress updates and view your assigned tasks below.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { label: "Submit Daily Update", href: "/daily-update", desc: "Log today's work, blockers, and tomorrow's plan" },
          { label: "View Projects",       href: "/projects",     desc: "See your assigned tasks and project details" },
        ].map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-left hover:border-orange-500/50 hover:bg-gray-800 transition-all"
          >
            <p className="font-semibold text-orange-400">{item.label}</p>
            <p className="mt-1 text-sm text-gray-400">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── CLIENT ──────────────────────────────────────────────────────────────────
function ClientView({ router }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-1">Client Portal</h2>
        <p className="text-gray-400 text-sm mb-4">
          View your project progress, completed milestones, and updates from the DECKARC team.
        </p>
        <button
          onClick={() => router.push("/client-view")}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-5 py-2 text-sm transition"
        >
          View My Projects →
        </button>
      </div>
    </div>
  );
}