import type { DiagramSpec } from "./diagramTypes";

type DiagramTemplateInput = {
  topicKey?: string | null;
  nodeId?: string | null;
  stepSlugOrTitle?: string | null;
};

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function cloneSpec(spec: DiagramSpec): DiagramSpec {
  return JSON.parse(JSON.stringify(spec)) as DiagramSpec;
}

const AA_SIMILARITY_VARIANTS: DiagramSpec[] = [
  {
    kind: "tutor_diagram_v1",
    width: 420,
    height: 220,
    title: "AA Similarity",
    caption: "Two pairs of equal angles imply similarity.",
    points: [
      { id: "A", x: 60, y: 170, label: "A" },
      { id: "B", x: 170, y: 170, label: "B" },
      { id: "C", x: 110, y: 50, label: "C" },
      { id: "P", x: 250, y: 170, label: "P" },
      { id: "Q", x: 360, y: 170, label: "Q" },
      { id: "R", x: 310, y: 70, label: "R" },
    ],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "A" },
      { from: "P", to: "Q" },
      { from: "Q", to: "R" },
      { from: "R", to: "P" },
    ],
    angleMarks: [
      { at: "A", from: "B", to: "C", radius: 16, highlight: true },
      { at: "P", from: "Q", to: "R", radius: 16, highlight: true },
      { at: "B", from: "A", to: "C", radius: 20, double: true, highlight: true },
      { at: "Q", from: "P", to: "R", radius: 20, double: true, highlight: true },
    ],
  },
  {
    kind: "tutor_diagram_v1",
    width: 420,
    height: 220,
    title: "AA Similarity",
    caption: "Match equal angles to set correspondence.",
    points: [
      { id: "A", x: 70, y: 175, label: "A" },
      { id: "B", x: 190, y: 165, label: "B" },
      { id: "C", x: 120, y: 45, label: "C" },
      { id: "P", x: 245, y: 155, label: "P" },
      { id: "Q", x: 355, y: 185, label: "Q" },
      { id: "R", x: 320, y: 70, label: "R" },
    ],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "A" },
      { from: "P", to: "Q" },
      { from: "Q", to: "R" },
      { from: "R", to: "P" },
    ],
    angleMarks: [
      { at: "A", from: "B", to: "C", radius: 14, highlight: true },
      { at: "P", from: "Q", to: "R", radius: 14, highlight: true },
      { at: "B", from: "A", to: "C", radius: 18, double: true, highlight: true },
      { at: "Q", from: "P", to: "R", radius: 18, double: true, highlight: true },
    ],
  },
  {
    kind: "tutor_diagram_v1",
    width: 420,
    height: 220,
    title: "AA Similarity",
    caption: "Use parallel lines or angle facts to show equality.",
    points: [
      { id: "A", x: 65, y: 165, label: "A" },
      { id: "B", x: 180, y: 180, label: "B" },
      { id: "C", x: 100, y: 55, label: "C" },
      { id: "P", x: 255, y: 175, label: "P" },
      { id: "Q", x: 360, y: 165, label: "Q" },
      { id: "R", x: 300, y: 75, label: "R" },
    ],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "A" },
      { from: "P", to: "Q" },
      { from: "Q", to: "R" },
      { from: "R", to: "P" },
    ],
    angleMarks: [
      { at: "A", from: "B", to: "C", radius: 16, highlight: true },
      { at: "P", from: "Q", to: "R", radius: 16, highlight: true },
      { at: "B", from: "A", to: "C", radius: 20, double: true, highlight: true },
      { at: "Q", from: "P", to: "R", radius: 20, double: true, highlight: true },
    ],
  },
];

const GENERIC_SIMILARITY: DiagramSpec = {
  kind: "tutor_diagram_v1",
  width: 420,
  height: 220,
  title: "Similarity",
  caption: "Two triangles with corresponding angles and sides.",
  points: [
    { id: "A", x: 60, y: 170, label: "A" },
    { id: "B", x: 170, y: 170, label: "B" },
    { id: "C", x: 120, y: 55, label: "C" },
    { id: "P", x: 245, y: 170, label: "P" },
    { id: "Q", x: 355, y: 170, label: "Q" },
    { id: "R", x: 300, y: 70, label: "R" },
  ],
  edges: [
    { from: "A", to: "B" },
    { from: "B", to: "C" },
    { from: "C", to: "A" },
    { from: "P", to: "Q" },
    { from: "Q", to: "R" },
    { from: "R", to: "P" },
  ],
};

const GENERIC_TRIANGLE: DiagramSpec = {
  kind: "tutor_diagram_v1",
  width: 360,
  height: 220,
  title: "Triangle",
  caption: "Label the vertices clearly.",
  points: [
    { id: "A", x: 70, y: 170, label: "A" },
    { id: "B", x: 250, y: 170, label: "B" },
    { id: "C", x: 160, y: 55, label: "C" },
  ],
  edges: [
    { from: "A", to: "B" },
    { from: "B", to: "C" },
    { from: "C", to: "A" },
  ],
};

function pickAaVariant(seed: string): DiagramSpec {
  const idx = hashSeed(seed) % AA_SIMILARITY_VARIANTS.length;
  return cloneSpec(AA_SIMILARITY_VARIANTS[idx]);
}

function isAaSimilaritySeed(seed: string, nodeId?: string | null) {
  const lower = seed.toLowerCase();
  if (nodeId && nodeId.toLowerCase().includes("aa")) return true;
  if (/\baa\b/.test(lower) && lower.includes("similar")) return true;
  if (lower.includes("aa similarity")) return true;
  return false;
}

function normalizeSeed(input: DiagramTemplateInput) {
  return [input.topicKey, input.nodeId, input.stepSlugOrTitle].filter(Boolean).join("|");
}

export function getDiagramTemplate(
  topicKey?: string | null,
  nodeId?: string | null,
  stepSlugOrTitle?: string | null
): DiagramSpec {
  const seed = normalizeSeed({ topicKey, nodeId, stepSlugOrTitle });
  const lower = seed.toLowerCase();
  const isTriangles = lower.includes("triangle");
  if (isAaSimilaritySeed(lower, nodeId)) return pickAaVariant(seed);
  if (isTriangles && lower.includes("similar")) return pickAaVariant(seed);
  if (isTriangles) return cloneSpec(GENERIC_SIMILARITY);
  return cloneSpec(GENERIC_TRIANGLE);
}

export function isDiagramTemplateSpec(value: unknown): value is DiagramSpec {
  if (!value || typeof value !== "object") return false;
  const v = value as DiagramSpec;
  return v.kind === "tutor_diagram_v1" && Array.isArray(v.points) && Array.isArray(v.edges);
}
