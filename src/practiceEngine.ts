// src/practiceEngine.ts
//
// A simplified practice engine that wires together Prompt A (canonical
// question bank), Prompt B (mentor prompts), Prompt C (TopicHub) and
// Prompt D (practice packs).  This skeleton demonstrates how the
// components fit together and can be extended once the real data is
// available.  It exports a single function `buildPracticeSession` which
// returns enriched questions along with session metadata.

import type { CanonicalQuestion, DifficultyLevel } from "./data/predictionTypes";
import { canonicalQuestionBank } from "./data/canonicalQuestionBank";
import { topicHubContent, type TopicHubBlock } from "./data/topicHubContent";
// Import the prompt D practice packs. Rename the constant locally for clarity.
import { promptDPracticePacks as practicePacks, type PracticeQuestion, type TopicPracticePack } from './data/promptDPracticePacks';

// Define local aliases for practice modes and question types.  A
// PracticeMode corresponds to the keys of the modes object on a
// TopicPracticePack (e.g. 'speed_practice' and 'exam_mix').
export type PracticeMode = keyof TopicPracticePack['modes'];
type PracticePackQuestion = PracticeQuestion;

// Import mentor prompt templates generated from the GPT tasks (P6/S9).
// These templates are keyed by persona and vibe mode. For now we
// default to beast mode prompts when constructing session meta.
import { mentorPrompts } from './ai/mentorPrompts';

// Enriched question returned by the engine.  Combines fields from the
// practice pack, canonical bank and flags for the UI.
export interface EnrichedPracticeQuestion {
  id: string;
  text: string;
  marks: number;
  difficulty: DifficultyLevel;
  questionType: "short" | "mcq";
  subject: "maths" | "science";
  topicKey: string;
  topicName: string;
  tags?: string[];
  mcqVariants?: any;
  canonicalId?: string;
  hasCanonicalMeta: boolean;
  solutionSteps?: string[];
  markingScheme?: string[];
  aiVariants?: CanonicalQuestion["id"][];
  hasSocraticSolution: boolean;
  hasMarkingScheme: boolean;
}

export interface PracticeSessionMeta {
  subject: "maths" | "science";
  topicKey: string;
  topicName: string;
  mode: PracticeMode;
  totalMarks: number;
  difficultySummary: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  topicHub?: TopicHubBlock;
  howToScore95Plus?: string[];
  mentor: {
    solvePrompt: string;
    explainPrompt: string;
    markingSchemePrompt: string;
    topicExplainPrompt: string;
    topicExamTipsPrompt: string;
  };
}

export interface PracticeEngineResult {
  meta: PracticeSessionMeta;
  questions: EnrichedPracticeQuestion[];
}

export interface PracticeEngineRequest {
  subject: "maths" | "science";
  topicKey: string;
  mode: PracticeMode;
  /**
   * Optional vibe/energy mode used to adjust the difficulty mix. If
   * omitted the default mixes are used.
   */
  vibeMode?: import('./context/vibeModeContext').VibeMode;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildPracticeSessionQuestions(
  pack: TopicPracticePack,
  mode: PracticeMode,
  vibeMode?: import('./context/vibeModeContext').VibeMode
): PracticePackQuestion[] {
  // Define default mixes for demo purposes.  In production these values
  // come from Prompt D mode config and can vary per subject.
  const modeConfig: Record<PracticeMode, { targetCount: number; difficultyMix: Record<DifficultyLevel, number> }> = {
    speed_practice: { targetCount: 10, difficultyMix: { Easy: 5, Medium: 4, Hard: 1 } },
    exam_mix: { targetCount: 10, difficultyMix: { Easy: 3, Medium: 5, Hard: 2 } }
  };
  // Adjust the difficulty mix based on the current vibe mode. Low energy
  // sessions emphasise easier questions; high energy sessions lean
  // towards harder questions.
  const baseMix = modeConfig[mode].difficultyMix;
  let adjustedMix: Record<DifficultyLevel, number> = { ...baseMix };
  const _vibe = String(vibeMode ?? '');
  if (_vibe === 'Low' || _vibe === 'Zombie') {
    // Increase easy questions by 2, decrease hard by 2 if possible.
    adjustedMix = {
      Easy: baseMix.Easy + 2,
      Medium: baseMix.Medium,
      Hard: Math.max(0, baseMix.Hard - 2),
    };
  } else if (_vibe === 'High' || _vibe === 'Beast') {
    // Increase hard questions by 1, decrease easy by 1 if possible.
    adjustedMix = {
      Easy: Math.max(0, baseMix.Easy - 1),
      Medium: baseMix.Medium,
      Hard: baseMix.Hard + 1,
    };
  }
  const targetCount = modeConfig[mode].targetCount;
  // Bucket questions by difficulty.
  const byDiff: Record<DifficultyLevel, PracticePackQuestion[]> = {
    Easy: [],
    Medium: [],
    Hard: []
  };
  for (const q of pack.questions) {
    byDiff[q.difficulty].push(q);
  }
  const chosen: PracticePackQuestion[] = [];
  (Object.keys(adjustedMix) as DifficultyLevel[]).forEach((diff) => {
    const needed = adjustedMix[diff];
    const pool = shuffle(byDiff[diff]);
    for (let i = 0; i < needed && i < pool.length; i++) {
      chosen.push(pool[i]);
    }
  });
  // Fill remaining slots from any difficulty if we haven't met the target.
  if (chosen.length < targetCount) {
    const remainingPool = shuffle(
      pack.questions.filter((q) => !chosen.some((c) => c.id === q.id))
    );
    for (const q of remainingPool) {
      if (chosen.length >= targetCount) break;
      chosen.push(q);
    }
  }
  return chosen;
}

/**
 * Main entry point: Given {subject, topicKey, mode}, build a 10-question
 * practice session enriched with canonical meta, TopicHub details and
 * mentor prompts.  Replace the sample data with real Prompt A–D
 * converted arrays when they are ready.
 */
export function buildPracticeSession(
  req: PracticeEngineRequest & { vibeMode?: import('./context/vibeModeContext').VibeMode }
): PracticeEngineResult {
  const { subject, topicKey, mode, vibeMode } = req;
  const subjectPacks = practicePacks[subject];
  if (!subjectPacks) {
    throw new Error(`No practice packs for subject: ${subject}`);
  }
  const pack = subjectPacks[topicKey];
  if (!pack) {
    throw new Error(`No practice pack for topicKey: ${topicKey}`);
  }
  const selected = buildPracticeSessionQuestions(pack, mode, vibeMode);
  // Enrich with canonical data
  const canonicalById: Record<string, CanonicalQuestion> = {};
  for (const q of canonicalQuestionBank) {
    canonicalById[q.id] = q;
  }
  const enriched = selected.map((q) => {
    const canonicalId = q.canonicalId ?? q.id;
    const canonical = canonicalById[canonicalId];
    const hasCanonicalMeta = !!canonical;
    return {
      id: q.id,
      text: q.text,
      marks: q.marks,
      difficulty: q.difficulty,
      questionType: q.questionType,
      subject,
      topicKey,
      topicName: pack.topicName,
      // Some practice questions do not have tags defined in Prompt D. Cast
      // to any to support optional tags without TypeScript errors.
      tags: (q as any).tags as string[] | undefined,
      mcqVariants: q.mcqVariants,
      canonicalId,
      hasCanonicalMeta,
      solutionSteps: canonical?.solutionSteps,
      markingScheme: canonical?.finalAnswer ? [canonical.finalAnswer] : undefined,
      aiVariants: undefined,
      hasSocraticSolution: !!canonical?.solutionSteps,
      hasMarkingScheme: !!canonical?.finalAnswer
    } as EnrichedPracticeQuestion;
  });
  // Build meta
  const difficultySummary = { Easy: 0, Medium: 0, Hard: 0 } as {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  let totalMarks = 0;
  for (const q of enriched) {
    difficultySummary[q.difficulty]++;
    totalMarks += q.marks;
  }
  const topicHub = topicHubContent.find((t) => t.topicKey === topicKey);
  const meta: PracticeSessionMeta = {
    subject,
    topicKey,
    topicName: pack.topicName,
    mode,
    totalMarks,
    difficultySummary,
    topicHub,
    howToScore95Plus: topicHub?.howToScore95Plus,
    mentor: {
      // Use the beast mode prompts for each persona as defaults. Topic
      // explanation uses the explain persona and exam tips use the
      // plan persona (can be adjusted as needed).
      solvePrompt: mentorPrompts.solve.beast.prompt,
      explainPrompt: mentorPrompts.explain.beast.prompt,
      markingSchemePrompt: mentorPrompts.markingScheme.beast.prompt,
      topicExplainPrompt: mentorPrompts.explain.beast.prompt,
      topicExamTipsPrompt: mentorPrompts.plan.beast.prompt,
    }
  };
  return { meta, questions: enriched };
}
