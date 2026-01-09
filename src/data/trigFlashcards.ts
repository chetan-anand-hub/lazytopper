// src/data/trigFlashcards.ts

// Tags for grouping / filtering cards
export type FlashTag =
  | "ratios"
  | "identities"
  | "standard-values"
  | "heights-distances"
  | "tips";

// Basic flashcard shape
export interface TrigFlashcard {
  id: string;
  tag: FlashTag;
  title: string;
  front: string; // question / prompt
  back: string;  // answer / explanation
}

// Main flashcard bank
export const TRIG_FLASHCARDS: TrigFlashcard[] = [
  // ---- RATIOS ----
  {
    id: "fc-ratios-1",
    tag: "ratios",
    title: "Basic trig ratios",
    front:
      "State the six basic trigonometric ratios for an acute angle θ in a right triangle.",
    back:
      "sin θ = Opp/Hyp\n" +
      "cos θ = Adj/Hyp\n" +
      "tan θ = Opp/Adj\n" +
      "cosec θ = 1/sin θ = Hyp/Opp\n" +
      "sec θ = 1/cos θ = Hyp/Adj\n" +
      "cot θ = 1/tan θ = Adj/Opp"
  },
  {
    id: "fc-ratios-2",
    tag: "ratios",
    title: "Key reciprocal relations",
    front: "Write the reciprocal relations between sin, cos, tan and the other three ratios.",
    back:
      "cosec θ = 1 / sin θ\n" +
      "sec θ   = 1 / cos θ\n" +
      "cot θ   = 1 / tan θ"
  },

  // ---- IDENTITIES ----
  {
    id: "fc-id-1",
    tag: "identities",
    title: "Pythagorean identities",
    front: "Write the three Pythagorean identities in trigonometry.",
    back:
      "1) sin²θ + cos²θ = 1\n" +
      "2) 1 + tan²θ = sec²θ\n" +
      "3) 1 + cot²θ = cosec²θ"
  },
  {
    id: "fc-id-2",
    tag: "identities",
    title: "tan and cot in terms of sin & cos",
    front: "Express tan θ and cot θ in terms of sin θ and cos θ.",
    back:
      "tan θ = sin θ / cos θ\n" +
      "cot θ = cos θ / sin θ"
  },

  // ---- STANDARD VALUES ----
  {
    id: "fc-std-1",
    tag: "standard-values",
    title: "Standard values: sin θ",
    front: "Write sin θ for θ = 0°, 30°, 45°, 60°, 90°.",
    back:
      "sin 0° = 0\n" +
      "sin 30° = 1/2\n" +
      "sin 45° = 1/√2\n" +
      "sin 60° = √3/2\n" +
      "sin 90° = 1"
  },
  {
    id: "fc-std-2",
    tag: "standard-values",
    title: "Standard values: cos θ",
    front: "Write cos θ for θ = 0°, 30°, 45°, 60°, 90°.",
    back:
      "cos 0° = 1\n" +
      "cos 30° = √3/2\n" +
      "cos 45° = 1/√2\n" +
      "cos 60° = 1/2\n" +
      "cos 90° = 0"
  },
  {
    id: "fc-std-3",
    tag: "standard-values",
    title: "Standard values: tan θ",
    front: "Write tan θ for θ = 0°, 30°, 45°, 60°, 90°.",
    back:
      "tan 0° = 0\n" +
      "tan 30° = 1/√3\n" +
      "tan 45° = 1\n" +
      "tan 60° = √3\n" +
      "tan 90° is NOT defined"
  },

  // ---- HEIGHTS & DISTANCES ----
  {
    id: "fc-hd-1",
    tag: "heights-distances",
    title: "Angle of elevation",
    front:
      "What is meant by angle of elevation? In a right-triangle diagram, where is it marked?",
    back:
      "Angle of elevation is the angle made by the line of sight with the horizontal when we look UP at an object.\n" +
      "In the diagram it is marked at the eye of the observer, between the horizontal line and the line of sight."
  },
  {
    id: "fc-hd-2",
    tag: "heights-distances",
    title: "Angle of depression",
    front:
      "What is meant by angle of depression? What is its relation with the angle of elevation of the same object?",
    back:
      "Angle of depression is the angle made by the line of sight with the horizontal when we look DOWN at an object.\n" +
      "It is equal to the angle of elevation of the object (alternate interior angles)."
  },

  // ---- TIPS ----
  {
    id: "fc-tips-1",
    tag: "tips",
    title: "LazyTopper trig triangle",
    front:
      "Quick memory tip for standard values of sin and cos at 0°, 30°, 45°, 60°, 90°?",
    back:
      "Remember the pattern 0, 1/2, 1/√2, √3/2, 1 for sin.\n" +
      "For cos, reverse the sin pattern.\n" +
      "Once sin & cos are in your head, tan = sin/cos is easy."
  },
  {
    id: "fc-tips-2",
    tag: "tips",
    title: "Sign rule (ASTC)",
    front:
      "How do you quickly decide the sign of a trig ratio in different quadrants?",
    back:
      "Use ASTC:\n" +
      "All Students Take Coffee.\n" +
      "I quadrant: All positive\n" +
      "II: Sin, cosec positive\n" +
      "III: Tan, cot positive\n" +
      "IV: Cos, sec positive"
  }
];
