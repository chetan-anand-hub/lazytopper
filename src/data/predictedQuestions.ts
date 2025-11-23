// src/data/predictedQuestions.ts

import type { Class10TopicKey } from "./class10MathTopicTrends";

// Match the difficulty language we already use
export type DifficultyKey = "Easy" | "Medium" | "Hard";

export type QuestionKind =
  | "MCQ"
  | "Short"
  | "Assertion-Reasoning"
  | "Case-Based";

// ✅ Sections A–E (E = case-study)
export type SectionKey = "A" | "B" | "C" | "D" | "E";

export type BloomSkill =
  | "Remembering"
  | "Understanding"
  | "Applying"
  | "Analysing"
  | "Evaluating"
  | "Creating";

export interface PredictedQuestion {
  id: string;
  topicKey: Class10TopicKey;
  subtopic: string;
  kind: QuestionKind;
  section: SectionKey;
  marks: number;
  difficulty: DifficultyKey;
  bloomSkill: BloomSkill;
  questionText: string;
  options?: string[]; // empty/undefined for subjective
  answer: string;
  explanation: string;

  // 🌱 Socratic / AI-tutor fields (optional for now)
  solutionSteps?: string[];
  finalAnswer?: string;
  strategyHint?: string;

  // 🔎 Predictive-engine metadata (optional)
  pastBoardYear?: string;
  policyTag?: string;
}

// ---------------------------------------------------------------------------
// Seed bank: “board-flavoured, high-probability” questions.
// ---------------------------------------------------------------------------

export const predictedQuestions: PredictedQuestion[] = [
  // ========== REAL NUMBERS (HIGH-ROI) ==========

  {
    id: "2026-RN-SA-01",
    topicKey: "Real Numbers",
    subtopic: "Euclid’s Division Lemma",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "Using Euclid’s division lemma, show that the square of any positive integer is either of the form 3m or 3m + 1 for some integer m.",
    answer:
      "If n = 3q or 3q + 1 or 3q + 2, then n² is of the form 3m or 3m + 1.",
    finalAnswer:
      "Every perfect square is of the form 3m or 3m + 1 (never 3m + 2).",
    explanation:
      "Take n = 3q, 3q + 1 or 3q + 2. Then n² = 9q², 9q² + 6q + 1, or 9q² + 12q + 4. The first two can be written as 3m or 3m + 1. The last becomes 3(3q² + 4q + 1) + 1, so it is also 3m + 1. So n² is either 3m or 3m + 1.",
    solutionSteps: [
      "By Euclid’s lemma, any integer n can be written as 3q, 3q + 1 or 3q + 2.",
      "Compute n² for each case.",
      "Factor out 3 wherever possible and identify the remainder.",
      "Show that the remainder is only 0 or 1 (never 2).",
      "Conclude that n² is of the form 3m or 3m + 1.",
    ],
    strategyHint:
      "Express n in terms of 3q + r and then square; the pattern of remainders appears automatically.",
    pastBoardYear: "2023",
    policyTag: "Number theory pattern/Euclid lemma",
  },

  {
    id: "2026-RN-SA-02",
    topicKey: "Real Numbers",
    subtopic: "Fundamental Theorem of Arithmetic",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Using the Fundamental Theorem of Arithmetic, prove that 5√3 is an irrational number.",
    answer: "5√3 is irrational.",
    finalAnswer: "5√3 is irrational.",
    explanation:
      "Assume 5√3 is rational. Then √3 is also rational (divide by 5), which contradicts the known fact that √3 is irrational from its prime factorisation. Hence 5√3 is irrational.",
    solutionSteps: [
      "Assume, for contradiction, that 5√3 is rational.",
      "Write 5√3 = p/q in lowest terms.",
      "Divide both sides by 5 to get √3 = p/(5q), which is rational.",
      "Recall that √3 is known to be irrational as 3 has an odd power of prime in its factorisation.",
      "This contradiction shows our assumption was wrong.",
      "Therefore, 5√3 must be irrational.",
    ],
    strategyHint:
      "To prove irrationality, assume rational, simplify, and reach a contradiction with a known irrational.",
    pastBoardYear: "2022",
    policyTag: "Irrationality proof/standard pattern",
  },

  // ========== POLYNOMIALS (HIGH-ROI) ==========

  {
    id: "2026-POLY-MCQ-01",
    topicKey: "Polynomials",
    subtopic: "Zeroes & Coefficients",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "If α and β are the zeroes of quadratic polynomial 2x² − 5x + 3, then α + β equals:",
    options: ["5/2", "5/3", "2/5", "3/2"],
    answer: "5/2",
    explanation:
      "For ax² + bx + c, sum of zeroes = −b/a. Here a = 2, b = −5 ⇒ α + β = −(−5)/2 = 5/2.",
    solutionSteps: [
      "Recall: For ax² + bx + c, sum of zeroes = −b/a.",
      "Identify a = 2 and b = −5.",
      "Substitute to get α + β = −(−5)/2.",
      "Simplify to obtain 5/2.",
    ],
    strategyHint: "Use sum and product of zeroes formula; no factorisation needed.",
    pastBoardYear: "2024",
    policyTag: "Formula based MCQ/Polynomials",
  },

  {
    id: "2026-POLY-SA-02",
    topicKey: "Polynomials",
    subtopic: "Factor Theorem",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Using the Factor Theorem, show that x − 2 is a factor of the polynomial p(x) = x³ − 4x² + x + 6 and hence factorise p(x) completely.",
    answer: "p(x) = (x − 2)(x + 1)(x − 3).",
    finalAnswer: "x³ − 4x² + x + 6 = (x − 2)(x + 1)(x − 3).",
    explanation:
      "Check p(2): 8 − 16 + 2 + 6 = 0, so x − 2 is a factor. Divide p(x) by (x − 2) to get x² − 2x − 3. Factorise x² − 2x − 3 as (x + 1)(x − 3).",
    solutionSteps: [
      "Compute p(2) by substituting x = 2 into p(x).",
      "Since p(2) = 0, x − 2 is a factor by Factor Theorem.",
      "Use long division or synthetic division to divide p(x) by (x − 2).",
      "Obtain the quotient x² − 2x − 3.",
      "Factorise x² − 2x − 3 as (x + 1)(x − 3).",
      "Combine to get full factorisation.",
    ],
    strategyHint:
      "After verifying a factor using the Factor Theorem, always divide to simplify the remaining quadratic.",
    pastBoardYear: "2023",
    policyTag: "Polynomial factorisation/Factor theorem",
  },

  // ========== PAIR OF LINEAR EQUATIONS (MUST-CRACK) ==========

  {
    id: "2026-PLE-MCQ-01",
    topicKey: "Pair of Linear Equations",
    subtopic: "Algebraic Solution Methods",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Applying",
    questionText:
      "If 2x + 3y = 11 and 3x − 2y = 4, then the value of y − x is:",
    options: ["1", "2", "3", "4"],
    answer: "2",
    explanation:
      "Solving gives x = 2, y = 4, so y − x = 4 − 2 = 2.",
    solutionSteps: [
      "Write the system: 2x + 3y = 11 and 3x − 2y = 4.",
      "Use elimination to remove one variable.",
      "Solve for the remaining variable.",
      "Back-substitute to find the second variable.",
      "Compute y − x.",
    ],
    strategyHint: "Eliminate x or y by multiplying equations suitably.",
    pastBoardYear: "2023",
    policyTag: "NEP-2020/MCQ emphasis/Must-crack",
  },

  {
    id: "2026-PLE-SA-02",
    topicKey: "Pair of Linear Equations",
    subtopic: "Word & Application Problems",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "The sum of two numbers is 70. Three times the smaller number exceeds the larger by 10. Find the numbers using the method of elimination.",
    answer: "Smaller number = 20, larger number = 50.",
    finalAnswer: "The numbers are 20 and 50.",
    explanation:
      "Let numbers be x and y with x > y. x + y = 70, 3y = x + 10. Substitute x = 70 − y in the second equation to solve for y, then find x.",
    solutionSteps: [
      "Let the numbers be x and y with x > y.",
      "Use x + y = 70 and 3y = x + 10.",
      "Express x from the first equation and substitute in the second.",
      "Solve for y, then for x.",
      "State both numbers clearly.",
    ],
    strategyHint:
      "Convert the word problem into two linear equations, then use substitution.",
    pastBoardYear: "2022",
    policyTag: "Algebra word-problem/Standard board flavour",
  },

  {
    id: "2026-PLE-SA-03",
    topicKey: "Pair of Linear Equations",
    subtopic: "Algebraic Solution Methods",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "Solve the following pair of equations using substitution: x + 2y = 7, 3x − y = 8.",
    answer: "x = 3, y = 2.",
    finalAnswer: "x = 3, y = 2.",
    explanation:
      "From x + 2y = 7, x = 7 − 2y. Substitute into 3x − y = 8 and solve.",
    solutionSteps: [
      "Make x the subject from x + 2y = 7.",
      "Substitute into the second equation.",
      "Simplify to get an equation in y.",
      "Find y and then back-substitute to get x.",
    ],
    strategyHint: "Always isolate a variable from the simpler equation.",
    pastBoardYear: "2021",
    policyTag: "Basic substitution method/1–2 mark pattern",
  },

  {
    id: "2026-PLE-LA-04",
    topicKey: "Pair of Linear Equations",
    subtopic: "Word & Application Problems",
    kind: "Short",
    section: "D",
    marks: 5,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "The sum of the numerator and denominator of a fraction is 11. If 2 is added to the numerator and 3 is added to the denominator, the new fraction becomes 3/4. Find the original fraction.",
    answer: "The original fraction is 5/6.",
    finalAnswer: "Original fraction = 5/6.",
    explanation:
      "Let fraction be x/y. x + y = 11 and (x + 2)/(y + 3) = 3/4. Cross-multiply and solve the linear pair to get x = 5, y = 6.",
    solutionSteps: [
      "Let the fraction be x/y and form x + y = 11.",
      "Use (x + 2)/(y + 3) = 3/4 and cross-multiply.",
      "Simplify to obtain a second linear equation.",
      "Solve the pair of equations.",
      "Identify x and y as numerator and denominator.",
    ],
    strategyHint:
      "Translate the fraction condition into an equation using cross-multiplication.",
    pastBoardYear: "2020",
    policyTag: "Classic 4–5 mark linear word problem",
  },

  // ========== QUADRATIC EQUATIONS (MUST-CRACK) ==========

  {
    id: "2026-QE-MCQ-01",
    topicKey: "Quadratic Equations",
    subtopic: "Nature of Roots (Discriminant)",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "For what value of k does the equation 3x² + 6x + k = 0 have equal roots?",
    options: ["k = 0", "k = 1", "k = 3", "k = 6"],
    answer: "k = 3",
    finalAnswer: "k = 3.",
    explanation:
      "Equal roots when D = 0. Here D = 6² − 4·3·k = 36 − 12k. Set 36 − 12k = 0 to get k = 3.",
    solutionSteps: [
      "Recall: equal roots when D = b² − 4ac = 0.",
      "Identify a = 3, b = 6, c = k.",
      "Compute D = 36 − 12k.",
      "Set D = 0 and solve for k.",
    ],
    strategyHint: "Immediately use discriminant condition instead of solving fully.",
    pastBoardYear: "2025",
    policyTag: "NEP-2020/MCQ/Discriminant focus",
  },

  {
    id: "2026-QE-LA-02",
    topicKey: "Quadratic Equations",
    subtopic: "Word/Application Problems",
    kind: "Short",
    section: "D",
    marks: 5,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "The product of two consecutive positive integers is 156. Form a quadratic equation and find the integers.",
    answer: "The integers are 12 and 13.",
    finalAnswer: "Required integers: 12 and 13.",
    explanation:
      "Let smaller integer be n. Then n(n + 1) = 156 ⇒ n² + n − 156 = 0. Factorise as (n + 13)(n − 12) = 0. Take n = 12 (positive).",
    solutionSteps: [
      "Let the smaller integer be n; next is n + 1.",
      "Write n(n + 1) = 156.",
      "Bring all terms to one side to form a quadratic equation.",
      "Factorise or use the quadratic formula.",
      "Reject negative solution and keep the positive n.",
      "State the two consecutive integers.",
    ],
    strategyHint:
      "Translate product of consecutive integers directly into n(n + 1).",
    pastBoardYear: "2023",
    policyTag: "Application word problem/Medium difficulty",
  },

  {
    id: "2026-QE-SA-03",
    topicKey: "Quadratic Equations",
    subtopic: "Algebraic Solution",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText: "Solve the equation 2x² − 7x + 3 = 0 by factorisation.",
    answer: "x = 3 or x = 1/2.",
    finalAnswer: "x = 3 or x = 1/2.",
    explanation:
      "Split −7x into −x − 6x, factorise to (2x − 1)(x − 3) = 0, giving x = 1/2 or 3.",
    solutionSteps: [
      "Write 2x² − 7x + 3 as 2x² − x − 6x + 3.",
      "Group terms and factorise to get (2x − 1)(x − 3) = 0.",
      "Set each factor equal to zero.",
      "Solve for x in each case.",
    ],
    strategyHint:
      "Choose two numbers whose product is a·c and sum is b to split the middle term.",
    pastBoardYear: "2022",
    policyTag: "Algebraic solution/Factorisation practice",
  },

  {
    id: "2026-QE-LA-04",
    topicKey: "Quadratic Equations",
    subtopic: "Nature of Roots (Discriminant)",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "A teacher gives students the quadratic equation ax² + 5x + 6 = 0 and asks them to find the values of a for which the equation has (i) real and distinct roots, (ii) real and equal roots, and (iii) no real roots. Answer all three parts.",
    answer:
      "(i) a < 25/24 for real and distinct roots, (ii) a = 25/24 for real and equal roots, (iii) a > 25/24 for no real roots.",
    finalAnswer:
      "a < 25/24 ⇒ distinct roots; a = 25/24 ⇒ equal roots; a > 25/24 ⇒ no real roots.",
    explanation:
      "D = 5² − 4·a·6 = 25 − 24a. For D > 0, a < 25/24; for D = 0, a = 25/24; for D < 0, a > 25/24.",
    solutionSteps: [
      "Compute D = 25 − 24a.",
      "Use D > 0 to get inequality for distinct roots.",
      "Use D = 0 for equal roots.",
      "Use D < 0 for no real roots.",
      "Solve each case separately and summarise.",
    ],
    strategyHint:
      "Change only the condition on D; the expression 25 − 24a stays the same.",
    pastBoardYear: "2024",
    policyTag: "Case-based/Discriminant concept integration",
  },

  // ========== ARITHMETIC PROGRESSION (HIGH-ROI) ==========

  {
    id: "2026-AP-MCQ-01",
    topicKey: "Arithmetic Progression",
    subtopic: "General Term",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "In an AP, the first term is 7 and common difference is 3. The 10th term is:",
    options: ["34", "37", "28", "40"],
    answer: "34",
    explanation:
      "Use aₙ = a + (n − 1)d = 7 + 9 × 3 = 7 + 27 = 34.",
    solutionSteps: [
      "Write the formula aₙ = a + (n − 1)d.",
      "Substitute a = 7, d = 3, n = 10.",
      "Simplify to get the 10th term.",
    ],
    strategyHint: "Remember that the first term corresponds to n = 1.",
    pastBoardYear: "2022",
    policyTag: "Direct formula MCQ/AP",
  },

  {
    id: "2026-AP-SA-02",
    topicKey: "Arithmetic Progression",
    subtopic: "Sum of n Terms",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "How many terms of the AP 5, 8, 11, ... must be taken so that the sum is 155?",
    answer: "10 terms.",
    finalAnswer: "10 terms of the AP are needed.",
    explanation:
      "Here a = 5, d = 3. Let n terms have sum 155. Sₙ = n/2[2a + (n − 1)d] = 155. Solve n/2[10 + 3(n − 1)] = 155 ⇒ n(3n + 7) = 310 ⇒ 3n² + 7n − 310 = 0 ⇒ n = 10.",
    solutionSteps: [
      "Identify a = 5, d = 3.",
      "Use Sₙ = n/2[2a + (n − 1)d].",
      "Substitute Sₙ = 155 and simplify to get a quadratic in n.",
      "Solve the quadratic equation.",
      "Reject negative root and keep positive integer n.",
    ],
    strategyHint:
      "Sum questions often reduce to a quadratic; check that n is a positive integer.",
    pastBoardYear: "2023",
    policyTag: "AP sum/board pattern",
  },

  // ========== TRIANGLES (MUST-CRACK) ==========

  {
    id: "2026-TRI-SA-01",
    topicKey: "Triangles",
    subtopic: "Similarity (BPT)",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "In ΔABC, DE ∥ BC with D on AB and E on AC. If AD = 3 cm, DB = 2 cm and AE = 4.5 cm, find EC.",
    answer: "EC = 3 cm.",
    finalAnswer: "EC = 3 cm.",
    explanation:
      "By Basic Proportionality Theorem, AD/DB = AE/EC. So 3/2 = 4.5/EC ⇒ EC = (4.5 × 2)/3 = 3 cm.",
    solutionSteps: [
      "Note that DE ∥ BC, so triangles ADE and ABC are similar.",
      "Apply BPT: AD/DB = AE/EC.",
      "Substitute given values and solve for EC.",
      "Write the answer with units.",
    ],
    strategyHint:
      "As soon as you see a line parallel to one side of a triangle, think BPT and similarity.",
    pastBoardYear: "2022",
    policyTag: "Geometry/BPT direct-use",
  },

  {
    id: "2026-TRI-SA-02",
    topicKey: "Triangles",
    subtopic: "Pythagoras & Converse",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Prove that in a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides.",
    answer:
      "In a right triangle with right angle at B, AC² = AB² + BC².",
    finalAnswer:
      "For right-angled ΔABC with ∠B = 90°, AC² = AB² + BC².",
    explanation:
      "Construct squares on each side and use similarity of triangles formed by an altitude from the right angle, or use the area method. Standard proof concludes AC² = AB² + BC².",
    solutionSteps: [
      "Consider right-angled ΔABC with ∠B = 90°.",
      "Draw altitude from B to AC and name the foot D.",
      "Use similarity of ΔABD, ΔCBD and ΔABC.",
      "Write ratios of corresponding sides and derive relations.",
      "Add the relations to obtain AC² = AB² + BC².",
    ],
    strategyHint:
      "Using an altitude from the right angle creates smaller similar triangles inside the big triangle.",
    pastBoardYear: "2023",
    policyTag: "Theorem proof/Pythagoras",
  },

  // ========== COORDINATE GEOMETRY (HIGH-ROI) ==========

  {
    id: "2026-CG-MCQ-01",
    topicKey: "Coordinate Geometry",
    subtopic: "Distance Formula",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "The distance between points (3, 4) and (0, 0) is:",
    options: ["3", "4", "5", "7"],
    answer: "5",
    explanation:
      "Distance = √[(3 − 0)² + (4 − 0)²] = √(9 + 16) = √25 = 5.",
    solutionSteps: [
      "Apply distance formula: √[(x₂ − x₁)² + (y₂ − y₁)²].",
      "Substitute (3,4) and (0,0).",
      "Simplify inside the square root and then take the root.",
    ],
    strategyHint:
      "Recognise the classic 3–4–5 right triangle pattern for quick mental calculation.",
    pastBoardYear: "2021",
    policyTag: "Direct formula MCQ/Distance",
  },

  {
    id: "2026-CG-SA-02",
    topicKey: "Coordinate Geometry",
    subtopic: "Section Formula",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Find the coordinates of the point which divides the line segment joining (2, −3) and (8, 9) in the ratio 1 : 2 internally.",
    answer: "(6, 5)",
    finalAnswer: "The required point is (6, 5).",
    explanation:
      "Use internal section formula: ( (m₂x₁ + m₁x₂)/(m₁ + m₂), (m₂y₁ + m₁y₂)/(m₁ + m₂) ). With m₁:m₂ = 1:2, we get (6, 5).",
    solutionSteps: [
      "Let A(2, −3), B(8, 9) and point P divide AB in ratio 1:2.",
      "Use section formula for internal division.",
      "Compute x-coordinate of P.",
      "Compute y-coordinate of P.",
      "Write final coordinates.",
    ],
    strategyHint:
      "Keep the ratio order consistent with which point you assign m₁ and m₂.",
    pastBoardYear: "2023",
    policyTag: "Section formula standard",
  },

  // ========== TRIGONOMETRY (MUST-CRACK) ==========

  {
    id: "2026-TRIG-SA-01",
    topicKey: "Trigonometry",
    subtopic: "Trig Identities/Proofs",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Prove that (1 − tan²θ) / (1 + tan²θ) = cos 2θ, for all θ for which both sides are defined.",
    answer: "The identity holds true.",
    finalAnswer:
      "For all admissible θ, (1 − tan²θ)/(1 + tan²θ) = cos 2θ.",
    explanation:
      "Convert tanθ to sinθ/cosθ, simplify using sin²θ + cos²θ = 1 and recognise cos²θ − sin²θ as cos 2θ.",
    solutionSteps: [
      "Start with LHS: (1 − tan²θ)/(1 + tan²θ).",
      "Write tanθ as sinθ/cosθ.",
      "Simplify numerator and denominator separately.",
      "Use sin²θ + cos²θ = 1 to simplify.",
      "Recognise cos²θ − sin²θ as cos 2θ.",
    ],
    strategyHint:
      "For trig identities, convert everything to sine and cosine first.",
    pastBoardYear: "2023",
    policyTag: "Identity proof/Trig algebra",
  },

  {
    id: "2026-TRIG-LA-02",
    topicKey: "Trigonometry",
    subtopic: "Application/Heights & Distances",
    kind: "Short",
    section: "D",
    marks: 5,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "From the top of a 15 m high tower, the angle of elevation of the top of a vertical flagstaff is 30° and the angle of depression of its foot is 45°. Find the height of the flagstaff. (Take √3 ≈ 1.732.)",
    answer: "Height of flagstaff ≈ 23.7 m.",
    finalAnswer: "Height of flagstaff ≈ 23.7 m.",
    explanation:
      "Let distance between tower and flagstaff be x. Using tan 45° gives x = 15. Using tan 30° = (h − 15)/15 gives h ≈ 23.7 m.",
    solutionSteps: [
      "Draw the figure with two right triangles sharing the horizontal distance.",
      "Use tan 45° for the lower triangle to get x = 15 m.",
      "Use tan 30° = (h − 15)/15 for the upper triangle.",
      "Solve for h − 15, then add 15 to get h.",
      "Approximate using √3 ≈ 1.732.",
    ],
    strategyHint:
      "Separate the problem into two right triangles with a common base.",
    pastBoardYear: "2022",
    policyTag: "Heights & distances/Two-position angle",
  },

  {
    id: "2026-TRIG-MCQ-03",
    topicKey: "Trigonometry",
    subtopic: "Trig Ratios/Values",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText: "The value of sin 60° − cos 30° is:",
    options: ["0", "1/2", "√3/2", "1"],
    answer: "0",
    finalAnswer: "0.",
    explanation:
      "sin 60° = √3/2 and cos 30° = √3/2, so their difference is 0.",
    solutionSteps: [
      "Recall standard values for sin 60° and cos 30°.",
      "Subtract and simplify.",
    ],
    strategyHint: "Memorise the standard trig table for 0°, 30°, 45°, 60°, 90°.",
    pastBoardYear: "2021",
    policyTag: "Single-step MCQ/Standard values",
  },

  {
    id: "2026-TRIG-SA-04",
    topicKey: "Trigonometry",
    subtopic: "Trig Ratios/Values",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Without using tables, evaluate: (2 sin 30° + 3 cos 60°) / (sin 45° + cos 45°).",
    answer: "5/(2√2)",
    finalAnswer: "The value is 5/(2√2).",
    explanation:
      "sin 30° = 1/2, cos 60° = 1/2, sin 45° = cos 45° = 1/√2. Numerator = 2·1/2 + 3·1/2 = 5/2. Denominator = 1/√2 + 1/√2 = √2. So the value is (5/2)/√2 = 5/(2√2).",
    solutionSteps: [
      "Substitute standard values of sin and cos.",
      "Compute the numerator.",
      "Compute the denominator.",
      "Divide numerator by denominator and simplify.",
    ],
    strategyHint:
      "Break such expressions into numerator and denominator pieces first.",
    pastBoardYear: "2020",
    policyTag: "Trig value manipulation/Medium level",
  },

  {
    id: "2026-TRIG-LA-05",
    topicKey: "Trigonometry",
    subtopic: "Application/Heights & Distances",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "A boy is standing at a point A on level ground such that the angle of elevation of the top of a school building is 45°. When he walks 20 m closer to the building to a point B, the angle of elevation becomes 60°. Draw a rough figure and find the height of the building, correct to one decimal place.",
    answer: "Height of the building ≈ 27.3 m.",
    finalAnswer: "Height of the building ≈ 27.3 m.",
    explanation:
      "Let height be h and initial distance x. From tan 45° = h/x, h = x. From B, tan 60° = h/(x − 20) gives √3 = x/(x − 20). Solve for x and then h.",
    solutionSteps: [
      "Draw two positions A and B and the vertical building.",
      "Let AB = 20 m and initial distance from building be x.",
      "Use tan 45° = h/x to get h = x.",
      "Use tan 60° = h/(x − 20) and substitute h = x.",
      "Solve for x and thus for h.",
      "Round the height to one decimal place.",
    ],
    strategyHint:
      "Most two-position problems reduce to solving two tan equations in two unknowns.",
    pastBoardYear: "2024",
    policyTag: "Case-based/Heights & distances/Two angles",
  },

  // ========== CIRCLES (HIGH-ROI) ==========

  {
    id: "2026-CIRC-SA-01",
    topicKey: "Circles",
    subtopic: "Tangent Properties",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Understanding",
    questionText:
      "Prove that the tangent at any point of a circle is perpendicular to the radius through the point of contact.",
    answer:
      "The tangent at a point on a circle is perpendicular to the radius through that point.",
    finalAnswer:
      "If OP is radius and PT is tangent at P, then OP ⟂ PT.",
    explanation:
      "Join the centre O to the point of contact P. Any other point Q on the tangent has OQ > OP, so OP is the shortest distance from O to the tangent. Hence OP ⟂ tangent at P.",
    solutionSteps: [
      "Consider circle with centre O and tangent at P touching circle.",
      "Join OP and any other segment OQ to a point Q on the tangent.",
      "Use the property that the shortest distance from a point to a line is the perpendicular.",
      "Show that OP is the shortest distance.",
      "Conclude that OP ⟂ tangent at P.",
    ],
    strategyHint:
      "Think of shortest distance from a point to a line being the perpendicular segment.",
    pastBoardYear: "2023",
    policyTag: "Tangents/radius property",
  },

  // ========== AREAS RELATED TO CIRCLES (GOOD-TO-DO) ==========

  {
    id: "2026-ARC-SA-01",
    topicKey: "Areas Related to Circles",
    subtopic: "Sector & Segment",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Find the area of a sector of a circle with radius 7 cm and central angle 120°. (Use π = 22/7.)",
    answer: "Approx. 51.3 cm².",
    finalAnswer: "Area of the sector = 51.3 cm² (approx.).",
    explanation:
      "Sector area = (θ/360) × πr² = 120/360 × 22/7 × 49 = (1/3) × 154 = 51.3 cm².",
    solutionSteps: [
      "Use formula for area of a sector: (θ/360) × πr².",
      "Substitute θ = 120°, r = 7 cm.",
      "Simplify the fraction and multiply.",
      "Round if required.",
    ],
    strategyHint:
      "120° is one-third of 360°, so area is one-third of full circle area.",
    pastBoardYear: "2022",
    policyTag: "Sector area/basic computation",
  },

  // ========== SURFACE AREAS AND VOLUMES (HIGH-ROI) ==========

  {
    id: "2026-SAV-SA-01",
    topicKey: "Surface Areas and Volumes",
    subtopic: "Combination of Solids",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "A solid toy is in the form of a hemisphere of radius 3.5 cm mounted on a right circular cone of height 4 cm and same base radius. Find the total surface area of the toy. (Use π = 22/7.)",
    answer: "Total surface area ≈ 131.9 cm².",
    finalAnswer: "Total surface area of the toy ≈ 131.9 cm².",
    explanation:
      "Total surface area = curved surface area of cone + curved surface area of hemisphere. Compute slant height of cone using √(r² + h²), then add both areas.",
    solutionSteps: [
      "Identify radius r = 3.5 cm and height of cone h = 4 cm.",
      "Compute slant height l = √(r² + h²).",
      "Find curved surface area of cone: πrl.",
      "Find curved surface area of hemisphere: 2πr².",
      "Add both to get total surface area.",
    ],
    strategyHint:
      "Do not include base area of cone; hemisphere covers it.",
    pastBoardYear: "2023",
    policyTag: "Combination of solids/Surface area",
  },

  // ========== STATISTICS (MUST-CRACK) ==========

  {
    id: "2026-STAT-SA-01",
    topicKey: "Statistics",
    subtopic: "Mean of Grouped Data",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "The following table shows the marks obtained by 40 students in a test. Using the assumed mean method, find the mean marks.\n\nClass: 0–10, 10–20, 20–30, 30–40, 40–50\nFrequency: 4, 6, 14, 10, 6",
    answer: "Mean marks = 28.5.",
    finalAnswer: "Mean marks ≈ 28.5.",
    explanation:
      "Find midpoints, take assumed mean 25 or 30, compute deviations and f·d, then use mean formula for assumed mean method.",
    solutionSteps: [
      "Write class intervals and find class marks (midpoints).",
      "Choose a convenient assumed mean A (e.g., 25 or 30).",
      "Compute deviation d = (xᵢ − A)/h and fᵢdᵢ.",
      "Use mean formula: x̄ = A + (Σfᵢdᵢ / Σfᵢ) × h.",
      "Substitute values and compute x̄.",
    ],
    strategyHint:
      "Assumed mean method reduces calculations by shifting origin and scale.",
    pastBoardYear: "2022",
    policyTag: "Grouped data mean/Assumed mean method",
  },

  {
    id: "2026-STAT-CASE-01",
    topicKey: "Statistics",
    subtopic: "Mean/Median/Mode",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "A teacher collects weekly test scores for five students: 18, 20, 15, 22, 15. Find the mode, median, and mean of the data.",
    answer: "Mode = 15, Median = 18, Mean = 18.",
    finalAnswer: "Mode = 15, Median = 18, Mean = 18.",
    explanation:
      "Arrange in ascending order: 15, 15, 18, 20, 22. Mode is 15, median is 18, and mean is 90/5 = 18.",
    solutionSteps: [
      "List the data and arrange in ascending order.",
      "Identify the most frequent value as the mode.",
      "Take the middle value as the median.",
      "Compute the sum of all values and divide by 5 for the mean.",
    ],
    strategyHint:
      "For small data sets, order the numbers first; it makes all three measures easy to see.",
    pastBoardYear: "2023",
    policyTag: "Case-based mandatory, NEP 2020/Statistics",
  },

  // ========== PROBABILITY (MUST-CRACK) ==========

  {
    id: "2026-PROB-MCQ-01",
    topicKey: "Probability",
    subtopic: "Classical Probability",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "A card is drawn at random from a well-shuffled pack of 52 playing cards. The probability of getting a king is:",
    options: ["1/26", "1/13", "1/52", "4/13"],
    answer: "1/13",
    explanation:
      "There are 4 kings in 52 cards. Probability = 4/52 = 1/13.",
    solutionSteps: [
      "Count favourable outcomes (4 kings).",
      "Total outcomes = 52.",
      "Use probability formula P(E) = favourable/total.",
    ],
    strategyHint: "Remember there are 4 cards of each denomination.",
    pastBoardYear: "2021",
    policyTag: "Basic probability/Single-event",
  },

  {
    id: "2026-PROB-SA-02",
    topicKey: "Probability",
    subtopic: "Complementary Events",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "A bag contains 5 red and 3 blue balls. One ball is drawn at random. What is the probability that the ball drawn is not blue?",
    answer: "5/8",
    finalAnswer: "Probability = 5/8.",
    explanation:
      "There are 3 blue balls, so probability of blue is 3/8. Probability of not blue = 1 − 3/8 = 5/8. Alternatively, directly favourable red outcomes 5 out of 8.",
    solutionSteps: [
      "Total balls = 5 + 3 = 8.",
      "Favourable outcomes for 'not blue' are red balls = 5.",
      "Compute probability as 5/8.",
      "Or use P(not blue) = 1 − P(blue).",
    ],
    strategyHint:
      "Sometimes complementary probability (1 − P(E)) is quicker.",
    pastBoardYear: "2023",
    policyTag: "Simple complementary probability",
  },
];
