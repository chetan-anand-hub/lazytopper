// src/data/predictionBlueprintMapping.ts
// Phase 0 – baseline blueprintSlotId mapping.
// This does NOT try to be the official CBSE blueprint yet.
// It simply gives each question a stable, human-readable slot ID based on
// subject + section + marks + topicKey. Later we can replace this with a
// proper mapping that uses blueprintConfig + topic trends.

import type { CanonicalQuestion } from "./predictionTypes";

/**
 * Normalise a string so it is safe to embed inside an ID.
 * Example: "Pair of Linear Equations" → "pairoflinarequations".
 */
function normaliseKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "") // keep only alphanumerics
    .slice(0, 24); // avoid very long IDs
}

/**
 * Compute a simple, stable blueprintSlotId for a question.
 * Example: "Maths-A-1-pairoflinearequations".
 */
export function computeBaselineBlueprintSlotId(q: CanonicalQuestion): string {
  const subject = q.subject;
  const sec = q.section || "X";
  const marks = q.marks ?? 0;
  const topic = normaliseKey(q.topicKey || "generic");
  return `${subject}-${sec}-${marks}-${topic}`;
}

/**
 * Attach baseline blueprintSlotIds to a list of canonical questions.
 * This is pure: returns a new array and does not mutate the input.
 */
export function applyBaselineBlueprintMapping(
  questions: CanonicalQuestion[]
): CanonicalQuestion[] {
  return questions.map((q) => ({
    ...q,
    blueprintSlotId: q.blueprintSlotId && q.blueprintSlotId !== ""
      ? q.blueprintSlotId
      : computeBaselineBlueprintSlotId(q),
  }));
}

