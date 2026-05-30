// src/app/alerts/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import { generateAlerts } from "../lib/generateAlerts";

export default function AlertsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!prof || prof.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setProfile(prof);
      await fetchAlerts();
      setLoading(false);
    }
    init();
  }, []);

  async function fetchAlerts() {
    // Fetch all unresolved alerts
    const { data: alertData } = await supabase
      .from("alerts")
      .select("*")
      .eq("resolved_status", false)
      .order("created_date", { ascending: false });

    // Fetch all projects for name lookup
    const { data: projectData } = await supabase
      .from("projects")
      .select("project_id, project_name");

    const projectMap = {};
    for (const p of projectData || []) {
      projectMap[p.project_id] = p.project_name;
    }

    setProjects(projectMap);
    setAlerts(alertData || []);
  }

  async function resolveAlert(alertId) {
    await supabase
      .from("alerts")
      .update({ resolved_status: true })
      .eq("alert_id", alertId);
    setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
  }

  async function handleRegenerate() {
    setRegenerating(true);
    const { data: activeProjects } = await supabase
      .from("projects")
      .select("project_id")
      .neq("status", "completed");

    for (const p of activeProjects || []) {
      await generateAlerts(p.project_id, supabase);
    }

    await fetchAlerts();
    setRegenerating(false);
  }

  const redAlerts = alerts.filter((a) => a.alert_level === "red");
  const yellowAlerts = alerts.filter((a) => a.alert_level === "yellow");
  const greenAlerts = alerts.filter((a) => a.alert_level === "green");

  const levelConfig = {
    red: {
      border: "border-red-500",
      bg: "bg-red-500/10",
      text: "text-red-400",
      badge: "bg-red-500/20 text-red-400",
      dot: "bg-red-500",
      label: "Red",
    },
    yellow: {
      border: "border-yellow-500",
      bg: "bg-yellow-500/10",
      text: "text-yellow-400",
      badge: "bg-yellow-500/20 text-yellow-400",
      dot: "bg-yellow-500",
      label: "Yellow",
    },
    green: {
      border: "border-green-500",
      bg: "bg-green-500/10",
      text: "text-green-400",
      badge: "bg-green-500/20 text-green-400",
      dot: "bg-green-500",
      label: "Green",
    },
  };

  function AlertCard({ alert }) {
    const cfg = levelConfig[alert.alert_level];
    return (
      <div
        className={`flex items-start gap-4 rounded-lg border-l-4 p-4 ${cfg.border} ${cfg.bg} bg-gray-900 border border-gray-800 border-l-4`}
      >
        <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-100">
              {projects[alert.project_id] || "Unknown Project"}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badge}`}
            >
              {alert.alert_type}
            </span>
          </div>
          <p className={`mt-1 text-sm ${cfg.text}`}>{alert.alert_message}</p>
          <p className="mt-1 text-xs text-gray-500">
            {new Date(alert.created_date).toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => resolveAlert(alert.alert_id)}
          className="shrink-0 rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          Resolve
        </button>
      </div>
    );
  }

  function AlertGroup({ level, items }) {
    if (items.length === 0) return null;
    const cfg = levelConfig[level];
    return (
      <section className="space-y-3">
        <h2 className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wider ${cfg.text}`}>
          <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
          {cfg.label} Alerts
          <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${cfg.badge}`}>
            {items.length}
          </span>
        </h2>
        <div className="space-y-2">
          {items.map((a) => (
            <AlertCard key={a.alert_id} alert={a} />
          ))}
        </div>
      </section>
    );
  }

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

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Alerts</h1>
            <p className="mt-1 text-sm text-gray-400">
              All active alerts across projects
            </p>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {regenerating ? "Regenerating…" : "Regenerate All Alerts"}
          </button>
        </div>

        {/* Count badges */}
        <div className="mb-8 flex gap-3 flex-wrap">
          {[
            { level: "red", count: redAlerts.length },
            { level: "yellow", count: yellowAlerts.length },
            { level: "green", count: greenAlerts.length },
          ].map(({ level, count }) => {
            const cfg = levelConfig[level];
            return (
              <div
                key={level}
                className={`flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-3`}
              >
                <span className={`h-3 w-3 rounded-full ${cfg.dot}`} />
                <span className="text-sm text-gray-300">{cfg.label}</span>
                <span className={`text-lg font-bold ${cfg.text}`}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Alert groups */}
        {alerts.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 py-16 text-center">
            <p className="text-gray-400">No active alerts. All clear!</p>
          </div>
        ) : (
          <div className="space-y-8">
            <AlertGroup level="red" items={redAlerts} />
            <AlertGroup level="yellow" items={yellowAlerts} />
            <AlertGroup level="green" items={greenAlerts} />
          </div>
        )}
      </main>
    </div>
  );
}