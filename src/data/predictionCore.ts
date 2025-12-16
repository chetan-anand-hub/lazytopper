// src/data/predictionCore.ts
//
// PredictionCore is a thin wrapper around the canonical question bank.  It
// provides helper functions to fetch questions by topic and to sort them
// by an optional prediction score.  In the full implementation these
// functions will incorporate policy weighting, recency and other factors.

import type { CanonicalQuestion } from "./predictionTypes";
import { canonicalQuestionBank } from "./canonicalQuestionBank";

export const PredictionCore = {
  /**
   * Return all canonical questions (Maths + Science).
   */
  getAllQuestions(): CanonicalQuestion[] {
    return canonicalQuestionBank;
  },

  /**
   * Lookup a question by ID.
   */
  getQuestionById(id: string): CanonicalQuestion | undefined {
    return canonicalQuestionBank.find((q) => q.id === id);
  },

  /**
   * Get likely questions for a topic / concept key.
   * Questions are sorted in descending order of predictionScore (if present);
   * undefined scores default to zero.
   */
  getLikelyQuestionsForConcept(
    topicKey: string,
    conceptKey?: string
  ): CanonicalQuestion[] {
    return canonicalQuestionBank
      .filter((q) => q.topicKey === topicKey)
      .filter((q) => (conceptKey ? q.subtopic === conceptKey : true))
      .sort((a, b) => (b.predictionScore ?? 0) - (a.predictionScore ?? 0));
  },
};
