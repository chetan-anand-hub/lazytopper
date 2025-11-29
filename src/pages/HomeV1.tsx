// src/pages/Home.tsx

import React from "react";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const goToClass10Maths = () => {
    navigate("/trends/10/Maths");
  };

  const goToMentor = () => {
    // change this route name if your planner page is different
    navigate("/mentor");
  };

  const goToTrends = () => {
    navigate("/trends/10/Maths");
  };

  const goToPredictivePapers = () => {
    navigate("/predictive-papers"); // adjust if your route is different
  };

  const goToMockBuilder = () => {
    navigate("/mock-builder");
  };

  return (
    <div
      className="page home-page"
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
          padding: "20px 16px 40px",
        }}
      >
        {/* HERO SECTION */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
            gap: 28,
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          {/* Left: copy + CTAs */}
          <div>
            <p
              style={{
                fontSize: "0.8rem",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "#6b7280",
                marginBottom: 8,
              }}
            >
              Board exam prep for the lazy-but-smart.
            </p>

            <h1
              style={{
                fontSize: "2.6rem",
                lineHeight: 1.1,
                fontWeight: 750,
                color: "#020617",
                marginBottom: 10,
              }}
            >
              We plan. You execute. ✏️🏆
            </h1>

            <p
              style={{
                fontSize: "0.98rem",
                lineHeight: 1.7,
                color: "#4b5563",
                maxWidth: 540,
                marginBottom: 16,
              }}
            >
              LazyTopper mixes{" "}
              <strong>AI question prediction, PYQ brains and a chill mentor</strong>{" "}
              so you can hit <strong>60–90%</strong> without living inside books
              10 hours a day.
            </p>

            {/* Feature pills */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 22,
              }}
            >
              {[
                { label: "PYQ trend analysis", emoji: "📊" },
                { label: "AI question predictor", emoji: "🤖" },
                { label: "Smart practice sets", emoji: "🧠" },
                { label: "Lazy-friendly AI mentor", emoji: "😎" },
              ].map((chip) => (
                <span
                  key={chip.label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 999,
                    backgroundColor: "rgba(15,23,42,0.03)",
                    border: "1px solid rgba(148,163,184,0.5)",
                    fontSize: "0.8rem",
                    color: "#111827",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <span>{chip.emoji}</span>
                  <span>{chip.label}</span>
                </span>
              ))}
            </div>

            {/* Primary + secondary CTA */}
            <div style={{ marginBottom: 10 }}>
              <button
                onClick={goToClass10Maths}
                style={{
                  width: "100%",
                  maxWidth: 420,
                  borderRadius: 999,
                  padding: "14px 22px",
                  border: "none",
                  cursor: "pointer",
                  background:
                    "linear-gradient(135deg, #22c55e 0%, #3b82f6 45%, #6366f1 100%)",
                  boxShadow: "0 18px 40px rgba(59,130,246,0.65)",
                  color: "#f9fafb",
                  fontWeight: 650,
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>🚀</span>
                <span>Start with Class 10 Maths</span>
              </button>
            </div>

            <div
              style={{
                fontSize: "0.85rem",
                color: "#6b7280",
                marginTop: 4,
              }}
            >
              or{" "}
              <button
                onClick={goToMentor}
                style={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "#2563eb",
                  fontWeight: 600,
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                }}
              >
                meet your AI mentor →
              </button>
            </div>

            <div
              style={{
                marginTop: 18,
                fontSize: "0.8rem",
                color: "#4b5563",
              }}
            >
              <strong>93</strong> days left for CBSE Class 10 boards (approx).{" "}
              <span style={{ opacity: 0.85 }}>
                Let&apos;s use them like a topper, not a zombie. 👀
              </span>
            </div>
          </div>

          {/* Right: LazyTopper stack card (marketing only) */}
          <div
            style={{
              borderRadius: 32,
              padding: "20px 20px 22px",
              background:
                "linear-gradient(145deg, #020617 0%, #111827 12%, #1d4ed8 55%, #22c1c3 100%)",
              color: "#f9fafb",
              boxShadow: "0 26px 70px rgba(15,23,42,0.7)",
              minHeight: 260,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 10px",
                borderRadius: 999,
                backgroundColor: "rgba(15,23,42,0.7)",
                fontSize: "0.7rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginBottom: 14,
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
              <span>LazyTopper stack</span>
            </div>

            {/* Simple bar shapes to echo your existing card */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 10,
                marginBottom: 18,
              }}
            >
              {[60, 80, 100, 72].map((height, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height,
                    borderRadius: 999,
                    background:
                      "linear-gradient(180deg, rgba(244,244,255,0.96), rgba(59,130,246,0.3))",
                  }}
                />
              ))}
            </div>

            <p
              style={{
                fontSize: "0.82rem",
                lineHeight: 1.7,
                marginBottom: 14,
              }}
            >
              One tab that replaces your:
            </p>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                fontSize: "0.8rem",
                lineHeight: 1.6,
              }}
            >
              <li>📊 Random PYQ spreadsheets</li>
              <li>📝 Hand-made “important chapters” lists</li>
              <li>📺 Endless YouTube video hopping</li>
              <li>📅 Messy study planners</li>
            </ul>

            <p
              style={{
                fontSize: "0.78rem",
                marginTop: 12,
                opacity: 0.88,
              }}
            >
              Trends, predictions, plan and mentor – all fused into one chill
              dashboard.
            </p>
          </div>
        </section>

        {/* PRODUCT PILLARS SECTION */}
        <section
          style={{
            marginBottom: 30,
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 650,
              color: "#020617",
              marginBottom: 6,
            }}
          >
            What lives inside LazyTopper?
          </h2>
          <p
            style={{
              fontSize: "0.86rem",
              color: "#64748b",
              marginBottom: 14,
            }}
          >
            Four pieces that talk to each other – so you always know{" "}
            <strong>what</strong> to study, <strong>how</strong> to practise,
            and <strong>when</strong> to revise.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {/* Trends */}
            <div
              className="card"
              style={{
                borderRadius: 24,
                padding: "14px 14px 16px",
                backgroundColor: "#f9fafb",
                border: "1px solid rgba(148,163,184,0.35)",
                boxShadow: "0 14px 30px rgba(148,163,184,0.28)",
              }}
            >
              <div
                style={{
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "#6b7280",
                  marginBottom: 6,
                }}
              >
                01 • Trends
              </div>
              <h3
                style={{
                  fontSize: "0.98rem",
                  fontWeight: 650,
                  marginBottom: 6,
                  color: "#0f172a",
                }}
              >
                PYQ trend radar
              </h3>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#4b5563",
                  marginBottom: 10,
                }}
              >
                10-year CBSE analysis that tells you which chapters actually
                decide your marks.
              </p>
              <button
                onClick={goToTrends}
                style={{
                  borderRadius: 999,
                  padding: "5px 10px",
                  border: "1px solid rgba(59,130,246,0.45)",
                  backgroundColor: "rgba(239,246,255,0.95)",
                  fontSize: "0.78rem",
                  color: "#1d4ed8",
                  cursor: "pointer",
                }}
              >
                View trends →
              </button>
            </div>

            {/* Predictive papers */}
            <div
              className="card"
              style={{
                borderRadius: 24,
                padding: "14px 14px 16px",
                backgroundColor: "#f9fafb",
                border: "1px solid rgba(148,163,184,0.35)",
                boxShadow: "0 14px 30px rgba(148,163,184,0.28)",
              }}
            >
              <div
                style={{
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "#6b7280",
                  marginBottom: 6,
                }}
              >
                02 • Predict
              </div>
              <h3
                style={{
                  fontSize: "0.98rem",
                  fontWeight: 650,
                  marginBottom: 6,
                  color: "#0f172a",
                }}
              >
                AI question predictor
              </h3>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#4b5563",
                  marginBottom: 10,
                }}
              >
                Predictive papers built from your PYQ engine – section-wise,
                80-mark ready.
              </p>
              <button
                onClick={goToPredictivePapers}
                style={{
                  borderRadius: 999,
                  padding: "5px 10px",
                  border: "1px solid rgba(139,92,246,0.5)",
                  backgroundColor: "rgba(237,233,254,0.9)",
                  fontSize: "0.78rem",
                  color: "#6d28d9",
                  cursor: "pointer",
                }}
              >
                See predicted papers →
              </button>
            </div>

            {/* Practice sets */}
            <div
              className="card"
              style={{
                borderRadius: 24,
                padding: "14px 14px 16px",
                backgroundColor: "#f9fafb",
                border: "1px solid rgba(148,163,184,0.35)",
                boxShadow: "0 14px 30px rgba(148,163,184,0.28)",
              }}
            >
              <div
                style={{
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "#6b7280",
                  marginBottom: 6,
                }}
              >
                03 • Practise
              </div>
              <h3
                style={{
                  fontSize: "0.98rem",
                  fontWeight: 650,
                  marginBottom: 6,
                  color: "#0f172a",
                }}
              >
                Smart practice sets
              </h3>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#4b5563",
                  marginBottom: 10,
                }}
              >
                Build mini-mocks & worksheets by topic, tier and difficulty in a
                few clicks.
              </p>
              <button
                onClick={goToMockBuilder}
                style={{
                  borderRadius: 999,
                  padding: "5px 10px",
                  border: "1px solid rgba(34,197,94,0.6)",
                  backgroundColor: "rgba(220,252,231,0.95)",
                  fontSize: "0.78rem",
                  color: "#15803d",
                  cursor: "pointer",
                }}
              >
                Build a mock →
              </button>
            </div>

            {/* Mentor */}
            <div
              className="card"
              style={{
                borderRadius: 24,
                padding: "14px 14px 16px",
                backgroundColor: "#f9fafb",
                border: "1px solid rgba(148,163,184,0.35)",
                boxShadow: "0 14px 30px rgba(148,163,184,0.28)",
              }}
            >
              <div
                style={{
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "#6b7280",
                  marginBottom: 6,
                }}
              >
                04 • Plan
              </div>
              <h3
                style={{
                  fontSize: "0.98rem",
                  fontWeight: 650,
                  marginBottom: 6,
                  color: "#0f172a",
                }}
              >
                Chill AI study mentor
              </h3>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#4b5563",
                  marginBottom: 10,
                }}
              >
                Converts your target %, days left and hours/day into a realistic{" "}
                <strong>marks-first</strong> roadmap.
              </p>
              <button
                onClick={goToMentor}
                style={{
                  borderRadius: 999,
                  padding: "5px 10px",
                  border: "1px solid rgba(59,130,246,0.55)",
                  backgroundColor: "rgba(219,234,254,0.95)",
                  fontSize: "0.78rem",
                  color: "#1d4ed8",
                  cursor: "pointer",
                }}
              >
                Open AI mentor →
              </button>
            </div>
          </div>
        </section>

        {/* HOW TO USE LAZYTOPPER (your step flow) */}
        <section
          className="card"
          style={{
            borderRadius: 32,
            padding: "22px 22px 20px",
            backgroundColor: "#f9fafb",
            border: "1px solid rgba(148,163,184,0.25)",
            boxShadow: "0 20px 48px rgba(148,163,184,0.45)",
            marginBottom: 26,
          }}
        >
          <h2
            style={{
              fontSize: "1.4rem",
              fontWeight: 650,
              marginBottom: 6,
              color: "#020617",
            }}
          >
            How to use LazyTopper
          </h2>
          <p
            style={{
              fontSize: "0.86rem",
              color: "#64748b",
              marginBottom: 16,
            }}
          >
            Mini flowchart for lazy legends 👇 Use this once, then chill and
            just follow the nudges.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {[
              {
                step: 1,
                title: "Pick your class & subject",
                body: "Hit “Start with Class 10 Maths” (or go to Chapters) and choose what you're actually writing this year.",
              },
              {
                step: 2,
                title: "Tell us your current level",
                body: "Either take the 15Q smart diagnostic or feed in your last 3 test scores – no judgment, only data.",
              },
              {
                step: 3,
                title: "Get a marks-first plan",
                body: "LazyTopper ranks chapters by PYQ weightage, time left and your level, then spits out a realistic daily roadmap.",
              },
              {
                step: 4,
                title: "Practise & level up",
                body: "Solve AI-generated, CBSE-vibe questions + mini mocks. Mentor keeps track and shouts when it's revision time.",
              },
            ].map((card) => (
              <div
                key={card.step}
                style={{
                  borderRadius: 24,
                  padding: "14px 14px 16px",
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(226,232,240,0.9)",
                  boxShadow: "0 10px 24px rgba(148,163,184,0.32)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    border: "2px solid #4f46e5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#4f46e5",
                    marginBottom: 8,
                  }}
                >
                  {card.step}
                </div>
                <h3
                  style={{
                    fontSize: "0.98rem",
                    fontWeight: 650,
                    marginBottom: 6,
                    color: "#0f172a",
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#4b5563",
                  }}
                >
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SNEAK PEEK AI MENTOR */}
        <section
          style={{
            borderRadius: 28,
            padding: "18px 20px",
            background:
              "linear-gradient(135deg, rgba(248,250,252,0.98), rgba(224,242,254,0.96))",
            border: "1px solid rgba(148,163,184,0.35)",
            boxShadow: "0 18px 40px rgba(148,163,184,0.45)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)",
              gap: 16,
              alignItems: "stretch",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 650,
                  color: "#020617",
                  marginBottom: 6,
                }}
              >
                Sneak peek: Your AI mentor
              </h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#475569",
                  marginBottom: 10,
                }}
              >
                Planner-mode only. You tell it{" "}
                <strong>targets, days left and hours/day</strong>; it sends you
                chapter-wise hours and next-step nudges.
              </p>
              <ul
                style={{
                  paddingLeft: "1.1rem",
                  margin: 0,
                  fontSize: "0.8rem",
                  color: "#334155",
                  lineHeight: 1.7,
                  marginBottom: 10,
                }}
              >
                <li>
                  Distributes hours using{" "}
                  <strong>Board weightage + must-crack/high-ROI tags</strong>.
                </li>
                <li>
                  Connects to <strong>TopicHub</strong>,{" "}
                  <strong>HPQ bank</strong> and{" "}
                  <strong>Mock Builder</strong> so “plan → study → practise”
                  feels like one flow.
                </li>
                <li>
                  Later: logs your mocks + scores to keep tweaking the roadmap.
                </li>
              </ul>
              <button
                onClick={goToMentor}
                style={{
                  borderRadius: 999,
                  padding: "8px 16px",
                  border: "none",
                  background:
                    "linear-gradient(135deg,#3b82f6,#6366f1,#22c55e)",
                  color: "#f9fafb",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 14px 30px rgba(59,130,246,0.55)",
                  marginTop: 4,
                }}
              >
                Open planner →
              </button>
            </div>

            {/* Fake screenshot card */}
            <div
              style={{
                borderRadius: 20,
                padding: "14px 14px 12px",
                background:
                  "linear-gradient(145deg,#020617,#0f172a,#1d4ed8)",
                color: "#e5e7eb",
                boxShadow: "0 16px 40px rgba(15,23,42,0.7)",
                fontSize: "0.78rem",
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
                <span
                  style={{
                    fontSize: "0.75rem",
                    opacity: 0.85,
                  }}
                >
                  Maths • Class 10
                </span>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    backgroundColor: "#020617",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.9rem",
                  }}
                >
                  😶
                </span>
              </div>
              <div
                style={{
                  borderRadius: 14,
                  backgroundColor: "rgba(15,23,42,0.88)",
                  padding: "10px 10px 8px",
                  marginBottom: 8,
                }}
              >
                <p style={{ margin: 0, marginBottom: 4 }}>
                  <strong>Planner snapshot</strong> for 80% target:
                </p>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1rem",
                    lineHeight: 1.55,
                  }}
                >
                  <li>93 days left • 1 hr/day</li>
                  <li>~60% hours → 🔥 must-crack chapters</li>
                  <li>~30% → 💎 high-ROI + revision</li>
                  <li>~10% → 🌈 good-to-do / buffer</li>
                </ul>
              </div>
              <p style={{ margin: 0, opacity: 0.9 }}>
                “Today’s focus: <strong>Pair of Linear Equations</strong> +
                <strong> Statistics</strong> HPQs. 40-minute mock, then 20
                minutes revision.”
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
