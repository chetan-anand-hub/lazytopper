export const trianglesLearnSeedPack = {
  keyDefinitions: {
    definitions: [
      "Similar triangles: triangles with equal corresponding angles and proportional corresponding sides.",
      "Corresponding parts: vertex order decides matching sides/angles (ABC ~ PQR means A↔P, B↔Q, C↔R).",
      "AA similarity: if two angles are equal, triangles are similar.",
      "SAS similarity: if one included angle is equal and adjacent sides are in the same ratio, triangles are similar.",
      "SSS similarity: if all three pairs of sides are in the same ratio, triangles are similar.",
      "CPST: Corresponding Parts of Similar Triangles are proportional (sides) and equal (angles).",
    ],
    workedExamples: [
      {
        title: "Basic AA similarity",
        question: "If ∠A = ∠P and ∠B = ∠Q in triangles ABC and PQR, prove they are similar.",
        steps: [
          { text: "Given ∠A = ∠P and ∠B = ∠Q.", marks: 1 },
          { text: "Two angles equal ⇒ AA similarity criterion applies.", marks: 1 },
          { text: "Therefore, ΔABC ~ ΔPQR (A↔P, B↔Q, C↔R).", marks: 1 },
        ],
        totalMarks: 3,
        finalAnswer: "ΔABC ~ ΔPQR by AA similarity.",
      },
      {
        title: "Board-style CPST use",
        question: "If ΔABC ~ ΔPQR and AB = 6 cm, PQ = 3 cm, BC = 5 cm, find QR.",
        steps: [
          { text: "From similarity, AB/PQ = BC/QR (CPST).", marks: 1 },
          { text: "So 6/3 = 5/QR ⇒ 2 = 5/QR.", marks: 1 },
          { text: "Hence QR = 5/2 = 2.5 cm.", marks: 1 },
        ],
        totalMarks: 3,
        finalAnswer: "QR = 2.5 cm.",
      },
    ],
    commonMistakes: [
      "Mixing correspondence order (e.g., ABC ~ QPR without matching angles).",
      "Using SAS with a non-included angle.",
      "Using CPST before proving similarity.",
    ],
    checkQuestion: "What two conditions must be verified before using AA similarity?",
    diagramType: "SIMILARITY_DEFINITION",
    diagramLabels: { A: "A", B: "B", C: "C", P: "P", Q: "Q", R: "R" },
  },
  misconceptions: [
    {
      title: "Any two ratios imply similarity",
      fix: "You must prove a criterion (AA/SAS/SSS), not just one ratio.",
      diagramType: "SIMILARITY_AA",
    },
    {
      title: "BPT without parallel line",
      fix: "BPT needs a line parallel to a side; otherwise use similarity criteria.",
      diagramType: "BPT",
    },
    {
      title: "CPST before similarity",
      fix: "CPST applies only after triangles are proved similar.",
      diagramType: "SIMILARITY_SSS",
    },
    {
      title: "Wrong hypotenuse in Pythagoras",
      fix: "Hypotenuse is opposite the right angle; use only in right triangles.",
      diagramType: "PYTHAGORAS",
    },
  ],
  competencies: [
    {
      title: "Identify similarity criterion",
      example: "Equal angles given ⇒ AA similarity.",
      diagramType: "SIMILARITY_AA",
    },
    {
      title: "Apply BPT to solve ratios",
      example: "If DE || BC, write AD/DB = AE/EC.",
      diagramType: "BPT",
    },
    {
      title: "Use CPST after similarity",
      example: "AB/PQ = BC/QR = AC/PR once ΔABC ~ ΔPQR.",
      diagramType: "SIMILARITY_SSS",
    },
  ],
  mindmapNodes: {
    gQ1: {
      what: "Similarity means same shape, proportional sides, equal angles.",
      where: "When angles or side ratios match between triangles.",
      exam: "State the criterion and the correspondence order.",
      trap: "Mixing correspondence order.",
    },
    gAA: {
      what: "AA similarity uses two equal angles.",
      where: "Parallel lines give equal angles.",
      exam: "Write ∠A = ∠P, ∠B = ∠Q ⇒ ΔABC ~ ΔPQR.",
      trap: "Skipping angle equality step.",
    },
    gSAS: {
      what: "SAS needs included angle equality and adjacent side ratios.",
      where: "Given angle and two adjacent sides.",
      exam: "Use included angle, not a remote angle.",
      trap: "Using non-included angle.",
    },
    gSSS: {
      what: "SSS uses all three side ratios equal.",
      where: "All three sides known or computed.",
      exam: "Write all three ratios before concluding similarity.",
      trap: "Comparing wrong sides.",
    },
    gBPT: {
      what: "Parallel line divides sides proportionally.",
      where: "Line parallel to one side in a triangle.",
      exam: "Since DE || BC, AD/DB = AE/EC (BPT).",
      trap: "Using BPT without parallel line.",
    },
    gCPST: {
      what: "After similarity, corresponding parts are proportional/equal.",
      where: "Need an unknown side/angle.",
      exam: "AB/PQ = BC/QR = AC/PR (CPST).",
      trap: "Applying CPST before similarity.",
    },
  },
  proof: {
    title: "BPT proof (standard)",
    given: ["In ΔABC, DE || BC with D on AB and E on AC."],
    toProve: ["AD/DB = AE/EC."],
    construction: ["Not required."],
    steps: [
      { statement: "Given: DE || BC.", reason: "Given", mark: 1 },
      { statement: "∠ADE = ∠ABC and ∠AED = ∠ACB.", reason: "Alternate interior angles", mark: 1 },
      { statement: "ΔADE ~ ΔABC.", reason: "AA similarity", mark: 1 },
      { statement: "AD/AB = AE/AC.", reason: "CPST", mark: 1 },
      { statement: "AD/DB = AE/EC.", reason: "Componendo (or subtraction of 1)", mark: 1 },
    ],
    conclusion: ["Hence proved that AD/DB = AE/EC."],
    totalMarks: 5,
    diagramType: "BPT",
    diagramLabels: { A: "A", B: "B", C: "C", D: "D", E: "E" },
  },
  solveWithMe: {
    firstQuestion: "Which two triangles are being compared for similarity here?",
    answerFormat: "Short sentence (e.g., ΔADE and ΔABC).",
  },
} as const;
