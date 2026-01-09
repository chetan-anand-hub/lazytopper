// src/services/matchScoreService.ts
//
// Provides functions to compute personalised Match % scores for topics.
// The score combines exam weightage, trend frequency, user mastery and
// time-to-exam.  Coefficients can be tuned via the params argument.

export interface MatchScoreCoefficients {
  examWeight: number;
  trend: number;
  masteryGap: number;
  timeFactor: number;
}

export interface TopicMatchScore {
  topicKey: string;
  matchPercentage: number;
  examWeight: number;
  trendScore: number;
  masteryGap: number;
  timeFactor: number;
}

// Default coefficients based on the Pro Tips guide.
export const DEFAULT_COEFFICIENTS: MatchScoreCoefficients = {
  examWeight: 0.35,
  trend: 0.25,
  masteryGap: 0.30,
  timeFactor: 0.10,
};

/**
 * Alternative coefficient sets derived from the P4 analysis. Keys
 * correspond to the names proposed in the report: baseline (current),
 * examFirst, personalised (recommended) and lateCrunch. Use these
 * constants to supply different weightings to the match score
 * computation based on the time of year or experimentation.
 */
export const COEFFICIENT_SETS: Record<string, MatchScoreCoefficients> = {
  baseline: { examWeight: 0.35, trend: 0.25, masteryGap: 0.30, timeFactor: 0.10 },
  examFirst: { examWeight: 0.45, trend: 0.25, masteryGap: 0.20, timeFactor: 0.10 },
  personalised: { examWeight: 0.30, trend: 0.20, masteryGap: 0.35, timeFactor: 0.15 },
  lateCrunch: { examWeight: 0.25, trend: 0.15, masteryGap: 0.35, timeFactor: 0.25 },
};

/**
 * Compute a raw match score for a single topic given the normalised
 * components and weighting coefficients.
 */
export function computeRawMatchScore(
  examWeight: number,
  trendScore: number,
  masteryGap: number,
  timeFactor: number,
  coeffs: MatchScoreCoefficients = DEFAULT_COEFFICIENTS
): number {
  return (
    coeffs.examWeight * examWeight +
    coeffs.trend * trendScore +
    coeffs.masteryGap * masteryGap +
    coeffs.timeFactor * timeFactor
  );
}

/**
 * Convert a raw score to a percentage between 0 and 100.  Values above
 * 1 are clamped to 1.
 */
export function toPercentage(rawScore: number): number {
  const clamped = Math.max(0, Math.min(1, rawScore));
  return Math.round(clamped * 100);
}

/**
 * Generate match scores for a list of topics.  The caller must
 * provide the normalised examWeight, trendScore, masteryGap and
 * timeFactor for each topic.  This service returns the computed
 * percentage along with the components for further analysis.
 */
export function generateMatchScores(
  topics: {
    topicKey: string;
    examWeight: number;
    trendScore: number;
    masteryGap: number;
    timeFactor: number;
  }[],
  coeffs: MatchScoreCoefficients = DEFAULT_COEFFICIENTS
): TopicMatchScore[] {
  return topics.map((t) => {
    const raw = computeRawMatchScore(
      t.examWeight,
      t.trendScore,
      t.masteryGap,
      t.timeFactor,
      coeffs
    );
    return {
      topicKey: t.topicKey,
      examWeight: t.examWeight,
      trendScore: t.trendScore,
      masteryGap: t.masteryGap,
      timeFactor: t.timeFactor,
      matchPercentage: toPercentage(raw),
    };
  });
}