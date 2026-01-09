import type { DailyMixItem } from "./dailyMixPlayback";
import type { PracticeInsightSnapshot } from "./practiceInsights";
import { computePracticeInsights } from "./practiceInsights";

export type DailyMixIntensity = "light" | "normal" | "hard";

export interface DailyMixContext {
  grade: number;
  subject: "Maths" | "Science";
  topic: string;
  /**
   * Optional — if you already have insights computed elsewhere, pass them in.
   * If omitted, we will compute from local history via computePracticeInsights.
   */
  insights?: PracticeInsightSnapshot;
  /**
   * Controls how aggressive the mix is (how many hard items / weak-area items).
   * - light: more recall + fewer hard drills
   * - normal: balanced
   * - hard: heavier weak-area + harder items
   */
  intensity?: DailyMixIntensity;
  /**
   * Seed for stable ordering (e.g. yyyy-mm-dd). If omitted, uses today's date.
   */
  seedKey?: string;
  /**
   * Target number of items.
   */
  count?: number;
}

function seededHash(str: string): number {
  // Simple deterministic hash (not crypto). Keeps order stable across refreshes.
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Build a Daily Mix playlist that works for ALL topics — even when the practice bank
 * doesn't yet have a curated list.
 *
 * This generator is intentionally conservative: it creates a playlist structure
 * (warmup → core → challenge → recap) that your UI can render.
 * Later we can map each item into:
 * - a practice question id
 * - a revision card
 * - a short video link
 *
 * For now, we provide text-only items so the feature never "goes empty".
 */
export function generateDailyMix(ctx: DailyMixContext): DailyMixItem[] {
  const {
    grade,
    subject,
    topic,
    intensity = "normal",
    seedKey = todayKey(),
    count = 8,
  } = ctx;

  const insights = ctx.insights ?? computePracticeInsights({ grade, subject, topic });

  const seed = seededHash(`${seedKey}|${grade}|${subject}|${topic}|${intensity}`);

  const warmupCount = Math.max(1, Math.round(count * 0.25));
  const coreCount = Math.max(1, Math.round(count * 0.5));
  const challengeCount = Math.max(1, count - warmupCount - coreCount);

  // Weight by intensity
  const challengeBoost = intensity === "hard" ? 2 : intensity === "light" ? 0.5 : 1;

  const weakAreas = (insights?.weakConcepts ?? []).slice(0, 6);
  const commonMistakes = (insights?.commonMistakes ?? []).slice(0, 6);

  const warmups: DailyMixItem[] = Array.from({ length: warmupCount }).map((_, idx) => {
    const concept = weakAreas[idx]?.concept ?? topic;
    return {
      id: `dm-${seedKey}-${subject}-${topic}-warmup-${idx + 1}`,
      type: "question",
      title: `Warm‑up: quick recall (${concept})`,
      description: `1‑minute recall. Define key term / write 1 example. (Auto‑generated)`,
      payload: {
        grade,
        subject,
        topic,
        vibeTag: "warmup",
      },
    };
  });

  const cores: DailyMixItem[] = Array.from({ length: coreCount }).map((_, idx) => {
    const concept = weakAreas[(idx + 1) % Math.max(1, weakAreas.length)]?.concept ?? topic;
    const mistake = commonMistakes[idx]?.mistake ?? "Watch for calculation steps.";
    return {
      id: `dm-${seedKey}-${subject}-${topic}-core-${idx + 1}`,
      type: "question",
      title: `Core drill: ${concept}`,
      description: `Solve a medium problem. Tip: ${mistake}`,
      payload: {
        grade,
        subject,
        topic,
        concept,
        vibeTag: "core",
      },
    };
  });

  const challenges: DailyMixItem[] = Array.from({ length: challengeCount }).map((_, idx) => {
    const concept = weakAreas[(idx + 2) % Math.max(1, weakAreas.length)]?.concept ?? topic;
    const difficulty = challengeBoost >= 1.5 ? "Hard" : "Medium";
    return {
      id: `dm-${seedKey}-${subject}-${topic}-challenge-${idx + 1}`,
      type: "question",
      title: `Challenge (${difficulty}): ${concept}`,
      description: `Try without looking at steps. Then compare with solution.`,
      payload: {
        grade,
        subject,
        topic,
        concept,
        vibeTag: "challenge",
      },
    };
  });

  // Mix order: warmup then shuffled core+challenge (stable) then recap card
  const mid = seededShuffle([...cores, ...challenges], seed);

  const recap: DailyMixItem = {
    id: `dm-${seedKey}-${subject}-${topic}-recap`,
    type: "card",
    title: `Recap: what to remember`,
    description:
      weakAreas.length > 0
        ? `Focus: ${weakAreas.map((w) => w.concept).slice(0, 3).join(" • ")}`
        : `Quick recap notes for ${topic}.`,
    payload: { grade, subject, topic, vibeTag: "recap" },
  };

  return [...warmups, ...mid].slice(0, Math.max(1, count - 1)).concat([recap]);
}
