// LazyTopper – LLM Question Types
// Location: src/llm/llmQuestionTypes.ts
// Purpose: Shared types for the LLM question generation pipeline.

import type { LTSubjectKey } from "../data/predictionTypes";

// Minimal seed view of a canonical predictive / HPQ question.
// We keep this intentionally loose so the LLM pipeline is not tightly
// coupled to the full CanonicalQuestion type.
export interface LLMQuestionSeed {
  id: string;
  subject: LTSubjectKey;
  topicKey: string;
  conceptKey?: string;
  marks: number;
  difficulty?: string;
  bloomSkill?: string;
  questionText: string;
}

export interface LLMQuestionGenerationConfig {
  subject: LTSubjectKey;
  topicKey: string;
  conceptKey?: string;
  totalVariants: number;
  variantsPerSeed: number;
  // Prompt flavour and decoding knobs – safe defaults chosen.
  systemStyle?: "strict-board" | "board-plus-explainer";
  temperature?: number;
  maxTokens?: number;
}

export interface LLMGeneratedQuestion {
  id: string;
  seedId: string;
  subject: LTSubjectKey;
  topicKey: string;
  conceptKey?: string;
  marks: number;
  difficulty: string;
  bloomSkill?: string;
  questionText: string;
  answer: string;
  solutionSteps: string[];
  meta: {
    source: "llm";
    model?: string;
    createdAt: string;
  };
}

export interface LLMQuestionRequest {
  config: LLMQuestionGenerationConfig;
  seeds: LLMQuestionSeed[];
  // Optional: if you want to override the auto-built prompt on the backend.
  promptOverride?: string;
}

export interface LLMQuestionResponse {
  questions: LLMGeneratedQuestion[];
  rawPrompt?: string;
  rawOutput?: string;
}