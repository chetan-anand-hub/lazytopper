// LazyTopper – Prediction Debug View
// Location: src/debug/PredictionDebugView.tsx
// Purpose: Dev-only screen that surfaces internal state of PredictionCore
//          and exposes Bank Health / Difficulty for QA and CSV export.

import { useMemo, useState, type FC } from "react";

import { PredictionCore } from "../data/predictionCore";
import { buildTopicKeySources } from "../prediction/buildTopicKeySources";
import { buildBankHealthReport } from "../prediction/bankHealth";
import type { BankHealthReport } from "../prediction/bankHealth";
import BankHealthPanel from "./BankHealthPanel";
import {
  buildDifficultySnapshot,
  type DifficultySnapshot,
} from "../prediction/difficultyAutoSuggest";

type DebugTabId = "overview" | "bankHealth" | "difficulty";

interface PredictionDebugViewProps {}

function buildDifficultyCsv(snapshot: DifficultySnapshot): string {
  const header = [
    "id",
    "topicKey",
    "marks",
    "existingDifficulty",
    "suggestedDifficulty",
    "bloomLevel",
    "format",
  ].join(",");

  const lines = snapshot.suggestions.map((s) => {
    const cols = [
      s.id ?? "",
      s.topicKey ?? "",
      s.marks != null ? String(s.marks) : "",
      s.existingDifficulty ?? "",
      s.suggestedDifficulty,
      s.bloomLevel ?? "",
      s.format ?? "",
    ];
    return cols
      .map((value) => {
        const text = value == null ? "" : String(value);
        if (text.includes('"') || text.includes(",") || text.includes("\n")) {
          const escaped = text.replace(/"/g, '""');
          return `"${escaped}"`;
        }
        return text;
      })
      .join(",");
  });

  return [header, ...lines].join("\n");
}

function triggerDownloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export const PredictionDebugView: FC<PredictionDebugViewProps> = () => {
  const [activeTab, setActiveTab] = useState<DebugTabId>("overview");

  // Core derived data shared across tabs
  const allQuestions = useMemo(
    () =>
      (PredictionCore as any).getAllQuestions
        ? (PredictionCore as any).getAllQuestions()
        : [],
    []
  );

  const topicKeySources = useMemo(() => buildTopicKeySources(), []);

  const bankHealthReport: BankHealthReport | null = useMemo(() => {
    try {
      return buildBankHealthReport({
        questions: allQuestions as any,
        topicKeySources,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error while building BankHealthReport in PredictionDebugView:", error);
      return null;
    }
  }, [allQuestions, topicKeySources]);

  const difficultySnapshot: DifficultySnapshot | null = useMemo(() => {
    try {
      return buildDifficultySnapshot();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error while building DifficultySnapshot in PredictionDebugView:", error);
      return null;
    }
  }, []);

  const renderOverview = () => {
    const totalQuestions =
      Array.isArray(allQuestions) && allQuestions.length ? allQuestions.length : 0;

    const subjects = new Set<string>();
    for (const q of allQuestions as any[]) {
      if (!q) continue;
      const subject = String((q as any).subject ?? (q as any).boardSubject ?? "").trim();
      if (subject) subjects.add(subject);
    }

    return (
      <div className="lt-debug-section">
        <h2>Prediction Debug – Overview</h2>
        <p>
          This view surfaces internal state of <code>PredictionCore</code> and related helpers.
          Use it for sanity-checking canonical bank size, subject coverage, and derived reports.
        </p>
        <ul>
          <li>Total canonical questions: {totalQuestions}</li>
          <li>Subjects in bank: {Array.from(subjects).join(", ") || "–"}</li>
          <li>TopicKey sources: {topicKeySources.length}</li>
        </ul>
      </div>
    );
  };

  const renderBankHealth = () => {
    if (!bankHealthReport) {
      return (
        <div className="lt-debug-section">
          <h2>Bank Health</h2>
          <p>BankHealthReport could not be computed. Check console logs for details.</p>
        </div>
      );
    }

    return (
      <div className="lt-debug-section">
        <BankHealthPanel report={bankHealthReport} />
      </div>
    );
  };

  const renderDifficulty = () => {
    if (!difficultySnapshot) {
      return (
        <div className="lt-debug-section">
          <h2>Difficulty – Auto-Suggest</h2>
          <p>Difficulty snapshot could not be computed. Check console logs for details.</p>
        </div>
      );
    }

    const { totalQuestions, distribution, changedCount, suggestions } = difficultySnapshot;

    const changedSuggestions = suggestions.filter((s) => s.changed);
    const unchangedSuggestions = suggestions.filter((s) => !s.changed);

    const handleExportDifficultyCsv = () => {
      const csv = buildDifficultyCsv(difficultySnapshot);
      triggerDownloadCsv(csv, "difficulty-snapshot.csv");
    };

    return (
      <div className="lt-debug-section lt-diff-section">
        <div className="lt-diff-header-row">
          <h2>Difficulty – Auto-Suggest (v1 Policy)</h2>
          <button type="button" onClick={handleExportDifficultyCsv}>
            Export Difficulty CSV
          </button>
        </div>

        <p>
          This tab runs the v1 difficulty policy over the canonical question bank and shows the
          suggested Easy/Medium/Hard labels. Use it to spot bank entries where the suggested label
          disagrees with the current one.
        </p>

        <div className="lt-diff-summary-row">
          <div className="lt-diff-summary-tile">
            <div className="lt-diff-summary-label">Total questions</div>
            <div className="lt-diff-summary-value">{totalQuestions}</div>
          </div>
          <div className="lt-diff-summary-tile">
            <div className="lt-diff-summary-label">Easy</div>
            <div className="lt-diff-summary-value">{distribution.easy}</div>
          </div>
          <div className="lt-diff-summary-tile">
            <div className="lt-diff-summary-label">Medium</div>
            <div className="lt-diff-summary-value">{distribution.medium}</div>
          </div>
          <div className="lt-diff-summary-tile">
            <div className="lt-diff-summary-label">Hard</div>
            <div className="lt-diff-summary-value">{distribution.hard}</div>
          </div>
          <div className="lt-diff-summary-tile lt-diff-summary-warn">
            <div className="lt-diff-summary-label">Existing vs suggested differ</div>
            <div className="lt-diff-summary-value">{changedCount}</div>
          </div>
        </div>

        <div className="lt-diff-columns">
          <div className="lt-diff-column">
            <h3>Changed labels (existing ≠ suggested)</h3>
            <p>
              These are candidates for manual review. The suggested label is derived solely from
              marks, Bloom level, format, and structure fields.
            </p>
            <div className="lt-diff-table-wrapper">
              <table className="lt-diff-table">
                <thead>
                  <tr>
                    <th>Question ID</th>
                    <th>Topic key</th>
                    <th>Marks</th>
                    <th>Existing</th>
                    <th>Suggested</th>
                    <th>Bloom</th>
                    <th>Format</th>
                  </tr>
                </thead>
                <tbody>
                  {changedSuggestions.map((s) => (
                    <tr key={`changed-${s.id}-${s.topicKey}`}>
                      <td>{s.id || "–"}</td>
                      <td>{s.topicKey || "–"}</td>
                      <td>{s.marks ?? "–"}</td>
                      <td>{s.existingDifficulty ?? "–"}</td>
                      <td>{s.suggestedDifficulty}</td>
                      <td>{s.bloomLevel ?? "–"}</td>
                      <td>{s.format ?? "–"}</td>
                    </tr>
                  ))}
                  {!changedSuggestions.length && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center" }}>
                        No differences between existing and suggested difficulty labels.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lt-diff-column">
            <h3>Stable labels (existing = suggested)</h3>
            <p>
              These rows are shown in brief to give confidence that the policy agrees with existing
              tagging for the majority of the bank.
            </p>
            <div className="lt-diff-table-wrapper lt-diff-table-compact">
              <table className="lt-diff-table">
                <thead>
                  <tr>
                    <th>Question ID</th>
                    <th>Topic key</th>
                    <th>Marks</th>
                    <th>Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {unchangedSuggestions.slice(0, 100).map((s) => (
                    <tr key={`unchanged-${s.id}-${s.topicKey}`}>
                      <td>{s.id || "–"}</td>
                      <td>{s.topicKey || "–"}</td>
                      <td>{s.marks ?? "–"}</td>
                      <td>{s.suggestedDifficulty}</td>
                    </tr>
                  ))}
                  {!unchangedSuggestions.length && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center" }}>
                        No questions found in snapshot.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {unchangedSuggestions.length > 100 && (
                <p className="lt-diff-note">
                  Showing first 100 stable rows only to keep the debug view light. Use scripts or
                  exports if you need full data.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="lt-debug-root">
      <div className="lt-debug-tabs">
        <button
          type="button"
          className={activeTab === "overview" ? "lt-debug-tab lt-debug-tab--active" : "lt-debug-tab"}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          type="button"
          className={activeTab === "bankHealth" ? "lt-debug-tab lt-debug-tab--active" : "lt-debug-tab"}
          onClick={() => setActiveTab("bankHealth")}
        >
          Bank Health
        </button>
        <button
          type="button"
          className={activeTab === "difficulty" ? "lt-debug-tab lt-debug-tab--active" : "lt-debug-tab"}
          onClick={() => setActiveTab("difficulty")}
        >
          Difficulty
        </button>
      </div>

      <div className="lt-debug-body">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "bankHealth" && renderBankHealth()}
        {activeTab === "difficulty" && renderDifficulty()}
      </div>
    </div>
  );
};

export default PredictionDebugView;