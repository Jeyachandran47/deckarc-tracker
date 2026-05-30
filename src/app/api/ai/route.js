// src/app/api/ai/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Supabase with service role so RLS doesn't block server-side reads
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Prompts per report type
const PROMPTS = {
  daily_summary:
    "You are a construction project manager assistant. Based on the project data above, write a concise daily summary of today's progress, what was completed, what is in progress, and any issues flagged. Use plain professional English. Max 200 words.",

  risk_report:
    "You are a construction risk analyst. Based on the project data above, identify all delayed or at-risk milestones, explain why each is risky, and give specific recommended next actions for each risk. Format as: Risk 1, Risk 2, etc. Max 300 words.",

  internal_update:
    `You are writing an internal DECKARC team update. Based on the project data above, write a structured internal update covering:
- Overall status
- Completed work
- Current blockers
- Upcoming milestones
- Team actions required
Use bullet points. Max 300 words.`,

  client_update:
    `You are writing a client-facing construction progress update. Based on the project data above, write a friendly, professional, jargon-free update for the client covering:
- Completed work
- Current work
- Next steps
- Decisions needed from client
Do not mention internal delays or technical construction terms. Max 200 words.`,

  missing_info:
    "You are a construction project assistant reviewing daily update completeness. Based on the project data above, identify missing or incomplete information and generate numbered follow-up questions. Max 150 words.",
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { reportType, projectId } = body;

    // ── Validate inputs ───────────────────────────────────────────────────────

    if (!reportType || !projectId) {
      return NextResponse.json(
        { error: "reportType and projectId are required." },
        { status: 400 }
      );
    }

    if (!PROMPTS[reportType]) {
      return NextResponse.json(
        { error: `Unsupported reportType: ${reportType}. Valid types: ${Object.keys(PROMPTS).join(", ")}` },
        { status: 400 }
      );
    }

    // ── Fetch all project data in parallel ────────────────────────────────────

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString().split("T")[0];

    const [
      { data: project, error: projectError },
      { data: tasks },
      { data: dailyUpdates },
      { data: permits },
      { data: inspections },
      { data: alerts },
    ] = await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("project_id", projectId)
        .single(),
      supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("planned_finish"),
      supabase
        .from("daily_updates")
        .select("*")
        .eq("project_id", projectId)
        .gte("date", sevenDaysAgoISO)
        .order("date", { ascending: false }),
      supabase
        .from("permits")
        .select("*")
        .eq("project_id", projectId),
      supabase
        .from("inspections")
        .select("*")
        .eq("project_id", projectId)
        .order("scheduled_date"),
      supabase
        .from("alerts")
        .select("*")
        .eq("project_id", projectId)
        .eq("resolved_status", false)
        .order("created_date", { ascending: false }),
    ]);

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    // ── Build context string ──────────────────────────────────────────────────

    const context = `
PROJECT OVERVIEW
----------------
Name: ${project.project_name}
Client: ${project.client_name}
Address: ${project.address || "N/A"}
Type: ${project.project_type || "N/A"}
Status: ${project.status}
Start Date: ${project.start_date || "N/A"}
Expected Finish: ${project.expected_finish_date || "N/A"}
Projected Finish: ${project.projected_finish_date || "Not set"}
Notes: ${project.notes || "None"}

TASKS (${tasks?.length || 0} total)
----------------
${
  tasks && tasks.length > 0
    ? tasks
        .map(
          (t) =>
            `- [${t.status?.toUpperCase()}] ${t.task_name}` +
            (t.assigned_role ? ` | Role: ${t.assigned_role}` : "") +
            (t.planned_finish ? ` | Due: ${t.planned_finish}` : "") +
            (t.actual_finish ? ` | Completed: ${t.actual_finish}` : "") +
            (t.delay_reason ? ` | Delay reason: ${t.delay_reason}` : "") +
            (t.notes ? ` | Notes: ${t.notes}` : "")
        )
        .join("\n")
    : "No tasks found."
}

DAILY UPDATES — Last 7 Days (${dailyUpdates?.length || 0} entries)
----------------
${
  dailyUpdates && dailyUpdates.length > 0
    ? dailyUpdates
        .map(
          (u) =>
            `[${u.date}]\n` +
            (u.work_completed ? `  Work completed: ${u.work_completed}\n` : "") +
            (u.work_planned_tomorrow ? `  Planned tomorrow: ${u.work_planned_tomorrow}\n` : "") +
            (u.blockers ? `  Blockers: ${u.blockers}\n` : "") +
            (u.material_issues ? `  Material issues: ${u.material_issues}\n` : "") +
            (u.weather_issues ? `  Weather issues: ${u.weather_issues}\n` : "") +
            (u.delay_reason ? `  Delay reason: ${u.delay_reason}\n` : "") +
            (u.permit_updates ? `  Permit updates: ${u.permit_updates}\n` : "") +
            (u.inspection_updates ? `  Inspection updates: ${u.inspection_updates}\n` : "")
        )
        .join("\n")
    : "No daily updates in the last 7 days."
}

PERMITS (${permits?.length || 0} total)
----------------
${
  permits && permits.length > 0
    ? permits
        .map(
          (p) =>
            `- ${p.permit_required || "Unnamed permit"}` +
            ` | Status: ${p.status}` +
            (p.submitted_date ? ` | Submitted: ${p.submitted_date}` : " | Not submitted") +
            (p.approved_date ? ` | Approved: ${p.approved_date}` : "") +
            (p.notes ? ` | Notes: ${p.notes}` : "")
        )
        .join("\n")
    : "No permits found."
}

INSPECTIONS (${inspections?.length || 0} total)
----------------
${
  inspections && inspections.length > 0
    ? inspections
        .map(
          (i) =>
            `- ${i.inspection_type || "Unnamed inspection"}` +
            (i.scheduled_date ? ` | Scheduled: ${i.scheduled_date}` : "") +
            ` | Result: ${i.result || "Pending"}` +
            (i.reinspection_required ? " | ⚠ Reinspection required" : "") +
            (i.notes ? ` | Notes: ${i.notes}` : "")
        )
        .join("\n")
    : "No inspections found."
}

ACTIVE ALERTS (${alerts?.length || 0} unresolved)
----------------
${
  alerts && alerts.length > 0
    ? alerts
        .map(
          (a) =>
            `- [${a.alert_level?.toUpperCase()}] ${a.alert_type}: ${a.alert_message}` +
            ` (Created: ${new Date(a.created_date).toLocaleDateString()})`
        )
        .join("\n")
    : "No active alerts."
}
`.trim();

    // ── Call Gemini ───────────────────────────────────────────────────────────

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const fullPrompt = `${context}\n\n---\n\n${PROMPTS[reportType]}`;

    const result = await model.generateContent(fullPrompt);
    const reportText = result.response.text();

    // ── Save to ai_reports ────────────────────────────────────────────────────

    const { error: insertError } = await supabase.from("ai_reports").insert({
      project_id: projectId,
      report_type: reportType,
      report_text: reportText,
      created_date: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Failed to save AI report:", insertError.message);
      // Don't fail the request — still return the report even if save fails
    }

    // ── Return report ─────────────────────────────────────────────────────────

    return NextResponse.json({ report: reportText });

  } catch (error) {
    console.error("AI route error:", error);

    // Gemini-specific error messaging
    if (error.message?.includes("API_KEY")) {
      return NextResponse.json(
        { error: "Invalid or missing Gemini API key. Check GEMINI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    if (error.message?.includes("quota")) {
      return NextResponse.json(
        { error: "Gemini API quota exceeded. Try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate report. " + error.message },
      { status: 500 }
    );
  }
}