"use client";

import { useState } from "react";

const REPORT_TYPES = [
  {
    label: "Daily Summary",
    type: "daily_summary",
    color: "text-blue-400",
    border: "border-blue-400",
  },
  {
    label: "Risk Report",
    type: "risk_report",
    color: "text-red-400",
    border: "border-red-400",
  },
  {
    label: "Internal Update",
    type: "internal_update",
    color: "text-orange-400",
    border: "border-orange-400",
  },
  {
    label: "Client Update",
    type: "client_update",
    color: "text-green-400",
    border: "border-green-400",
  },
  {
    label: "Missing Info Check",
    type: "missing_info",
    color: "text-yellow-400",
    border: "border-yellow-400",
  },
];

    export default function AIPanel({projectId,onReportGenerated,
}){
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  async function generateReport(reportType) {
    try {
      setLoading(true);
      setError("");
      setReport(null);

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType,
          projectId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to generate AI report"
        );
      }

      const config = REPORT_TYPES.find(
        (r) => r.type === reportType
      );

setReport({
        type: reportType,
        label: config.label,
        color: config.color,
        border: config.border,
        text: data.report,
        generatedAt: new Date(),
      });

      if (onReportGenerated) {
        onReportGenerated();
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyReport() {
    if (!report?.text) return;

    try {
      await navigator.clipboard.writeText(report.text);
      alert("Report copied to clipboard");
    } catch {
      alert("Unable to copy report");
    }
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">
          AI Reports
        </h2>

        <p className="mt-1 text-sm text-gray-400">
          Generate project insights using Gemini AI
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-3">

        {REPORT_TYPES.map((item) => (
          <button
            key={item.type}
            disabled={loading}
            onClick={() =>
              generateReport(item.type)
            }
            className={`
              bg-gray-800
              hover:bg-gray-700
              disabled:opacity-50
              disabled:cursor-not-allowed
              rounded-lg
              px-4
              py-2
              text-sm
              font-medium
              transition
              ${item.color}
            `}
          >
            {item.label}
          </button>
        ))}

      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-6">
          <div className="bg-gray-800 animate-pulse rounded-lg h-32 flex items-center justify-center">
            <span className="text-gray-400">
              Generating AI report...
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
          <p className="text-red-400 text-sm">
            {error}
          </p>
        </div>
      )}

      {/* Report */}
      {report && (
        <div
          className={`
            mt-6
            rounded-2xl
            border
            border-gray-800
            border-l-4
            ${report.border}
            bg-gray-800
            p-6
          `}
        >

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">

            <div>
              <p
                className={`font-semibold ${report.color}`}
              >
                {report.label}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Generated:
                {" "}
                {report.generatedAt.toLocaleString()}
              </p>
            </div>

            <button
              onClick={copyReport}
              className="
                rounded-lg
                bg-gray-700
                px-3
                py-2
                text-sm
                text-white
                hover:bg-gray-600
                transition
              "
            >
              Copy to Clipboard
            </button>

          </div>

          <div className="whitespace-pre-wrap text-sm text-gray-200 leading-relaxed">
            {report.text}
          </div>

        </div>
      )}

    </div>
  );
}