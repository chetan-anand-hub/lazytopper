/*
 * Weekly Wrapped Generator
 *
 * Given a set of practice attempts (e.g. from practiceInsights.ts), this
 * module computes a summary of the learner’s activity over a defined
 * interval. The output shape is intentionally decoupled from any UI
 * concerns so that different presentation layers (web, mobile, email) can
 * render the same summary consistently.
 */

import type { PracticeAttempt, DifficultyLevel, LTSubject } from './practiceInsights';

// Interface describing the aggregated performance for a single topic.
export interface TopicPerformance {
  topicKey: string;
  topicName?: string;
  subject: LTSubject;
  correct: number;
  total: number;
  accuracy: number;
}

// Main summary structure returned by generateWeeklyWrapped().
export interface WeeklyWrappedSummary {
  /** ISO date string marking the start of the interval (inclusive). */
  startDate: string;
  /** ISO date string marking the end of the interval (exclusive). */
  endDate: string;
  /** Total number of attempts during the interval. */
  totalAttempts: number;
  /** Total correct answers. */
  totalCorrect: number;
  /** Overall accuracy percentage (0–100). */
  accuracy: number;
  /** Distribution of attempts by difficulty. Values are counts, not percentages. */
  difficultyCounts: Record<DifficultyLevel, number>;
  /** Bloom skill distribution. Keys are Bloom skills; values are counts. */
  bloomCounts: Record<string, number>;
  /** Per‑topic performance metrics, sorted descending by total attempts. */
  topics: TopicPerformance[];
  /** List of topic keys considered strong (accuracy ≥ 0.8 and ≥ 3 attempts). */
  strongTopics: string[];
  /** List of topic keys considered weak (accuracy ≤ 0.5 and ≥ 3 attempts). */
  weakTopics: string[];
}

/**
 * Compute a Weekly Wrapped summary for the provided attempts. The caller
 * should filter attempts to the desired date range before passing them
 * here. The returned summary contains aggregated statistics and topic
 * breakdowns suitable for display in a weekly recap.
 */
export function generateWeeklyWrapped(attempts: PracticeAttempt[], interval: {
  start: number;
  end: number;
}): WeeklyWrappedSummary {
  const { start, end } = interval;
  const startDate = new Date(start).toISOString();
  const endDate = new Date(end).toISOString();
  const difficultyCounts: Record<DifficultyLevel, number> = {
    Easy: 0,
    Medium: 0,
    Hard: 0,
  };
  const bloomCounts: Record<string, number> = {};
  const topicStats: Record<string, TopicPerformance> = {};
  let totalCorrect = 0;

  for (const attempt of attempts) {
    // Skip attempts outside the interval — caller may pass unfiltered data.
    if (attempt.timestamp < start || attempt.timestamp >= end) continue;

    // Difficulty distribution
    difficultyCounts[attempt.difficulty] =
      (difficultyCounts[attempt.difficulty] || 0) + 1;

    // Bloom distribution
    if (attempt.bloomSkill) {
      const key = attempt.bloomSkill.trim().toLowerCase();
      bloomCounts[key] = (bloomCounts[key] || 0) + 1;
    }

    // Topic performance
    const tKey = attempt.topicKey;
    if (!topicStats[tKey]) {
      topicStats[tKey] = {
        topicKey: tKey,
        topicName: attempt.topicName,
        subject: attempt.subject,
        correct: 0,
        total: 0,
        accuracy: 0,
      };
    }
    const stats = topicStats[tKey];
    stats.total++;
    if (attempt.correct) {
      stats.correct++;
      totalCorrect++;
    }
  }

  // Compute accuracies and classify strong/weak topics
  const topics: TopicPerformance[] = Object.values(topicStats).map((tp) => {
    const accuracy = tp.total > 0 ? tp.correct / tp.total : 0;
    return { ...tp, accuracy };
  });
  topics.sort((a, b) => b.total - a.total);
  const strongTopics = topics
    .filter((t) => t.total >= 3 && t.accuracy >= 0.8)
    .map((t) => t.topicKey);
  const weakTopics = topics
    .filter((t) => t.total >= 3 && t.accuracy <= 0.5)
    .map((t) => t.topicKey);

  const totalAttempts = attempts.filter((a) => a.timestamp >= start && a.timestamp < end).length;
  const accuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

  return {
    startDate,
    endDate,
    totalAttempts,
    totalCorrect,
    accuracy,
    difficultyCounts,
    bloomCounts,
    topics,
    strongTopics,
    weakTopics,
  };
}