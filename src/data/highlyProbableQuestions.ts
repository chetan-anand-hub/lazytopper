// src/data/highlyProbableQuestions.ts
import type { Class10TopicKey } from "./class10MathTopicTrends";

// ---- Types used by the HPQ page ----

export type HPQDifficulty = "Easy" | "Medium" | "Hard";
export type HPQLikelihood = "Very High" | "High" | "Medium-High";
export type HPQKind = "normal" | "assertion-reason";

export interface HPQAROption {
  label: string;
  text: string;
}

export interface HPQQuestion {
  id: string;

  // Topic + subtopic / concept tags
  topic?: Class10TopicKey;
  subtopic?: string;
  concept?: string;

  difficulty?: HPQDifficulty;
  marks?: number;
  likelihood: HPQLikelihood;

  // Normal / AR question layout
  kind?: HPQKind; // omit or "normal" for standard questions

  // Main text
  question: string;

  // For assertion–reason questions
  assertion?: string;
  reason?: string;
  aROptions?: HPQAROption[];
  correctOption?: string;

  // Solution outline
  answer?: string;
  solutionSteps?: string[];
  explanation?: string;
}

export interface HPQTopicBucket {
  topic: Class10TopicKey;
  questions: HPQQuestion[];
}

/**
 * Phase-1 seed data.
 * You can safely extend this array with more questions later.
 */
export const highlyProbableQuestions: HPQTopicBucket[] = [
  {
    topic: "Pair of Linear Equations",
    questions: [
      {
        id: "ple-hpq-1",
        subtopic: "Algebraic Solution Methods",
        concept: "Elimination method",
        difficulty: "Medium",
        marks: 3,
        likelihood: "Very High",
        question:
          "Solve the pair of linear equations: 2x + 3y = 11 and 3x − 2y = 4 using the elimination method.",
        answer: "(x, y) = (34/13, 25/13)",
        solutionSteps: [
          "Write equations in standard form and label them (1) and (2).",
          "Multiply (1) by 3 and (2) by 2 so that coefficients of x become equal.",
          "Subtract the new equations to eliminate x and solve for y.",
          "Substitute the value of y back into one of the original equations to find x.",
          "Write the final ordered pair neatly as (x, y).",
        ],
        explanation:
          "Standard 3-mark PYQ pattern: line up coefficients of one variable, eliminate it, then back-substitute.",
      },
    ],
  },
  {
    topic: "Polynomials",
    questions: [
      {
        id: "poly-hpq-1",
        subtopic: "Zeros & Factorisation",
        concept: "Finding zeroes from factorised form",
        difficulty: "Easy",
        marks: 2,
        likelihood: "Very High",
        question:
          "If a polynomial p(x) = (x − 2)(x + 3), find all zeroes of p(x).",
        answer: "2 and −3",
        solutionSteps: [
          "A zero of a polynomial is a value of x for which p(x) = 0.",
          "Set each factor equal to zero: x − 2 = 0 or x + 3 = 0.",
          "Solve to get x = 2 and x = −3.",
        ],
        explanation:
          "Very common 1–2 mark pattern: when p(x) is already factorised, just equate each factor to zero.",
      },
      {
        id: "poly-hpq-2",
        subtopic: "Coefficient–root Relations",
        concept: "Sum and product of zeroes of a quadratic",
        difficulty: "Medium",
        marks: 3,
        likelihood: "High",
        question:
          "For the quadratic polynomial p(x) = 2x² − 5x + 3, find the sum and product of its zeroes using coefficient–root relations.",
        answer: "Sum of zeroes = 5/2, product of zeroes = 3/2",
        solutionSteps: [
          "Compare p(x) = 2x² − 5x + 3 with ax² + bx + c.",
          "Here a = 2, b = −5, c = 3.",
          "Use α + β = −b/a and αβ = c/a.",
          "Compute α + β = −(−5)/2 = 5/2.",
          "Compute αβ = 3/2.",
        ],
        explanation:
          "This pattern checks if you remember the formula α + β = −b/a and αβ = c/a without solving the quadratic.",
      },
    ],
  },
  {
    topic: "Quadratic Equations",
    questions: [
      {
        id: "qe-hpq-1",
        subtopic: "Algebraic Solution",
        concept: "Quadratic formula",
        difficulty: "Medium",
        marks: 3,
        likelihood: "High",
        question:
          "Solve the quadratic equation 2x² − 3x − 5 = 0 using the quadratic formula.",
        answer: "x = (3 ± √49)/4, i.e. x = 2 or x = −5/2",
        solutionSteps: [
          "Identify a = 2, b = −3, c = −5.",
          "Write the quadratic formula: x = [−b ± √(b² − 4ac)] / (2a).",
          "Compute the discriminant: Δ = b² − 4ac = (−3)² − 4·2·(−5) = 9 + 40 = 49.",
          "Substitute into the formula and simplify.",
        ],
      },
    ],
  },
  {
    topic: "Trigonometry",
    questions: [
      {
        id: "trig-hpq-1",
        subtopic: "Trig Ratios/Values",
        concept: "Using sin²θ + cos²θ = 1",
        difficulty: "Easy",
        marks: 2,
        likelihood: "Very High",
        question:
          "If sin θ = 3/5 and θ is acute, find cos θ using the identity sin²θ + cos²θ = 1.",
        answer: "cos θ = 4/5",
        solutionSteps: [
          "Substitute sin θ = 3/5 into sin²θ + cos²θ = 1.",
          "Compute sin²θ = 9/25.",
          "So 9/25 + cos²θ = 1 ⇒ cos²θ = 1 − 9/25 = 16/25.",
          "Since θ is acute, cos θ is positive ⇒ cos θ = 4/5.",
        ],
      },
    ],
  },
];
