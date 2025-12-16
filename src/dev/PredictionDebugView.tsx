// src/dev/PracticeDebugView.tsx
// DEV-ONLY: quick UI to inspect generatePracticeSet() behaviour.
// This does NOT touch student-facing Practice Mode yet.
// You can mount it at /debug/practice or any dev route.

import React, { useMemo, useState } from "react";
import { PredictionCore } from "../data/predictionCore";
import type { LTSubjectKey } from "../data/predictionTypes";
import { generatePracticeSet } from "../data/practiceSetGenerator";

interface TopicOption {
  key: string;
  label: string;
  subject: LTSubjectKey;
}

export const PracticeDebugView: React.FC = () => {
  const [subject, setSubject] = useState<LTSubjectKey | "All">("Maths");
  const [topicKey, setTopicKey] = useState<string>("");
  const [totalQuestions, setTotalQuestions] = useState<number>(10);

  const allQuestions = useMemo(
    () => PredictionCore.getAllQuestions(),
    []
  );

  const subjects: LTSubjectKey[] = useMemo(
    () => Array.from(new Set(allQuestions.map((q) => q.subject))),
    [allQuestions]
  );

  const topicOptions: TopicOption[] = useMemo(() => {
    const list: TopicOption[] = [];
    const byKey = new Map<string, TopicOption>();

    for (const q of allQuestions) {
      if (subject !== "All" && q.subject !== subject) continue;
      if (byKey.has(q.topicKey)) continue;
      const opt: TopicOption = {
        key: q.topicKey,
        label: q.topicKey,
        subject: q.subject,
      };
      byKey.set(q.topicKey, opt);
      list.push(opt);
    }

    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [allQuestions, subject]);

  // Keep topicKey in sync when subject changes.
  React.useEffect(() => {
    if (!topicKey && topicOptions.length > 0) {
      setTopicKey(topicOptions[0].key);
    } else if (topicKey) {
      const stillExists = topicOptions.some((t) => t.key === topicKey);
      if (!stillExists && topicOptions.length > 0) {
        setTopicKey(topicOptions[0].key);
      }
    }
  }, [topicOptions, topicKey]);

  const practiceSet = useMemo(() => {
    if (!topicKey) return null;
    const cfgSubject = subject === "All" ? undefined : subject;
    return generatePracticeSet({
      subject: cfgSubject,
      topicKey,
      totalQuestions,
    });
  }, [subject, topicKey, totalQuestions]);

  const generatedCount = practiceSet?.questions.length ?? 0;
  const requestedCount = totalQuestions;
  const isLimitedByBank =
    practiceSet != null && generatedCount < requestedCount;

  return (
    <div style={{ padding: "1.5rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: "0.75rem" }}>Practice Debug View</h1>
      <p style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#555" }}>
        DEV-ONLY panel. Uses <code>generatePracticeSet</code> to sample
        predicted questions for a given topic. This is a sandbox view to check
        coverage and difficulty mixes before wiring the student-facing
        Practice Mode / Mentor flows.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginBottom: "1rem",
          alignItems: "center",
        }}
      >
        <label style={{ fontSize: "0.9rem" }}>
          Subject:&nbsp;
          <select
            value={subject}
            onChange={(e) =>
              setSubject(e.target.value as LTSubjectKey | "All")
            }
          >
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value="All">All</option>
          </select>
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Topic (topicKey):&nbsp;
          <select
            value={topicKey}
            onChange={(e) => setTopicKey(e.target.value)}
          >
            {topicOptions.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Questions (requested):&nbsp;
          <select
            value={totalQuestions}
            onChange={(e) => setTotalQuestions(parseInt(e.target.value, 10))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </label>
      </div>

      {practiceSet && (
        <>
          <div style={{ marginBottom: "0.75rem", fontSize: "0.9rem" }}>
            Generated{" "}
            <strong>
              {generatedCount} / {requestedCount}
            </strong>{" "}
            questions for{" "}
            <strong>{practiceSet.config.topicKey}</strong>
            {practiceSet.config.subject && (
              <>
                {" "}
                (<strong>{practiceSet.config.subject}</strong>)
              </>
            )}
            . Difficulty mix (normalised):{" "}
            <code>
              Easy {practiceSet.config.difficultyMix.Easy.toFixed(2)} · Medium{" "}
              {practiceSet.config.difficultyMix.Medium.toFixed(2)} · Hard{" "}
              {practiceSet.config.difficultyMix.Hard.toFixed(2)}
            </code>
            {isLimitedByBank && (
              <span style={{ marginLeft: "0.5rem", color: "#b35b00" }}>
                (Limited by current question bank for this topic)
              </span>
            )}
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
              }}
            >
              <thead style={{ backgroundColor: "#f5f5f5" }}>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Subtopic</th>
                  <th style={thStyle}>Sec</th>
                  <th style={thStyle}>Marks</th>
                  <th style={thStyle}>Diff</th>
                  <th style={thStyle}>Score</th>
                  <th style={thStyle}>Question</th>
                </tr>
              </thead>
              <tbody>
                {practiceSet.questions.map((q) => (
                  <tr key={q.id}>
                    <td style={tdStyle}>{q.id}</td>
                    <td style={tdStyle}>{q.subtopic}</td>
                    <td style={tdStyle}>{q.section}</td>
                    <td style={tdStyle}>{q.marks}</td>
                    <td style={tdStyle}>{q.difficulty}</td>
                    <td style={tdStyle}>
                      {q.predictionScore != null
                        ? q.predictionScore.toFixed(2)
                        : "-"}
                    </td>
                    <td style={{ ...tdStyle, maxWidth: "460px" }}>
                      {q.questionText}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!practiceSet && (
        <p style={{ fontSize: "0.9rem", color: "#888", marginTop: "0.5rem" }}>
          Select a subject and topic key to generate a practice set.
        </p>
      )}
    </div>
  );
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.35rem 0.5rem",
  borderBottom: "1px solid #ddd",
};

const tdStyle: React.CSSProperties = {
  padding: "0.3rem 0.5rem",
  borderBottom: "1px solid #f0f0f0",
  verticalAlign: "top",
};

export default PracticeDebugView;
