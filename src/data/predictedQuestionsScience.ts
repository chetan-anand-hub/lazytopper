// src/data/predictedQuestionsScience.ts

// Keep Difficulty/Types aligned with Maths so UI can unify later
export type SciDifficultyKey = "Easy" | "Medium" | "Hard";
export type SciQuestionKind = "MCQ" | "Short" | "Assertion-Reasoning" | "Case-Based";
export type SciSectionKey = "A" | "B" | "C" | "D" | "E";
export type SciBloomSkill =
  | "Remembering"
  | "Understanding"
  | "Applying"
  | "Analysing"
  | "Evaluating"
  | "Creating";

// You can narrow this to your Science topic union if you have one.
// Using string here to avoid coupling to any other file.
export interface PredictedScienceQuestion {
  id: string;
  topicKey: string;          // e.g., "Electricity", "Light – Reflection and Refraction"
  subtopic: string;          // e.g., "Ohm's Law", "Lens Formula"
  kind: SciQuestionKind;     // MCQ/Short/AR/Case-Based
  section: SciSectionKey;    // A–E (E = case-based)
  marks: number;
  difficulty: SciDifficultyKey;
  bloomSkill: SciBloomSkill;
  questionText: string;
  options?: string[];        // for MCQs
  answer: string;            // short key/one-liner/choice
  explanation: string;

  // Optional tutor fields
  solutionSteps?: string[];
  finalAnswer?: string;
  strategyHint?: string;

  // Optional predictive metadata
  pastBoardYear?: string;
  policyTag?: string;        // “SamplePaper2025 focus”, “NEP shift”, etc.
}

export const predictedQuestionsScience: PredictedScienceQuestion[] = [
  // ===================== PHYSICS =====================

  // ===== ELECTRICITY =====
  {
    id: "2026-SCI-ELEC-MCQ-01",
    topicKey: "Electricity",
    subtopic: "Ohm's Law & Units",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "Which of the following is the SI unit of electric resistance?",
    options: ["Volt", "Ampere", "Ohm", "Coulomb"],
    answer: "Ohm",
    explanation:
      "The SI unit of resistance is Ohm (Ω); V = IR relates Volt, Ampere, and Ohm.",
    pastBoardYear: "2024",
    policyTag: "Direct recall/Ohm’s law",
  },
  {
    id: "2026-SCI-ELEC-SA-02",
    topicKey: "Electricity",
    subtopic: "Series vs Parallel",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Understanding",
    questionText:
      "State one advantage of connecting household bulbs in parallel rather than in series. Also, justify briefly.",
    answer:
      "In parallel, each bulb gets full supply voltage; if one fails, others continue to work.",
    explanation:
      "Parallel connection maintains rated voltage across each branch and isolates branch failures.",
    policyTag: "Everyday application",
  },
  {
    id: "2026-SCI-ELEC-SA-03",
    topicKey: "Electricity",
    subtopic: "Equivalent Resistance (Mixed)",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Find the equivalent resistance between A and B when two 6 Ω resistors are in series and that combination is in parallel with a 3 Ω resistor.",
    answer: "2.4 Ω",
    explanation:
      "Series: 6 Ω + 6 Ω = 12 Ω; this series combination in parallel with 3 Ω gives Req = (12 × 3)/(12 + 3) = 36/15 = 2.4 Ω.",
    solutionSteps: [
      "Add series resistors: 6 Ω + 6 Ω = 12 Ω.",
      "Use the parallel formula (R1·R2)/(R1+R2) with 12 Ω and 3 Ω.",
      "Req = 36/15 = 2.4 Ω.",
    ],
    finalAnswer: "2.4 Ω",
    strategyHint: "Do series first, then parallel.",
    policyTag: "Mixed network",
  },
  {
    id: "2026-SCI-ELEC-AR-04",
    topicKey: "Electricity",
    subtopic: "Power & Heating Effect",
    kind: "Assertion-Reasoning",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Assertion (A): For a fixed resistance, the electrical power increases with square of the current. Reason (R): P = I²R.",
    answer:
      "Both A and R are true, and R is the correct explanation of A.",
    explanation:
      "From the power formula P = I²R, increasing current increases power quadratically for a fixed resistance.",
    policyTag: "Core formula reasoning",
  },
  {
    id: "2026-SCI-ELEC-CASE-05",
    topicKey: "Electricity",
    subtopic: "Household Circuits & Safety",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "A household circuit has lights (60 W × 3) and a heater (1000 W) connected to 230 V supply. (i) Estimate total current when all are ON. (ii) State a safety device used in domestic circuits and its function.",
    answer:
      "(i) I ≈ (3×60 + 1000)/230 = (180 + 1000)/230 ≈ 5.13 A. (ii) MCB/fuse—breaks circuit when current exceeds safe limit.",
    explanation:
      "Total power: 3×60 W + 1000 W = 1180 W. Using I = P/V gives about 5.13 A. A fuse/MCB interrupts excessive current to prevent overheating and fire.",
    policyTag: "Real-life case",
  },

  // ===== MAGNETIC EFFECTS OF ELECTRIC CURRENT (SET 1) =====
  {
    id: "2026-SCI-MAG-MCQ-01",
    topicKey: "Magnetic Effects of Electric Current",
    subtopic: "Right-Hand Thumb Rule",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "Right-hand thumb rule gives the direction of which of the following around a current-carrying conductor?",
    options: ["Electric field", "Magnetic field", "Current", "Potential"],
    answer: "Magnetic field",
    explanation:
      "Thumb points in the direction of current; curled fingers give the direction of magnetic field lines around the conductor.",
    policyTag: "Rule recall",
  },
  {
    id: "2026-SCI-MAG-SA-02",
    topicKey: "Magnetic Effects of Electric Current",
    subtopic: "Fleming’s Left-Hand Rule",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Understanding",
    questionText:
      "State Fleming’s left-hand rule and mention its application in devices.",
    answer:
      "Thumb: force, Forefinger: field, Middle finger: current; used to predict direction of force in electric motors.",
    explanation:
      "It relates field, current, and motion for a conductor in a magnetic field, forming the principle of working for electric motors.",
    policyTag: "Motor principle",
  },
  {
    id: "2026-SCI-MAG-CASE-03",
    topicKey: "Magnetic Effects of Electric Current",
    subtopic: "Electromagnetic Induction",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "A coil is connected to a sensitive galvanometer. A bar magnet is moved towards and away from the coil. (i) When is the deflection observed? (ii) How does the speed of the magnet affect the deflection?",
    answer:
      "(i) During relative motion—approach or withdrawal—deflection occurs. (ii) Faster motion ⇒ greater rate of change of flux ⇒ larger induced EMF and deflection.",
    explanation:
      "Faraday’s law: induced EMF is proportional to the rate of change of magnetic flux. Greater speed changes flux faster, producing larger deflection.",
    policyTag: "EMI case",
  },

  // ===== LIGHT – REFLECTION & REFRACTION =====
  {
    id: "2026-SCI-LIGHT-MCQ-01",
    topicKey: "Light – Reflection and Refraction",
    subtopic: "Mirror vs Lens Sign Conventions",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "In the mirror formula 1/f = 1/v + 1/u, which sign convention is used in CBSE?",
    options: ["Cartesian", "Clockwise", "Anticlockwise", "Vector"],
    answer: "Cartesian",
    explanation:
      "CBSE follows the Cartesian sign convention for mirrors and lenses (distances measured from pole along principal axis).",
    policyTag: "Formula basics",
  },
  {
    id: "2026-SCI-LIGHT-SA-02",
    topicKey: "Light – Reflection and Refraction",
    subtopic: "Lens Formula",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "An object is placed at 30 cm from a convex lens of focal length 15 cm. Find the image distance and nature of image.",
    answer:
      "Using 1/f = 1/v + 1/u ⇒ 1/15 = 1/v − 1/30 ⇒ 1/v = 1/10 ⇒ v = 10 cm (real, inverted, diminished).",
    explanation:
      "Using u = −30 cm, f = +15 cm, lens formula gives v = +10 cm. Image is real, inverted, and diminished (formed between F and 2F).",
    solutionSteps: [
      "Use u = −30 cm, f = +15 cm (Cartesian convention).",
      "Apply lens formula: 1/f = 1/v + 1/u.",
      "Solve for v and state image characteristics.",
    ],
    policyTag: "Standard derivation",
  },
  {
    id: "2026-SCI-LIGHT-AR-03",
    topicKey: "Light – Reflection and Refraction",
    subtopic: "Refractive Index",
    kind: "Assertion-Reasoning",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Assertion (A): A higher refractive index medium bends light towards the normal. Reason (R): Refraction occurs due to change in speed of light in different media.",
    answer:
      "Both A and R are true, and R is the correct explanation of A.",
    explanation:
      "Higher refractive index means lower speed; light bends towards the normal when entering a denser medium due to speed change.",
    policyTag: "RI concept",
  },
  {
    id: "2026-SCI-LIGHT-CASE-04",
    topicKey: "Light – Reflection and Refraction",
    subtopic: "Ray Diagrams (Lenses)",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "A student uses a convex lens to project an image of a distant building on a screen. (i) How should the lens and screen be adjusted to obtain the sharp image? (ii) Where will the screen be placed approximately relative to the lens focal length?",
    answer:
      "(i) Adjust the distance between lens and screen to get maximum sharpness. (ii) For a distant object, image forms at the focal plane, so screen is at ≈ f from lens.",
    explanation:
      "Parallel rays from distant objects converge at the focal point of a convex lens.",
    policyTag: "Practical optics",
  },

  // ===== HUMAN EYE & COLOURFUL WORLD =====
  {
    id: "2026-SCI-EYE-MCQ-01",
    topicKey: "Human Eye and Colourful World",
    subtopic: "Power of Accommodation",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "Power of accommodation of the human eye refers to the ability to:",
    options: [
      "Change the size of the pupil",
      "Change the focal length of the eye lens",
      "Change the diameter of the cornea",
      "Change the length of the retina",
    ],
    answer: "Change the focal length of the eye lens",
    explanation:
      "Ciliary muscles adjust lens curvature, thereby changing focal length to focus near or distant objects.",
    policyTag: "Eye basics",
  },
  {
    id: "2026-SCI-EYE-SA-02",
    topicKey: "Human Eye and Colourful World",
    subtopic: "Defects & Correction",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Understanding",
    questionText:
      "Differentiate between myopia and hypermetropia and state their optical corrections.",
    answer:
      "Myopia: near-sightedness; corrected by concave lens. Hypermetropia: far-sightedness; corrected by convex lens.",
    explanation:
      "Concave lenses diverge rays for myopia; convex lenses converge rays for hypermetropia.",
    policyTag: "Eye defects",
  },
  {
    id: "2026-SCI-EYE-CASE-03",
    topicKey: "Human Eye and Colourful World",
    subtopic: "Dispersion & Scattering",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Explain why the sky appears blue during the day and reddish at sunrise/sunset. Also relate this to Rayleigh scattering and path length through the atmosphere.",
    answer:
      "Shorter wavelengths (blue) scatter more; overhead sun → blue dominates. At sunrise/sunset, longer path through atmosphere removes blue via scattering, so red/orange dominate.",
    explanation:
      "Rayleigh scattering ∝ 1/λ⁴; a longer atmospheric path at low sun angles enhances the dominance of red hues.",
    policyTag: "Scattering phenomenon",
  },

  // ===================== CHEMISTRY =====================

  // ===== CHEMICAL REACTIONS & EQUATIONS =====
  {
    id: "2026-SCI-CR-MCQ-01",
    topicKey: "Chemical Reactions and Equations",
    subtopic: "Balancing & Types",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "Which of the following is a combination reaction?",
    options: [
      "2H2O → 2H2 + O2",
      "N2 + 3H2 → 2NH3",
      "2KClO3 → 2KCl + 3O2",
      "Zn + CuSO4 → ZnSO4 + Cu",
    ],
    answer: "N2 + 3H2 → 2NH3",
    explanation:
      "Two reactants combine to form a single product (NH3).",
    policyTag: "Direct recall/types",
  },
  {
    id: "2026-SCI-CR-SA-02",
    topicKey: "Chemical Reactions and Equations",
    subtopic: "Oxidation/Reduction",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Understanding",
    questionText:
      "Define oxidation and reduction in terms of oxygen and hydrogen. Give one example for each.",
    answer:
      "Oxidation: addition of oxygen/removal of hydrogen. Reduction: removal of oxygen/addition of hydrogen.",
    explanation:
      "Example oxidation: 2Mg + O2 → 2MgO. Example reduction: CuO + H2 → Cu + H2O.",
    policyTag: "Core concept",
  },
  {
    id: "2026-SCI-CR-AR-03",
    topicKey: "Chemical Reactions and Equations",
    subtopic: "Corrosion/Rancidity",
    kind: "Assertion-Reasoning",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Assertion (A): Painting an iron surface prevents rusting. Reason (R): Paint insulates the metal from air and moisture.",
    answer:
      "Both A and R are true, and R is the correct explanation of A.",
    explanation:
      "Rusting requires oxygen and moisture; coating prevents contact.",
    policyTag: "Everyday chemistry",
  },
  {
    id: "2026-SCI-CR-CASE-04",
    topicKey: "Chemical Reactions and Equations",
    subtopic: "Balancing & Equation Writing",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "A student performs reactions with zinc and dilute sulphuric acid and observes effervescence. (i) Write balanced chemical equation. (ii) Identify the gas and its test. (iii) Classify the reaction type.",
    answer:
      "(i) Zn + H2SO4 → ZnSO4 + H2↑. (ii) Hydrogen gas; gives a pop sound with a burning splint. (iii) Displacement reaction.",
    explanation:
      "Active metals displace hydrogen from acids and release H2 gas.",
    policyTag: "Lab context",
  },

  // ===== ACIDS, BASES AND SALTS =====
  {
    id: "2026-SCI-ABS-MCQ-01",
    topicKey: "Acids, Bases and Salts",
    subtopic: "Indicators/pH",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "A solution turns red litmus blue. The solution is most likely:",
    options: ["Acidic", "Basic", "Neutral", "Salt of weak acid"],
    answer: "Basic",
    explanation:
      "Bases turn red litmus blue, while acids turn blue litmus red.",
    policyTag: "Indicator basics",
  },
  {
    id: "2026-SCI-ABS-SA-02",
    topicKey: "Acids, Bases and Salts",
    subtopic: "Common Salts & Uses",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Understanding",
    questionText:
      "Write one preparation method and one use each for washing soda (Na2CO3·10H2O) and baking soda (NaHCO3).",
    answer:
      "Washing soda: prepared by Solvay process; used for softening hard water. Baking soda: prepared from brine with NH3 and CO2; used as an antacid and in baking.",
    explanation:
      "Both are important sodium salts with distinct industrial and household uses.",
    policyTag: "Everyday salts",
  },
  {
    id: "2026-SCI-ABS-AR-03",
    topicKey: "Acids, Bases and Salts",
    subtopic: "Neutralisation/Applications",
    kind: "Assertion-Reasoning",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Assertion (A): Plaster of Paris (POP) should be stored in a moisture-proof container. Reason (R): POP reacts with moisture to form gypsum.",
    answer:
      "Both A and R are true, and R is the correct explanation of A.",
    explanation:
      "CaSO4·½H2O reacts with water to form CaSO4·2H2O, losing its setting property if exposed to moisture.",
    policyTag: "Moisture sensitivity",
  },
  {
    id: "2026-SCI-ABS-CASE-04",
    topicKey: "Acids, Bases and Salts",
    subtopic: "pH in Daily Life",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "A farmer tests soil pH and finds it too acidic. (i) Suggest a chemical treatment. (ii) Explain why it works. (iii) Name an indicator suitable for soil testing.",
    answer:
      "(i) Add slaked lime (Ca(OH)2). (ii) It neutralises excess acidity. (iii) Use universal indicator or pH paper.",
    explanation:
      "Soil pH affects nutrient availability; liming adjusts pH into the optimal range for crops.",
    policyTag: "Applied chemistry",
  },

  // ===== METALS AND NON-METALS (SET 1) =====
  {
    id: "2026-SCI-MNM-MCQ-01",
    topicKey: "Metals and Non-Metals",
    subtopic: "Physical Properties",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "Which of the following is a non-metal but lustrous?",
    options: ["Iodine", "Sulphur", "Phosphorus", "Carbon (charcoal)"],
    answer: "Iodine",
    explanation:
      "Iodine is a classic lustrous non-metal, a favourite exam exception.",
    policyTag: "Property exception",
  },
  {
    id: "2026-SCI-MNM-SA-02",
    topicKey: "Metals and Non-Metals",
    subtopic: "Reactivity Series/Displacement",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Write a balanced equation to show displacement of copper from copper sulphate solution by iron. Also state whether the reaction is exothermic/endothermic.",
    answer:
      "Fe + CuSO4 → FeSO4 + Cu; typically exothermic.",
    explanation:
      "Iron is more reactive than copper and displaces it from solution, releasing energy.",
    policyTag: "Reactivity series",
  },
  {
    id: "2026-SCI-MNM-AR-03",
    topicKey: "Metals and Non-Metals",
    subtopic: "Ores/Extraction",
    kind: "Assertion-Reasoning",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Assertion (A): Aluminium is extracted by electrolysis of alumina. Reason (R): Aluminium forms highly stable compound Al2O3 and is above carbon in the reactivity series.",
    answer:
      "Both A and R are true, and R is the correct explanation of A.",
    explanation:
      "Aluminium is too reactive to be reduced by carbon, so electrolysis of alumina is used.",
    policyTag: "Extraction principle",
  },
  {
    id: "2026-SCI-MNM-CASE-04",
    topicKey: "Metals and Non-Metals",
    subtopic: "Rust Prevention/Alloys",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "A bridge uses iron components exposed to humidity. (i) Suggest two protection methods. (ii) Explain sacrificial protection using zinc. (iii) Name one corrosion-resistant alloy.",
    answer:
      "(i) Painting/galvanisation. (ii) Zinc is more reactive and corrodes preferentially. (iii) Stainless steel.",
    explanation:
      "Barrier coatings and sacrificial anodes are standard industrial anti-corrosion strategies.",
    policyTag: "Materials engineering",
  },

  // ===== CARBON AND ITS COMPOUNDS (SET 1) =====
  {
    id: "2026-SCI-CARBON-MCQ-01",
    topicKey: "Carbon and its Compounds",
    subtopic: "Homologous Series",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "Members of a homologous series differ by a ———— group and ———— in molecular mass.",
    options: [
      "–CH3, 16 u",
      "–CH2–, 14 u",
      "–OH, 18 u",
      "–COOH, 45 u",
    ],
    answer: "–CH2–, 14 u",
    explanation:
      "Consecutive members of a homologous series differ by one –CH2– unit, i.e., 14 u in mass.",
    policyTag: "Direct recall",
  },
  {
    id: "2026-SCI-CARBON-SA-02",
    topicKey: "Carbon and its Compounds",
    subtopic: "Isomerism/Structural",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Draw the structures of two isomers of C4H10 and name them.",
    answer:
      "n-Butane and isobutane (2-methylpropane).",
    explanation:
      "They have the same molecular formula C4H10 but different structural arrangements of the carbon skeleton.",
    policyTag: "Isomer basics",
  },
  {
    id: "2026-SCI-CARBON-AR-03",
    topicKey: "Carbon and its Compounds",
    subtopic: "Saponification/Esterification",
    kind: "Assertion-Reasoning",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Assertion (A): Soap formation from fats is called saponification. Reason (R): It is a hydrolysis reaction of esters in the presence of alkali.",
    answer:
      "Both A and R are true, and R is the correct explanation of A.",
    explanation:
      "Fats are esters of fatty acids; hydrolysis in presence of alkali produces soap and alcohol.",
    policyTag: "Organic process",
  },
  {
    id: "2026-SCI-CARBON-CASE-04",
    topicKey: "Carbon and its Compounds",
    subtopic: "Functional Groups/Properties",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "A student tests three liquids X, Y, Z with neutral litmus, NaHCO3, and a metallic sodium piece. Observations: (i) Y gives brisk effervescence with NaHCO3. (ii) Z reacts with sodium metal evolving gas. (iii) X shows no change in litmus. Identify possible functional groups for X, Y, Z with reasons.",
    answer:
      "Y likely carboxylic acid (CO2 with NaHCO3). Z likely alcohol (H2 with Na). X likely aldehyde/ketone/hydrocarbon (no immediate change with tests given).",
    explanation:
      "Different characteristic tests help distinguish functional groups in organic compounds.",
    policyTag: "Organic identification",
  },

  // ===== PERIODIC CLASSIFICATION OF ELEMENTS (SET 1) =====
  {
    id: "2026-SCI-PERIODIC-MCQ-01",
    topicKey: "Periodic Classification of Elements",
    subtopic: "Trends (Groups/Periods)",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "Across a period in the modern periodic table, the atomic radius generally:",
    options: [
      "Increases",
      "Decreases",
      "Remains constant",
      "First increases then decreases",
    ],
    answer: "Decreases",
    explanation:
      "Effective nuclear charge increases across a period, pulling electrons closer to the nucleus.",
    policyTag: "Trend recall",
  },
  {
    id: "2026-SCI-PERIODIC-SA-02",
    topicKey: "Periodic Classification of Elements",
    subtopic: "Mendeleev vs Modern Table",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Understanding",
    questionText:
      "State two merits of Mendeleev’s periodic table and one limitation addressed by the modern periodic table.",
    answer:
      "Merits: (i) Predicted undiscovered elements, (ii) Grouped elements by similar properties. Limitation: Position of isotopes resolved in modern table by arranging elements according to atomic number.",
    explanation:
      "Modern periodic law uses atomic number, resolving several anomalies present in Mendeleev’s arrangement.",
    policyTag: "Historical development",
  },
  {
    id: "2026-SCI-PERIODIC-AR-03",
    topicKey: "Periodic Classification of Elements",
    subtopic: "Valency & Position",
    kind: "Assertion-Reasoning",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Assertion (A): Elements in the same group have similar chemical properties. Reason (R): They have the same number of valence electrons.",
    answer:
      "Both A and R are true, and R is the correct explanation of A.",
    explanation:
      "Valence electrons determine bonding and reactivity, so a constant valence count within a group leads to similar properties.",
    policyTag: "Periodic logic",
  },
  {
    id: "2026-SCI-PERIODIC-CASE-04",
    topicKey: "Periodic Classification of Elements",
    subtopic: "Predicting Properties",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Elements X and Y are in the same period with atomic numbers 11 and 16 respectively. Predict (i) metallic/non-metallic nature, (ii) likely valencies, and (iii) oxide character, with reasons.",
    answer:
      "(i) X (Na) is metallic; Y (S) is non-metallic. (ii) X: +1; Y: −2. (iii) Na2O is basic; SO2/SO3 are acidic oxides.",
    explanation:
      "Across a period, metallic character decreases while non-metallic character and acidic oxide nature increase.",
    policyTag: "Trends + reasoning",
  },

  // ===== MAGNETIC EFFECTS OF ELECTRIC CURRENT (SET 2 – RENAMED IDS) =====
  {
    id: "2026-SCI-MAG-MCQ-04",
    topicKey: "Magnetic Effects of Electric Current",
    subtopic: "Right Hand Thumb Rule",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "Right-hand thumb rule gives the direction of which quantity around a current-carrying straight conductor?",
    options: ["Current", "Magnetic field lines", "Potential difference", "Charge flow"],
    answer: "Magnetic field lines",
    explanation:
      "Right-hand thumb rule: thumb points along current; curled fingers show direction of magnetic field lines (concentric circles).",
    policyTag: "Direct recall/RHTR",
  },
  {
    id: "2026-SCI-MAG-SA-05",
    topicKey: "Magnetic Effects of Electric Current",
    subtopic: "Fleming’s Left-Hand Rule",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "State Fleming’s left-hand rule and write the directions represented by thumb, forefinger and middle finger.",
    answer:
      "Forefinger → magnetic field; middle finger → current; thumb → force on conductor.",
    explanation:
      "Fleming’s left-hand rule is used to find the direction of motion/force on a current-carrying conductor in a magnetic field.",
    policyTag: "Board classic",
  },
  {
    id: "2026-SCI-MAG-CASE-06",
    topicKey: "Magnetic Effects of Electric Current",
    subtopic: "Electromagnetic Induction",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "A coil is connected to a sensitive galvanometer. A bar magnet is moved towards and away from the coil at different speeds. (i) What do you observe? (ii) State two factors on which the induced current depends. (iii) How will the observation change if the magnet’s north pole is replaced by south pole?",
    answer:
      "(i) Galvanometer shows deflection whose direction changes on approach/withdrawal or when pole is reversed. (ii) Depends on rate of change of magnetic flux: speed of motion and strength of magnet/number of turns. (iii) Deflection reverses direction when pole is changed.",
    explanation:
      "Faraday’s and Lenz’s laws explain induced EMF magnitude and direction based on change in flux and its opposition.",
    policyTag: "NEP case-based emphasis",
  },

  // ===== SOURCES OF ENERGY =====
  {
    id: "2026-SCI-ENERGY-MCQ-01",
    topicKey: "Sources of Energy",
    subtopic: "Renewable vs Non-renewable",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "Which of the following is a renewable source of energy?",
    options: ["Coal", "Petroleum", "Wind", "Natural gas"],
    answer: "Wind",
    explanation:
      "Wind energy is replenished naturally; coal, petroleum, and natural gas are non-renewable fossil fuels.",
    policyTag: "Direct recall",
  },
  {
    id: "2026-SCI-ENERGY-SA-02",
    topicKey: "Sources of Energy",
    subtopic: "Characteristics of Good Fuel",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "List any four characteristics of an ideal fuel.",
    answer:
      "High calorific value, easy and safe storage/transport, moderate ignition temperature, minimal pollution/ash, economical, and readily available.",
    explanation:
      "Board-style answer aligning with NCERT points on ideal fuel characteristics.",
    policyTag: "Board list-type",
  },

  // ===== METALS AND NON-METALS (SET 2 – RENAMED IDS) =====
  {
    id: "2026-SCI-MNM-MCQ-05",
    topicKey: "Metals and Non-Metals",
    subtopic: "Chemical Properties/Reactivity",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "Aqua regia can dissolve gold because it contains:",
    options: [
      "Conc. HNO₃ alone",
      "Conc. HCl alone",
      "Conc. HNO₃ and conc. HCl (1:3)",
      "Dil. HNO₃ and conc. HCl (1:1)",
    ],
    answer: "Conc. HNO₃ and conc. HCl (1:3)",
    explanation:
      "Aqua regia is a mixture of concentrated nitric acid and concentrated hydrochloric acid in 1:3 ratio.",
    policyTag: "Facts/chemistry",
  },
  {
    id: "2026-SCI-MNM-SA-06",
    topicKey: "Metals and Non-Metals",
    subtopic: "Extraction/Occurrence",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Name the method used for refining highly reactive metals like sodium and aluminium. Explain briefly.",
    answer:
      "Electrolytic refining: impure metal is anode, pure metal is cathode; metal ions get reduced at the cathode and deposit as pure metal.",
    explanation:
      "Reactive and light metals are refined using electrolytic methods rather than simple chemical reduction.",
    policyTag: "Standard 3-mark",
  },

  // ===== CARBON AND ITS COMPOUNDS (SET 2 – RENAMED IDS) =====
  {
    id: "2026-SCI-CARBON-MCQ-05",
    topicKey: "Carbon and its Compounds",
    subtopic: "Homologous Series/Functional Groups",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "Which functional group is present in ethanol?",
    options: ["–CHO", "–COOH", "–OH", "–CO–"],
    answer: "–OH",
    explanation:
      "Ethanol is an alcohol; all alcohols contain the hydroxyl (–OH) group.",
    policyTag: "Direct recall",
  },
  {
    id: "2026-SCI-CARBON-SA-06",
    topicKey: "Carbon and its Compounds",
    subtopic: "Esterification/Saponification",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "Write a balanced chemical equation for esterification between ethanol and ethanoic acid. Name the catalyst used.",
    answer:
      "CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O; conc. H₂SO₄ as catalyst.",
    explanation:
      "Esterification of ethanoic acid with ethanol in presence of conc. H₂SO₄ gives an ester with fruity smell.",
    policyTag: "Equation + catalyst",
  },

  // ===== PERIODIC CLASSIFICATION OF ELEMENTS (SET 2 – RENAMED IDS) =====
  {
    id: "2026-SCI-PERIODIC-MCQ-05",
    topicKey: "Periodic Classification of Elements",
    subtopic: "Trends in Period/Group",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "Across a period from left to right, atomic radius generally:",
    options: ["Increases", "Decreases", "Remains constant", "First increases then decreases"],
    answer: "Decreases",
    explanation:
      "With increasing atomic number across a period, nuclear charge increases and pulls electrons closer, decreasing atomic radius.",
    policyTag: "Trends",
  },
  {
    id: "2026-SCI-PERIODIC-SA-06",
    topicKey: "Periodic Classification of Elements",
    subtopic: "Modern vs Mendeleev",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "State any three advantages of the Modern Periodic Table over Mendeleev’s table.",
    answer:
      "Arrangement by atomic number, clear position of isotopes, better explanation of periodicity, systematic placement of noble gases, clearer separation of metals, non-metals, and transition elements.",
    explanation:
      "Using atomic number resolves anomalies and predicts properties more accurately than atomic mass-based arrangements.",
    policyTag: "Comparative",
  },

  // ===== HOW DO ORGANISMS REPRODUCE? =====
  {
    id: "2026-SCI-REPRO-SA-01",
    topicKey: "How do Organisms Reproduce?",
    subtopic: "Asexual vs Sexual",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "Differentiate between binary fission and multiple fission with one example each.",
    answer:
      "Binary fission: parent splits into two daughter cells (e.g., Amoeba). Multiple fission: nucleus divides repeatedly before cytoplasm splits, forming many cells (e.g., Plasmodium).",
    explanation:
      "Both are asexual modes but differ in number of offsprings and pattern of division.",
    policyTag: "Biology short",
  },

  // ===== HEREDITY AND EVOLUTION =====
  {
    id: "2026-SCI-HEREDITY-MCQ-01",
    topicKey: "Heredity and Evolution",
    subtopic: "Mendel’s Laws",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "The phenotypic ratio in a monohybrid cross is:",
    options: ["9:3:3:1", "3:1", "1:2:1", "1:1:1:1"],
    answer: "3:1",
    explanation:
      "Monohybrid cross for a trait with complete dominance gives 3 dominant : 1 recessive phenotype ratio in F₂ generation.",
    policyTag: "Classic genetics",
  },
  {
    id: "2026-SCI-HEREDITY-SA-02",
    topicKey: "Heredity and Evolution",
    subtopic: "Sex Determination",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Understanding",
    questionText:
      "Explain sex determination in humans with the help of a suitable diagram showing gametes and zygote combinations.",
    answer:
      "Females (XX) produce only X-bearing ova; males (XY) produce X- or Y-bearing sperms. XX zygote develops as female; XY zygote as male.",
    explanation:
      "The father contributes either X or Y chromosome, hence determines the sex of the child.",
    policyTag: "Explain with sketch",
  },

  // ===== OUR ENVIRONMENT =====
  {
    id: "2026-SCI-ENV-MCQ-01",
    topicKey: "Our Environment",
    subtopic: "Food Chain/Web & Trophic Levels",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "Which of the following is always at the first trophic level?",
    options: ["Herbivores", "Carnivores", "Producers", "Decomposers"],
    answer: "Producers",
    explanation:
      "Green plants and autotrophs are producers and form the first trophic level.",
    policyTag: "Direct recall",
  },
  {
    id: "2026-SCI-ENV-SA-02",
    topicKey: "Our Environment",
    subtopic: "Ozone Depletion/Waste Management",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "Write any two harmful effects of ozone depletion and suggest two measures to reduce waste generation at source.",
    answer:
      "Effects: more UV leading to skin cancer/cataract and reduced plankton productivity. Measures: refuse unnecessary packaging and reduce/reuse materials.",
    explanation:
      "Ozone depletion increases UV exposure, while 3R practices help minimise waste at the source.",
    policyTag: "Integrated short",
  },

  // ===== MANAGEMENT OF NATURAL RESOURCES =====
  {
    id: "2026-SCI-RES-AR-01",
    topicKey: "Management of Natural Resources",
    subtopic: "3Rs/Stakeholder Approach",
    kind: "Assertion-Reasoning",
    section: "D",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Assertion (A): Water harvesting improves groundwater levels. Reason (R): It reduces surface run-off and increases infiltration. Choose the correct option: (a) A and R true; R correct explanation of A (b) A and R true; R not correct explanation (c) A true; R false (d) A false; R true",
    options: ["(a)", "(b)", "(c)", "(d)"],
    answer: "(a)",
    explanation:
      "Both A and R are true and R correctly explains A; harvesting structures reduce run-off and encourage percolation to recharge groundwater.",
    policyTag: "AR pattern",
  },
]; // <<< END of predictedQuestionsScience
