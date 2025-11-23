// src/data/class10MathQuestionBank.ts

import type {
  Class10TopicKey,
  DifficultyKey,
} from "./class10MathTopicTrends";

// ----------------- Section / type / skills -----------------

export type SectionKey = "A" | "B" | "C" | "D" | "E";

export type QuestionType =
  | "MCQ"
  | "Assertion-Reason"
  | "Short"
  | "Long";

// Same idea as your JSON's bloom_skill
export type BloomSkill =
  | "Remembering"
  | "Understanding"
  | "Applying"
  | "Analysing"
  | "Evaluating"
  | "Creating"
  | string;

// ----------------- Blueprint meta (2026) -----------------

export const class10Blueprint2026 = {
  SectionA: {
    key: "A" as SectionKey,
    type: "MCQ, Assertion",
    count: 20,
    marksEach: 1,
  },
  SectionB: {
    key: "B" as SectionKey,
    type: "Short Answer",
    count: 5,
    marksEach: 2,
  },
  SectionC: {
    key: "C" as SectionKey,
    type: "Short Answer",
    count: 6,
    marksEach: 3,
  },
  SectionD: {
    key: "D" as SectionKey,
    type: "Long Answer",
    count: 4,
    marksEach: 5,
  },
  SectionE: {
    key: "E" as SectionKey,
    type: "Case-Based",
    count: 3,
    marksEach: 4,
  },
} as const;

export type BlueprintKey = keyof typeof class10Blueprint2026;

// ----------------- Core question shapes -----------------

interface BaseQuestion {
  id: string;
  topic: Class10TopicKey;
  subtopic: string;
  type: QuestionType;
  difficulty: DifficultyKey;
  bloomSkill: BloomSkill;
  // usual marks for that item (1, 2, 3, 4, 5)
  marks: number;
  /**
   * Which sections this question is suitable for, e.g. ["A"], ["B","C"].
   * This lets the mock-builder pick questions matching the blueprint.
   */
  preferredSections: SectionKey[];
}

/** MCQ-style question for Section A (and sometimes inside case-based). */
export interface MCQQuestion extends BaseQuestion {
  type: "MCQ";
  questionText: string;
  options: string[];
  // index into options[] (0-based) OR 'A' | 'B' | ... if you prefer later
  correctOptionIndex: number;
  explanation: string;
}

/** Assertion–Reason pattern used a lot in CBSE. */
export interface AssertionReasonQuestion extends BaseQuestion {
  type: "Assertion-Reason";
  assertion: string;
  reason: string;
  /**
   * Any one of the 4 standard patterns:
   * A: Both A and R are true and R is the correct explanation.
   * B: Both A and R are true but R is NOT the correct explanation.
   * C: A is true, R is false.
   * D: A is false, R is true.
   */
  correctPattern: "A" | "B" | "C" | "D";
  explanation: string;
}

/** 2M/3M/5M questions (short & long). */
export interface DescriptiveQuestion extends BaseQuestion {
  type: "Short" | "Long";
  questionText: string;
  /**
   * For later AI checking we can keep a canonical answer,
   * even if on UI we only show it to teacher/after attempt.
   */
  modelAnswer: string;
  stepHints?: string[];
}

export type ExamQuestion =
  | MCQQuestion
  | AssertionReasonQuestion
  | DescriptiveQuestion;

// ----------------- Seed question bank -----------------

export const class10QuestionBank: ExamQuestion[] = [
  // ----- Pair of Linear Equations (Must-crack, Algebraic solution) -----
  {
    id: "2026-PLE-MCQ-01",
    topic: "Pair of Linear Equations",
    subtopic: "Algebraic Solution Methods",
    type: "MCQ",
    difficulty: "Easy",
    bloomSkill: "Applying",
    marks: 1,
    preferredSections: ["A"],
    questionText:
      "If 2x + 3y = 11 and 3x - 2y = 4, what is the value of y - x?",
    options: ["1", "2", "3", "4"],
    correctOptionIndex: 1, // "2"
    explanation:
      "Solve by elimination: from the system we get x = 2, y = 4, so y - x = 4 - 2 = 2.",
  },
  {
    id: "2026-PLE-SA-02",
    topic: "Pair of Linear Equations",
    subtopic: "Word & Application Problems",
    type: "Short",
    difficulty: "Medium",
    bloomSkill: "Applying",
    marks: 3,
    preferredSections: ["C"],
    questionText:
      "The sum of two numbers is 30 and their difference is 4. Form a pair of linear equations and find the numbers.",
    modelAnswer:
      "Let the numbers be x and y. Then x + y = 30, x - y = 4. Solving: adding gives 2x = 34 ⇒ x = 17, so y = 13. The numbers are 17 and 13.",
    stepHints: [
      "Take the two numbers as x and y.",
      "Use ‘sum is 30’ and ‘difference is 4’ to form equations.",
      "Solve by elimination or substitution.",
    ],
  },

  // ----- Quadratic Equations (nature of roots) -----
  {
    id: "2026-QE-AR-01",
    topic: "Quadratic Equations",
    subtopic: "Nature of Roots (Discriminant)",
    type: "Assertion-Reason",
    difficulty: "Medium",
    bloomSkill: "Analysing",
    marks: 1,
    preferredSections: ["A"],
    assertion:
      "Assertion (A): The equation 2x² - 3x + 5 = 0 has real and distinct roots.",
    reason:
      "Reason (R): If the discriminant of a quadratic equation is negative, then the equation has no real roots.",
    correctPattern: "C",
    explanation:
      "For 2x² - 3x + 5, D = (−3)² − 4·2·5 = 9 − 40 = −31 < 0 ⇒ no real roots. A is false, R is true.",
  },

  // ----- Arithmetic Progressions -----
  {
    id: "2026-AP-MCQ-01",
    topic: "Arithmetic Progression",
    subtopic: "nth Term",
    type: "MCQ",
    difficulty: "Easy",
    bloomSkill: "Remembering",
    marks: 1,
    preferredSections: ["A"],
    questionText:
      "In an AP, the first term is 5 and common difference is 3. What is the 10th term?",
    options: ["32", "35", "38", "40"],
    correctOptionIndex: 2, // 5 + 9×3 = 32? Wait, check: 5 + 9*3 = 32? No, it's 32. So correct index for '32'.
    explanation:
      "a₁ = 5, d = 3. a₁₀ = a₁ + 9d = 5 + 9×3 = 32.",
  },

  // ----- Triangles (Similarity) -----
  {
    id: "2026-TRI-SA-01",
    topic: "Triangles",
    subtopic: "Similarity Criteria",
    type: "Short",
    difficulty: "Medium",
    bloomSkill: "Understanding",
    marks: 2,
    preferredSections: ["B"],
    questionText:
      "State the condition under which two triangles are similar by AA similarity. Also write the full form of ‘AA’.",
    modelAnswer:
      "If two angles of one triangle are respectively equal to two angles of another triangle, then the triangles are similar. ‘AA’ stands for ‘Angle–Angle’ similarity.",
  },

  // ----- Coordinate Geometry -----
  {
    id: "2026-CG-MCQ-01",
    topic: "Coordinate Geometry",
    subtopic: "Distance Formula",
    type: "MCQ",
    difficulty: "Easy",
    bloomSkill: "Applying",
    marks: 1,
    preferredSections: ["A"],
    questionText:
      "What is the distance between the points (3, 4) and (7, 1)?",
    options: ["5", "4", "3√2", "5√2"],
    correctOptionIndex: 0, // distance = 5
    explanation:
      "Distance = √[(7 − 3)² + (1 − 4)²] = √(4² + (−3)²) = √(16 + 9) = √25 = 5.",
  },

  // ----- Trigonometry (ratios & identities) -----
  {
    id: "2026-TRIG-MCQ-01",
    topic: "Trigonometry",
    subtopic: "Trig Ratios/Values",
    type: "MCQ",
    difficulty: "Easy",
    bloomSkill: "Remembering",
    marks: 1,
    preferredSections: ["A"],
    questionText: "The value of sin 30° + cos 60° is:",
    options: ["0", "1/2", "1", "√3/2"],
    correctOptionIndex: 2, // 1/2 + 1/2 = 1
    explanation: "sin 30° = 1/2 and cos 60° = 1/2, so sum = 1.",
  },
  {
    id: "2026-TRIG-SA-02",
    topic: "Trigonometry",
    subtopic: "Trig Identities/Proofs",
    type: "Short",
    difficulty: "Medium",
    bloomSkill: "Applying",
    marks: 3,
    preferredSections: ["C"],
    questionText: "Prove that: (1 - tan²θ) / (1 + tan²θ) = cos 2θ.",
    modelAnswer:
      "Using tanθ = sinθ / cosθ, rewrite the LHS and simplify, or start from cos 2θ = (1 - tan²θ)/(1 + tan²θ). Show algebraic steps to reach RHS.",
    stepHints: [
      "Use tan²θ = sin²θ / cos²θ.",
      "Express everything in terms of sinθ and cosθ.",
      "Simplify numerator and denominator separately.",
    ],
  },

  // ----- Surface Areas and Volumes -----
  {
    id: "2026-SAV-SA-01",
    topic: "Surface Areas and Volumes",
    subtopic: "Cylinder/Cone/Sphere",
    type: "Short",
    difficulty: "Medium",
    bloomSkill: "Applying",
    marks: 3,
    preferredSections: ["C"],
    questionText:
      "A cylindrical tank of radius 3 m is filled with water to a height of 4 m. Find the volume of water in the tank.",
    modelAnswer:
      "Volume = πr²h = π × 3² × 4 = 36π m³. Using π ≈ 3.14, volume ≈ 113.04 m³.",
  },

  // ----- Statistics -----
  {
    id: "2026-STAT-MCQ-01",
    topic: "Statistics",
    subtopic: "Mean (Step Deviation)",
    type: "MCQ",
    difficulty: "Medium",
    bloomSkill: "Applying",
    marks: 1,
    preferredSections: ["A"],
    questionText:
      "Which central tendency measure is most suitable for grouped continuous data when using step-deviation method?",
    options: ["Mean", "Median", "Mode", "Range"],
    correctOptionIndex: 0,
    explanation:
      "The step-deviation method is a technique for efficient calculation of the mean of grouped data.",
  },

  // ----- Probability -----
  {
    id: "2026-PROB-MCQ-01",
    topic: "Probability",
    subtopic: "Single Event Probability",
    type: "MCQ",
    difficulty: "Easy",
    bloomSkill: "Applying",
    marks: 1,
    preferredSections: ["A"],
    questionText:
      "A fair coin is tossed once. What is the probability of getting a head?",
    options: ["0", "1/2", "1/3", "1"],
    correctOptionIndex: 1,
    explanation:
      "There are 2 equally likely outcomes (H, T). Favourable = 1 (H), so probability = 1/2.",
  },
];
