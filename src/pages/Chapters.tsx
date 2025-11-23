// src/pages/Chapters.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  class10MathTopicTrends as rawTrends,
  type Class10TopicKey,
} from "../data/class10MathTopicTrends";

// ---------- Local types ----------

type TierKey = "must-crack" | "high-roi" | "good-to-do";
type DifficultyKey = "Easy" | "Medium" | "Hard";
type SectionKey = "A" | "B" | "C" | "D";

type TopicKey = Class10TopicKey;

interface TopicConcept {
  name: string;
  sharePercent: number;
}

interface TopicTrend {
  topicKey: TopicKey;
  topicName: string;
  tier: TierKey;
  weightagePercent: number;
  concepts: TopicConcept[];
  summary?: string;
}

// ---------- Predictive meta overlay (from your JSON) ----------

const topicMetaByKey: Partial<
  Record<
    Class10TopicKey,
    { approxPaperPercent: number; tier: TierKey; summary: string }
  >
> = {
  "Real Numbers": {
    approxPaperPercent: 5,
    tier: "high-roi",
    summary:
      "1–2 direct MCQs or short answer questions. Mostly HCF/LCM, Euclid’s lemma and rational/irrational proofs; no long/case-based items in latest pattern.",
  },
  Polynomials: {
    approxPaperPercent: 5,
    tier: "high-roi",
    summary:
      "Quick-solve chapter on roots/zeroes, factor theorem and identities. Predominantly easy or moderate MCQs / Assertions – extremely high scoring.",
  },
  "Pair of Linear Equations": {
    approxPaperPercent: 11,
    tier: "must-crack",
    summary:
      "Consistently high-weightage. Covers algebraic methods, real-world problems and assertion/case-based items. Expect 2–3 questions with at least one application-flavoured.",
  },
  "Quadratic Equations": {
    approxPaperPercent: 7,
    tier: "must-crack",
    summary:
      "Medium-high probability of one moderate or long question. Focus oscillates between nature of roots, application problems and method/discriminant based assertions.",
  },
  "Arithmetic Progression": {
    approxPaperPercent: 7,
    tier: "high-roi",
    summary:
      "Standard nth-term, sum and word problems. Typically one MCQ plus one short/medium; almost always straightforward plug-and-play if formulas are solid.",
  },
  Triangles: {
    approxPaperPercent: 9,
    tier: "must-crack",
    summary:
      "Big geometry staple. Similarity, BPT, area ratios and Pythagoras often appear as proofs or tricky ratio questions, including assertion/case-based items.",
  },
  "Coordinate Geometry": {
    approxPaperPercent: 6,
    tier: "high-roi",
    summary:
      "Distance formula, section formula and area of triangle. Usually one solid question; very scoring once you standardise diagrams and substitution.",
  },
  Trigonometry: {
    approxPaperPercent: 10,
    tier: "must-crack",
    summary:
      "Top-slot for board marks: ratios, identities, and heights & distances. Mix of direct MCQs, simplifications and long real-world applications.",
  },
  Circles: {
    approxPaperPercent: 6,
    tier: "high-roi",
    summary:
      "Tangent theorems dominate: equal tangents, perpendicularity and segment arguments. Usually short/medium questions and occasional assertion type.",
  },
  "Areas Related to Circles": {
    approxPaperPercent: 4,
    tier: "good-to-do",
    summary:
      "One or two direct sector/segment area or composite figure questions. Almost never proof-based or truly long in the new pattern.",
  },
  "Surface Areas and Volumes": {
    approxPaperPercent: 8,
    tier: "high-roi",
    summary:
      "Cylinder/cone/sphere surface area & volume, combination of solids and water-level questions. At least one decent calculation question every year.",
  },
  Statistics: {
    approxPaperPercent: 11,
    tier: "must-crack",
    summary:
      "Guaranteed 2–3 questions: mean (step deviation), median, mode and ogive/graph interpretation. Frequently wrapped in real-life or data-study settings.",
  },
  Probability: {
    approxPaperPercent: 8,
    tier: "must-crack",
    summary:
      "1–2 direct calculation or small case-based questions on coins, dice, cards and simple word scenarios. Conceptually light but very high scoring.",
  },
};

// ---------- SAFE adapter from raw trends to TopicTrend[] ----------

interface RawTopicMeta {
  tier?: TierKey;
  weightagePercent?: number;
  conceptWeightage?: Record<string, number>;
}

interface RawTrendsShape {
  topics?: Record<string, RawTopicMeta>;
}

// IMPORTANT: derive tier using SAME logic as TrendsPage.tsx when
// predictive meta hasn’t specified a tier.
function deriveTier(weightagePercent: number, rawTier?: TierKey): TierKey {
  if (
    rawTier === "must-crack" ||
    rawTier === "high-roi" ||
    rawTier === "good-to-do"
  ) {
    return rawTier;
  }

  if (weightagePercent >= 9) return "must-crack";
  if (weightagePercent >= 7) return "high-roi";
  return "good-to-do";
}

function buildTopicsFromRaw(raw: unknown): TopicTrend[] {
  try {
    const anyRaw = raw as RawTrendsShape;
    const topicsObj = anyRaw?.topics ?? {};

    return Object.entries(topicsObj).map(([topicName, meta]) => {
      const safeMeta: RawTopicMeta = meta || {};

      const override =
        topicMetaByKey[topicName as Class10TopicKey] ?? undefined;

      const weightagePercent =
        override?.approxPaperPercent ??
        (typeof safeMeta.weightagePercent === "number"
          ? safeMeta.weightagePercent
          : 0);

      const tier: TierKey =
        override?.tier ?? deriveTier(weightagePercent, safeMeta.tier);

      const conceptWeights = safeMeta.conceptWeightage ?? {};
      const concepts: TopicConcept[] = Object.entries(conceptWeights).map(
        ([name, sharePercent]) => ({
          name,
          sharePercent: typeof sharePercent === "number" ? sharePercent : 0,
        })
      );

      return {
        topicKey: topicName as TopicKey,
        topicName,
        tier,
        weightagePercent,
        concepts,
        summary: override?.summary,
      };
    });
  } catch (e) {
    console.error("Failed to adapt class10MathTopicTrends:", e);
    return [];
  }
}

const class10Topics: TopicTrend[] = buildTopicsFromRaw(rawTrends);

// ---------- Difficulty + marks meta (kept local for now) ----------

const difficultyDistributionPercent: Record<DifficultyKey, number> = {
  Easy: 40,
  Medium: 40,
  Hard: 20,
};

const marksAllocation = [
  {
    section: "Section A",
    label: "MCQs/Objective, 1 mark",
    questions: 20,
  },
  {
    section: "Section B",
    label: "Very Short Answer, 2 marks",
    questions: 6,
  },
  {
    section: "Section C",
    label: "Short Answer, 3 marks",
    questions: 8,
  },
  {
    section: "Section D",
    label: "Long Answer, 4 marks",
    questions: 6,
  },
];

// ---------- Example question bank (placeholder for Phase 2) ----------

interface ExampleQuestion {
  id: string;
  yearLabel: string;
  marks: number;
  difficulty: DifficultyKey;
  section: SectionKey;
  prompt: string;
}

const exampleBank: Partial<
  Record<TopicKey, Record<string, ExampleQuestion[]>>
> = {
  // keep/extend later for mini examples
};

// ---------- Basket type + storage key ----------

type BasketItem = {
  id: string;
  topic: TopicKey;
  subtopic: string;
  difficulty: DifficultyKey;
  marks: number;
  yearLabel: string;
  section: SectionKey;
  prompt: string;
};

const MOCK_BASKET_KEY = "lazyTopperMockBasket_v1";

// ---------- Tier meta ----------

const tierOrder: TierKey[] = ["must-crack", "high-roi", "good-to-do"];

const tierMeta: Record<
  TierKey,
  { label: string; emoji: string; blurb: string }
> = {
  "must-crack": {
    label: "Must-crack",
    emoji: "🔥",
    blurb: "Exam staples. Finish these first.",
  },
  "high-roi": {
    label: "High-ROI",
    emoji: "🪙",
    blurb: "Super value topics for the time you invest.",
  },
  "good-to-do": {
    label: "Good to do",
    emoji: "🌈",
    blurb: "Do these once the big boys are done.",
  },
};

// ---------- Component ----------

const Chapters: React.FC = () => {
  const navigate = useNavigate();

  const [difficultyFilter, setDifficultyFilter] = useState<
    "All levels" | DifficultyKey
  >("All levels");
  const [activeTierFilter, setActiveTierFilter] = useState<"all" | TierKey>(
    "all"
  );

  const [openTier, setOpenTier] = useState<Record<TierKey, boolean>>({
    "must-crack": true,
    "high-roi": true,
    "good-to-do": true,
  });
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  const [modalTopic, setModalTopic] = useState<TopicKey | null>(null);
  const [modalConcept, setModalConcept] = useState<string | null>(null);

  const [basket, setBasket] = useState<BasketItem[]>([]);

  // load basket from localStorage once
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(MOCK_BASKET_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BasketItem[];
        if (Array.isArray(parsed)) {
          setBasket(parsed);
        }
      }
    } catch {
      // ignore bad JSON
    }
  }, []);

  const topicsByTier = useMemo(() => {
    const base: Record<TierKey, TopicTrend[]> = {
      "must-crack": [],
      "high-roi": [],
      "good-to-do": [],
    };

    (class10Topics || []).forEach((t) => {
      base[t.tier].push(t);
    });

    // Sort within each tier by descending weightage (heavier first)
    tierOrder.forEach((tier) => {
      base[tier].sort((a, b) => b.weightagePercent - a.weightagePercent);
    });

    return base;
  }, []);

  const handleConceptClick = (topicKey: TopicKey, conceptName: string) => {
    setModalTopic(topicKey);
    setModalConcept(conceptName);
  };

  const closeModal = () => {
    setModalTopic(null);
    setModalConcept(null);
  };

  const persistBasket = (items: BasketItem[]) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(MOCK_BASKET_KEY, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  };

  const handleAddToBasket = (
    topicKey: TopicKey,
    conceptName: string,
    ex: ExampleQuestion
  ) => {
    setBasket((prev: BasketItem[]) => {
      if (prev.some((b) => b.id === ex.id)) return prev; // avoid duplicates
      const next: BasketItem[] = [
        ...prev,
        {
          id: ex.id,
          topic: topicKey,
          subtopic: conceptName,
          difficulty: ex.difficulty,
          marks: ex.marks,
          yearLabel: ex.yearLabel,
          section: ex.section,
          prompt: ex.prompt,
        },
      ];
      persistBasket(next);
      return next;
    });
  };

  // AFTER
const handleOpenMockBuilder = () => {
  // keep saving the basket as you already do
  persistBasket(basket);
  // ✅ go to the new builder route
  navigate("/mock-builder");
};


  const difficultySummary = `Easy ${difficultyDistributionPercent["Easy"]}% • Medium ${difficultyDistributionPercent["Medium"]}% • Hard ${difficultyDistributionPercent["Hard"]}%`;

  const currentExamples: ExampleQuestion[] =
    modalTopic && modalConcept
      ? exampleBank[modalTopic]?.[modalConcept] ?? []
      : [];

  const totalBasketMarks = useMemo(
    () => basket.reduce((sum, item) => sum + (item.marks ?? 0), 0),
    [basket]
  );

  return (
    <div className="page-container">
      {/* Hero header – closer to earlier “Topic Hub” look */}
      <header
        className="page-header"
        style={{
          borderRadius: 28,
          padding: "20px 18px 22px",
          background:
            "linear-gradient(135deg,rgba(15,23,42,0.97),rgba(37,99,235,0.9))",
          color: "#e5e7eb",
          boxShadow: "0 22px 60px rgba(15,23,42,0.65)",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: "0.8rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            opacity: 0.9,
            marginBottom: 4,
          }}
        >
          Class 10 • Maths
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "2rem",
            lineHeight: 1.25,
          }}
        >
          Class 10 Maths Topic Hub
        </h1>
        <p
          style={{
            marginTop: 10,
            marginBottom: 10,
            fontSize: "0.95rem",
            maxWidth: 720,
          }}
        >
          Use the filters to see{" "}
          <strong>must-crack, high-ROI, and good-to-do</strong> chapters based
          on CBSE board trends and your predictive model. Tap any card to open
          its full concept notes, examples, and board tips.
        </p>
      </header>

      {/* Difficulty mix / exam blueprint strip – keep as is */}
      <section className="difficulty-section">
        <div className="difficulty-header">
          <h2>Difficulty mix</h2>
          <select
            value={difficultyFilter}
            onChange={(e) =>
              setDifficultyFilter(
                e.target.value as "All levels" | DifficultyKey
              )
            }
          >
            <option value="All levels">All levels</option>
            <option value="Easy">Easy focus</option>
            <option value="Medium">Medium focus</option>
            <option value="Hard">Hard / full rigour</option>
          </select>
        </div>

        <div className="difficulty-row">
          {(["Easy", "Medium", "Hard"] as DifficultyKey[]).map((level) => (
            <div
              key={level}
              className={
                "difficulty-chip" +
                (difficultyFilter === level ? " difficulty-chip--active" : "")
              }
            >
              <span className="difficulty-emoji">
                {level === "Easy" ? "🟢" : level === "Medium" ? "🟡" : "🔴"}
              </span>
              {level} {difficultyDistributionPercent[level]}%
            </div>
          ))}
        </div>

        <div className="marks-row">
          <span className="marks-label">Section wise vibe:</span>
          {marksAllocation.map((m) => (
            <span key={m.section} className="marks-chip">
              <strong>{m.section}</strong> ({m.label}, {m.questions} Qs)
            </span>
          ))}
        </div>
      </section>

      {/* Chapter & concept trends – Topic Hub style */}
      <section className="chapter-trends-card">
        <h2 className="section-title">
          Class 10 Maths — chapter & concept trends
        </h2>
        <p className="section-subtitle">
          Darker = heavier. Hit the 🔥 ones first, then the 🪙 ones. Chill with
          🌈 once the big boys are done.
        </p>

        {/* Tier pills */}
        <div className="tier-filter-row">
          <button
            className={
              "tier-pill" +
              (activeTierFilter === "all" ? " tier-pill--active" : "")
            }
            onClick={() => setActiveTierFilter("all")}
          >
            <span>👀 Show all</span>
          </button>
          {tierOrder.map((tier) => (
            <button
              key={tier}
              className={
                "tier-pill" +
                (activeTierFilter === tier ? " tier-pill--active" : "")
              }
              onClick={() => setActiveTierFilter(tier)}
            >
              <span>{tierMeta[tier].emoji}</span>
              <span>{tierMeta[tier].label}</span>
            </button>
          ))}
        </div>

        {/* Difficulty note */}
        <p className="section-subtitle">{difficultySummary}</p>

        {/* Tier accordion + topic cards (with summary + Open topic hub CTA) */}
        <div className="tier-accordion">
          {tierOrder.map((tier) => {
            if (activeTierFilter !== "all" && activeTierFilter !== tier) {
              return null;
            }

            const tierTopics = topicsByTier[tier];
            if (!tierTopics || tierTopics.length === 0) return null;

            const open = openTier[tier];

            return (
              <details
                key={tier}
                open={open}
                onToggle={(e) =>
                  setOpenTier((prev: Record<TierKey, boolean>) => ({
                    ...prev,
                    [tier]: (e.target as HTMLDetailsElement).open,
                  }))
                }
              >
                <summary className="tier-summary">
                  <div className="tier-summary-left">
                    <span className="tier-emoji">{tierMeta[tier].emoji}</span>
                    <div>
                      <div className="tier-summary-title">
                        {tierMeta[tier].label}
                      </div>
                      <div className="tier-summary-meta">
                        {tierTopics.length} topics • {tierMeta[tier].blurb}
                      </div>
                    </div>
                  </div>
                  <span>▾</span>
                </summary>

                <div className="topic-list">
                  {tierTopics.map((topic) => {
                    const isOpen = openTopic === topic.topicName;
                    return (
                      <div key={topic.topicName} className="topic-card">
                        <button
                          className="topic-header"
                          onClick={() =>
                            setOpenTopic((prev) =>
                              prev === topic.topicName ? null : topic.topicName
                            )
                          }
                        >
                          <div className="topic-main">
                            <div className="topic-title">
                              {topic.topicName}
                            </div>
                            <div className="topic-weightage">
                              ~{topic.weightagePercent}% of Maths marks
                            </div>
                          </div>
                          <div className="topic-meta">
                            <span className="topic-tier-pill">
                              {tierMeta[tier].emoji} {tierMeta[tier].label}
                            </span>
                            <span className="topic-toggle">
                              {isOpen ? "▴" : "▾"}
                            </span>
                          </div>
                        </button>

                        {/* NEW: short predictive summary line */}
                        {topic.summary && (
                          <p className="topic-summary">{topic.summary}</p>
                        )}

                        {/* CTA row – restores Open topic hub link */}
                        <div className="topic-cta-row">
                          <button
                            className="topic-quick-revise-btn"
                            onClick={() =>
                              navigate(
                                `/topics/${encodeURIComponent(topic.topicKey)}`
                              )
                            }
                          >
                            🔎 Open topic hub ↗
                          </button>
                        </div>

                        {isOpen && (
                          <div className="topic-body">
                            <div className="topic-body-label">
                              Most asked subtopics inside this chapter — click
                              to see examples (coming soon)
                            </div>
                            <ul className="concept-list">
                              {topic.concepts.map((concept) => (
                                <li
                                  key={concept.name}
                                  className="concept-item concept-item-clickable"
                                  onClick={() =>
                                    handleConceptClick(
                                      topic.topicKey,
                                      concept.name
                                    )
                                  }
                                >
                                  <span className="concept-name">
                                    {concept.name}
                                    <span className="concept-link-hint">
                                      {" "}
                                      · See examples
                                    </span>
                                  </span>
                                  <span className="concept-share">
                                    {concept.sharePercent}%
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {/* Next step / CTAs */}
      <section className="blueprint-preview">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "6px",
          }}
        >
          <h3 className="section-title">Next step — build your exam stack</h3>
          <p className="section-subtitle tiny">
            After scanning chapter & concept trends, jump into the tools below.
            One is a curated list of likely questions, the other is your
            printable mock paper builder.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "4px",
          }}
        >
          {/* HPQ button – primary pill */}
          <button
           className="chapter-secondary-cta exam-stack-btn-primary"
  style={{ flex: "1 1 180px", minWidth: 0 }}
  onClick={() => navigate("/highly-probable")}
>
  🎯 View highly probable questions
          </button>

          {/* Mock builder button – keeps existing style */}
          <button
           className="chapter-secondary-cta exam-stack-btn-secondary"
  style={{ flex: "1 1 180px", minWidth: 0 }}
  onClick={handleOpenMockBuilder}
>
  📄 Open mock builder
          </button>
        </div>

        {basket.length > 0 && (
          <p
            className="section-subtitle tiny"
            style={{ marginTop: "10px", color: "#6b7280" }}
          >
            You&apos;ve already saved <strong>{basket.length}</strong>{" "}
            questions ({totalBasketMarks} marks) to your mock basket. Open the
            mock builder to arrange them into a real paper.
          </p>
        )}
      </section>

      {/* Examples modal (for future mini examples) */}
      {modalTopic && modalConcept && (
        <div className="examples-modal-backdrop" onClick={closeModal}>
          <div className="examples-modal" onClick={(e) => e.stopPropagation()}>
            <div className="examples-modal-header">
              <div>
                <div className="examples-modal-label">
                  PYQ-style examples
                </div>
                <h3>
                  {modalTopic} — <span>{modalConcept}</span>
                </h3>
              </div>
              <button className="examples-close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>

            {currentExamples.length === 0 && (
              <p className="examples-empty">
                Examples for this subtopic are coming soon.
              </p>
            )}

            {currentExamples.length > 0 && (
              <ul className="examples-list">
                {currentExamples.map((ex) => (
                  <li key={ex.id} className="examples-item">
                    <div className="examples-meta">
                      <span className="examples-label">{ex.yearLabel}</span>
                      <span>{ex.marks} marks</span>
                      <span>Section {ex.section}</span>
                      <span
                        className={
                          ex.difficulty === "Easy"
                            ? "examples-diff-easy"
                            : ex.difficulty === "Medium"
                            ? "examples-diff-medium"
                            : "examples-diff-hard"
                        }
                      >
                        {ex.difficulty}
                      </span>
                    </div>
                    <div className="examples-text">{ex.prompt}</div>
                    <div
                      style={{
                        marginTop: 6,
                        textAlign: "right",
                      }}
                    >
                      <button
                        style={{
                          borderRadius: "999px",
                          border: "1px solid #d1d5db",
                          padding: "4px 10px",
                          fontSize: "0.75rem",
                          background: "#ffffff",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          handleAddToBasket(modalTopic, modalConcept, ex)
                        }
                      >
                        ➕ Send to mock paper
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chapters;
