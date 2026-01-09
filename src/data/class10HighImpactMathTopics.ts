// src/data/class10HighImpactMathTopics.ts

import type { Class10TopicKey } from "./class10MathTopicTrends";

export type TierKey = "must-crack" | "high-roi" | "good-to-do";

export type QuestionType =
  | "MCQ"
  | "Calculation"
  | "Assertion-Reasoning"
  | "Short Answer"
  | "Descriptive"
  | "Proof";

export interface HighImpactResource {
  type?: string;
  title?: string;
  url?: string;
  resource_metrics?: string;
  why_recommended?: string;
  transcript_available?: boolean;
  transcript_button_text?: string;
  transcript_text?: string;
}

export interface HighImpactPractice {
  prompt: string;
  difficulty?: string;
  section?: string;
  solution?: string;
}

export interface HighImpactConcept {
  name: string;
  sharePercent?: number;
  question_types?: QuestionType[];
  summary_and_exam_tips?: string;
  top_resources?: HighImpactResource[];
  practice?: HighImpactPractice[];
}

export interface HighImpactTopic {
  topicKey: Class10TopicKey;
  topicName: string;
  tier: TierKey;
  weightagePercent: number;
  concepts: HighImpactConcept[];
}

/**
 * This is the “content JSON” for high-impact topics.
 * You can later replace URLs/metrics with your own curated data
 * without changing the structure.
 */
export const class10HighImpactMathTopics: HighImpactTopic[] = [
  {
    topicKey: "Pair of Linear Equations",
    topicName: "Pair of Linear Equations in Two Variables",
    tier: "must-crack",
    weightagePercent: 11,
    concepts: [
      {
        name: "Algebraic Solution Methods",
        sharePercent: 40,
        question_types: ["Descriptive", "Calculation", "Assertion-Reasoning"],
        summary_and_exam_tips:
          "For 2– and 3-mark questions, elimination and substitution dominate; cross-multiplication is often used in 3–4 mark questions. Always align your steps with the method name mentioned in the question and show every algebraic step neatly.",
        top_resources: [
          {
            type: "youtube",
            title:
              "Pair of Linear Equations in 1 Shot | Board Pattern | Shobhit Nirwan",
            url: "https://www.youtube.com/watch?v=ogXdyU_2rRc",
            resource_metrics: "1.4M+ views | Sep 2025 | ~50 min",
            why_recommended:
              "All algebraic patterns, stepwise explanations for boards.",
            transcript_available: true,
            transcript_button_text: "Read concise transcript",
            transcript_text:
              "To solve 2x + 3y = 11 and 3x − 2y = 4: Use elimination (make coefficients same or opposite and add/subtract) or substitution (express one variable in terms of the other and substitute). Board expectation: neat labelling of equations, clear elimination/substitution and final ordered pair (x, y)."
          }
        ],
        practice: [
          {
            prompt: "Solve for x and y: 2x + 3y = 11, 3x − 2y = 4.",
            difficulty: "Medium",
            section: "C",
            solution:
              "Multiply (1) by 2 and (2) by 3 to make coefficients of y equal and opposite. Add to eliminate y, find x. Substitute back to get y."
          },
          {
            prompt:
              "Assertion (A): Cross-multiplication works for all pairs of linear equations. Reason (R): Cross-multiplication is a method for solving simultaneous equations.",
            difficulty: "Medium",
            section: "B",
            solution:
              "A is false (it fails when the pair has no unique solution), R is true."
          }
        ]
      }
    ]
  },

  {
    topicKey: "Arithmetic Progression",
    topicName: "Arithmetic Progression",
    tier: "must-crack",
    weightagePercent: 7,
    concepts: [
      {
        name: "nth Term",
        sharePercent: 35,
        question_types: ["MCQ", "Calculation", "Assertion-Reasoning"],
        summary_and_exam_tips:
          "Formula: aₙ = a + (n − 1)d. Always identify first term, common difference and n carefully. Board questions are mostly direct or involve a small equation in n.",
        top_resources: [
          {
            type: "youtube",
            title: "Complete AP Board Revision | Infinity Learn",
            url: "https://www.youtube.com/watch?v=HbkztZAtR-s",
            resource_metrics: "190K+ views | Mar 2025",
            why_recommended: "AP all formulas and board-style questions fast.",
            transcript_available: true,
            transcript_button_text: "Read concise transcript",
            transcript_text:
              "Identify a, d, n from the language of the question. Use aₙ = a + (n − 1)d to find the nth term or form an equation in n when aₙ is given."
          }
        ],
        practice: [
          {
            prompt: "In an AP, the 5th term is 18 and the 9th term is 30. Find a and d.",
            difficulty: "Medium",
            section: "C",
            solution:
              "Use a + 4d = 18 and a + 8d = 30. Subtract to get 4d = 12 ⇒ d = 3, then find a."
          },
          {
            prompt:
              "Assertion (A): Common difference of an AP may be negative. Reason (R): In an AP, the difference between consecutive terms is constant.",
            difficulty: "Easy",
            section: "B",
            solution: "Both A and R are true; R correctly explains A."
          }
        ]
      }
    ]
  },

  {
    topicKey: "Coordinate Geometry",
    topicName: "Coordinate Geometry",
    tier: "must-crack",
    weightagePercent: 7,
    concepts: [
      {
        name: "Distance Formula",
        sharePercent: 40,
        question_types: ["MCQ", "Calculation", "Assertion-Reasoning"],
        summary_and_exam_tips:
          "Formula: d = √[(x₂ − x₁)² + (y₂ − y₁)²]. Keep track of signs and always simplify the surd as much as possible.",
        top_resources: [
          {
            type: "youtube",
            title: "Coordinate Geometry Revision | Prodigy Tutor",
            url: "https://www.youtube.com/watch?v=nOxek3AosYU",
            resource_metrics: "23K+ views | Jul 2025",
            why_recommended:
              "Distance, section formula and area-based questions in one revision.",
            transcript_available: true,
            transcript_button_text: "Read concise transcript",
            transcript_text:
              "For A(x₁, y₁) and B(x₂, y₂), distance AB = √[(x₂ − x₁)² + (y₂ − y₁)²]. In MCQs, first compute the squared distance to reduce mistake chances, then take square root at the end."
          }
        ],
        practice: [
          {
            prompt: "Find the distance between A(−2, 3) and B(4, −1).",
            difficulty: "Easy",
            section: "B",
            solution:
              "AB = √[(4 + 2)² + (−1 − 3)²] = √[6² + (−4)²] = √(36 + 16) = √52."
          },
          {
            prompt:
              "Assertion (A): The distance between two points in the plane is never negative. Reason (R): It is defined using a square root.",
            difficulty: "Easy",
            section: "B",
            solution: "Both A and R are true."
          }
        ]
      }
    ]
  },

  {
    topicKey: "Statistics",
    topicName: "Statistics",
    tier: "must-crack",
    weightagePercent: 7,
    concepts: [
      {
        name: "Mean (Step Deviation)",
        sharePercent: 35,
        question_types: ["Calculation", "Short Answer", "Assertion-Reasoning"],
        summary_and_exam_tips:
          "For grouped data with large numbers, step-deviation method reduces calculation load. Show the entire table (class marks, deviations, fd) neatly for full marks.",
        top_resources: [
          {
            type: "youtube",
            title: "Statistics Board Revision | Shimon Sir",
            url: "https://www.youtube.com/watch?v=3uL88OxLa0w",
            resource_metrics: "72K+ views | Mar 2025",
            why_recommended: "All mean methods with board pattern solutions.",
            transcript_available: true,
            transcript_button_text: "Read concise transcript",
            transcript_text:
              "Choose an assumed mean a, compute deviations dᵢ and step deviations uᵢ = (xᵢ − a)/h. Use mean = a + (Σfᵢuᵢ / Σfᵢ)·h. Make the table clean: class, mid value xᵢ, fᵢ, uᵢ, fᵢuᵢ."
          }
        ],
        practice: [
          {
            prompt:
              "Classes 0–10, 10–20, 20–30; frequencies 3, 7, 10. Using step deviation, find the mean.",
            difficulty: "Medium",
            section: "D",
            solution:
              "Take mid-values, choose a convenient assumed mean, compute uᵢ and fᵢuᵢ, then apply step-deviation formula."
          },
          {
            prompt:
              "Assertion (A): Step deviation is usually used when class marks are large numbers. Reason (R): It simplifies calculations using a common factor h.",
            difficulty: "Medium",
            section: "C",
            solution: "Both A and R are true."
          }
        ]
      }
    ]
  },

  {
    topicKey: "Probability",
    topicName: "Probability",
    tier: "must-crack",
    weightagePercent: 6,
    concepts: [
      {
        name: "Single Event Probability",
        sharePercent: 65,
        question_types: ["MCQ", "Short Answer", "Assertion-Reasoning"],
        summary_and_exam_tips:
          "Most board questions are single-event situations with dice, coins, cards or coloured balls. Clearly count total outcomes first, then favourable outcomes.",
        top_resources: [
          {
            type: "youtube",
            title: "Probability Full Marathon | Shimon Sir",
            url: "https://www.youtube.com/watch?v=G7FZ-EcMIG0",
            resource_metrics: "300K+ views | Latest",
            why_recommended: "Complete board coverage of probability cases.",
            transcript_available: true,
            transcript_button_text: "Read concise transcript",
            transcript_text:
              "For event E, P(E) = (number of favourable outcomes) / (total number of outcomes). For cards, total = 52; dice, total = 6; coins, total = 2. Translate words to outcomes first, then compute ratio."
          }
        ],
        practice: [
          {
            prompt: "A card is drawn from a standard deck of 52 cards. Find P(getting a red card).",
            difficulty: "Easy",
            section: "B",
            solution: "There are 26 red cards. So P = 26/52 = 1/2."
          },
          {
            prompt:
              "Assertion (A): Probability of an event always lies between 0 and 1. Reason (R): Probability is defined as favourable outcomes divided by total outcomes.",
            difficulty: "Easy",
            section: "B",
            solution: "Both A and R are true and R explains A."
          }
        ]
      }
    ]
  },

  {
    topicKey: "Circles",
    topicName: "Circles",
    tier: "high-roi",
    weightagePercent: 6,
    concepts: [
      {
        name: "Tangent Properties",
        sharePercent: 45,
        question_types: ["MCQ", "Proof", "Assertion-Reasoning"],
        summary_and_exam_tips:
          "Two key facts: (1) Tangent at a point on a circle is perpendicular to the radius at that point. (2) Tangents drawn from an external point are equal in length.",
        top_resources: [
          {
            type: "youtube",
            title: "Circles Full Chapter One Shot | Pranav Sir",
            url: "https://www.youtube.com/watch?v=fxAbuUf2pIA",
            resource_metrics: "Latest board session",
            why_recommended:
              "All tangent theorems and standard proofs revised quickly.",
            transcript_available: true,
            transcript_button_text: "Read concise transcript",
            transcript_text:
              "To prove tangent properties, usually draw radii to the points of contact, join the external point, and use congruent triangles. Remember: radius ⟂ tangent."
          }
        ],
        practice: [
          {
            prompt:
              "From an external point P, tangents PA and PB are drawn to a circle with centre O and radius 5 cm. If OP = 13 cm, find the length of each tangent.",
            difficulty: "Medium",
            section: "C",
            solution:
              "Right triangle OPA with OP as hypotenuse and OA = 5 as radius. PA² = OP² − OA² = 13² − 5² = 169 − 25 = 144 ⇒ PA = PB = 12 cm."
          },
          {
            prompt:
              "Assertion (A): Tangent at any point on a circle is perpendicular to the radius through that point. Reason (R): Radius drawn to the point of contact is the shortest line from the centre to the tangent.",
            difficulty: "Medium",
            section: "B",
            solution:
              "Both A and R are true; R gives an intuitive reason often used in higher proofs."
          }
        ]
      }
    ]
  },

  // 🔥 NEW: Trigonometry high-impact topic
  {
    topicKey: "Trigonometry",
    topicName: "Trigonometry",
    tier: "must-crack",
    weightagePercent: 10,
    concepts: [
      {
        name: "Trig Ratios/Values",
        sharePercent: 35,
        question_types: ["MCQ", "Calculation", "Assertion-Reasoning"],
        summary_and_exam_tips:
          "Know the basic definition of sin, cos and tan in a right triangle and the standard values at 0°, 30°, 45°, 60°, 90°. Many questions are direct evaluation or small manipulations using these values.",
        top_resources: [
          {
            type: "youtube",
            title: "Trig Ratios & Standard Values | 1-Shot Board Revision",
            url: "https://www.youtube.com/watch?v=hypothetical-trig-ratios",
            resource_metrics: "Trending board session",
            why_recommended:
              "Covers SOH–CAH–TOA and the full standard-value table with tricks.",
            transcript_available: true,
            transcript_button_text: "Read concise transcript",
            transcript_text:
              "Trigonometric ratios compare sides of a right triangle with acute angle θ: sin θ = perpendicular / hypotenuse, cos θ = base / hypotenuse, tan θ = perpendicular / base. Memorise the standard-value table and practise converting word language ('height of tower') into these ratios."
          }
        ],
        practice: [
          {
            prompt:
              "If sin θ = 3/5 and θ is acute, find cos θ and tan θ.",
            difficulty: "Easy",
            section: "B",
            solution:
              "Take hypotenuse = 5, opposite side = 3. Then adjacent side = √(5² − 3²) = 4. So cos θ = 4/5, tan θ = 3/4."
          },
          {
            prompt:
              "Evaluate: 2sin 30° + 3cos 60° − tan² 45°.",
            difficulty: "Easy",
            section: "B",
            solution:
              "Use standard values: sin 30° = 1/2, cos 60° = 1/2, tan 45° = 1. Expression = 2·(1/2) + 3·(1/2) − 1² = 1 + 3/2 − 1 = 3/2."
          }
        ]
      },
      {
        name: "Trig Identities/Proofs",
        sharePercent: 35,
        question_types: ["Proof", "Calculation", "Assertion-Reasoning"],
        summary_and_exam_tips:
          "Base everything on the three primary identities: sin²θ + cos²θ = 1, 1 + tan²θ = sec²θ and 1 + cot²θ = cosec²θ. Start from one side and convert all ratios into sin and cos or use tan = sin/cos when stuck.",
        top_resources: [
          {
            type: "youtube",
            title: "Trigonometric Identities + Board Proofs | 1 Shot",
            url: "https://www.youtube.com/watch?v=hypothetical-trig-identities",
            resource_metrics: "Compact identity marathon",
            why_recommended:
              "All standard proofs and typical board identities in one place.",
            transcript_available: true,
            transcript_button_text: "Read concise transcript",
            transcript_text:
              "To prove identities, always plan which side is more complicated and start from that side. Convert sec, cosec, tan and cot into sin and cos, apply sin²θ + cos²θ = 1 and simplify step-by-step, keeping each line justified."
          }
        ],
        practice: [
          {
            prompt:
              "Prove that: (1 − tan² θ) / (1 + tan² θ) = (1 − 2sin² θ).",
            difficulty: "Hard",
            section: "D",
            solution:
              "Start from LHS. Use 1 − tan²θ = (1 + tan²θ) − 2tan²θ and 1 + tan²θ = sec²θ. Or express tan θ as sin θ / cos θ and simplify to get 1 − 2sin²θ."
          },
          {
            prompt:
              "If sec θ + tan θ = p, show that sec θ = (p² + 1)/(2p).",
            difficulty: "Medium",
            section: "C",
            solution:
              "Square both sides: sec²θ + tan²θ + 2secθ·tanθ = p². Use sec²θ − tan²θ = 1 to get 2sec²θ − 1 + 2secθ·tanθ = p². Also note that (sec θ + tan θ)(sec θ − tan θ) = 1, so sec θ − tan θ = 1/p. Add and subtract equations to solve for sec θ."
          }
        ]
      },
      {
        name: "Application/Heights & Distances",
        sharePercent: 30,
        question_types: ["Short Answer", "Descriptive", "Calculation"],
        summary_and_exam_tips:
          "Every question starts with a diagram. Mark angle of elevation/depression, label known distances, drop perpendiculars and then apply tan θ = height/base (most commonly), or use two equations in two unknowns.",
        top_resources: [
          {
            type: "youtube",
            title: "Heights & Distances | Most Repeated Board Questions",
            url: "https://www.youtube.com/watch?v=hypothetical-heights-distances",
            resource_metrics: "Board favourite, exam-focused",
            why_recommended:
              "Standard ladder, tower, building and tree problems with stepwise diagrams.",
            transcript_available: true,
            transcript_button_text: "Read concise transcript",
            transcript_text:
              "Translate each story into a right triangle. For angle of elevation, the angle is at the observer on the ground; for angle of depression, the angle is at the top, but equal to angle at the ground by alternate interior angles."
          }
        ],
        practice: [
          {
            prompt:
              "From a point on the ground 20 m away from the foot of a tower, the angle of elevation of the top of the tower is 45°. Find the height of the tower.",
            difficulty: "Easy",
            section: "C",
            solution:
              "Draw a right triangle with base 20 m and angle at ground = 45°. tan 45° = height / 20 ⇒ 1 = h/20 ⇒ h = 20 m."
          },
          {
            prompt:
              "The angle of elevation of the top of a building from a point on the ground is 30°. On moving 40 m closer to the building, the angle of elevation becomes 60°. Find the height of the building.",
            difficulty: "Hard",
            section: "D",
            solution:
              "Let height = h and original distance = x. Then tan 30° = h/x and tan 60° = h/(x − 40). Use tan 30° = 1/√3, tan 60° = √3. Solve the two equations to get h."
          }
        ]
      }
    ]
  }
];

export type Class10HighImpactTopicKey =
  (typeof class10HighImpactMathTopics)[number]["topicKey"];
