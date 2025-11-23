// src/data/class10SciencePredictedQuestions.ts

import type {
  DifficultyKey,
  TopicTier,
} from "./class10MathTopicTrends";
import type {
  Class10ScienceTopicKey,
} from "./class10ScienceTopicTrends";

/**
 * Streams help us filter inside Science:
 * Physics / Chemistry / Biology (plus an "all" for generic).
 */
export type ScienceStream = "Physics" | "Chemistry" | "Biology";

/**
 * Base shape for a predicted / highly-probable Science question.
 * Very similar vibe to your Maths PredictedQuestion type.
 */
export interface SciencePredictedQuestion {
  id: string;
  grade: "10";
  subject: "Science";
  stream: ScienceStream;

  topicKey: Class10ScienceTopicKey;
  topicName: string;
  concept: string;

  marks: number; // 1, 2, 3, 4, 5
  section: "A" | "B" | "C" | "D" | "E";

  difficulty: DifficultyKey; // "Easy" | "Medium" | "Hard"
  tier: TopicTier; // "must-crack" | "high-roi" | "good-to-do"

  yearTag: string; // "2024 Board", "2023 Sample", etc.
  questionText: string;
  answerOutline: string;

  // For Phase B Socratic mode
  solutionSteps: string[];
}

/**
 * Small starter bank — you’ll keep expanding this.
 * I’ve tried to cover all three streams (Phy/Chem/Bio) and 1–5 mark patterns.
 */
export const class10SciencePredictedQuestions: SciencePredictedQuestion[] = [
  // --- CHEMISTRY ---------------------------------------------------
  {
    id: "sci-chem-chemreactions-1m-2023-01",
    grade: "10",
    subject: "Science",
    stream: "Chemistry",
    topicKey: "Chemical Reactions & Equations",
    topicName: "Chemical Reactions & Equations",
    concept: "Balancing chemical equations",
    marks: 1,
    section: "A",
    difficulty: "Easy",
    tier: "must-crack",
    yearTag: "2023 Board (MCQ)",
    questionText:
      "Which of the following equations is correctly balanced?\n(A) Fe + O₂ → Fe₂O₃\n(B) 2Fe + 3O₂ → 2Fe₂O₃\n(C) 4Fe + 3O₂ → 2Fe₂O₃\n(D) 3Fe + 2O₂ → Fe₃O₄",
    answerOutline: "Option (C): 4Fe + 3O₂ → 2Fe₂O₃ is balanced.",
    solutionSteps: [
      "Write down the number of Fe and O atoms on both sides for each option.",
      "Check which option has equal atoms of each element on LHS and RHS.",
      "For option (C): LHS has Fe:4, O:6 and RHS has Fe:4, O:6 → balanced.",
      "Hence, the correctly balanced equation is 4Fe + 3O₂ → 2Fe₂O₃.",
    ],
  },
  {
    id: "sci-chem-acids-2m-2022-01",
    grade: "10",
    subject: "Science",
    stream: "Chemistry",
    topicKey: "Acids, Bases & Salts",
    topicName: "Acids, Bases & Salts",
    concept: "pH and indicators",
    marks: 2,
    section: "B",
    difficulty: "Medium",
    tier: "high-roi",
    yearTag: "2022 Board",
    questionText:
      "A student adds a few drops of universal indicator to solution X and it turns red. \n(a) What can you conclude about the nature of solution X? \n(b) Predict the approximate pH range of X.",
    answerOutline:
      "(a) X is a strong acid. (b) pH is in the range of about 1–3.",
    solutionSteps: [
      "Recall: universal indicator shows red colour for strong acids, green for neutral, and purple/blue for strong bases.",
      "Since solution X turns the indicator red, it must be strongly acidic.",
      "Strong acids typically have pH between 1 and 3.",
      "Therefore we conclude: X is a strong acid and its pH lies roughly between 1 and 3.",
    ],
  },

  // --- PHYSICS -----------------------------------------------------
  {
    id: "sci-phy-electricity-3m-2023-01",
    grade: "10",
    subject: "Science",
    stream: "Physics",
    topicKey: "Electricity",
    topicName: "Electricity",
    concept: "Ohm’s law and equivalent resistance",
    marks: 3,
    section: "C",
    difficulty: "Medium",
    tier: "must-crack",
    yearTag: "2023 Board",
    questionText:
      "Two resistors of 6 Ω and 3 Ω are connected in series with a 9 V battery. \n(a) Calculate the total resistance of the circuit. \n(b) Find the current flowing through the circuit. \n(c) How much heat is produced in the 6 Ω resistor in 2 minutes?",
    answerOutline:
      "R_total = 6 + 3 = 9 Ω, I = V/R = 9/9 = 1 A. Heat in 6 Ω: H = I²RT = 1² × 6 × 120 = 720 J.",
    solutionSteps: [
      "In series combination, total resistance R_total = R₁ + R₂ = 6 Ω + 3 Ω = 9 Ω.",
      "Use Ohm’s law: I = V/R = 9 V / 9 Ω = 1 A.",
      "Heat produced in a resistor: H = I² R t.",
      "Here, I = 1 A, R = 6 Ω and t = 2 minutes = 120 s.",
      "So, H = (1)² × 6 × 120 = 720 J.",
    ],
  },
  {
    id: "sci-phy-light-2m-2021-01",
    grade: "10",
    subject: "Science",
    stream: "Physics",
    topicKey: "Light – Reflection & Refraction",
    topicName: "Light – Reflection & Refraction",
    concept: "Mirror formula and sign convention",
    marks: 2,
    section: "B",
    difficulty: "Medium",
    tier: "must-crack",
    yearTag: "2021 Board",
    questionText:
      "An object is placed 30 cm in front of a concave mirror of focal length 15 cm. Find the position of the image. State the sign convention you have used.",
    answerOutline:
      "Using 1/f = 1/v + 1/u with f = −15 cm, u = −30 cm, we get v = −30 cm. Image is formed at 30 cm in front of the mirror (real, inverted, same size).",
    solutionSteps: [
      "For spherical mirrors, use the mirror formula: 1/f = 1/v + 1/u.",
      "According to sign convention: focal length f of a concave mirror is taken as negative, and object distance u is negative since object is in front.",
      "So, f = −15 cm, u = −30 cm.",
      "Substitute: 1/(−15) = 1/v + 1/(−30).",
      "Simplify: −1/15 = 1/v − 1/30 ⇒ −1/15 + 1/30 = 1/v.",
      "Compute LHS: (−2 + 1)/30 = −1/30 ⇒ 1/v = −1/30 ⇒ v = −30 cm.",
      "Negative v means the image is formed on the same side as the object, 30 cm in front of the mirror (real and inverted).",
    ],
  },

  // --- BIOLOGY -----------------------------------------------------
  {
    id: "sci-bio-lifeprocess-3m-2023-01",
    grade: "10",
    subject: "Science",
    stream: "Biology",
    topicKey: "Life Processes",
    topicName: "Life Processes",
    concept: "Modes of nutrition in plants and humans",
    marks: 3,
    section: "C",
    difficulty: "Easy",
    tier: "must-crack",
    yearTag: "2023 Board",
    questionText:
      "(a) Define autotrophic nutrition. \n(b) Why are villi present in the small intestine but not in the stomach? \n(c) Name the pigment which helps in photosynthesis.",
    answerOutline:
      "(a) Mode of nutrition in which organisms prepare their own food from simple inorganic substances. (b) Villi increase surface area for absorption of digested food; absorption mainly occurs in small intestine, not stomach. (c) Chlorophyll.",
    solutionSteps: [
      "Recall definition: Autotrophic nutrition is the mode where organisms prepare their own food from simple inorganic substances like CO₂ and water using sunlight.",
      "For part (b), think about the function of villi: they increase surface area for absorption.",
      "Absorption of digested food occurs mainly in the small intestine; the stomach is mainly for storage and initial digestion, not large-scale absorption.",
      "Hence villi are needed in the small intestine to absorb nutrients efficiently, but are absent in the stomach.",
      "Photosynthetic pigment in green plants is chlorophyll, located in chloroplasts.",
    ],
  },
  {
    id: "sci-bio-reproduction-5m-2022-01",
    grade: "10",
    subject: "Science",
    stream: "Biology",
    topicKey: "How do Organisms Reproduce?",
    topicName: "How do Organisms Reproduce?",
    concept: "Sexual reproduction in humans",
    marks: 5,
    section: "D",
    difficulty: "Medium",
    tier: "high-roi",
    yearTag: "2022 Board",
    questionText:
      "Describe the process of sexual reproduction in humans under the following heads: \n(a) Formation of gametes \n(b) Fertilisation \n(c) Implantation and development of embryo.",
    answerOutline:
      "Gametes formed by meiosis in testes and ovaries; fertilisation occurs in fallopian tube forming zygote; zygote undergoes cell divisions, moves to uterus, implants in uterine wall and develops into embryo/foetus.",
    solutionSteps: [
      "Start with gamete formation: in males, testes produce sperms by meiosis; in females, ovaries produce ova (eggs).",
      "Explain that sperms are released during copulation and travel through the female reproductive tract.",
      "Fertilisation: fusion of sperm and ovum occurs in the fallopian tube, forming a diploid zygote.",
      "The zygote undergoes repeated mitotic divisions to form a multicellular embryo while moving towards the uterus.",
      "Implantation: the embryo gets embedded in the thick, soft uterine lining.",
      "After implantation, placenta forms and embryo gradually develops into a foetus until birth.",
    ],
  },
];
