// src/app/projects/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";
import { generateAlerts } from "../../lib/generateAlerts";
import AIPanel from "../../components/AIPanel";


export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [permits, setPermits] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [dailyUpdates, setDailyUpdates] = useState([]);
  const [aiReports, setAiReports] = useState([]);
  const [expandedReports, setExpandedReports] = useState({});
  const [activeTab, setActiveTab] = useState("tasks");
  const [loading, setLoading] = useState(true);

  // Task edit state
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({});
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(prof);

      await fetchAll();
      setLoading(false);
    }
    init();
  }, [id]);

  async function fetchAll() {
    const [
      { data: proj },
      { data: taskData },
      { data: permitData },
      { data: inspectionData },
      { data: updatesData },
      { data: reportsData },
    ] = await Promise.all([
      supabase.from("projects").select("*").eq("project_id", id).single(),
      supabase.from("tasks").select("*").eq("project_id", id).order("planned_finish"),
      supabase.from("permits").select("*").eq("project_id", id),
      supabase.from("inspections").select("*").eq("project_id", id).order("scheduled_date"),
      supabase.from("daily_updates").select("*").eq("project_id", id).order("date", { ascending: false }),
      supabase.from("ai_reports").select("*").eq("project_id", id).order("created_date", {ascending: false,}),
    ]);

    setProject(proj);
    setTasks(taskData || []);
    setPermits(permitData || []);
    setInspections(inspectionData || []);
    setDailyUpdates(updatesData || []);
    setAiReports(reportsData || []);
  }

  // ── Delay logic ──────────────────────────────────────────────────────────────

  async function recalculateProjectedFinish(updatedTasks) {
    const activeTasks = updatedTasks.filter(
      (t) => t.status === "delayed" || t.status === "in_progress" || t.status === "not_started"
    );

    if (activeTasks.length === 0) return;

    const latestDate = activeTasks
      .filter((t) => t.planned_finish)
      .map((t) => new Date(t.planned_finish))
      .reduce((max, d) => (d > max ? d : max), new Date(0));

    if (latestDate.getFullYear() === 1970) return;

    const isoDate = latestDate.toISOString().split("T")[0];

    await supabase
      .from("projects")
      .update({ projected_finish_date: isoDate })
      .eq("project_id", id);

    setProject((prev) => ({ ...prev, projected_finish_date: isoDate }));
  }

  // ── Task edit handlers ────────────────────────────────────────────────────────

  function openEditTask(task) {
    setEditingTask(task.task_id);
    setTaskForm({
      task_name: task.task_name || "",
      status: task.status || "not_started",
      planned_finish: task.planned_finish || "",
      actual_finish: task.actual_finish || "",
      delay_reason: task.delay_reason || "",
      assigned_role: task.assigned_role || "",
    });
  }

  async function saveTask() {
    setSavingTask(true);

    const { error } = await supabase
      .from("tasks")
      .update(taskForm)
      .eq("task_id", editingTask);

    if (!error) {
      // Refresh tasks list
      const { data: updatedTasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", id)
        .order("planned_finish");

      setTasks(updatedTasks || []);

      // If task is delayed/blocked, recalculate projected finish
      if (taskForm.status === "delayed" || taskForm.status === "blocked") {
        await recalculateProjectedFinish(updatedTasks || []);
      }

      // Regenerate alerts
      await generateAlerts(id, supabase);

      setEditingTask(null);
    }

    setSavingTask(false);
  }
async function saveNewTask() {
  if (!taskForm.task_name) {
    alert('Task name is required')
    return
  }
  setSavingTask(true)

  const { data: newTask, error } = await supabase
    .from('tasks')
    .insert([{ ...taskForm, project_id: id }])
    .select()

  if (!error && newTask) {
    const { data: updatedTasks } = await supabase
      .from('tasks').select('*').eq('project_id', id).order('planned_finish')
    setTasks(updatedTasks || [])
    await generateAlerts(id, supabase)
    setEditingTask(null)
  } else {
    alert('Error creating task: ' + error?.message)
  }

  setSavingTask(false)
}
  // ── Helpers ───────────────────────────────────────────────────────────────────

  function statusBadge(status) {
    const map = {
      completed: "bg-green-500/20 text-green-400",
      in_progress: "bg-blue-500/20 text-blue-400",
      delayed: "bg-red-500/20 text-red-400",
      blocked: "bg-red-700/20 text-red-300",
      not_started: "bg-gray-700/40 text-gray-400",
      pending: "bg-yellow-500/20 text-yellow-400",
      approved: "bg-green-500/20 text-green-400",
    };
    return `inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] || "bg-gray-700 text-gray-300"}`;
  }

  function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  }

  const isProjectedLate =
    project?.projected_finish_date &&
    project?.expected_finish_date &&
    new Date(project.projected_finish_date) > new Date(project.expected_finish_date);

if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar profile={profile} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Project header */}
        <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{project.project_name}</h1>
              <p className="mt-1 text-sm text-gray-400">{project.client_name}</p>
              <span className={`mt-2 ${statusBadge(project.status)}`}>{project.status}</span>
            </div>

            {/* Date block */}
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Expected Finish</p>
                <p className="mt-1 font-medium text-gray-200">
                  {formatDate(project.expected_finish_date)}
                </p>
              </div>
              {project.projected_finish_date && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">Projected Finish</p>
                  <p className={`mt-1 font-semibold ${isProjectedLate ? "text-red-400" : "text-green-400"}`}>
                    {formatDate(project.projected_finish_date)}
                    {isProjectedLate && (
                      <span className="ml-2 text-xs font-normal text-red-400">⚠ Behind schedule</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
<div className="mb-6 flex gap-1 border-b border-gray-800">
  {[
    "tasks",
    ...(profile?.role !== 'subcontractor' ? ["permits", "inspections", "daily-updates"] : []),
    ...(profile?.role === 'admin' ? ["ai-reports"] : []),
  ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-orange-500 text-orange-400"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.replace("-", " ")}
            </button>
          ))}
        </div>

        {/* ── TASKS TAB ── */}
     {activeTab === "tasks" && (
  <div className="space-y-3">

    {/* Add Task button — admin and gc only */}
      {profile?.role === 'admin' && (
        <div className="flex justify-end mb-2">
        <button
          onClick={() => {
            setEditingTask('new')
            setTaskForm({
              task_name: '', status: 'not_started',
              planned_finish: '', actual_finish: '',
              delay_reason: '', assigned_role: '',
            })
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-5 py-2 text-sm transition"
        >
          + Add Task
        </button>
      </div>
    )}

    {/* New task form */}
    {editingTask === 'new' && (
      <div className="rounded-xl border border-orange-500/40 bg-gray-900 p-5 space-y-4">
        <p className="text-sm font-semibold text-orange-400">New Task</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: 'Task Name', key: 'task_name', type: 'text' },
            { label: 'Planned Finish', key: 'planned_finish', type: 'date' },
            { label: 'Actual Finish', key: 'actual_finish', type: 'date' },
            { label: 'Assigned Role', key: 'assigned_role', type: 'text' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1">{label}</label>
              <input
                type={type}
                value={taskForm[key] || ''}
                onChange={(e) => setTaskForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-orange-500 focus:outline-none"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select
              value={taskForm.status}
              onChange={(e) => setTaskForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-orange-500 focus:outline-none"
            >
              {['not_started', 'in_progress', 'completed', 'delayed', 'blocked'].map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Delay Reason</label>
            <input
              type="text"
              value={taskForm.delay_reason || ''}
              onChange={(e) => setTaskForm((f) => ({ ...f, delay_reason: e.target.value }))}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-orange-500 focus:outline-none"
              placeholder="Optional"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={saveNewTask}
            disabled={savingTask}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {savingTask ? 'Saving…' : 'Create Task'}
          </button>
          <button
            onClick={() => setEditingTask(null)}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )}

    {tasks.length === 0 && editingTask !== 'new' && (
      <p className="text-center text-gray-500 py-12">No tasks yet.</p>
    )}
            {tasks
  .filter(task =>
    profile?.role === 'subcontractor'
      ? task.assigned_role === 'subcontractor'
      : true
  )
  .map((task) =>
              editingTask === task.task_id ? (
                // Edit form
                <div key={task.task_id} className="rounded-xl border border-orange-500/40 bg-gray-900 p-5 space-y-4">
                  <p className="text-sm font-semibold text-orange-400">Editing Task</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { label: "Task Name", key: "task_name", type: "text" },
                      { label: "Planned Finish", key: "planned_finish", type: "date" },
                      { label: "Actual Finish", key: "actual_finish", type: "date" },
                      { label: "Assigned Role", key: "assigned_role", type: "text" },
                    ].map(({ label, key, type }) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-400 mb-1">{label}</label>
                        <input
                          type={type}
                          value={taskForm[key] || ""}
                          onChange={(e) => setTaskForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Status</label>
                      <select
                        value={taskForm.status}
                        onChange={(e) => setTaskForm((f) => ({ ...f, status: e.target.value }))}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-orange-500 focus:outline-none"
                      >
                        {["not_started", "in_progress", "completed", "delayed", "blocked"].map((s) => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Delay Reason</label>
                      <input
                        type="text"
                        value={taskForm.delay_reason || ""}
                        onChange={(e) => setTaskForm((f) => ({ ...f, delay_reason: e.target.value }))}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-orange-500 focus:outline-none"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={saveTask}
                      disabled={savingTask}
                      className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
                    >
                      {savingTask ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingTask(null)}
                      className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Display card
                <div key={task.task_id} className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-100 truncate">{task.task_name}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                      <span>Due: {formatDate(task.planned_finish)}</span>
                      {task.actual_finish && <span>Done: {formatDate(task.actual_finish)}</span>}
                      {task.assigned_role && <span>Role: {task.assigned_role}</span>}
                      {task.delay_reason && <span className="text-red-400">⚠ {task.delay_reason}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className={statusBadge(task.status)}>{task.status?.replace("_", " ")}</span>
                    {profile?.role === "admin" && (
                      <button
                        onClick={() => openEditTask(task)}
                        className="text-xs text-gray-500 hover:text-orange-400 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}

{activeTab === "permits" && (
  <div className="space-y-3">
    {permits.length === 0 && (
      <p className="text-center text-gray-500 py-12">No permits yet.</p>
    )}
    {permits.map((permit) => (
      <div key={permit.permit_id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-200">
              {permit.permit_required || `Permit #${permit.permit_id.slice(0,8)}`}
            </p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
              {permit.submitted_date && <span>Submitted: {formatDate(permit.submitted_date)}</span>}
              {permit.approved_date && <span>Approved: {formatDate(permit.approved_date)}</span>}
              {permit.notes && <span>{permit.notes}</span>}
            </div>
          </div>

          {/* Admin controls */}
          {profile?.role === 'admin' ? (
            <div className="flex items-center gap-2">
              <select
                value={permit.status}
                onChange={async (e) => {
                  const newStatus = e.target.value
                  const updates = { status: newStatus }
                  if (newStatus === 'approved') {
                    updates.approved_date = new Date().toISOString().split('T')[0]
                  }
                  const { error } = await supabase
                    .from('permits')
                    .update(updates)
                    .eq('permit_id', permit.permit_id)
                  if (!error) {
                    setPermits(permits.map(p =>
                      p.permit_id === permit.permit_id ? { ...p, ...updates } : p
                    ))
                    await generateAlerts(id, supabase)
                  } else {
                    alert('Error updating permit: ' + error.message)
                  }
                }}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-100 focus:border-orange-500 focus:outline-none"
              >
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </div>
          ) : (
            <span className={statusBadge(permit.status)}>{permit.status}</span>
          )}
        </div>
      </div>
    ))}
  </div>
)}

        {activeTab === "inspections" && (
  <div className="space-y-3">
    {inspections.length === 0 && (
      <p className="text-center text-gray-500 py-12">No inspections yet.</p>
    )}
    {inspections.map((insp) => (
      <div key={insp.inspection_id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-200">{insp.inspection_type}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
              <span>Scheduled: {formatDate(insp.scheduled_date)}</span>
              {insp.result && <span>Result: {insp.result}</span>}
              {insp.notes && <span>{insp.notes}</span>}
              {insp.reinspection_required && (
                <span className="text-yellow-400">⚠ Reinspection required</span>
              )}
            </div>
          </div>

          {/* Admin controls */}
          {profile?.role === 'admin' ? (
            <div className="flex items-center gap-2">
              <select
                value={insp.result || ''}
                onChange={async (e) => {
                  const newResult = e.target.value
                  const updates = {
                    result: newResult,
                    reinspection_required: newResult === 'failed',
                  }
                  const { error } = await supabase
                    .from('inspections')
                    .update(updates)
                    .eq('inspection_id', insp.inspection_id)
                  if (!error) {
                    setInspections(inspections.map(i =>
                      i.inspection_id === insp.inspection_id ? { ...i, ...updates } : i
                    ))
                    await generateAlerts(id, supabase)
                  } else {
                    alert('Error updating inspection: ' + error.message)
                  }
                }}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-100 focus:border-orange-500 focus:outline-none"
              >
                <option value="">pending</option>
                <option value="passed">passed</option>
                <option value="failed">failed</option>
                <option value="scheduled">scheduled</option>
              </select>
            </div>
          ) : (
            <span className={statusBadge(insp.result ? "completed" : "pending")}>
              {insp.result || "Pending"}
            </span>
          )}
        </div>
      </div>
    ))}
  </div>
)}
        {/* ── DAILY UPDATES TAB ── */}
        {activeTab === "daily-updates" && (
          <div className="space-y-3">
            {dailyUpdates.length === 0 && (
              <p className="text-center text-gray-500 py-12">No daily updates yet.</p>
            )}
            {dailyUpdates.map((update) => (
              <div key={update.update_id} className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-orange-400">
                    {update.date
                      ? new Date(update.date).toLocaleDateString("en-US", {
                          weekday: "short", month: "short", day: "numeric", year: "numeric",
                        })
                      : "No date"}
                  </p>
                </div>

                {update.work_completed && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Work Completed</p>
                    <p className="text-sm text-gray-200">{update.work_completed}</p>
                  </div>
                )}

                {update.work_planned_tomorrow && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Planned Tomorrow</p>
                    <p className="text-sm text-gray-200">{update.work_planned_tomorrow}</p>
                  </div>
                )}

                {update.blockers && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Blockers</p>
                    <p className="text-sm text-red-400">{update.blockers}</p>
                  </div>
                )}

                {update.material_issues && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Material Issues</p>
                    <p className="text-sm text-yellow-400">{update.material_issues}</p>
                  </div>
                )}

                {update.weather_issues && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Weather Issues</p>
                    <p className="text-sm text-yellow-400">{update.weather_issues}</p>
                  </div>
                )}

                {update.delay_reason && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Delay Reason</p>
                    <p className="text-sm text-red-400">{update.delay_reason}</p>
                  </div>
                )}

                {update.permit_updates && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Permit Updates</p>
                    <p className="text-sm text-gray-300">{update.permit_updates}</p>
                  </div>
                )}

                {update.inspection_updates && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Inspection Updates</p>
                    <p className="text-sm text-gray-300">{update.inspection_updates}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {activeTab === "ai-reports" && (
  <div className="space-y-6">

    <AIPanel projectId={id} onReportGenerated={fetchAll}
/>

    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">

      <h2 className="text-xl font-bold text-white mb-4">
        Previous AI Reports
      </h2>

      {aiReports.length === 0 && (
        <p className="text-gray-500">
          No AI reports generated yet.
        </p>
      )}

      {aiReports.map((report) => (
        <div
          key={report.report_id}
          className="mb-4 rounded-xl border border-gray-800"
        >

          <button
            onClick={() =>
              setExpandedReports((prev) => ({
                ...prev,
                [report.report_id]:
                  !prev[report.report_id],
              }))
            }
            className="w-full p-4 text-left"
          >

            <div className="flex items-center justify-between">

              <div>
                <p className="font-medium text-orange-400">
                  {report.report_type
                    .replaceAll("_", " ")
                    .toUpperCase()}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  {new Date(
                    report.created_date
                  ).toLocaleString()}
                </p>
              </div>

              <span className="text-gray-400">
                {expandedReports[report.report_id]
                  ? "−"
                  : "+"}
              </span>

            </div>
          </button>

          {expandedReports[report.report_id] && (
            <div className="border-t border-gray-800 p-4">

              <div className="whitespace-pre-wrap text-sm text-gray-300">
                {report.report_text}
              </div>

            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}
      </main>
    </div>
  );
}

