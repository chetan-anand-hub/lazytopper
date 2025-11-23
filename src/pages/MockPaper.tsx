// src/pages/MockPaper.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  predictedQuestions,
  type PredictedQuestion,
  type DifficultyKey,
  type SectionKey,
} from "../data/predictedQuestions";
import {
  predictivePapers,
  type PredictivePaper,
} from "../data/predictivePapers";
import {
  class10TopicTrendList,
  type Class10TopicKey,
} from "../data/class10MathTopicTrends";

// --------------------------- Types for built paper ---------------------------

interface BuiltSection {
  id: SectionKey;
  title: string;
  questions: PredictedQuestion[];
  sectionMarks: number;
  targetMarks: number;
}

interface BuiltPaper {
  sections: BuiltSection[];
  totalMarks: number;
  targetMarks: number;
  byTopicMarks: Record<Class10TopicKey, number>;
}

// --------------------------- Topic + difficulty meta ------------------------

type TopicTier = "must-crack" | "high-roi" | "good-to-do";

const topicMetaByKey: Record<
  Class10TopicKey,
  {
    weightagePercent: number;
    tier: TopicTier;
  }
> = {} as any;

class10TopicTrendList.forEach((entry) => {
  const key = entry.topicKey as Class10TopicKey;
  const tier =
    (entry.tier as TopicTier | undefined) ?? ("good-to-do" as TopicTier);
  topicMetaByKey[key] = {
    weightagePercent: entry.weightagePercent ?? 0,
    tier,
  };
});

// Target difficulty mix for the whole 80-mark paper (approx.)
const difficultyTargetRatio: Record<DifficultyKey, number> = {
  Easy: 0.5,
  Medium: 0.35,
  Hard: 0.15,
};

// --------------------------- Small helpers ----------------------------------

const difficultyChipStyle: Record<DifficultyKey, React.CSSProperties> = {
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

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --------------------------- Core builder (heuristics) ----------------------

function buildMockPaperFromBank(opts: {
  questions: PredictedQuestion[];
  sectionMarks: Record<SectionKey, number>;
}): BuiltPaper {
  const { questions, sectionMarks } = opts;

  const sectionOrder: SectionKey[] = ["A", "B", "C", "D", "E"];

  const sectionTitles: Record<SectionKey, string> = {
    A: "Section A – 1-mark / MCQ / AR",
    B: "Section B – 2-mark Short Answers",
    C: "Section C – 3-mark Short Answers",
    D: "Section D – 4–5 mark Long Answers",
    E: "Section E – Case-based (4 marks)",
  };

  // Blueprint total marks (usually 80)
  const totalTargetMarks = (Object.keys(sectionMarks) as SectionKey[]).reduce(
    (sum, sec) => sum + (sectionMarks[sec] ?? 0),
    0
  );

  // Topic-wise target marks from trend weightage (11% PLE, 10% Trig, etc.)
  const topicTargetMarks: Partial<Record<Class10TopicKey, number>> = {};
  const totalWeightage = class10TopicTrendList.reduce(
    (sum, entry) => sum + (entry.weightagePercent ?? 0),
    0
  );

  class10TopicTrendList.forEach((entry) => {
    const key = entry.topicKey as Class10TopicKey;
    const wt = entry.weightagePercent ?? 0;
    if (totalWeightage > 0) {
      topicTargetMarks[key] = (wt / totalWeightage) * totalTargetMarks;
    } else {
      topicTargetMarks[key] = 0;
    }
  });

  // Difficulty target marks (e.g. ~40 Easy, ~28 Medium, ~12 Hard for 80 marks)
  const difficultyTargetMarks: Partial<Record<DifficultyKey, number>> = {
    Easy: difficultyTargetRatio.Easy * totalTargetMarks,
    Medium: difficultyTargetRatio.Medium * totalTargetMarks,
    Hard: difficultyTargetRatio.Hard * totalTargetMarks,
  };

  // Running tracking: how many marks we have already given to each topic + difficulty
  const currentTopicMarks: Partial<Record<Class10TopicKey, number>> = {};
  const currentDifficultyMarks: Partial<Record<DifficultyKey, number>> = {
    Easy: 0,
    Medium: 0,
    Hard: 0,
  };

  const builtSections: BuiltSection[] = [];

  for (const sec of sectionOrder) {
    const target = sectionMarks[sec] ?? 0;
    const pool = shuffleArray(questions.filter((q) => q.section === sec));

    const picked: PredictedQuestion[] = [];
    let sectionUsedMarks = 0;

    // Greedy + scored selection
    while (sectionUsedMarks < target && pool.length > 0) {
      let bestIndex = -1;
      let bestScore = -Infinity;

      for (let i = 0; i < pool.length; i += 1) {
        const q = pool[i];

        // Try not to overshoot the section target too badly
        if (sectionUsedMarks + q.marks > target && picked.length > 0) {
          continue;
        }

        const topicKey = q.topicKey;
        const difficulty = q.difficulty;

        const topicMeta = topicMetaByKey[topicKey];
        const topicTier = topicMeta?.tier ?? "good-to-do";

        // Topic deficit: how many marks are we "short" of that topic vs its target.
        const topicTarget = topicTargetMarks[topicKey] ?? 0;
        const topicCurrent = currentTopicMarks[topicKey] ?? 0;
        const topicDeficit = Math.max(0, topicTarget - topicCurrent);

        // Difficulty deficit: how much below target we are in that difficulty.
        const diffTarget = difficultyTargetMarks[difficulty] ?? 0;
        const diffCurrent = currentDifficultyMarks[difficulty] ?? 0;
        const diffDeficit = Math.max(0, diffTarget - diffCurrent);

        // Tier bonus: must-crack > high-ROI > good-to-do
        const tierBonus =
          topicTier === "must-crack" ? 3 : topicTier === "high-roi" ? 1.5 : 1;

        // Slight preference for lower-mark questions early in each section
        const markPenalty = q.marks <= 2 ? 0.5 : 0;

        // Composite score: tier + topic gap + difficulty gap + tiny randomness
        const score =
          tierBonus * 10 +
          topicDeficit * 0.8 +
          diffDeficit * 0.6 +
          markPenalty +
          Math.random() * 0.5;

        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }

      if (bestIndex === -1) {
        break;
      }

      const chosen = pool.splice(bestIndex, 1)[0];
      picked.push(chosen);
      sectionUsedMarks += chosen.marks;

      // update running topic marks
      const tk = chosen.topicKey;
      currentTopicMarks[tk] = (currentTopicMarks[tk] ?? 0) + chosen.marks;

      // update difficulty marks
      const dk = chosen.difficulty;
      currentDifficultyMarks[dk] =
        (currentDifficultyMarks[dk] ?? 0) + chosen.marks;
    }

    // If a section is still empty but has a pool, pick at least one question
    if (picked.length === 0 && pool.length > 0) {
      const chosen = pool[0];
      picked.push(chosen);
      sectionUsedMarks += chosen.marks;
      const tk = chosen.topicKey;
      currentTopicMarks[tk] = (currentTopicMarks[tk] ?? 0) + chosen.marks;
      const dk = chosen.difficulty;
      currentDifficultyMarks[dk] =
        (currentDifficultyMarks[dk] ?? 0) + chosen.marks;
    }

    builtSections.push({
      id: sec,
      title: sectionTitles[sec],
      questions: picked,
      sectionMarks: sectionUsedMarks,
      targetMarks: target,
    });
  }

  const totalMarks = builtSections.reduce(
    (sum, sec) => sum + sec.sectionMarks,
    0
  );

  const byTopicMarks: Partial<Record<Class10TopicKey, number>> = {};
  builtSections.forEach((sec) => {
    sec.questions.forEach((q) => {
      const key = q.topicKey;
      byTopicMarks[key] = (byTopicMarks[key] ?? 0) + (q.marks ?? 0);
    });
  });

  return {
    sections: builtSections,
    totalMarks,
    targetMarks: totalTargetMarks,
    byTopicMarks: byTopicMarks as Record<Class10TopicKey, number>,
  };
}

// --------------------------- Component --------------------------------------

const MockPaper: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();

  const [builtPaper, setBuiltPaper] = useState<BuiltPaper | null>(null);
  const [openSolutions, setOpenSolutions] = useState<Record<string, boolean>>(
    {}
  );

  // dev-only flag (Vite-friendly)
  const isDev =
    typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.DEV;

  // Find meta for the selected predictive paper
  const paperMeta: PredictivePaper | undefined = useMemo(() => {
    if (slug) {
      const found = predictivePapers.find((p) => p.slug === slug);
      if (found) return found;
    }
    return predictivePapers[0];
  }, [slug]);

  // Map topicKey → nicer topicName (for breakdown pill labels)
 const topicLabelMap = useMemo(() => {
  const map: Partial<Record<Class10TopicKey, string>> = {};
  class10TopicTrendList.forEach((entry) => {
    map[entry.topicKey as Class10TopicKey] = entry.topicKey;
  });
  return map as Record<Class10TopicKey, string>;
}, []);
;

  const isCurated =
    !!paperMeta?.questionIds && paperMeta.questionIds.length > 0;

  // Build paper whenever meta changes or we regenerate
  useEffect(() => {
    if (!paperMeta) return;

    if (isCurated) {
      // Curated path: use exactly the questionIds given in predictivePapers.ts
      const idSet = new Set(paperMeta.questionIds);
      const pool = predictedQuestions.filter((q) => idSet.has(q.id));

      const sectionOrder: SectionKey[] = ["A", "B", "C", "D", "E"];
      const sectionMarks = paperMeta.sectionMarks;

      const sectionTitleMap: Record<SectionKey, string> = {
        A: "Section A – 1-mark / MCQ / AR",
        B: "Section B – 2-mark Short Answers",
        C: "Section C – 3-mark Short Answers",
        D: "Section D – 4–5 mark Long Answers",
        E: "Section E – Case-based (4 marks)",
      };

      const sections: BuiltSection[] = sectionOrder.map((sec) => {
        const inSection = pool.filter((q) => q.section === sec);
        const usedMarks = inSection.reduce(
          (sum, q) => sum + (q.marks ?? 0),
          0
        );
        return {
          id: sec,
          title: sectionTitleMap[sec],
          questions: inSection,
          sectionMarks: usedMarks,
          targetMarks: sectionMarks[sec] ?? 0,
        };
      });

      const totalMarks = sections.reduce(
        (sum, sec) => sum + sec.sectionMarks,
        0
      );
      const targetMarks = (Object.keys(sectionMarks) as SectionKey[]).reduce(
        (sum, sec) => sum + (sectionMarks[sec] ?? 0),
        0
      );

      const byTopicMarks: Partial<Record<Class10TopicKey, number>> = {};
      sections.forEach((sec) => {
        sec.questions.forEach((q) => {
          const key = q.topicKey;
          byTopicMarks[key] = (byTopicMarks[key] ?? 0) + (q.marks ?? 0);
        });
      });

      setBuiltPaper({
        sections,
        totalMarks,
        targetMarks,
        byTopicMarks: byTopicMarks as Record<Class10TopicKey, number>,
      });
    } else {
      // Dynamic path: build from full prediction bank using the blueprint
      const built = buildMockPaperFromBank({
        questions: predictedQuestions,
        sectionMarks: paperMeta.sectionMarks,
      });
      setBuiltPaper(built);
    }

    setOpenSolutions({});
  }, [paperMeta, isCurated]);

  if (!paperMeta || !builtPaper) {
    return (
      <div
        className="page-container"
        style={{ paddingBottom: 40, maxWidth: 1200, margin: "0 auto" }}
      >
        <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
          Loading mock paper…
        </p>
      </div>
    );
  }

  // 🔍 Dev-only difficulty marks split (Easy / Medium / Hard) for THIS mock
  const difficultyMarks = useMemo(() => {
    const totals: Record<DifficultyKey, number> = {
      Easy: 0,
      Medium: 0,
      Hard: 0,
    };

    builtPaper.sections.forEach((sec) => {
      sec.questions.forEach((q) => {
        const marks = typeof q.marks === "number" ? q.marks : 0;
        if (q.difficulty in totals) {
          totals[q.difficulty as DifficultyKey] += marks;
        }
      });
    });

    return totals;
  }, [builtPaper]);

  const handleBack = () => {
    navigate("/trends/10/Maths");
  };

  const handleToggleSolution = (id: string) => {
    setOpenSolutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRegenerate = () => {
    if (isCurated) return;
    const built = buildMockPaperFromBank({
      questions: predictedQuestions,
      sectionMarks: paperMeta.sectionMarks,
    });
    setBuiltPaper(built);
    setOpenSolutions({});
  };

  const topicBreakdownEntries = useMemo(() => {
    const entries = Object.entries(builtPaper.byTopicMarks) as [
      Class10TopicKey,
      number
    ][];
    return entries
      .filter(([, marks]) => marks > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [builtPaper.byTopicMarks]);

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

      {/* Hero header */}
      <header
        style={{
          borderRadius: 32,
          padding: "22px 22px 24px",
          background:
            "linear-gradient(135deg,rgba(15,23,42,0.98),rgba(37,99,235,0.95))",
          color: "#e5e7eb",
          boxShadow: "0 26px 70px rgba(15,23,42,0.7)",
          marginBottom: 18,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: "0.8rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            opacity: 0.9,
          }}
        >
          Class 10 • Maths • Predictive Engine
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "2.1rem",
                lineHeight: 1.22,
              }}
            >
              {paperMeta.title}
            </h1>
            <p
              style={{
                marginTop: 6,
                marginBottom: 0,
                fontSize: "0.95rem",
                maxWidth: 760,
              }}
            >
              {paperMeta.tagline}{" "}
              <span style={{ opacity: 0.85 }}>
                ({paperMeta.vibe || "Board-style mock"})
              </span>
            </p>
          </div>

          {!isCurated && (
            <button
              onClick={handleRegenerate}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(248,250,252,0.9)",
                background: "#f9fafb",
                padding: "7px 14px",
                fontSize: "0.82rem",
                cursor: "pointer",
                color: "#020617",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
                boxShadow: "0 10px 30px rgba(15,23,42,0.6)",
                marginTop: 2,
              }}
            >
              🔁 Regenerate paper
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: "rgba(15,23,42,0.06)",
                }}
              >
                new mix
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Blueprint + topic breakdown */}
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
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <div
              style={{
                fontSize: "0.85rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                opacity: 0.85,
                marginBottom: 6,
              }}
            >
              Paper blueprint summary
            </div>
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              {builtPaper.totalMarks} marks selected{" "}
              <span style={{ fontWeight: 400 }}>
                (blueprint target: {builtPaper.targetMarks} marks)
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                color: "#9ca3af",
                maxWidth: 640,
              }}
            >
              The engine pulls from your{" "}
              <code style={{ fontSize: "0.8rem" }}>predictedQuestions.ts</code>{" "}
              bank and tries to respect the CBSE-style A–E mark distribution
              from{" "}
              <code style={{ fontSize: "0.8rem" }}>predictivePapers.ts</code>,{" "}
              plus topic weightage/tier and difficulty balance. Regenerate to
              see another 80-mark vibe from the same high-probability pool.
            </p>

            {/* DEV-ONLY: difficulty marks split */}
            {isDev && (
              <div
                style={{
                  marginTop: 10,
                  padding: "6px 10px",
                  borderRadius: 10,
                  background: "rgba(15,23,42,0.88)",
                  border: "1px dashed rgba(148,163,184,0.85)",
                  fontSize: "0.78rem",
                  fontFamily:
                    "system-ui, -apple-system, BlinkMacSystemFont, 'SF Mono', ui-monospace, monospace",
                  color: "#e5e7eb",
                }}
              >
                <div style={{ opacity: 0.7, marginBottom: 2 }}>
                  DEV · Difficulty marks split for this mock
                </div>
                <div>
                  Easy: <strong>{difficultyMarks.Easy}</strong> · Medium:{" "}
                  <strong>{difficultyMarks.Medium}</strong> · Hard:{" "}
                  <strong>{difficultyMarks.Hard}</strong>
                </div>
              </div>
            )}
          </div>

          {topicBreakdownEntries.length > 0 && (
            <div
              style={{
                minWidth: 260,
                maxWidth: 420,
                background: "rgba(15,23,42,0.9)",
                borderRadius: 18,
                padding: "10px 12px",
                border: "1px solid rgba(148,163,184,0.5)",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 6,
                  color: "#cbd5f5",
                }}
              >
                Topic-wise marks in this mock
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  fontSize: "0.82rem",
                }}
              >
                {topicBreakdownEntries.map(([topicKey, marks]) => (
                  <div
                    key={topicKey}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "3px 0",
                    }}
                  >
                    <span
                      style={{
                        color: "#e5e7eb",
                        maxWidth: 210,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={topicLabelMap[topicKey] || topicKey}
                    >
                      {topicLabelMap[topicKey] || topicKey}
                    </span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(248,250,252,0.08)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {marks} marks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sections – same UI as before */}
      {builtPaper.sections.map((section) => (
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.05rem",
                }}
              >
                {section.title}
              </h2>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: "0.85rem",
                  color: "#6b7280",
                }}
              >
                {section.sectionMarks} marks in this mock · blueprint target:{" "}
                {section.targetMarks} marks
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: 6,
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
                }}
              >
                No questions selected for this section yet. Add more entries
                with section {section.id} to{" "}
                <code style={{ fontSize: "0.8rem" }}>
                  predictedQuestions.ts
                </code>
                .
              </p>
            ) : (
              section.questions.map((q, idx) => {
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
                    {/* Meta row */}
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
                        Q{idx + 1}. {q.marks} marks
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
                          ...difficultyChipStyle[q.difficulty],
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
                        {q.topicKey} · {q.subtopic}
                      </span>

                      <span style={{ marginLeft: "auto" }} />

                      <button
                        onClick={() => handleToggleSolution(q.id)}
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
                        {solOpen ? "Hide solution" : "Show solution"}
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
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {q.strategyHint && (
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#1f2937",
                              background: "#e0f2fe",
                              borderRadius: 10,
                              padding: "4px 8px",
                            }}
                          >
                            <strong>Strategy hint:</strong> {q.strategyHint}
                          </div>
                        )}

                        {q.solutionSteps && q.solutionSteps.length > 0 ? (
                          <>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: "0.82rem",
                                marginBottom: 2,
                              }}
                            >
                              Step-by-step reasoning:
                            </div>
                            <ol
                              style={{
                                paddingLeft: 18,
                                margin: "4px 0 6px",
                              }}
                            >
                              {q.solutionSteps.map((step, i) => (
                                <li
                                  key={i}
                                  style={{
                                    marginBottom: 2,
                                  }}
                                >
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </>
                        ) : (
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "0.82rem",
                              marginBottom: 2,
                            }}
                          >
                            Quick reasoning:
                          </div>
                        )}

                        <div>{q.explanation}</div>

                        <div
                          style={{
                            marginTop: 4,
                            fontSize: "0.82rem",
                            fontWeight: 600,
                          }}
                        >
                          Final answer:{" "}
                          <span style={{ fontWeight: 500 }}>
                            {q.finalAnswer || q.answer}
                          </span>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      ))}
    </div>
  );
};

export default MockPaper;
