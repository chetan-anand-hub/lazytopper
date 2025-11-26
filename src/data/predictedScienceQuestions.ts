// src/data/predictedScienceQuestions.ts

import {
  class10SciencePredictiveEngine,
  type ScienceSubtopicQuestion,
} from "./class10SciencePredictiveEngine";

// Alias type for convenience (similar spirit to PredictedQuestion in Maths)
export type PredictedScienceQuestion = ScienceSubtopicQuestion;

/**
 * Flat bank of all predicted Science questions
 * (topic → subtopic → questions flattened).
 * You can plug this into MockPaper / diagnostics just like Maths.
 */
export const predictedScienceQuestions: PredictedScienceQuestion[] =
  class10SciencePredictiveEngine.topics.flatMap((topic) =>
    topic.subtopics.flatMap((sub) => sub.questions)
  );
