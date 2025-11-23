// src/data/class10MathMicroMocks.ts
import type { Class10TopicKey } from "./class10MathTopicTrends";

// Difficulty buckets for LazyTopper philosophy
export type Difficulty = 1 | 2 | 3; // 1 = warm-up, 2 = exam-core, 3 = challenge

export interface MockQuestion {
  id: string;
  topicKey: Class10TopicKey;
  subtopicKey?: string; // should match the keys used in TopicHub subtopics
  difficulty: Difficulty;
  marks: number;

  // Question statement (plain text for now; later we can support rich/LaTeX)
  stem: string;

  // For now we’ll keep everything as “typed answer or notebook answer”.
  // Later we can add MCQ options cleanly.
  expectedAnswerSketch?: string; // how the *final answer* roughly looks
  answerFormatHint?: string; // e.g. “Write ordered pair (x, y)”

  // Socratic-style hints: show these one-by-one when student clicks “Hint #1 / #2…”
  hintSteps: string[];

  // Full marking-scheme style solution
  solutionSteps: string[];

  finalAnswer?: string;

  // Tagging for future analytics / smart mixes
  examTag?: string; // "CBSE 2022 Q5", "Sample Paper", etc.
  conceptTags?: string[]; // e.g. ["elimination", "condition-for-consistency"]
}

// --- Question bank organised by topic ---

export interface TopicMockPack {
  topicKey: Class10TopicKey;
  questions: MockQuestion[];
}

export const class10MathMicroMocks: TopicMockPack[] = [
  // 🔥 Pair of Linear Equations
  {
    topicKey: "Pair of Linear Equations",
    questions: [
      {
        id: "ple-easy-1-elimination",
        topicKey: "Pair of Linear Equations",
        subtopicKey: "Algebraic Solution Methods",
        difficulty: 1,
        marks: 2,
        stem: "Solve the pair of equations: 3x + 2y = 16 and x − y = 1.",
        expectedAnswerSketch: "(x, y) as an ordered pair",
        answerFormatHint: "Write your final answer as (x, y).",
        hintSteps: [
          "First, express both equations clearly and label them (1) and (2).",
          "From equation (2), try to express x in terms of y or y in terms of x.",
          "Substitute this expression into equation (1) and solve for the remaining variable.",
          "Back-substitute to find the other variable and then write the ordered pair.",
        ],
        solutionSteps: [
          "Given: (1) 3x + 2y = 16, (2) x − y = 1.",
          "From (2): x = 1 + y.",
          "Substitute in (1): 3(1 + y) + 2y = 16 ⇒ 3 + 3y + 2y = 16 ⇒ 5y = 13.",
          "So y = 13/5.",
          "Then x = 1 + y = 1 + 13/5 = 18/5.",
          "Hence, the solution is (x, y) = (18/5, 13/5).",
        ],
        finalAnswer: "(18/5, 13/5)",
        examTag: "Concept-check • Elimination via substitution",
        conceptTags: ["substitution", "ordered-pair"],
      },
      {
        id: "ple-core-2-consistency",
        topicKey: "Pair of Linear Equations",
        subtopicKey: "Graphical Solutions/Nature",
        difficulty: 2,
        marks: 3,
        stem: "Without solving, check whether the pair of equations 2x − 5y + 3 = 0 and 4x − 10y + 12 = 0 has a unique solution, no solution or infinitely many solutions.",
        expectedAnswerSketch: "Statement about nature of solution",
        answerFormatHint:
          "Mention the ratio test and clearly state 'unique', 'no', or 'infinitely many' solutions.",
        hintSteps: [
          "Identify a₁, b₁, c₁ from the first equation and a₂, b₂, c₂ from the second equation.",
          "Recall the ratio condition: compare a₁/a₂, b₁/b₂ and c₁/c₂.",
          "If a₁/a₂ = b₁/b₂ = c₁/c₂, lines are coincident (infinitely many solutions).",
          "If a₁/a₂ = b₁/b₂ ≠ c₁/c₂, lines are parallel (no solution).",
          "If a₁/a₂ ≠ b₁/b₂, there is a unique solution.",
        ],
        solutionSteps: [
          "First equation: 2x − 5y + 3 = 0 ⇒ a₁ = 2, b₁ = −5, c₁ = 3.",
          "Second equation: 4x − 10y + 12 = 0 ⇒ a₂ = 4, b₂ = −10, c₂ = 12.",
          "Compute ratios: a₁/a₂ = 2/4 = 1/2, b₁/b₂ = (−5)/(−10) = 1/2, c₁/c₂ = 3/12 = 1/4.",
          "We see a₁/a₂ = b₁/b₂ but this is not equal to c₁/c₂.",
          "Condition a₁/a₂ = b₁/b₂ ≠ c₁/c₂ tells us: the lines are parallel and distinct.",
          "Therefore, the pair has no solution.",
        ],
        finalAnswer: "No solution (parallel distinct lines).",
        examTag: "PYQ-style • nature-of-solutions",
        conceptTags: ["ratio-test", "graphical-interpretation"],
      },
      {
        id: "ple-core-3-word-age",
        topicKey: "Pair of Linear Equations",
        subtopicKey: "Word & Application Problems",
        difficulty: 2,
        marks: 4,
        stem: "The sum of the ages of a father and his son is 50 years. After 10 years, the father's age will be twice the son's age. Find their present ages.",
        expectedAnswerSketch: "father age, son age",
        answerFormatHint: "Write: 'Present age of father = … years, son = … years'.",
        hintSteps: [
          "Let the son's present age be x years. Express the father's present age in terms of x using the first condition.",
          "Translate 'after 10 years' carefully for both ages.",
          "Form the second equation using 'father's age will be twice the son's age'.",
          "You now have two linear equations in x. Solve them using elimination/substitution.",
        ],
        solutionSteps: [
          "Let the son's present age be x years.",
          "Then the father's present age = 50 − x years.   (from the first condition)",
          "After 10 years: son's age = x + 10, father's age = 50 − x + 10 = 60 − x.",
          "Given: after 10 years, father's age will be twice the son's age:",
          "⇒ 60 − x = 2(x + 10).",
          "Solve: 60 − x = 2x + 20 ⇒ 60 − 20 = 2x + x ⇒ 40 = 3x ⇒ x = 40/3 ≈ 13⅓.",
          "So son's present age = 40/3 years and father's present age = 50 − 40/3 = 110/3 years.",
          "We can keep the fractional form or write ≈ 13⅓ years and 36⅔ years.",
        ],
        finalAnswer:
          "Son ≈ 13⅓ years, Father ≈ 36⅔ years (exact: 40/3 and 110/3 years).",
        examTag: "Story • age-based linear equations",
        conceptTags: ["word-problem", "variable-definition", "equations-from-story"],
      },
    ],
  },

  // 🔹 Quadratic Equations
  {
    topicKey: "Quadratic Equations",
    questions: [
      {
        id: "qe-easy-1-factor",
        topicKey: "Quadratic Equations",
        subtopicKey: "Algebraic Solution",
        difficulty: 1,
        marks: 2,
        stem: "Solve the quadratic equation x² − 7x + 12 = 0 by factorisation.",
        expectedAnswerSketch: "Two simple integer roots",
        answerFormatHint: "List both roots separated by comma.",
        hintSteps: [
          "Compare with ax² + bx + c = 0 and identify a, b, c.",
          "Find two numbers whose product is c (= 12) and sum is b (= −7).",
          "Split the middle term using these two numbers and then group the terms.",
          "Factorise and equate each factor to zero to get the roots.",
        ],
        solutionSteps: [
          "Given x² − 7x + 12 = 0 ⇒ a = 1, b = −7, c = 12.",
          "We need two numbers with product 12 and sum −7. The pair is (−3, −4).",
          "Split the middle term: x² − 3x − 4x + 12 = 0.",
          "Group: x(x − 3) − 4(x − 3) = 0.",
          "Factorise: (x − 3)(x − 4) = 0.",
          "Thus x − 3 = 0 or x − 4 = 0 ⇒ x = 3 or x = 4.",
        ],
        finalAnswer: "x = 3, 4",
        examTag: "Warm-up • factorisation",
        conceptTags: ["factorisation", "middle-term-splitting"],
      },
      {
        id: "qe-core-2-discriminant-nature",
        topicKey: "Quadratic Equations",
        subtopicKey: "Nature of Roots (Discriminant)",
        difficulty: 2,
        marks: 3,
        stem: "Find the nature of the roots of the quadratic equation 5x² + 2x + 1 = 0. Hence, comment whether its roots are real or not.",
        expectedAnswerSketch: "Statement using discriminant",
        answerFormatHint: "Compute discriminant clearly; then state nature in words.",
        hintSteps: [
          "Identify a, b and c for the given equation.",
          "Write the formula for the discriminant D = b² − 4ac.",
          "Substitute values carefully, especially signs, and simplify.",
          "Use the sign of D to state the nature of roots: D > 0, D = 0 or D < 0.",
        ],
        solutionSteps: [
          "For 5x² + 2x + 1 = 0, we have a = 5, b = 2, c = 1.",
          "Discriminant D = b² − 4ac = 2² − 4·5·1 = 4 − 20 = −16.",
          "Here D < 0, so the quadratic equation has no real roots.",
          "The roots are non-real complex numbers.",
        ],
        finalAnswer: "No real roots (D = −16 < 0).",
        examTag: "Concept • discriminant-sign",
        conceptTags: ["discriminant", "nature-of-roots"],
      },
      {
        id: "qe-core-3-k-equal-roots",
        topicKey: "Quadratic Equations",
        subtopicKey: "Nature of Roots (Discriminant)",
        difficulty: 3,
        marks: 4,
        stem: "For what value(s) of k does the quadratic equation 2x² + kx + 8 = 0 have equal roots?",
        expectedAnswerSketch: "One or two k values from a smaller quadratic",
        answerFormatHint:
          "Use D = 0 condition. Your final answer should be value(s) of k.",
        hintSteps: [
          "Identify a, b, c in terms of k for the given equation.",
          "For equal roots, discriminant D must be zero.",
          "Write D = b² − 4ac in terms of k and set it equal to zero.",
          "Solve the resulting quadratic equation in k.",
        ],
        solutionSteps: [
          "Given 2x² + kx + 8 = 0 ⇒ a = 2, b = k, c = 8.",
          "For equal roots, discriminant D = 0.",
          "Compute D: D = b² − 4ac = k² − 4·2·8 = k² − 64.",
          "Set D = 0 ⇒ k² − 64 = 0.",
          "Solve: k² = 64 ⇒ k = ±8.",
          "Therefore, the quadratic equation has equal roots when k = 8 or k = −8.",
        ],
        finalAnswer: "k = 8 or k = −8",
        examTag: "Board-type • parameter condition",
        conceptTags: ["parameter-k", "equal-roots", "discriminant=0"],
      },
    ],
  },

  // 🔸 Trigonometry
  {
    topicKey: "Trigonometry",
    questions: [
      {
        id: "trig-easy-1-standard-value",
        topicKey: "Trigonometry",
        subtopicKey: "Trig Ratios/Values",
        difficulty: 1,
        marks: 1,
        stem: "Find the value of sin 30° + cos 60°.",
        expectedAnswerSketch: "Simple rational number",
        answerFormatHint: "Use the standard trig values for 30° and 60°.",
        hintSteps: [
          "Recall the standard values: sin 30° and cos 60°.",
          "Write them as fractions, not decimals.",
          "Add the two fractions carefully.",
        ],
        solutionSteps: [
          "We know sin 30° = 1/2 and cos 60° = 1/2.",
          "So sin 30° + cos 60° = 1/2 + 1/2 = 1.",
        ],
        finalAnswer: "1",
        examTag: "1-marker • standard-values",
        conceptTags: ["standard-values", "sin-cos-table"],
      },
      {
        id: "trig-core-2-identity-proof",
        topicKey: "Trigonometry",
        subtopicKey: "Trig Identities/Proofs",
        difficulty: 2,
        marks: 3,
        stem: "Prove that (1 − cos²θ) / sin²θ = 1 for all angles θ where the expression is defined.",
        expectedAnswerSketch: "Identity proof using sin²θ + cos²θ = 1",
        answerFormatHint:
          "Work from LHS and use the identity sin²θ + cos²θ = 1.",
        hintSteps: [
          "Start with the left-hand side (LHS).",
          "Recall that sin²θ + cos²θ = 1 ⇒ 1 − cos²θ = sin²θ.",
          "Substitute sin²θ for (1 − cos²θ) in the numerator.",
          "Simplify the resulting fraction.",
        ],
        solutionSteps: [
          "LHS = (1 − cos²θ) / sin²θ.",
          "Using the identity sin²θ + cos²θ = 1 ⇒ 1 − cos²θ = sin²θ.",
          "So LHS = sin²θ / sin²θ.",
          "LHS = 1, which is equal to RHS.",
          "Hence proved.",
        ],
        finalAnswer: "LHS = RHS = 1 (identity proved).",
        examTag: "Identity • sin²+cos²=1",
        conceptTags: ["identity-proof", "Pythagorean-identities"],
      },
      {
        id: "trig-core-3-heights-dist",
        topicKey: "Trigonometry",
        subtopicKey: "Application/Heights & Distances",
        difficulty: 2,
        marks: 4,
        stem: "A tower stands on a level ground. From a point 50 m away from the foot of the tower, the angle of elevation of its top is 30°. Find the height of the tower. (Take √3 ≈ 1.732).",
        expectedAnswerSketch: "Height in metres rounded to one decimal",
        answerFormatHint: "Use tan θ = opposite/adjacent.",
        hintSteps: [
          "Draw a right-angled triangle with the tower as vertical side and the ground as horizontal side.",
          "Label the height of the tower as h, the horizontal distance from the point to the foot of the tower as 50 m, and the angle at the point as 30°.",
          "Use tan 30° = h / 50.",
          "Substitute the value of tan 30° and solve for h.",
        ],
        solutionSteps: [
          "Let the height of the tower be h metres.",
          "From the point on the ground, distance from the foot of the tower is 50 m and angle of elevation is 30°.",
          "In the right triangle, tan 30° = (opposite side) / (adjacent side) = h / 50.",
          "We know tan 30° = 1/√3.",
          "So 1/√3 = h / 50 ⇒ h = 50 / √3.",
          "Rationalise: h = (50√3) / 3.",
          "Using √3 ≈ 1.732, h ≈ (50 × 1.732)/3 ≈ 86.6/3 ≈ 28.9 m (approx).",
        ],
        finalAnswer: "Height of tower ≈ 28.9 m.",
        examTag: "Application • heights-distances",
        conceptTags: ["tan-ratio", "diagram", "angle-of-elevation"],
      },
    ],
  },
];

// --- Helper: pick a mini-mock set for a topic ---

export interface MiniMockOptions {
  topicKey: Class10TopicKey;
  totalQuestions?: number; // default 10
  // later we can add difficulty mix, etc.
}

export function buildMiniMockForTopic(
  options: MiniMockOptions
): MockQuestion[] {
  const { topicKey, totalQuestions = 10 } = options;
  const pack = class10MathMicroMocks.find(
    (p) => p.topicKey === topicKey
  );

  if (!pack) return [];

  // Simple strategy for now: take first N questions.
  // Later we can randomise and enforce a warm-up/core/challenge mix.
  return pack.questions.slice(0, totalQuestions);
}
