// src/ui/microcopy/weeklyWrappedStoryCopy.ts
//
// Structured copy for the Weekly Wrapped recap slides. Each slide
// contains a headline, subheadline, body text (as an array of strings)
// and a suggested emoji palette. Placeholders (e.g. {{totalHours}})
// will be replaced at runtime with actual metrics. Generated from
// Task S13.

export interface WeeklyWrappedSlideCopy {
  headline: string;
  subheadline: string;
  body: string[];
  emojis: string[];
}

export const weeklyWrappedStoryCopy: Record<string, WeeklyWrappedSlideCopy> = {
  slide1: {
    headline: 'Your Weekly Wrapped 🎉',
    // Updated copy from Task S16: emphasises how hard the student showed up.
    subheadline: 'Here’s how hard you actually showed up this week.',
    body: [
      'You clocked **{{totalHours}} hours** across **{{activeDays}} days** of study.',
      'That’s real board‑prep time — future‑you in the exam hall is already saying thanks. 💪',
    ],
    // Suggested emojis updated to include study/time icons.
    emojis: ['🎉', '⏱️', '📚', '💪'],
  },
  slide2: {
    headline: 'Must‑Crack Missions 🔓',
    // Updated subheadline from Task S16.
    subheadline: 'Chapters where you grabbed the smartest marks.',
    body: [
      'You cracked **{{mustCrackCompleted}} must‑crack questions** this week.',
      'Big wins in **{{topTopics}}** — these chapters are turning into easy‑marks territory for you. 😎',
    ],
    emojis: ['🔓', '🎯', '😎'],
  },
  slide3: {
    headline: 'Accuracy Glow‑Up 📈',
    // Updated subheadline from Task S16.
    subheadline: 'How much sharper your answers got.',
    body: [
      'Your accuracy this week was **{{accuracyThisWeek}}%** ({{deltaText}} vs last week).',
      'Tiny jumps like this stack up — that’s how silly mistakes quietly disappear before boards. ✨',
    ],
    emojis: ['📈', '✨'],
  },
  slide4: {
    headline: 'Streak & Badges 🔥',
    // Updated subheadline and body copy from Task S16 variant A.
    subheadline: 'Consistency that exam papers can’t ignore.',
    body: [
      // Variant A (streak active)
      'You’re on a **{{streakDays}}‑day No Zero Days streak** — this is exactly how toppers train, not just cram.',
      'New this week: **{{badgeNames}}**. Screenshot it, flex it, then keep going. 🏅',
    ],
    emojis: ['🔥', '🏅'],
  },
  slide4Reset: {
    headline: 'Streak & Badges 🔥',
    // Variant B (streak reset) updated copy from Task S16.
    subheadline: 'Consistency that exam papers can’t ignore.',
    body: [
      'Your streak reset, but your effort didn’t vanish — you still logged **{{totalHours}} hours** of work.',
      'Start a fresh run today with one short Daily Mix and let the streak climb again. 🌱',
    ],
    emojis: ['🔥', '🌱'],
  },
  slide5: {
    headline: 'Next Week, Let’s Level Up 📚',
    subheadline: 'Tiny goals now, big flex on board day.',
    // Updated body copy from Task S16.
    body: [
      'Easy win for next week: **{{nextWeekGoal}}** — think one Daily Mix a day plus **{{mockTarget}}** quick mocks.',
      'Hit **Auto‑build my week** to lock in the plan, then tap **Share** to flex your Weekly Wrapped with your study squad. 🤝',
    ],
    emojis: ['📚', '✅', '🤝'],
  },
};

export default weeklyWrappedStoryCopy;