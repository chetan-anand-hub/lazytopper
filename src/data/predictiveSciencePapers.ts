// src/data/predictiveSciencePapers.ts

export type ScienceSectionKey = "A" | "B" | "C" | "D" | "E";

export interface SciencePredictivePaper {
  id: string;
  title: string;
  slug: string;
  vibe: string;
  tagline: string;
  markTotal: number;
  // Total marks per section (A–E) for an 80-mark board-style paper
  sectionMarks: Record<ScienceSectionKey, number>;
  // List of PredictedScienceQuestion.id values that belong to this paper.
  // Optional so that papers can still exist before we wire all questionIds.
  questionIds?: string[];
}

// NOTE:
// For now questionIds are left empty – your Science MockPaper view can
// fall back to the full predictedScienceQuestions bank if a paper has
// no ids yet. Later, we’ll populate these to get true curated 80-mark papers.

export const predictiveSciencePapers: SciencePredictivePaper[] = [
  {
    id: "SCI-P1",
    title: "Science Predictive Paper 1",
    slug: "sci-paper-1-balanced-core",
    vibe: "Balanced Physics + Chemistry + Biology mix.",
    tagline: "Good first mock: near-board difficulty and coverage.",
    markTotal: 80,
    sectionMarks: { A: 20, B: 12, C: 24, D: 16, E: 8 },
    questionIds: [],
  },
  {
    id: "SCI-P2",
    title: "Science Predictive Paper 2",
    slug: "sci-paper-2-physics-heavy",
    vibe: "Electricity, Magnetism and Light in focus.",
    tagline: "Great if you want to stress-test Physics numericals + concepts.",
    markTotal: 80,
    sectionMarks: { A: 20, B: 12, C: 24, D: 16, E: 8 },
    questionIds: [],
  },
  {
    id: "SCI-P3",
    title: "Science Predictive Paper 3",
    slug: "sci-paper-3-chemistry-core",
    vibe: "Chemical Reactions, Metals, Carbon and Periodic Table focus.",
    tagline: "Perfect for a Chemistry-focused revision mock.",
    markTotal: 80,
    sectionMarks: { A: 20, B: 12, C: 24, D: 16, E: 8 },
    questionIds: [],
  },
  {
    id: "SCI-P4",
    title: "Science Predictive Paper 4",
    slug: "sci-paper-4-biology-heavy",
    vibe: "Life Processes, Heredity, Reproduction in spotlight.",
    tagline: "Use this when polishing high-weight Biology units.",
    markTotal: 80,
    sectionMarks: { A: 20, B: 12, C: 24, D: 16, E: 8 },
    questionIds: [],
  },
  {
    id: "SCI-P5",
    title: "Science Predictive Paper 5",
    slug: "sci-paper-5-speed-run",
    vibe: "Many short questions to push speed and accuracy.",
    tagline: "Ideal for a fast Sunday sprint mock.",
    markTotal: 80,
    sectionMarks: { A: 20, B: 12, C: 24, D: 16, E: 8 },
    questionIds: [],
  },
  {
    id: "SCI-P6",
    title: "Science Predictive Paper 6",
    slug: "sci-paper-6-mixed-bag",
    vibe: "Evenly spread across all Science chapters.",
    tagline: "Closest to a generic Science board paper pattern.",
    markTotal: 80,
    sectionMarks: { A: 20, B: 12, C: 24, D: 16, E: 8 },
    questionIds: [],
  },
  {
    id: "SCI-P7",
    title: "Science Predictive Paper 7",
    slug: "sci-paper-7-tricky-concepts",
    vibe: "Includes more concept-twister questions.",
    tagline: "Attempt when you’re comfortable with the basics in all three streams.",
    markTotal: 80,
    sectionMarks: { A: 20, B: 12, C: 24, D: 16, E: 8 },
    questionIds: [],
  },
  {
    id: "SCI-P8",
    title: "Science Predictive Paper 8",
    slug: "sci-paper-8-physics-chem-bio-mix",
    vibe: "Physics + Chemistry + Biology in a balanced mock.",
    tagline: "Good mid-journey mock once Science is 70–80% done.",
    markTotal: 80,
    sectionMarks: { A: 20, B: 12, C: 24, D: 16, E: 8 },
    questionIds: [],
  },
  {
    id: "SCI-P9",
    title: "Science Predictive Paper 9",
    slug: "sci-paper-9-board-style",
    vibe: "Very board-like in flavour and difficulty.",
    tagline: "Use this as a dress rehearsal before school Science prelims.",
    markTotal: 80,
    sectionMarks: { A: 20, B: 12, C: 24, D: 16, E: 8 },
    questionIds: [],
  },
  {
    id: "SCI-P10",
    title: "Science Predictive Paper 10",
    slug: "sci-paper-10-final-stress",
    vibe: "High intensity with some spicy 4-mark case-based questions.",
    tagline: "Best attempted close to the boards as a final Science stress test.",
    markTotal: 80,
    sectionMarks: { A: 20, B: 12, C: 24, D: 16, E: 8 },
    questionIds: [],
  },
];
