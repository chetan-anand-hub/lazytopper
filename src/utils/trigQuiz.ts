// src/utils/trigQuiz.ts

import type { TrigQuestion } from "../data/trigQuestions";
import { TRIG_QUESTION_BANK } from "../data/trigQuestions";

/**
 * Shuffle an array (Fisher–Yates)
 */
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Generate a fresh trigonometry quiz.
 * Default: 15 questions, but you can pass a different number if needed.
 */
export function generateTrigQuiz(numQuestions: number = 15): TrigQuestion[] {
  const shuffled = shuffleArray<TrigQuestion>(TRIG_QUESTION_BANK);
  return shuffled.slice(0, Math.min(numQuestions, shuffled.length));
}
