// src/ui/theme.ts
//
// Design tokens for colours used across the LazyTopper UI. The palette
// is designed to feel bright, playful and still serious about marks. It
// supports high‑energy Beast mode and low‑energy Zombie mode, plus
// neutral states. Generated from Task S14.

export const colors = {
  indigoDeep: '#020617',
  indigoPrimary: '#4F46E5',
  indigoSoft: '#6366F1',
  mintBright: '#22C55E',
  aquaMint: '#2DD4BF',
  lilacSoft: '#C4B5FD',
  pinkPlayful: '#FB7185',
  amberHighlight: '#FBBF24',
  slateDark: '#111827',
  slateMid: '#4B5563',
  slateLight: '#9CA3AF',
};

// Define semantic colour groups for different vibe modes and contexts.
export const vibeColors = {
  beast: {
    primary: colors.indigoPrimary,
    secondary: colors.amberHighlight,
    success: colors.mintBright,
    progress: colors.aquaMint,
    background: colors.slateDark,
  },
  zombie: {
    primary: colors.lilacSoft,
    secondary: colors.slateMid,
    success: colors.mintBright,
    progress: colors.aquaMint,
    background: colors.slateDark,
  },
};

// Icons and emoji suggestions by feature. This object is a loose
// reference for designers/developers when choosing icons in the UI.
export const icons = {
  vibeToggle: {
    beast: ['zap', 'bolt', 'flame', '⚡', '🔥', '💪'],
    zombie: ['moon', 'zzz', '🧸', '😴', '🌙'],
  },
  commandPalette: {
    search: ['magnifying-glass'],
    keyboardHint: ['⌨️'],
    sections: {
      commands: '⚙️',
      topics: '📚',
      practicePacks: '🎯',
      shortcuts: '⏱️',
    },
  },
  dailyMix: {
    controls: {
      play: 'play-circle',
      pause: 'pause-circle',
      next: 'chevron-right',
      shuffle: 'shuffle',
      playlist: 'queue-music',
    },
    emojis: {
      concept: '🎧',
      next: '▶',
      shuffle: '🔀',
      complete: ['✅', '🎉'],
    },
  },
  weeklyWrapped: {
    slide1: { icons: ['clock', 'calendar'], emojis: ['⏱️', '📅', '🎉'] },
    slide2: { icons: ['target', 'medal'], emojis: ['🔓', '🎯', '😎'] },
    slide3: { icons: ['trend-up', 'check-circle'], emojis: ['📈', '✨'] },
    slide4: { icons: ['flame', 'trophy', 'shield'], emojis: ['🔥', '🏅', '🌱'] },
    slide5: { icons: ['share', 'rocket'], emojis: ['📚', '🤝', '🚀'] },
  },
};