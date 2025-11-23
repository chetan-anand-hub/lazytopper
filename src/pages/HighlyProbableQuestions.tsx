// src/pages/HighlyProbableQuestions.tsx

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  class10TopicTrendList,
  type Class10TopicKey,
  type TopicTier,
} from "../data/class10MathTopicTrends";
import {
  predictedQuestions,
  type DifficultyKey,
  type PredictedQuestion,
} from "../data/predictedQuestions";

type TierKey = TopicTier;
type DifficultyFilter = "All" | DifficultyKey;

// Allow HPQ to see Socratic fields too
type PredictedQuestionWithSteps = PredictedQuestion & {
  solutionSteps?: string[];
  finalAnswer?: string;
};

interface TopicBucket {
  topicKey: Class10TopicKey;
  topicName: string;
  tier: TierKey;
  weightagePercent: number;
  summary?: string;
  questions: PredictedQuestionWithSteps[];
}

// Tier meta for pills / headings
const tierMeta: Record<
  TierKey,
  { label: string; emoji: string; blurb: string }
> = {
  "must-crack": {
    label: "Must-Crack",
    emoji: "🔥",
    blurb: "Topics that appear almost every year. Finish these first.",
  },
  "high-roi": {
    label: "High-ROI",
    emoji: "💎",
    blurb: "Great marks for the time invested. Do after must-crack.",
  },
  "good-to-do": {
    label: "Good-to-Do",
    emoji: "🌱",
    blurb: "Extra safety net + confidence once core buckets are done.",
  },
};

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

// ---- Mock basket helpers (localStorage) ------------------------

const BASKET_KEY = "lt-mock-basket-v1";

function loadBasketIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BASKET_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((x) => typeof x === "string");
    }
    return [];
  } catch {
    return [];
  }
}

function saveBasketIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BASKET_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------

const HighlyProbableQuestions: React.FC = () => {
  const navigate = useNavigate();

  const [tierFilter, setTierFilter] = useState<"all" | TierKey>("all");
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("All");
  const [openSolutions, setOpenSolutions] = useState<Record<string, boolean>>(
    {}
  );

  // mock basket state
  const [basketIds, setBasketIds] = useState<string[]>(() => loadBasketIds());

  const updateBasket = (updater: (prev: string[]) => string[]) => {
    setBasketIds((prev) => {
      const next = updater(prev);
      saveBasketIds(next);
      return next;
    });
  };

  const toggleBasketItem = (id: string) => {
    updateBasket((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Map topic key → basic meta from trends list
  const topicMetaByKey = useMemo(() => {
    const map: Record<
      string,
      { tier: TierKey; weightagePercent: number; summary?: string }
    > = {};
    class10TopicTrendList.forEach((entry) => {
      const tier: TierKey =
        (entry.tier as TierKey | undefined) ?? ("good-to-do" as TierKey);
      map[entry.topicKey] = {
        tier,
        weightagePercent: entry.weightagePercent,
        summary: entry.summary,
      };
    });
    return map;
  }, []);

  // Full prediction pool stats (independent of filters)
  const totalPoolQuestions = predictedQuestions.length;
  const totalPoolMarks = predictedQuestions.reduce(
    (sum, q) => sum + (q.marks ?? 0),
    0
  );

  // Group questions by topic, applying tier + difficulty filters
  const topicBuckets: TopicBucket[] = useMemo(() => {
    const buckets = new Map<string, TopicBucket>();

    predictedQuestions.forEach((q) => {
      const meta = topicMetaByKey[q.topicKey];
      if (!meta) return;

      // Filter by tier
      if (tierFilter !== "all" && meta.tier !== tierFilter) return;

      // Filter by difficulty
      if (difficultyFilter !== "All" && q.difficulty !== difficultyFilter)
        return;

      const key = q.topicKey;
      if (!buckets.has(key)) {
        buckets.set(key, {
          topicKey: q.topicKey,
          topicName: q.topicKey,
          tier: meta.tier,
          weightagePercent: meta.weightagePercent,
          summary: meta.summary,
          questions: [],
        });
      }
      buckets.get(key)!.questions.push(q as PredictedQuestionWithSteps);
    });

    return Array.from(buckets.values()).sort(
      (a, b) => b.weightagePercent - a.weightagePercent
    );
  }, [difficultyFilter, tierFilter, topicMetaByKey]);

  const handleBackToChapters = () => {
    navigate("/chapters");
  };

  const handleOpenTopic = (topicKey: Class10TopicKey) => {
    navigate(`/topics/${encodeURIComponent(topicKey)}`);
  };

  const toggleSolution = (id: string) => {
    setOpenSolutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const hasAnyQuestions = topicBuckets.some(
    (bucket) => bucket.questions.length > 0
  );

  return (
    <div
      className="page-container"
      style={{ paddingBottom: 40, maxWidth: 1200, margin: "0 auto" }}
    >
      {/* Back link */}
      <button
        onClick={handleBackToChapters}
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
        ← Back to chapters
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
          Class 10 • Maths
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "2.1rem",
            lineHeight: 1.22,
          }}
        >
          Highly Probable Questions – Class 10 Maths
        </h1>
        <p
          style={{
            marginTop: 10,
            marginBottom: 0,
            fontSize: "0.95rem",
            maxWidth: 780,
          }}
        >
          Built from last 8–10 years of CBSE PYQs + sample papers. Start with{" "}
          <strong>Must-Crack</strong>, then move to <strong>High-ROI</strong>,
          and finally <strong>Good-to-Do</strong> for buffer. This view shows
          one run of your <strong>2026 prediction engine</strong>.
        </p>
      </header>

      {/* Prediction pool summary – softened dark card */}
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
          Current prediction pool
        </div>
        <div
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          {totalPoolQuestions} questions in prediction bank · target paper:{" "}
          <strong>80 marks</strong>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "0.85rem",
            color: "#9ca3af",
            maxWidth: 840,
          }}
        >
          Right now the pool holds{" "}
          <strong>{totalPoolMarks} marks</strong> worth of questions. That’s
          intentionally a bit more than 80, so we can build different{" "}
          <strong>80-mark</strong> mocks from the same high-probability bank.
          As you add more items to{" "}
          <code style={{ fontSize: "0.8rem" }}>predictedQuestions.ts</code>,
          this pool will grow. Use{" "}
          <strong>“Add to mock” on any question</strong> to send it into your
          auto-mock basket.
        </p>
      </section>

      {/* Filters */}
      <section style={{ marginBottom: 14 }}>
        {/* Tier pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <button
            onClick={() => setTierFilter("all")}
            style={{
              borderRadius: 999,
              border:
                tierFilter === "all"
                  ? "1px solid #020617"
                  : "1px solid #e5e7eb",
              padding: "6px 14px",
              fontSize: "0.85rem",
              cursor: "pointer",
              background:
                tierFilter === "all"
                  ? "#020617"
                  : "rgba(241,245,249,0.95)",
              color: tierFilter === "all" ? "#f9fafb" : "#111827",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span role="img" aria-label="All tiers">
              📊
            </span>
            All tiers
          </button>

          {(Object.keys(tierMeta) as TierKey[]).map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              style={{
                borderRadius: 999,
                border:
                  tierFilter === tier
                    ? "1px solid #020617"
                    : "1px solid #e5e7eb",
                padding: "6px 14px",
                fontSize: "0.85rem",
                cursor: "pointer",
                background:
                  tierFilter === tier
                    ? "#020617"
                    : "rgba(241,245,249,0.95)",
                color: tierFilter === tier ? "#f9fafb" : "#111827",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{tierMeta[tier].emoji}</span>
              {tierMeta[tier].label}
            </button>
          ))}
        </div>

        {/* Difficulty pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.85rem",
              color: "#6b7280",
              marginRight: 4,
            }}
          >
            Difficulty:
          </span>
          {(["All", "Easy", "Medium", "Hard"] as DifficultyFilter[]).map(
            (df) => (
              <button
                key={df}
                onClick={() => setDifficultyFilter(df)}
                style={{
                  borderRadius: 999,
                  padding: "5px 12px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  border:
                    difficultyFilter === df
                      ? "1px solid #020617"
                      : "1px solid #e5e7eb",
                  background:
                    difficultyFilter === df
                      ? "#020617"
                      : "rgba(248,250,252,0.95)",
                  color: difficultyFilter === df ? "#f9fafb" : "#111827",
                }}
              >
                {df === "All" ? "All" : df}
              </button>
            )
          )}
        </div>
      </section>

      {/* Topic buckets */}
      {!hasAnyQuestions && (
        <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
          No predicted questions match the current filter. Try switching to “All
          tiers” or “All” difficulty, or add more items to{" "}
          <code style={{ fontSize: "0.8rem" }}>predictedQuestions.ts</code>.
        </p>
      )}

      {topicBuckets.map((bucket) => (
        <section
          key={bucket.topicKey}
          style={{
            borderRadius: 26,
            padding: "18px 18px 20px",
            background: "#f9fafb",
            boxShadow: "0 18px 40px rgba(148,163,184,0.35)",
            border: "1px solid #e5e7eb",
            marginBottom: 18,
          }}
        >
          {/* Topic header row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              marginBottom: 10,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.15rem",
                }}
              >
                {bucket.topicName}
              </h2>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#6b7280",
                  marginTop: 2,
                }}
              >
                {bucket.weightagePercent}% weightage ·{" "}
                {tierMeta[bucket.tier].label}
              </div>
              {bucket.summary && (
                <p
                  style={{
                    marginTop: 6,
                    marginBottom: 0,
                    fontSize: "0.9rem",
                    color: "#4b5563",
                  }}
                >
                  {bucket.summary}
                </p>
              )}
            </div>

            <button
              onClick={() => handleOpenTopic(bucket.topicKey)}
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
              🔍 Open topic hub ↗
            </button>
          </div>

          {/* Questions list */}
          <div
            style={{
              marginTop: 10,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {bucket.questions.map((q) => {
              const isOpen = !!openSolutions[q.id];
              const inBasket = basketIds.includes(q.id);

              return (
                <article
                  key={q.id}
                  style={{
                    borderRadius: 20,
                    padding: "12px 14px 10px",
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
                      {q.subtopic}
                    </span>

                    {/* Spacer */}
                    <span style={{ marginLeft: "auto" }} />

                    {/* Add to mock toggle */}
                    <button
                      onClick={() => toggleBasketItem(q.id)}
                      style={{
                        borderRadius: 999,
                        border: "1px solid #0f172a",
                        padding: "4px 10px",
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        background: inBasket ? "#0f172a" : "#ffffff",
                        color: inBasket ? "#fefce8" : "#0f172a",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginRight: 6,
                      }}
                    >
                      {inBasket ? "In mock" : "Add to mock"}
                    </button>

                    {/* See solution toggle */}
                    <button
                      onClick={() => toggleSolution(q.id)}
                      style={{
                        borderRadius: 999,
                        border: "1px solid #d1d5db",
                        padding: "4px 10px",
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        background: isOpen ? "#020617" : "#ffffff",
                        color: isOpen ? "#f9fafb" : "#111827",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {isOpen ? "Hide solution" : "See solution"}
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
                  {isOpen && (
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
                              style={{ marginBottom: 2, lineHeight: 1.5 }}
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
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default HighlyProbableQuestions;
