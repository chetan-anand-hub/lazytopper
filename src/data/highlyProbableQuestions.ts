// src/data/highlyProbableQuestions.ts

// Shared types for the HPQ engine

export type HPQSubject = "Maths" | "Science";

export type HPQStream = "Physics" | "Chemistry" | "Biology" | "General";

export type HPQSection = "A" | "B" | "C" | "D" | "E";

export type HPQQuestionType =
  | "MCQ"
  | "VeryShort"
  | "Short"
  | "Long"
  | "CaseBased"
  | "AssertionReason"
  | "Diagram";

export type HPQDifficulty = "Easy" | "Medium" | "Hard";

export type HPQLikelihood = "Very High" | "High" | "Medium-High";

export type HPQTier = "must-crack" | "high-roi" | "good-to-do";

export interface HPQAROption {
  label: string;
  text: string;
}

export interface HPQQuestion {
  id: string;

  // Subject + topic tags
  subject?: HPQSubject; // default: "Maths" if omitted
  stream?: HPQStream; // for Science – Physics / Chemistry / Biology
  topic?: string; // chapter name (e.g. "Metals and Non-Metals")
  subtopic?: string; // finer split
  concept?: string; // skill / pattern inside the topic

  // Exam meta
  section?: HPQSection; // A/B/C/D/E
  type?: HPQQuestionType;
  difficulty?: HPQDifficulty;
  marks?: number;
  likelihood: HPQLikelihood;
  tier?: HPQTier; // optional – can also be taken from bucket/default

  // Question layout
  kind?: "normal" | "assertion-reason"; // for AR style
  question: string;

  // Assertion–Reason specific fields
  assertion?: string;
  reason?: string;
  aROptions?: HPQAROption[];
  correctOption?: string;

  // Solutions
  answer?: string;
  solutionSteps?: string[];
  explanation?: string;

  // Optional extra tags (especially for Science)
  bloomSkill?:
    | "Remembering"
    | "Understanding"
    | "Applying"
    | "Analysing"
    | "Evaluating";
  pastBoardYear?: string;
  policyTag?: string;
}

export interface HPQTopicBucket {
  // Chapter name as used on Trends page
  topic: string;

  // Optional subject + stream tags at bucket level
  subject?: HPQSubject; // default "Maths"
  stream?: HPQStream; // mainly for Science
  defaultTier?: HPQTier;

  questions: HPQQuestion[];
}

/**
 * Phase-1 seed data for Class 10 HPQ.
 * You can safely extend this array for both Maths and Science.
 */
export const highlyProbableQuestions: HPQTopicBucket[] = [
  // -------------------- Maths: Pair of Linear Equations --------------------
  {
    topic: "Pair of Linear Equations in Two Variables",
    subject: "Maths",
    defaultTier: "must-crack",
    questions: [
      {
        id: "ple-hpq-1",
        subject: "Maths",
        topic: "Pair of Linear Equations in Two Variables",
        subtopic: "Algebraic Solution Methods",
        concept: "Elimination method",
        section: "C",
        type: "Short",
        difficulty: "Medium",
        marks: 3,
        likelihood: "Very High",
        tier: "must-crack",
        bloomSkill: "Applying",
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

  // -------------------- Maths: Polynomials --------------------
  {
    topic: "Polynomials",
    subject: "Maths",
    defaultTier: "high-roi",
    questions: [
      {
        id: "poly-hpq-1",
        subject: "Maths",
        topic: "Polynomials",
        subtopic: "Zeros & Factorisation",
        concept: "Finding zeroes from factorised form",
        section: "B",
        type: "VeryShort",
        difficulty: "Easy",
        marks: 2,
        likelihood: "Very High",
        tier: "high-roi",
        bloomSkill: "Understanding",
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
        subject: "Maths",
        topic: "Polynomials",
        subtopic: "Coefficient–root Relations",
        concept: "Sum and product of zeroes of a quadratic",
        section: "C",
        type: "Short",
        difficulty: "Medium",
        marks: 3,
        likelihood: "High",
        tier: "high-roi",
        bloomSkill: "Applying",
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

  // -------------------- Maths: Quadratic Equations --------------------
  {
    topic: "Quadratic Equations",
    subject: "Maths",
    defaultTier: "must-crack",
    questions: [
      {
        id: "qe-hpq-1",
        subject: "Maths",
        topic: "Quadratic Equations",
        subtopic: "Algebraic Solution",
        concept: "Quadratic formula",
        section: "C",
        type: "Short",
        difficulty: "Medium",
        marks: 3,
        likelihood: "High",
        tier: "must-crack",
        bloomSkill: "Applying",
        question:
          "Solve the quadratic equation 2x² − 3x − 5 = 0 using the quadratic formula.",
        answer: "x = (3 ± √49)/4, i.e. x = 2 or x = −5/2",
        solutionSteps: [
          "Identify a = 2, b = −3, c = −5.",
          "Write the quadratic formula: x = [−b ± √(b² − 4ac)] / (2a).",
          "Compute the discriminant: Δ = b² − 4ac = (−3)² − 4·2·(−5) = 9 + 40 = 49.",
          "Substitute into the formula and simplify.",
        ],
        explanation:
          "Basic but compulsory pattern: direct use of the quadratic formula on a board-style equation.",
      },
    ],
  },

  // -------------------- Maths: Trigonometry --------------------
  {
    topic: "Trigonometry",
    subject: "Maths",
    defaultTier: "high-roi",
    questions: [
      {
        id: "trig-hpq-1",
        subject: "Maths",
        topic: "Trigonometry",
        subtopic: "Trig Ratios/Values",
        concept: "Using sin²θ + cos²θ = 1",
        section: "B",
        type: "VeryShort",
        difficulty: "Easy",
        marks: 2,
        likelihood: "Very High",
        tier: "high-roi",
        bloomSkill: "Applying",
        question:
          "If sin θ = 3/5 and θ is acute, find cos θ using the identity sin²θ + cos²θ = 1.",
        answer: "cos θ = 4/5",
        solutionSteps: [
          "Substitute sin θ = 3/5 into sin²θ + cos²θ = 1.",
          "Compute sin²θ = 9/25.",
          "So 9/25 + cos²θ = 1 ⇒ cos²θ = 1 − 9/25 = 16/25.",
          "Since θ is acute, cos θ is positive ⇒ cos θ = 4/5.",
        ],
        explanation:
          "Core identity-based question – appears frequently in simple 2-mark forms.",
      },
    ],
  },

  // ==================== SCIENCE – SAMPLE SEED DATA ====================

  // -------------------- Science: Metals and Non-Metals --------------------
  {
    topic: "Metals and Non-Metals",
    subject: "Science",
    stream: "Chemistry",
    defaultTier: "must-crack",
    questions: [
      {
        id: "2026-MNM-01",
        subject: "Science",
        stream: "Chemistry",
        topic: "Metals and Non-Metals",
        subtopic: "Properties",
        concept: "Physical properties of metals",
        section: "A",
        type: "MCQ",
        difficulty: "Easy",
        marks: 1,
        likelihood: "Very High",
        tier: "must-crack",
        bloomSkill: "Remembering",
        question:
          "Which metal is softest? (A) Sodium (B) Iron (C) Zinc (D) Copper",
        answer: "Sodium",
        explanation: "Sodium is so soft that it can be easily cut with a knife.",
        pastBoardYear: "2024",
        policyTag: "MCQ/Fact",
      },
      {
        id: "2026-MNM-02",
        subject: "Science",
        stream: "Chemistry",
        topic: "Metals and Non-Metals",
        subtopic: "Properties",
        concept: "Reaction of non-metals with water",
        section: "A",
        type: "MCQ",
        difficulty: "Easy",
        marks: 1,
        likelihood: "High",
        tier: "must-crack",
        bloomSkill: "Understanding",
        question:
          "How do non-metals generally react with water? (A) Vigorously (B) Slowly (C) Not at all (D) Explosively",
        answer: "Not at all",
        explanation: "Non-metals usually do not react with water directly.",
        pastBoardYear: "2025",
        policyTag: "Board MCQ trend",
      },
      {
        id: "2026-MNM-03",
        subject: "Science",
        stream: "Chemistry",
        topic: "Metals and Non-Metals",
        subtopic: "Activity Series",
        concept: "Metal displacement reactions",
        section: "A",
        type: "AssertionReason",
        kind: "assertion-reason",
        difficulty: "Medium",
        marks: 1,
        likelihood: "High",
        tier: "must-crack",
        bloomSkill: "Analysing",
        question:
          "Assertion: Zinc will displace copper from copper sulphate solution. Reason: Zinc is above copper in the activity series.",
        assertion:
          "Zinc will displace copper from copper sulphate solution.",
        reason: "Zinc is above copper in the activity series.",
        aROptions: [
          { label: "A", text: "Both A and R are true, and R is the correct explanation of A." },
          { label: "B", text: "Both A and R are true, but R is not the correct explanation of A." },
          { label: "C", text: "A is true but R is false." },
          { label: "D", text: "A is false but R is true." },
        ],
        correctOption: "A",
        explanation: "More reactive metals displace less reactive ones from their salt solutions.",
        pastBoardYear: "2023",
        policyTag: "AR mandatory",
      },
      {
        id: "2026-MNM-04",
        subject: "Science",
        stream: "Chemistry",
        topic: "Metals and Non-Metals",
        subtopic: "Extraction Methods",
        concept: "Extraction of iron",
        section: "B",
        type: "Short",
        difficulty: "Medium",
        marks: 2,
        likelihood: "High",
        tier: "high-roi",
        bloomSkill: "Applying",
        question:
          "Name the main step used to extract iron from hematite in the blast furnace. Describe briefly.",
        answer: "Reduction of iron oxide by carbon monoxide in the blast furnace.",
        explanation:
          "In the blast furnace, carbon monoxide reduces Fe₂O₃ to molten iron: Fe₂O₃ + 3CO → 2Fe + 3CO₂.",
        pastBoardYear: "2022",
        policyTag: "NEP: process focus",
      },
      {
        id: "2026-MNM-05",
        subject: "Science",
        stream: "Chemistry",
        topic: "Metals and Non-Metals",
        subtopic: "Alloys & Corrosion Resistance",
        concept: "Corrosion prevention methods",
        section: "E",
        type: "CaseBased",
        difficulty: "Medium",
        marks: 4,
        likelihood: "High",
        tier: "high-roi",
        bloomSkill: "Applying",
        question:
          "Rohan’s bicycle rusts quickly in a coastal area. Suggest two methods to prevent rusting and briefly explain why each method works.",
        answer: "Painting and applying oil/grease or galvanising.",
        explanation:
          "Painting and oil/grease create a protective layer, preventing oxygen and water from reaching the iron surface. Galvanising coats iron with zinc which is more reactive and protects by sacrificial action.",
        pastBoardYear: "2025",
        policyTag: "Case/resistivity NEP",
      },
    ],
  },

  // You can later add more Science topics like “Life Processes”, “Electricity”, etc.
];
