// src/pages/TrendsPage.tsx

import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { class10MathTopicTrends } from "../data/class10MathTopicTrends";
import { class10ScienceTopicTrends } from "../data/class10ScienceTopicTrends";

// --- Local types -------------------------------------------------

type TierKey = "must-crack" | "high-roi" | "good-to-do";
type TierFilter = "all" | TierKey | "none";
type SubjectKey = "Maths" | "Science";
type StreamKey = "all" | "Physics" | "Chemistry" | "Biology";

interface TopicMeta {
  tier?: TierKey;
  weightagePercent?: number;
  summary?: string;
  conceptWeightage?: Record<string, number>;
  // optional stream tag for science topics
  stream?: "Physics" | "Chemistry" | "Biology";
}

interface TopicTrendsData {
  subject: string;
  grade: string;
  topics: Record<string, TopicMeta>;
}

// --- Small helpers -----------------------------------------------

const tierMeta: Record<
  TierKey,
  { label: string; emoji: string; blurb: string }
> = {
  "must-crack": {
    label: "Must-crack",
    emoji: "🔥",
    blurb: "Appears almost every year – do these first.",
  },
  "high-roi": {
    label: "High-ROI",
    emoji: "💎",
    blurb: "Great marks for the time spent – do after must-crack.",
  },
  "good-to-do": {
    label: "Good-to-do",
    emoji: "🌈",
    blurb: "Safety net + confidence once core topics are done.",
  },
};

function normaliseSubject(raw?: string): SubjectKey {
  const val = (raw || "").toLowerCase();
  if (val === "science" || val === "sci") return "Science";
  return "Maths";
}

function pickDataset(subject: SubjectKey): TopicTrendsData {
  if (subject === "Science") {
    return class10ScienceTopicTrends as unknown as TopicTrendsData;
  }
  return class10MathTopicTrends as unknown as TopicTrendsData;
}

// Fallback stream if science topic has no stream tagged
function getStream(meta: TopicMeta): StreamKey {
  if (meta.stream === "Physics") return "Physics";
  if (meta.stream === "Chemistry") return "Chemistry";
  if (meta.stream === "Biology") return "Biology";
  return "all";
}

// --- Component ---------------------------------------------------

const TrendsPage: React.FC = () => {
  const navigate = useNavigate();

  // typed params
  const params = useParams<"grade" | "subject">();

  const grade = params.grade || "10";
  const subjectKey = normaliseSubject(params.subject);

  const [activeTier, setActiveTier] = useState<TierFilter>("all");
  const [activeStream, setActiveStream] = useState<StreamKey>("all");

  const trendsData = pickDataset(subjectKey);

  const topicEntries = useMemo(
    () => Object.entries(trendsData.topics),
    [trendsData]
  );

  const filteredTopicEntries = useMemo(() => {
    if (activeTier === "none") {
      return [] as typeof topicEntries;
    }

    let entries = topicEntries;

    if (subjectKey === "Science" && activeStream !== "all") {
      entries = entries.filter(
        ([, meta]) => getStream(meta) === activeStream
      );
    }

    if (activeTier !== "all") {
      entries = entries.filter(
        ([, meta]) => meta.tier === activeTier
      );
    }

    return entries;
  }, [topicEntries, activeTier, activeStream, subjectKey]);

  const totalWeightage = filteredTopicEntries.reduce(
    (sum, [, meta]) => sum + (meta.weightagePercent ?? 0),
    0
  );

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleSubjectToggle = (next: SubjectKey) => {
    navigate(`/trends/${grade}/${next}`);
  };

  const handleTierClick = (tier: "all" | TierKey) => {
    setActiveTier((prev) => {
      if (tier === "all") return "all";
      return prev === tier ? "none" : tier;
    });
  };

  const handleSampleQuestion = (topicName: string) => {
    // Deep-link into HPQ page – later we can read these query params
    navigate(
      `/highly-probable?grade=${grade}&subject=${subjectKey}&topic=${encodeURIComponent(
        topicName
      )}`
    );
  };

  const handleGoToTopicHub = (topicName: string) => {
    navigate(
      `/topic-hub?grade=${grade}&subject=${subjectKey}&topic=${encodeURIComponent(
        topicName
      )}`
    );
  };

  const goToHPQ = () => {
    navigate("/highly-probable");
  };

  const goToMockBuilder = () => {
    navigate("/mock-builder");
  };

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
          onClick={handleBackToHome}
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
          <span>Back to home</span>
        </button>

        {/* Hero card */}
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
                opacity: 0.85,
                marginBottom: 8,
              }}
            >
              Class {grade} • {subjectKey} • Exam trends
            </div>
            <h1
              style={{
                fontSize: "2.1rem",
                lineHeight: 1.15,
                fontWeight: 650,
                marginBottom: 10,
              }}
            >
              Class {grade} {subjectKey} Exam Trends Hub
            </h1>
            <p
              style={{
                fontSize: "0.95rem",
                lineHeight: 1.6,
                opacity: 0.96,
              }}
            >
              Your <strong>exam-vogue radar</strong> for this subject. See
              which chapters are{" "}
              <strong style={{ fontWeight: 700 }}>must-crack</strong>,{" "}
              <strong style={{ fontWeight: 700 }}>high-ROI</strong>, or{" "}
              <strong style={{ fontWeight: 700 }}>good-to-do</strong> based on
              CBSE board trends. Tap any card to open full concept notes,
              examples, and board-style tips.
            </p>

            {/* Tier filters */}
            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
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
                        item.id === "all"
                          ? "all"
                          : (item.id as TierKey)
                      )
                    }
                    style={{
                      borderRadius: 999,
                      padding: "6px 14px",
                      border: active
                        ? "1px solid rgba(15,23,42,0.2)"
                        : "1px solid rgba(241,245,249,0.3)",
                      background: active
                        ? "#f9fafb"
                        : "rgba(15,23,42,0.35)",
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
            {/* Subject toggle pill */}
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

            {/* Stream filter – only visible for Science */}
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
                    ] as { id: StreamKey; label: string }[]
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

        {/* Difficulty + sections card */}
        <section
          style={{
            marginTop: 20,
            borderRadius: 28,
            backgroundColor: "rgba(248,250,252,0.95)",
            border: "1px solid rgba(148,163,184,0.16)",
            boxShadow: "0 18px 40px rgba(148,163,184,0.35)",
            padding: "18px 22px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#0f172a",
              }}
            >
              Difficulty mix
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                fontSize: "0.8rem",
              }}
            >
              {/* Easy / Medium / Hard chips */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 999,
                  padding: "6px 12px",
                  backgroundColor: "#ecfdf3",
                  color: "#15803d",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "999px",
                    backgroundColor: "#22c55e",
                  }}
                />
                Easy 40%
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 999,
                  padding: "6px 12px",
                  backgroundColor: "#fffbeb",
                  color: "#a16207",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "999px",
                    backgroundColor: "#facc15",
                  }}
                />
                Medium 40%
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 999,
                  padding: "6px 12px",
                  backgroundColor: "#fef2f2",
                  color: "#b91c1c",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "999px",
                    backgroundColor: "#ef4444",
                  }}
                />
                Hard 20%
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                fontSize: "0.75rem",
                color: "#334155",
                paddingTop: 6,
              }}
            >
              {[
                "Section A (MCQs / Objective, 1 mark, 20 Qs)",
                "Section B (Very Short Answer, 2 marks, 6 Qs)",
                "Section C (Short Answer, 3 marks, 8 Qs)",
                "Section D (Long Answer, 4–5 marks, 4–6 Qs)",
                "Section E (Case-based, 4 marks)",
              ].map((chip) => (
                <span
                  key={chip}
                  style={{
                    borderRadius: 999,
                    padding: "6px 12px",
                    backgroundColor: "#eef2ff",
                    border: "1px solid rgba(129,140,248,0.45)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Topic list */}
        <section style={{ marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 650,
                  color: "#020617",
                  marginBottom: 4,
                }}
              >
                Class {grade} {subjectKey} — chapter &amp; concept trends
              </h2>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#64748b",
                }}
              >
                Darker / bolder cards are heavier. Hit the{" "}
                <span>🔥 must-crack</span> ones first, then the{" "}
                <span>💎 high-ROI</span> ones. Chill with{" "}
                <span>🌈 good-to-do</span> once the big boys are done.
              </p>
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#475569",
                whiteSpace: "nowrap",
              }}
            >
              Total weightage covered:{" "}
              <span style={{ fontWeight: 600, color: "#020617" }}>
                {totalWeightage}%
              </span>
            </div>
          </div>

          {filteredTopicEntries.length === 0 ? (
            <p
              style={{
                fontSize: "0.82rem",
                color: "#64748b",
                padding: "8px 4px",
              }}
            >
              Nothing visible with the current filters. Tap 🔥 / 💎 / 🌈 tier
              chips above again to roll the topics back down.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {filteredTopicEntries.map(([topicName, meta]) => {
                const tier: TierKey =
                  meta.tier && (tierMeta as any)[meta.tier]
                    ? (meta.tier as TierKey)
                    : "good-to-do";

                const sortedConcepts = Object.entries(
                  meta.conceptWeightage ?? {}
                ).sort((a, b) => b[1] - a[1]);

                const tierInfo = tierMeta[tier];

                return (
                  <div
                    key={topicName}
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
                            {topicName}
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
                            marginBottom: 6,
                          }}
                        >
                          {meta.summary || tierInfo.blurb}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            marginTop: 4,
                          }}
                        >
                          <button
                            onClick={() =>
                              handleSampleQuestion(topicName)
                            }
                            style={{
                              borderRadius: 999,
                              padding: "5px 11px",
                              border:
                                "1px solid rgba(37,99,235,0.4)",
                              background: "rgba(239,246,255,0.9)",
                              fontSize: "0.75rem",
                              color: "#1d4ed8",
                              cursor: "pointer",
                            }}
                          >
                            View 1 sample Q →
                          </button>

                          <button
                            onClick={() =>
                              handleGoToTopicHub(topicName)
                            }
                            style={{
                              borderRadius: 999,
                              padding: "5px 11px",
                              border:
                                "1px solid rgba(148,163,184,0.6)",
                              background: "rgba(248,250,252,0.95)",
                              fontSize: "0.75rem",
                              color: "#475569",
                              cursor: "pointer",
                            }}
                          >
                            Go to topic hub →
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#64748b",
                          whiteSpace: "nowrap",
                          textAlign: "right",
                        }}
                      >
                        ~{meta.weightagePercent ?? 0}% of paper
                      </div>
                    </div>

                    {sortedConcepts.length > 0 && (
                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 8,
                          borderTop:
                            "1px dashed rgba(148,163,184,0.6)",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.78rem",
                            color: "#64748b",
                            marginBottom: 4,
                          }}
                        >
                          Most asked subtopics inside this chapter:
                        </p>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit,minmax(180px,1fr))",
                            gap: 6,
                            fontSize: "0.8rem",
                            color: "#0f172a",
                          }}
                        >
                          {sortedConcepts.map(([concept, pct]) => (
                            <div
                              key={concept}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 8,
                              }}
                            >
                              <span>{concept}</span>
                              <span style={{ color: "#64748b" }}>
                                ~{pct}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Step 2 / Step 3 CTA */}
        <section style={{ marginTop: 26 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            <button
              onClick={goToHPQ}
              style={{
                borderRadius: 24,
                padding: "14px 18px",
                border: "1px solid rgba(129,140,248,0.5)",
                background:
                  "linear-gradient(135deg, rgba(239,246,255,0.95), rgba(224,231,255,0.95))",
                textAlign: "left",
                cursor: "pointer",
                boxShadow: "0 12px 26px rgba(129,140,248,0.45)",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "#4b5563",
                  marginBottom: 4,
                }}
              >
                Step 2 • Practice
              </div>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 4,
                }}
              >
                See Highly Probable Questions for this grade
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#4b5563",
                }}
              >
                Jump to your curated HPQ bank, sorted by topic and difficulty.
              </p>
            </button>

            <button
              onClick={goToMockBuilder}
              style={{
                borderRadius: 24,
                padding: "14px 18px",
                border: "1px solid rgba(56,189,248,0.6)",
                background:
                  "linear-gradient(135deg, rgba(224,242,254,0.96), rgba(191,219,254,0.96))",
                textAlign: "left",
                cursor: "pointer",
                boxShadow: "0 12px 26px rgba(59,130,246,0.45)",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "#4b5563",
                  marginBottom: 4,
                }}
              >
                Step 3 • Full paper
              </div>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 4,
                }}
              >
                Auto-build an 80-mark mock paper
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#4b5563",
                }}
              >
                Use the HPQ bank + trends engine to generate a board-style mock.
              </p>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TrendsPage;
