// src/ui/microcopy/userFeedbackAlertsCopyVariants.ts
//
// Alternative tone variants for user feedback and alerts.  Each key corresponds
// to an alert identifier from userFeedbackAlertsCopy, with two variants:
// a shorter form (`short`) and a more enthusiastic form (`extraHype`).
// Use these variants to dynamically switch tone based on user preference
// or context (e.g. quick toast vs celebratory banner).

export interface FeedbackAlertVariant {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface FeedbackAlertVariants {
  short: FeedbackAlertVariant;
  extraHype: FeedbackAlertVariant;
}

export const userFeedbackAlertsCopyVariants: Record<string, any> = {
  mix: {
    saved: {
      short: { title: 'Mix saved', message: 'We’ve saved your spot in today’s mix. Jump back in anytime. 👍' },
      extraHype: { title: 'Mix locked in 🎧', message: 'Bookmark set, playlist ready — your Daily Mix is waiting whenever you are.' },
    },
    saveError: {
      short: { title: 'Mix not saved', message: 'Tiny glitch. Your answers are safe, but we may not remember this exact spot.' },
      extraHype: { title: 'Oops, mix didn’t save 😅', message: 'Tech hiccup only — marks safe, progress safe. Just restart the mix and we’ll roll again.' },
    },
    completed: {
      short: { title: 'Mix done 🎉', message: 'You just finished {{minutes}} mins of focused prep. Nice clear win.' },
      extraHype: { title: 'Daily Mix cleared 🔥', message: '{{minutes}} mins of pure board grind in the bank — that’s how toppers eat exams for breakfast.' },
    },
    discarded: {
      short: { title: 'Mix closed', message: 'We’ve saved what matters. Start a fresh mix whenever you want.' },
      extraHype: { title: 'Session parked 🚗', message: 'Today’s effort is recorded — next time you’re ready, we’ll spin up a fresh mix for you.' },
    },
    resumed: {
      short: { title: 'Back to your mix', message: 'Picking up from where you paused last time. 🎧' },
      extraHype: { title: 'Welcome back to the grind 💪', message: 'We’ve reloaded your Daily Mix from the exact question you left on — hit play and finish the streak.' },
    },
  },
  streak: {
    maintained: {
      short: { title: 'Streak saved 🌟', message: 'Today counts as a No Zero Day — streak is still alive.' },
      extraHype: { title: 'Streak still on fire 🔥', message: 'Another day, another tick — your No Zero Days streak is starting to look legendary.' },
    },
    lostBeast: {
      short: { title: 'Streak reset', message: 'Yesterday broke the streak, but your progress is still here. Start a new run today.' },
      extraHype: { title: 'Streak reset, story not over 💥', message: 'One off day doesn’t delete your grind — spin up a short Beast session now and begin a stronger streak.' },
    },
    lostZombie: {
      short: { title: 'Fresh start 🌱', message: 'Streak टूट गई, पर प्रोग्रेस सेफ है. आज बस एक हल्का ज़ॉम्बी सेशन कर लो.' },
      extraHype: { title: 'New chapter, same goal ✨', message: 'Old streak गया, पर बोर्ड अभी भी जीतना है — एक chill Zombie सेशन और नई रन शुरू.' },
    },
    almostNextBadge: {
      short: { title: 'Badge almost unlocked', message: 'Just {{daysToNext}} more No Zero Days till **{{nextBadgeName}}** is yours.' },
      extraHype: { title: 'One push away from {{nextBadgeName}} 🏅', message: 'Stay locked in for {{daysToNext}} more days and **{{nextBadgeName}}** joins your flex wall.' },
    },
  },
  vibe: {
    switchToBeastConfirm: {
      short: { title: 'Go Beast Mode? ⚡', message: 'We’ll send tougher questions and longer mixes. Ready to turn it up?', confirmLabel: 'Yes, go Beast', cancelLabel: 'Not today' },
      extraHype: { title: 'Unlock Beast Mode grind? 💪', message: 'Harder questions, full‑rigour mixes, real exam simulation — hit confirm only if you’re ready to go all‑in.', confirmLabel: 'Yes, go Beast', cancelLabel: 'Not today' },
    },
    switchToZombieConfirm: {
      short: { title: 'Go Zombie Mode? 😴', message: 'We’ll keep it light — short revision, easy MCQs, streak‑safe sessions.', confirmLabel: 'Yes, keep it chill', cancelLabel: 'Stay Beast' },
      extraHype: { title: 'Switch to chill‑day mode? 🧸', message: 'We’ll go full comfort: bite‑sized revision, simple MCQs and just enough to keep the streak alive.', confirmLabel: 'Yes, keep it chill', cancelLabel: 'Stay Beast' },
    },
    switchedBeast: {
      short: { title: 'Beast Mode on ⚡', message: 'Expect tougher questions and longer sets from now.' },
      extraHype: { title: 'Beast Mode activated 💥', message: 'Hard mode unlocked — this is where accuracy grows and boards start looking scared.' },
    },
    switchedZombie: {
      short: { title: 'Zombie Mode on 😴', message: 'Low‑pressure study only — even 10 mins counts.' },
      extraHype: { title: 'Chill mode activated 🧸', message: 'We’ve dialled things down — light revision, easy wins, streak protected while your brain rests.' },
    },
  },
  commandPalette: {
    opened: {
      short: { title: 'Command Palette', message: 'Type a topic, mode or command — try “Daily Mix” or “Practice Trigo”.' },
      extraHype: { title: 'Command Palette, pro‑mode ⚙️', message: 'Search like a topper: jump straight to Daily Mix, HPQs or stats with a few keystrokes.' },
    },
    noResults: {
      short: { title: 'No exact match', message: 'Try a shorter word like “Trigo” or “Mix” and we’ll find something.' },
      extraHype: { title: 'Hmm, nothing yet 👀', message: 'We couldn’t find a perfect match — tweak the spelling or try a simpler keyword like “trigo” or “mix”.' },
    },
    executed: {
      short: { title: 'Running command…', message: 'Hang on, taking you there. ✨' },
      extraHype: { title: 'On it ⚡', message: 'Got your command — loading the right screen so you can start in a couple of seconds.' },
    },
  },
  weeklyWrapped: {
    ready: {
      short: { title: 'Weekly Wrapped ready 🎉', message: 'See your hours, streak and must‑crack wins for this week.' },
      extraHype: { title: 'Your Weekly Wrapped just dropped 📊', message: 'Full recap unlocked — hours, wins, streaks and power hour all in one flex‑worthy story.' },
    },
    viewed: {
      short: { title: 'Recap viewed ✅', message: 'Now turn that story into next week’s game plan.' },
      extraHype: { title: 'Story reviewed, next chapter time ✍️', message: 'You’ve seen the numbers — set tiny goals for next week and push the graph a little higher.' },
    },
    shareSuccess: {
      short: { title: 'Shared 🚀', message: 'Weekly Wrapped sent. Your study squad has seen the grind.' },
      extraHype: { title: 'Shared like a champ 🏆', message: 'Your Weekly Wrapped is out in the wild — let the squad see how serious this board prep is.' },
    },
    shareError: {
      short: { title: 'Share failed 😅', message: 'Couldn’t share this time. Try again in a bit.' },
      extraHype: { title: 'Share didn’t go through ⚠️', message: 'Looks like the share link tripped — give it another shot when your network behaves.' },
    },
  },
  generic: {
    undoSuccess: {
      short: { title: 'Action undone', message: 'All good — we’ve rolled that change back.' },
      extraHype: { title: 'Undo worked ✅', message: 'You’re back to where you were — edit away without fear.' },
    },
    actionFailed: {
      short: { title: 'Something went off', message: 'Try again in a moment or refresh the page.' },
      extraHype: { title: 'That didn’t land 😬', message: 'The action failed this time — quick refresh or retry usually fixes it.' },
    },
    tipBeast: {
      short: { title: 'Beast tip', message: 'Aim for one full Daily Mix plus one HPQ set on Beast days.' },
      extraHype: { title: 'Beast‑mode hack ⚡', message: 'On Beast days, one full mix + one HPQ set = lethal board combo.' },
    },
    tipZombie: {
      short: { title: 'Zombie tip', message: 'Short, light sessions still count — one mini mix keeps the streak alive.' },
      extraHype: { title: 'Chill‑day hack 😴', message: 'Zero‑energy day? One tiny Zombie‑mode mix still stacks XP and protects your streak.' },
    },
  },
};

export default userFeedbackAlertsCopyVariants;