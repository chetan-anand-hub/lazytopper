// src/pages/HighlyProbableQuestions.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  highlyProbableQuestions,
  type HPQTopicBucket,
  type HPQQuestion,
  type HPQDifficulty,
  type HPQTier,
  type HPQSubject,
  type HPQStream,
} from "../data/highlyProbableQuestions";
import { class10MathTopicTrends } from "../data/class10MathTopicTrends";
import { class10ScienceTopicTrends } from "../data/class10ScienceTopicTrends";

// ---------- Local types used only in this page ----------

type SubjectKey = HPQSubject;
type StreamFilter = "all" | "Physics" | "Chemistry" | "Biology";
type TierFilter = "all" | HPQTier;
type DifficultyFilter = "All" | HPQDifficulty;
type SectionTab = "All" | "A" | "B" | "C" | "D" | "E" | "AR";

interface TopicMeta {
  tier?: HPQTier;
  weightagePercent?: number;
  summary?: string;
  conceptWeightage?: Record<string, number>;
  stream?: HPQStream;
}

interface TopicTrendsData {
  subject: string;
  grade: string;
  topics: Record<string, TopicMeta>;
}

interface BucketView {
  bucket: HPQTopicBucket;
  tier: HPQTier;
  topicMeta: TopicMeta;
  questions: HPQQuestion[];
  marksInBucket: number;
}

// ---------- Helpers ----------

const tierMeta: Record<
  HPQTier,
  { label: string; emoji: string; blurb: string }
> = {
  "must-crack": {
    label: "Must-crack",
    emoji: "🔥",
    blurb: "Appears almost every year – lock these first.",
  },
  "high-roi": {
    label: "High-ROI",
    emoji: "💎",
    blurb: "Great marks for the time spent – drill after must-crack.",
  },
  "good-to-do": {
    label: "Good-to-do",
    emoji: "🌈",
    blurb: "Safety net + confidence once core topics are done.",
  },
};

function normaliseSubject(raw?: string | null): SubjectKey {
  const val = (raw || "").toLowerCase();
  if (val === "science" || val === "sci") return "Science";
  return "Maths";
}

function pickTrendsDataset(subject: SubjectKey): TopicTrendsData {
  if (subject === "Science") {
    return class10ScienceTopicTrends as unknown as TopicTrendsData;
  }
  return class10MathTopicTrends as unknown as TopicTrendsData;
}

// ---------- Component ----------

const HighlyProbableQuestions: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const grade = searchParams.get("grade") || "10";
  const subjectFromUrl = searchParams.get("subject");
  const topicFromUrl = searchParams.get("topic") || "";
  const subjectKey: SubjectKey = normaliseSubject(subjectFromUrl);

  // Filters
  const [activeTier, setActiveTier] = useState<TierFilter>("all");
  const [activeDifficulty, setActiveDifficulty] =
    useState<DifficultyFilter>("All");
  const [activeStream, setActiveStream] = useState<StreamFilter>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>(topicFromUrl);
  const [selectedConcept, setSelectedConcept] = useState<string>("");
  const [activeSectionTab, setActiveSectionTab] =
    useState<SectionTab>("All");

  // Reset stream when subject changes (Maths vs Science)
  useEffect(() => {
    setActiveStream("all");
  }, [subjectKey]);

  // When deep-linked from Trends with a topic, sync into local state
  useEffect(() => {
    if (topicFromUrl) {
      setSelectedTopic(topicFromUrl);
    }
  }, [topicFromUrl]);

  // When topic changes, clear concept so dropdown feels natural
  useEffect(() => {
    setSelectedConcept("");
  }, [selectedTopic]);

  const trendsData = pickTrendsDataset(subjectKey);

  // -------- Buckets filtered by subject + stream --------

  const bucketsForSubject: HPQTopicBucket[] = useMemo(() => {
    return highlyProbableQuestions.filter((bucket) => {
      const bucketSubject: SubjectKey = bucket.subject ?? "Maths";
      if (bucketSubject !== subjectKey) return false;

      if (subjectKey === "Science" && activeStream !== "all") {
        const bucketStream = bucket.stream ?? "General";
        return bucketStream === activeStream;
      }

      return true;
    });
  }, [subjectKey, activeStream]);

  // Topic + concept options for dropdowns
  const topicOptions = useMemo(() => {
    const names = bucketsForSubject.map((b) => b.topic);
    const unique = Array.from(new Set(names));
    unique.sort();
    return unique;
  }, [bucketsForSubject]);

  const conceptOptions = useMemo(() => {
    const list: string[] = [];
    bucketsForSubject.forEach((bucket) => {
      if (selectedTopic && bucket.topic !== selectedTopic) return;
      bucket.questions.forEach((q) => {
        if (q.concept) list.push(q.concept);
      });
    });
    const unique = Array.from(new Set(list));
    unique.sort();
    return unique;
  }, [bucketsForSubject, selectedTopic]);

  // Pool-wide totals (for hero snapshot)
  const allQuestions: HPQQuestion[] = useMemo(
    () => bucketsForSubject.flatMap((b) => b.questions),
    [bucketsForSubject]
  );

  const totalQuestionCount = allQuestions.length;
  const totalMarks = allQuestions.reduce(
    (sum, q) => sum + (q.marks ?? 0),
    0
  );
  const targetPaperMarks = 80;

  // Topic-based filtering (for dropdown)
  const topicFilteredBuckets: HPQTopicBucket[] = useMemo(() => {
    if (!selectedTopic) return bucketsForSubject;
    const lower = selectedTopic.toLowerCase();
    const filtered = bucketsForSubject.filter(
      (b) => b.topic.toLowerCase() === lower
    );
    return filtered.length > 0 ? filtered : bucketsForSubject;
  }, [bucketsForSubject, selectedTopic]);

  // Bucket views with all filters (tier, difficulty, concept, section)
  const bucketViews: BucketView[] = useMemo(() => {
    const views: BucketView[] = [];

    for (const bucket of topicFilteredBuckets) {
      const topicMeta: TopicMeta =
        (trendsData.topics[bucket.topic] as TopicMeta) || {};

      const questions = bucket.questions.filter((q) => {
        // Tier filter: from question > bucket > trends meta
        const qTier: HPQTier | undefined =
          q.tier ?? bucket.defaultTier ?? (topicMeta.tier as HPQTier | undefined);

        if (activeTier !== "all" && qTier !== activeTier) return false;

        if (
          activeDifficulty !== "All" &&
          q.difficulty &&
          q.difficulty !== activeDifficulty
        ) {
          return false;
        }

        if (selectedConcept && q.concept !== selectedConcept) return false;

        if (activeSectionTab === "AR") {
          const isAR =
            q.type === "AssertionReason" || q.kind === "assertion-reason";
          if (!isAR) return false;
        } else if (activeSectionTab !== "All") {
          if (!q.section || q.section !== activeSectionTab) return false;
        }

        return true;
      });

      if (questions.length === 0) continue;

      const marksInBucket = questions.reduce(
        (sum, q) => sum + (q.marks ?? 0),
        0
      );

      const tier: HPQTier =
        (topicMeta.tier as HPQTier | undefined) ??
        bucket.defaultTier ??
        "good-to-do";

      views.push({
        bucket,
        tier,
        topicMeta,
        questions,
        marksInBucket,
      });
    }

    return views;
  }, [
    topicFilteredBuckets,
    trendsData,
    activeTier,
    activeDifficulty,
    selectedConcept,
    activeSectionTab,
  ]);

  const filteredQuestions: HPQQuestion[] = useMemo(
    () => bucketViews.flatMap((view) => view.questions),
    [bucketViews]
  );

  const filteredQuestionCount = filteredQuestions.length;
  const filteredMarks = filteredQuestions.reduce(
    (sum, q) => sum + (q.marks ?? 0),
    0
  );

  // Pattern summary: how boards usually ask current topic/concept
  const patternSummary = useMemo(() => {
    if (!selectedTopic && !selectedConcept) return null;
    if (filteredQuestions.length === 0) return null;

    const relevant = filteredQuestions.filter((q) => {
      if (selectedConcept && q.concept !== selectedConcept) return false;
      return true;
    });

    if (relevant.length === 0) return null;

    const sections = new Set<string>();
    const types = new Set<string>();

    relevant.forEach((q) => {
      if (q.section) sections.add(q.section);
      if (q.type) types.add(q.type);
    });

    return {
      sections: Array.from(sections),
      types: Array.from(types),
    };
  }, [filteredQuestions, selectedTopic, selectedConcept]);

  // ---------- Handlers ----------

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubjectToggle = (next: SubjectKey) => {
    const params = new URLSearchParams(location.search);
    params.set("subject", next);
    if (!params.get("grade")) params.set("grade", grade);
    navigate(`/highly-probable?${params.toString()}`);
  };

  const handleTierClick = (tier: "all" | HPQTier) => {
    setActiveTier((prev) => {
      if (tier === "all") return "all";
      // clicking again clears that tier
      return prev === tier ? "all" : tier;
    });
  };

  const handleDifficultyClick = (diff: DifficultyFilter) => {
    setActiveDifficulty(diff);
  };

  const sectionTabs: { id: SectionTab; label: string }[] = [
    { id: "All", label: "All sections" },
    { id: "A", label: "Sec A – MCQ" },
    { id: "B", label: "Sec B – VSA (2 m)" },
    { id: "C", label: "Sec C – SA (3 m)" },
    { id: "D", label: "Sec D – LA (4–5 m)" },
    { id: "E", label: "Sec E – Case-based" },
    { id: "AR", label: "Assertion–Reason" },
  ];

  // ---------- Render ----------

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
          onClick={handleBack}
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
          <span>Back to chapters</span>
        </button>

        {/* Hero card – same vibe as TrendsPage */}
        <section
          style={{
            borderRadius: 32,
            padding: "24px 24px 24px 28px",
            background:
              "linear-gradient(135deg, #020617 0%, #0f172a 15%, #1d4ed8 60%, #22c1c3 100%)",
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
                opacity: 0.9,
                marginBottom: 8,
              }}
            >
              Class {grade} • {subjectKey} • Highly probable bank
            </div>
            <h1
              style={{
                fontSize: "2.1rem",
                lineHeight: 1.15,
                fontWeight: 650,
                marginBottom: 10,
              }}
            >
              Highly Probable Questions – Class {grade} {subjectKey}
            </h1>
            <p
              style={{
                fontSize: "0.95rem",
                lineHeight: 1.6,
                opacity: 0.96,
              }}
            >
              Built from last <strong>8–10 years</strong> of CBSE PYQs +
              sample papers. Start with{" "}
              <strong style={{ fontWeight: 700 }}>Must-crack</strong>, then
              move to <strong style={{ fontWeight: 700 }}>High-ROI</strong>,
              and finally <strong>Good-to-do</strong> for buffer. This
              view shows one run of your{" "}
              <strong>2026 prediction engine.</strong>
            </p>

            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                borderRadius: 18,
                backgroundColor: "rgba(15,23,42,0.55)",
                fontSize: "0.78rem",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "#e5e7eb",
                }}
              >
                Current prediction pool snapshot
              </div>
              <div>
                <span style={{ fontWeight: 600 }}>
                  {totalQuestionCount} questions
                </span>{" "}
                in prediction bank · target paper:{" "}
                <span style={{ fontWeight: 600 }}>{targetPaperMarks}</span>{" "}
                marks
              </div>
              <div style={{ marginTop: 2, opacity: 0.9 }}>
                Right now the pool holds{" "}
                <strong>{totalMarks} marks</strong> worth of questions
                for Class {grade} {subjectKey}. As you keep adding to the
                HPQ bank, this pool will grow and feed into your
                mock-paper builder.
              </div>
            </div>
          </div>

          {/* Subject + stream toggles */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            {/* Subject pill – Maths / Science */}
            <div
              style={{
                alignSelf: "flex-end",
                borderRadius: 999,
                padding: 4,
                background: "rgba(15,23,42,0.85)",
                display: "inline-flex",
                gap: 4,
              }}
            >
              {(["Maths", "Science"] as SubjectKey[]).map((subj) => {
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
                  marginTop: 18,
                  padding: "10px 12px",
                  borderRadius: 999,
                  background: "rgba(15,23,42,0.7)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  minWidth: 220,
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#cbd5f5",
                    opacity: 0.85,
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
                    ] as { id: StreamFilter; label: string }[]
                  ).map((stream) => {
                    const active = activeStream === stream.id;
                    return (
                      <button
                        key={stream.id}
                        onClick={() => setActiveStream(stream.id)}
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
          </div>
        </section>

        {/* Dark control panel card */}
        <section
          style={{
            marginTop: 20,
            borderRadius: 28,
            backgroundColor: "#020617",
            color: "#e5e7eb",
            boxShadow: "0 22px 55px rgba(15,23,42,0.75)",
            padding: "18px 22px 20px",
          }}
        >
          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Current prediction pool
          </div>
          <div
            style={{
              fontSize: "0.86rem",
              marginBottom: 8,
              opacity: 0.95,
            }}
          >
            <strong>{filteredQuestionCount} questions</strong> in pool ·
            target paper: <strong>{targetPaperMarks} marks</strong>
          </div>
          <p
            style={{
              fontSize: "0.8rem",
              maxWidth: 820,
              marginBottom: 10,
              color: "#cbd5f5",
            }}
          >
            Use the filters below to focus on{" "}
            <strong>must-crack vs high-ROI</strong> topics, choose the{" "}
            <strong>difficulty</strong> you want to drill today, and
            narrow down to one <strong>chapter / concept</strong>. Later,
            an &ldquo;Add to mock&rdquo; button will send questions
            straight into your auto-mock basket.
          </p>

          {/* Tier chips */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                opacity: 0.9,
                marginRight: 4,
              }}
            >
              Tier:
            </span>
            {[
              { id: "all" as const, label: "All tiers" },
              { id: "must-crack" as const, label: "🔥 Must-crack" },
              { id: "high-roi" as const, label: "💎 High-ROI" },
              { id: "good-to-do" as const, label: "🌈 Good-to-do" },
            ].map((item) => {
              const active = activeTier === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() =>
                    handleTierClick(
                      item.id === "all" ? "all" : (item.id as HPQTier)
                    )
                  }
                  style={{
                    borderRadius: 999,
                    padding: "5px 13px",
                    border: active
                      ? "1px solid rgba(248,250,252,0.95)"
                      : "1px solid rgba(148,163,184,0.5)",
                    background: active
                      ? "#f9fafb"
                      : "rgba(15,23,42,0.65)",
                    color: active ? "#020617" : "#e5e7eb",
                    fontSize: "0.75rem",
                    fontWeight: active ? 600 : 500,
                    cursor: "pointer",
                    boxShadow: active
                      ? "0 6px 18px rgba(15,23,42,0.45)"
                      : "none",
                    transition: "all 0.15s ease-out",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Difficulty chips */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                opacity: 0.9,
                marginRight: 4,
              }}
            >
              Difficulty:
            </span>
            {(["All", "Easy", "Medium", "Hard"] as DifficultyFilter[]).map(
              (diff) => {
                const active = activeDifficulty === diff;
                return (
                  <button
                    key={diff}
                    onClick={() => handleDifficultyClick(diff)}
                    style={{
                      borderRadius: 999,
                      padding: "5px 13px",
                      border: active
                        ? "1px solid rgba(248,250,252,0.95)"
                        : "1px solid rgba(148,163,184,0.5)",
                      background: active
                        ? "#f9fafb"
                        : "rgba(15,23,42,0.65)",
                      color: active ? "#020617" : "#e5e7eb",
                      fontSize: "0.75rem",
                      fontWeight: active ? 600 : 500,
                      cursor: "pointer",
                      boxShadow: active
                        ? "0 6px 18px rgba(15,23,42,0.45)"
                        : "none",
                      transition: "all 0.15s ease-out",
                    }}
                  >
                    {diff}
                  </button>
                );
              }
            )}
          </div>

          {/* Topic + concept dropdowns */}
          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              fontSize: "0.8rem",
              color: "#e5e7eb",
            }}
          >
            <label style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ marginBottom: 4, opacity: 0.9 }}>
                Chapter / Topic
              </span>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                style={{
                  minWidth: 220,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.7)",
                  backgroundColor: "#020617",
                  color: "#e5e7eb",
                  fontSize: "0.8rem",
                  outline: "none",
                }}
              >
                <option value="">All topics in this subject</option>
                {topicOptions.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ marginBottom: 4, opacity: 0.9 }}>
                Key concept / pattern
              </span>
              <select
                value={selectedConcept}
                onChange={(e) => setSelectedConcept(e.target.value)}
                style={{
                  minWidth: 220,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.7)",
                  backgroundColor: "#020617",
                  color: "#e5e7eb",
                  fontSize: "0.8rem",
                  outline: "none",
                }}
              >
                <option value="">
                  All concepts inside chosen topic
                </option>
                {conceptOptions.map((concept) => (
                  <option key={concept} value={concept}>
                    {concept}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Section tabs */}
          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              fontSize: "0.78rem",
            }}
          >
            {sectionTabs.map((tab) => {
              const active = activeSectionTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSectionTab(tab.id)}
                  style={{
                    borderRadius: 999,
                    padding: "5px 11px",
                    border: active
                      ? "1px solid rgba(248,250,252,0.95)"
                      : "1px solid rgba(148,163,184,0.55)",
                    background: active
                      ? "#f9fafb"
                      : "rgba(15,23,42,0.7)",
                    color: active ? "#020617" : "#e5e7eb",
                    cursor: "pointer",
                    fontWeight: active ? 600 : 500,
                    transition: "all 0.15s ease-out",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Pattern summary strip */}
        {patternSummary && (
          <section
            style={{
              marginTop: 16,
              borderRadius: 18,
              backgroundColor: "rgba(248,250,252,0.95)",
              border: "1px solid rgba(148,163,184,0.18)",
              boxShadow: "0 12px 26px rgba(148,163,184,0.35)",
              padding: "10px 14px",
              fontSize: "0.8rem",
              color: "#0f172a",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>
              What can the board ask from this slice?
            </div>
            <div>
              Often appears as{" "}
              <strong>
                {patternSummary.sections.length > 0
                  ? patternSummary.sections
                      .map((s) => `Sec ${s}`)
                      .join(" • ")
                  : "mixed sections"}
              </strong>{" "}
              with question types{" "}
              <strong>
                {patternSummary.types.length > 0
                  ? patternSummary.types.join(", ")
                  : "varied"}
              </strong>
              .
            </div>
          </section>
        )}

        {/* Question buckets */}
        <section style={{ marginTop: 22 }}>
          {bucketViews.length === 0 ? (
            <p
              style={{
                fontSize: "0.82rem",
                color: "#64748b",
                padding: "8px 4px",
              }}
            >
              Nothing visible with the current filters. Try switching the
              tier, difficulty, topic, or section tabs above to see
              questions again.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {bucketViews.map(
                ({ bucket, tier, topicMeta, questions, marksInBucket }) => {
                  const tierInfo = tierMeta[tier];

                  return (
                    <div
                      key={bucket.topic}
                      style={{
                        borderRadius: 22,
                        padding: "16px 18px 14px",
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
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 16,
                          marginBottom: 8,
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
                              <span>{tierInfo.emoji}</span>
                              <span>{tierInfo.label}</span>
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: "#475569",
                              marginBottom: 4,
                            }}
                          >
                            {topicMeta.summary || tierInfo.blurb}
                          </p>
                        </div>
                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "#64748b",
                            whiteSpace: "nowrap",
                            textAlign: "right",
                          }}
                        >
                          ~
                          {topicMeta.weightagePercent != null
                            ? topicMeta.weightagePercent
                            : 0}
                          % weightage ·{" "}
                          <span style={{ fontWeight: 600 }}>
                            {marksInBucket} marks
                          </span>{" "}
                          currently in pool
                        </div>
                      </div>

                      {/* Questions inside this topic bucket */}
                      <div
                        style={{
                          marginTop: 6,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {questions.map((q) => (
                          <div
                            key={q.id}
                            style={{
                              borderRadius: 18,
                              padding: "10px 12px",
                              backgroundColor: "#ffffff",
                              border:
                                "1px solid rgba(226,232,240,0.9)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.78rem",
                                color: "#6b7280",
                                marginBottom: 4,
                              }}
                            >
                              {q.subtopic && (
                                <>
                                  <strong>Subtopic:</strong> {q.subtopic}{" "}
                                </>
                              )}
                              {q.concept && (
                                <>
                                  <span style={{ marginLeft: 8 }}>
                                    <strong>Concept:</strong> {q.concept}
                                  </span>
                                </>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: "0.9rem",
                                color: "#111827",
                                marginBottom: 4,
                              }}
                            >
                              {q.question}
                            </div>
                            {q.answer && (
                              <div
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#166534",
                                  marginTop: 4,
                                }}
                              >
                                <strong>Answer (board-style key):</strong>{" "}
                                {q.answer}
                              </div>
                            )}
                            {q.solutionSteps && q.solutionSteps.length > 0 && (
                              <ul
                                style={{
                                  marginTop: 6,
                                  paddingLeft: 18,
                                  fontSize: "0.8rem",
                                  color: "#374151",
                                }}
                              >
                                {q.solutionSteps.map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ul>
                            )}
                            <div
                              style={{
                                marginTop: 6,
                                fontSize: "0.78rem",
                                color: "#6b7280",
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 10,
                              }}
                            >
                              {q.marks != null && (
                                <span>{q.marks} marks</span>
                              )}
                              {q.difficulty && (
                                <span>• {q.difficulty}</span>
                              )}
                              <span>• {q.likelihood} chance</span>
                              {q.section && (
                                <span>• Sec {q.section}</span>
                              )}
                              {q.type && <span>• {q.type}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HighlyProbableQuestions;
