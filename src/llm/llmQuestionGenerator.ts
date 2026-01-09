// LazyTopper – LLM Question Generator
// Location: src/llm/llmQuestionGenerator.ts
// Purpose: Bridge between PredictionCore / CanonicalQuestion and the
//          generic LLM client for generating near-duplicate variants.

import type {
  CanonicalQuestion,
  LTSubjectKey,
} from "../data/predictionTypes";
import { generateQuestionsViaLLM } from "./llmClient";
import type {
  LLMQuestionGenerationConfig,
  LLMQuestionSeed,
  LLMGeneratedQuestion,
  LLMQuestionResponse,
} from "./llmQuestionTypes";

export interface HPQLLMGenerationArgs {
  subject: LTSubjectKey;
  topicKey: string;
  conceptKey?: string;
  seeds: CanonicalQuestion[];
  totalVariants: number;
  variantsPerSeed?: number;
}

export interface HPQLLMGenerationResult extends LLMQuestionResponse {
  generated: LLMGeneratedQuestion[];
}

// Convert CanonicalQuestion into the minimal seed shape the LLM needs.
function toSeed(q: CanonicalQuestion, subject: LTSubjectKey): LLMQuestionSeed {
  const anyQ: any = q;

  return {
    id: String(anyQ.id ?? anyQ.questionId ?? ""),
    subject,
    topicKey: String(anyQ.topicKey ?? ""),
    conceptKey: anyQ.conceptKey ?? anyQ.subtopicKey ?? undefined,
    marks: typeof anyQ.marks === "number" ? anyQ.marks : 2,
    difficulty: anyQ.canonicalDifficulty ?? anyQ.difficulty,
    bloomSkill: anyQ.bloomSkill ?? anyQ.bloomLevel ?? "",
    questionText: String(anyQ.questionText ?? anyQ.text ?? ""),
  };
}

export async function generateHPQVariantsWithLLM(
  args: HPQLLMGenerationArgs
): Promise<HPQLLMGenerationResult> {
  const { subject, topicKey, conceptKey, seeds, totalVariants } = args;
  const variantsPerSeed =
    args.variantsPerSeed && args.variantsPerSeed > 0
      ? args.variantsPerSeed
      : Math.max(1, Math.round(totalVariants / Math.max(1, seeds.length)));

  const config: LLMQuestionGenerationConfig = {
    subject,
    topicKey,
    conceptKey,
    totalVariants,
    variantsPerSeed,
    systemStyle: "strict-board",
  };

  const requestSeeds: LLMQuestionSeed[] = seeds.map((q) =>
    toSeed(q, subject)
  );

  const response = await generateQuestionsViaLLM({
    config,
    seeds: requestSeeds,
  });

  return {
    ...response,
    generated: response.questions,
  };
}