import type { MentorDiagramSpec } from "../types/mentor";
import { DiagramRenderer } from "./diagrams/DiagramRenderer";

type DiagramLabels = Record<string, string>;

type Props = {
  diagramType?: string | null;
  diagramLabels?: DiagramLabels | string[] | null;
  diagramSpec?: MentorDiagramSpec | null;
  title?: string;
  note?: string;
};

const DEFAULT_LABELS: DiagramLabels = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  E: "E",
  P: "P",
  Q: "Q",
  R: "R",
};

function normalizeDiagramType(raw?: string | null) {
  const t = String(raw || "").trim().toUpperCase();
  return t || "TRIANGLE_GENERIC";
}

function normalizeLabels(raw: Props["diagramLabels"]): DiagramLabels {
  if (!raw) return DEFAULT_LABELS;
  if (Array.isArray(raw)) {
    const out: DiagramLabels = {};
    raw.forEach((label, idx) => {
      const clean = String(label || "").trim();
      if (!clean) return;
      out[clean] = clean;
      if (idx === raw.length - 1 && Object.keys(out).length) return;
    });
    return Object.keys(out).length ? out : DEFAULT_LABELS;
  }
  if (typeof raw === "object") {
    const out: DiagramLabels = {};
    Object.entries(raw).forEach(([k, v]) => {
      const key = String(k || "").trim();
      const val = String(v || "").trim();
      if (!key) return;
      out[key] = val || key;
    });
    return Object.keys(out).length ? out : DEFAULT_LABELS;
  }
  return DEFAULT_LABELS;
}

function getLabel(labels: DiagramLabels, key: string) {
  return labels[key] || key;
}

function TriangleGeneric({ labels }: { labels: DiagramLabels }) {
  return (
    <svg viewBox="0 0 200 120" width="100%" height="auto" role="img" aria-label="Triangle diagram">
      <polygon points="30,95 170,95 105,20" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="22" y="105" fontSize="10">{getLabel(labels, "A")}</text>
      <text x="172" y="105" fontSize="10">{getLabel(labels, "B")}</text>
      <text x="105" y="15" fontSize="10">{getLabel(labels, "C")}</text>
    </svg>
  );
}

function SimilarityDiagram({ labels }: { labels: DiagramLabels }) {
  return (
    <svg viewBox="0 0 260 120" width="100%" height="auto" role="img" aria-label="Similarity diagram">
      <polygon points="20,95 110,95 70,25" fill="none" stroke="currentColor" strokeWidth="2" />
      <polygon points="150,95 240,95 200,35" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="12" y="105" fontSize="10">{getLabel(labels, "A")}</text>
      <text x="112" y="105" fontSize="10">{getLabel(labels, "B")}</text>
      <text x="70" y="18" fontSize="10">{getLabel(labels, "C")}</text>
      <text x="142" y="105" fontSize="10">{getLabel(labels, "P")}</text>
      <text x="242" y="105" fontSize="10">{getLabel(labels, "Q")}</text>
      <text x="200" y="28" fontSize="10">{getLabel(labels, "R")}</text>
    </svg>
  );
}

function BptDiagram({ labels }: { labels: DiagramLabels }) {
  return (
    <svg viewBox="0 0 200 120" width="100%" height="auto" role="img" aria-label="BPT diagram">
      <polygon points="30,95 170,95 105,20" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="65" y1="70" x2="135" y2="70" stroke="currentColor" strokeWidth="2" />
      <text x="22" y="105" fontSize="10">{getLabel(labels, "A")}</text>
      <text x="172" y="105" fontSize="10">{getLabel(labels, "B")}</text>
      <text x="105" y="15" fontSize="10">{getLabel(labels, "C")}</text>
      <text x="58" y="68" fontSize="10">{getLabel(labels, "D")}</text>
      <text x="138" y="68" fontSize="10">{getLabel(labels, "E")}</text>
    </svg>
  );
}

function PythagorasDiagram({ labels }: { labels: DiagramLabels }) {
  return (
    <svg viewBox="0 0 200 120" width="100%" height="auto" role="img" aria-label="Right triangle diagram">
      <polygon points="30,95 170,95 30,25" fill="none" stroke="currentColor" strokeWidth="2" />
      <polyline points="30,95 45,95 45,80" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="22" y="105" fontSize="10">{getLabel(labels, "A")}</text>
      <text x="172" y="105" fontSize="10">{getLabel(labels, "B")}</text>
      <text x="22" y="20" fontSize="10">{getLabel(labels, "C")}</text>
    </svg>
  );
}

export function DiagramBlock({
  diagramType,
  diagramLabels,
  diagramSpec,
  title = "Diagram",
  note,
}: Props) {
  const type = normalizeDiagramType(diagramType);
  const labels = normalizeLabels(diagramLabels);

  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.12)",
        padding: 10,
        background: "rgba(255,255,255,0.75)",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>{title}</div>
      {diagramSpec ? (
        <DiagramRenderer diagramSpec={diagramSpec} />
      ) : type === "BPT" ? (
        <BptDiagram labels={labels} />
      ) : type === "PYTHAGORAS" ? (
        <PythagorasDiagram labels={labels} />
      ) : type.startsWith("SIMILARITY") ? (
        <SimilarityDiagram labels={labels} />
      ) : (
        <TriangleGeneric labels={labels} />
      )}
      <div style={{ marginTop: 6, fontSize: 11, opacity: 0.7 }}>
        {note || `Type: ${type}`}
      </div>
    </div>
  );
}
