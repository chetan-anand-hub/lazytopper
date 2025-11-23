// src/data/caseBasedQuestions.ts

import type { Class10TopicKey } from "./class10MathTopicTrends";

export type CaseDifficulty = "Easy" | "Medium" | "Hard";

export interface CaseSubQuestion {
  questionText: string;
  options: string[]; // empty = short/inference answer
  correctAnswer: string;
  explanation: string;
}

export interface CaseBasedQuestion {
  id: string;
  topic: Class10TopicKey;
  subtopic: string;
  type: "Case-Based";
  preferredSections: ("C" | "E")[];
  marks: number; // usually 4
  difficulty: CaseDifficulty;
  bloomSkill: string;
  contextPassage: string;
  questions: CaseSubQuestion[];
  used?: boolean; // for future “skip used ones” logic
}

// ---- Seed bank ----
// NOTE: This is intentionally SMALL so the project compiles.
// Later you’ll expand this with your full predictive model.

export const caseBasedQuestionBank: CaseBasedQuestion[] = [
  // --- Trigonometry: Heights & Distances (your sample, normalised) ---
  {
    id: "2026-TRIG-CASE-01",
    topic: "Trigonometry",
    subtopic: "Heights & Distances",
    type: "Case-Based",
    preferredSections: ["E", "C"],
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Applying",
    contextPassage:
      "At lunch break, a 10 m tall school flagpole casts a shadow measuring 5.77 m. At that moment, Priya stands nearby and wonders about the sun's angle.",
    questions: [
      {
        questionText:
          "What is the angle of elevation of the sun at that time? (Take √3 ≈ 1.732)",
        options: ["30°", "45°", "60°", "90°"],
        correctAnswer: "60°",
        explanation:
          "tan θ = height / shadow = 10 / 5.77 ≈ 1.732 ⇒ θ = 60°.",
      },
      {
        questionText:
          "If a 6 m tall student stands next to the flagpole, what angle would his shadow subtend at his feet?",
        options: ["30°", "45°", "60°", "Unknown (need more data)"],
        correctAnswer: "60°",
        explanation:
          "The sun's elevation is the same for both objects at that moment, so the angle stays 60°.",
      },
    ],
  },

  // Second trig case (new)
  {
    id: "2026-TRIG-CASE-02",
    topic: "Trigonometry",
    subtopic: "Heights & Distances",
    type: "Case-Based",
    preferredSections: ["E"],
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Applying",
    contextPassage:
      "From the balcony of a school building, 15 m above the ground, a student spots a parked car and a school gate in the same straight road line.",
    questions: [
      {
        questionText:
          "The angle of depression of the car is 30°. Find the horizontal distance between the balcony and the car. (Take √3 ≈ 1.732)",
        options: [],
        correctAnswer: "≈ 25.98 m",
        explanation:
          "tan 30° = 15 / d ⇒ d = 15 / tan 30° = 15 / (1/√3) ≈ 25.98 m.",
      },
      {
        questionText:
          "If the angle of depression of the gate is 45°, how far is the gate from the balcony vertically and horizontally?",
        options: [],
        correctAnswer: "Vertical: 15 m, Horizontal: 15 m",
        explanation:
          "Angle of depression equals angle of elevation. tan 45° = 15 / d ⇒ d = 15 m.",
      },
    ],
  },

  // --- Statistics: your sample ---
  {
    id: "2026-STAT-CASE-01",
    topic: "Statistics",
    subtopic: "Grouped Mean Interpretation",
    type: "Case-Based",
    preferredSections: ["E"],
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    contextPassage:
      "A school collects daily commute times (in minutes) for its students and groups them as follows: 0–10: 5 students, 10–20: 15 students, 20–30: 20 students, 30–40: 10 students.",
    questions: [
      {
        questionText:
          "Calculate the mean commute time using the step deviation method.",
        options: [],
        correctAnswer: "Mean ≈ 20 minutes",
        explanation:
          "Midpoints: 5, 15, 25, 35. Using step deviation with class width 10 gives mean ≈ 20 min.",
      },
      {
        questionText:
          "Give two practical recommendations to reduce the average commute time for students.",
        options: [],
        correctAnswer:
          "Example: add nearer pickup points, optimise bus routes, stagger timings, encourage cycling.",
        explanation:
          "Any two sensible strategies that reduce distance or congestion are acceptable.",
      },
    ],
  },

  // Stats case 2 (new)
  {
    id: "2026-STAT-CASE-02",
    topic: "Statistics",
    subtopic: "Median & Interpretation",
    type: "Case-Based",
    preferredSections: ["E"],
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    contextPassage:
      "A coaching centre records the weekly study hours of its Class 10 batch. The grouped data (hours per week) is: 0–5: 4 students, 5–10: 10 students, 10–15: 16 students, 15–20: 8 students, 20–25: 2 students.",
    questions: [
      {
        questionText:
          "Estimate the median study time using the median formula for grouped data.",
        options: [],
        correctAnswer: "Median lies in 10–15 group, ≈ 12–13 hours",
        explanation:
          "Cumulative frequency N/2 falls in 10–15 class; apply median formula using class boundaries.",
      },
      {
        questionText:
          "Based on this median value, what can you infer about the typical student’s weekly study habit?",
        options: [],
        correctAnswer:
          "Most students study around 12–13 hours per week; a few study much less or much more.",
        explanation:
          "Median shows the central tendency; half study less, half study more.",
      },
    ],
  },

  // --- Triangles case 1 (new) ---
  {
    id: "2026-TRI-CASE-01",
    topic: "Triangles",
    subtopic: "Similarity & BPT",
    type: "Case-Based",
    preferredSections: ["E", "C"],
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Applying",
    contextPassage:
      "In a park, a small model of a triangular signboard is made similar to a bigger signboard at the entrance. The sides of the model are 10 cm, 14 cm and 18 cm while the corresponding sides of the big board are k times these.",
    questions: [
      {
        questionText:
          "If the longest side of the big signboard is 4.5 m, find the scale factor k.",
        options: [],
        correctAnswer: "k = 25",
        explanation:
          "18 cm × k = 450 cm ⇒ k = 25 since 4.5 m = 450 cm.",
      },
      {
        questionText:
          "Find the perimeter of the big signboard using this scale factor.",
        options: [],
        correctAnswer: "Perimeter = 25 × (10 + 14 + 18) = 25 × 42 = 1050 cm",
        explanation:
          "Perimeter scales by the same factor; model perimeter = 42 cm, big = 42 × 25.",
      },
    ],
  },

  // Triangles case 2 (new)
  {
    id: "2026-TRI-CASE-02",
    topic: "Triangles",
    subtopic: "Area Ratio in Similar Triangles",
    type: "Case-Based",
    preferredSections: ["E"],
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    contextPassage:
      "A school wants to paint two triangular flags that are similar in shape. The smaller flag has sides 6 cm, 8 cm, 10 cm and an area of 24 cm². The larger flag is used on Sports Day.",
    questions: [
      {
        questionText:
          "If the scale factor of similarity (small to large) is 3 : 5, find the ratio of their areas.",
        options: ["3:5", "9:25", "5:3", "25:9"],
        correctAnswer: "9:25",
        explanation:
          "Area ratio of similar triangles = square of side ratio = (3/5)² = 9/25.",
      },
      {
        questionText:
          "Find the area of the larger flag.",
        options: [],
        correctAnswer: "Area = (25/9) × 24 ≈ 66.7 cm²",
        explanation:
          "Area_large = area_small × (25/9) since area ratios are 9:25.",
      },
    ],
  },
];
