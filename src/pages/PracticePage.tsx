// src/pages/PracticePage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { type PracticeQuestion } from "../data/predictionDataService";
import { generatePracticeSet, inferBoardPatternFromQuestion, normalizeBoardPattern } from "../data/practiceSetGenerator";
import { promptDPracticePacks } from "../data/promptDPracticePacks";
import { resolveTopicKey as resolveCanonicalTopicKey, toPracticePackKey } from "../utils/topicResolver";
import { generateMoreLikeThis } from "../ai/aiClient";
import boardSteps_2025_26 from "../data/boardSteps";
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
  boardPattern?: string;
}): PracticeQuestion[] {
  const safeCount = Math.max(3, Math.min(25, args.count || 10));
  const difficultyMix = difficultyChoiceToMix(args.difficulty);

  const practiceSet = generatePracticeSet({
    // practiceSetGenerator expects lower-case subject keys.
    subject: (args.subjectKey.toLowerCase() as any),
    topicKey: args.topicKey,
    totalQuestions: safeCount,
    boardPattern: normalizeBoardPattern(args.boardPattern),
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

function resolvePracticePackKey(args: {
  subjectKey: SubjectKey;
  topicParam: string;
  explicitTopicKey?: string | null;
}): string {
  const subjectLower = args.subjectKey.toLowerCase() as "maths" | "science";
  const packsForSubject = (promptDPracticePacks as any)[subjectLower] as
    | Record<string, any>
    | undefined;

  // ✅ If caller already passes an underscore pack key, honour it (back-compat)
  if (args.explicitTopicKey) {
    const explicitPackKey = normaliseKey(args.explicitTopicKey);
    if (packsForSubject?.[explicitPackKey]) return explicitPackKey;
    if (packsForSubject?.[String(args.explicitTopicKey)]) return String(args.explicitTopicKey);
  }

  // Canonical topicKey (hyphen-slug) via single source of truth
  const canonical = resolveCanonicalTopicKey({
    subjectKey: subjectLower,
    topicParam: args.topicParam,
    topicKey: args.explicitTopicKey ?? null,
  });

  // Bridge: canonical hyphen-slug -> underscore pack key
  const packKey = toPracticePackKey(canonical);
  if (packsForSubject?.[packKey]) return packKey;

  // Fallback: try match by topicName inside packs
  if (packsForSubject) {
    const target = normaliseKey(args.topicParam);
    for (const [key, pack] of Object.entries(packsForSubject)) {
      const packName = normaliseKey((pack as any)?.topicName ?? "");
      if (!packName) continue;
      if (target === packName) return key;
      if (target.startsWith(packName)) return key;
    }
  }

  // Deterministic fallback
  return packKey;
}

function normaliseSubject(raw?: string | null): SubjectKey {
  const val = (raw || "").toLowerCase();
  if (val === "science" || val === "sci") return "Science";
  return "Maths";
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
  sectionFilter?: string;
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
    boardPattern: args.sectionFilter,
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

// If a Board section filter (A–E) is active, apply it BEFORE slicing and before AI top-up,
// so we can still return the requested count after filtering.
const desiredSection = normalizeBoardPattern(args.sectionFilter);
const bankQuestionsFiltered = desiredSection
  ? bankQuestions.filter((q) => inferBoardPatternFromQuestion(q) === desiredSection)
  : bankQuestions;

const baseQuestions = bankQuestionsFiltered.slice(0, safeCount);

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
    (`Generate a CBSE Class ${args.grade} ${args.subjectKey} question for topic "${args.topicLabel}" at ${fallbackDifficulty} level.` +

      (desiredSection ? ` Focus ONLY on Board Section ${desiredSection}.` : ``));

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
function normaliseQuestionText(s: string | undefined | null): string {
  const text = String(s || "");
  return text
    .replace(/\s+/g, " ")
    .replace(/[”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
}

          const variantText = normaliseQuestionText(variant.text);

          return {
            ...template,
            id: `${seedId}-AI-${index + 1}`,
            marks: variant.marks != null ? variant.marks : template.marks ?? seedMarks ?? 1,
            difficulty:
              ((variant.difficulty as PracticeQuestion["difficulty"]) ??
                (template.difficulty as PracticeQuestion["difficulty"])) ??
              (fallbackDifficulty as PracticeQuestion["difficulty"]),
            section: desiredSection ?? (template as any).section ?? "",
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
// Support deep-linking via URL query params (e.g., /practice/10/Maths?topic=Triangles&section=A)
const qp = useMemo(() => new URLSearchParams(location.search), [location.search]);
const qpSectionRaw = (qp.get("section") || qp.get("pattern") || qp.get("type") || "").trim();
const qpSection = qpSectionRaw ? qpSectionRaw.toUpperCase() : "";

    const subjectKeyStr = String(navState.subjectKey ?? navState.subject ?? subjectKey ?? "").toLowerCase();
  const subjectTitle = String(
    navState.subjectTitle ||
    (subjectKeyStr.includes("math") ? "Maths" :
     subjectKeyStr.includes("sci")  ? "Science" :
     (subjectKeyStr ? subjectKeyStr.charAt(0).toUpperCase() + subjectKeyStr.slice(1) : "Subject"))
  );
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


  const [sectionFilter, setSectionFilter] = useState<"ALL" | "A" | "B" | "C" | "D" | "E">(() => {
  const init = (((navState as any)?.sectionFilter as any) || qpSection || "ALL");
  return String(init || "ALL").toUpperCase() as any;
});

// Keep URL ?section=... authoritative (without breaking hooks order).
useEffect(() => {
  const s = (qpSection || "").toUpperCase();
  if (s === "A" || s === "B" || s === "C" || s === "D" || s === "E" || s === "ALL") {
    setSectionFilter(s as any);
  }
}, [qpSection]);
  const inferSectionFromMarks = (marks: unknown): "A" | "B" | "C" | "D" | "E" | null => {
    const m = typeof marks === "number" ? marks : Number(marks);
    if (!Number.isFinite(m)) return null;
    if (m === 1) return "A";
    if (m === 2) return "B";
    if (m === 3) return "C";
    if (m === 4) return "E"; // 4 marks = Case-based (E)
    if (m === 5) return "D";
    return null;
  };

  const getQuestionSection = (q: any): "A" | "B" | "C" | "D" | "E" | null => {
    const direct = String(q?.section || q?.paperSection || q?.boardSection || "").toUpperCase();
    if (direct === "A" || direct === "B" || direct === "C" || direct === "D" || direct === "E") return direct as any;
    const byMarks = inferSectionFromMarks(q?.marks ?? q?.mark ?? q?.points);
    if (byMarks) return byMarks;
    const slot = String(q?.blueprintSlotId || "").toUpperCase();
    if (slot.startsWith("A")) return "A";
    if (slot.startsWith("B")) return "B";
    if (slot.startsWith("C")) return "C";
    if (slot.startsWith("D")) return "D";
    if (slot.startsWith("E")) return "E";
    return null;
  };

  const filteredQuestions = useMemo(() => {
    if (sectionFilter === "ALL") return questions;
    return questions.filter((q) => getQuestionSection(q) === sectionFilter);
  }, [questions, sectionFilter]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedAnswers, setExpandedAnswers] = useState<
    Record<string, boolean>
  >({});
  const [regenerationKey, setRegenerationKey] = useState<number>(0);
// Practice Mentor Drawer (Solve With Me / Board Steps)
const [mentorDrawerOpen, setMentorDrawerOpen] = useState(false);
const [mentorSolveStyle, setMentorSolveStyle] = useState<"socratic" | "board">("socratic");
const [mentorSeedExample, setMentorSeedExample] = useState<{
  title: string;
  question: string;
  marks?: number;
  section?: string;
} | null>(null);


  // Two topic identifiers are used:
  // - topicLabel: display name used by the canonical bank (e.g., "Real Numbers")
  // - packTopicKey: snake_case key used by Prompt-D packs (e.g., "real_numbers")
  const topicLabel = topicParam;
  const canonicalTopicKey = useMemo(() => {
  const explicitFromState = (navState as any)?.topicKey as string | undefined;
  return resolveCanonicalTopicKey({
    subjectKey: String(subjectKey).toLowerCase(),
    topicParam,
    topicKey: topicKeyParam || explicitFromState || null,
  });
}, [subjectKey, topicParam, topicKeyParam, navState]);

const packTopicKey = useMemo(() => {
  const explicitFromState = (navState as any)?.topicKey as string | undefined;
  return resolvePracticePackKey({
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
          sectionFilter: sectionFilter === "ALL" ? undefined : sectionFilter,
        });

        if (!cancelled) {
          setQuestions(next);
          setExpandedAnswers({});
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
    sectionFilter,
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

  const title = useMemo(() => {
    if (!topicParam || topicParam === "Generic") {
      return `Practice â€” Class ${grade} ${subjectKey}`;
    }
    return `Practice â€” ${topicParam}`;
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
          <span>â†</span>
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
            Class {grade} Â· {subjectKey} Â· Practice
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
            then tap <strong>â€œShow solutionâ€</strong> or{" "}
            <strong>â€œSolve With Meâ€</strong> / <strong>â€œBoard Stepsâ€</strong> to reveal help.
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

          {/* Type (Aâ€“E) filter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Type:</span>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value as any)}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.75)",
                padding: "4px 10px",
                fontSize: "0.78rem",
                background: "#ffffff",
                cursor: "pointer",
              }}
            >
              <option value="ALL">All</option>
              <option value="A">A (1m)</option>
              <option value="B">B (2m)</option>
              <option value="C">C (3m)</option>
              <option value="D">D (5m)</option>
              <option value="E">E (Case, 4m)</option>
            </select>
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
              <span>ðŸ”</span>
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
              Generating fresh questions for this topicâ€¦
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
              {filteredQuestions.map((q, idx) => {
                const isOpen = !!expandedAnswers[q.id];

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
                            {q.marks} mark{q.marks !== 1 ? "s" : ""} Â·{" "}
                            {q.difficulty} Â· {q.section}
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
                          ðŸ‘€
                        </span>
                        <span>{isOpen ? "Hide solution" : "Show solution"}</span>
                      </button>
                    </div>

                    
{/* Mentor actions row (replaces old Ask Mentor buttons) */}
<div
  style={{
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  }}
>
  <button
    type="button"
    onClick={() => {
      setMentorSeedExample({
        title: `Q${idx + 1}`,
        question: String(q.questionText || ""),
        marks: Number((q as any).marks) || undefined,
        section: String((q as any).section || ""),
      });
      setMentorSolveStyle("socratic");
      setMentorDrawerOpen(true);
    }}
    style={{
      borderRadius: 999,
      padding: "5px 12px",
      border: "1px solid rgba(34,197,94,0.65)",
      backgroundColor: "rgba(240,253,244,0.92)",
      fontSize: "0.78rem",
      color: "#166534",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontWeight: 900,
    }}
    title="Solve With Me (mentor asks 1 question at a time)"
  >
    <span role="img" aria-label="Solve with me">
      ðŸ§ 
    </span>
    <span>Solve With Me</span>
  </button>

  <button
    type="button"
    onClick={() => {
      setMentorSeedExample({
        title: `Q${idx + 1}`,
        question: String(q.questionText || ""),
        marks: Number((q as any).marks) || undefined,
        section: String((q as any).section || ""),
      });
      setMentorSolveStyle("board");
      setMentorDrawerOpen(true);
    }}
    style={{
      borderRadius: 999,
      padding: "5px 12px",
      border: "1px solid rgba(99,102,241,0.55)",
      backgroundColor: "rgba(238,242,255,0.92)",
      fontSize: "0.78rem",
      color: "#3730a3",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontWeight: 900,
    }}
    title="Board Steps + Marking Scheme"
  >
    <span role="img" aria-label="Board steps">
      🧾
    </span>
    <span>Board Steps</span>
  </button>
</div>
</article>
                );
              })}
            </div>
          )}
        </section>

<MentorSolveDrawer
  open={mentorDrawerOpen}
  onClose={() => setMentorDrawerOpen(false)}
  seed={mentorSeedExample}
  solveStyle={mentorSolveStyle}
  grade={Number(grade)}

  subjectTitle={subjectTitle}
  topicKey={canonicalTopicKey}
/>
      </div>
    </div>
  );
};

type MentorChatMsg = { role: "user" | "assistant" | "system"; content: string };

function MentorSolveDrawer(props: {
  open: boolean;
  onClose: () => void;
  seed: { title: string; question: string; marks?: number; section?: string } | null;
  solveStyle: "socratic" | "board";
  grade: number;
  subjectTitle: string;
  topicKey: string;
}) {
  const { open, onClose, seed, solveStyle, grade, subjectTitle, topicKey } = props;

  const getOfflineBoardSteps = () => {
    const subj = String(subjectTitle || "").trim() as any;
    const subjectKey = (subj === "Maths" || subj === "Science") ? subj : "Maths";

    const rawSection = String(seed?.section || "").trim().toUpperCase();

    // Infer CBSE section from marks when section is missing/invalid.
    const marks = Number((seed as any)?.marks);
    const inferredSection =
      marks === 1 ? "A" :
      marks === 2 ? "B" :
      marks === 3 ? "C" :
      marks === 4 ? "D" :
      marks >= 5 ? "E" : "C";

    const section =
      (rawSection === "A" || rawSection === "B" || rawSection === "C" || rawSection === "D" || rawSection === "E")
        ? rawSection
        : inferredSection;

    const tpl = (boardSteps_2025_26 as any)?.[subjectKey]?.[section];
    return { subjectKey, section, tpl };
  };

  const [messages, setMessages] = useState<MentorChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const parseMentorJson = (raw: string) => {
    try {
      if (!raw) return null;
      const t = String(raw).trim();
      if (!t.startsWith("{")) return null;
      const obj = JSON.parse(t);
      if (!obj || typeof obj !== "object") return null;
      if (typeof (obj as any).kind !== "string") return null;
      if (typeof (obj as any).tutor === "string") return obj; // Solve With Me protocol
      if ((obj as any).kind === "board_steps_ms" && Array.isArray((obj as any).steps)) return obj;
      return null;
    } catch {
      return null;
    }
  };

  const renderAssistantContent = (raw: string) => {
    const obj: any = parseMentorJson(raw);
    if (!obj) return raw;

    if (obj.kind === "board_steps_ms") {
      const total = Number(obj.totalMarks) || undefined;
      const steps = Array.isArray(obj.steps) ? obj.steps : [];
      const lines: string[] = [];
      lines.push(`🧾 Board Steps + Marking Scheme${total ? ` (Total: ${total} marks)` : ""}`);
      steps.forEach((s: any, idx: number) => {
        const m = s && s.marks != null ? Number(s.marks) : 0;
        const text = s && s.text ? String(s.text) : "";
        lines.push("");
        lines.push(`${idx + 1}) [${m}] ${text}`);
        if (s?.whyThisGetsMarks) lines.push(`   • Why: ${String(s.whyThisGetsMarks)}`);
        if (s?.commonMistake) lines.push(`   • Common mistake: ${String(s.commonMistake)}`);
      });
      if (obj.finalAnswer) {
        lines.push("");
        lines.push(`✅ Final Answer: ${String(obj.finalAnswer)}`);
      }
      return lines.join("\n");
    }

    const lines: string[] = [];
    if (obj.kind === "hint") lines.push("💡 Hint:");
    if (obj.kind === "final") lines.push("✅ Final:");
    lines.push(String(obj.tutor || ""));
    if (obj.mcq && typeof obj.mcq === "object") {
      const opts = ["A", "B", "C", "D"]
        .filter((k) => obj.mcq && obj.mcq[k])
        .map((k) => `${k}. ${obj.mcq[k]}`);
      if (opts.length) {
        lines.push("");
        lines.push(...opts);
      }
    }
    if (obj.answerFormat) {
      lines.push("");
      lines.push(`Answer format: ${obj.answerFormat}`);
    }
    if (obj.kind === "final") {
      if (obj.finalAnswer) {
        lines.push("");
        lines.push(`Final Answer: ${obj.finalAnswer}`);
      }
      if (obj.boardWriteup) {
        lines.push("");
        lines.push("Board Write-up:");
        lines.push(obj.boardWriteup);
      }
    }
    return lines.join("\n");
  };

  const kickoff = useCallback(async () => {
    if (!seed) return;

    setErrorText(null);
    setLoading(true);
    setInput("");

    const firstUser: MentorChatMsg = {
      role: "user",
      content: `Problem (${seed.title}): ${seed.question}`,
    };

    setMessages([firstUser]);

    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: solveStyle === "board" ? "board_steps_ms" : "solve_with_me",
          payload: {
            subject: subjectTitle,
            grade,
            topicKey,
            questionText: seed.question,
            marks: seed.marks,
            section: seed.section,
            solveStyle,
            vibe: "zombie",
          },
          messages: [firstUser],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Mentor error");

      const assistantRaw = data?.text ? String(data.text) : "";
      setMessages((prev) => [...prev, { role: "assistant", content: assistantRaw }]);
    } catch (e: any) {
      setErrorText(e?.message || "Failed to load mentor response.");
    } finally {
      setLoading(false);
    }
  }, [seed, solveStyle, subjectTitle, grade, topicKey]);

  useEffect(() => {
    if (open) kickoff();
    else {
      setMessages([]);
      setInput("");
      setErrorText(null);
      setLoading(false);
    }
  }, [open, seed, solveStyle, kickoff]);

  const sendStudentMessage = useCallback(async () => {
    if (solveStyle !== "socratic") return;
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setErrorText(null);
    const nextHistory: MentorChatMsg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextHistory);
    setInput("");

    setLoading(true);
    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "solve_with_me",
          payload: {
            subject: subjectTitle,
            grade,
            topicKey,
            questionText: seed?.question,
            marks: seed?.marks,
            section: seed?.section,
            solveStyle: "socratic",
            vibe: "zombie",
            studentAttempt: trimmed,
            studentAnswer: trimmed,
          },
          messages: nextHistory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Mentor error");
      const assistantRaw = data?.text ? String(data.text) : "";
      setMessages((prev) => [...prev, { role: "assistant", content: assistantRaw }]);
    } catch (e: any) {
      setErrorText(e?.message || "Failed to send.");
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, solveStyle, subjectTitle, grade, topicKey, seed]);

  if (!open || !seed) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,23,0.55)",
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(920px, 100%)",
          maxHeight: "92vh",
          overflow: "hidden",
          borderRadius: 22,
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(255,255,255,0.35)",
          boxShadow: "0 30px 90px rgba(2,6,23,0.35)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 950, fontSize: 14 }}>
            {solveStyle === "board" ? "Board Steps" : "Solve With Me"} Â· {seed.title}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              onClick={kickoff}
              disabled={loading}
              style={{
                borderRadius: 999,
                padding: "6px 10px",
                border: "1px solid rgba(0,0,0,0.14)",
                background: "white",
                fontWeight: 900,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              title="Reset"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              style={{
                borderRadius: 999,
                padding: "6px 10px",
                border: "1px solid rgba(0,0,0,0.14)",
                background: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
              title="Close"
            >
              âœ•
            </button>
          </div>
        </div>

        <div style={{ padding: 14, overflow: "auto" }}>
          {solveStyle === "board" && seed && (() => {
            const { subjectKey, section, tpl } = getOfflineBoardSteps();
            if (!tpl) return null;

            return (
              <div
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 16,
                  background: "rgba(238,242,255,0.92)",
                  border: "1px solid rgba(99,102,241,0.28)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ fontWeight: 950 }}>
                    🧾 CBSE Board Steps (Offline) · {subjectKey} · Section {section}
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.8 }}>
                    {tpl.marksTotal} marks template
                  </div>
                </div>

                {Array.isArray(tpl.notes) && tpl.notes.length > 0 && (
                  <div style={{ fontSize: 13, marginBottom: 8, opacity: 0.9 }}>
                    {tpl.notes.map((n: string, i: number) => (
                      <div key={i}>• {n}</div>
                    ))}
                  </div>
                )}

                <div style={{ display: "grid", gap: 10 }}>
                  {tpl.steps.map((s: any) => (
                    <div
                      key={s.id}
                      style={{
                        padding: 10,
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.85)",
                        border: "1px solid rgba(148,163,184,0.28)",
                      }}
                    >
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <div style={{ fontWeight: 950 }}>{s.title}</div>
                        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.75 }}>
                          ~{s.marks} marks
                        </div>
                      </div>
                      <ul style={{ margin: "8px 0 0 18px", fontSize: 13, lineHeight: 1.55 }}>
                        {s.whatToWrite.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                      {Array.isArray(s.commonMistakes) && s.commonMistakes.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
                          <div style={{ fontWeight: 900 }}>Common mistakes:</div>
                          <ul style={{ margin: "6px 0 0 18px" }}>
                            {s.commonMistakes.map((m: string, i: number) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                  Tip: You can still hit “Reset” to ask the mentor for a question-specific marking breakdown.
                </div>
              </div>
            );
          })()}
          <div style={{ fontWeight: 900, marginBottom: 8 }}>{seed.question}</div>

          {messages
            .filter((m) => m.role === "assistant")
            .map((m, i) => (
              <pre
                key={i}
                style={{
                  whiteSpace: "pre-wrap",
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                  fontSize: 13,
                  lineHeight: 1.55,
                  padding: 12,
                  borderRadius: 16,
                  background: "rgba(248,250,252,0.9)",
                  border: "1px solid rgba(148,163,184,0.35)",
                }}
              >
                {renderAssistantContent(m.content)}
              </pre>
            ))}

          {loading && <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>Thinkingâ€¦</div>}

          {errorText && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 12,
                background: "rgba(255,0,0,0.06)",
                border: "1px solid rgba(255,0,0,0.18)",
                fontSize: 13,
              }}
            >
              {errorText}
            </div>
          )}

          {solveStyle === "socratic" ? (
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={"Answer mentorâ€™s questionâ€¦"}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendStudentMessage();
                }}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.14)",
                  padding: "10px 12px",
                  fontSize: 14,
                  outline: "none",
                  background: "white",
                }}
                disabled={loading}
              />
              <button
                onClick={sendStudentMessage}
                disabled={loading || !input.trim()}
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.14)",
                  padding: "10px 12px",
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  background: loading || !input.trim() ? "rgba(0,0,0,0.05)" : "white",
                }}
              >
                Send
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
              Tip: Copy this step-pattern in your answer sheet â€” thatâ€™s how marks are awarded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PracticePage;






