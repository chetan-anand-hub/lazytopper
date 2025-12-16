// LazyTopper – LLM Config
// Location: src/llm/llmConfig.ts
// Purpose: Central config for connecting to a *local or self-hosted*
// OpenAI-compatible LLM endpoint (e.g. LM Studio, Ollama, vLLM, etc.).
//
// This is designed for zero ongoing API cost: you run the model locally
// and point these env vars at that server.

export interface LLMConfig {
  baseUrl: string;
  model: string;
  apiKey: string | null;
}

export const LLM_CONFIG: LLMConfig = {
  // Example for LM Studio / local OpenAI-compatible server:
  // VITE_LLM_BASE_URL = "http://localhost:1234/v1"
  baseUrl: import.meta.env.VITE_LLM_BASE_URL ?? "http://localhost:1234/v1",
  // You can set VITE_LLM_MODEL to the local model id; the exact name depends
  // on your LLM host (e.g. "Meta-Llama-3-8B-Instruct", "qwen2.5-7b-instruct").
  model: import.meta.env.VITE_LLM_MODEL ?? "local-llm",
  // Many local servers ignore the API key but still expect the header; you can
  // set any dummy value such as "lm-studio" or leave it empty.
  apiKey: import.meta.env.VITE_LLM_API_KEY ?? null,
};