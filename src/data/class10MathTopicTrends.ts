// src/data/class10MathTopicTrends.ts

// ----- Types inferred from the data -----
export type DifficultyKey = "Easy" | "Medium" | "Hard";

// Tier labels (aligned with TopicHub etc.)
export type TopicTier = "must-crack" | "high-roi" | "good-to-do";

// ---- Canonical subtopic keys (exported so other files can reuse) ----

// Pair of Linear Equations
export const PLE_SUBTOPIC_ALGEBRAIC = "Algebraic Solution Methods";
export const PLE_SUBTOPIC_WORD_APP = "Word & Application Problems";
export const PLE_SUBTOPIC_GRAPHICAL = "Graphical Solutions/Nature";

// Polynomials
export const POLY_SUBTOPIC_ZEROS = "Zeros & Factorisation";
export const POLY_SUBTOPIC_COEFF_ROOT = "Coefficient–root Relations";
export const POLY_SUBTOPIC_GRAPH_TYPE = "Graph & Type of Polynomial";

// Quadratic Equations
export const QE_SUBTOPIC_ALGEBRAIC = "Algebraic Solution";
export const QE_SUBTOPIC_NOR = "Nature of Roots (Discriminant)";
export const QE_SUBTOPIC_WORD_APP = "Word/Application Problems";

// Trigonometry
export const TRIG_SUBTOPIC_RATIOS = "Trig Ratios/Values";
export const TRIG_SUBTOPIC_IDENTITIES = "Trig Identities/Proofs";
export const TRIG_SUBTOPIC_APPLICATIONS = "Application/Heights & Distances";

// Triangles
export const TRI_SUBTOPIC_SIMILARITY = "Similarity Criteria";
export const TRI_SUBTOPIC_BPT = "BPT (Basic Proportionality Theorem)";
export const TRI_SUBTOPIC_AREA_RATIO = "Area Ratio in Similar Triangles";
export const TRI_SUBTOPIC_PYTH = "Pythagoras/Converse";

export const class10MathTopicTrends = {
  difficultyDistributionPercent: {
    Easy: 40,
    Medium: 40,
    Hard: 20,
  } as Record<DifficultyKey, number>,

  // Updated for CBSE 2026-style blueprint (80 marks total)
  // A: 20×1 = 20, B: 5×2 = 10, C: 6×3 = 18, D: 4×5 = 20, E: 3×4 = 12
  marksAllocation: {
    "Section A (MCQ/Assertion, 1 mark)": 20,
    "Section B (Short Answer, 2 marks)": 10,
    "Section C (Short Answer, 3 marks)": 18,
    "Section D (Long Answer, 5 marks)": 20,
    "Section E (Case-Based, 4 marks)": 12,
  } as Record<string, number>,

  topics: {
    "Real Numbers": {
      weightagePercent: 5,
      tier: "high-roi" as TopicTier,
      summary:
        "1–2 direct MCQs or short answer questions. Most focus on HCF/LCM, Euclid’s lemma, rational/irrational proofs. No long or case-based questions in latest pattern.",
      conceptWeightage: {
        "Euclid's Division Algorithm": 30,
        "Fundamental Theorem of Arithmetic": 30,
        "Irrational Numbers & Proofs": 25,
        "Decimal Expansions": 15,
      },
    },

    Polynomials: {
      weightagePercent: 5,
      tier: "high-roi" as TopicTier,
      summary:
        "Quick-solve chapter: roots/zeroes, factor theorem, identities. Frequently tested with easy or moderate MCQs/Assertions. All marks from rapid recall/problem manipulation.",
      conceptWeightage: {
        [POLY_SUBTOPIC_COEFF_ROOT]: 45,
        [POLY_SUBTOPIC_ZEROS]: 35,
        [POLY_SUBTOPIC_GRAPH_TYPE]: 20,
      },
    },

    "Pair of Linear Equations": {
      weightagePercent: 11,
      tier: "must-crack" as TopicTier,
      summary:
        "Consistently high weighted; covers algebraic solution methods (elimination, substitution, cross-multiplication), real-world problems, and assertion/case-based scenarios. 2–3 items per paper, often at least one application or tough scenario.",
      conceptWeightage: {
        [PLE_SUBTOPIC_ALGEBRAIC]: 40,
        [PLE_SUBTOPIC_WORD_APP]: 35,
        [PLE_SUBTOPIC_GRAPHICAL]: 25,
      },
    },

    "Quadratic Equations": {
      weightagePercent: 7,
      tier: "must-crack" as TopicTier,
      summary:
        "Medium-high probability of one moderate-to-long question. Focus shifts between nature of roots, application problems, and assertion on solution methods/discriminant.",
      conceptWeightage: {
        [QE_SUBTOPIC_ALGEBRAIC]: 40,
        [QE_SUBTOPIC_NOR]: 30,
        [QE_SUBTOPIC_WORD_APP]: 30,
      },
    },

    "Arithmetic Progression": {
      weightagePercent: 7,
      tier: "high-roi" as TopicTier,
      summary:
        "Standard Nth term, sum, word problems. Most answers are point-and-plug or two-step applications. Expect one MCQ and one short/medium, rarely tough.",
      conceptWeightage: {
        "nth Term": 35,
        "Sum of n Terms": 35,
        "Application Problems": 30,
      },
    },

    Triangles: {
      weightagePercent: 9,
      tier: "must-crack" as TopicTier,
      summary:
        "Frequently appears as a proof or ratio question. BPT, similarity, area ratio, and challenging assertion/case-based geometry seen in every paper.",
      conceptWeightage: {
        [TRI_SUBTOPIC_SIMILARITY]: 35,
        [TRI_SUBTOPIC_BPT]: 30,
        [TRI_SUBTOPIC_AREA_RATIO]: 20,
        [TRI_SUBTOPIC_PYTH]: 15,
      },
    },

    "Coordinate Geometry": {
      weightagePercent: 6,
      tier: "high-roi" as TopicTier,
      summary:
        "Always at least one distance/area question; sometimes in MCQ/Section A. High scoring if standard formulas are mastered.",
      conceptWeightage: {
        "Distance Formula": 40,
        "Section Formula": 35,
        "Area of Triangle": 25,
      },
    },

    Trigonometry: {
      weightagePercent: 10,
      tier: "must-crack" as TopicTier,
      summary:
        "Top slot for board marks; ratios, identities, heights/distances, and case study real-world questions. Mixture of direct MCQ, calculation, and long application.",
      conceptWeightage: {
        [TRIG_SUBTOPIC_RATIOS]: 35,
        [TRIG_SUBTOPIC_IDENTITIES]: 35,
        [TRIG_SUBTOPIC_APPLICATIONS]: 30,
      },
    },

    Circles: {
      weightagePercent: 6,
      tier: "high-roi" as TopicTier,
      summary:
        "Focus on tangent theorems (equal length, perpendicularity, circle-segment arguments). Normally short/medium, proofs or scenario MCQ.",
      conceptWeightage: {
        "Tangent Properties": 45,
        "Tangent Theorems & Proofs": 35,
        "Number/Type of Tangents": 20,
      },
    },

    // Not in your updated list, but kept with lower weight as per recent trends
    Constructions: {
      weightagePercent: 3,
      tier: "good-to-do" as TopicTier,
      summary:
        "Occasional 2–3 mark procedural question: divide a line segment, draw tangents, or construct a similar triangle. Useful but lower priority than must-crack algebra/geometry.",
      conceptWeightage: {
        "Divide Segment": 40,
        "Construct Tangent": 35,
        "Similar Triangle": 25,
      },
    },

    "Areas Related to Circles": {
      weightagePercent: 4,
      tier: "good-to-do" as TopicTier,
      summary:
        "Only one or two direct application MCQ/shorts. Expect sector/segment area or practical area Q. No proof/longs in new pattern.",
      conceptWeightage: {
        "Sectors and Segments": 65,
        "Composite Figures": 35,
      },
    },

    "Surface Areas and Volumes": {
      weightagePercent: 8,
      tier: "high-roi" as TopicTier,
      summary:
        "Solid geometry: standard computation questions, surface area, volume, converting forms, water-level rising, etc. At least one calculation/medium Q, rarely tough.",
      conceptWeightage: {
        "Cylinder/Cone/Sphere": 60,
        "Combination/Transformation": 30,
        Frustum: 10,
      },
    },

    Statistics: {
      weightagePercent: 11,
      tier: "must-crack" as TopicTier,
      summary:
        "Guaranteed 2–3 items per paper. Mean (step deviation, grouped), median (graphical), mode, or ogive/graph interpretation. Often has a real-life or data-study axis.",
      conceptWeightage: {
        "Mean (Step Deviation)": 35,
        "Median of Grouped Data": 30,
        "Mode of Grouped Data": 25,
        "Graph/Ogive": 10,
      },
    },

    Probability: {
      weightagePercent: 8,
      tier: "must-crack" as TopicTier,
      summary:
        "Always 1–2 direct calculation or scenario MCQs (cards, coins, dice), sometimes case-based with hidden outcomes or complement-probability. Almost never a tough/long question.",
      conceptWeightage: {
        "Single Event Probability": 65,
        "Combined/Word Problem Probability": 35,
      },
    },
  },
} as const;

// Inferred types from the constant above
export type Class10MathTopicTrendsData = typeof class10MathTopicTrends;
export type Class10TopicKey = keyof Class10MathTopicTrendsData["topics"];

// ---- Normalized list for easy linking across the app ----

export interface TopicTrendEntry {
  topicKey: Class10TopicKey; // e.g. "Pair of Linear Equations"
  weightagePercent: number;
  tier?: TopicTier;
  summary?: string;
  conceptWeightage: Record<string, number>;
}

/**
 * Array form of topic trends, useful for mapping in UI and for
 * linking with content JSON by topicKey.
 */
export const class10TopicTrendList: TopicTrendEntry[] = Object.entries(
  class10MathTopicTrends.topics
).map(([key, value]) => ({
  topicKey: key as Class10TopicKey,
  weightagePercent: value.weightagePercent,
  tier: (value as any).tier,
  summary: (value as any).summary,
  conceptWeightage: value.conceptWeightage,
}));
