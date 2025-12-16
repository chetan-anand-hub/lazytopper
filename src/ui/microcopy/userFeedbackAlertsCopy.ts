// src/ui/microcopy/userFeedbackAlertsCopy.ts
//
// Copy definitions for user feedback and alerts throughout LazyTopper.
// These messages correspond to actions like saving a mix, losing a streak,
// switching vibe modes, command palette interactions and weekly wrap
// recaps. Generated from Task S15.

export const userFeedbackAlertsCopy = {
  mix: {
    saved: {
      title: 'Mix saved 👍',
      message: 'We’ll remember where you stopped. Pick up your Daily Mix anytime.',
    },
    saveError: {
      title: 'Couldn’t save mix 😅',
      message: 'Something glitched. Your answers are safe, but we may not remember the exact spot.',
    },
    completed: {
      title: 'Daily Mix complete 🎉',
      message: 'Nice work — you just banked {{minutes}} mins of real board prep.',
    },
    discarded: {
      title: 'Mix closed',
      message: 'Today’s progress is saved. Start a fresh mix whenever you’re ready.',
    },
    resumed: {
      title: 'Welcome back 🎧',
      message: 'Picking up your Daily Mix from where you left off.',
    },
  },
  streak: {
    maintained: {
      title: 'Streak saved 🌟',
      message: 'Today counts as a No Zero Day. Keep the run going!',
    },
    lostBeast: {
      title: 'Streak reset 😬',
      message:
        'Yesterday broke the streak, but your progress is still here. Smash one short Beast session to start a new run.',
    },
    lostZombie: {
      title: 'Streak reset, fresh start 🌱',
      message:
        'Streak टूट गई, पर प्रोग्रेस सेफ है। आज बस एक हल्का ज़ॉम्बी सेशन कर लो और नई रन शुरू समझो.',
    },
    almostNextBadge: {
      title: 'So close to your next badge 👀',
      message:
        'Only {{daysToNext}} more No Zero Days till **{{nextBadgeName}}** unlocks.',
    },
  },
  vibe: {
    switchToBeastConfirm: {
      title: 'Switch to Beast Mode? ⚡',
      message:
        'In Beast Mode we’ll send harder questions and longer mixes. Ready for serious grind?',
      confirmLabel: 'Yes, go Beast',
      cancelLabel: 'Not today',
    },
    switchToZombieConfirm: {
      title: 'Switch to Zombie Mode? 😴',
      message:
        'We’ll keep it light — short revision, easy MCQs, streak‑safe sessions only.',
      confirmLabel: 'Yes, keep it chill',
      cancelLabel: 'Stay Beast',
    },
    switchedBeast: {
      title: 'Beast Mode on ⚡',
      message: 'Harder practice unlocked. Let’s farm some high‑value marks.',
    },
    switchedZombie: {
      title: 'Zombie Mode on 😴',
      message: 'Chill, low‑pressure study activated. Even 10 mins counts today.',
    },
  },
  commandPalette: {
    opened: {
      message: 'Type a topic, mode or command — try “Daily Mix” or “Practice Trigo”.',
    },
    noResults: {
      message: 'No exact match. Try a simpler word like “Trigo” or “Mix”.',
    },
    executed: {
      message: 'Command running… ✨',
    },
  },
  weeklyWrapped: {
    ready: {
      title: 'Your Weekly Wrapped is ready 🎉',
      message: 'See your hours, streak and must‑crack wins for this week.',
    },
    viewed: {
      title: 'Recap checked ✅',
      message: 'Nice — now turn that story into next week’s game plan.',
    },
    shareSuccess: {
      title: 'Shared! 🚀',
      message: 'Weekly Wrapped sent. Your study squad now knows you’re grinding.',
    },
    shareError: {
      title: 'Couldn’t share 😅',
      message: 'Share failed this time. You can try again in a bit.',
    },
  },
  generic: {
    undoSuccess: {
      message: 'Done. We’ve rolled that action back.',
    },
    actionFailed: {
      message: 'Something went off. Try again in a moment or refresh the page.',
    },
    tipBeast: {
      message:
        'Pro tip: In Beast Mode, aim for at least one full Daily Mix + one HPQ set.',
    },
    tipZombie: {
      message:
        'Pro tip: On Zombie days, tiny sessions still count. One light mix keeps the streak alive.',
    },
  },
};