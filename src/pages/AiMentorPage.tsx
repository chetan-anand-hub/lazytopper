// src/pages/AiMentorPage.tsx

import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { class10MathTopicTrends } from "../data/class10MathTopicTrends";
import { class10ScienceTopicTrends } from "../data/class10ScienceTopicTrends";
import {
  class10ContentConfig,
  type Class10SubjectKey,
  type Class10StreamKey,
  type Class10ContentTopicConfig,
  type ConceptNote,
} from "../data/class10ContentConfig";

type TopicTier = "must-crack" | "high-roi" | "good-to-do";

const tierEmoji: Record<TopicTier, string> = {
  "must-crack": "🔥",
  "high-roi": "💎",
  "good-to-do": "🌱",
};

const streamEmoji: Record<Class10StreamKey, string> = {
  Physics: "⚡",
  Chemistry: "🧪",
  Biology: "🧬",
};

const streamLabel: Record<Class10StreamKey, string> = {
  Physics: "Physics",
  Chemistry: "Chemistry",
  Biology: "Biology",
};

const AiMentorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);

  const grade = searchParams.get("grade") ?? "10";
  const subjectRaw = searchParams.get("subject") ?? "Maths";
  const subjectLabel: Class10SubjectKey =
    subjectRaw.toLowerCase().startsWith("sci") ? "Science" : "Maths";

  const topicParam = searchParams.get("topic") ?? "";
  const topicKey = decodeURIComponent(topicParam);

  const conceptParam = searchParams.get("concept") ?? "";
  const conceptTitle = decodeURIComponent(conceptParam);

  // Which trend dataset to use
  const isMath = subjectLabel === "Maths";

  const trendInfo: any = useMemo(() => {
    if (!topicKey) return undefined;
    if (isMath) {
      return (class10MathTopicTrends as any)?.topics?.[topicKey];
    }
    // class10ScienceTopicTrends may be { topics: { ... } } or flat
    const sci = class10ScienceTopicTrends as any;
    return sci?.topics?.[topicKey] ?? sci?.[topicKey];
  }, [isMath, topicKey]);

  const tier = (trendInfo?.tier ?? null) as TopicTier | null;
  const weightage = trendInfo?.weightagePercent as number | undefined;

  // Content lookup from shared config
  const content: Class10ContentTopicConfig | undefined = useMemo(() => {
    if (!topicKey) return undefined;
    return class10ContentConfig.find(
      (entry) => entry.subject === subjectLabel && entry.topicName === topicKey
    );
  }, [subjectLabel, topicKey]);

  const stream = content?.stream;

  const concept: ConceptNote | undefined = useMemo(() => {
    if (!content) return undefined;
    if (conceptTitle) {
      const byTitle = content.concepts.find(
        (c) => c.title.toLowerCase() === conceptTitle.toLowerCase()
      );
      if (byTitle) return byTitle;
    }
    // Fallback: just take the first concept for this topic
    return content.concepts[0];
  }, [content, conceptTitle]);

  const handleBack = () => {
    // Prefer going back, else go to chapters
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/chapters");
    }
  };

  // Build the payload preview we will (later) send to GPT
  const payloadPreview = {
    grade,
    subject: subjectLabel,
    topic: topicKey || null,
    concept: concept ? { id: concept.id, title: concept.title } : null,
    trends: trendInfo
      ? {
        tier: trendInfo.tier,
        weightagePercent: trendInfo.weightagePercent,
      }
      : null,
  };

  return (
    <div className="page ai-mentor-page">
      {/* Back link */}
      <button
        onClick={handleBack}
        className="link-back"
        style={{
          border: "none",
          background: "transparent",
          color: "#6b7280",
          marginTop: 16,
          marginLeft: 16,
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <div
        style={{
          maxWidth: 1080,
          margin: "24px auto 40px",
          padding: "0 16px 40px",
        }}
      >
        {/* Header */}
        <header
          style={{
            marginBottom: 24,
          }}
        >
          <div
            style={{
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontSize: "0.75rem",
              color: "#6b7280",
              marginBottom: 4,
            }}
          >
            Class {grade} · {subjectLabel}
          </div>
          <h1
            className="page-title"
            style={{
              margin: 0,
              fontSize: "1.9rem",
              fontWeight: 700,
              color: "#020617",
            }}
          >
            AI Mentor
          </h1>
          <p
            className="page-subtitle"
            style={{
              marginTop: 6,
              maxWidth: 640,
              fontSize: "0.95rem",
              color: "#4b5563",
              lineHeight: 1.6,
            }}
          >
            Personalised practice for{" "}
            <strong>{topicKey || "this topic"}</strong>
            {concept && (
              <>
                {" "}
                · concept: <strong>{concept.title}</strong>
              </>
            )}
            . This is where your Socratic, Gen-Z friendly AI tutor will live.
          </p>

          {/* Meta pills row */}
          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              fontSize: "0.8rem",
            }}
          >
            {tier && (
              <span
                style={{
                  borderRadius: 999,
                  padding: "4px 10px",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{tierEmoji[tier]}</span>
                <span>{tier.replace("-", " ")}</span>
              </span>
            )}
            {typeof weightage === "number" && (
              <span
                style={{
                  borderRadius: 999,
                  padding: "4px 10px",
                  background: "#fef3c7",
                  color: "#92400e",
                  border: "1px solid #fed7aa",
                }}
              >
                ≈ {weightage}% exam weightage
              </span>
            )}

            {subjectLabel === "Science" && stream && (
              <span
                style={{
                  borderRadius: 999,
                  padding: "4px 10px",
                  background: "#ecfeff",
                  color: "#0369a1",
                  border: "1px solid #bae6fd",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{streamEmoji[stream]}</span>
                <span>{streamLabel[stream]} stream</span>
              </span>
            )}
          </div>
        </header>

        {/* Two-column layout: left = AI session, right = context */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1.3fr)",
            gap: 24,
          }}
        >
          {/* LEFT: AI session stub + payload preview */}
          <main>
            <section
              style={{
                marginBottom: 18,
                padding: 16,
                borderRadius: 20,
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  marginBottom: 8,
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                🤖 Your AI practice space
              </h2>
              <p
                style={{
                  margin: 0,
                  marginBottom: 10,
                  fontSize: "0.9rem",
                  color: "#4b5563",
                  lineHeight: 1.6,
                }}
              >
                Soon, this area will host a chat-like flow where the mentor asks
                you step-by-step questions, gives hints and board-style
                practice, and tracks your weak areas for{" "}
                <strong>Class 10 {subjectLabel}</strong>.
              </p>

              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 14,
                  background: "#ffffff",
                  border: "1px dashed #e5e7eb",
                  fontSize: "0.8rem",
                  color: "#4b5563",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 6,
                    color: "#111827",
                  }}
                >
                  Debug preview: what we’ll send to GPT
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: 8,
                    borderRadius: 10,
                    background: "#0f172a",
                    color: "#e5e7eb",
                    fontSize: "0.75rem",
                    overflowX: "auto",
                  }}
                >
                  {JSON.stringify(payloadPreview, null, 2)}
                </pre>
                <p
                  style={{
                    marginTop: 8,
                    marginBottom: 0,
                  }}
                >
                  On the backend, this will be combined with your{" "}
                  <strong>gpt_directive</strong> and the full trends + content
                  JSON to generate:
                  <br />
                  – theory notes, <br />
                  – Socratic solved examples, <br />
                  – board-style questions with marking scheme, <br />
                  – common mistakes + strategy.
                </p>
              </div>
            </section>

            {/* Placeholder chat card */}
            <section
              style={{
                padding: 16,
                borderRadius: 20,
                background:
                  "radial-gradient(circle at top left,#eef2ff,#ffffff)",
                border: "1px solid #e5e7eb",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  marginBottom: 8,
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Coming soon: Live AI session
              </h2>
              <p
                style={{
                  margin: 0,
                  marginBottom: 6,
                  fontSize: "0.9rem",
                  color: "#4b5563",
                  lineHeight: 1.6,
                }}
              >
                Once wired, you&apos;ll:
              </p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontSize: "0.85rem",
                  color: "#4b5563",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <li>
                  Answer short questions on{" "}
                  <strong>{topicKey || "this topic"}</strong> and get instant
                  feedback.
                </li>
                <li>
                  See hints and partial guidance instead of direct answers, like
                  a real teacher.
                </li>
                <li>
                  Get auto-generated mock questions based on your mistakes.
                </li>
              </ul>
            </section>
          </main>

          {/* RIGHT: context from TopicHub config */}
          <aside>
            {content && concept && (
              <section
                style={{
                  marginBottom: 18,
                  padding: 14,
                  borderRadius: 18,
                  border: "1px solid #e5e7eb",
                  background:
                    "radial-gradient(circle at top left,#f9fafb,#ffffff)",
                  fontSize: "0.85rem",
                  color: "#4b5563",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    marginBottom: 6,
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  Focus concept today
                </h3>
                <p
                  style={{
                    margin: 0,
                    marginBottom: 4,
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {concept.title}
                </p>
                <p
                  style={{
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  {concept.summary}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    color: "#6b7280",
                  }}
                >
                  <strong>Exam tip:</strong> {concept.examTip}
                </p>
              </section>
            )}

            {/* YouTube recommendation, if any */}
            {content?.youtube && (
              <section
                style={{
                  marginBottom: 18,
                  padding: 14,
                  borderRadius: 18,
                  border: "1px solid #e5e7eb",
                  background:
                    "radial-gradient(circle at top left,#e0f2fe,#ffffff)",
                  fontSize: "0.8rem",
                  color: "#0f172a",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    marginBottom: 6,
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  🎧 Watch this before you practice
                </h3>
                <p
                  style={{
                    margin: 0,
                    marginBottom: 6,
                    fontWeight: 500,
                  }}
                >
                  {content.youtube.title}
                </p>
                <p
                  style={{
                    margin: 0,
                    marginBottom: 8,
                    color: "#4b5563",
                  }}
                >
                  {content.youtube.why_recommended}
                </p>
                <a
                  href={content.youtube.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    borderRadius: 999,
                    padding: "6px 10px",
                    border: "1px solid #1d4ed8",
                    color: "#1d4ed8",
                    fontSize: "0.78rem",
                    textDecoration: "none",
                    background: "#eff6ff",
                  }}
                >
                  ▶ Open YouTube
                </a>
              </section>
            )}

            <section
              style={{
                padding: 14,
                borderRadius: 18,
                border: "1px dashed #e5e7eb",
                background: "#f9fafb",
                fontSize: "0.8rem",
                color: "#4b5563",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  marginBottom: 6,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                How this page will help you
              </h3>
              <p style={{ margin: 0, marginBottom: 4 }}>
                1. Watch the recommended board-quality video.
              </p>
              <p style={{ margin: 0, marginBottom: 4 }}>
                2. Start AI practice – answer questions, get hints and fix your
                weak spots.
              </p>
              <p style={{ margin: 0 }}>
                3. Your performance will feed back into{" "}
                <strong>Mocks + HPQ</strong> so you&apos;re always practising
                what matters most for boards.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AiMentorPage;
