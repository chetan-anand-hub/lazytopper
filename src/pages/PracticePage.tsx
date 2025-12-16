// src/pages/PracticePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { type PracticeQuestion } from "../data/predictionDataService";
import { generatePracticeSet } from "../data/practiceSetGenerator";
import { promptDPracticePacks } from "../data/promptDPracticePacks";
import { callMentor, generateMoreLikeThis } from "../ai/aiClient";
import type { MentorMode } from "../ai/aiClient";

type SubjectKey = "Maths" | "Science";
type DifficultyChoice = "All" | "Easy" | "Medium" | "Hard";

type InternalDifficultyBucket = "Easy" | "Medium" | "Hard";

function difficultyChoiceToMix(
  choice: DifficultyChoice
): Partial<Record<InternalDifficultyBucket, number>> {
  switch (choice) {
    case "Easy":
      return { Easy: 1 };
    case "Medium":
      return { Medium: 1 };
    case "Hard":
      return { Hard: 1 };
    case "All":
    default:
      return {};
  }
}

function buildPracticeQuestionsFromEngine(args: {
  subjectKey: SubjectKey;
  topicKey: string;
  count: number;
  difficulty: DifficultyChoice;
  subtopicHint?: string;
  focusBankIds?: string[];
}): PracticeQuestion[] {
  const safeCount = Math.max(3, Math.min(25, args.count || 10));
  const difficultyMix = difficultyChoiceToMix(args.difficulty);

  const practiceSet = generatePracticeSet({
    // practiceSetGenerator expects lower-case subject keys.
    subject: (args.subjectKey.toLowerCase() as any),
    topicKey: args.topicKey,
    totalQuestions: safeCount,
    difficultyMix: Object.keys(difficultyMix).length
      ? (difficultyMix as any)
      : undefined,
  });

  let candidates = [...(practiceSet.questions as any[])];

  // Prefer any explicitly focused bank IDs by moving them to the front.
  if (args.focusBankIds && args.focusBankIds.length > 0) {
    const focusSet = new Set(args.focusBankIds.map(String));
    const focused: any[] = [];
    const others: any[] = [];
    for (const q of candidates) {
      const id = String((q as any).id ?? "");
      if (focusSet.has(id)) {
        focused.push(q);
      } else {
        others.push(q);
      }
    }
    candidates = [...focused, ...others];
  }

  // Prefer questions whose concept/subtopic matches the subtopic hint, if provided.
  if (args.subtopicHint && args.subtopicHint.trim()) {
    const hint = args.subtopicHint.trim().toLowerCase();
    const matches: any[] = [];
    const nonMatches: any[] = [];
    for (const q of candidates) {
      const concept = String(
        (q as any).conceptKey ?? (q as any).subtopicKey ?? ""
      ).toLowerCase();
      if (concept && concept.includes(hint)) {
        matches.push(q);
      } else {
        nonMatches.push(q);
      }
    }
    candidates = [...matches, ...nonMatches];
  }

  const sliced = candidates.slice(0, safeCount);

  return sliced.map((q, index) => {
    const anyQ: any = q;
    const id = anyQ.id ?? anyQ.questionId ?? `Q-${index + 1}`;
    const marks = anyQ.marks != null ? anyQ.marks : 1;
    const difficultyLabel =
      anyQ.canonicalDifficulty ?? anyQ.difficulty ?? args.difficulty ?? "Medium";

    return {
      id: String(id),
      marks,
      difficulty: difficultyLabel,
      section: anyQ.section ?? anyQ.sectionLabel ?? "",
      bloomSkill: anyQ.bloomSkill ?? anyQ.bloomLevel ?? "",
      questionText: anyQ.questionText ?? anyQ.text ?? "",
      solutionSteps: anyQ.solutionSteps ?? [],
      explanation: anyQ.explanation ?? "",
      answer: anyQ.answer ?? "",
    } as PracticeQuestion;
  });
}

function normaliseKey(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function resolveTopicKey(args: {
  subjectKey: SubjectKey;
  topicParam: string;
  explicitTopicKey?: string | null;
}): string {
  const subjectLower = args.subjectKey.toLowerCase() as "maths" | "science";
  const packsForSubject = (promptDPracticePacks as any)[subjectLower] as
    | Record<string, any>
    | undefined;

  // 1) Prefer explicit topicKey (from query or navigation state)
  if (args.explicitTopicKey) {
    const key = normaliseKey(args.explicitTopicKey);
    if (packsForSubject?.[key]) return key;
    // if it's already a valid key, keep as-is
    if (packsForSubject?.[args.explicitTopicKey]) return args.explicitTopicKey;
  }

  // 2) Direct slug of the topicParam
  const slug = normaliseKey(args.topicParam);
  if (packsForSubject?.[slug]) return slug;

  // 3) Match by topicName in packs (handles cases like
  // "Our Environment / Sources of Energy" => "our_environment")
  if (packsForSubject) {
    const target = normaliseKey(args.topicParam);
    for (const [key, pack] of Object.entries(packsForSubject)) {
      const packName = normaliseKey((pack as any)?.topicName ?? "");
      if (!packName) continue;
      if (target === packName) return key;
      if (target.startsWith(packName)) return key;
    }
  }

  // Fallback to slug so at least we have a deterministic value.
  return slug || "generic";
}

function normaliseSubject(raw?: string | null): SubjectKey {
  const val = (raw || "").toLowerCase();
  if (val === "science" || val === "sci") return "Science";
  return "Maths";
}

/**
 * Strip Markdown code fences and try to unwrap JSON payloads into a plain
 * question string. This is used mainly for AI-generated variants.
 */
function normaliseQuestionText(raw: string | undefined | null): string {
  if (!raw) return "";
  let text = raw.trim();

  // Remove ```lang ... ``` fences if present.
  if (text.startsWith("```")) {
    const firstNewline = text.indexOf("\n");
    if (firstNewline !== -1) {
      text = text.slice(firstNewline + 1);
    }
    const lastFence = text.lastIndexOf("```");
    if (lastFence !== -1) {
      text = text.slice(0, lastFence);
    }
    text = text.trim();
  }

  // If it looks like JSON, try to parse and pull out the first questionText.
  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      const data: any = JSON.parse(text);
      if (Array.isArray(data) && data[0]?.questionText) {
        return String(data[0].questionText).trim();
      }
      if (data && typeof data === "object") {
        if (Array.isArray(data.questions) && data.questions[0]?.questionText) {
          return String(data.questions[0].questionText).trim();
        }
      }
    } catch {
      // fall through – we'll just return the raw text.
    }
  }

  return text;
}

/**
 * Very lightweight LaTeX/markdown cleaner so mentor answers read like normal
 * CBSE solutions instead of raw TeX.
 */
function normaliseMentorAnswer(raw: string | undefined | null): string {
  if (!raw) return "";
  let text = raw.trim();

  // Strip code fences like ```math ... ```
  if (text.startsWith("```")) {
    const parts = text.split("```");
    text = parts
      .filter((part) => !/^(json|math|latex)/i.test(part.trim()))
      .join("")
      .trim();
  }

  // Remove common inline math wrappers.
  text = text.replace(/\\\(/g, "").replace(/\\\)/g, "");
  text = text.replace(/\\\[/g, "").replace(/\\\]/g, "");
  text = text.replace(/\$/g, "");

  // Replace basic LaTeX commands with readable text.
  text = text.replace(/\\cdot/g, "×");
  text = text.replace(/\\times/g, "×");
  text = text.replace(/\\sqrt\{([^}]+)\}/g, "√$1");
  text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1/$2");

  // Remove stray dollar signs and collapse whitespace.
  text = text.replace(/\$/g, "");
  text = text.replace(/\s+$/gm, "");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

type MentorButtonMode = Extract<MentorMode, "solve" | "explain">;

interface MentorReplyState {
  mode: MentorButtonMode;
  text?: string;
  isLoading: boolean;
  error?: string | null;
}

interface AiTopupArgs {
  grade: string;
  subjectKey: SubjectKey;
  /**
   * Human-readable topic label (matches canonicalQuestionBank topicKey values).
   * Example: "Real Numbers", "Polynomials".
   */
  topicLabel: string;
  /**
   * Normalised topic key used by Prompt-D practice packs.
   * Example: "real_numbers", "polynomials".
   */
  packTopicKey: string;
  count: number;
  difficulty: DifficultyChoice;
  subtopicHint?: string;
  focusBankIds?: string[];
}

/**
 * Generate a bank-backed practice set, then top it up with AI variants
 * if we still don't have enough questions.
 */
async function buildPracticeQuestionsWithAiTopup(
  args: AiTopupArgs
): Promise<PracticeQuestion[]> {
  const safeCount = Math.max(3, Math.min(25, args.count || 10));

  // 1) Try the canonical/trends engine first (uses display-topic keys)
  const engineQuestions = buildPracticeQuestionsFromEngine({
    subjectKey: args.subjectKey,
    topicKey: args.topicLabel,
    count: safeCount,
    difficulty: args.difficulty,
    subtopicHint: args.subtopicHint,
    focusBankIds: args.focusBankIds,
  });

  // 2) If the engine has no coverage for this topic, fall back to Prompt-D packs
  // (these are curated topic packs keyed by snake_case, and should never show
  // placeholder "Generate a CBSE..." text).
  const subjectLower = args.subjectKey.toLowerCase() as "maths" | "science";
  const pack = (promptDPracticePacks as any)?.[subjectLower]?.[args.packTopicKey];
  const packQuestions: PracticeQuestion[] = Array.isArray(pack?.questions)
    ? (pack.questions as any[]).map((q) => ({
        // Keep fields compatible with the PracticeQuestion type used by the UI.
        id: String(q.id ?? ""),
        marks: Number(q.marks ?? 1),
        difficulty: (q.difficulty ?? "Medium") as any,
        section: (q.section ?? "") as any,
        bloomSkill: (q.bloomSkill ?? "Understanding") as any,
        questionText: String(q.text ?? q.questionText ?? "").trim(),
        solutionSteps: (q.solutionSteps ?? []) as any,
        explanation: (q.explanation ?? "") as any,
        answer: (q.answer ?? "") as any,
        // Preserve any extra fields that downstream renderers might use.
        ...(q as any),
      }))
    : [];

  const bankQuestions = engineQuestions.length > 0 ? engineQuestions : packQuestions;

  const baseQuestions = bankQuestions.slice(0, safeCount);
  const missing = safeCount - baseQuestions.length;

  if (missing <= 0) {
    return baseQuestions;
  }

  // Build a seed question so AI has context even if the bank is empty.
  const seedFromBank: PracticeQuestion | undefined = baseQuestions[0];
  const fallbackDifficulty: InternalDifficultyBucket =
    args.difficulty === "All"
      ? "Medium"
      : (args.difficulty as InternalDifficultyBucket);

  // If we have at least one bank question, use it as the seed; otherwise
  // derive sensible defaults for each field separately.  Avoid constructing
  // an inline literal and casting to PracticeQuestion because the
  // PracticeQuestion type imported from predictionDataService has many
  // required properties (subject, topicKey, etc.) that our fallback object
  // doesn't provide.  Instead, compute each value on demand.
  const seed: PracticeQuestion | undefined = seedFromBank;
  // Derive fallback values for seed fields.  These will be used when
  // seedFromBank is undefined.  Doing it this way avoids a type assertion
  // on a partial object and keeps type checking intact.
  const seedId = seed?.id ?? "GENERIC-SEED";
  const seedMarks = seed?.marks ?? 3;
  const seedDifficulty: InternalDifficultyBucket =
    (seed?.difficulty as InternalDifficultyBucket) ?? fallbackDifficulty;
  const seedBloomSkill = (seed as any)?.bloomSkill ?? "Understanding";
  const seedQuestionText =
    seed?.questionText ??
    `Generate a CBSE Class ${args.grade} ${args.subjectKey} question for topic "${args.topicLabel}" at ${fallbackDifficulty} level.`;

  try {
    const response = await generateMoreLikeThis({
      subject: args.subjectKey,
      topicKey: args.topicLabel,
      seedQuestion: {
        text: seedQuestionText ?? "",
        marks: seedMarks,
        // Only pass a difficulty if it is a valid bucket; otherwise leave
        // undefined to let the generator decide.  We rely on our derived
        // seedDifficulty value above, which is always a valid InternalDifficultyBucket.
        difficulty: seedDifficulty,
        bloomSkill: seedBloomSkill,
      },
      numVariants: missing,
    });

    const variants = response?.variants ?? [];

    // IMPORTANT: Do NOT construct a partial object and cast to PracticeQuestion.
    // PracticeQuestion (from predictionDataService) may include required fields
    // like subject/topic metadata. Instead, clone a real bank question template
    // and only override the fields we actually want to change.
    const template: PracticeQuestion | undefined = seed ?? baseQuestions[0];

    // If we somehow have no template (empty bank and no seed), skip AI top-up to
    // avoid emitting broken placeholder questions.
    const aiQuestions: PracticeQuestion[] = !template
      ? []
      : variants.map((variant, index) => {
          const variantText = normaliseQuestionText(variant.text);

          return {
            ...template,
            id: `${seedId}-AI-${index + 1}`,
            marks: variant.marks != null ? variant.marks : template.marks ?? seedMarks ?? 1,
            difficulty:
              ((variant.difficulty as PracticeQuestion["difficulty"]) ??
                (template.difficulty as PracticeQuestion["difficulty"])) ??
              (fallbackDifficulty as PracticeQuestion["difficulty"]),
            section: (template as any).section ?? "",
            bloomSkill:
              (variant.bloomSkill as any) ??
              ((template as any).bloomSkill ?? seedBloomSkill ?? ""),
            questionText: variantText || (template as any).questionText || seedQuestionText,
            solutionSteps: (template as any).solutionSteps ?? [],
            explanation: (template as any).explanation ?? "",
            answer: (template as any).answer ?? "",
          };
        });

    const merged = [...baseQuestions, ...aiQuestions];
    return merged.slice(0, safeCount);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("AI top-up failed for practice set:", err);
    return baseQuestions;
  }
}

const PracticePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ grade?: string; subject?: string }>();

  const grade = params.grade || "10";
  const subjectKey: SubjectKey = normaliseSubject(params.subject ?? "Maths");

  // Topic from query string
  const search = new URLSearchParams(location.search);
  const topicParam = search.get("topic") || "Generic";
  const topicKeyParam = search.get("topicKey");

  // Navigation state for Back button + label
  const navState = (location.state as any) || {};
  const back: string | undefined = navState.back;
  const backLabel: string =
    navState.backLabel ||
    (back && typeof back === "string" && back.includes("/trends")
      ? "Back to trends"
      : "Back");

  // Optional practice filters passed from Trends / HPQ / TopicHub
  const practiceFilters = (navState.practiceFilters || {}) as {
    subtopicHint?: string;
    focusBankIds?: string[];
    recommendedCount?: number;
    difficultyPreset?: DifficultyChoice;
  };
  const subtopicHint = practiceFilters.subtopicHint;
  const focusBankIds = practiceFilters.focusBankIds;
  const recommendedCountFromNav = practiceFilters.recommendedCount;
  const difficultyPreset = practiceFilters.difficultyPreset;

  const initialCount =
    recommendedCountFromNav && recommendedCountFromNav > 0
      ? recommendedCountFromNav
      : 10;

  const [questionCount, setQuestionCount] = useState<number>(initialCount);
  const [difficulty, setDifficulty] = useState<DifficultyChoice>(
    difficultyPreset || "All"
  );
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedAnswers, setExpandedAnswers] = useState<
    Record<string, boolean>
  >({});
  const [mentorReplies, setMentorReplies] = useState<
    Record<string, MentorReplyState>
  >({});
  const [regenerationKey, setRegenerationKey] = useState<number>(0);

  // Two topic identifiers are used:
  // - topicLabel: display name used by the canonical bank (e.g., "Real Numbers")
  // - packTopicKey: snake_case key used by Prompt-D packs (e.g., "real_numbers")
  const topicLabel = topicParam;
  const packTopicKey = useMemo(() => {
    const explicitFromState = (navState as any)?.topicKey as string | undefined;
    return resolveTopicKey({
      subjectKey,
      topicParam,
      explicitTopicKey: topicKeyParam || explicitFromState || null,
    });
  }, [subjectKey, topicParam, topicKeyParam, navState]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const next = await buildPracticeQuestionsWithAiTopup({
          grade,
          subjectKey,
          topicLabel,
          packTopicKey,
          count: questionCount,
          difficulty,
          subtopicHint,
          focusBankIds,
        });

        if (!cancelled) {
          setQuestions(next);
          setExpandedAnswers({});
          setMentorReplies({});
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error generating practice questions:", e);
        if (!cancelled) {
          setQuestions([]);
          setError(
            "Could not generate practice questions right now. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    grade,
    subjectKey,
    topicLabel,
    packTopicKey,
    questionCount,
    difficulty,
    subtopicHint,
    focusBankIds,
    regenerationKey,
  ]);

  const regenerateQuestions = () => {
    setRegenerationKey((prev) => prev + 1);
  };

  const handleToggleAnswer = (id: string) => {
    setExpandedAnswers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleBack = () => {
    if (back) {
      navigate(back);
    } else {
      navigate(`/trends/${grade}/${subjectKey}`);
    }
  };

  const handleAskMentor = async (
    question: PracticeQuestion,
    mode: MentorButtonMode
  ) => {
    const key = question.id;
    const existing = mentorReplies[key];

    // If the same mode is already open and not loading, collapse it.
    if (existing && !existing.isLoading && existing.mode === mode) {
      setMentorReplies((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    setMentorReplies((prev) => ({
      ...prev,
      [key]: { mode, isLoading: true, text: existing?.text, error: null },
    }));

    try {
      const response = await callMentor(mode as MentorMode, {
        subject: subjectKey,
        // Prefer the human-readable label for mentor prompts; fall back to the
        // pack key if label is missing.
        topicKey: topicLabel || packTopicKey || topicParam || "",
        questionText: question.questionText,
        marks: question.marks,
      });

      const clean = normaliseMentorAnswer(response?.data?.text ?? "");
      setMentorReplies((prev) => ({
        ...prev,
        [key]: {
          mode,
          isLoading: false,
          text: clean || "Mentor could not generate a response.",
          error: null,
        },
      }));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Mentor API error:", e);
      setMentorReplies((prev) => ({
        ...prev,
        [key]: {
          mode,
          isLoading: false,
          text: undefined,
          error:
            "Mentor is not available at the moment. Please try again in a bit.",
        },
      }));
    }
  };

  const title = useMemo(() => {
    if (!topicParam || topicParam === "Generic") {
      return `Practice — Class ${grade} ${subjectKey}`;
    }
    return `Practice — ${topicParam}`;
  }, [topicParam, grade, subjectKey]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #e0f2ff 0, #dde7ff 30%, #e5edff 60%, #f1f5f9 100%)",
        paddingBottom: "80px",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "16px 16px 32px",
        }}
      >
        {/* Back link */}
        <button
          type="button"
          onClick={handleBack}
          style={{
            background: "none",
            border: "none",
            color: "#4b5563",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
            cursor: "pointer",
          }}
        >
          <span>←</span>
          <span>{backLabel}</span>
        </button>

        {/* Hero */}
        <section
          style={{
            borderRadius: 32,
            padding: "20px 18px 22px",
            background:
              "linear-gradient(135deg,rgba(15,23,42,0.98),rgba(37,99,235,0.95))",
            color: "#e5e7eb",
            boxShadow: "0 26px 70px rgba(15,23,42,0.7)",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              opacity: 0.85,
              marginBottom: 6,
            }}
          >
            Class {grade} · {subjectKey} · Practice
          </div>
          <h1
            style={{
              fontSize: "2rem",
              lineHeight: 1.15,
              fontWeight: 650,
              marginBottom: 6,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: "0.9rem",
              lineHeight: 1.6,
              opacity: 0.96,
              maxWidth: 640,
            }}
          >
            Auto-generated{" "}
            <strong>{questionCount}</strong> questions from your trends engine
            for this topic. Try them like a mini drill: solve on paper first,
            then tap <strong>“Show solution”</strong> or{" "}
            <strong>“Ask Mentor”</strong> to reveal help.
          </p>
        </section>

        {/* Controls row */}
        <section
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          {/* Difficulty chips */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                color: "#64748b",
                marginRight: 4,
              }}
            >
              Difficulty:
            </span>
            {(["All", "Easy", "Medium", "Hard"] as DifficultyChoice[]).map(
              (level) => {
                const active = difficulty === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    style={{
                      borderRadius: 999,
                      padding: "4px 10px",
                      border: active
                        ? "1px solid rgba(37,99,235,0.85)"
                        : "1px solid rgba(148,163,184,0.75)",
                      backgroundColor: active ? "#1d4ed8" : "#ffffff",
                      color: active ? "#f9fafb" : "#0f172a",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      boxShadow: active
                        ? "0 6px 16px rgba(37,99,235,0.42)"
                        : "none",
                    }}
                  >
                    {level === "All" ? "All levels" : level}
                  </button>
                );
              }
            )}
          </div>

          {/* Question count + regenerate */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <label
              style={{
                fontSize: "0.8rem",
                color: "#64748b",
              }}
            >
              Questions:{" "}
              <input
                type="number"
                min={3}
                max={25}
                value={questionCount}
                onChange={(e) =>
                  setQuestionCount(
                    Math.max(3, Math.min(25, Number(e.target.value) || 0))
                  )
                }
                style={{
                  width: 56,
                  borderRadius: 999,
                  border: "1px solid #cbd5f5",
                  padding: "3px 8px",
                  fontSize: "0.78rem",
                  marginLeft: 4,
                }}
              />
            </label>
            <button
              type="button"
              onClick={regenerateQuestions}
              style={{
                borderRadius: 999,
                padding: "5px 12px",
                border: "1px solid rgba(22,163,74,0.8)",
                backgroundColor: "#22c55e",
                color: "#052e16",
                fontSize: "0.78rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>🔁</span>
              <span>Regenerate set</span>
            </button>
          </div>
        </section>

        {/* Questions list */}
        <section>
          {isLoading && (
            <p
              style={{
                fontSize: "0.85rem",
                color: "#64748b",
                marginBottom: 8,
              }}
            >
              Generating fresh questions for this topic…
            </p>
          )}

          {error && (
            <p
              style={{
                fontSize: "0.85rem",
                color: "#b91c1c",
                marginBottom: 8,
              }}
            >
              {error}
            </p>
          )}

          {!isLoading && !error && questions.length === 0 ? (
            <p
              style={{
                fontSize: "0.85rem",
                color: "#64748b",
              }}
            >
              No practice questions available yet for this topic. Try picking a
              different topic from the Trends page, or refresh once the bank is
              updated.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {questions.map((q, idx) => {
                const isOpen = !!expandedAnswers[q.id];
                const mentorReply = mentorReplies[q.id];

                return (
                  <article
                    key={q.id}
                    style={{
                      borderRadius: 18,
                      padding: "14px 16px 12px",
                      backgroundColor: "#f9fafb",
                      border: "1px solid rgba(148,163,184,0.35)",
                      boxShadow: "0 10px 24px rgba(148,163,184,0.25)",
                    }}
                  >
                    <header
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 6,
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 12,
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#64748b",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 22,
                              height: 22,
                              borderRadius: 999,
                              backgroundColor: "#e5e7eb",
                              color: "#111827",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              marginRight: 8,
                            }}
                          >
                            {idx + 1}
                          </span>
                          <span>
                            {q.marks} mark{q.marks !== 1 ? "s" : ""} ·{" "}
                            {q.difficulty} · {q.section}
                          </span>
                        </div>
                      </div>

                      {q.bloomSkill && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "2px 8px",
                            borderRadius: 999,
                            backgroundColor: "#eef2ff",
                            color: "#3730a3",
                            fontWeight: 500,
                          }}
                        >
                          {q.bloomSkill}
                        </span>
                      )}
                    </header>

                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "#111827",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        marginBottom: 8,
                      }}
                    >
                      {q.questionText}
                    </p>

                    {/* Primary actions row */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleAnswer(q.id)}
                        style={{
                          borderRadius: 999,
                          padding: "5px 12px",
                          border: "1px solid rgba(37,99,235,0.6)",
                          backgroundColor: isOpen
                            ? "rgba(239,246,255,0.9)"
                            : "#eff6ff",
                          fontSize: "0.78rem",
                          color: "#1d4ed8",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span role="img" aria-label="Show solution">
                          👀
                        </span>
                        <span>{isOpen ? "Hide solution" : "Show solution"}</span>
                      </button>
                    </div>

                    {/* Mentor actions row */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: mentorReply ? 10 : 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#6b7280",
                          marginRight: 4,
                        }}
                      >
                        Need help from Mentor?
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAskMentor(q, "explain")}
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          border: "1px solid rgba(59,130,246,0.7)",
                          backgroundColor:
                            mentorReply?.mode === "explain" && !mentorReply.isLoading
                              ? "#e0ecff"
                              : "#eff6ff",
                          color: "#1d4ed8",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span role="img" aria-label="Explain">
                          💡
                        </span>
                        <span>Ask mentor to explain</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAskMentor(q, "solve")}
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          border: "1px solid rgba(22,163,74,0.7)",
                          backgroundColor:
                            mentorReply?.mode === "solve" && !mentorReply.isLoading
                              ? "#cffafe"
                              : "#dcfce7",
                          color: "#166534",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span role="img" aria-label="Solve">
                          🧠
                        </span>
                        <span>Ask mentor to solve</span>
                      </button>
                    </div>

                    {/* Solution panel */}
                    {isOpen && (
                      <div
                        style={{
                          marginTop: 6,
                          padding: "10px 12px",
                          borderRadius: 16,
                          backgroundColor: "#eff6ff",
                          border: "1px solid rgba(191,219,254,0.9)",
                          fontSize: "0.85rem",
                          color: "#1f2937",
                        }}
                      >
                        {Array.isArray(q.solutionSteps) &&
                        q.solutionSteps.length > 0 ? (
                          <ol
                            style={{
                              paddingLeft: 18,
                              lineHeight: 1.5,
                              marginBottom: 6,
                            }}
                          >
                            {q.solutionSteps.map((step, i) => (
                              // eslint-disable-next-line react/no-array-index-key
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        ) : q.explanation ? (
                          <p
                            style={{
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {q.explanation}
                          </p>
                        ) : null}

                        {q.answer && (
                          <p
                            style={{
                              marginTop: 6,
                              fontWeight: 600,
                            }}
                          >
                            Final answer:{" "}
                            <span style={{ fontWeight: 700 }}>{q.answer}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Mentor reply panel */}
                    {mentorReply && (
                      <div
                        style={{
                          marginTop: 6,
                          padding: "10px 12px",
                          borderRadius: 16,
                          backgroundColor: "#fefce8",
                          border: "1px solid rgba(250,204,21,0.8)",
                          fontSize: "0.85rem",
                          color: "#43302b",
                        }}
                      >
                        {mentorReply.isLoading ? (
                          <p>Mentor is thinking through this step-by-step…</p>
                        ) : mentorReply.error ? (
                          <p>{mentorReply.error}</p>
                        ) : (
                          <div
                            style={{
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {mentorReply.text}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PracticePage;
