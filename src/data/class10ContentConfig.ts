// src/data/class10ContentConfig.ts

export type Class10SubjectKey = "Maths" | "Science";
export type Class10StreamKey = "Physics" | "Chemistry" | "Biology";

export type Priority = "must-do" | "should-do" | "good-to-know";

// Trends tiers
export type TopicTier = "must-crack" | "high-roi" | "good-to-do";

export interface TopicSectionConfig {
  id: string; // A / B / C / D / E
  label: string; // section label
  marksLabel: string; // "1 mark", "2 marks" etc.
  blurb: string;
}

// --- Rich content helpers ---------------------------------------

export interface ConceptCard {
  id: string;
  title: string;
  summary: string; // mini note, 2–4 lines
  examTip?: string; // “Board tip”
}

export interface BoardExample {
  id: string;
  title: string;
  question: string;
  patternTag?: string; // e.g. "HCF using Euclid"
}

export interface RichMistake {
  id: string;
  title: string;
  whatGoesWrong: string;
  fix: string;
}

export interface RecommendedVideo {
  title: string;
  url: string;
  channel?: string;
  meta?: string; // “2 hr one-shot | NCERT + PYQ”
}

// --- Main config type -------------------------------------------

export interface TopicContentConfig {
  topicKey: string;
  topicName: string;
  subjectKey: Class10SubjectKey;
  tier: TopicTier;
  weightagePercent: number;

  heroTagline: string;

  examLinkCaption: string;
  examSections: TopicSectionConfig[];

  quickRevisionRoadmap: string[]; // bullet points
  keyConceptsSummary: string;
  boardExamplesSummary: string;

  // YouTube / video
  recommendedVideoSummary: string;
  recommendedVideoUrl?: string;
  recommendedVideo?: RecommendedVideo;

  // Deep content – optional (TopicHub falls back gracefully)
  conceptNotes?: ConceptCard[];
  boardExamples?: BoardExample[];
  commonMistakes?: Array<string | RichMistake>;

  howToUseSteps: string[];
}

// Tiny placeholder so any legacy imports keep working.
// TopicHub should use getTopicContent instead.
export const class10ContentConfig: Record<string, never> = {};
export default class10ContentConfig;

// ----------------------------------------------------------------
// Generic builder – safe default for any topic
// ----------------------------------------------------------------

type GenericArgs = {
  subjectKey: Class10SubjectKey;
  topicKey: string;
  topicName: string;
  tier?: TopicTier;
  weightagePercent?: number;
};

export function buildGenericTopicConfig({
  subjectKey,
  topicKey,
  topicName,
  tier,
  weightagePercent,
}: GenericArgs): TopicContentConfig {
  const safeTier: TopicTier = tier ?? "high-roi";
  const safeWeight = weightagePercent ?? 5;

  return {
    topicKey,
    topicName,
    subjectKey,
    tier: safeTier,
    weightagePercent: safeWeight,

    heroTagline:
      subjectKey === "Maths"
        ? `Fast-track your ${topicName} prep with a single scroll-friendly page.`
        : `Revision-friendly ${topicName} notes so you can cover Science without burnout.`,

    examLinkCaption:
      "See how this topic shows up across CBSE sections. Focus on the sections tagged in the Trends and Predict tabs.",

    examSections: [
      {
        id: "A",
        label: "MCQs / Objective",
        marksLabel: "1 mark",
        blurb: "Concept checks & quick facts.",
      },
      {
        id: "B",
        label: "Very short answer",
        marksLabel: "2 marks",
        blurb: "One small calculation / reason.",
      },
      {
        id: "C",
        label: "Short answer",
        marksLabel: "3 marks",
        blurb: "3–4 line working with steps.",
      },
      {
        id: "D",
        label: "Long answer",
        marksLabel: "4–5 marks",
        blurb: "Full derivation / application.",
      },
      {
        id: "E",
        label: "Case-based",
        marksLabel: "4 marks",
        blurb: "Data / graph / passage based.",
      },
    ],

    quickRevisionRoadmap: [
      `Step 1: Skim all NCERT examples for ${topicName} and mark anything that feels tricky.`,
      "Step 2: Solve last 3–5 years of PYQs only from this chapter and star questions that took time.",
      "Step 3: Build 1–2 mini-mocks using LazyTopper’s Predict / HPQ tabs and time yourself.",
      "Step 4: For every wrong or slow question, write one-line reason: “Where did I get stuck?”",
    ],

    keyConceptsSummary:
      `We’re curating detailed concept cards for ${topicName}. For now, keep a small list in your notebook: (1) core definitions, (2) formulas / key results, (3) 2–3 most common PYQ patterns.`,

    boardExamplesSummary:
      `Full board-style examples for ${topicName} are coming soon. Till then, open Highly Probable Questions, filter by this chapter and do at least 5 questions in one sitting.`,

    recommendedVideoSummary:
      `Pick ONE good “${topicName} class 10 one-shot” video on YouTube. Watch at 1.25× speed but pause at every example and try it yourself first.`,

    recommendedVideoUrl: undefined,
    recommendedVideo: undefined,

    commonMistakes: [
      `Skipping NCERT examples in ${topicName} and jumping straight to random coaching sheets.`,
      "Not analysing exactly where marks were lost in mocks – was it concept, formula, or silly slip?",
    ],

    howToUseSteps: [
      "Skim this page once before starting PYQs / mocks for this topic.",
      "After every mock, come back and match your mistakes with this ‘Common mistakes’ list.",
      "Turn repeated mistakes into tiny flashcards / notes and revise them 2–3 times before boards.",
    ],
  };
}

// =================================================================
// HAND-CRAFTED TOPIC CONFIGS
// These are the “hero” topics with real content, not just directions.
// =================================================================

// -----------------------------------------------------------------
// MATHS: REAL NUMBERS
// -----------------------------------------------------------------

const realNumbersBase = buildGenericTopicConfig({
  subjectKey: "Maths",
  topicKey: "real-numbers",
  topicName: "Real Numbers",
  tier: "high-roi",
  weightagePercent: 5,
});

const realNumbersConfig: TopicContentConfig = {
  ...realNumbersBase,
  heroTagline:
    "Small chapter but guaranteed proof + reasoning questions – pure bonus marks if you revise once properly.",

  quickRevisionRoadmap: [
    "1️⃣ Revise Euclid’s Division Algorithm: a = bq + r, 0 ≤ r < b. Practise 3 HCF questions using repeated division.",
    "2️⃣ Do 4–5 sums on Fundamental Theorem of Arithmetic – write any integer as product of primes and use it to find HCF/LCM.",
    "3️⃣ Learn the decimal expansion rule: in lowest form p/q, if q = 2^m × 5^n ⇒ terminating; otherwise non-terminating recurring. Solve mixed PYQs.",
    "4️⃣ Practise 2–3 ‘prove √2, √3 type numbers are irrational’ questions with clean step-wise reasoning.",
  ],

  keyConceptsSummary:
    "Lock these three: (i) Euclid’s Division Algorithm for HCF, (ii) Fundamental Theorem of Arithmetic (unique prime factorisation), (iii) decimal expansion criteria for rational numbers. For each, know the statement, one standard proof idea, and 2–3 question patterns: HCF/LCM using Euclid, “express as product of primes”, and terminating vs non-terminating decimals. These alone cover most board questions from this chapter.",

  boardExamplesSummary:
    "Typical PYQs: prove √2 or √3 is irrational; use Euclid to find HCF of two numbers; decide whether a rational number has terminating or non-terminating decimal expansion; express a given decimal as p/q and comment on its type. Keep one solved example of each pattern in your notebook.",

  recommendedVideoSummary:
    "Choose a 30–40 min ‘Real Numbers one-shot’ that slowly explains all proofs. One focused watch + written notes > 5 random reels.",
  recommendedVideoUrl: "https://www.youtube.com/watch?v=_0ooaKrdubI",
  recommendedVideo: {
    title: "Real Numbers Class 10 Maths | Full Chapter One-Shot",
    url: "https://www.youtube.com/watch?v=_0ooaKrdubI",
    channel: "Shobhit Nirwan",
    meta: "≈1 hr one-shot • Proofs + PYQs",
  },

  conceptNotes: [
    {
      id: "euclid-division",
      title: "Euclid’s Division Algorithm & HCF",
      summary:
        "For integers a, b (b > 0), we can write a = bq + r. Repeating this on (b, r) gives HCF(a, b). Board questions use this to find HCF or prove facts like “HCF of two consecutive integers is 1”.",
      examTip:
        "Always mention “by Euclid’s Division Algorithm, we have…” and show at least 2–3 steps of division.",
    },
    {
      id: "fta",
      title: "Fundamental Theorem of Arithmetic",
      summary:
        "Every composite number can be written as a unique product of primes (apart from order). Used to compute HCF/LCM and to prove irrationality results.",
      examTip:
        "When proving irrationality, express numbers using their prime factorisation and reach a contradiction like “2 divides p but also p is odd”.",
    },
    {
      id: "decimal-expansion",
      title: "Decimal expansion of rational numbers",
      summary:
        "If p/q is in lowest form and q = 2^m × 5^n, the decimal of p/q terminates. If q has any other prime factor, the decimal is non-terminating recurring.",
      examTip:
        "For ‘type of decimal’ questions, always reduce to lowest form before checking prime factors of the denominator.",
    },
  ],

  commonMistakes: [
    "Forgetting to write “a = bq + r, 0 ≤ r < b” while using Euclid’s division algorithm.",
    "Not reducing the fraction to lowest form before applying the terminating / non-terminating rule.",
    "Writing proofs of irrational numbers without clearly stating the contradiction (e.g., ‘2 divides p but p is odd’).",
  ],

  boardExamples: [
    {
      id: "rn-ex1",
      title: "Terminating or not?",
      question:
        "Without dividing, determine whether 13/3125 has a terminating or non-terminating recurring decimal expansion.",
      patternTag: "Decimal expansion test",
    },
    {
      id: "rn-ex2",
      title: "HCF using Euclid",
      question:
        "Use Euclid’s Division Algorithm to find the HCF of 455 and 42 and verify it using prime factorisation.",
      patternTag: "Euclid HCF",
    },
    {
      id: "rn-ex3",
      title: "Irrational root proof",
      question: "Prove that √3 is irrational.",
      patternTag: "Irrational proof",
    },
  ],
};

// -----------------------------------------------------------------
// MATHS: PAIR OF LINEAR EQUATIONS IN TWO VARIABLES
// -----------------------------------------------------------------

const pleBase = buildGenericTopicConfig({
  subjectKey: "Maths",
  topicKey: "pair-of-linear-equations",
  topicName: "Pair of Linear Equations in Two Variables",
  tier: "must-crack",
  weightagePercent: 10,
});

const pleConfig: TopicContentConfig = {
  ...pleBase,
  heroTagline:
    "Master elimination / substitution once and you’ve already locked in multiple 3–4 mark questions.",

  quickRevisionRoadmap: [
    "1️⃣ Write equations in standard form ax + by + c = 0. Practise converting word problems into equations.",
    "2️⃣ Solve 5–6 questions each by elimination and substitution. Check your answers by back-substitution.",
    "3️⃣ Practise 3–4 questions on nature of solutions using a1/a2, b1/b2, c1/c2 (unique, infinite, or no solution).",
    "4️⃣ Do at least 2 recent case-study questions where data is given in tables / graphs and you have to form and solve equations.",
  ],

  keyConceptsSummary:
    "Three big ideas: (i) solving a pair of linear equations algebraically (elimination, substitution, cross-multiplication), (ii) graphical meaning of solutions and the condition for lines to intersect / coincide / be parallel, (iii) word problems – mixture, numbers, money, geometry stories. Comfort with translating real-world data into equations is what turns this topic into a marks-machine.",

  boardExamplesSummary:
    "A classic 3-mark PYQ: “Form a pair of linear equations for this situation and solve it”. Another type asks you to change a condition so that the system has infinitely many or no solution. Case-based questions usually combine a small table of values or a short story with 2–3 subparts.",

  recommendedVideoSummary:
    "Choose a ‘PLE in 1 shot’ video that solves LOTS of word problems. Focus only on the types you find tricky to save time.",
  recommendedVideoUrl: "https://www.youtube.com/watch?v=EXAkGQGpP7E",
  recommendedVideo: {
    title:
      "Pair of Linear Equations in Two Variables | Class 10 Full Chapter One-Shot",
    url: "https://www.youtube.com/watch?v=EXAkGQGpP7E",
    channel: "Vedantu 9&10",
    meta: "≈2 hr one-shot • Word problems + graphs",
  },

  conceptNotes: [
    {
      id: "ple-methods",
      title: "Algebraic methods (elimination & substitution)",
      summary:
        "In elimination, make coefficients of one variable equal (or opposite), subtract/add to remove it, then back-substitute. In substitution, write one variable in terms of the other and plug into the second equation.",
      examTip:
        "Show clear steps, especially when multiplying equations. Marks are for the method as much as for the answer.",
    },
    {
      id: "ple-nature",
      title: "Nature of solutions via ratios",
      summary:
        "Compare a1/a2, b1/b2 and c1/c2. If a1/a2 ≠ b1/b2 ⇒ unique solution; if a1/a2 = b1/b2 = c1/c2 ⇒ infinitely many solutions; if a1/a2 = b1/b2 ≠ c1/c2 ⇒ no solution.",
      examTip:
        "Always write the three ratios clearly and then state the condition used. Don’t just directly write ‘No solution’.",
    },
    {
      id: "ple-word",
      title: "Translating word problems",
      summary:
        "Identify the two unknowns first, write equations line by line from the statements, then solve and interpret the result (units / meaning).",
      examTip:
        "Under exam pressure, do a quick unit sanity check: does your answer make sense for age / money / tickets etc.?",
    },
  ],

  commonMistakes: [
    "Dropping minus signs while multiplying equations to make coefficients equal.",
    "Not writing the ratio test properly for nature of solutions; writing only one ratio instead of three.",
    "Forming wrong equations from word problems by mixing up ‘more than’, ‘less than’, or total amounts.",
  ],

  boardExamples: [
    {
      id: "ple-ex1",
      title: "Tickets story problem",
      question:
        "The sum of the digits of a two-digit number is 9. When the digits are interchanged, the new number is 27 greater than the original number. Find the number using a pair of linear equations.",
      patternTag: "Number story",
    },
    {
      id: "ple-ex2",
      title: "Nature of solutions",
      question:
        "Find the value of k for which the system (k – 3)x + 3y = k and (k – 1)x + (k – 2)y = 2k – 1 has (i) no solution, (ii) infinitely many solutions.",
      patternTag: "Ratio condition",
    },
  ],
};

// -----------------------------------------------------------------
// MATHS: QUADRATIC EQUATIONS
// -----------------------------------------------------------------

const quadraticBase = buildGenericTopicConfig({
  subjectKey: "Maths",
  topicKey: "quadratic-equations",
  topicName: "Quadratic Equations",
  tier: "must-crack",
  weightagePercent: 8,
});

const quadraticConfig: TopicContentConfig = {
  ...quadraticBase,
  heroTagline:
    "Roots, discriminant, and word problems – once these are solid you can farm easy 3–4 mark questions.",

  quickRevisionRoadmap: [
    "1️⃣ Standard form: ax² + bx + c = 0 (a ≠ 0). Practise reducing simple equations to this form.",
    "2️⃣ Solve 4–5 equations each by factorisation and quadratic formula: x = [-b ± √(b² – 4ac)] / 2a.",
    "3️⃣ Drill discriminant logic: D = b² – 4ac > 0 (two distinct real roots), = 0 (equal roots), < 0 (no real roots).",
    "4️⃣ Do 4–5 word problems: numbers, area, speed–distance, roots with given sum/product, and questions where ‘no real solution’ gives a condition on a parameter.",
  ],

  keyConceptsSummary:
    "Key skills: (i) forming a quadratic equation from conditions on roots, (ii) solving by factorisation or formula, (iii) using D to decide number of real roots, (iv) converting word problems into quadratic equations. Many 3-mark questions are just ‘form equation + solve’ with neat, short working.",

  boardExamplesSummary:
    "Popular patterns: roots with given sum and product, geometry problems where length × breadth gives area, speed problems leading to quadratic time equations, and parameter-based conditions using D ≥ 0. In almost every paper there is at least one direct ‘solve the quadratic’ question.",

  recommendedVideoSummary:
    "Take one solid ‘Quadratic Equations one-shot’ and add it to your notes: formula derivation + lots of word problems.",
  recommendedVideoUrl: "https://www.youtube.com/watch?v=_6wk9WVvdKw",
  recommendedVideo: {
    title: "Quadratic Equations Class 10 | Full Chapter in One Shot",
    url: "https://www.youtube.com/watch?v=_6wk9WVvdKw",
    channel: "Vedantu 9&10",
    meta: "≈2 hr one-shot • Formula + word problems",
  },

  conceptNotes: [
    {
      id: "quad-forms",
      title: "Standard form & forming equations",
      summary:
        "Any quadratic in x can be written as ax² + bx + c = 0. Board questions often give conditions on roots and ask you to form the equation using (x – α)(x – β) = 0.",
      examTip:
        "If roots are p and q, equation is x² – (p + q)x + pq = 0 (assuming leading coefficient 1).",
    },
    {
      id: "quad-discriminant",
      title: "Discriminant and nature of roots",
      summary:
        "D = b² – 4ac decides the number and nature of real roots. Use it to check whether a word problem has a valid solution or to find parameter ranges.",
      examTip:
        "Whenever the question says ‘real roots’ or ‘equal roots’, immediately think of D ≥ 0 or D = 0.",
    },
    {
      id: "quad-word",
      title: "Word problems → quadratic",
      summary:
        "Look for squares (areas, products, speed × time) and conditions like ‘sum/product of roots’. Translate to algebra slowly; once equation is ready, solving is mechanical.",
      examTip:
        "Write a short concluding sentence in words, e.g., “Therefore, the required numbers are …”.",
    },
  ],

  commonMistakes: [
    "Forgetting to take all terms on one side to make ax² + bx + c = 0 before comparing a, b, c.",
    "Sign errors while substituting into the quadratic formula, especially with negative b.",
    "Using wrong condition on D (e.g., writing D > 0 when the question needs equal roots).",
  ],

  boardExamples: [
    {
      id: "quad-ex1",
      title: "Number problem",
      question:
        "The product of two consecutive positive integers is 156. Form a quadratic equation and find the integers.",
      patternTag: "Consecutive numbers",
    },
    {
      id: "quad-ex2",
      title: "Parameter using D",
      question:
        "For what values of k will the equation 2x² + kx + 3 = 0 have equal roots?",
      patternTag: "Equal roots via D = 0",
    },
  ],
};

// -----------------------------------------------------------------
// MATHS: TRIGONOMETRY (Introduction + basic identities)
// -----------------------------------------------------------------

const trigBase = buildGenericTopicConfig({
  subjectKey: "Maths",
  topicKey: "trigonometry",
  topicName: "Trigonometry",
  tier: "must-crack",
  weightagePercent: 12,
});

const trigConfig: TopicContentConfig = {
  ...trigBase,
  heroTagline:
    "Standard values + identities + height & distance – once these are on your fingertips, trig becomes free marks.",

  quickRevisionRoadmap: [
    "1️⃣ Memorise sin, cos, tan values for 0°, 30°, 45°, 60°, 90° in a tiny table. Also know that tan θ = sin θ / cos θ.",
    "2️⃣ Revise basic identities: sin²θ + cos²θ = 1, 1 + tan²θ = sec²θ, 1 + cot²θ = cosec²θ and their rearranged forms.",
    "3️⃣ Solve 6–8 simplification proofs where you convert everything to sin and cos and use the identities.",
    "4️⃣ Practise 4–5 height & distance problems with one or two right-angled triangles – trees, towers, angles of elevation/depression.",
  ],

  keyConceptsSummary:
    "Core pieces: (i) definition of trig ratios in a right triangle, (ii) standard values table, (iii) Pythagorean identities, (iv) use of complementary angles (sin(90° – θ) = cos θ etc.), and (v) application to height & distance. Almost every board paper has at least one simplification / identity proof and one application question.",

  boardExamplesSummary:
    "Question types: prove two expressions are equal using identities; evaluate an expression by substituting standard values; find height of tower / distance between points given angle(s) and one length. Draw neat triangles with all markings – this alone picks up ½–1 mark.",

  recommendedVideoSummary:
    "Use a single well-taught ‘Trigonometry in one shot’ video to drill the values table, identities, and 8–10 solved examples.",
  recommendedVideoUrl: "https://www.youtube.com/watch?v=wdaBwIv7Jso",
  recommendedVideo: {
    title: "Trigonometry Class 10 | One Shot Revision",
    url: "https://www.youtube.com/watch?v=wdaBwIv7Jso",
    channel: "Vedantu 9&10",
    meta: "≈2 hr one-shot • Identities + H&D",
  },

  conceptNotes: [
    {
      id: "trig-values",
      title: "Standard trig values",
      summary:
        "For 0°, 30°, 45°, 60°, 90° learn the exact values of sin θ, cos θ, and tan θ. Others (cosec, sec, cot) are reciprocals.",
      examTip:
        "Write the mini table on rough sheet at the start of the paper so you never blank out under pressure.",
    },
    {
      id: "trig-identities",
      title: "Key identities",
      summary:
        "sin²θ + cos²θ = 1 is the mother identity. Divide by cos²θ to get 1 + tan²θ = sec²θ and by sin²θ to get 1 + cot²θ = cosec²θ.",
      examTip:
        "In proofs, convert everything to sin and cos first, simplify, and then reconvert to required ratio if needed.",
    },
    {
      id: "trig-application",
      title: "Heights & distances",
      summary:
        "Draw the situation, mark angle of elevation/depression, form right-angled triangles, and write tan θ = opposite/adjacent etc. Usually only one equation is needed per unknown.",
      examTip:
        "Always write a concluding line: “Therefore, the height of the tower is … m.” Don’t forget units.",
    },
  ],

  commonMistakes: [
    "Mixing up sin and cos values for 30° and 60°.",
    "Using wrong identity (e.g., writing tan²θ + sec²θ = 1).",
    "Placing angle of elevation at the wrong point in height & distance diagrams.",
  ],

  boardExamples: [
    {
      id: "trig-ex1",
      title: "Simplification",
      question:
        "Prove that (1 – tan²A) / (1 + tan²A) = cos 2A, for 0° < A < 45°.",
      patternTag: "Identity proof",
    },
    {
      id: "trig-ex2",
      title: "Tower question",
      question:
        "The angle of elevation of the top of a tower from a point on the ground is 30°. On moving 20 m closer, it becomes 45°. Find the height of the tower.",
      patternTag: "Height & distance",
    },
  ],
};

// -----------------------------------------------------------------
// SCIENCE: MAGNETIC EFFECTS OF ELECTRIC CURRENT
// -----------------------------------------------------------------

const magneticBase = buildGenericTopicConfig({
  subjectKey: "Science",
  topicKey: "magnetic-effects-of-electric-current",
  topicName: "Magnetic Effects of Electric Current",
  tier: "must-crack",
  weightagePercent: 8,
});

const magneticConfig: TopicContentConfig = {
  ...magneticBase,
  heroTagline:
    "Field lines + right-hand rules + Fleming’s rules – once these pictures are clear, most questions become automatic.",

  quickRevisionRoadmap: [
    "1️⃣ Revise magnetic field lines: direction (N → S outside, S → N inside), properties, and field due to a straight conductor and solenoid.",
    "2️⃣ Practise right-hand thumb rule, right-hand grip rule, and Fleming’s left-hand rule for force on a current-carrying conductor.",
    "3️⃣ Learn the principle, construction and working of an electric motor with a clean labelled diagram.",
    "4️⃣ Skim the difference between motor and generator; note which rule is used where.",
  ],

  keyConceptsSummary:
    "Core ideas: (i) current-carrying conductors produce magnetic fields, (ii) field lines represent strength and direction of the field, (iii) direction rules: thumb rules and Fleming’s left-hand rule, (iv) construction and working of electric motor and simple ideas of electromagnetic induction & generator. Most questions are reasoning or diagram based.",

  boardExamplesSummary:
    "Common patterns: draw and label field lines around a bar magnet or straight conductor, state right-hand thumb rule, explain the working of an electric motor with a diagram, or distinguish between motor and generator. 2-mark questions often ask you to predict the direction of force or current using Fleming’s rules.",

  recommendedVideoSummary:
    "One good ‘Magnetic Effects of Electric Current’ one-shot is enough if you actively redraw all diagrams while watching.",
  recommendedVideoUrl: "https://www.youtube.com/watch?v=jTl26d7LE0s",
  recommendedVideo: {
    title:
      "Magnetic Effects of Electric Current | Class 10 Science Full Chapter",
    url: "https://www.youtube.com/watch?v=jTl26d7LE0s",
    channel: "Magnet Brains",
    meta: "Full chapter one-shot • Diagrams + numericals",
  },

  conceptNotes: [
    {
      id: "mag-field-lines",
      title: "Magnetic field & field lines",
      summary:
        "Magnetic field is the region around a magnet or current-carrying conductor in which another magnet experiences force. Field lines always emerge from north pole and enter south pole outside the magnet.",
      examTip:
        "Remember: field lines never intersect and their closeness shows the strength of the field.",
    },
    {
      id: "mag-rules",
      title: "Direction rules",
      summary:
        "Right-hand thumb rule gives direction of field around a straight conductor. Fleming’s left-hand rule gives direction of force on a current-carrying conductor in a magnetic field (motor).",
      examTip:
        "Draw a tiny hand diagram during practice so you remember which finger stands for which quantity.",
    },
    {
      id: "mag-motor",
      title: "Electric motor",
      summary:
        "Based on force experienced by a current-carrying coil in a magnetic field. Contains rectangular coil, strong magnets, split-ring commutator, brushes and power source.",
      examTip:
        "For 3–5 mark questions, diagram + labelled parts + working steps in correct order is compulsory.",
    },
  ],

  commonMistakes: [
    "Drawing magnetic field lines from S to N outside the magnet.",
    "Confusing Fleming’s left-hand rule (motor) with right-hand rule (generator).",
    "Leaving major parts unlabelled in the electric motor diagram.",
  ],

  boardExamples: [
    {
      id: "mag-ex1",
      title: "Field around conductor",
      question:
        "Draw the pattern of magnetic field lines around a straight current-carrying conductor and state the rule used to find the direction of these field lines.",
      patternTag: "Field lines + rule",
    },
    {
      id: "mag-ex2",
      title: "Motor working",
      question:
        "Explain the principle, construction and working of an electric motor with a labelled diagram.",
      patternTag: "Long answer – motor",
    },
  ],
};

// -----------------------------------------------------------------
// SCIENCE: ELECTRICITY
// -----------------------------------------------------------------

const electricityBase = buildGenericTopicConfig({
  subjectKey: "Science",
  topicKey: "electricity",
  topicName: "Electricity",
  tier: "must-crack",
  weightagePercent: 10,
});

const electricityConfig: TopicContentConfig = {
  ...electricityBase,
  heroTagline:
    "Ohm’s law, series/parallel combinations, and power numericals – this chapter is a guaranteed marks booster.",

  quickRevisionRoadmap: [
    "1️⃣ Revise basic quantities: potential difference (V), current (I), resistance (R) and Ohm’s law V = IR.",
    "2️⃣ Practise finding equivalent resistance in series and parallel combinations using simple circuits.",
    "3️⃣ Solve numericals on electrical energy, power (P = VI = I²R = V²/R) and heating effect of current.",
    "4️⃣ Do 4–5 mixed PYQs where you have to first simplify the circuit, then calculate current / potential drop / power.",
  ],

  keyConceptsSummary:
    "Key ideas: Ohm’s law and its graph, factors affecting resistance (length, area, material), series and parallel combinations of resistors, Joule’s law of heating, and electrical power. Most questions are numerical with straightforward substitution once the circuit is simplified.",

  boardExamplesSummary:
    "Popular PYQs: draw V–I graph and find resistance from slope; calculate current in each branch of a network; compute heat produced in a resistor; compare power consumed in two bulbs. Many case-based questions revolve around practical circuits and domestic electricity use.",

  recommendedVideoSummary:
    "Watch one well-explained ‘Electricity one-shot’ where every numerical is solved slowly. Pause and try each numerical on your own first.",
  recommendedVideoUrl: "https://www.youtube.com/watch?v=O_kEKVMvwSk",
  recommendedVideo: {
    title: "Electricity Class 10 Science | Complete Chapter in One Shot",
    url: "https://www.youtube.com/watch?v=O_kEKVMvwSk",
    channel: "Magnet Brains",
    meta: "Full chapter • Concepts + numericals",
  },

  conceptNotes: [
    {
      id: "elec-ohm",
      title: "Ohm’s law & V–I graph",
      summary:
        "For a metallic conductor at constant temperature, current is directly proportional to potential difference: V ∝ I ⇒ V = IR. V–I graph is a straight line through origin with slope equal to resistance.",
      examTip:
        "Whenever you draw the graph, label axes with units and mark at least two points clearly.",
    },
    {
      id: "elec-series-parallel",
      title: "Series vs parallel combination",
      summary:
        "In series: same current flows, equivalent resistance is R = R₁ + R₂ + … . In parallel: same potential difference, 1/R = 1/R₁ + 1/R₂ + … .",
      examTip:
        "If equivalent resistance becomes less than the smallest resistor → probably parallel; greater than largest → probably series.",
    },
    {
      id: "elec-power",
      title: "Heating effect & power",
      summary:
        "Heat produced H ∝ I²Rt (Joule’s law). Electrical power P = VI = I²R = V²/R. Used to compare bulbs and household appliances.",
      examTip:
        "Careful with units: convert minutes to seconds and kW·h to J if needed.",
    },
  ],

  commonMistakes: [
    "Adding resistances wrongly (using series formula in parallel or vice-versa).",
    "Forgetting to convert units (minutes to seconds, kW to W).",
    "Reading current from the wrong branch in complex circuits.",
  ],

  boardExamples: [
    {
      id: "elec-ex1",
      title: "Series–parallel network",
      question:
        "Three resistors of 2 Ω, 3 Ω and 6 Ω are connected to form (a) series and (b) parallel combinations with a 6 V battery. Find the total current in each case.",
      patternTag: "Equivalent resistance",
    },
    {
      id: "elec-ex2",
      title: "Bulb power",
      question:
        "Two bulbs of ratings 60 W, 220 V and 100 W, 220 V are connected in parallel to a 220 V supply. Which bulb will draw more current? Calculate the current in each bulb.",
      patternTag: "Power comparison",
    },
  ],
};

// -----------------------------------------------------------------
// SCIENCE: LIGHT – REFLECTION & REFRACTION
// -----------------------------------------------------------------

const lightBase = buildGenericTopicConfig({
  subjectKey: "Science",
  topicKey: "light-reflection-refraction",
  topicName: "Light – Reflection and Refraction",
  tier: "high-roi",
  weightagePercent: 9,
});

const lightConfig: TopicContentConfig = {
  ...lightBase,
  heroTagline:
    "Mirror/lens formula + ray diagrams + sign convention – nail these and the rest of the chapter feels easy.",

  quickRevisionRoadmap: [
    "1️⃣ Learn mirror formula 1/f = 1/v + 1/u and lens formula 1/f = 1/v – 1/u with the new Cartesian sign convention.",
    "2️⃣ Practise drawing ray diagrams for image formation by concave mirror and convex/concave lenses for key positions.",
    "3️⃣ Solve numericals on image distance, focal length and magnification (m = v/u or hʹ/h).",
    "4️⃣ Revise real-life applications: mirrors in headlights, side mirrors, lenses in spectacles, camera, and eye defects (myopia + hypermetropia).",
  ],

  keyConceptsSummary:
    "Important ideas: reflection and refraction laws, refractive index, mirror and lens formulae with sign convention, magnification, and eye defects with their correction. In the exam, you almost always get one ray diagram + one numerical + one reasoning/application question.",

  boardExamplesSummary:
    "Frequent PYQs: use of convex/concave mirrors in daily life, numerical on image position using mirror/lens formula, drawing ray diagram for image formation, listing the nature/size of image, and short questions on power of lens or refractive index.",

  recommendedVideoSummary:
    "Watch one full ‘Light – Reflection & Refraction’ one-shot where all standard ray diagrams are drawn slowly. Re-draw them along with the video.",
  recommendedVideoUrl: "https://www.youtube.com/watch?v=OElBr7_nHGo",
  recommendedVideo: {
    title: "Light: Reflection and Refraction | Class 10 One Shot",
    url: "https://www.youtube.com/watch?v=OElBr7_nHGo",
    channel: "Magnet Brains",
    meta: "Full chapter • Ray diagrams + numericals",
  },

  conceptNotes: [
    {
      id: "light-sign",
      title: "New Cartesian sign convention",
      summary:
        "All distances are measured from the pole (mirror) or optical centre (lens). Distances along the direction of incident light are positive, opposite are negative. Heights above principal axis are positive, below are negative.",
      examTip:
        "Before substituting in formulas, mark u, v, f on a quick ray diagram and assign signs carefully.",
    },
    {
      id: "light-formula",
      title: "Mirror & lens formula + magnification",
      summary:
        "For spherical mirrors: 1/f = 1/v + 1/u. For thin lenses: 1/f = 1/v – 1/u. Magnification m = hʹ/h = –v/u (mirror) and m = v/u (lens).",
      examTip:
        "Carry sign consistently; if you get a positive m > 1, image is enlarged and erect; negative m indicates inverted image.",
    },
    {
      id: "light-eye",
      title: "Eye defects & correction (high-ROI)",
      summary:
        "Myopia (short-sightedness) → difficulty seeing far objects → corrected using concave lens. Hypermetropia (long-sightedness) → difficulty seeing nearby objects → corrected using convex lens.",
      examTip:
        "For 3–4 mark questions, always mention cause, defect and corrective lens with a simple ray diagram.",
    },
  ],

  commonMistakes: [
    "Using old sign convention instead of the new Cartesian sign convention.",
    "Forgetting to convert cm to m when calculating power of lens in dioptre.",
    "Drawing ray diagrams without showing at least two incident rays and the principal axis.",
  ],

  boardExamples: [
    {
      id: "light-ex1",
      title: "Concave mirror numerical",
      question:
        "An object is placed 30 cm in front of a concave mirror of focal length 15 cm. Find the position, nature and magnification of the image.",
      patternTag: "Mirror formula",
    },
    {
      id: "light-ex2",
      title: "Eye defect",
      question:
        "What is myopia? State its two causes and explain with a ray diagram how it is corrected.",
      patternTag: "Eye defect",
    },
  ],
};

// =================================================================
// REGISTRY – what TopicHub actually reads
// =================================================================

const mathsContentRegistry: Record<string, TopicContentConfig> = {
  // Real Numbers
  "real-numbers": realNumbersConfig,
  "Real Numbers": realNumbersConfig,

  // Pair of Linear Equations
  "pair-of-linear-equations": pleConfig,
  "Pair of Linear Equations": pleConfig,
  "Pair of Linear Equations in Two Variables": pleConfig,

  // Quadratic Equations
  "quadratic-equations": quadraticConfig,
  "Quadratic Equations": quadraticConfig,

  // Trigonometry
  trigonometry: trigConfig,
  "Introduction to Trigonometry": trigConfig,
  "Trigonometry (Introduction + Applications)": trigConfig,
  Trigonometry: trigConfig,
};

const scienceContentRegistry: Record<string, TopicContentConfig> = {
  // Magnetic Effects of Electric Current
  "magnetic-effects-of-electric-current": magneticConfig,
  "Magnetic Effects of Electric Current": magneticConfig,

  // Electricity
  electricity: electricityConfig,
  Electricity: electricityConfig,

  // Light – Reflection & Refraction
  "light-reflection-refraction": lightConfig,
  "Light – Reflection and Refraction": lightConfig,
  "Light – Reflection & Refraction": lightConfig,
};

// -----------------------------------------------------------------
// Public helper – TopicHub calls this
// -----------------------------------------------------------------

export function getTopicContent(
  subjectKey: Class10SubjectKey,
  rawTopicKey: string | undefined
): TopicContentConfig {
  const topicKey = rawTopicKey ?? "generic-topic";

  const registry =
    subjectKey === "Science" ? scienceContentRegistry : mathsContentRegistry;

  const existing = registry[topicKey];
  if (existing) return existing;

  // Try to make a sensible display name from the key
  const normalisedName =
    topicKey === "generic-topic"
      ? "Topic"
      : topicKey
          .replace(/-/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .replace(/\b\w/g, (ch) => ch.toUpperCase());

  return buildGenericTopicConfig({
    subjectKey,
    topicKey,
    topicName: normalisedName,
  });
}
