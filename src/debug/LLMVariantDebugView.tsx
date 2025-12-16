// LazyTopper – LLM Variant Debug View
// Location: src/debug/LLMVariantDebugView.tsx
// Purpose: Dev-only screen to generate CBSE-style AI question variants
//          for a given topic/concept using a local LLM, seeded by the
//          existing predictive / HPQ bank.

import { useState, type FC } from "react";
import { PredictionCore } from "../data/predictionCore";
import type {
  CanonicalQuestion,
  LTSubjectKey,
} from "../data/predictionTypes";
import {
  generateHPQVariantsWithLLM,
  type HPQLLMGenerationResult,
} from "../llm/llmQuestionGenerator";

interface LLMVariantDebugViewProps {}

const SUBJECT_OPTIONS: Array<{ label: string; value: LTSubjectKey }> = [
  { label: "Maths", value: "Maths" as LTSubjectKey },
  { label: "Science", value: "Science" as LTSubjectKey },
];

export const LLMVariantDebugView: FC<LLMVariantDebugViewProps> = () => {
  const [subject, setSubject] = useState<LTSubjectKey>("Science" as LTSubjectKey);
  const [topicKey, setTopicKey] = useState<string>("");
  const [conceptKey, setConceptKey] = useState<string>("");
  const [maxSeeds, setMaxSeeds] = useState<number>(3);
  const [totalVariants, setTotalVariants] = useState<number>(6);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<HPQLLMGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setResult(null);

    const trimmedTopic = topicKey.trim();
    if (!trimmedTopic) {
      setError("TopicKey is required. Use the canonical topicKey from Trends / TopicHub.");
      return;
    }

    setIsLoading(true);
    try {
      // Get predictive candidates from PredictionCore; this is the same helper
      // used by practiceSetGenerator.
      let candidates: CanonicalQuestion[] = PredictionCore.getLikelyQuestionsForConcept(
        trimmedTopic,
        conceptKey.trim() || undefined
      ) as CanonicalQuestion[];

      // Filter by subject if present on questions.
      candidates = candidates.filter((q: any) => {
        const subj = String(q.subject ?? "").trim();
        return !subj || subj === subject;
      });

      if (!candidates.length) {
        setError("No predictive/HPQ questions found for this topic/concept. Check topicKey or populate the bank first.");
        setIsLoading(false);
        return;
      }

      const seeds = candidates.slice(0, Math.max(1, maxSeeds));

      const llmResult = await generateHPQVariantsWithLLM({
        subject,
        topicKey: trimmedTopic,
        conceptKey: conceptKey.trim() || undefined,
        seeds,
        totalVariants: Math.max(1, totalVariants),
      });

      setResult(llmResult);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("Error while generating LLM variants:", e);
      setError(e?.message || "Unexpected error while calling the local LLM.");
    } finally {
      setIsLoading(false);
    }
  };

  const jsonSnippet =
    result && result.generated
      ? JSON.stringify(result.generated, null, 2)
      : "";

  return (
    <div className="lt-debug-root lt-llm-debug-root">
      <div className="lt-debug-section">
        <h2>LLM Variants – HPQ Seeded Generator</h2>
        <p>
          This dev-only tool calls your <strong>local LLM</strong> (OpenAI-compatible
          server configured via <code>VITE_LLM_BASE_URL</code> and{" "}
          <code>VITE_LLM_MODEL</code>) to generate fresh CBSE-style questions for
          a topic. It always anchors on your existing predictive/HPQ bank via{" "}
          <code>PredictionCore.getLikelyQuestionsForConcept</code>.
        </p>

        <div className="lt-llm-controls">
          <div className="lt-llm-control">
            <label>
              Subject:{" "}
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as LTSubjectKey)}
              >
                {SUBJECT_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="lt-llm-control">
            <label>
              Topic key:{" "}
              <input
                type="text"
                value={topicKey}
                onChange={(e) => setTopicKey(e.target.value)}
                placeholder='e.g. "SCI-PHYS-LIGHT", "MATHS-ALG-REAL"'
              />
            </label>
          </div>

          <div className="lt-llm-control">
            <label>
              Concept key (optional):{" "}
              <input
                type="text"
                value={conceptKey}
                onChange={(e) => setConceptKey(e.target.value)}
                placeholder="Optional narrower concept key"
              />
            </label>
          </div>

          <div className="lt-llm-control">
            <label>
              Max seed questions:{" "}
              <input
                type="number"
                min={1}
                max={10}
                value={maxSeeds}
                onChange={(e) =>
                  setMaxSeeds(Math.max(1, Number(e.target.value) || 1))
                }
              />
            </label>
          </div>

          <div className="lt-llm-control">
            <label>
              Total variants to generate:{" "}
              <input
                type="number"
                min={1}
                max={40}
                value={totalVariants}
                onChange={(e) =>
                  setTotalVariants(Math.max(1, Number(e.target.value) || 1))
                }
              />
            </label>
          </div>

          <div className="lt-llm-control">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate LLM variants"}
            </button>
          </div>
        </div>

        {error && (
          <p className="lt-llm-error">
            {error}
          </p>
        )}

        {result && !error && (
          <div className="lt-llm-results">
            <h3>
              Generated questions ({result.generated.length})
            </h3>

            <ol className="lt-llm-question-list">
              {result.generated.map((q, index) => (
                <li key={q.id || index}>
                  <p>
                    <strong>{index + 1}.</strong>{" "}
                    <span>{q.questionText}</span>
                  </p>
                  <p className="lt-llm-meta">
                    {q.marks} marks · {q.difficulty || "Medium"}{" "}
                    {q.bloomSkill && <>· {q.bloomSkill}</>}
                  </p>
                </li>
              ))}
            </ol>

            <h4>JSON snippet (copy into your bank / variants adapter)</h4>
            <textarea
              readOnly
              value={jsonSnippet}
              className="lt-llm-json-snippet"
              rows={Math.min(24, Math.max(6, jsonSnippet.split("\n").length))}
            />

            {result.rawOutput && (
              <details className="lt-llm-raw-output">
                <summary>Raw LLM output (debug)</summary>
                <pre>{result.rawOutput}</pre>
              </details>
            )}
          </div>
        )}

        {!result && !error && !isLoading && (
          <p className="lt-llm-note">
            Tip: start with a topic that already has a solid predictive bank
            (e.g., Electricity, Real Numbers), generate a few variants, and
            then paste the JSON into a separate data file for manual review.
          </p>
        )}
      </div>
    </div>
  );
};

export default LLMVariantDebugView;