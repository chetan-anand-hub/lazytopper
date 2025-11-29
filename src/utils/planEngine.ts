// src/utils/planEngine.ts
import {
  class10TopicTrendList,
  type TopicTier,
} from "../data/class10MathTopicTrends";
import {
  class10ScienceTopicTrendList,
  type TierKey as ScienceTierKey,
} from "../data/class10ScienceTopicTrends";

export type PlannerSubjectKey = "Maths" | "Science";

export interface PlannerInputs {
  daysLeft: number;
  mathTargetPercent: number;
  scienceTargetPercent: number;
  mathHoursPerDay: number;
  scienceHoursPerDay: number;
}

type AnyTier = TopicTier | ScienceTierKey | undefined;

// Simple multipliers so “must-crack” gets more days than “good-to-do”
const TIER_MULTIPLIER: Record<string, number> = {
  "must-crack": 1.3,
  "high-roi": 1.1,
  "good-to-do": 0.8,
};

interface ChapterPlan {
  name: string;
  tier: AnyTier;
  weightage: number;
  daysAllocated: number;
}

function getTierMultiplier(tier: AnyTier): number {
  if (!tier) return 1;
  return TIER_MULTIPLIER[tier] ?? 1;
}

function buildSubjectChapterPlans(
  subject: PlannerSubjectKey,
  subjectDays: number
): ChapterPlan[] {
  if (subjectDays <= 0) return [];

  if (subject === "Maths") {
    // Maths: use topic trend list
    const sorted = [...class10TopicTrendList].sort(
      (a, b) => b.weightagePercent - a.weightagePercent
    );

    const totalEffective = sorted.reduce((sum, t) => {
      const m = getTierMultiplier(t.tier);
      return sum + t.weightagePercent * m;
    }, 0);

    return sorted.map((t) => {
      const m = getTierMultiplier(t.tier);
      const effective = t.weightagePercent * m;
      const fraction = totalEffective > 0 ? effective / totalEffective : 0;
      // At least 1 day for any chapter that appears in the plan
      const daysAllocated = Math.max(1, Math.round(subjectDays * fraction));

      return {
        name: t.topicKey,
        tier: t.tier,
        weightage: t.weightagePercent,
        daysAllocated,
      };
    });
  }

  // Science
  const sortedSci = [...class10ScienceTopicTrendList].sort(
    (a, b) => b.weightagePercent - a.weightagePercent
  );

  const totalEffectiveSci = sortedSci.reduce((sum, t) => {
    const m = getTierMultiplier(t.tier);
    return sum + t.weightagePercent * m;
  }, 0);

  return sortedSci.map((t) => {
    const m = getTierMultiplier(t.tier);
    const effective = t.weightagePercent * m;
    const fraction = totalEffectiveSci > 0 ? effective / totalEffectiveSci : 0;
    const daysAllocated = Math.max(1, Math.round(subjectDays * fraction));

    return {
      name: t.topicName,
      tier: t.tier,
      weightage: t.weightagePercent,
      daysAllocated,
    };
  });
}

// Nice teacher-y label
function tierLabel(tier: AnyTier): string {
  if (tier === "must-crack") return "🔥 must-crack";
  if (tier === "high-roi") return "💎 high-ROI";
  if (tier === "good-to-do") return "🌈 good-to-do";
  return "";
}

/**
 * Builds a text snapshot for the Mentor panel *and* for the Study Plan page.
 * Persona: CBSE teacher with 20+ years of guiding Class 10 students.
 */
export function buildPlannerSnapshot(inputs: PlannerInputs): string {
  const {
    daysLeft,
    mathTargetPercent,
    scienceTargetPercent,
    mathHoursPerDay,
    scienceHoursPerDay,
  } = inputs;

  const totalHours = mathHoursPerDay + scienceHoursPerDay;
  const safeDays = Math.max(0, daysLeft);

  // If a student gives zero hours (it happens 😅)
  if (totalHours <= 0 || safeDays <= 0) {
    return [
      "Let’s set up something realistic first 👇",
      "",
      "• You’ve currently set 0 hours/day or 0 days left.",
      "• For a meaningful plan, give me at least 1 hour/day and a realistic days-to-boards estimate.",
      "",
      "Once that’s in place, I’ll break the time between Maths and Science using chapter weightage + your targets.",
    ].join("\n");
  }

  // Split days between subjects in proportion to hours/day
  const mathsDayShare = mathHoursPerDay / totalHours;
  const scienceDayShare = scienceHoursPerDay / totalHours;

  const mathsDays = Math.max(5, Math.round(safeDays * mathsDayShare));
  const scienceDays = Math.max(5, Math.round(safeDays * scienceDayShare));

  const mathsChapters = buildSubjectChapterPlans("Maths", mathsDays);
  const scienceChapters = buildSubjectChapterPlans("Science", scienceDays);

  // Limit to top chapters for snapshot (full list can go on Study Plan page)
  const topMaths = mathsChapters.slice(0, 7);
  const topScience = scienceChapters.slice(0, 7);

  const headerLines = [
    "Planner snapshot based on current inputs (teacher-mode) 👇",
    "",
    `• Days left to boards: ${safeDays}`,
    `• Maths target: ${mathTargetPercent}%  |  Hours/day: ${mathHoursPerDay}`,
    `• Science target: ${scienceTargetPercent}%  |  Hours/day: ${scienceHoursPerDay}`,
    "",
    "I’m assuming you’ll also study other subjects, so I’m keeping this plan realistic, not brutal.",
    "",
  ];

  const mathsLines: string[] = [
    "MATHS – high impact first:",
    `→ Roughly ${mathsDays} focused Maths days over the next ${safeDays} days.`,
  ];

  topMaths.forEach((ch) => {
    mathsLines.push(
      `• ${ch.name}  (${ch.weightage}% paper)${
        tierLabel(ch.tier) ? " · " + tierLabel(ch.tier) : ""
      } – ~${ch.daysAllocated} day(s) of first-time study + practice`
    );
  });

  mathsLines.push(
    "• Last 7–10 days: only revision + PYQ/HPQ mocks from these same chapters."
  );

  const scienceLines: string[] = [
    "",
    "SCIENCE – keep Physics, Chem, Bio balanced:",
    `→ Roughly ${scienceDays} focused Science days over the next ${safeDays} days.`,
  ];

  topScience.forEach((ch) => {
    scienceLines.push(
      `• ${ch.name}  (${ch.weightage}% paper)${
        tierLabel(ch.tier) ? " · " + tierLabel(ch.tier) : ""
      } – ~${ch.daysAllocated} day(s) for concept notes + NCERT + PYQs`
    );
  });

  scienceLines.push(
    "• Final 7–10 days: only full-syllabus revision + mixed chapter practice papers."
  );

  const closingLines = [
    "",
    "This is your high-level roadmap. On the Study Plan page, we’ll break this into a day-wise timetable you can tick off.",
  ];

  return [
    ...headerLines,
    ...mathsLines,
    ...scienceLines,
    ...closingLines,
  ].join("\n");
}
