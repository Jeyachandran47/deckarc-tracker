"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import Navbar from '../components/Navbar'

export default function ReportsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [groupedReports, setGroupedReports] = useState({});
  const [totalReports, setTotalReports] = useState(0);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

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

    if (!prof) {
      router.push("/login");
      return;
    }

    if (prof.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    setProfile(prof);

    await loadReports();

    setLoading(false);
  }

  async function loadReports() {
    const [
      { data: reportsData },
      { data: projectsData },
    ] = await Promise.all([
      supabase
        .from("ai_reports")
        .select("*")
        .order("created_date", {
          ascending: false,
        }),

      supabase
        .from("projects")
        .select("project_id, project_name"),
    ]);

    const reports = reportsData || [];
    const projects = projectsData || [];

    setTotalReports(reports.length);

    const projectMap = {};

    projects.forEach((project) => {
      projectMap[project.project_id] =
        project.project_name;
    });

    const grouped = {};

    reports.forEach((report) => {
      const projectName =
        projectMap[report.project_id] ||
        "Unknown Project";

      if (!grouped[projectName]) {
        grouped[projectName] = [];
      }

      grouped[projectName].push(report);
    });

    setGroupedReports(grouped);
  }

  function toggleReport(id) {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function reportBadge(type) {
    const styles = {
      daily_summary:
        "bg-blue-500/20 text-blue-400",

      risk_report:
        "bg-red-500/20 text-red-400",

      internal_update:
        "bg-orange-500/20 text-orange-400",

      client_update:
        "bg-green-500/20 text-green-400",

      missing_info:
        "bg-yellow-500/20 text-yellow-400",
    };

    return styles[type] ||
      "bg-gray-700 text-gray-300";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">
          Loading reports...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar profile={profile} />

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">

          <h1 className="text-3xl font-bold text-white">
            AI Reports
          </h1>

          <p className="mt-2 text-gray-400">
            All generated Gemini reports
          </p>

        </div>

        {/* Stats Card */}
        <div className="mb-8 rounded-2xl border border-gray-800 bg-gray-900 p-6">

          <p className="text-sm text-gray-500">
            Total Reports
          </p>

          <p className="mt-2 text-4xl font-bold text-orange-500">
            {totalReports}
          </p>

        </div>

        {/* Projects */}
        {Object.keys(groupedReports).length === 0 && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <p className="text-gray-500">
              No reports generated yet.
            </p>
          </div>
        )}

        {Object.entries(groupedReports).map(
          ([projectName, reports]) => (
            <div
              key={projectName}
              className="mb-8 rounded-2xl border border-gray-800 bg-gray-900 p-6"
            >

              <h2 className="text-xl font-bold text-orange-400 mb-5">
                {projectName}
              </h2>

              <div className="space-y-4">

                {reports.map((report) => (
                  <div
                    key={report.report_id}
                    className="rounded-xl border border-gray-800"
                  >

                    <button
                      onClick={() =>
                        toggleReport(
                          report.report_id
                        )
                      }
                      className="w-full text-left p-4"
                    >

                      <div className="flex flex-wrap items-center justify-between gap-3">

                        <div>

                          <span
                            className={`
                              inline-block
                              rounded-full
                              px-3
                              py-1
                              text-xs
                              font-medium
                              ${reportBadge(
                                report.report_type
                              )}
                            `}
                          >
                            {report.report_type.replaceAll(
                              "_",
                              " "
                            )}
                          </span>

                          <p className="mt-2 text-xs text-gray-500">
                            {new Date(
                              report.created_date
                            ).toLocaleString()}
                          </p>

                        </div>

                        <span className="text-gray-500">
                          {expanded[
                            report.report_id
                          ]
                            ? "Hide"
                            : "Expand"}
                        </span>

                      </div>

                      <p className="mt-3 text-sm text-gray-400">
                        {report.report_text.slice(
                          0,
                          150
                        )}
                        ...
                      </p>

                    </button>

                    {expanded[
                      report.report_id
                    ] && (
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
          )
        )}

      </main>
    </div>
  );
}