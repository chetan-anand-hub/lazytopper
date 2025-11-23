// src/utils/mockBuilder.ts

import {
  class10TopicTrendList,
  type Class10TopicKey,
  type TopicTier,
} from "../data/class10MathTopicTrends";
import {
  predictedQuestions,
  type PredictedQuestion,
} from "../data/predictedQuestions";

export interface TierMarksSummary {
  tier: TopicTier;
  marks: number;
  questionCount: number;
}

export interface BuiltMockPaper {
  questions: PredictedQuestion[];
  totalMarks: number;
  targetMarks: number;
  tierSummary: TierMarksSummary[];
}

// simple helper
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Map topic key → tier using trend data
function buildTopicTierMap(): Record<Class10TopicKey, TopicTier> {
  const map = {} as Record<Class10TopicKey, TopicTier>;
  class10TopicTrendList.forEach((entry) => {
    const tier =
      (entry.tier as TopicTier | undefined) ?? ("good-to-do" as TopicTier);
    map[entry.topicKey as Class10TopicKey] = tier;
  });
  return map;
}

/**
 * Build a single mock paper close to targetMarks using:
 * 1. Must-Crack first
 * 2. Then High-ROI
 * 3. Then Good-to-Do
 *
 * Greedy + shuffled so every run feels slightly different.
 */
export function buildMockPaper(targetMarks: number = 80): BuiltMockPaper {
  const topicTierMap = buildTopicTierMap();

  // buckets by tier
  const tierOrder: TopicTier[] = ["must-crack", "high-roi", "good-to-do"];
  const questionsByTier: Record<TopicTier, PredictedQuestion[]> = {
    "must-crack": [],
    "high-roi": [],
    "good-to-do": [],
  };

  predictedQuestions.forEach((q) => {
    const tier = topicTierMap[q.topicKey] ?? "good-to-do";
    questionsByTier[tier].push(q);
  });

  let totalMarks = 0;
  const picked: PredictedQuestion[] = [];
  const tierMarks: Record<TopicTier, TierMarksSummary> = {
    "must-crack": { tier: "must-crack", marks: 0, questionCount: 0 },
    "high-roi": { tier: "high-roi", marks: 0, questionCount: 0 },
    "good-to-do": { tier: "good-to-do", marks: 0, questionCount: 0 },
  };

  // Greedy fill: go tier-wise, each tier shuffled
  tierOrder.forEach((tier) => {
    if (totalMarks >= targetMarks) return;

    const shuffled = shuffle(questionsByTier[tier]);

    for (const q of shuffled) {
      const m = q.marks ?? 0;

      // Allow mild overshoot (up to +2 marks) so paper is realistic
      const willOvershoot = totalMarks + m > targetMarks;
      const overshoot = totalMarks + m - targetMarks;

      if (willOvershoot && overshoot > 2) {
        continue; // skip this one, too big a jump
      }

      picked.push(q);
      totalMarks += m;
      tierMarks[tier].marks += m;
      tierMarks[tier].questionCount += 1;

      if (totalMarks >= targetMarks) break;
    }
  });

  return {
    questions: picked,
    totalMarks,
    targetMarks,
    tierSummary: tierOrder.map((t) => tierMarks[t]),
  };
}
