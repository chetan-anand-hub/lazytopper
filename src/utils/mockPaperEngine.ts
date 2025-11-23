// src/utils/mockPaperEngine.ts

import {
  predictedQuestions,
  type PredictedQuestion,
  type SectionKey,
  type DifficultyKey,
} from "../data/predictedQuestions";
import {
  class10TopicTrendList,
  type Class10TopicKey,
} from "../data/class10MathTopicTrends";

export interface SectionBlueprint {
  section: SectionKey;
  targetQuestions: number;
  marksPerQuestion: number;
}

export interface BuildMockPaperOptions {
  sections?: SectionBlueprint[];
  totalMarksTarget?: number;
  questionBank?: PredictedQuestion[];
}

export interface MockPaperSectionResult extends SectionBlueprint {
  questions: PredictedQuestion[];
  sectionMarks: number;
}

export interface MockPaperResult {
  // Section-wise questions and marks
  sections: Record<SectionKey, MockPaperSectionResult>;
  // Flattened list in A→E order (for printing / listing)
  orderedQuestions: PredictedQuestion[];
  // Total marks actually achieved
  totalMarks: number;
  // How many marks ended up in each topic (for debugging / summary UI)
  byTopicMarks: Record<Class10TopicKey, number>;
}

// 🔢 CBSE-ish blueprint tuned to 80 marks total:
//
// A: 20 × 1 = 20
// B:  6 × 2 = 12
// C:  8 × 3 = 24
// D:  4 × 4 = 16
// E:  2 × 4 =  8
// ----------------
// Total          80
//
export const DEFAULT_SECTION_BLUEPRINT: SectionBlueprint[] = [
  { section: "A", targetQuestions: 20, marksPerQuestion: 1 },
  { section: "B", targetQuestions: 6, marksPerQuestion: 2 },
  { section: "C", targetQuestions: 8, marksPerQuestion: 3 },
  { section: "D", targetQuestions: 4, marksPerQuestion: 4 },
  { section: "E", targetQuestions: 2, marksPerQuestion: 4 },
];

// Tiny helper to nudge the engine towards slightly tougher questions
const difficultyScore: Record<DifficultyKey, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

/**
 * Core engine: build one 80-mark mock paper from the bank.
 * - Respects sections A–E.
 * - Tries to match topic weightage from class10TopicTrendList.
 * - Prefers topics that are still under-served in marks.
 */
export function buildMockPaperFromBank(
  opts: BuildMockPaperOptions = {}
): MockPaperResult {
  const bank = (opts.questionBank ?? predictedQuestions).slice();
  const sectionsBlueprint = opts.sections ?? DEFAULT_SECTION_BLUEPRINT;

  const totalMarksTarget =
    opts.totalMarksTarget ??
    sectionsBlueprint.reduce(
      (sum, s) => sum + s.targetQuestions * s.marksPerQuestion,
      0
    );

  // 1️⃣ Topic weightage → target marks per topic
  const topicWeightMap: Record<Class10TopicKey, number> = {} as any;
  let totalWeight = 0;

  class10TopicTrendList.forEach((entry) => {
    topicWeightMap[entry.topicKey] = entry.weightagePercent;
    totalWeight += entry.weightagePercent;
  });

  const remainingMarksByTopic: Record<Class10TopicKey, number> = {} as any;
  (Object.keys(topicWeightMap) as Class10TopicKey[]).forEach((topicKey) => {
    const weight = topicWeightMap[topicKey] ?? 0;
    remainingMarksByTopic[topicKey] = (weight / totalWeight) * totalMarksTarget;
  });

  // 2️⃣ Selection loop – section by section
  const usedIds = new Set<string>();
  const sectionsResult: Record<SectionKey, MockPaperSectionResult> = {} as any;

  sectionsBlueprint.forEach((bp) => {
    // Candidate pool for this section, excluding already used questions
    const pool = bank.filter(
      (q) => q.section === bp.section && !usedIds.has(q.id)
    );

    const chosen: PredictedQuestion[] = [];
    const available = pool.slice(); // shallow copy

    for (let i = 0; i < bp.targetQuestions; i++) {
      if (!available.length) break;

      let bestIndex = -1;
      let bestScore = -Infinity;

      for (let idx = 0; idx < available.length; idx++) {
        const q = available[idx];
        const topicKey = q.topicKey as Class10TopicKey;
        const remainingForTopic = remainingMarksByTopic[topicKey] ?? 0;
        const diffScore = difficultyScore[q.difficulty] ?? 2;

        // Higher score if the topic is still under target (more remaining marks),
        // and a small nudge towards slightly tougher questions.
        const score = remainingForTopic * 2 + diffScore + Math.random() * 0.1;

        if (score > bestScore) {
          bestScore = score;
          bestIndex = idx;
        }
      }

      if (bestIndex === -1) break;

      const selected = available.splice(bestIndex, 1)[0];
      chosen.push(selected);
      usedIds.add(selected.id);

      const topicKey = selected.topicKey as Class10TopicKey;
      if (remainingMarksByTopic[topicKey] != null) {
        remainingMarksByTopic[topicKey] -= selected.marks;
      }
    }

    const sectionMarks = chosen.reduce(
      (sum, q) => sum + (q.marks ?? bp.marksPerQuestion),
      0
    );

    sectionsResult[bp.section] = {
      ...bp,
      questions: chosen,
      sectionMarks,
    };
  });

  // 3️⃣ Flatten into one ordered paper: A → B → C → D → E
  const orderedQuestions: PredictedQuestion[] = [];
  (["A", "B", "C", "D", "E"] as SectionKey[]).forEach((sec) => {
    const section = sectionsResult[sec];
    if (section && section.questions) {
      orderedQuestions.push(...section.questions);
    }
  });

  const totalMarks = orderedQuestions.reduce(
    (sum, q) => sum + (q.marks ?? 0),
    0
  );

  // 4️⃣ Topic-wise marks summary
  const byTopicMarks: Record<Class10TopicKey, number> = {} as any;
  orderedQuestions.forEach((q) => {
    const t = q.topicKey as Class10TopicKey;
    byTopicMarks[t] = (byTopicMarks[t] ?? 0) + (q.marks ?? 0);
  });

  return {
    sections: sectionsResult,
    orderedQuestions,
    totalMarks,
    byTopicMarks,
  };
}
