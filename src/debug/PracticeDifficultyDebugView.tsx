
// LazyTopper – Practice Debug View (Difficulty-Aware)
// Location: src/debug/PracticeDifficultyDebugView.tsx
// Purpose: Dev-only view to inspect practice sets generated via generatePracticeSet,
//          using the v1 difficulty policy under the hood. Supports Maths and Science,
//          and allows CSV export of the generated set.

import { useState, type FC } from "react";
import type { DifficultyLevel, LTSubjectKey } from "../data/predictionTypes";
import {
  generatePracticeSet,
  type PracticeSet,
} from "../data/practiceSetGenerator";

interface PracticeDifficultyDebugViewProps {}

const DEFAULT_TOTAL = 10;

const SUBJECT_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "All subjects", value: "" },
  { label: "Maths", value: "Maths" },
  { label: "Science", value: "Science" },
];

function toCsvValue(value: unknown): string {
  const text = value == null ? "" : String(value);
  if (text.includes('"') || text.includes(",") || text.includes("\n")) {
    const escaped = text.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return text;
}

function buildPracticeCsv(set: PracticeSet): string {
  const header = [
    "index",
    "id",
    "subject",
    "topicKey",
    "conceptKey",
    "difficulty",
    "marks",
    "predictionScore",
  ].join(",");

  const lines = set.questions.map((q: any, index: number) => {
    const difficulty =
      q.canonicalDifficulty ?? q.difficulty ?? "";
    const cols = [
      index + 1,
      q.id ?? "",
      q.subject ?? "",
      q.topicKey ?? "",
      q.conceptKey ?? "",
      difficulty,
      q.marks != null ? q.marks : "",
      q.predictionScore != null ? q.predictionScore : "",
    ];

    return cols.map(toCsvValue).join(",");
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

export const PracticeDifficultyDebugView: FC<PracticeDifficultyDebugViewProps> = () => {
  const [subject, setSubject] = useState<string>("");
  const [topicKey, setTopicKey] = useState<string>("");
  const [conceptKey, setConceptKey] = useState<string>("");
  const [totalQuestions, setTotalQuestions] = useState<number>(DEFAULT_TOTAL);
  const [easyWeight, setEasyWeight] = useState<number>(0.4);
  const [mediumWeight, setMediumWeight] = useState<number>(0.4);
  const [hardWeight, setHardWeight] = useState<number>(0.2);
  const [practiceSet, setPracticeSet] = useState<PracticeSet | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);

    const trimmedTopic = topicKey.trim();
    if (!trimmedTopic) {
      setError("Topic key is required to generate a practice set.");
      setPracticeSet(null);
      return;
    }

    const safeTotal = totalQuestions > 0 ? totalQuestions : DEFAULT_TOTAL;

    const difficultyMix: Partial<Record<DifficultyLevel, number>> = {
      Easy: easyWeight,
      Medium: mediumWeight,
      Hard: hardWeight,
    };

    try {
      const result = generatePracticeSet({
        subject: (subject || undefined) as LTSubjectKey | undefined,
        topicKey: trimmedTopic,
        conceptKey: conceptKey.trim() || undefined,
        totalQuestions: safeTotal,
        difficultyMix,
      });

      setPracticeSet(result);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error while generating practice set:", e);
      setError("Error while generating practice set. See console for details.");
      setPracticeSet(null);
    }
  };

  const handleExportCsv = () => {
    if (!practiceSet) return;
    const csv = buildPracticeCsv(practiceSet);
    triggerDownloadCsv(csv, "practice-set.csv");
  };

  const difficultySummary = (() => {
    const base = { Easy: 0, Medium: 0, Hard: 0 };
    if (!practiceSet) return base;
    for (const q of practiceSet.questions as any[]) {
      const existing = (q.canonicalDifficulty ?? q.difficulty ?? "").toString().toLowerCase();
      if (existing === "easy" || existing === "e") {
        base.Easy += 1;
      } else if (existing === "hard" || existing === "h") {
        base.Hard += 1;
      } else {
        base.Medium += 1;
      }
    }
    return base;
  })();

  return (
    <div className="lt-debug-root lt-practice-diff-root">
      <div className="lt-debug-section">
        <div className="lt-practice-diff-header-row">
          <h2>Practice – Difficulty-Aware Generator (Maths &amp; Science)</h2>
          {practiceSet && (
            <button type="button" onClick={handleExportCsv}>
              Export Practice CSV
            </button>
          )}
        </div>

        <p>
          This dev-only view calls <code>generatePracticeSet</code> from{" "}
          <code>src/data/practiceSetGenerator.ts</code> and lets you inspect the resulting
          practice sets for Maths and Science. Difficulty selection uses the v1 policy
          (via <code>suggestDifficulty</code>) under the hood.
        </p>

        <div className="lt-practice-diff-controls">
          <div className="lt-practice-diff-control">
            <label>
              Subject:{" "}
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                {SUBJECT_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="lt-practice-diff-control">
            <label>
              Topic key:{" "}
              <input
                type="text"
                value={topicKey}
                onChange={(e) => setTopicKey(e.target.value)}
                placeholder='e.g. "MATHS-ALG-QUAD", "SCI-CHEM-CR"'
              />
            </label>
          </div>

          <div className="lt-practice-diff-control">
            <label>
              Concept key (optional):{" "}
              <input
                type="text"
                value={conceptKey}
                onChange={(e) => setConceptKey(e.target.value)}
                placeholder="Optional narrower concept/subtopic key"
              />
            </label>
          </div>

          <div className="lt-practice-diff-control">
            <label>
              Total questions:{" "}
              <input
                type="number"
                min={1}
                value={totalQuestions}
                onChange={(e) =>
                  setTotalQuestions(Number(e.target.value) || DEFAULT_TOTAL)
                }
              />
            </label>
          </div>

          <div className="lt-practice-diff-control-group">
            <span>Difficulty weights (soft mix):</span>
            <label>
              Easy:{" "}
              <input
                type="number"
                step="0.1"
                value={easyWeight}
                onChange={(e) =>
                  setEasyWeight(Number(e.target.value) || 0)
                }
              />
            </label>
            <label>
              Medium:{" "}
              <input
                type="number"
                step="0.1"
                value={mediumWeight}
                onChange={(e) =>
                  setMediumWeight(Number(e.target.value) || 0)
                }
              />
            </label>
            <label>
              Hard:{" "}
              <input
                type="number"
                step="0.1"
                value={hardWeight}
                onChange={(e) =>
                  setHardWeight(Number(e.target.value) || 0)
                }
              />
            </label>
            <p className="lt-practice-diff-note">
              Values do not need to sum to 1. The generator normalises them internally and
              will top up from remaining questions if some buckets are short.
            </p>
          </div>

          <div className="lt-practice-diff-control">
            <button type="button" onClick={handleGenerate}>
              Generate practice set
            </button>
          </div>
        </div>

        {error && (
          <p className="lt-practice-diff-error">
            {error}
          </p>
        )}

        {practiceSet && (
          <div className="lt-practice-diff-results">
            <h3>Generated set</h3>
            <p>
              Subject:{" "}
              <strong>{practiceSet.config.subject || "All"}</strong>{" "}
              · Topic:{" "}
              <strong>{practiceSet.config.topicKey}</strong>{" "}
              {practiceSet.config.conceptKey && (
                <>
                  · Concept: <strong>{practiceSet.config.conceptKey}</strong>
                </>
              )}
            </p>
            <p>
              Total questions:{" "}
              <strong>{practiceSet.config.totalQuestions}</strong>{" "}
              · Difficulty in this set:{" "}
              <strong>
                Easy {difficultySummary.Easy} · Medium {difficultySummary.Medium} · Hard{" "}
                {difficultySummary.Hard}
              </strong>
            </p>

            <div className="lt-practice-diff-table-wrapper">
              <table className="lt-practice-diff-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question ID</th>
                    <th>Subject</th>
                    <th>Topic key</th>
                    <th>Difficulty</th>
                    <th>Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {practiceSet.questions.map((q: any, index: number) => {
                    const difficulty =
                      q.canonicalDifficulty ??
                      q.difficulty ??
                      "Medium";
                    return (
                      <tr key={`${q.id ?? "q"}-${index}`}>
                        <td>{index + 1}</td>
                        <td>{String(q.id ?? "–")}</td>
                        <td>{String(q.subject ?? "–")}</td>
                        <td>{String(q.topicKey ?? "–")}</td>
                        <td>{String(difficulty)}</td>
                        <td>{q.marks != null ? String(q.marks) : "–"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!practiceSet && !error && (
          <p className="lt-practice-diff-note">
            Choose subject (or keep "All"), enter a topic key, optionally a concept key,
            configure total questions and difficulty weights, then click{" "}
            <strong>Generate practice set</strong> to see the sample. Use the{" "}
            <strong>Export Practice CSV</strong> button to download the generated set
            for offline review or paper construction.
          </p>
        )}
      </div>
    </div>
  );
};

export default PracticeDifficultyDebugView;
