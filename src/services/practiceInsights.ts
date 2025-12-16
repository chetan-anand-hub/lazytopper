/*
 * Practice Insights Service
 *
 * This module provides helper functions for recording and retrieving
 * practice activity. Each time a student attempts a question, you can
 * call `recordAttempt` with the relevant metadata (topic, difficulty,
 * correctness, etc.). Data is persisted to localStorage under a
 * consistent key. Aggregation helpers allow callers to query
 * attempts within a date range for later analysis (e.g. Weekly Wrapped).
 */

// Note: We avoid importing from other app modules here to keep the
// service decoupled. Re‑declare simple types as needed. If additional
// metadata (e.g. Bloom skill enums) become available, extend the
// interfaces below accordingly.

export type LTSubject = 'maths' | 'science';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface PracticeAttempt {
  /** Unique identifier for this attempt (e.g. `${questionId}-${timestamp}`) */
  id: string;
  /** Original question identifier (canonical or AI variant) */
  questionId: string;
  /** Canonical practice pack key, e.g. "real_numbers" */
  topicKey: string;
  /** Human‑readable topic name, e.g. "Real Numbers" */
  topicName?: string;
  /** Subject of the question, lower case. */
  subject: LTSubject;
  /** Difficulty level selected when the question was asked. */
  difficulty: DifficultyLevel;
  /** Optional Bloom skill tag (remember, apply, analyse, etc.) */
  bloomSkill?: string;
  /** Whether the student answered correctly. */
  correct: boolean;
  /** Unix timestamp (milliseconds) when the attempt occurred. */
  timestamp: number;
}

export interface PracticeInsights {
  attempts: PracticeAttempt[];
}

/**
 * Snapshot summarising a student's weak concepts and common mistakes.
 *
 * The insight snapshot is intended for consumption by the Daily Mix
 * generator and other recommendation engines.  It aggregates recent
 * practice attempts to highlight the concepts where the student
 * consistently answers incorrectly (weak concepts) and the types of
 * mistakes they frequently make (common mistakes).  When no
 * sufficient history is available the arrays may be empty.
 */
export interface PracticeWeakConcept {
  concept: string;
  /** How many times this concept was answered incorrectly. */
  count: number;
}

export interface PracticeCommonMistake {
  mistake: string;
  /** How many times this mistake was recorded. */
  count: number;
}

export interface PracticeInsightSnapshot {
  weakConcepts: PracticeWeakConcept[];
  commonMistakes: PracticeCommonMistake[];
}

const STORAGE_KEY = 'lazyTopper_practice_insights';

/**
 * Load all recorded practice attempts from localStorage. If no data is
 * present, returns an empty structure. This function gracefully
 * handles JSON parse errors by clearing corrupt data.
 */
export function loadInsights(): PracticeInsights {
  if (typeof window === 'undefined') {
    // In non‑browser environments (e.g. SSR), return empty state.
    return { attempts: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { attempts: [] };
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.attempts)) {
      return { attempts: parsed.attempts as PracticeAttempt[] };
    }
  } catch (err) {
    console.warn('Failed to parse practice insights from localStorage:', err);
  }
  // Corrupt or missing data: reset storage
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return { attempts: [] };
}

/**
 * Persist the given practice insights to localStorage. This overwrites
 * any existing record. For batch writes, modify the object via
 * `loadInsights()` then call saveInsights().
 */
export function saveInsights(data: PracticeInsights): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save practice insights:', err);
  }
}

/**
 * Record a single practice attempt. Generates a unique id if none is
 * provided. The attempt is appended to the existing list and stored.
 */
export function recordAttempt(attempt: Omit<PracticeAttempt, 'id'> & { id?: string }): void {
  const data = loadInsights();
  const id =
    attempt.id ?? `${attempt.questionId}-${attempt.topicKey}-${Date.now().toString(36)}`;
  data.attempts.push({ ...attempt, id });
  saveInsights(data);
}

/**
 * Retrieve attempts within a given time range. If neither start nor
 * end is provided, returns all attempts. Timestamps are compared in
 * milliseconds since epoch.
 */
export function getAttempts(options: {
  start?: number;
  end?: number;
} = {}): PracticeAttempt[] {
  const { start, end } = options;
  const data = loadInsights();
  return data.attempts.filter((attempt) => {
    const ts = attempt.timestamp;
    if (start !== undefined && ts < start) return false;
    if (end !== undefined && ts > end) return false;
    return true;
  });
}

/**
 * Clear all recorded practice insights. Useful for debugging or when
 * resetting the user’s progress. Note: consider adding a confirmation
 * step in the UI when calling this function.
 */
export function clearInsights(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear practice insights:', err);
  }
}

/**
 * Compute a snapshot of practice insights for a given grade/subject/topic.
 *
 * This helper aggregates the student's practice attempts to identify
 * weak concepts and common mistakes.  It accepts a filter object
 * allowing callers to scope the analysis to a particular subject or
 * topic (grade is unused in this simple implementation but retained
 * for future extension).  Currently the algorithm simply counts
 * incorrect answers by topic and returns the top few as weak
 * concepts.  Common mistakes are not yet tracked in PracticeAttempt,
 * so the function returns an empty list for mistakes.  When no
 * attempts are recorded the returned arrays are empty.
 */
export function computePracticeInsights(options: {
  grade: number;
  subject: string;
  topic: string;
}): PracticeInsightSnapshot {
  // Load all attempts and filter by subject/topic.  At the moment
  // grade is not used because the PracticeAttempt model does not
  // include grade; this is reserved for future use.
  const attempts = getAttempts();
  const weakCounts: Record<string, number> = {};
  for (const a of attempts) {
    if (options.subject && a.subject !== options.subject.toLowerCase()) continue;
    if (options.topic && a.topicKey !== options.topic) continue;
    if (!a.correct) {
      const key = a.topicKey;
      weakCounts[key] = (weakCounts[key] ?? 0) + 1;
    }
  }
  const weakConcepts: PracticeWeakConcept[] = Object.entries(weakCounts)
    .map(([concept, count]) => ({ concept, count }))
    // Sort descending by count and take top 6 for brevity
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  // Common mistakes are not stored in PracticeAttempt; return empty list.
  const commonMistakes: PracticeCommonMistake[] = [];
  return { weakConcepts, commonMistakes };
}