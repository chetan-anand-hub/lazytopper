// src/ui/microcopy/weeklyWrappedStoryCopy_hi.ts
//
// Hindi localisation of the Weekly Wrapped story copy.
// This mirrors the structure of weeklyWrappedStoryCopy.ts but provides
// translations for headlines, subheadlines and body text. The design
// uses the same slide keys (slide1, slide2, slide3, slide4, slide4Reset,
// slide5) to allow easy switching based on the selected language.

export interface WeeklyWrappedSlideCopyHi {
  headline: string;
  subheadline: string;
  body: string[];
  emojis: string[];
}

export const weeklyWrappedStoryCopyHi: Record<string, WeeklyWrappedSlideCopyHi> = {
  slide1: {
    headline: 'तुम्हारा Weekly Wrapped 🎉',
    subheadline: 'इस हफ़्ते तुमने सच में कितना मेहनत किया, उसका छोटा सा री-कैप।',
    body: [
      'तुमने इस हफ़्ते **{{activeDays}} दिन** में कुल **{{totalHours}} घंटे** पढ़ाई की।',
      'ये पूरा board‑prep टाइम है — exam hall वाला future‑you अभी से thank you बोल रहा है। 💪',
    ],
    emojis: ['🎉', '⏱️', '📚', '💪'],
  },
  slide2: {
    headline: 'Must‑Crack Missions 🔓',
    subheadline: 'जहां से तुमने सबसे स्मार्ट मार्क्स उठाए।',
    body: [
      'तुमने इस हफ़्ते **{{mustCrackCompleted}} must‑crack सवाल** सॉल्व किए।',
      'सबसे ज़्यादा damage **{{topTopics}}** में हुआ — ये chapters अब तुम्हारे लिए almost free‑marks जैसे हैं। 😎',
    ],
    emojis: ['🔓', '🎯', '😎'],
  },
  slide3: {
    headline: 'Accuracy Glow‑Up 📈',
    subheadline: 'तुम्हारे answers कितने ज़्यादा sharp हुए।',
    body: [
      'इस हफ़्ते तुम्हारी accuracy **{{accuracyThisWeek}}%** रही (पिछले हफ़्ते से {{deltaText}}).',
      'ऐसी छोटी‑छोटी jumps ही मिलकर silly mistakes को boards से पहले गायब कर देती हैं। ✨',
    ],
    emojis: ['📈', '✨'],
  },
  slide4: {
    headline: 'Streak & Badges 🔥',
    subheadline: 'ऐसी consistency जिसे exam papers ignore नहीं कर सकते।',
    body: [
      'तुम **{{streakDays}}‑day No Zero Days** streak पर हो — toppers भी ऐसे ही रोज़ थोड़ा‑थोड़ा grind करते हैं।',
      'इस हफ़्ते के नए badges: **{{badgeNames}}**. Screenशॉट लो, flex करो, फिर अगला level push करो। 🏅',
    ],
    emojis: ['🔥', '🏅'],
  },
  slide4Reset: {
    headline: 'Streak & Badges 🔥',
    subheadline: 'ऐसी consistency जिसे exam papers ignore नहीं कर सकते।',
    body: [
      'Streak रीसेट हो गई, पर तुम्हारी मेहनत गई नहीं — तुमने फिर भी **{{totalHours}} घंटे** काम किया।',
      'आज बस एक short Daily Mix से fresh रन शुरू कर दो और streak वापस build करो। 🌱',
    ],
    emojis: ['🔥', '🌱'],
  },
  slide5: {
    headline: 'Next Week, Level Up 📚',
    subheadline: 'छोटे goals अभी, बड़ा flex board वाले दिन।',
    body: [
      'Next week के लिए easy win: **{{nextWeekGoal}}** — मतलब रोज़ एक Daily Mix और साथ में **{{mockTarget}}** छोटे mocks.',
      'बस **Auto‑build my week** टैप करो, प्लान lock हो जाएगा; फिर **Share** से अपना Weekly Wrapped study squad को दिखाओ. 🤝',
    ],
    emojis: ['📚', '✅', '🤝', '🚀'],
  },
};

export default weeklyWrappedStoryCopyHi;