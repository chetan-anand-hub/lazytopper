// src/data/practicePackSummaries.ts
//
// Descriptive summaries for each practice pack (topicKey) from promptDPracticePacks.ts.
// These summaries help students choose which pack to attempt based on their
// current goals. Generated from Task S21.

export interface PracticePackSummary {
  topicKey: string;
  summary: string;
  emoji?: string;
}

export const practicePackSummaries: Record<string, PracticePackSummary> = {
  // Science packs
  chemical_reactions_equations: {
    topicKey: 'chemical_reactions_equations',
    summary: 'Drills the core of Chemical Reactions and Equations with 10 exam‑style questions on balancing, reaction types and real‑life changes like rusting, corrosion and neutralisation. Perfect for mastering 2–3 mark reasoning the board loves.',
    emoji: '🔥',
  },
  acids_bases_salts: {
    topicKey: 'acids_bases_salts',
    summary: 'Practise Acids, Bases and Salts through questions on indicators, pH, reactions with metals and carbonates, and everyday salts like baking soda, washing soda and Plaster of Paris. Ideal revision for one‑mark and short reasoning questions.',
    emoji: '🧪',
  },
  metals_nonmetals: {
    topicKey: 'metals_nonmetals',
    summary: 'Covers Metals and Non‑Metals: physical and chemical properties, reactivity series, displacement reactions and corrosion/prevention. Balanced mix of 1–3 mark questions to quickly recall trends and explain metallic behaviour.',
    emoji: '🔩',
  },
  carbon_compounds: {
    topicKey: 'carbon_compounds',
    summary: 'Structured questions on covalent bonding, homologous series, nomenclature, isomers and reactions of ethanol, ethanoic acid, soaps and detergents. Great for solidifying 2–3 mark conceptual answers in versatile carbon chemistry.',
    emoji: '🧬',
  },
  life_processes: {
    topicKey: 'life_processes',
    summary: 'Revises Life Processes with questions on nutrition, respiration, transportation and excretion in plants and animals. Practise drawing key functions and explaining processes in 2–3 mark chunks as examiners expect.',
    emoji: '🫀',
  },
  electricity: {
    topicKey: 'electricity',
    summary: 'Numerical and conceptual questions on Ohm’s law, series/parallel resistance, electric power and heating effect. Ideal for building confidence with simple calculations and frequent 2–3 mark circuit questions.',
    emoji: '⚡',
  },
  periodic_classification: {
    topicKey: 'periodic_classification',
    summary: 'Explores the modern periodic table, trends in atomic size, valency and metallic/non‑metallic character, plus limitations of older classifications. Use it to practise board‑style questions on trends and element placement.',
    emoji: '📊',
  },
  control_coordination: {
    topicKey: 'control_coordination',
    summary: 'Questions on the human nervous system, reflex actions, hormones and plant movements. Tighten 2–3 mark answers linking stimulus, pathway and response — a favourite in biology long answers.',
    emoji: '🧠',
  },
  reproduction: {
    topicKey: 'reproduction',
    summary: 'Covers How Do Organisms Reproduce? including asexual and sexual reproduction, reproductive organs, fertilisation and simple diagrams. Crisp questions help frame clear, labelled answers rewarded by marking schemes.',
    emoji: '🌱',
  },
  heredity_evolution: {
    topicKey: 'heredity_evolution',
    summary: 'Practise Heredity and Evolution concepts like Mendel’s laws, dominant vs recessive traits, genotype vs phenotype and basic evolutionary ideas. Turns a heavy chapter into predictable exam‑friendly questions.',
    emoji: '🧬',
  },
  light_reflection_refraction: {
    topicKey: 'light_reflection_refraction',
    summary: 'Sharpens Light – Reflection and Refraction skills with ray diagrams, mirror/lens formulas and sign‑convention reasoning. Perfect for avoiding common sign mistakes and drawing neat diagrams that fetch easy marks.',
    emoji: '🔦',
  },
  human_eye_colourful_world: {
    topicKey: 'human_eye_colourful_world',
    summary: 'Explores the Human Eye and the Colourful World: structure of the eye, defects and corrections, dispersion, scattering and atmospheric phenomena like rainbow, sunset and sky colour. A compact drill for common explanation questions.',
    emoji: '👁️',
  },
  magnetic_effects: {
    topicKey: 'magnetic_effects',
    summary: 'Questions on magnetic field lines, right‑hand thumb rule, electromagnets and domestic electric circuits. Ideal for revising theory plus simple diagrams that often appear in mid‑length questions.',
    emoji: '🧲',
  },
  our_environment: {
    topicKey: 'our_environment',
    summary: 'Revises Our Environment with questions on food chains, webs, trophic levels, energy flow and human impacts on ecosystems. Great for quick 2–3 mark conceptual practice.',
    emoji: '🌍',
  },
  natural_resources_management: {
    topicKey: 'natural_resources_management',
    summary: 'Covers sustainable use, forest and wildlife conservation, coal and petroleum, and the 3Rs (reduce, reuse, recycle). Polishes value‑based short answers that regularly appear in theory sections.',
    emoji: '🌱',
  },
  // Maths packs
  real_numbers: {
    topicKey: 'real_numbers',
    summary: 'Targets Real Numbers with Euclid’s division algorithm, HCF/LCM via prime factorisation and terminating/non‑terminating decimals. Provides proof‑style 2–3 mark questions for easy marks once the steps are memorised.',
    emoji: '📏',
  },
  polynomials: {
    topicKey: 'polynomials',
    summary: 'Problems on zeros and coefficients, factorisation, graphs and simple identities. Mixes 1–4 mark questions so you can handle direct formula use and slightly longer reasoning in one go.',
    emoji: '✏️',
  },
  pair_of_linear_equations: {
    topicKey: 'pair_of_linear_equations',
    summary: 'Covers Pair of Linear Equations in Two Variables using graph, substitution, elimination and cross‑multiplication methods plus word problems. Perfect for mastering standard 3–4 mark questions with clean setup and solutions.',
    emoji: '📉',
  },
  quadratic_equations: {
    topicKey: 'quadratic_equations',
    summary: 'Drills Quadratic Equations via discriminant, nature of roots, factorisation, quadratic formula and applied problems. Practise a mix of 2–4 mark questions to choose the right method fast.',
    emoji: '🧮',
  },
  arithmetic_progressions: {
    topicKey: 'arithmetic_progressions',
    summary: 'Revises Arithmetic Progressions with nth term, sum of n terms and application problems. A tight set of 2–4 mark questions to model word problems quickly using AP formulas.',
    emoji: '📈',
  },
  triangles: {
    topicKey: 'triangles',
    summary: 'Questions on similarity criteria, basic proportionality theorem, area relations and simple proofs. Ideal for strengthening geometry reasoning in 2–4 mark questions where step‑wise presentation matters.',
    emoji: '📐',
  },
  coordinate_geometry: {
    topicKey: 'coordinate_geometry',
    summary: 'Focuses on Coordinate Geometry: distance formula, section formula, area of triangle and mid‑point ideas. Great for quick numerical practice and diagram‑based questions that boards frequently ask.',
    emoji: '🧭',
  },
  introduction_to_trigonometry: {
    topicKey: 'introduction_to_trigonometry',
    summary: 'Revises Introduction to Trigonometry with basic ratios, standard angles, identities and simple value‑finding. Gives comfortable practice for core 2–3 mark questions that unlock almost the whole chapter.',
    emoji: '📊',
  },
  applications_of_trigonometry: {
    topicKey: 'applications_of_trigonometry',
    summary: 'Drills Applications of Trigonometry through height‑and‑distance word problems using angles of elevation and depression. Expect 3–4 mark questions training you to convert story problems into neat right‑triangle diagrams.',
    emoji: '⛰️',
  },
  circles: {
    topicKey: 'circles',
    summary: 'Works through Circles with questions on tangents, secants, chord properties and standard theorems used in proofs. Perfect for building confidence in 2–4 mark reasoning questions that demand clear diagrams and justifications.',
    emoji: '⚪',
  },
  constructions: {
    topicKey: 'constructions',
    summary: 'Targets Constructions: dividing a line segment, constructing triangles under given conditions and similar triangle constructions. Helps memorise clean step sequences for 3–4 mark questions.',
    emoji: '✂️',
  },
  areas_related_to_circles: {
    topicKey: 'areas_related_to_circles',
    summary: 'Practises Areas Related to Circles with problems on sectors, segments and combinations of circles with squares/rectangles/triangles. Familiarises you with πr² calculations in composite figure questions.',
    emoji: '🎯',
  },
  surface_areas_volumes: {
    topicKey: 'surface_areas_volumes',
    summary: 'Revises Surface Areas and Volumes of cubes, cuboids, cylinders, cones, spheres and frustums. Great for mixed 2–4 mark numericals requiring the right formulas and careful unit handling.',
    emoji: '📦',
  },
  statistics: {
    topicKey: 'statistics',
    summary: 'Works through Statistics using questions on mean, median, mode and simple cumulative frequency tables. Ideal for mastering calculation‑heavy yet predictable 2–3 mark questions.',
    emoji: '📊',
  },
  probability: {
    topicKey: 'probability',
    summary: 'Focuses on basic Probability with theoretical probability of single events, complementary events and simple word problems. Turns an easy chapter into guaranteed marks via quick practice.',
    emoji: '🎲',
  },
};

export default practicePackSummaries;