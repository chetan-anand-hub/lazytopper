// src/data/predictionCore.ts
//
// PredictionCore is a thin wrapper around the canonical question bank.  It
// provides helper functions to fetch questions by topic and to sort them
// by an optional prediction score.  In the full implementation these
// functions will incorporate policy weighting, recency and other factors.

import type { CanonicalQuestion } from "./predictionTypes";
import { canonicalQuestionBank } from "./canonicalQuestionBank";
import { QUESTION_TYPE_MULTIPLIER } from "../data/cbseCompetencyPolicy";

function getQuestionTypeMultiplier(q: CanonicalQuestion): number {
  // Map canonical formats to policy keys.
  const fmt = (q.format ?? "").toLowerCase();
  if (fmt === "mcq") return QUESTION_TYPE_MULTIPLIER.mcq ?? 1.0;
  if (fmt === "assertion-reasoning")
    return QUESTION_TYPE_MULTIPLIER.assertionReasoning ?? 1.0;
  if (fmt === "case-based") return QUESTION_TYPE_MULTIPLIER.caseBased ?? 1.0;
  // Long/Short/VSA tend to be more traditional unless explicitly tagged.
  if ((q.policyTag ?? "").toLowerCase().includes("case")) {
    return QUESTION_TYPE_MULTIPLIER.caseBased ?? 1.0;
  }
  return QUESTION_TYPE_MULTIPLIER.traditional ?? 1.0;
}

function getBloomMultiplier(q: CanonicalQuestion): number {
  // Lightweight heuristic: gently boost Applying/Analysing (competency focus).
  switch (q.bloomSkill) {
    case "Applying":
      return 1.12;
    case "Analysing":
      return 1.15;
    case "Evaluating":
      return 1.05;
    case "Remembering":
      return 0.92;
    default:
      return 1.0;
  }
}

function getAdjustedScore(q: CanonicalQuestion): number {
  const base = q.predictionScore ?? 1; // treat unscored items as neutral
  return base * getQuestionTypeMultiplier(q) * getBloomMultiplier(q);
}

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
      .sort((a, b) => getAdjustedScore(b) - getAdjustedScore(a));
  },
};
