// src/data/class10ScienceTopicTrends.ts

// Reuse the same difficulty + tier types as Maths
import type {
  DifficultyKey,
  TopicTier,
} from "./class10MathTopicTrends";

export const class10ScienceTopicTrends = {
  subject: "Science",
  grade: "10",

  difficultyDistributionPercent: {
    Easy: 40,
    Medium: 40,
    Hard: 20,
  } as Record<DifficultyKey, number>,

  // Same 80-mark style blueprint (you can tweak later for Science)
  marksAllocation: {
    "Section A (MCQ/Assertion, 1 mark)": 20,
    "Section B (Short Answer, 2 marks)": 10,
    "Section C (Short Answer, 3 marks)": 18,
    "Section D (Long Answer, 5 marks)": 20,
    "Section E (Case-Based, 4 marks)": 12,
  } as Record<string, number>,

  topics: {
    "Chemical Reactions & Equations": {
      weightagePercent: 8,
      tier: "must-crack" as TopicTier,
      stream: "Chemistry" as const,
      summary:
        "Always 1–2 questions. Focus on balanced equations, types of reactions, and practical reasoning around observations.",
      conceptWeightage: {
        "Balancing Equations": 35,
        "Types of Reactions": 35,
        "Oxidation/Reduction": 20,
        "Corrosion/Rancidity": 10,
      },
    },

    "Acids, Bases & Salts": {
      weightagePercent: 7,
      tier: "high-roi" as TopicTier,
      stream: "Chemistry" as const,
      summary:
        "High scoring if charts and common reactions are memorised: indicators, pH, and important salts like baking soda/washing soda.",
      conceptWeightage: {
        "Indicators & pH": 35,
        "Reactions with Metals & Bases": 30,
        "Salts & Their Uses": 25,
        "Strong vs Weak": 10,
      },
    },

    "Metals & Non-metals": {
      weightagePercent: 6,
      tier: "high-roi" as TopicTier,
      stream: "Chemistry" as const,
      summary:
        "Standard questions on physical/chemical properties, reactivity series, and corrosion prevention.",
      conceptWeightage: {
        "Physical & Chemical Properties": 35,
        "Reactivity Series": 30,
        "Ores & Extraction": 20,
        "Corrosion Prevention": 15,
      },
    },

    "Carbon & its Compounds": {
      weightagePercent: 8,
      tier: "must-crack" as TopicTier,
      stream: "Chemistry" as const,
      summary:
        "Very favourite: covalent bonding, homologous series, nomenclature, and important reactions of alkanes/alkenes/alcohols.",
      conceptWeightage: {
        "Covalent Bonding": 30,
        "Homologous Series": 30,
        "Nomenclature": 25,
        "Important Reactions": 15,
      },
    },

    "Life Processes": {
      weightagePercent: 10,
      tier: "must-crack" as TopicTier,
      stream: "Biology" as const,
      summary:
        "Top-weight chapter from Bio: nutrition, respiration, circulation, excretion, often appears as case-based + diagrams.",
      conceptWeightage: {
        "Nutrition": 25,
        "Respiration": 25,
        "Circulation": 25,
        "Excretion": 25,
      },
    },

    "How do Organisms Reproduce?": {
      weightagePercent: 7,
      tier: "high-roi" as TopicTier,
      stream: "Biology" as const,
      summary:
        "Modes of reproduction + diagrams and small reasoning questions. Frequently used in assertion/reason items.",
      conceptWeightage: {
        "Asexual Reproduction": 35,
        "Sexual Reproduction in Plants": 30,
        "Human Reproductive System": 25,
        "Contraception/STD Awareness": 10,
      },
    },

    "Light – Reflection & Refraction": {
      weightagePercent: 9,
      tier: "must-crack" as TopicTier,
      stream: "Physics" as const,
      summary:
        "Ray diagrams, mirror/lens formula, sign convention, and numerical problems. Very board-ish and scoring.",
      conceptWeightage: {
        "Mirror Formula & Diagrams": 35,
        "Lens Formula & Diagrams": 35,
        "Sign Convention": 20,
        "Magnification": 10,
      },
    },

    "Human Eye & Colourful World": {
      weightagePercent: 6,
      tier: "high-roi" as TopicTier,
      stream: "Physics" as const,
      summary:
        "Conceptual: defects of vision, corrections, dispersion/scattering, rainbow and blue/red sky questions.",
      conceptWeightage: {
        "Structure of Eye": 25,
        "Defects & Correction": 35,
        "Dispersion & Scattering": 40,
      },
    },

    Electricity: {
      weightagePercent: 9,
      tier: "must-crack" as TopicTier,
      stream: "Physics" as const,
      summary:
        "Numericals + conceptual: Ohm's law, series/parallel, power, and heating effect. Must-crack + high formula density.",
      conceptWeightage: {
        "Ohm’s Law & V–I Graph": 30,
        "Resistance in Series/Parallel": 30,
        "Electric Power": 25,
        "Heating Effect": 15,
      },
    },

    "Magnetic Effects of Electric Current": {
      weightagePercent: 6,
      tier: "high-roi" as TopicTier,
      stream: "Physics" as const,
      summary:
        "Field lines, Fleming’s rules, and everyday applications (motors, generators). Often in assertion/case-study.",
      conceptWeightage: {
        "Field Lines & Rules": 40,
        "Electromagnet & Solenoid": 30,
        "Electric Motor/Generator": 30,
      },
    },
  },
} as const;

export type Class10ScienceTopicTrendsData = typeof class10ScienceTopicTrends;
export type Class10ScienceTopicKey =
  keyof Class10ScienceTopicTrendsData["topics"];

export interface ScienceTopicTrendEntry {
  topicKey: Class10ScienceTopicKey;
  weightagePercent: number;
  tier?: TopicTier;
  summary?: string;
  conceptWeightage: Record<string, number>;
  stream?: "Physics" | "Chemistry" | "Biology";
}

export const class10ScienceTopicTrendList: ScienceTopicTrendEntry[] =
  Object.entries(class10ScienceTopicTrends.topics).map(([key, value]) => ({
    topicKey: key as Class10ScienceTopicKey,
    weightagePercent: value.weightagePercent,
    tier: (value as any).tier,
    summary: (value as any).summary,
    conceptWeightage: value.conceptWeightage,
    stream: (value as any).stream,
  }));
