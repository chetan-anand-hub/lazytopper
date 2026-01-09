// LazyTopper – LLM Client
// Location: src/llm/llmClient.ts
// Purpose: Minimal OpenAI-compatible chat client for local / self-hosted LLM.
// Designed to be used from the browser (debug tools) only.

import { LLM_CONFIG } from "./llmConfig";
import type { LLMQuestionRequest, LLMQuestionResponse } from "./llmQuestionTypes";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
  }>;
  model?: string;
}

async function callChatCompletion(
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number
): Promise<{ content: string; model?: string }> {
  const url = `${LLM_CONFIG.baseUrl.replace(/\/$/, "")}/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (LLM_CONFIG.apiKey) {
    headers.Authorization = `Bearer ${LLM_CONFIG.apiKey}`;
  }

  const body = JSON.stringify({
    model: LLM_CONFIG.model,
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(`LLM HTTP error ${response.status}: ${response.statusText}`);
  }

  const json = (await response.json()) as ChatCompletionResponse;
  const content =
    json.choices?.[0]?.message?.content?.trim() ?? "";

  return {
    content,
    model: json.model,
  };
}

// High-level helper tailored for our question-generation schema.
// It expects the backend LLM to return a JSON object that matches
// LLMQuestionResponse; if parsing fails, we fall back to wrapping
// the raw text as a single "question".
export async function generateQuestionsViaLLM(
  req: LLMQuestionRequest
): Promise<LLMQuestionResponse> {
  const {
    config: {
      systemStyle = "strict-board",
      temperature = 0.3,
      maxTokens = 900,
    },
    seeds,
    promptOverride,
  } = req;

  const systemPrompt =
    systemStyle === "board-plus-explainer"
      ? "You are an expert CBSE Class 10 Maths & Science board question setter and explainer. You strictly follow the CBSE blueprint, mark scheme, and language tone."
      : "You are an expert CBSE Class 10 Maths & Science board question setter. You strictly mirror CBSE exam pattern, blueprint, and mark scheme. No tricks, no off-syllabus content.";

  const seedSummaries = seeds
    .map((s, index) => {
      const parts: string[] = [];
      parts.push(`Seed ${index + 1} (id: ${s.id})`);
      parts.push(`Subject: ${s.subject}`);
      parts.push(`TopicKey: ${s.topicKey}`);
      if (s.conceptKey) parts.push(`ConceptKey: ${s.conceptKey}`);
      parts.push(`Marks: ${s.marks}`);
      if (s.difficulty) parts.push(`Difficulty: ${s.difficulty}`);
      if (s.bloomSkill) parts.push(`BloomSkill: ${s.bloomSkill}`);
      parts.push(`Question: ${s.questionText}`);
      return parts.join(" | ");
    })
    .join("\n\n");

  const userPrompt =
    promptOverride ||
    [
      "You are helping generate fresh board-style practice questions for CBSE Class 10.",
      "You will be given a small set of *seed* questions that are already good CBSE exam-style items.",
      "",
      "For these seeds, generate new questions that:",
      "- Stay on the exact same *concept* and difficulty band as the seeds.",
      "- Keep the same marks for each variant.",
      "- Change the story/numbers/wording so they are not trivial rephrasings.",
      "- Preserve CBSE tone, with clear statements and no slang.",
      "",
      `Total variants requested: ${req.config.totalVariants} (approximately ${req.config.variantsPerSeed} per seed).`,
      "",
      "VERY IMPORTANT OUTPUT FORMAT:",
      "- Respond with a single JSON object only.",
      '- Shape: { "questions": [ { ... }, ... ] }',
      "- For each generated question use the fields:",
      '  seedId, subject, topicKey, conceptKey, marks, difficulty, bloomSkill, questionText, answer, solutionSteps (array of strings).',
      "- Do not include comments or explanations outside the JSON.",
      "",
      "Here are the seeds:",
      seedSummaries || "(no seeds provided)",
    ].join("\n");

  const { content, model } = await callChatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    maxTokens
  );

  let parsed: LLMQuestionResponse | null = null;

  try {
    parsed = JSON.parse(content) as LLMQuestionResponse;
  } catch {
    // Fall back to wrapping the raw content as a single 'question' if parsing fails.
  }

  if (!parsed || !Array.isArray(parsed.questions)) {
    const firstSeed = seeds[0];
    return {
      questions: [
        {
          id: "llm-fallback-0",
          seedId: firstSeed?.id ?? "",
          subject: firstSeed?.subject ?? req.config.subject,
          topicKey: firstSeed?.topicKey ?? req.config.topicKey,
          conceptKey: firstSeed?.conceptKey ?? req.config.conceptKey,
          marks: firstSeed?.marks ?? 2,
          difficulty: firstSeed?.difficulty ?? "Medium",
          bloomSkill: firstSeed?.bloomSkill,
          questionText: content.trim(),
          answer: "",
          solutionSteps: [],
          meta: {
            source: "llm",
            model: model ?? LLM_CONFIG.model,
            createdAt: new Date().toISOString(),
          },
        },
      ],
      rawPrompt: userPrompt,
      rawOutput: content,
    };
  }

  return {
    questions: parsed.questions.map((q, idx) => ({
      ...q,
      id: q.id || `llm-${idx}`,
      subject: q.subject ?? req.config.subject,
      topicKey: q.topicKey ?? req.config.topicKey,
      conceptKey: q.conceptKey ?? req.config.conceptKey,
      marks: q.marks ?? seeds[0]?.marks ?? 2,
      difficulty: q.difficulty || "Medium",
      solutionSteps: Array.isArray(q.solutionSteps) ? q.solutionSteps : [],
      meta: {
        source: "llm",
        model: q.meta?.model ?? model ?? LLM_CONFIG.model,
        createdAt: q.meta?.createdAt ?? new Date().toISOString(),
      },
    })),
  };
}