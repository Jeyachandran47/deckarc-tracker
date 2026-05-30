// src/lib/generateAlerts.js

export async function generateAlerts(projectId, supabase) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const in7Days = new Date(today);
  in7Days.setDate(today.getDate() + 7);

  const in3Days = new Date(today);
  in3Days.setDate(today.getDate() + 3);

  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 14);

  // Fetch tasks, permits, inspections in parallel
  const [{ data: tasks }, { data: permits }, { data: inspections }] =
    await Promise.all([
      supabase.from("tasks").select("*").eq("project_id", projectId),
      supabase.from("permits").select("*").eq("project_id", projectId),
      supabase.from("inspections").select("*").eq("project_id", projectId),
    ]);

  // Delete all existing unresolved alerts for this project
  await supabase
    .from("alerts")
    .delete()
    .eq("project_id", projectId)
    .eq("resolved_status", false);

  const alertsToInsert = [];

  // ── TASK ALERTS ──────────────────────────────────────────────────────────────

  const allTasksDone =
    tasks &&
    tasks.length > 0 &&
    tasks.every((t) => t.status === "completed");

  if (allTasksDone) {
    alertsToInsert.push({
      project_id: projectId,
      alert_type: "Task Completion",
      alert_level: "green",
      alert_message: "All tasks in this project are marked completed.",
      created_date: new Date().toISOString(),
      resolved_status: false,
    });
  } else {
    for (const task of tasks || []) {
      const plannedFinish = task.planned_finish
        ? new Date(task.planned_finish)
        : null;

      // RED — task is delayed or blocked
      if (task.status === "delayed" || task.status === "blocked") {
        alertsToInsert.push({
          project_id: projectId,
          alert_type: "Task Delayed",
          alert_level: "red",
          alert_message: `Task "${task.task_name}" is marked as ${task.status}${
            task.delay_reason ? ": " + task.delay_reason : "."
          }`,
          created_date: new Date().toISOString(),
          resolved_status: false,
        });
      }

      // RED — planned finish is in the past and not completed
      if (
        plannedFinish &&
        plannedFinish < today &&
        task.status !== "completed"
      ) {
        alertsToInsert.push({
          project_id: projectId,
          alert_type: "Task Overdue",
          alert_level: "red",
          alert_message: `Task "${task.task_name}" was due on ${task.planned_finish} and is not yet completed.`,
          created_date: new Date().toISOString(),
          resolved_status: false,
        });
      }

      // YELLOW — planned finish within next 7 days and not completed
      if (
        plannedFinish &&
        plannedFinish >= today &&
        plannedFinish <= in7Days &&
        task.status !== "completed"
      ) {
        alertsToInsert.push({
          project_id: projectId,
          alert_type: "Task Due Soon",
          alert_level: "yellow",
          alert_message: `Task "${task.task_name}" is due on ${task.planned_finish} and is not yet completed.`,
          created_date: new Date().toISOString(),
          resolved_status: false,
        });
      }
    }
  }

  // ── PERMIT ALERTS ─────────────────────────────────────────────────────────────

  for (const permit of permits || []) {
    // RED — permit is required but has no submitted_date
    if (permit.permit_required && !permit.submitted_date) {
      alertsToInsert.push({
        project_id: projectId,
        alert_type: "Permit Not Submitted",
        alert_level: "red",
        alert_message: `Permit (ID: ${permit.permit_id}) is required but has not been submitted.`,
        created_date: new Date().toISOString(),
        resolved_status: false,
      });
    }

    // YELLOW — permit is pending and submitted more than 14 days ago
    if (permit.status === "pending" && permit.submitted_date) {
      const submittedDate = new Date(permit.submitted_date);
      if (submittedDate < fourteenDaysAgo) {
        alertsToInsert.push({
          project_id: projectId,
          alert_type: "Permit Pending Long",
          alert_level: "yellow",
          alert_message: `Permit submitted on ${permit.submitted_date} has been pending for over 14 days.`,
          created_date: new Date().toISOString(),
          resolved_status: false,
        });
      }
    }
  }

  // ── INSPECTION ALERTS ─────────────────────────────────────────────────────────

  for (const inspection of inspections || []) {
    const scheduledDate = inspection.scheduled_date
      ? new Date(inspection.scheduled_date)
      : null;

    // YELLOW — inspection has no result and is scheduled within 3 days
    if (
      !inspection.result &&
      scheduledDate &&
      scheduledDate <= in3Days &&
      scheduledDate >= today
    ) {
      alertsToInsert.push({
        project_id: projectId,
        alert_type: "Inspection Upcoming",
        alert_level: "yellow",
        alert_message: `Inspection "${inspection.inspection_type}" is scheduled for ${inspection.scheduled_date} with no result recorded yet.`,
        created_date: new Date().toISOString(),
        resolved_status: false,
      });
    }
  }

  // ── INSERT ALL ALERTS ─────────────────────────────────────────────────────────

  if (alertsToInsert.length > 0) {
    const { error } = await supabase.from("alerts").insert(alertsToInsert);
    if (error) {
      console.error("Error inserting alerts:", error.message);
    }
  }

  return alertsToInsert;
}