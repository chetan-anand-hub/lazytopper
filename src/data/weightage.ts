// src/data/weightage.ts

export type ClassKey = "10" | "12";
export type SubjectKey = "math" | "physics";

export interface Topic {
  id: string;
  name: string;
  weightMarks: number; // approximate marks in board paper
  subtopics: string[]; // finer breakdown for notes/flashcards
  note?: string;
}

const t = (
  id: string,
  name: string,
  marks: number,
  subtopics: string[],
  note?: string
): Topic => ({
  id,
  name,
  weightMarks: marks,
  subtopics,
  note,
});

// ----------------------
// Class 10 – Mathematics
// Based directly on your JSON
// ----------------------
const class10MathTopics: Topic[] = [
  t("real-numbers", "Real Numbers", 6, [
    "Euclid’s Lemma",
    "Prime Factorization",
    "Irrational Numbers",
    "HCF/LCM",
  ]),
  t("polynomials", "Polynomials", 5, [
    "Zeroes",
    "Coefficient Relations",
    "Quadratic Polynomial Graphs",
  ]),
  t("linear-equations", "Linear Equations", 9, [
    "Graphical Solution",
    "Elimination/Substitution",
    "Word Problems",
  ]),
  t("quadratic-equations", "Quadratic Equations", 6, [
    "Factoring",
    "Quadratic Formula",
    "Nature of Roots",
    "Applications",
  ]),
  t("ap", "Arithmetic Progression", 5, [
    "nth Term",
    "Sum of Series",
    "Applications",
  ]),
  t("triangles", "Triangles", 8, [
    "Similarity",
    "Congruence",
    "BPT",
    "Area Ratio",
    "Pythagoras",
  ]),
  t("coordinate-geometry", "Coordinate Geometry", 6, [
    "Distance Formula",
    "Section Formula",
    "Area of Triangle",
  ]),
  t("trigonometry", "Trigonometry", 6, [
    "Ratios",
    "Identities",
    "Standard Values",
    "Heights & Distances",
  ]),
  t("circles", "Circles", 4, ["Tangents", "Theorems", "Constructions"]),
  t("constructions", "Constructions", 4, [
    "Division of Line",
    "Triangle/Angle",
    "Tangents",
  ]),
  t("areas-circles", "Areas Related to Circles", 4, [
    "Sector",
    "Segment",
    "Perimeter/Area",
  ]),
  t("surface-volumes", "Surface Areas & Volumes", 6, [
    "Cube",
    "Cuboid",
    "Cylinder",
    "Sphere",
    "Frustum",
    "Conversions",
  ]),
  t("statistics", "Statistics", 6, [
    "Mean",
    "Median",
    "Mode",
    "Ogives",
    "Graph Drawing",
  ]),
  t("probability", "Probability", 5, [
    "Classical Probability",
    "Simple Calculations",
  ]),
];

// ----------------------
// Class 10 – Physics (kept as earlier placeholder)
// ----------------------
const class10PhysicsTopics: Topic[] = [
  t(
    "light",
    "Light – Reflection and Refraction",
    10,
    ["Reflection", "Refraction", "Image Formation", "Lens Formula"],
    "Big scoring chapter, very visual."
  ),
  t(
    "human-eye",
    "The Human Eye and the Colourful World",
    2,
    ["Defects of Vision", "Atmospheric Refraction"]
  ),
  t("electricity", "Electricity", 7, [
    "Ohm’s Law",
    "Series/Parallel",
    "Power",
    "Heating Effect",
  ]),
  t(
    "magnetic-effects",
    "Magnetic Effects of Electric Current",
    6,
    ["Magnetic Field", "Right Hand Thumb Rule", "Fleming’s Rule"],
    "Physics-heavy but conceptual."
  ),
];

// ----------------------
// Class 12 – placeholders (we’ll refine later)
// ----------------------
const class12MathTopics: Topic[] = [
  t("relations-functions", "Relations and Functions", 8, [
    "Types of Relations",
    "Domain/Range",
  ]),
  t("algebra", "Algebra (Matrices & Determinants)", 10, [
    "Matrix Operations",
    "Determinants",
    "Cramer’s Rule",
  ]),
  t("calculus", "Calculus (Limits to Applications)", 35, [
    "Limits",
    "Continuity",
    "Differentiation",
    "Applications of Derivatives",
    "Integration",
  ]),
  t("vectors-3d", "Vectors & 3D Geometry", 14, [
    "Vector Basics",
    "Direction Cosines",
    "Lines and Planes",
  ]),
  t("lpp", "Linear Programming", 5, ["Feasible Region", "Maxima/Minima"]),
  t("probability-12", "Probability", 8, [
    "Conditional Probability",
    "Bayes’ Theorem",
  ]),
];

const class12PhysicsTopics: Topic[] = []; // to be filled later

// ----------------------
// Exported map
// ----------------------
export const topicWeightage: Record<ClassKey, Record<SubjectKey, Topic[]>> = {
  "10": {
    math: class10MathTopics,
    physics: class10PhysicsTopics,
  },
  "12": {
    math: class12MathTopics,
    physics: class12PhysicsTopics,
  },
};
