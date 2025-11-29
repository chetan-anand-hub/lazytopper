// src/pages/HighlyProbableQuestions.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";

import {
  type HPQTopicBucket,
  type HPQQuestion,
  type HPQSubject,
  type HPQStream,
  type HPQTier,
  type HPQDifficulty,
  getHighlyProbableQuestions,
} from "../data/highlyProbableQuestions";

// ---------- Local types / helpers ----------

type StreamFilterKey = "all" | HPQStream;
type TierFilter = "all" | HPQTier;
type DifficultyFilter = "all" | HPQDifficulty;
type TopicFilter = "all" | string;

interface BasketItem {
  id: string;
  subject: HPQSubject;
  topic: string;
  stream?: HPQStream;
  marks: number;
  difficulty?: HPQDifficulty;
  section?: string;
  question: string;
}

const MOCK_BASKET_KEY = "lazyTopperMockBasket_v1";

const tierMeta: Record<
  HPQTier,
  { label: string; emoji: string; blurb: string }
> = {
  "must-crack": {
    label: "Must-crack",
    emoji: "🔥",
    blurb: "Shows up almost every year – non-negotiable.",
  },
  "high-roi": {
    label: "High-ROI",
    emoji: "💎",
    blurb: "Big marks for the time you invest – do after must-crack.",
  },
  "good-to-do": {
    label: "Good-to-do",
    emoji: "🌈",
    blurb: "Nice safety net once the big boys are done.",
  },
};

const difficultyChipStyle: Record<HPQDifficulty, { bg: string; color: string }> =
  {
    Easy: { bg: "#ecfdf3", color: "#15803d" },
    Medium: { bg: "#fffbeb", color: "#a16207" },
    Hard: { bg: "#fef2f2", color: "#b91c1c" },
  };

// Decide bucket tier from bucket.defaultTier or first question with a tier
function getBucketTier(bucket: HPQTopicBucket): HPQTier {
  if (bucket.defaultTier) return bucket.defaultTier;
  for (const q of bucket.questions) {
    if (q.tier) return q.tier;
  }
  return "good-to-do";
}

function normaliseSubject(raw: string | null): HPQSubject {
  const val = (raw || "").toLowerCase();
  if (val === "science" || val === "sci") return "Science";
  return "Maths";
}
// ---------- Component ----------

const HighlyProbableQuestions: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchParams, setSearchParams] = useSearchParams();

  const grade = searchParams.get("grade") || "10";
  const subjectParam = searchParams.get("subject");
  const topicParam = searchParams.get("topic");

  const subjectKey: HPQSubject = normaliseSubject(subjectParam);

  // 👇 NEW: track where we came from (e.g. /study-plan, /trends, etc.)
  const fromState = (location.state as any)?.from as string | undefined;
  const backLabel =
    fromState && fromState.includes("/study-plan")
      ? "Back to study plan"
      : fromState
      ? "Back"
      : "Back to trends";

  const [activeStream, setActiveStream] = useState<StreamFilterKey>("all");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all");

  // topic filter (dropdown + deep-link from Trends)
  const initialTopic: TopicFilter = (topicParam as TopicFilter) || "all";
  const [topicFilter, setTopicFilter] = useState<TopicFilter>(initialTopic);

  useEffect(() => {
    setTopicFilter((topicParam as TopicFilter) || "all");
  }, [topicParam]);

  const [basket, setBasket] = useState<BasketItem[]>([]);

  // load basket once
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(MOCK_BASKET_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BasketItem[];
        if (Array.isArray(parsed)) setBasket(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const persistBasket = (items: BasketItem[]) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(MOCK_BASKET_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  // Subject-level buckets (Maths vs Science) using engine helper
  const subjectBuckets = useMemo(
    () => getHighlyProbableQuestions(subjectKey),
    [subjectKey]
  );

  // Topic options for dropdown (for current subject)
  const topicOptions = useMemo(
    () =>
      Array.from(new Set(subjectBuckets.map((b) => b.topic))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [subjectBuckets]
  );

  const handleSubjectToggle = (next: HPQSubject) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("subject", next);
    // keep grade; reset topic for new subject
    nextParams.delete("topic");
    setSearchParams(nextParams);
    if (next === "Maths") {
      setActiveStream("all"); // no stream for maths
    }
  };

  const handleStreamToggle = (next: StreamFilterKey) => {
    setActiveStream(next);
  };

  const handleBackToTrends = () => {
    // 👇 NEW: first go back where we came from (e.g. /study-plan),
    // otherwise fallback to the trends page.
    if (fromState) {
      navigate(fromState);
    } else {
      navigate(`/trends/${grade}/${subjectKey}`);
    }
  };

  const handleOpenMockBuilder = () => {
    // keep basket in localStorage
    persistBasket(basket);

    // open mock builder with same grade + subject
    const params = new URLSearchParams();
    params.set("grade", grade);
    params.set("subject", subjectKey);

    navigate(
      {
        pathname: "/mock-builder",
        search: `?${params.toString()}`,
      },
      {
        // so MockBuilder can also come back here if needed
        state: { from: location.pathname },
      }
    );
  };

  const handleAddToBasket = (bucket: HPQTopicBucket, q: HPQQuestion) => {
    setBasket((prev) => {
      if (prev.some((b) => b.id === q.id)) return prev;
      const marks = q.marks ?? 0;
      const next: BasketItem[] = [
        ...prev,
        {
          id: q.id,
          subject: bucket.subject ?? subjectKey,
          topic: bucket.topic,
          stream: bucket.stream,
          marks,
          difficulty: q.difficulty,
          section: q.section,
          question: q.question,
        },
      ];
      persistBasket(next);
      return next;
    });
  };

  const handleAskAiMentor = (bucket: HPQTopicBucket, q: HPQQuestion) => {
    navigate("/ai-mentor", {
      state: {
        // preserve the origin path for back navigation
        from: location.pathname,

        grade,
        subject: subjectKey,
        topic: bucket.topic,
        hpqQuestionId: q.id,
        hpqQuestion: q.question,
        // set solve mode for HPQ question
        mode: "solve",
        gpt_directive:
          "Think like an expert CBSE Class 10 " +
          (subjectKey === "Maths" ? "Mathematics" : "Science") +
          " tutor. Explain this question step by step, show working, common mistakes, and give exam-friendly presentation.",
      },
    });
  };

  const totalBasketMarks = useMemo(
    () => basket.reduce((sum, item) => sum + (item.marks ?? 0), 0),
    [basket]
  );

  // 🔄 Clear all filters helper
  const handleClearAllFilters = () => {
    setTierFilter("all");
    setDifficultyFilter("all");
    setActiveStream("all");
    setTopicFilter("all");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("topic");
    setSearchParams(nextParams);
  };

  // Core filtered data
  const filteredBuckets: HPQTopicBucket[] = useMemo(() => {
    let buckets = subjectBuckets;

    // Topic filter (dropdown or deep link)
    if (topicFilter !== "all") {
      const topicLower = topicFilter.toLowerCase();
      buckets = buckets.filter((b) => b.topic.toLowerCase() === topicLower);
    }

    // Stream filter – only for Science
    if (subjectKey === "Science" && activeStream !== "all") {
      buckets = buckets.filter((bucket) => {
        if (bucket.stream && bucket.stream !== "General") {
          return bucket.stream === activeStream;
        }
        // fallback: check question-level stream (in case)
        return bucket.questions.some((q) => {
          if (!q.stream || q.stream === "General") {
            return activeStream === "General";
          }
          return q.stream === activeStream;
        });
      });
    }

    // Tier filter
    if (tierFilter !== "all") {
      buckets = buckets.filter(
        (bucket) => getBucketTier(bucket) === tierFilter
      );
    }

    // Difficulty filter – keep only questions of that difficulty
    if (difficultyFilter !== "all") {
      buckets = buckets
        .map((bucket) => ({
          ...bucket,
          questions: bucket.questions.filter(
            (q) => q.difficulty === difficultyFilter
          ),
        }))
        .filter((bucket) => bucket.questions.length > 0);
    }

    return buckets;
  }, [
    subjectBuckets,
    subjectKey,
    activeStream,
    tierFilter,
    difficultyFilter,
    topicFilter,
  ]);

  // ---------- Render helpers ----------

  const renderQuestionMetaChips = (q: HPQQuestion) => {
    const chips: React.ReactNode[] = [];

    if (q.section) {
      chips.push(
        <span
          key="sec"
          style={{
            borderRadius: 999,
            padding: "3px 8px",
            backgroundColor: "#eef2ff",
            border: "1px solid rgba(129,140,248,0.65)",
            fontSize: "0.7rem",
          }}
        >
          Section {q.section}
        </span>
      );
    }

    if (typeof q.marks === "number") {
      chips.push(
        <span
          key="marks"
          style={{
            borderRadius: 999,
            padding: "3px 8px",
            backgroundColor: "#ecfeff",
            border: "1px solid rgba(6,182,212,0.6)",
            fontSize: "0.7rem",
          }}
        >
          {q.marks} mark{q.marks === 1 ? "" : "s"}
        </span>
      );
    }

    if (q.difficulty) {
      const style = difficultyChipStyle[q.difficulty];
      chips.push(
        <span
          key="diff"
          style={{
            borderRadius: 999,
            padding: "3px 8px",
            backgroundColor: style.bg,
            color: style.color,
            fontSize: "0.7rem",
          }}
        >
          {q.difficulty}
        </span>
      );
    }

    if (q.likelihood) {
      chips.push(
        <span
          key="prob"
          style={{
            borderRadius: 999,
            padding: "3px 8px",
            backgroundColor: "#f5f3ff",
            border: "1px solid rgba(167,139,250,0.7)",
            fontSize: "0.7rem",
            color: "#4c1d95",
          }}
        >
          {q.likelihood} chance
        </span>
      );
    }

    if (q.bloomSkill) {
      chips.push(
        <span
          key="bloom"
          style={{
            borderRadius: 999,
            padding: "3px 8px",
            backgroundColor: "#f9fafb",
            border: "1px dashed rgba(148,163,184,0.7)",
            fontSize: "0.7rem",
            color: "#475569",
          }}
        >
          {q.bloomSkill}
        </span>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 4,
        }}
      >
        {chips}
      </div>
    );
  };

  // ---------- JSX ----------

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #e0f2ff 0, #dde7ff 30%, #e5edff 60%, #f1f5f9 100%)",
        paddingBottom: "80px",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "16px 16px 32px",
        }}
      >
        {/* Back link */}
        <button
          onClick={handleBackToTrends}
          style={{
            background: "none",
            border: "none",
            color: "#4b5563",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: 4,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: "1rem" }}>←</span>
          {/* 👇 NEW: dynamic label based on origin */}
          <span>{backLabel}</span>
        </button>

        {/* Hero: HPQ hub */}
        <section
          style={{
            borderRadius: 32,
            padding: "24px 24px 24px 28px",
            background:
              "linear-gradient(135deg, #020617 0%, #0f172a 20%, #1d4ed8 65%, #22c1c3 100%)",
            color: "#f9fafb",
            boxShadow: "0 24px 60px rgba(15,23,42,0.55)",
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div style={{ maxWidth: 640 }}>
            <div
              style={{
                fontSize: "0.7rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                opacity: 0.85,
                marginBottom: 8,
              }}
            >
              Class {grade} • {subjectKey} • HPQ Bank
            </div>
            <h1
              style={{
                fontSize: "2.1rem",
                lineHeight: 1.15,
                fontWeight: 650,
                marginBottom: 10,
              }}
            >
              Highly Probable Questions Hub
            </h1>
            <p
              style={{
                fontSize: "0.95rem",
                lineHeight: 1.6,
                opacity: 0.96,
              }}
            >
              Your{" "}
              <strong style={{ fontWeight: 700 }}>last-week weapon</strong>:
              topic-wise questions that keep coming back. Flip between{" "}
              <strong>Maths</strong> and{" "}
              <strong>Science + Physics/Chem/Bio filters</strong>, then send any
              juicy Q straight to your mock paper.
            </p>

            {/* Tier filter row */}
            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {(
                [
                  { id: "all", label: "All tiers" },
                  { id: "must-crack", label: "🔥 Must-crack" },
                  { id: "high-roi", label: "💎 High-ROI" },
                  { id: "good-to-do", label: "🌈 Good-to-do" },
                ] as { id: TierFilter; label: string }[]
              ).map((item) => {
                const active = tierFilter === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTierFilter(item.id)}
                    style={{
                      borderRadius: 999,
                      padding: "6px 14px",
                      border: active
                        ? "1px solid rgba(15,23,42,0.2)"
                        : "1px solid rgba(241,245,249,0.3)",
                      background: active ? "#f9fafb" : "rgba(15,23,42,0.35)",
                      color: active ? "#020617" : "#e5e7eb",
                      fontSize: "0.75rem",
                      fontWeight: active ? 600 : 500,
                      cursor: "pointer",
                      boxShadow: active
                        ? "0 6px 18px rgba(15,23,42,0.4)"
                        : "none",
                      transition: "all 0.15s ease-out",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Difficulty filter row */}
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                fontSize: "0.78rem",
              }}
            >
              {(
                [
                  { id: "all", label: "All levels" },
                  { id: "Easy", label: "🟢 Easy focus" },
                  { id: "Medium", label: "🟡 Medium focus" },
                  { id: "Hard", label: "🔴 Hard / full rigour" },
                ] as { id: DifficultyFilter; label: string }[]
              ).map((item) => {
                const active = difficultyFilter === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setDifficultyFilter(item.id)}
                    style={{
                      borderRadius: 999,
                      padding: "5px 11px",
                      border: active
                        ? "1px solid rgba(248,250,252,0.9)"
                        : "1px solid rgba(248,250,252,0.35)",
                      background: active
                        ? "rgba(248,250,252,0.95)"
                        : "transparent",
                      color: active ? "#020617" : "#e5e7eb",
                      cursor: "pointer",
                      transition: "all 0.15s ease-out",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Clear all filters inline action */}
            <div
              style={{
                marginTop: 8,
                fontSize: "0.78rem",
                color: "#e5e7eb",
              }}
            >
              <button
                onClick={handleClearAllFilters}
                style={{
                  borderRadius: 999,
                  padding: "4px 10px",
                  border: "1px dashed rgba(248,250,252,0.7)",
                  background: "rgba(15,23,42,0.25)",
                  color: "#e5e7eb",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                }}
              >
                ⭯ Clear all filters
              </button>
            </div>
          </div>

          {/* Subject + stream toggles + basket summary */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 12,
            }}
          >
            {/* Subject toggle pill */}
            <div
              style={{
                alignSelf: "flex-end",
                borderRadius: 999,
                padding: 4,
                background: "rgba(15,23,42,0.9)",
                display: "inline-flex",
                gap: 4,
              }}
            >
              {(["Maths", "Science"] as HPQSubject[]).map((subj) => {
                const active = subj === subjectKey;
                return (
                  <button
                    key={subj}
                    onClick={() => handleSubjectToggle(subj)}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 999,
                      border: "none",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      background: active ? "#f9fafb" : "transparent",
                      color: active ? "#020617" : "#e5e7eb",
                      boxShadow: active
                        ? "0 6px 16px rgba(15,23,42,0.45)"
                        : "none",
                      transition: "all 0.15s ease-out",
                    }}
                  >
                    {subj}
                  </button>
                );
              })}
            </div>

            {/* Stream filter – only for Science */}
            {subjectKey === "Science" && (
              <div
                style={{
                  marginTop: 10,
                  padding: "10px 12px",
                  borderRadius: 999,
                  background: "rgba(15,23,42,0.7)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  minWidth: 230,
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#cbd5f5",
                    opacity: 0.9,
                  }}
                >
                  Streams
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  {(
                    [
                      { id: "all", label: "All streams" },
                      { id: "Physics", label: "Physics" },
                      { id: "Chemistry", label: "Chemistry" },
                      { id: "Biology", label: "Biology" },
                    ] as { id: StreamFilterKey; label: string }[]
                  ).map((stream) => {
                    const active = activeStream === stream.id;
                    return (
                      <button
                        key={stream.id}
                        onClick={() => handleStreamToggle(stream.id)}
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          fontSize: "0.75rem",
                          border: active
                            ? "1px solid rgba(248,250,252,0.9)"
                            : "1px solid rgba(248,250,252,0.35)",
                          background: active
                            ? "rgba(248,250,252,0.95)"
                            : "transparent",
                          color: active ? "#020617" : "#e5e7eb",
                          cursor: "pointer",
                          transition: "all 0.15s ease-out",
                        }}
                      >
                        {stream.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Basket summary */}
            <div
              style={{
                marginTop: 12,
                padding: "8px 10px",
                borderRadius: 16,
                background: "rgba(15,23,42,0.6)",
                fontSize: "0.75rem",
                color: "#e5e7eb",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                alignItems: "flex-end",
              }}
            >
              <div>
                Mock basket:{" "}
                <strong>
                  {basket.length} Q • {totalBasketMarks} marks
                </strong>
              </div>
              <button
                onClick={handleOpenMockBuilder}
                style={{
                  marginTop: 2,
                  borderRadius: 999,
                  padding: "4px 10px",
                  border: "1px solid rgba(248,250,252,0.85)",
                  background: "#f9fafb",
                  color: "#020617",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                📄 Open mock builder
              </button>
            </div>
          </div>
        </section>

        {/* Topic dropdown row (under hero) */}
        <section style={{ marginTop: 24, marginBottom: 8 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 260 }}>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 650,
                  color: "#020617",
                  marginBottom: 4,
                }}
              >
                Class {grade} {subjectKey} — Highly Probable Questions
              </h2>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#64748b",
                }}
              >
                Each card = one chapter. Inside you get a mini{" "}
                <strong>HPQ stack</strong>: quick MCQs, ARs, short/long,
                case-based – exactly the pattern that keeps repeating in boards.
              </p>
            </div>

            <div style={{ minWidth: 260 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.78rem",
                  color: "#475569",
                  marginBottom: 4,
                }}
              >
                Topic:
              </label>
              <select
                value={topicFilter}
                onChange={(e) => {
                  const next = e.target.value as TopicFilter;
                  setTopicFilter(next);
                  const nextParams = new URLSearchParams(
                    searchParams.toString()
                  );
                  if (next === "all") nextParams.delete("topic");
                  else nextParams.set("topic", next);
                  setSearchParams(nextParams);
                }}
                style={{
                  width: "100%",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.6)",
                  padding: "8px 14px",
                  fontSize: "0.85rem",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 8px 18px rgba(148,163,184,0.25)",
                }}
              >
                <option value="all">All topics</option>
                {topicOptions.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* HPQ topic list */}
        {filteredBuckets.length === 0 ? (
          <p
            style={{
              fontSize: "0.82rem",
              color: "#64748b",
              padding: "8px 4px",
            }}
          >
            Nothing visible with the current filters. Try switching back to{" "}
            <strong>All tiers / All levels / All streams / All topics</strong>{" "}
            or just click{" "}
            <button
              type="button"
              onClick={handleClearAllFilters}
              style={{
                border: "none",
                background: "transparent",
                color: "#1d4ed8",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "0.82rem",
                padding: 0,
              }}
            >
              Clear all filters
            </button>
            .
          </p>
        ) : (
          <section>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {filteredBuckets.map((bucket) => {
                const tier = getBucketTier(bucket);
                const tMeta = tierMeta[tier];
                const totalQuestions = bucket.questions.length;
                const totalMarks = bucket.questions.reduce(
                  (sum, q) => sum + (q.marks ?? 0),
                  0
                );
                const isScience =
                  (bucket.subject ?? subjectKey) === "Science";
                const streamLabel =
                  bucket.stream || (isScience ? "General" : undefined);

                return (
                  <div
                    key={`${bucket.topic}-${bucket.subject ?? subjectKey}`}
                    style={{
                      borderRadius: 22,
                      padding: "16px 18px 12px",
                      backgroundColor: "rgba(248,250,252,0.98)",
                      border:
                        tier === "must-crack"
                          ? "1px solid rgba(248,113,113,0.7)"
                          : tier === "high-roi"
                          ? "1px solid rgba(129,140,248,0.7)"
                          : "1px solid rgba(148,163,184,0.4)",
                      boxShadow:
                        tier === "must-crack"
                          ? "0 14px 30px rgba(248,113,113,0.35)"
                          : tier === "high-roi"
                          ? "0 14px 30px rgba(129,140,248,0.35)"
                          : "0 10px 24px rgba(148,163,184,0.28)",
                    }}
                  >
                    {/* Header row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 14,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <h3
                            style={{
                              fontSize: "1rem",
                              fontWeight: 650,
                              color: "#020617",
                            }}
                          >
                            {bucket.topic}
                          </h3>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              borderRadius: 999,
                              padding: "4px 10px",
                              fontSize: "0.75rem",
                              backgroundColor:
                                tier === "must-crack"
                                  ? "#fee2e2"
                                  : tier === "high-roi"
                                  ? "#e0e7ff"
                                  : "#e0f2fe",
                              color:
                                tier === "must-crack"
                                  ? "#b91c1c"
                                  : tier === "high-roi"
                                  ? "#3730a3"
                                  : "#0369a1",
                            }}
                          >
                            <span>{tMeta.emoji}</span>
                            <span>{tMeta.label}</span>
                          </span>
                          {isScience && streamLabel && (
                            <span
                              style={{
                                borderRadius: 999,
                                padding: "3px 9px",
                                fontSize: "0.7rem",
                                backgroundColor: "#ecfeff",
                                border: "1px solid rgba(6,182,212,0.6)",
                                color: "#0369a1",
                              }}
                            >
                              {streamLabel}
                            </span>
                          )}
                        </div>

                        <p
                          style={{
                            fontSize: "0.83rem",
                            color: "#475569",
                            marginBottom: 4,
                          }}
                        >
                          {tMeta.blurb} • This stack has{" "}
                          <strong>{totalQuestions} Q</strong> (~
                          {totalMarks} marks) in board-style formats
                          (MCQs/AR/short/case-based).
                        </p>
                      </div>

                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "#64748b",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Subject:{" "}
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          {bucket.subject ?? subjectKey}
                        </span>
                        {isScience && streamLabel && (
                          <>
                            <br />
                            Stream:{" "}
                            <span
                              style={{
                                fontWeight: 600,
                                color: "#111827",
                              }}
                            >
                              {streamLabel}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Question list */}
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 8,
                        borderTop: "1px dashed rgba(148,163,184,0.6)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {bucket.questions.map((q) => (
                        <div
                          key={q.id}
                          style={{
                            borderRadius: 16,
                            padding: "8px 10px",
                            backgroundColor: "rgba(248,250,252,0.96)",
                            border: "1px solid rgba(203,213,225,0.8)",
                          }}
                        >
                          {renderQuestionMetaChips(q)}
                          <div
                            style={{
                              fontSize: "0.85rem",
                              color: "#0f172a",
                              marginBottom: 4,
                            }}
                          >
                            {q.question}
                          </div>

                          {q.answer && (
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: "#4b5563",
                                marginTop: 2,
                              }}
                            >
                              <span style={{ fontWeight: 500 }}>Ans:</span>{" "}
                              {q.answer}
                            </div>
                          )}

                          {q.pastBoardYear && (
                            <div
                              style={{
                                fontSize: "0.7rem",
                                color: "#6b7280",
                                marginTop: 2,
                              }}
                            >
                              Pattern seen in:{" "}
                              <strong>{q.pastBoardYear}</strong>
                            </div>
                          )}

                          <div
                            style={{
                              marginTop: 6,
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              onClick={() => handleAskAiMentor(bucket, q)}
                              style={{
                                borderRadius: 999,
                                border:
                                  "1px solid rgba(59,130,246,0.8)",
                                padding: "4px 10px",
                                fontSize: "0.75rem",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                cursor: "pointer",
                              }}
                            >
                              🤖 AI mentor solution
                            </button>
                            <button
                              onClick={() => handleAddToBasket(bucket, q)}
                              style={{
                                borderRadius: 999,
                                border:
                                  "1px solid rgba(148,163,184,0.8)",
                                padding: "4px 10px",
                                fontSize: "0.75rem",
                                background: "#ffffff",
                                cursor: "pointer",
                              }}
                            >
                              ➕ Add to mock
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default HighlyProbableQuestions;
