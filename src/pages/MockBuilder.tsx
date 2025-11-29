// src/pages/MockBuilder.tsx

import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  predictedQuestions,
  type PredictedQuestion,
  type DifficultyKey,
  type SectionKey,
} from "../data/predictedQuestions";
import {
  predictedQuestionsScience,
  type PredictedScienceQuestion,
} from "../data/predictedQuestionsScience";

// ----- Shared/local types -----

// Subject toggle (Maths / Science)
type SubjectKey = "Maths" | "Science";

// Extend paper section id to also include E (case-study)
type PaperSectionId = SectionKey | "E";

interface SectionConfig {
  id: PaperSectionId;
  title: string;
  subtitle: string;
  icon: string;
  marksPerQuestion: number;
  targetQuestions: number;
  description: string;
}

// Allow builder questions to carry Socratic fields
type PredictedQuestionWithSteps = (
  | PredictedQuestion
  | PredictedScienceQuestion
) & {
  solutionSteps?: string[];
  finalAnswer?: string;
};

interface BuiltSection extends SectionConfig {
  questions: PredictedQuestionWithSteps[];
  availableCount: number;
  sectionMarks: number;
}

const SECTION_CONFIGS: SectionConfig[] = [
  {
    id: "A",
    title: "Section A — MCQs / 1 mark",
    subtitle: "Quick hitters. Concept checks and speed questions.",
    icon: "⚡",
    marksPerQuestion: 1,
    targetQuestions: 20,
    description: "Objective / MCQ-type questions checking core ideas.",
  },
  {
    id: "B",
    title: "Section B — 2 marks",
    subtitle: "Very short answers. Two-step reasoning.",
    icon: "💬",
    marksPerQuestion: 2,
    targetQuestions: 6,
    description: "Concept application with 2–3 key steps in the solution.",
  },
  {
    id: "C",
    title: "Section C — 3 marks",
    subtitle: "Short answers. Multi-step questions with some working.",
    icon: "🧠",
    marksPerQuestion: 3,
    targetQuestions: 8,
    description: "Heavier reasoning, but still within 3-mark CBSE style.",
  },
  {
    id: "D",
    title: "Section D — 4 marks",
    subtitle: "Long answers. Full working and presentation.",
    icon: "📜",
    marksPerQuestion: 4,
    targetQuestions: 6,
    description: "Full-length questions with proper steps and justification.",
  },
  {
    id: "E",
    title: "Section E — Case study / 4 marks",
    subtitle: "Case-based sets with data, diagrams or tables.",
    icon: "📚",
    marksPerQuestion: 4,
    targetQuestions: 3, // Q36–38 as per CBSE pattern
    description:
      "Case-study sets with multiple sub-parts built on a common situation.",
  },
];

// Use plain literal union so both Maths & Science difficulty keys work
const difficultyChipStyle: Record<
  "Easy" | "Medium" | "Hard",
  React.CSSProperties
> = {
  Easy: {
    background: "rgba(34,197,94,0.12)",
    color: "#16a34a",
  },
  Medium: {
    background: "rgba(234,179,8,0.12)",
    color: "#b45309",
  },
  Hard: {
    background: "rgba(248,113,113,0.12)",
    color: "#dc2626",
  },
};

function normaliseSubject(raw: string | null): SubjectKey {
  const val = (raw || "").toLowerCase();
  if (val === "science" || val === "sci") return "Science";
  return "Maths";
}

const MockBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const grade = searchParams.get("grade") || "10";
  const subjectParam = searchParams.get("subject");
  const subjectKey: SubjectKey = normaliseSubject(subjectParam);

  const [openSectionId, setOpenSectionId] = useState<PaperSectionId | null>(
    "A"
  );
  const [openSolutions, setOpenSolutions] = useState<Record<string, boolean>>(
    {}
  );

  // 🔁 Switch Maths/Science via URL param
  const handleSubjectChange = (next: SubjectKey) => {
    if (next === subjectKey) return;
    const params = new URLSearchParams(searchParams);
    params.set("grade", grade);
    params.set("subject", next);
    navigate({
      pathname: "/mock-builder",
      search: `?${params.toString()}`,
    });
  };

  // Pick the correct prediction bank based on subject
  const questionBank: PredictedQuestionWithSteps[] = useMemo(() => {
    if (subjectKey === "Science") {
      return predictedQuestionsScience as PredictedQuestionWithSteps[];
    }
    return predictedQuestions as PredictedQuestionWithSteps[];
  }, [subjectKey]);

  // Build sectioned paper from prediction bank
  const builtSections: BuiltSection[] = useMemo(() => {
    const bySection: Record<PaperSectionId, PredictedQuestionWithSteps[]> = {
      A: [],
      B: [],
      C: [],
      D: [],
      E: [],
    };

    questionBank.forEach((q) => {
      const sec = ((q.section as PaperSectionId) ?? "A") as PaperSectionId;
      if (!bySection[sec]) bySection[sec] = [];
      bySection[sec].push(q);
    });

    return SECTION_CONFIGS.map((cfg) => {
      const pool = bySection[cfg.id] ?? [];
      const selected = pool.slice(0, cfg.targetQuestions);
      const marks = selected.reduce((sum, q) => sum + (q.marks ?? 0), 0);

      return {
        ...cfg,
        questions: selected,
        availableCount: pool.length,
        sectionMarks: marks,
      };
    });
  }, [questionBank]);

  const totalQuestions = builtSections.reduce(
    (sum, s) => sum + s.questions.length,
    0
  );
  const totalMarks = builtSections.reduce(
    (sum, s) => sum + s.sectionMarks,
    0
  );
  const targetMarks = SECTION_CONFIGS.reduce(
    (sum, s) => sum + s.marksPerQuestion * s.targetQuestions,
    0
  );

  const toggleSection = (id: PaperSectionId) => {
    setOpenSectionId((prev) => (prev === id ? null : id));
  };

  const toggleSolution = (id: string) => {
    setOpenSolutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBack = () => {
    // Go back to the same subject trends page
    navigate(`/trends/${grade}/${subjectKey}`);
  };

  const sectionLabel = (id: PaperSectionId) => {
    switch (id) {
      case "A":
        return "Section A";
      case "B":
        return "Section B";
      case "C":
        return "Section C";
      case "D":
        return "Section D";
      case "E":
        return "Section E";
      default:
        return "Section";
    }
  };

  return (
    <div
      className="page-container"
      style={{ paddingBottom: 40, maxWidth: 1200, margin: "0 auto" }}
    >
      {/* Back link */}
      <button
        onClick={handleBack}
        style={{
          border: "none",
          background: "transparent",
          color: "#4b5563",
          fontSize: "0.9rem",
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          marginBottom: 10,
        }}
      >
        ← Back to chapter trends
      </button>

      {/* 🌗 Subject toggle pill */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: 4,
            borderRadius: 999,
            background: "#0f172a",
            boxShadow: "0 12px 30px rgba(15,23,42,0.55)",
            border: "1px solid rgba(148,163,184,0.5)",
            gap: 4,
          }}
        >
          {(["Maths", "Science"] as SubjectKey[]).map((subj) => {
            const active = subj === subjectKey;
            return (
              <button
                key={subj}
                onClick={() => handleSubjectChange(subj)}
                style={{
                  borderRadius: 999,
                  border: "none",
                  padding: "6px 14px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: active
                    ? "linear-gradient(135deg,#facc15,#f97316)"
                    : "transparent",
                  color: active ? "#111827" : "#e5e7eb",
                  transition: "all 0.15s ease",
                  minWidth: 80,
                }}
              >
                {subj}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero header – same vibe as HPQ */}
      <header
        style={{
          borderRadius: 32,
          padding: "22px 22px 24px",
          background:
            "linear-gradient(135deg,rgba(15,23,42,0.98),rgba(37,99,235,0.95))",
          color: "#e5e7eb",
          boxShadow: "0 26px 70px rgba(15,23,42,0.7)",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontSize: "0.8rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            opacity: 0.9,
            marginBottom: 6,
          }}
        >
          Class {grade} • {subjectKey}
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "2.1rem",
            lineHeight: 1.22,
          }}
        >
          Auto-mock paper blueprint
        </h1>
        <p
          style={{
            marginTop: 10,
            marginBottom: 0,
            fontSize: "0.95rem",
            maxWidth: 820,
          }}
        >
          This view shows how your high-probability pool fills out each CBSE
          section A–E. As you add more questions, the blueprint gets richer and
          closer to a full 80-mark board paper.
        </p>
      </header>

      {/* Paper blueprint summary – HPQ-style dark card */}
      <section
        style={{
          borderRadius: 26,
          padding: "16px 18px 18px",
          background: "rgba(15,23,42,0.96)",
          color: "#e5e7eb",
          boxShadow: "0 20px 55px rgba(15,23,42,0.65)",
          border: "1px solid rgba(148,163,184,0.35)",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: "0.85rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            opacity: 0.85,
            marginBottom: 6,
          }}
        >
          Paper blueprint
        </div>
        <div
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          {totalQuestions} questions · {totalMarks} marks{" "}
          <span style={{ fontWeight: 400 }}>
            (target vibe: {targetMarks} marks)
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "0.85rem",
            color: "#9ca3af",
            maxWidth: 900,
          }}
        >
          Sections follow the latest CBSE-style pattern:{" "}
          <strong>A: 20 × 1 mark</strong>, <strong>B: 6 × 2 marks</strong>,{" "}
          <strong>C: 8 × 3 marks</strong>, <strong>D: 6 × 4 marks</strong>,{" "}
          <strong>E: 3 × 4-mark case-studies</strong>. Everything here is built
          from your <strong>prediction bank</strong> for {subjectKey}.
        </p>
      </section>

      {/* Sections – collapsible, HPQ-vibe cards */}
      {builtSections.map((section) => {
        const isOpen = openSectionId === section.id;
        const label = sectionLabel(section.id);

        return (
          <section
            key={section.id}
            style={{
              borderRadius: 26,
              padding: "16px 18px 14px",
              background: "#f9fafb",
              boxShadow: "0 18px 40px rgba(148,163,184,0.35)",
              border: "1px solid #e5e7eb",
              marginBottom: 16,
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "1rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  <span>{section.icon}</span>
                  <span>{section.title}</span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.9rem",
                    color: "#4b5563",
                  }}
                >
                  {section.subtitle}
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.82rem",
                    color: "#6b7280",
                  }}
                >
                  {section.questions.length} / {section.targetQuestions}{" "}
                  questions · approx {section.marksPerQuestion} marks each
                </p>
              </div>

              <button
                onClick={() => toggleSection(section.id)}
                style={{
                  borderRadius: 999,
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  padding: "6px 12px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                {isOpen ? `Hide ${label}` : `Show ${label}`} ▸
              </button>
            </div>

            {/* Description line below header */}
            <p
              style={{
                marginTop: 10,
                marginBottom: isOpen ? 8 : 0,
                fontSize: "0.86rem",
                color: "#4b5563",
              }}
            >
              {section.description}
            </p>

            {/* Questions list – only when open */}
            {isOpen && (
              <div
                style={{
                  marginTop: 4,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {section.questions.length === 0 ? (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#6b7280",
                      marginTop: 6,
                      marginBottom: 2,
                    }}
                  >
                    No questions available in this section yet. Add more entries
                    with section {section.id} to{" "}
                    <code style={{ fontSize: "0.8rem" }}>
                      {subjectKey === "Science"
                        ? "predictedQuestionsScience.ts"
                        : "predictedQuestions.ts"}
                    </code>
                    .
                  </p>
                ) : (
                  section.questions.map((q) => {
                    const solOpen = !!openSolutions[q.id];
                    return (
                      <article
                        key={q.id}
                        style={{
                          borderRadius: 18,
                          padding: "10px 12px 9px",
                          background: "#ffffff",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        {/* Meta chips row */}
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            alignItems: "center",
                            marginBottom: 6,
                            fontSize: "0.8rem",
                          }}
                        >
                          <span
                            style={{
                              borderRadius: 999,
                              padding: "4px 10px",
                              background: "#020617",
                              color: "#f9fafb",
                              fontWeight: 600,
                            }}
                          >
                            {q.marks} marks
                          </span>
                          <span
                            style={{
                              borderRadius: 999,
                              padding: "4px 10px",
                              background: "#eef2ff",
                              color: "#3730a3",
                            }}
                          >
                            {q.kind} · Sec {q.section}
                          </span>
                          <span
                            style={{
                              borderRadius: 999,
                              padding: "4px 10px",
                              fontWeight: 500,
                              ...difficultyChipStyle[
                                q.difficulty as DifficultyKey
                              ],
                            }}
                          >
                            {q.difficulty}
                          </span>
                          <span
                            style={{
                              borderRadius: 999,
                              padding: "4px 10px",
                              background: "#ecfeff",
                              color: "#0e7490",
                            }}
                          >
                            {q.subtopic}
                          </span>

                          <span style={{ marginLeft: "auto" }} />

                          {/* See solution toggle */}
                          <button
                            onClick={() => toggleSolution(q.id)}
                            style={{
                              borderRadius: 999,
                              border: "1px solid #d1d5db",
                              padding: "4px 10px",
                              fontSize: "0.78rem",
                              cursor: "pointer",
                              background: solOpen ? "#020617" : "#ffffff",
                              color: solOpen ? "#f9fafb" : "#111827",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            {solOpen ? "Hide solution" : "See solution"}
                          </button>
                        </div>

                        {/* Question text */}
                        <div
                          style={{
                            fontSize: "0.95rem",
                            lineHeight: 1.6,
                            color: "#111827",
                          }}
                        >
                          {q.questionText}
                        </div>

                        {/* Solution box */}
                        {solOpen && (
                          <div
                            style={{
                              marginTop: 8,
                              borderRadius: 14,
                              padding: "8px 10px",
                              background: "#eff6ff",
                              border: "1px dashed #bfdbfe",
                              fontSize: "0.85rem",
                              color: "#1e3a8a",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 600,
                                marginBottom: 4,
                                fontSize: "0.82rem",
                              }}
                            >
                              Quick reasoning:
                            </div>

                            {q.solutionSteps && q.solutionSteps.length > 0 ? (
                              <ol
                                style={{
                                  marginTop: 4,
                                  paddingLeft: 18,
                                  marginBottom: q.finalAnswer ? 4 : 0,
                                }}
                              >
                                {q.solutionSteps.map((step, idx) => (
                                  <li
                                    key={idx}
                                    style={{
                                      marginBottom: 2,
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <div>{q.explanation}</div>
                            )}

                            {q.finalAnswer && (
                              <div
                                style={{
                                  marginTop: 6,
                                  fontWeight: 600,
                                }}
                              >
                                Final answer:{" "}
                                <span style={{ fontWeight: 500 }}>
                                  {q.finalAnswer}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default MockBuilder;
