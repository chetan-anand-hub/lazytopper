// src/engine/predictionDataService_with_CBSEPracticeGen.ts
//
// Micro-step 6: Unified CBSE Practice Generator with Difficulty + Section Weights
//
// This module provides a single entry-point:
//   generateCBSEStylePracticeSet(bank, request)
// which takes your unified predicted-question bank (Maths or Science)
// and returns a CBSE-style practice set that:
//
//  - Respects section-based distribution (A/B/C/D/E → 1m/2m/3m/4m/case-based).
//  - Biases towards the requested difficulty (Easy/Medium/Hard) with graceful fallback.
//  - Is fully generic over the concrete PredictedQuestion type used in your app.
//
// You can later wrap this in predictionDataService.ts and hook it into PracticePage,
// AI Mentor scoring, Daily Mix, etc.

///////////////////////////
// Core Types & Helpers //
///////////////////////////

export type DifficultyLevel = "Easy" | "Medium" | "Hard";
export type DifficultyFilter = DifficultyLevel | "All";

export type CBSESection = "A" | "B" | "C" | "D" | "E";

/**
 * Minimal contract expected from any question in the bank.
 * Your actual PredictedQuestion type can extend this.
 */
export interface MinimalPredictedQuestion {
  id: string;
  subject: string;        // e.g., "Maths", "Science"
  chapterKey?: string;    // e.g., "trigonometry"
  topicKey?: string;      // e.g., "heights-and-distances"
  section?: CBSESection;  // CBSE paper section A–E
  marks?: number;         // 1, 2, 3, 4, 5
  difficulty?: DifficultyLevel;
  blueprintSlot?: string; // e.g., "A1", "B3", etc.
}

/**
 * Request for a CBSE-style practice set.
 */
export interface CBSEPracticeRequest {
  subject: string; // "Maths" | "Science" | "All"
  totalQuestions: number;

  topicKey?: string;
  chapterKey?: string;

  allowedSections?: CBSESection[];

  sectionWeightsOverride?: Partial<Record<CBSESection, number>>;

  difficultyFilter: DifficultyFilter;

  seed?: number;

  mixMode?: "bank-first" | "generated-first" | "only-bank" | "only-generated";
  bloomSkills?: string[];
}

/**
 * Stats for analytics / UI badges.
 */
export interface CBSEPracticeStats {
  total: number;
  bySection: Record<CBSESection, number>;
  byDifficulty: Record<DifficultyLevel, number>;
}

/**
 * Result of generator.
 */
export interface CBSEPracticeSet<TQuestion extends MinimalPredictedQuestion> {
  questions: TQuestion[];
  stats: CBSEPracticeStats;
  meta: {
    subject: string;
    topicKey?: string;
    chapterKey?: string;
    totalRequested: number;
    sectionWeightsUsed: Record<CBSESection, number>;
    difficultyFilter: DifficultyFilter;
  };
}

//////////////////////////////
// Default CBSE-like Setup //
//////////////////////////////

const DEFAULT_SECTION_WEIGHTS: Record<CBSESection, number> = {
  A: 0.4,
  B: 0.3,
  C: 0.2,
  D: 0.1,
  E: 0.0,
};

const ALL_SECTIONS: CBSESection[] = ["A", "B", "C", "D", "E"];

const DIFFICULTY_LEVELS: DifficultyLevel[] = ["Easy", "Medium", "Hard"];

function getDifficultyFallbackOrder(filter: DifficultyFilter): DifficultyLevel[] {
  if (filter === "All") return DIFFICULTY_LEVELS;

  switch (filter) {
    case "Easy":
      return ["Easy", "Medium", "Hard"];
    case "Medium":
      return ["Medium", "Easy", "Hard"];
    case "Hard":
      return ["Hard", "Medium", "Easy"];
  }
}

function makeRng(seed?: number): () => number {
  if (seed === undefined) {
    return Math.random;
  }

  let x = seed || 1;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function allocateCountsByWeight(
  totalQuestions: number,
  weights: Record<CBSESection, number>,
  availableSections: CBSESection[]
): Record<CBSESection, number> {
  const counts: Record<CBSESection, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
  };

  if (totalQuestions <= 0 || availableSections.length === 0) {
    return counts;
  }

  let weightSum = 0;
  for (const s of availableSections) {
    weightSum += weights[s] ?? 0;
  }

  if (weightSum <= 0) {
    const equal = totalQuestions / availableSections.length;
    const base = Math.floor(equal);
    let remainder = totalQuestions - base * availableSections.length;
    for (const s of availableSections) {
      counts[s] = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
    }
    return counts;
  }

  const rawTargets: Record<CBSESection, number> = { ...counts };
  const remainders: Record<CBSESection, number> = { ...counts };

  let assigned = 0;
  for (const s of availableSections) {
    const w = weights[s] ?? 0;
    const exact = (w / weightSum) * totalQuestions;
    const floorVal = Math.floor(exact);
    rawTargets[s] = floorVal;
    remainders[s] = exact - floorVal;
    assigned += floorVal;
  }

  let leftover = totalQuestions - assigned;
  const sortedByRemainder = [...availableSections].sort(
    (a, b) => remainders[b] - remainders[a]
  );

  let i = 0;
  while (leftover > 0 && sortedByRemainder.length > 0) {
    const section = sortedByRemainder[i % sortedByRemainder.length];
    rawTargets[section] += 1;
    leftover--;
    i++;
  }

  return rawTargets;
}

////////////////////////////////////////////
// Main Generator: generateCBSEStyle...  //
////////////////////////////////////////////

export function generateCBSEStylePracticeSet<
  TQuestion extends MinimalPredictedQuestion
>(
  allQuestions: TQuestion[],
  request: CBSEPracticeRequest
): CBSEPracticeSet<TQuestion> {
  const {
    subject,
    totalQuestions,
    topicKey,
    chapterKey,
    allowedSections,
    sectionWeightsOverride,
    difficultyFilter,
    seed,
  } = request;

  const rng = makeRng(seed);

  // 1. Filter by subject/topic/chapter.
  let bank = allQuestions.filter((q) => {
    const subjectMatch =
      subject.toLowerCase() === "all"
        ? true
        : (q.subject ?? "").toLowerCase() === subject.toLowerCase();

    const topicMatch = topicKey
      ? (q.topicKey ?? "").toLowerCase() === topicKey.toLowerCase()
      : true;

    const chapterMatch = chapterKey
      ? (q.chapterKey ?? "").toLowerCase() === chapterKey.toLowerCase()
      : true;

    return subjectMatch && topicMatch && chapterMatch;
  });

  if (bank.length === 0 || totalQuestions <= 0) {
    return {
      questions: [],
      stats: {
        total: 0,
        bySection: { A: 0, B: 0, C: 0, D: 0, E: 0 },
        byDifficulty: { Easy: 0, Medium: 0, Hard: 0 },
      },
      meta: {
        subject,
        topicKey,
        chapterKey,
        totalRequested: totalQuestions,
        sectionWeightsUsed: DEFAULT_SECTION_WEIGHTS,
        difficultyFilter,
      },
    };
  }

  // 2. Active sections
  const sectionSet = new Set<CBSESection>();
  for (const q of bank) {
    if (q.section && ALL_SECTIONS.includes(q.section)) {
      sectionSet.add(q.section);
    }
  }

  let activeSections = ALL_SECTIONS.filter((s) => sectionSet.has(s));

  if (allowedSections && allowedSections.length > 0) {
    activeSections = activeSections.filter((s) => allowedSections.includes(s));
  }

  if (activeSections.length === 0) {
    activeSections = ["A"];
    bank = bank.map((q) => ({ ...q, section: "A" as CBSESection }));
  }

  // 3. Effective section weights
  const effectiveWeights: Record<CBSESection, number> = {
    ...DEFAULT_SECTION_WEIGHTS,
  };

  if (sectionWeightsOverride) {
    for (const s of ALL_SECTIONS) {
      if (sectionWeightsOverride[s] !== undefined) {
        effectiveWeights[s] = sectionWeightsOverride[s] as number;
      }
    }
  }

  // 4. Allocate targets
  const targetCounts = allocateCountsByWeight(
    totalQuestions,
    effectiveWeights,
    activeSections
  );

  // 5. Section-wise sampling with difficulty bias
  const usedIds = new Set<string>();
  const selected: TQuestion[] = [];

  const diffOrder = getDifficultyFallbackOrder(difficultyFilter);

  for (const section of activeSections) {
    const target = targetCounts[section];
    if (target <= 0) continue;

    const sectionQuestions = bank.filter((q) => q.section === section);
    if (sectionQuestions.length === 0) continue;

    const pickedForSection: TQuestion[] = [];

    // 5.1 Difficulty-ordered picks
    for (const diff of diffOrder) {
      if (pickedForSection.length >= target) break;

      const candidates = sectionQuestions.filter((q) => {
        if (usedIds.has(q.id)) return false;
        if (!q.difficulty) return true;
        return q.difficulty === diff;
      });

      if (candidates.length === 0) continue;

      shuffleInPlace(candidates, rng);

      for (const c of candidates) {
        if (pickedForSection.length >= target) break;
        pickedForSection.push(c);
        usedIds.add(c.id);
      }
    }

    // 5.2 Fallback: any difficulty
    if (pickedForSection.length < target) {
      const anyCandidates = sectionQuestions.filter((q) => !usedIds.has(q.id));
      shuffleInPlace(anyCandidates, rng);

      for (const c of anyCandidates) {
        if (pickedForSection.length >= target) break;
        pickedForSection.push(c);
        usedIds.add(c.id);
      }
    }

    selected.push(...pickedForSection);
  }

  // 6. Global top-up if needed
  if (selected.length < totalQuestions) {
    const remainingCandidates = bank.filter((q) => !usedIds.has(q.id));
    shuffleInPlace(remainingCandidates, rng);

    for (const q of remainingCandidates) {
      if (selected.length >= totalQuestions) break;
      selected.push(q);
      usedIds.add(q.id);
    }
  }

  // 7. Final shuffle
  shuffleInPlace(selected, rng);

  const bySection: Record<CBSESection, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
  };
  const byDifficulty: Record<DifficultyLevel, number> = {
    Easy: 0,
    Medium: 0,
    Hard: 0,
  };

  for (const q of selected) {
    const s = (q.section as CBSESection) || "A";
    if (ALL_SECTIONS.includes(s)) {
      bySection[s] += 1;
    } else {
      bySection.A += 1;
    }

    const d = q.difficulty ?? "Medium";
    if (DIFFICULTY_LEVELS.includes(d)) {
      byDifficulty[d] += 1;
    } else {
      byDifficulty.Medium += 1;
    }
  }

  const stats: CBSEPracticeStats = {
    total: selected.length,
    bySection,
    byDifficulty,
  };

  const weightsUsed: Record<CBSESection, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
  };
  let sumWeights = 0;
  for (const s of activeSections) {
    sumWeights += effectiveWeights[s] ?? 0;
  }
  if (sumWeights <= 0) {
    for (const s of activeSections) {
      weightsUsed[s] = 1 / activeSections.length;
    }
  } else {
    for (const s of activeSections) {
      weightsUsed[s] = (effectiveWeights[s] ?? 0) / sumWeights;
    }
  }

  return {
    questions: selected,
    stats,
    meta: {
      subject,
      topicKey,
      chapterKey,
      totalRequested: totalQuestions,
      sectionWeightsUsed: weightsUsed,
      difficultyFilter,
    },
  };
}
