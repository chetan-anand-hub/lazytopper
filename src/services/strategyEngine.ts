// src/services/strategyEngine.ts
//
// Strategy Engine v1 (realistic + adaptive)
// ------------------------------------------------------------
// This module centralises the logic for generating a subject‑wise
// study plan as well as a short “daily mix” suggestion.  It
// deliberately avoids any hidden AI logic for the core maths so
// results remain stable and testable; an AI layer can later be
// added on top to provide coach‑style narration and motivation.

// Import the subject plan builder from the local file.  When using
// relative imports in our project, the utils folder is at the root.
import { buildSubjectPlan, type SubjectKey, type SubjectPlanRow } from "../utils/buildStudyPlan";

/**
 * Supported study vibe modes.  A “beast” day gets you a full hour’s
 * focus per subject; a “zombie” day trims the session to about half
 * that length.  The Strategy Engine itself doesn’t know about
 * user‑specific stamina, but it uses these modes to size the daily
 * mix suggestion.
 */
export type VibeMode = "beast" | "zombie";

/**
 * Inputs required to generate a study strategy.  The grade and
 * subject keys determine which blueprint (Maths or Science) is used.
 * The `daysLeft` and `hoursPerDay` values set the overall study time
 * budget, while the `targetPercent` can be used downstream for
 * narrative purposes (e.g. to recommend revision intensity).  Weak
 * chapters may be passed in to slightly bias the daily mix towards
 * those topics, though the v1 implementation keeps this simple.
 */
export interface StrategyInputs {
  /** Class or grade level – kept for future use, not currently used in v1 */
  grade: string;
  subject: SubjectKey;
  daysLeft: number;
  hoursPerDay: number;
  targetPercent: number;
  vibe?: VibeMode;
  weakChapters?: string[];
}

/**
 * A suggestion for today’s study mix.  Minutes indicate how long to
 * spend on the suggested topic.  Future versions can include
 * multiple items (concept video + HPQ practise, etc.) but v1 keeps
 * it to a single topic for clarity.
 */
export interface DailyMixSuggestion {
  topicKey: string;
  topicLabel: string;
  minutes: number;
}

/**
 * Overall strategy plan returned from the engine.  It contains
 * subject plans (hours allocated per chapter) and a daily mix.
 */
export interface StrategyPlan {
  subject: SubjectKey;
  planRows: SubjectPlanRow[];
  dailyMix: DailyMixSuggestion;
}

/**
 * Returns a conservative recommended hours/day baseline given a
 * student’s target percentage.  This helper is intentionally
 * simplistic – the idea is to provide a minimum floor and let
 * learners adjust up based on their schedule.  You can tweak these
 * thresholds based on real student feedback.
 */
function recommendedHoursPerDay(targetPercent: number): number {
  if (!Number.isFinite(targetPercent) || targetPercent <= 0) return 1.0;
  if (targetPercent <= 60) return 1.0;
  if (targetPercent <= 70) return 1.3;
  if (targetPercent <= 80) return 1.6;
  if (targetPercent <= 90) return 1.8;
  return 2.0;
}

/**
 * Pick a simple “daily mix” topic from the full subject plan.  We
 * sort by recommended hours descending and choose the top chapter.
 * Weak chapters (if provided) are given a slight priority bump so
 * they appear more often.  The total minutes allocated depend on
 * vibe: beast = 60 mins, zombie = 35 mins.
 */
function buildDailyMix(
  _subject: SubjectKey,
  rows: SubjectPlanRow[],
  vibe: VibeMode = "beast",
  weakChapters: string[] = []
): DailyMixSuggestion {
  const minutesTotal = vibe === "zombie" ? 35 : 60;
  if (!rows || rows.length === 0) {
    return { topicKey: "", topicLabel: "", minutes: minutesTotal };
  }
  // Clone and sort rows by hours descending, bumping weak chapters.
  const sorted = [...rows].sort((a, b) => {
    const weakA = weakChapters.includes(a.topicKey) ? 0.5 : 0;
    const weakB = weakChapters.includes(b.topicKey) ? 0.5 : 0;
    return b.hours + weakB - (a.hours + weakA);
  });
  const top = sorted[0];
  return {
    topicKey: top.topicKey,
    topicLabel: top.topicName,
    minutes: minutesTotal,
  };
}

/**
 * Generate a deterministic study plan and daily mix suggestion.  The
 * subject plan distributes hours across chapters using blueprint
 * weightage and tier multipliers (handled by buildSubjectPlan).
 */
export function generateStrategyPlan(inputs: StrategyInputs): StrategyPlan {
  const {
    // grade is accepted for compatibility but unused in v1; future versions
    // could adjust recommendations based on grade.
    subject,
    daysLeft,
    hoursPerDay,
    targetPercent,
    vibe = "beast",
    weakChapters = [],
  } = inputs;
  // Use hoursPerDay if provided; otherwise derive a baseline from
  // targetPercent for teacher‑mode fairness.
  const hours = Number.isFinite(hoursPerDay) && hoursPerDay > 0
    ? hoursPerDay
    : recommendedHoursPerDay(targetPercent);
  const totalHours = Math.max(0, daysLeft) * hours;
  // Compute the subject plan using the blueprint trends.
  const rows = buildSubjectPlan(subject, totalHours);
  return {
    subject,
    planRows: rows,
    dailyMix: buildDailyMix(subject, rows, vibe, weakChapters),
  };
}
