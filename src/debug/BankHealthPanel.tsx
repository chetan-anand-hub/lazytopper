// LazyTopper – Bank Health Debug Panel
// Location: src/debug/BankHealthPanel.tsx
// Purpose: Render BankHealthReport with basic filters + CSV export for offline review.

import React, { useMemo, useState } from "react";
import type { FC } from "react";
import type { BankHealthReport } from "../prediction/bankHealth";

// We keep row typing loose here so that this panel is resilient to small schema changes
// in src/prediction/bankHealth.ts.
type TopicBankHealthRowLike = any;

interface BankHealthPanelProps {
  report: BankHealthReport;
}

type CoverageFilter = "all" | "zero" | "low" | "ok";

function normaliseString(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

function toCsvValue(value: unknown): string {
  const text = normaliseString(value);
  if (text.includes('"') || text.includes(",") || text.includes("\n")) {
    // Escape using CSV rules: wrap in double quotes, double-up existing quotes.
    const escaped = text.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return text;
}

function buildCsv(rows: TopicBankHealthRowLike[]): string {
  if (!rows?.length) {
    return "subject,topicKey,topicTitle,totalSlots,bankCount,coverageStatus,missingInBank,missingInTrends,diffEasy,diffMedium,diffHard,diffOther";
  }

  const header = [
    "subject",
    "topicKey",
    "topicTitle",
    "totalSlots",
    "bankCount",
    "coverageStatus",
    "missingInBank",
    "missingInTrends",
    "diffEasy",
    "diffMedium",
    "diffHard",
    "diffOther",
  ].join(",");

  const lines = rows.map((row) => {
    const difficulty = (row && row.difficultyCounts) || {};
    const easy = difficulty.easy ?? difficulty.Easy ?? 0;
    const medium = difficulty.medium ?? difficulty.Medium ?? 0;
    const hard = difficulty.hard ?? difficulty.Hard ?? 0;

    const knownSum = Number(easy || 0) + Number(medium || 0) + Number(hard || 0);
    const total = typeof difficulty.total === "number" ? difficulty.total : knownSum;
    const diffOther = total && total > knownSum ? total - knownSum : 0;

    const cols = [
      toCsvValue(row?.subject),
      toCsvValue(row?.topicKey),
      toCsvValue(row?.topicTitle),
      toCsvValue(row?.totalSlots ?? row?.expectedSlots),
      toCsvValue(row?.bankCount),
      toCsvValue(row?.coverageStatus ?? row?.status),
      toCsvValue(row?.missingInBank),
      toCsvValue(row?.missingInTrends),
      toCsvValue(easy),
      toCsvValue(medium),
      toCsvValue(hard),
      toCsvValue(diffOther),
    ];

    return cols.join(",");
  });

  return [header, ...lines].join("\n");
}

export const BankHealthPanel: FC<BankHealthPanelProps> = ({ report }) => {
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>("all");
  const [topicKeyQuery, setTopicKeyQuery] = useState<string>("");

  const rows: TopicBankHealthRowLike[] = useMemo(
    () => (report && (report as any).rows ? (report as any).rows : []),
    [report]
  );

  const subjects = useMemo(() => {
    const allSubjects = new Set<string>();
    for (const row of rows) {
      if (!row) continue;
      const subject = normaliseString(row.subject || row.subjectId || row.boardSubject);
      if (subject) {
        allSubjects.add(subject);
      }
    }
    return Array.from(allSubjects).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = topicKeyQuery.trim().toLowerCase();

    return rows
      .filter((row) => {
        if (!row) return false;

        if (subjectFilter !== "all") {
          const subject = normaliseString(row.subject || row.subjectId || row.boardSubject);
          if (!subject || subject !== subjectFilter) {
            return false;
          }
        }

        if (coverageFilter !== "all") {
          const status = normaliseString(row.coverageStatus || row.status).toLowerCase();
          if (!status || status !== coverageFilter) {
            return false;
          }
        }

        if (query) {
          const topicKey = normaliseString(row.topicKey);
          const topicTitle = normaliseString(row.topicTitle);
          const haystack = `${topicKey} ${topicTitle}`.toLowerCase();
          if (!haystack.includes(query)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const subjectA = normaliseString(a.subject || a.subjectId || a.boardSubject);
        const subjectB = normaliseString(b.subject || b.subjectId || b.boardSubject);
        if (subjectA !== subjectB) {
          return subjectA.localeCompare(subjectB);
        }
        const topicA = normaliseString(a.topicKey);
        const topicB = normaliseString(b.topicKey);
        return topicA.localeCompare(topicB);
      });
  }, [rows, subjectFilter, coverageFilter, topicKeyQuery]);

  const handleExportCsv = () => {
    const csv = buildCsv(filteredRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bank-health-report.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const summary = (report as any)?.summary || {};

  return (
    <div className="lt-bh-panel">
      <h2 className="lt-bh-title">Bank Health – Topic Coverage</h2>

      <div className="lt-bh-summary-row">
        <div className="lt-bh-summary-tile">
          <div className="lt-bh-summary-label">Total topic slots</div>
          <div className="lt-bh-summary-value">{summary.totalTopicSlots ?? "–"}</div>
        </div>
        <div className="lt-bh-summary-tile lt-bh-summary-bad">
          <div className="lt-bh-summary-label">Zero coverage</div>
          <div className="lt-bh-summary-value">{summary.zeroCoverageCount ?? "–"}</div>
        </div>
        <div className="lt-bh-summary-tile lt-bh-summary-warn">
          <div className="lt-bh-summary-label">Low coverage</div>
          <div className="lt-bh-summary-value">{summary.lowCoverageCount ?? "–"}</div>
        </div>
        <div className="lt-bh-summary-tile lt-bh-summary-bad">
          <div className="lt-bh-summary-label">Missing in bank</div>
          <div className="lt-bh-summary-value">{summary.missingInBankCount ?? "–"}</div>
        </div>
        <div className="lt-bh-summary-tile lt-bh-summary-warn">
          <div className="lt-bh-summary-label">Missing in TopicHub/Trends</div>
          <div className="lt-bh-summary-value">{summary.missingInTrendsCount ?? "–"}</div>
        </div>
      </div>

      <div className="lt-bh-controls">
        <div className="lt-bh-control">
          <label>
            Subject:{" "}
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="all">All</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="lt-bh-control">
          <label>
            Coverage:{" "}
            <select
              value={coverageFilter}
              onChange={(e) => setCoverageFilter(e.target.value as CoverageFilter)}
            >
              <option value="all">All</option>
              <option value="zero">Zero</option>
              <option value="low">Low</option>
              <option value="ok">OK</option>
            </select>
          </label>
        </div>

        <div className="lt-bh-control">
          <label>
            Topic search:{" "}
            <input
              type="text"
              value={topicKeyQuery}
              onChange={(e) => setTopicKeyQuery(e.target.value)}
              placeholder="Filter by topic key / title"
            />
          </label>
        </div>

        <div className="lt-bh-control">
          <button type="button" onClick={handleExportCsv}>
            Export filtered rows as CSV
          </button>
        </div>
      </div>

      <div className="lt-bh-table-wrapper">
        <table className="lt-bh-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Topic key</th>
              <th>Topic title</th>
              <th>Total slots</th>
              <th>In bank</th>
              <th>Coverage</th>
              <th>Missing in bank</th>
              <th>Missing in trends</th>
              <th>Easy</th>
              <th>Medium</th>
              <th>Hard</th>
              <th>Other/Unknown</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => {
              const difficulty = (row && row.difficultyCounts) || {};
              const easy = difficulty.easy ?? difficulty.Easy ?? 0;
              const medium = difficulty.medium ?? difficulty.Medium ?? 0;
              const hard = difficulty.hard ?? difficulty.Hard ?? 0;

              const knownSum = Number(easy || 0) + Number(medium || 0) + Number(hard || 0);
              const total = typeof difficulty.total === "number" ? difficulty.total : knownSum;
              const diffOther = total && total > knownSum ? total - knownSum : 0;

              const status = normaliseString(row.coverageStatus || row.status).toLowerCase();

              const rowClassNames = [
                "lt-bh-row",
                status === "zero" ? "lt-bh-row-zero" : "",
                status === "low" ? "lt-bh-row-low" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <tr key={`${row.subject || "row"}-${row.topicKey || index}`} className={rowClassNames}>
                  <td>{normaliseString(row.subject || row.subjectId || row.boardSubject) || "–"}</td>
                  <td>{normaliseString(row.topicKey) || "–"}</td>
                  <td>{normaliseString(row.topicTitle) || "–"}</td>
                  <td>{row.totalSlots ?? row.expectedSlots ?? "–"}</td>
                  <td>{row.bankCount ?? "–"}</td>
                  <td>{normaliseString(row.coverageStatus || row.status) || "–"}</td>
                  <td>{row.missingInBank ? "Yes" : "No"}</td>
                  <td>{row.missingInTrends ? "Yes" : "No"}</td>
                  <td>{easy}</td>
                  <td>{medium}</td>
                  <td>{hard}</td>
                  <td>{diffOther}</td>
                </tr>
              );
            })}
            {!filteredRows.length && (
              <tr>
                <td colSpan={12} style={{ textAlign: "center" }}>
                  No rows match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BankHealthPanel;