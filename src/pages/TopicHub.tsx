// src/pages/TopicHub.tsx

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type {
  Class10SubjectKey,
  TopicContentConfig,
  TopicSectionConfig,
} from "../data/class10ContentConfig";
import {
  getTopicContent,
  buildGenericTopicConfig,
} from "../data/class10ContentConfig";

// --- Helpers -----------------------------------------------------

type TopicTier = "must-crack" | "high-roi" | "good-to-do";

const tierMeta: Record<
  TopicTier,
  {
    label: string;
    emoji: string;
    chipBg: string;
    chipText: string;
    gradient: string;
  }
> = {
  "must-crack": {
    label: "Must-crack topic",
    emoji: "🔥",
    chipBg: "#fee2e2",
    chipText: "#b91c1c",
    gradient:
      "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 25%, #f97316 65%, #facc15 100%)",
  },
  "high-roi": {
    label: "High-ROI topic",
    emoji: "💎",
    chipBg: "#e0e7ff",
    chipText: "#3730a3",
    gradient:
      "linear-gradient(135deg, #020617 0%, #0f172a 15%, #1d4ed8 55%, #22c1c3 100%)",
  },
  "good-to-do": {
    label: "Good-to-do topic",
    emoji: "🌈",
    chipBg: "#e0f2fe",
    chipText: "#0369a1",
    gradient:
      "linear-gradient(135deg, #0f172a 0%, #0369a1 35%, #22c55e 80%, #a3e635 100%)",
  },
};

function normaliseSubject(raw?: string | null): Class10SubjectKey {
  const v = (raw || "").toLowerCase();
  if (v === "science" || v === "sci") return "Science";
  return "Maths";
}

// Little safe helpers to cope with partial / generic configs
function getSafeTier(config: TopicContentConfig | undefined): TopicTier {
  const t = (config as any)?.tier;
  if (t === "must-crack" || t === "high-roi" || t === "good-to-do") return t;
  return "high-roi";
}

function getDisplayTitle(
  topicParam: string,
  config: TopicContentConfig
): string {
  return (
    (config as any).displayName ||
    (config as any).title ||
    topicParam ||
    "Generic"
  );
}

// --- Component ---------------------------------------------------

const TopicHub: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const search = new URLSearchParams(location.search);
  const grade = search.get("grade") || "10";
  const subjectKey = normaliseSubject(search.get("subject"));
  const topicParam = search.get("topic") || "Generic";

  const rawConfig = getTopicContent(subjectKey, topicParam);
  const config: TopicContentConfig =
    (rawConfig as TopicContentConfig) ??
    buildGenericTopicConfig({
      subjectKey,
      topicKey: topicParam,
      topicName: topicParam,
    });

  const tier = getSafeTier(config);
  const tierInfo = tierMeta[tier];

  const title = getDisplayTitle(topicParam, config);
  const weightage =
    (config as any).weightagePercent ?? (config as any).approxWeightage ?? 0;

  // ---- content coming from config ------------------------------

  const heroTagline: string =
    (config as any).heroTagline ??
    "Fast-track your prep for this topic with a single scroll-friendly page. Start with NCERT + PYQs, then use LazyTopper’s HPQ bank and AI Mentor to lock the patterns.";

  const examLinkCaption: string =
    (config as any).examLinkCaption ??
    "See how this topic shows up across CBSE sections. Tap a chip to jump straight to Highly Probable Questions for that section.";

  const rawExamSections: TopicSectionConfig[] =
    (config as any).examSections ?? [];

  const examSections:
    | { id: string; label: string; blurb?: string }[]
    | undefined =
    rawExamSections.length > 0
      ? rawExamSections.map((sec) => ({
          id: sec.id,
          label: `${sec.label} · ${sec.marksLabel}`,
          blurb: sec.blurb,
        }))
      : undefined;

  const quickRoadmap: string[] =
    (config as any).quickRevisionRoadmap ??
    (config as any).roadmap ?? [
      "First, revise all NCERT solved examples for this chapter.",
      "Next, solve the last 3–5 years of PYQs for this topic.",
      "Finally, attempt 1–2 full section-wise mocks and analyse mistakes.",
    ];

  const howToUse: string[] =
    (config as any).howToUseSteps ??
    (config as any).howToUse ?? [
      "Skim this page once before starting PYQs / mocks for this topic.",
      "After every mock, come back and match your mistakes with the ‘Common mistakes’ list.",
      "Turn repeated mistakes into small flashcards and revise them 2–3 times before boards.",
    ];

  const keyConceptsSummary: string =
    (config as any).keyConceptsSummary ??
    "We’re still writing detailed concept cards for this topic. For now, maintain a tiny list in your notebook: (1) core definitions, (2) formulas / key results, (3) 2–3 most common PYQ patterns.";

  const boardExamplesSummary: string =
    (config as any).boardExamplesSummary ??
    "Full board-style examples for this topic are coming soon. Till then, practise from the Highly Probable questions and use the AI Mentor to check your steps.";

  const recommendedVideoSummary: string =
    (config as any).recommendedVideoSummary ??
    "We’re shortlisting the best one-shot video for this topic. For now, search on YouTube by the topic name plus “one-shot”.";

  const recommendedVideoUrl: string | undefined = (config as any)
    .recommendedVideoUrl;
  const recommendedVideo: any = (config as any).recommendedVideo;

  // For richer cards
  const concepts: Array<any> = (config as any).conceptNotes ?? [];
  const boardExamples: Array<any> = (config as any).boardExamples ?? [];

  const mistakes: Array<string | any> =
    (config as any).commonMistakes ?? [];

  // --- navigation handlers --------------------------------------

  const handleBackToTrends = () => {
    navigate(`/trends/${grade}/${subjectKey}`);
  };

  const handleAskMentor = (
    conceptId?: string,
    extra?: Record<string, any>
  ) => {
    navigate("/ai-mentor", {
      state: {
        grade,
        subject: subjectKey,
        topic: title,
        topicKey: (config as any).topicKey || topicParam,
        conceptId,
        ...extra,
      },
    });
  };

  // Clicking exam section chips -> open HPQ pre-filtered by section
  const handleExamSectionClick = (sectionId: string) => {
    navigate(
      `/highly-probable?grade=${grade}&subject=${subjectKey}&topic=${encodeURIComponent(
        title
      )}&section=${sectionId}`
    );
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
          <span>Back to trends</span>
        </button>

        {/* Hero */}
        <section
          style={{
            borderRadius: 32,
            padding: "24px 24px 24px 28px",
            background: tierInfo.gradient,
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
              Class {grade} · {subjectKey} · Topic
            </div>

            <h1
              style={{
                fontSize: "2.1rem",
                lineHeight: 1.15,
                fontWeight: 650,
                marginBottom: 8,
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontSize: "0.95rem",
                lineHeight: 1.6,
                opacity: 0.96,
              }}
            >
              {heroTagline}
            </p>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                alignItems: "center",
              }}
            >
              {/* Tier pill */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 999,
                  padding: "6px 12px",
                  backgroundColor: tierInfo.chipBg,
                  color: tierInfo.chipText,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                <span>{tierInfo.emoji}</span>
                <span>{tierInfo.label}</span>
              </span>

              {/* Weightage pill */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 999,
                  padding: "6px 12px",
                  backgroundColor: "rgba(15,23,42,0.35)",
                  color: "#e5e7eb",
                  fontSize: "0.8rem",
                }}
              >
                <span>≈ {weightage || "?"}% exam weightage</span>
              </span>

              {/* Quick revision / board-style practice tags */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 999,
                  padding: "6px 12px",
                  backgroundColor: "rgba(15,23,42,0.35)",
                  color: "#e5e7eb",
                  fontSize: "0.8rem",
                }}
              >
                ⚡ Quick revision
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 999,
                  padding: "6px 12px",
                  backgroundColor: "rgba(15,23,42,0.35)",
                  color: "#e5e7eb",
                  fontSize: "0.8rem",
                }}
              >
                🎯 Board-style practice
              </span>
            </div>
          </div>

          {/* Small right column – generic tips */}
          <div
            style={{
              alignSelf: "stretch",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 12,
              fontSize: "0.8rem",
              maxWidth: 260,
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 18,
                background: "rgba(15,23,42,0.45)",
                border: "1px solid rgba(248,250,252,0.3)",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 4,
                  opacity: 0.9,
                }}
              >
                Topic game-plan
              </div>
              <p style={{ lineHeight: 1.5, opacity: 0.95 }}>
                1️⃣ Read this page once. 2️⃣ Do NCERT & PYQs. 3️⃣ Use{" "}
                <strong>HPQ</strong> & <strong>AI Mentor</strong> to clean up
                doubts.
              </p>
            </div>
          </div>
        </section>

        {/* Main content grid */}
        <section style={{ marginTop: 24 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1.4fr)",
              gap: 16,
              marginBottom: 16,
            }}
          >
            {/* Exam link card */}
            <div
              style={{
                borderRadius: 24,
                backgroundColor: "rgba(248,250,252,0.98)",
                border: "1px solid rgba(148,163,184,0.3)",
                boxShadow: "0 18px 40px rgba(148,163,184,0.35)",
                padding: "18px 20px 16px",
              }}
            >
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 650,
                  color: "#0f172a",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span role="img" aria-label="paperclip">
                  📎
                </span>
                Exam link
              </div>
              <p
                style={{
                  fontSize: "0.83rem",
                  color: "#475569",
                  marginBottom: 10,
                }}
              >
                {examLinkCaption}
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 4,
                }}
              >
                {(examSections && examSections.length > 0
                  ? examSections
                  : [
                      {
                        id: "A",
                        label: "MCQs / Objective · 1 mark",
                      },
                      {
                        id: "B",
                        label: "Very short answer · 2 marks",
                      },
                      {
                        id: "C",
                        label: "Short answer · 3 marks",
                      },
                      {
                        id: "D",
                        label: "Long answer · 4–5 marks",
                      },
                      {
                        id: "E",
                        label: "Case-based · 4 marks",
                      },
                    ]
                ).map((sec) => (
                  <button
                    key={sec.id + sec.label}
                    onClick={() => handleExamSectionClick(sec.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      borderRadius: 999,
                      padding: "6px 12px",
                      backgroundColor: "#eef2ff",
                      border: "1px solid rgba(129,140,248,0.55)",
                      fontSize: "0.78rem",
                      color: "#1e293b",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        backgroundColor: "#4f46e5",
                      }}
                    />
                    <span>{sec.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* How to use this page */}
            <div
              style={{
                borderRadius: 24,
                backgroundColor: "rgba(255,247,237,0.98)",
                border: "1px solid rgba(251,146,60,0.5)",
                boxShadow: "0 18px 40px rgba(251,146,60,0.35)",
                padding: "18px 20px 16px",
              }}
            >
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 650,
                  color: "#7c2d12",
                  marginBottom: 6,
                }}
              >
                How to use this page
              </div>
              <ol
                style={{
                  fontSize: "0.83rem",
                  color: "#7c2d12",
                  paddingLeft: 18,
                  lineHeight: 1.6,
                }}
              >
                {howToUse.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* Second row – Quick revision + Recommended video */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1.4fr)",
              gap: 16,
              marginBottom: 16,
            }}
          >
            {/* Quick revision roadmap */}
            <div
              style={{
                borderRadius: 24,
                backgroundColor: "rgba(248,250,252,0.98)",
                border: "1px solid rgba(148,163,184,0.3)",
                boxShadow: "0 18px 40px rgba(148,163,184,0.28)",
                padding: "18px 20px 16px",
              }}
            >
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 650,
                  color: "#0f172a",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span role="img" aria-label="lightning">
                  ⚡
                </span>
                Quick revision roadmap
              </div>
              <ul
                style={{
                  fontSize: "0.83rem",
                  color: "#475569",
                  paddingLeft: 18,
                  lineHeight: 1.6,
                }}
              >
                {quickRoadmap.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>

            {/* Recommended board video */}
            <div
              style={{
                borderRadius: 24,
                backgroundColor: "rgba(240,249,255,0.98)",
                border: "1px solid rgba(56,189,248,0.5)",
                boxShadow: "0 18px 40px rgba(59,130,246,0.32)",
                padding: "18px 20px 16px",
              }}
            >
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 650,
                  color: "#0f172a",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span role="img" aria-label="headphones">
                  🎧
                </span>
                Recommended board video
              </div>
              {recommendedVideoUrl ? (
                <>
                  {recommendedVideo && (
                    <>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#0f172a",
                          marginBottom: 4,
                          fontWeight: 600,
                        }}
                      >
                        {recommendedVideo.title}
                      </p>
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#64748b",
                          marginBottom: 6,
                        }}
                      >
                        {recommendedVideo.channel && (
                          <>
                            {recommendedVideo.channel}
                            {" · "}
                          </>
                        )}
                        {recommendedVideo.meta}
                      </p>
                    </>
                  )}

                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#475569",
                      marginBottom: 8,
                    }}
                  >
                    {recommendedVideoSummary}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 4,
                    }}
                  >
                    <a
                      href={recommendedVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        borderRadius: 999,
                        padding: "6px 12px",
                        fontSize: "0.8rem",
                        backgroundColor: "#0f172a",
                        color: "#f9fafb",
                        textDecoration: "none",
                      }}
                    >
                      ▶ Watch on YouTube
                    </a>

                    <button
                      onClick={() =>
                        handleAskMentor("summarise-video", {
                          videoUrl: recommendedVideoUrl,
                        })
                      }
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        borderRadius: 999,
                        padding: "6px 12px",
                        fontSize: "0.8rem",
                        border: "1px solid rgba(37,99,235,0.6)",
                        backgroundColor: "#eff6ff",
                        color: "#1d4ed8",
                        cursor: "pointer",
                      }}
                    >
                      🤖 Summarise this video
                    </button>
                  </div>
                </>
              ) : (
                <p
                  style={{
                    fontSize: "0.83rem",
                    color: "#475569",
                    lineHeight: 1.6,
                  }}
                >
                  {recommendedVideoSummary}
                </p>
              )}
            </div>
          </div>

          {/* Concepts + mistakes / board examples */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1.4fr)",
              gap: 16,
            }}
          >
            {/* Key concepts */}
            <div
              style={{
                borderRadius: 24,
                backgroundColor: "rgba(248,250,252,0.98)",
                border: "1px solid rgba(148,163,184,0.3)",
                boxShadow: "0 18px 40px rgba(148,163,184,0.28)",
                padding: "18px 20px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 650,
                    color: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span role="img" aria-label="brain">
                    🧠
                  </span>
                  Key concepts & ideas
                </div>

                <button
                  onClick={() => handleAskMentor(undefined)}
                  style={{
                    borderRadius: 999,
                    padding: "6px 12px",
                    border: "1px solid rgba(37,99,235,0.6)",
                    backgroundColor: "#eff6ff",
                    fontSize: "0.78rem",
                    color: "#1d4ed8",
                    cursor: "pointer",
                  }}
                >
                  🤖 Ask AI Mentor about this topic
                </button>
              </div>

              {concepts.length === 0 ? (
                <p
                  style={{
                    fontSize: "0.83rem",
                    color: "#475569",
                  }}
                >
                  {keyConceptsSummary}
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
                    gap: 10,
                    marginTop: 4,
                  }}
                >
                  {concepts.map((c: any) => (
                    <div
                      key={c.id}
                      style={{
                        borderRadius: 16,
                        padding: "10px 12px",
                        backgroundColor: "#f9fafb",
                        border: "1px solid rgba(226,232,240,0.9)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.83rem",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {c.title}
                      </div>
                      {c.summary && (
                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "#64748b",
                          }}
                        >
                          {c.summary}
                        </div>
                      )}
                      {c.examTip && (
                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "#0f172a",
                            marginTop: 4,
                          }}
                        >
                          <strong>Board tip:</strong> {c.examTip}
                        </div>
                      )}

                      <button
                        onClick={() => handleAskMentor(c.id)}
                        style={{
                          marginTop: 6,
                          alignSelf: "flex-start",
                          borderRadius: 999,
                          padding: "4px 10px",
                          border: "1px solid rgba(37,99,235,0.5)",
                          backgroundColor: "#eff6ff",
                          fontSize: "0.75rem",
                          color: "#1d4ed8",
                          cursor: "pointer",
                        }}
                      >
                        🤖 Ask AI Mentor for this concept
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right column – mistakes + board examples */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Common mistakes */}
              <div
                style={{
                  borderRadius: 24,
                  backgroundColor: "rgba(255,247,237,0.98)",
                  border: "1px solid rgba(251,146,60,0.5)",
                  boxShadow: "0 14px 30px rgba(251,146,60,0.32)",
                  padding: "16px 18px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 650,
                    color: "#7c2d12",
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span role="img" aria-label="party">
                    🎉
                  </span>
                  Common mistakes to avoid
                </div>
                {mistakes.length === 0 ? (
                  <ul
                    style={{
                      fontSize: "0.82rem",
                      color: "#7c2d12",
                      paddingLeft: 18,
                      lineHeight: 1.6,
                    }}
                  >
                    <li>
                      Skipping NCERT examples and jumping straight to tests.
                    </li>
                    <li>
                      Not analysing mistakes from PYQs / mocks and repeating the
                      same pattern.
                    </li>
                  </ul>
                ) : (
                  <ul
                    style={{
                      fontSize: "0.82rem",
                      color: "#7c2d12",
                      paddingLeft: 18,
                      lineHeight: 1.6,
                    }}
                  >
                    {mistakes.map((m: any, idx: number) => {
                      if (typeof m === "string") {
                        return <li key={idx}>{m}</li>;
                      }
                      return (
                        <li key={m.id ?? idx}>
                          <strong>{m.title}:</strong> {m.whatGoesWrong}{" "}
                          {m.fix && <>→ {m.fix}</>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Board-flavoured examples */}
              <div
                style={{
                  borderRadius: 24,
                  backgroundColor: "rgba(248,250,252,0.98)",
                  border: "1px solid rgba(148,163,184,0.3)",
                  boxShadow: "0 14px 30px rgba(148,163,184,0.28)",
                  padding: "16px 18px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 650,
                    color: "#0f172a",
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span role="img" aria-label="target">
                    🎯
                  </span>
                  Board-flavoured examples
                </div>

                {boardExamples.length === 0 ? (
                  <p
                    style={{
                      fontSize: "0.83rem",
                      color: "#475569",
                    }}
                  >
                    {boardExamplesSummary}
                  </p>
                ) : (
                  <ul
                    style={{
                      fontSize: "0.82rem",
                      color: "#475569",
                      paddingLeft: 18,
                      lineHeight: 1.6,
                    }}
                  >
                    {boardExamples.slice(0, 3).map((ex: any) => (
                      <li key={ex.id}>
                        <strong>{ex.title}:</strong> {ex.question}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TopicHub;
