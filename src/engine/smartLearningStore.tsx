// src/engine/smartLearningStore.tsx

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  type ChapterId,
  type ChapterMeta,
  type UserChapterStats,
  type HpqAttemptPayload,
  computeMatchScoreForChapter,
  applyHpqAttemptToStats,
} from "./smartLearningTypes.ts";

/**
 * Shape exposed by the Smart Learning context to React components.
 */
export interface SmartLearningState {
  /** All stats keyed by chapterId (e.g. "10-Maths-Polynomials") */
  statsByChapter: Record<ChapterId, UserChapterStats>;

  /** Get stats for a single chapter (if exists). */
  getStatsForChapter: (chapterId: ChapterId) => UserChapterStats | undefined;

  /**
   * Record a single HPQ attempt (correct/incorrect + time etc).
   * This uses applyHpqAttemptToStats under the hood.
   */
  recordHpqAttempt: (attempt: HpqAttemptPayload) => void;

  /**
   * Compute match score (Mark Yield) for a chapter for the current user,
   * using both board weightage and user stats.
   */
  getMatchScoreForChapter: (
    chapter: ChapterMeta,
    maxBoardWeightage: number
  ) => number;
}

const SmartLearningContext = createContext<SmartLearningState | undefined>(
  undefined
);

interface ProviderProps {
  children: ReactNode;
}

/**
 * Very small in-memory store.
 * - Lives only in React state (resets on full refresh)
 * - Good enough to test behaviour / UI before wiring backend.
 */
export const SmartLearningProvider: React.FC<ProviderProps> = ({
  children,
}) => {
  const [statsByChapter, setStatsByChapter] = useState<
    Record<ChapterId, UserChapterStats>
  >({});

  const getStatsForChapter = (chapterId: ChapterId) => statsByChapter[chapterId];

  const recordHpqAttempt = (attempt: HpqAttemptPayload) => {
    setStatsByChapter((prev) => {
      const prevStats = prev[attempt.chapterId];
      const nextStats = applyHpqAttemptToStats(prevStats, attempt);
      return {
        ...prev,
        [attempt.chapterId]: nextStats,
      };
    });
  };

  const getMatchScoreForChapter = (
    chapter: ChapterMeta,
    maxBoardWeightage: number
  ) => {
    const stats = statsByChapter[chapter.id];
    return computeMatchScoreForChapter({
      chapter,
      stats,
      maxBoardWeightage,
    });
  };

  const value = useMemo<SmartLearningState>(
    () => ({
      statsByChapter,
      getStatsForChapter,
      recordHpqAttempt,
      getMatchScoreForChapter,
    }),
    [statsByChapter]
  );

  return (
    <SmartLearningContext.Provider value={value}>
      {children}
    </SmartLearningContext.Provider>
  );
};

/**
 * Hook to use inside pages like TopicHub, HPQ page, Daily Mix, etc.
 */
export function useSmartLearning(): SmartLearningState {
  const ctx = useContext(SmartLearningContext);
  if (!ctx) {
    throw new Error(
      "useSmartLearning must be used inside <SmartLearningProvider>"
    );
  }
  return ctx;
}
