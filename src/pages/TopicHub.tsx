// src/pages/TopicHub.tsx
import React, { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  class10MathTopicTrends,
  type Class10TopicKey,
  type TopicTier,
} from "../data/class10MathTopicTrends";

type Priority = "must-do" | "should-do" | "good-to-know";

interface ConceptNote {
  id: string;
  title: string;
  priority: Priority;
  summary: string;
  examTip: string;
}

interface ExampleNote {
  id: string;
  label: string;
  question: string;
  idea: string;
}

interface MistakeNote {
  id: string;
  title: string;
  whatHappens: string;
  fix: string;
}

interface TopicContent {
  topicKey: Class10TopicKey;
  tagline: string;
  roadmap: string;
  concepts: ConceptNote[];
  examples: ExampleNote[];
  mistakes: MistakeNote[];
}

// For navigation only (matches CBSE paper sections)
type PaperSectionKey = "A" | "B" | "C" | "D" | "E";

// Small helpers
const priorityLabel: Record<Priority, string> = {
  "must-do": "Must-do",
  "should-do": "Should-do",
  "good-to-know": "Good-to-know",
};

const priorityColor: Record<Priority, string> = {
  "must-do": "rgba(34,197,94,0.14)",
  "should-do": "rgba(59,130,246,0.12)",
  "good-to-know": "rgba(148,163,184,0.16)",
};

const tierEmoji: Record<TopicTier, string> = {
  "must-crack": "🔥",
  "high-roi": "💎",
  "good-to-do": "🌱",
};

// CBSE paper mapping strip
const paperSectionMeta: {
  key: PaperSectionKey;
  label: string;
  vibe: string;
}[] = [
  {
    key: "A",
    label: "Section A • 1 mark",
    vibe: "MCQs + assertion–reason",
  },
  {
    key: "B",
    label: "Section B • 2 marks",
    vibe: "Very short answer",
  },
  {
    key: "C",
    label: "Section C • 3 marks",
    vibe: "Short answer",
  },
  {
    key: "D",
    label: "Section D • 5 marks",
    vibe: "Long answer",
  },
  {
    key: "E",
    label: "Section E • 4 marks",
    vibe: "Case study (1,1,2)",
  },
];

// ---- Topic content for three key chapters ----

const topicContentMap: Partial<Record<Class10TopicKey, TopicContent>> = {
  "Pair of Linear Equations": {
    topicKey: "Pair of Linear Equations",
    tagline: "Algebra + graphs + word problems — guaranteed board presence.",
    roadmap:
      "Start with algebraic methods (elimination, substitution, cross-multiplication). Then practise graphical interpretation and finally word/application problems including questions on consistency.",
    concepts: [
      {
        id: "ple-concept-1",
        title: "Algebraic Solution Methods",
        priority: "must-do",
        summary:
          "Understand elimination, substitution and cross-multiplication as three equivalent ways to solve ax + by = c, a'x + b'y = c'.",
        examTip:
          "For most board questions, elimination is fastest. Arrange terms in the same order (x, y, constant) before eliminating.",
      },
      {
        id: "ple-concept-2",
        title: "Graphical Interpretation & Nature of Solutions",
        priority: "must-do",
        summary:
          "Visualise each linear equation as a straight line. Intersecting lines ⇒ unique solution, parallel distinct ⇒ no solution, coincident ⇒ infinitely many solutions.",
        examTip:
          "Always link algebra with geometry: equal ratios a1/a2 = b1/b2 ≠ c1/c2 ⇒ parallel lines (no solution).",
      },
      {
        id: "ple-concept-3",
        title: "Word & Application Problems",
        priority: "should-do",
        summary:
          "Translate situations into two variables and two equations: age problems, money, speed–time–distance and mixture problems.",
        examTip:
          "Write a statement for each equation. Clearly define variables before forming equations to avoid confusion.",
      },
    ],
    examples: [
      {
        id: "ple-ex-1",
        label: "Example: Typical 3-mark algebraic question",
        question:
          "Solve 3x + 4y = 10 and 2x − y = 1 using the elimination method. State the nature of the solution.",
        idea:
          "Multiply second equation by 4, add/subtract to eliminate y. Conclude that lines intersect at a unique point, so there is a unique solution.",
      },
      {
        id: "ple-ex-2",
        label: "Example: Application problem",
        question:
          "The sum of two numbers is 70. Three times the smaller exceeds the larger by 10. Form a pair of linear equations and find the numbers.",
        idea:
          "Let x, y be the numbers (x > y). Form x + y = 70 and 3y = x + 10. Solve by substitution or elimination.",
      },
    ],
    mistakes: [
      {
        id: "ple-m1",
        title: "Mismatching variable order in elimination",
        whatHappens:
          "Students add/subtract equations where x and y terms are not aligned, leading to wrong cancellation.",
        fix: "Always rewrite equations with x, y and constant in the same order before eliminating.",
      },
      {
        id: "ple-m2",
        title: "Mixing up consistency conditions",
        whatHappens:
          "Students memorise ratios incorrectly and misjudge whether the system has no solution or infinitely many.",
        fix: "Write the rule on the side: a1/a2 ≠ b1/b2 ⇒ unique solution; a1/a2 = b1/b2 ≠ c1/c2 ⇒ no solution; a1/a2 = b1/b2 = c1/c2 ⇒ infinitely many solutions.",
      },
    ],
  },

  "Quadratic Equations": {
    topicKey: "Quadratic Equations",
    tagline:
      "Three pillars: forming the equation, nature of roots and application problems.",
    roadmap:
      "First be fluent in converting word problems into ax² + bx + c = 0. Then master discriminant-based nature of roots and solving using factorisation or quadratic formula.",
    concepts: [
      {
        id: "qe-concept-1",
        title: "Forming Quadratic Equations",
        priority: "must-do",
        summary:
          "Translate statements like 'product is 56' or 'sum of reciprocals is 1/4' into x² terms and form ax² + bx + c = 0.",
        examTip:
          "Always bring everything to one side and simplify before identifying a, b, c.",
      },
      {
        id: "qe-concept-2",
        title: "Nature of Roots using Discriminant",
        priority: "must-do",
        summary:
          "Use D = b² − 4ac: D > 0 ⇒ real & distinct, D = 0 ⇒ real & equal, D < 0 ⇒ no real roots.",
        examTip:
          "For board questions asking 'find k so that roots are equal/real', directly put D = 0 or D ≥ 0 and solve for k.",
      },
      {
        id: "qe-concept-3",
        title: "Solving Quadratic Equations",
        priority: "should-do",
        summary:
          "Solve by factorisation when possible; otherwise use x = [−b ± √(b² − 4ac)] / 2a.",
        examTip:
          "Check if common factor can be taken out first; it simplifies both the equation and discriminant.",
      },
    ],
    examples: [
      {
        id: "qe-ex-1",
        label: "Example: Parameter k with equal roots",
        question:
          "For what value of k does the equation 3x² + 6x + k = 0 have equal roots?",
        idea:
          "Set D = 0 ⇒ 6² − 4·3·k = 0 ⇒ 36 − 12k = 0 ⇒ k = 3. Conclude that roots are equal for k = 3.",
      },
      {
        id: "qe-ex-2",
        label: "Example: Word problem leading to quadratic",
        question:
          "The product of two consecutive positive integers is 156. Form the quadratic equation and find the numbers.",
        idea:
          "Let smaller integer be n. Then n(n + 1) = 156 ⇒ n² + n − 156 = 0. Factorise to get n = 12, so numbers are 12 and 13.",
      },
    ],
    mistakes: [
      {
        id: "qe-m1",
        title: "Wrong substitution into discriminant",
        whatHappens:
          "a, b, c are read incorrectly (especially sign of c), so D is wrong and the nature of roots answer fails.",
        fix: "Write ax² + bx + c above the given equation and match term-by-term with signs before computing D.",
      },
      {
        id: "qe-m2",
        title: "Losing one root when taking square roots",
        whatHappens:
          "When solving by taking square roots, the negative root is often missed.",
        fix: "Remember: whenever you take √ on both sides, write ±. That automatically gives two possible roots.",
      },
    ],
  },

  Trigonometry: {
    topicKey: "Trigonometry",
    tagline:
      "Ratios, identities and heights–distances: one of the highest weightage units.",
    roadmap:
      "Start by memorising standard trig values and sign rules in each quadrant. Then practise proving basic identities and finally solve heights and distances questions using diagrams.",
    concepts: [
      {
        id: "trig-concept-1",
        title: "Trig Ratios & Standard Values",
        priority: "must-do",
        summary:
          "Know sin, cos, tan values for 0°, 30°, 45°, 60°, 90°. Understand that tanθ = sinθ/cosθ and reciprocal ratios sec, cosec, cot.",
        examTip:
          "Write the ‘magic triangle’ or standard table at the top of the paper as soon as the exam starts to avoid memory slips.",
      },
      {
        id: "trig-concept-2",
        title: "Basic Identities",
        priority: "must-do",
        summary:
          "Use sin²θ + cos²θ = 1, 1 + tan²θ = sec²θ, 1 + cot²θ = cosec²θ for simplifications and proofs.",
        examTip:
          "In proofs, convert everything to sin and cos first; this often makes the LHS and RHS meet cleanly.",
      },
      {
        id: "trig-concept-3",
        title: "Heights and Distances",
        priority: "should-do",
        summary:
          "Convert word problems into right-triangle diagrams with angles of elevation and depression, then apply tan, sin or cos.",
        examTip:
          "Always mark the right angle, horizontal line and angle clearly. Decide which side you know and which you need before choosing tan/sin/cos.",
      },
    ],
    examples: [
      {
        id: "trig-ex-1",
        label: "Example: Identity proof",
        question:
          "Prove that (1 − tan²θ) / (1 + tan²θ) = cos 2θ, for all θ where both sides are defined.",
        idea:
          "Write tanθ = sinθ/cosθ, simplify numerator and denominator to get (cos²θ − sin²θ)/(cos²θ + sin²θ) = cos2θ.",
      },
      {
        id: "trig-ex-2",
        label: "Example: Heights & distances",
        question:
          "From the top of a 20 m building, angle of elevation of a tower top is 30° and angle of depression of its foot is 45°. Find the height of the tower.",
        idea:
          "Find horizontal distance using tan45° = 20/x ⇒ x = 20 m. Then use tan30° = (h − 20)/20 to get the remaining height.",
      },
    ],
    mistakes: [
      {
        id: "trig-m1",
        title: "Confusing angle of elevation & depression",
        whatHappens:
          "Students draw the angle on the wrong side, which changes which side is opposite/adjacent.",
        fix: "Angle of elevation is always measured upwards from the horizontal of the observer; angle of depression is measured downwards from the observer’s horizontal.",
      },
      {
        id: "trig-m2",
        title: "Using wrong trig ratio/standard value",
        whatHappens:
          "Using tan instead of sin, or mixing values like sin30° and cos30°.",
        fix: "Before calculating, say aloud: ‘opposite/hypotenuse → sin, adjacent/hypotenuse → cos, opposite/adjacent → tan’. Cross-check the angle and ratio.",
      },
    ],
  },
};

// ---- React component ----

const TopicHub: React.FC = () => {
  const navigate = useNavigate();
  const { topicKey: topicSlug } = useParams<{ topicKey: string }>();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const highlightedConceptName = searchParams.get("concept") ?? "";

  const gradeQuery = searchParams.get("grade") ?? "10";
  const subjectRaw = searchParams.get("subject") ?? "Maths";
  const subjectLabel = subjectRaw.toLowerCase().startsWith("sci")
    ? "Science"
    : "Maths";

  const decodedSlug = decodeURIComponent(topicSlug ?? "");
  const allTopicKeys = useMemo(
    () => Object.keys(class10MathTopicTrends.topics) as Class10TopicKey[],
    []
  );

  const isValidTopic = allTopicKeys.includes(decodedSlug as Class10TopicKey);
  const topicKey = isValidTopic ? (decodedSlug as Class10TopicKey) : undefined;

  const trendInfo = topicKey
    ? class10MathTopicTrends.topics[topicKey]
    : undefined;

  const tier = (trendInfo as any)?.tier as TopicTier | undefined;
  const weightage = trendInfo?.weightagePercent;

  const content: TopicContent | undefined = topicKey
    ? topicContentMap[topicKey]
    : undefined;

  const handleBack = () => navigate("/chapters");

  const handleSectionChipClick = (section: PaperSectionKey) => {
    navigate(`/mock-paper?section=${section}`);
  };

  // If topic is unknown, show generic coming soon
  if (!topicKey) {
    return (
      <div className="page topic-page">
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
          ← Back to chapters
        </button>
        <div
          style={{
            maxWidth: 900,
            margin: "40px auto",
            padding: "32px 24px",
          }}
        >
          <h1 className="page-title">Topic coming soon</h1>
          <p className="page-subtitle">
            We haven’t wired this chapter into TopicHub yet. It’ll get the same
            rich concept notes + examples treatment soon.
          </p>
        </div>
      </div>
    );
  }

  // Topic is valid but we don't have content yet → show the same placeholder
  if (!content) {
    return (
      <div className="page topic-page">
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
          ← Back to chapters
        </button>
        <div
          style={{
            maxWidth: 900,
            margin: "40px auto",
            padding: "32px 24px",
          }}
        >
          <h1 className="page-title">Topic coming soon</h1>
          <p className="page-subtitle">
            We’re still preparing concept notes + examples for{" "}
            <strong>{topicKey}</strong>. For now, use NCERT + PYQs and the
            trends view to plan your revision.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page topic-page">
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
        ← Back to chapters
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
            Class {gradeQuery} · {subjectLabel}
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
            {topicKey}
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
            {content.tagline}
          </p>

          {/* meta pills */}
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
          </div>

          {/* CBSE paper mapping + section chips */}
          <section
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 18,
              border: "1px solid #e5e7eb",
              background:
                "linear-gradient(135deg, rgba(239,246,255,0.9), #ffffff)",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                color: "#4b5563",
                marginBottom: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>
                🧪 <strong>Exam link:</strong> See how this topic appears in the
                CBSE paper.
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  whiteSpace: "nowrap",
                }}
              >
                Tap a section to build mocks →
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {paperSectionMeta.map((sec) => (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => handleSectionChipClick(sec.key)}
                  style={{
                    borderRadius: 999,
                    border: "1px solid #dbeafe",
                    background: "#ffffff",
                    padding: "6px 10px",
                    fontSize: "0.78rem",
                    color: "#1d4ed8",
                    display: "inline-flex",
                    flexShrink: 0,
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(37,99,235,0.05)",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "999px",
                      background: "#eff6ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "#1d4ed8",
                    }}
                  >
                    {sec.key}
                  </span>
                  <span>{sec.label}</span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#6b7280",
                    }}
                  >
                    · {sec.vibe}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </header>

        {/* Layout: main + side */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2.2fr) minmax(0, 1.2fr)",
            gap: 24,
          }}
        >
          {/* Main column: roadmap + concepts + examples */}
          <main>
            {/* Roadmap */}
            <section
              style={{
                marginBottom: 20,
                padding: 16,
                borderRadius: 20,
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  marginBottom: 6,
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Quick revision roadmap
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  color: "#4b5563",
                  lineHeight: 1.6,
                }}
              >
                {content.roadmap}
              </p>
            </section>

            {/* Concepts */}
            <section style={{ marginBottom: 24 }}>
              <h2
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  marginBottom: 10,
                  color: "#111827",
                }}
              >
                Key concepts & ideas
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr)",
                  gap: 10,
                }}
              >
                {content.concepts.map((c) => {
                  const isHighlighted =
                    highlightedConceptName &&
                    c.title
                      .toLowerCase()
                      .includes(highlightedConceptName.toLowerCase());
                  return (
                    <article
                      key={c.id}
                      style={{
                        padding: 16,
                        borderRadius: 18,
                        border: isHighlighted
                          ? "1.5px solid #fb923c"
                          : "1px solid #e5e7eb",
                        background: isHighlighted
                          ? "linear-gradient(135deg,#fff7ed,#fffbeb)"
                          : "#ffffff",
                        boxShadow: isHighlighted
                          ? "0 10px 25px rgba(248,153,72,0.18)"
                          : "0 4px 12px rgba(15,23,42,0.04)",
                        transition: "box-shadow 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          marginBottom: 6,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          {c.title}
                        </h3>
                        <span
                          style={{
                            borderRadius: 999,
                            padding: "3px 8px",
                            fontSize: "0.7rem",
                            background: priorityColor[c.priority],
                          }}
                        >
                          {priorityLabel[c.priority]}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          marginBottom: 6,
                          fontSize: "0.85rem",
                          color: "#4b5563",
                        }}
                      >
                        {c.summary}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.8rem",
                          color: "#6b7280",
                        }}
                      >
                        <strong>Exam tip:</strong> {c.examTip}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Examples */}
            <section>
              <h2
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  marginBottom: 10,
                  color: "#111827",
                }}
              >
                Board-flavoured examples
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr)",
                  gap: 10,
                }}
              >
                {content.examples.map((ex) => (
                  <article
                    key={ex.id}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      border: "1px solid #e5e7eb",
                      background: "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#6b7280",
                        marginBottom: 4,
                      }}
                    >
                      {ex.label}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        marginBottom: 6,
                        fontSize: "0.9rem",
                        color: "#111827",
                      }}
                    >
                      {ex.question}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.8rem",
                        color: "#4b5563",
                      }}
                    >
                      <strong>Idea:</strong> {ex.idea}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </main>

          {/* Side column: mistakes etc. */}
          <aside>
            <section
              style={{
                marginBottom: 18,
                padding: 14,
                borderRadius: 18,
                border: "1px solid #e5e7eb",
                background:
                  "radial-gradient(circle at top left,#eff6ff,#ffffff)",
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
                Common mistakes to avoid
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  fontSize: "0.8rem",
                  color: "#4b5563",
                }}
              >
                {content.mistakes.map((m) => (
                  <li
                    key={m.id}
                    style={{
                      padding: 8,
                      borderRadius: 12,
                      background: "rgba(248,250,252,0.9)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 2,
                        color: "#111827",
                      }}
                    >
                      {m.title}
                    </div>
                    <div>
                      <span style={{ fontWeight: 500 }}>What goes wrong: </span>
                      {m.whatHappens}
                    </div>
                    <div>
                      <span style={{ fontWeight: 500 }}>Fix: </span>
                      {m.fix}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

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
                How to use this page
              </h3>
              <p style={{ margin: 0, marginBottom: 4 }}>
                1. Skim the roadmap once before solving PYQs or mocks.
              </p>
              <p style={{ margin: 0, marginBottom: 4 }}>
                2. For every wrong mock question, click{" "}
                <em>“Revise theory for this concept”</em> — it will bring you
                here with the related concept highlighted.
              </p>
              <p style={{ margin: 0 }}>
                3. Use the section chips above (A–E) to jump into{" "}
                <strong>Auto-mock paper</strong> and see how this topic shows up
                in each part of the board exam.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TopicHub;
