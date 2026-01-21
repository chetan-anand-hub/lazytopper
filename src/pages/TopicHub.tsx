// src/pages/TopicHub.tsx
// TopicHub (MAIN-safe):
// - Works for BOTH /topic-hub/:grade/:subject and /topic-hub/:grade/:subject/:topicKey
// - If topicKey is missing -> redirects to a sane default (never blank)
// - Renders baked TopicHubV2 content (base + enrichment)
// - Implements the locked UI direction: sticky action bar + progressive disclosure (accordions)

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { getTopicV2Content, normalizeTopicKey } from "../utils/topicHubV2Store";
import { topicHubV2Content } from "../data/topicHubV2Full";
import type { TopicHubV2Content, V2Definition, V2Example, Misconception, Competency, LabActivity, CaseStudy } from "../utils/getTopicV2Content";
import { PredictionCore } from "../data/predictionCore";
import { generatePracticeSet } from "../data/practiceSetGenerator";
import { useVibeMode } from "../context/vibeModeContext";
import { trianglesGuidedMindmap } from "../data/trianglesGuidedMindmap";
import { trianglesGrindMindmap } from "../data/trianglesGrindMindmap";
import { DiagramBlock } from "../components/DiagramBlock";
import { MENTOR_ENDPOINT } from "../ai/aiClient";

type SubjectKey = "maths" | "science";
type ModeKey = "zombie" | "beast";
type RequestedMentorMode = "explain" | "board_steps" | "solve_with_me" | "learn_mindmap";
type ExplainType = "misconception" | "competency" | "mindmap_node" | "general";

type MentorChatMsg = { role: "user" | "assistant"; content: string };
type TutorTab = "teach" | "examples";

function safeArray<T = any>(x: any): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

function defaultTopicKeyFor(subject: SubjectKey) {
  return subject === "science" ? "electricity" : "triangles";
}

function toTierLabel(tier: string) {
  const t = String(tier || "").toLowerCase();
  if (t.includes("must")) return "must-crack";
  if (t.includes("high")) return "high-roi";
  if (t.includes("good")) return "good-to-do";
  return t || "topic";
}

function tierColor(tier: string) {
  const t = toTierLabel(tier);
  if (t === "must-crack") return "rgba(255, 107, 107, 0.18)";
  if (t === "high-roi") return "rgba(255, 193, 7, 0.18)";
  return "rgba(46, 213, 115, 0.18)";
}

function tierBorderColor(tier: string) {
  const t = toTierLabel(tier);
  if (t === "must-crack") return "rgba(255, 107, 107, 0.38)";
  if (t === "high-roi") return "rgba(255, 193, 7, 0.38)";
  return "rgba(46, 213, 115, 0.38)";
}



type TopicOption = { key: string; name: string; tier: string };

function buildTopicOptions(subject: SubjectKey): TopicOption[] {
  const out: TopicOption[] = [];
  for (const k of Object.keys(topicHubV2Content || {})) {
    const rec = (topicHubV2Content as any)[k] as Partial<TopicHubV2Content> | undefined;
    if (!rec) continue;
    const s = String(rec.subject || "").toLowerCase();
    const isMatch = subject === "maths" ? s.includes("math") : s.includes("science");
    if (!isMatch) continue;
    out.push({
      key: String(rec.topicKey || k),
      name: String(rec.topicName || k),
      tier: String(rec.tier || ""),
    });
  }
  // stable sort: must-crack first, then high-roi, then good-to-do; name as tiebreaker
  const score = (tier: string) => {
    const t = toTierLabel(tier);
    if (t === "must-crack") return 0;
    if (t === "high-roi") return 1;
    return 2;
  };
  out.sort((a, b) => {
    const d = score(a.tier) - score(b.tier);
    if (d !== 0) return d;
    return a.name.localeCompare(b.name);
  });
  return out;
}

function asSubjectKey(raw: string): SubjectKey {
  const v = String(raw || "").toLowerCase();
  return v === "science" ? "science" : "maths";
}

type TutorConceptCard = { means: string; when: string[]; exam: string; trap: string };

function toTutorConceptCard(x: unknown): TutorConceptCard | null {
  if (!x || typeof x !== "object") return null;
  const obj = x as Record<string, unknown>;
  const means = typeof obj.means === "string" ? obj.means : null;
  const exam = typeof obj.exam === "string" ? obj.exam : null;
  const trap = typeof obj.trap === "string" ? obj.trap : null;
  const whenRaw = obj.when;
  const when =
    Array.isArray(whenRaw) && whenRaw.every((v) => typeof v === "string")
      ? (whenRaw as string[])
      : null;

  if (!means || !exam || !trap || !when) return null;
  return { means, when, exam, trap };
}

function toNullableString(x: unknown): string | null {
  return typeof x === "string" ? x : null;
}


export default function TopicHub() {
  const params = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const grade = String(params.grade || sp.get("grade") || "10");
  const subject = asSubjectKey(String(params.subject || sp.get("subject") || "maths"));
  const subjectTitle = subject === "science" ? "Science" : "Maths";
  const subjectRoute = String(params.subject || subjectTitle);

  // Support both route param and legacy query params.
  const rawTopicKey =
    (params as any).topicKey ||
    sp.get("topicKey") ||
    sp.get("topic") ||
    sp.get("k") ||
    "";

  const topicKey = normalizeTopicKey(rawTopicKey) || defaultTopicKeyFor(subject);

  // Never-blank rule: if they hit /topic-hub/10/maths (no topicKey), redirect.
  useEffect(() => {
    const hasRouteTopicKey = Boolean((params as any).topicKey);
    if (!hasRouteTopicKey) {
      const target = `/topic-hub/${grade}/${subject}/${topicKey}`;
      if (window.location.pathname !== target) navigate(target, { replace: true });
    }
  }, [grade, subject, topicKey, navigate, params]);

  const v2 = useMemo(() => getTopicV2Content(topicKey), [topicKey]);

  // Derived display title for this TopicHub page (must be declared before hooks that depend on it).
  const title = String(v2?.topicName || topicKey || '').trim() || 'Topic';

  // Use the global vibe mode (Beast/Zombie) as the single source of truth.
  // This avoids duplicate toggles inside TopicHub and keeps behavior consistent across the app.
  const { mode: globalVibeMode } = useVibeMode();
  const mode = (globalVibeMode as unknown) as ModeKey;

  // TopicHub has exactly 3 top-level tabs: Learn / Grind / Resources.
  type TopicTabKey = 'learn' | 'grind' | 'resources';
  const [activeTab, setActiveTab] = useState<TopicTabKey>(() => {
    const t = String(sp.get('tab') || '').toLowerCase();
    if (t === 'grind') return 'grind';
    if (t === 'resources' || t === 'res') return 'resources';
    return 'learn';
  });
// --- Worked Example Mentor Drawer ---
  const [mentorDrawerOpen, setMentorDrawerOpen] = useState(false);
  const [mentorSeedExample, setMentorSeedExample] = useState<{
    title: string;
    question: string;
    marks?: number;
    section?: string;
    subSection?: string;
    anchor?: string;
    contextText?: string;
    requestedMode?: RequestedMentorMode;
    explainType?: ExplainType;
    itemId?: string;
    itemTitle?: string;
    itemText?: string;
    theoremFocus?: string[];
    mindmapNodeId?: string;
    mindmapNodeTitle?: string;
    mindmapCoreId?: string;
    mindmapNodeText?: string;
  } | null>(null);
  const [mentorSolveStyle, setMentorSolveStyle] = useState<"socratic" | "board">("socratic");
  const [tutorDrawerOpen, setTutorDrawerOpen] = useState(false);
  const [grindDrawerOpen, setGrindDrawerOpen] = useState(false);
  const [grindNodeId, setGrindNodeId] = useState<string>("" );
  const [tutorTab, setTutorTab] = useState<TutorTab>("teach");
  const [tutorNodeIndex, setTutorNodeIndex] = useState(0);

  const closeMentorDrawer = () => {
    setMentorDrawerOpen(false);
  };

  // NOTE: Do not persist a separate per-page mode; the VibeProvider already persists globally.

  const topicOptions = useMemo(() => buildTopicOptions(subject), [subject]);

  const onChangeTopic = useCallback(
    (nextKey: string) => {
      const k = normalizeTopicKey(nextKey);
      if (!k) return;
      navigate(`/topic-hub/${grade}/${subject}/${k}`);
    },
    [navigate, grade, subject]
  );
  const openMentorDrawer = useCallback(
    (opts: {
      title: string;
      question: string;
      solveStyle?: 'socratic' | 'board';
      marks?: number;
      section?: string;
      anchor?: string;
      contextText?: string;
      subSection?: string;
      requestedMode?: RequestedMentorMode;
      explainType?: ExplainType;
      itemId?: string;
      itemTitle?: string;
      itemText?: string;
      theoremFocus?: string[];
      mindmapNodeId?: string;
      mindmapNodeTitle?: string;
      mindmapCoreId?: string;
      mindmapNodeText?: string;
    }) => {
      setMentorSeedExample({
        title: opts.title || title || 'Ask Mentor',
        question: opts.question,
        marks: typeof opts.marks === 'number' ? opts.marks : undefined,
        section: opts.section,
        subSection: opts.subSection,
        anchor: opts.anchor,
        contextText: opts.contextText,
        requestedMode: opts.requestedMode,
        explainType: opts.explainType,
        itemId: opts.itemId,
        itemTitle: opts.itemTitle,
        itemText: opts.itemText,
        theoremFocus: opts.theoremFocus,
        mindmapNodeId: opts.mindmapNodeId,
        mindmapNodeTitle: opts.mindmapNodeTitle,
        mindmapCoreId: opts.mindmapCoreId,
        mindmapNodeText: opts.mindmapNodeText,
      });
      setMentorSolveStyle(opts.solveStyle || 'socratic');
      setMentorDrawerOpen(true);
    },
    [title]
  );


if (!v2) {
    return (
      <div className="page" style={{
      background:
        mode === "beast"
          ? "linear-gradient(180deg, #f5f8ff 0%, #eef2ff 50%, #f7f7ff 100%)"
          : "linear-gradient(180deg, #f7fff7 0%, #eefcf2 55%, #f8fffd 100%)",
    }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px" }}>
          <div style={{ opacity: 0.7, marginBottom: 10 }}>
            Class {grade} Ã¢â‚¬Â¢ {subject.toUpperCase()}
          </div>

          <h1 style={{ fontSize: 44, margin: "8px 0 8px" }}>{topicKey}</h1>

          <div
            style={{
              border: "1px solid rgba(255,0,0,0.25)",
              background: "rgba(255,0,0,0.04)",
              padding: 14,
              borderRadius: 12,
              marginTop: 16,
            }}
          >
            <b>TopicHub content not found.</b>
            <div style={{ marginTop: 6, opacity: 0.85 }}>
              No baked TopicHubV2 entry exists for <code>{topicKey}</code>.
            </div>
            <div style={{ marginTop: 10 }}>
              Try:{" "}
              <Link to={`/topic-hub/${grade}/${subject}/${defaultTopicKeyFor(subject)}`}>
                /topic-hub/{grade}/{subject}/{defaultTopicKeyFor(subject)}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tier = toTierLabel(String((v2 as any).tier || ""));
  const overview = safeArray<string>((v2 as any).overview);
  const examPatterns = safeArray<string>((v2 as any).examPatterns);

  const definitions = safeArray<V2Definition>((v2 as any).definitions);
  const markingTips = safeArray<string>((v2 as any).markingTips);
  const scoreTips = safeArray<string>((v2 as any).scoreTips);
// Board-pattern anchors (AÃ¢â‚¬â€œE) pulled from the canonical question bank for this topic.
const [exampleSection, setExampleSection] = useState<"A" | "B" | "C" | "D" | "E">("A");

const exampleAnchors = useMemo(() => {
  const all = PredictionCore.getLikelyQuestionsForConcept(topicKey);
  const pick = (section: "A" | "B" | "C" | "D" | "E", marks: number) => {
    const bySection = all.find((q: any) => String(q.section || "") === section && Number(q.marks) === marks);
    if (bySection) return bySection;
    const byMarks = all.find((q: any) => Number(q.marks) === marks);
    return byMarks || null;
  };

  return {
    A: pick("A", 1),
    B: pick("B", 2),
    C: pick("C", 3),
    D: pick("D", 4),
    E: pick("E", 5),
  } as Record<"A" | "B" | "C" | "D" | "E", any>;
}, [topicKey]);
const isDiagramTopic = useMemo(() => {
  const t = `${String(title || "")} ${String(topicKey || "")}`.toLowerCase();
  return /triangle|triangles|similar|similarity|circle|construction|quadrilateral|geometry|diagram|fig\.?/i.test(t);
}, [title, topicKey]);

const isTrianglesTopic = useMemo(() => /triangles/i.test(String(title || "")), [title]);

const proofWritingTemplates = useMemo(() => {
  if (!isTrianglesTopic) return [];
  return [
    {
      id: "similarity",
      title: "Similarity proof (AA / SAS / SSS)",
      focus: "similarity",
      marks: 3,
      description:
        "Use angle equalities or side ratios to prove two triangles are similar, then apply CPST.",
      question:
        `Class ${grade} ${subjectTitle} - Triangles\n` +
        `Write a full proof with Given / To Prove / Construction (if needed) / Proof / Conclusion.\n` +
        `In triangle ABC and triangle PQR, angle A = angle P and angle B = angle Q.\n` +
        `Prove triangle ABC ~ triangle PQR and find AB/PQ if AB = 5 cm and PQ = 10 cm.`,
      hints: [
        "State the similarity criterion explicitly (AA/SSS/SAS).",
        "Keep vertex order consistent in ratios."
      ],
    },
    {
      id: "bpt",
      title: "BPT proof / application",
      focus: "bpt",
      marks: 3,
      description:
        "Use the Basic Proportionality Theorem when a line is parallel to a triangle side.",
      question:
        `Class ${grade} ${subjectTitle} - Triangles\n` +
        `Write a full proof with Given / To Prove / Construction (if needed) / Proof / Conclusion.\n` +
        `In triangle ABC, D lies on AB and E lies on AC. If DE is parallel to BC, AD = 3 cm, DB = 2 cm and EC = 4 cm,\n` +
        `prove AD/DB = AE/EC and find AE.`,
      hints: [
        "State BPT by name before writing the ratio.",
        "Substitute values and cross-multiply neatly."
      ],
    },
    {
      id: "area-ratio",
      title: "Area ratio of similar triangles",
      focus: "area_ratio",
      marks: 4,
      description:
        "Use similarity to relate areas as the square of corresponding side ratios.",
      question:
        `Class ${grade} ${subjectTitle} - Triangles\n` +
        `Write a full proof with Given / To Prove / Construction (if needed) / Proof / Conclusion.\n` +
        `Triangle ABC is similar to triangle PQR and AB/PQ = 2/3.\n` +
        `Prove area(ABC) / area(PQR) = (AB/PQ)^2 and find the ratio of their areas.`,
      hints: [
        "Square the side ratio when comparing areas.",
        "End with a clear numerical ratio."
      ],
    },
    {
      id: "pythagoras",
      title: "Pythagoras in right triangles",
      focus: "pythagoras",
      marks: 4,
      description:
        "Apply Pythagoras only when a right angle is given or proved.",
      question:
        `Class ${grade} ${subjectTitle} - Triangles\n` +
        `Write a full proof with Given / To Prove / Construction (if needed) / Proof / Conclusion.\n` +
        `In right triangle ABC, angle A = 90 degrees, AB = 6 cm and AC = 8 cm.\n` +
        `Prove BC^2 = AB^2 + AC^2 and find BC.`,
      hints: [
        "Identify the hypotenuse clearly.",
        "Use the theorem name in the proof line."
      ],
    },
  ];
}, [isTrianglesTopic, grade, subjectTitle]);

const buildFallbackWorkedExampleQuestion = useCallback(
    (section: "A" | "B" | "C" | "D" | "E") => {
      const marksBySectionLocal: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5 };
      const marks = marksBySectionLocal[section] ?? 2;

      const header = `Class ${grade} ${subjectTitle} Ã¢â‚¬Â¢ ${title}`;
      const diagramLine = isDiagramTopic
        ? `Diagram: Draw a neat labelled diagram wherever applicable.`
        : "";

      const isTriangles = /triangles/i.test(title);

      // High-quality hardcoded anchors for Triangles (so Board Steps + Socratic have a REAL problem to solve)
      if (isTriangles) {
        switch (section) {
          case "A":
            return `${header}

Pattern A (${marks}-mark/MCQ style):
In ?ABC and ?PQR, ?A = ?P and ?B = ?Q. What can you conclude?

A) ?ABC ? ?PQR
B) ?ABC ~ ?PQR
C) Areas of triangles are equal
D) Nothing definite can be said

Rules: Pick ONE correct option.`;
          case "B":
            return `${header}

${diagramLine}

Pattern B (${marks} marks, short answer):
In ?ABC, D lies on AB and E lies on AC. If DE ? BC, AD = 3 cm, DB = 6 cm and EC = 8 cm, find AE.`;
          case "C":
            return `${header}

Pattern C (${marks} marks):
(i) In ?ABC, ?A = 50Ã‚Â°, ?B = 60Ã‚Â°. In ?PQR, ?P = 50Ã‚Â°, ?Q = 60Ã‚Â°. Prove ?ABC ~ ?PQR.
(ii) If AB = 5 cm and PQ = 10 cm, find the ratio of areas of ?ABC and ?PQR.`;
          case "D":
            return `${header}

${diagramLine}

Pattern D (${marks} marks, typical board steps):
In ?ABC, D is a point on AB and E is a point on AC such that DE ? BC.
Given AD = 2 cm, DB = 3 cm and AC = 10 cm.
Find AE and EC.`;
          case "E":
            return `${header}

${diagramLine}

Pattern E (${marks} marks, mixed concept):
In a right triangle ?ABC right-angled at A, AD is drawn perpendicular to BC (D lies on BC).
(i) Prove that ABÃ‚Â² = BD Ã‚Â· BC and ACÃ‚Â² = CD Ã‚Â· BC.
(ii) If BD = 9 cm and BC = 25 cm, find AB.`;
          default:
            break;
        }
      }

      // Generic fallback (non-topic-specific)
      switch (section) {
        case "A":
          return `${header}

${diagramLine}

Pattern A (${marks}-mark/MCQ style):
A student claims a key fact about ${title}. Write one correct statement and pick the correct option (A/B/C/D) that matches it.

Rules: Use labelled diagrams wherever applicable. Show marks per step.`;
        case "B":
          return `${header}

${diagramLine}

Pattern B (${marks} marks):
Solve a short board-style question on ${title} with 2 clear steps + final answer.`;
        case "C":
          return `${header}

${diagramLine}

Pattern C (${marks} marks):
Solve a medium board-style question on ${title} with 3 steps and one reason/justification.`;
        case "D":
          return `${header}

${diagramLine}

Pattern D (${marks} marks, typical board steps):
Solve a board-style question on ${title} with clear steps and reasons (each step should earn marks).`;
        case "E":
          return `${header}

${diagramLine}

Pattern E (${marks} marks, mixed concept):
Solve a longer board-style question on ${title} (include a diagram, theorem/criteria, and a final conclusion).`;
        default:
          return `${header}

${diagramLine}

Solve a board-style question on ${title} in exam-ready steps.`;
      }
    },
    [grade, subjectTitle, title, isDiagramTopic]
  );

const buildFallbackQuickQuiz = useCallback((): V2Example[] => {
  const d = isDiagramTopic ? " (use a quick labelled figure if helpful)" : "";
  return [
    { title: "Quick Q1", question: `State one key definition from ${title}${d}.` },
    { title: "Quick Q2", question: `Write one common mistake students make in ${title}, and correct it.` },
    { title: "Quick Q3", question: `Give one example application of ${title} in a simple problem.` },
    { title: "Quick Q4", question: `If a problem asks for a proof/justification in ${title}, what are the 2 steps you must never skip?` },
    { title: "Quick Q5", question: `Write a 2-line summary of the fastest revision strategy for ${title}.` },
  ] as any;
}, [title, isDiagramTopic]);

  const quickQuizFromPractice = useMemo(() => {
    const practiceTopicKey = normalizeTopicKey(topicKey) || topicKey;
    const practiceSet = generatePracticeSet({
      subject: subject as any,
      topicKey: practiceTopicKey,
      totalQuestions: 5,
      shuffle: true,
    });

    const mapped = (practiceSet.questions || [])
      .map((q: any, idx: number) => {
        const text = String(q?.questionText ?? q?.text ?? q?.question ?? "").trim();
        if (!text) return null;
        return { title: `Q${idx + 1}`, question: text } as V2Example;
      })
      .filter(Boolean) as V2Example[];

    return mapped.slice(0, 5);
  }, [subject, topicKey]);
  const rawQuickQuiz = safeArray<V2Example>((v2 as any).quickQuiz);
  const quickQuiz = quickQuizFromPractice.length
    ? quickQuizFromPractice
    : rawQuickQuiz.length
      ? rawQuickQuiz
      : buildFallbackQuickQuiz();

  const misconceptions = safeArray<Misconception>((v2 as any).misconceptions);
  const competencies = safeArray<Competency>((v2 as any).competencies);
  // NCERT competencies: one context-aware Ask Mentor button
  const [selectedCompetencyIdx, setSelectedCompetencyIdx] = useState(0);
  useEffect(() => {
    setSelectedCompetencyIdx(0);
  }, [topicKey]);

  const labActivities = safeArray<LabActivity>((v2 as any).labActivities);
  const caseStudies = safeArray<CaseStudy>((v2 as any).caseStudies);

    // --- Resources (optional fields) ---
  const mindMap = (v2 as any).mindMap || (v2 as any).mindmap || null;
  const formulae = safeArray<any>((v2 as any).formulae || (v2 as any).formulas || (v2 as any).formulaSheet);
  const videos = safeArray<any>((v2 as any).videos || (v2 as any).videoLinks || (v2 as any).youtube);
  const guidedMindmap = topicKey === "triangles" ? trianglesGuidedMindmap : null;
  const grindMindmap = topicKey === "triangles" ? trianglesGrindMindmap : null;
  const guidedOrder = guidedMindmap?.recommendedOrder || [];
  const guidedNodes = guidedMindmap?.nodes || [];
  const guidedNodeById = useMemo(() => {
    const map = new Map<string, (typeof guidedNodes)[number]>();
    guidedNodes.forEach((n) => map.set(String(n.id), n));
    return map;
  }, [guidedNodes]);
  const guidedNodeTitleById = useMemo(() => {
    const out: Record<string, string> = {};
    guidedNodes.forEach((n) => {
      out[String(n.id)] = String(n.title || n.id);
    });
    return out;
  }, [guidedNodes]);
  const guidedCoreByNodeId: Record<string, unknown> = guidedMindmap?.coreByNodeId || {};
  const guidedCoreIdByNodeId: Record<string, unknown> = guidedMindmap?.coreIdByNodeId || {};
  const currentTutorNodeId = guidedOrder[tutorNodeIndex] || guidedOrder[0];
  const currentTutorNode = currentTutorNodeId ? guidedNodeById.get(currentTutorNodeId) : null;
  const currentTutorCore = currentTutorNodeId ? guidedCoreByNodeId[currentTutorNodeId] : null;
  const currentTutorCoreId = currentTutorNodeId ? guidedCoreIdByNodeId[currentTutorNodeId] : null;

  const defaultGrindNodeId = useMemo(() => {
    const hw = grindMindmap?.highways || [];
    for (const h of hw) {
      const order = Array.isArray(h.recommendedNodeOrder) ? h.recommendedNodeOrder : [];
      if (order.length) return String(order[0]);
    }
    const keys = grindMindmap ? Object.keys(grindMindmap.nodesById || {}) : [];
    return keys[0] ? String(keys[0]) : "";
  }, [grindMindmap]);

  useEffect(() => {
    if (!grindMindmap) {
      setGrindDrawerOpen(false);
      setGrindNodeId("");
      return;
    }
    setGrindNodeId((prev) => prev || defaultGrindNodeId);
  }, [grindMindmap, defaultGrindNodeId]);


  const mapProofFocusToNodeId = useCallback((focus?: string) => {
    const f = String(focus || "").toLowerCase();
    if (f.includes("bpt")) return "gBPT";
    if (f.includes("pyth")) return "gPyth";
    if (f.includes("area")) return "gArea";
    if (f.includes("cpst")) return "gCPST";
    if (f.includes("aa")) return "gAA";
    if (f.includes("sas")) return "gSAS";
    if (f.includes("sss")) return "gSSS";
    return "gQ1";
  }, []);

  const closeTutorDrawer = useCallback(() => {
    setTutorDrawerOpen(false);
  }, []);

  const closeGrindDrawer = useCallback(() => {
    setGrindDrawerOpen(false);
  }, []);

  const openGrindDrawer = useCallback(
    (opts?: { nodeId?: string | null }) => {
      const next = String(opts?.nodeId || grindNodeId || defaultGrindNodeId || "");
      setGrindNodeId(next);
      setGrindDrawerOpen(true);
    },
    [defaultGrindNodeId, grindNodeId]
  );


  const resolveTutorNodeIndex = useCallback(
    (nodeId?: string | null) => {
      if (!nodeId) return 0;
      const idx = guidedOrder.findIndex((id) => id === nodeId);
      return idx >= 0 ? idx : 0;
    },
    [guidedOrder]
  );

  const openTutorDrawer = useCallback(
    (opts?: { tab?: TutorTab; nodeId?: string | null }) => {
      const nextTab = opts?.tab || "teach";
      const nodeIndex = resolveTutorNodeIndex(opts?.nodeId || currentTutorNodeId);
      setTutorTab(nextTab);
      setTutorNodeIndex(nodeIndex);
      setTutorDrawerOpen(true);
    },
    [currentTutorNodeId, resolveTutorNodeIndex]
  );

const showInZombie = (sectionId: string) => {
    if (mode === "beast") return true;
    return ["summary", "exam-patterns", "key-definitions", "quick-quiz", "worked-examples"].includes(sectionId);
  };

  const isLearn = activeTab === 'learn';
  const isGrind = activeTab === 'grind';
  const isResources = activeTab === 'resources';

  const tabButtonStyle = (active: boolean) => ({
    padding: '8px 12px',
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,0.14)',
    background: active ? 'rgba(17,24,39,0.92)' : 'rgba(255,255,255,0.78)',
    color: active ? '#ffffff' : 'rgba(17,24,39,0.92)',
    fontWeight: 950,
    fontSize: 13,
    cursor: 'pointer' as const,
    boxShadow: active ? '0 10px 22px rgba(0,0,0,0.16)' : 'none',
  });

  return (
    <div className="page">
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "18px 14px 40px" }}>
        {/* Topic header (clean) */}
        <div
          style={{
            position: "sticky",
            top: 10,
            zIndex: 10,
            borderRadius: 18,
            padding: "12px 12px",
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 10px 26px rgba(0,0,0,0.10)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Link className="pill" to={`/trends/${grade}/${subject}`}>
              ? Trends
            </Link>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.10)",
                background: "rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.75 }}>Topic</div>
              <select
                value={topicKey}
                onChange={(e) => onChangeTopic(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontWeight: 800,
                  paddingRight: 6,
                  cursor: "pointer",
                }}
              >
                {topicOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.name} ({toTierLabel(opt.tier)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 14, opacity: 0.75 }}>
              Class {grade} Ã¢â‚¬Â¢ {subject.toUpperCase()}
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 10px",
                borderRadius: 999,
                background: tierColor(tier),
                border: `1px solid ${tierBorderColor(tier)}`,
                fontWeight: 900,
                fontSize: 12,
                letterSpacing: 0.2,
              }}
            >
              {tier}
            </div>

            <h1 style={{ fontSize: 34, margin: "0 0 0", fontWeight: 950, letterSpacing: -0.5 }}>
              {title}
            </h1>
          </div>

          {/* ONLY 3 tabs: Learn / Grind / Resources */}
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={tabButtonStyle(activeTab === 'learn')} onClick={() => setActiveTab('learn')}>
              Learn
            </button>
            <button type="button" style={tabButtonStyle(activeTab === 'grind')} onClick={() => setActiveTab('grind')}>
              Grind
            </button>
            <button type="button" style={tabButtonStyle(activeTab === 'resources')} onClick={() => setActiveTab('resources')}>
              Resources
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 14 }}>
          {isLearn && isTrianglesTopic ? (
            <div
              style={{
                borderRadius: 18,
                padding: "14px 14px",
                background: "rgba(255,255,255,0.65)",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>Let me teach you</div>
                <div style={{ fontSize: 13, opacity: 0.75 }}>
                  Start from basics and move step-by-step with the guided mindmap.
                </div>
              </div>
              <button
                type="button"
                className="pill"
                onClick={() => openTutorDrawer({ tab: "teach", nodeId: guidedOrder[0] })}
              >
                Let me teach you
              </button>
            </div>
          ) : null}

          {isGrind && isTrianglesTopic ? (
            <div
              style={{
                borderRadius: 18,
                padding: "14px 14px",
                background: "rgba(255,255,255,0.65)",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>Triangles Grind</div>
                <div style={{ fontSize: 13, opacity: 0.75 }}>
                  Marks-roadmap practice: rubrics, board skeletons, traps, and micro-drills.
                </div>
              </div>
              <button type="button" className="pill" onClick={() => openGrindDrawer({ nodeId: defaultGrindNodeId })}>
                Start grind
              </button>
            </div>
          ) : null}
{isLearn && showInZombie("summary") && overview.length > 0 && (
            <AccordionCard id="summary" title="Summary" defaultOpen>
              {overview.map((p, idx) => (
                <p key={idx} style={{ marginTop: idx === 0 ? 0 : 10, lineHeight: 1.65, opacity: 0.95 }}>
                  {p}
                </p>
              ))}
            </AccordionCard>
          )}

          {isLearn && showInZombie("exam-patterns") && examPatterns.length > 0 && (
            <AccordionCard id="exam-patterns" title="CBSE exam patterns" defaultOpen={mode === "zombie"}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {examPatterns.slice(0, 10).map((p, idx) => (
                  <li key={idx} style={{ marginBottom: 8, lineHeight: 1.55 }}>
                    {p}
                  </li>
                ))}
              </ul>
            </AccordionCard>
          )}

          {isLearn && showInZombie("key-definitions") && definitions.length > 0 && (
            <AccordionCard id="key-definitions" title="Key definitions" defaultOpen={mode === "beast"}>
              
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => {
                    if (isTrianglesTopic) {
                      openTutorDrawer({ tab: "teach", nodeId: guidedOrder[0] });
                      return;
                    }
                    openMentorDrawer({
                      title: `${title}   Key definitions`,
                      question: `Teach the key definitions in ${title} (Class ${grade} ${subjectTitle}).
Cover exactly:
1) Similar triangles (definition)
2) Corresponding sides/angles (definition + ordering)
3) Similarity criteria: AA, SAS, SSS (one line each)
4) CPST meaning (one line)
Use CBSE exam language and include a labelled diagram.`,
                      solveStyle: "socratic",
                      section: "learn",
                      subSection: "key-definitions",
                    });
                  }}
                >
                  {isTrianglesTopic ? "Open Tutor ->" : "Ask Mentor ->"}
                </button>
              </div>
<div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                {definitions.slice(0, 14).map((d, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderRadius: 14,
                      padding: "12px 12px",
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ fontWeight: 950 }}>{String(d?.title || `Definition ${idx + 1}`)}</div>
                    <div style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.55 }}>
                      {String(d?.description || "")}
                    </div>
                    {d?.examTip ? (
                      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                        <b>Exam tip:</b> {String(d.examTip)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </AccordionCard>
          )}

            {isLearn && guidedMindmap ? (
              <AccordionCard id="guided-mindmap" title="Guided mindmap (Triangles)" defaultOpen={false}>
                <GuidedMindmapPanel
                  data={guidedMindmap}
                  onAskMentor={(node) => {
                    if (!node?.id) return;
                    openTutorDrawer({ tab: "teach", nodeId: node.id });
                  }}
                />
              </AccordionCard>
            ) : null}

            {isLearn && isTrianglesTopic ? (
              <AccordionCard id="proof-writing" title="Proof writing (Triangles)" defaultOpen={mode === "beast"}>
                <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
                  Write proofs in CBSE board style: Given / To Prove / Construction / Proof / Conclusion.
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {proofWritingTemplates.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        borderRadius: 16,
                        padding: "12px 12px",
                        border: "1px solid rgba(0,0,0,0.10)",
                        background: "rgba(0,0,0,0.02)",
                      }}
                    >
                      <div style={{ fontWeight: 900 }}>{t.title}</div>
                      <div style={{ marginTop: 6, opacity: 0.85, lineHeight: 1.5 }}>{t.description}</div>
                      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                        Marks: {t.marks}  Focus: {t.focus.replace("_", " ")}
                      </div>
                      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="pill"
                          style={{ padding: "7px 10px", fontSize: 13 }}
                          onClick={() => openTutorDrawer({ tab: "teach", nodeId: mapProofFocusToNodeId(t.focus) })}
                          title="Open Tutor in teaching mode"
                        >
                          Teach this proof
                        </button>
                        <button
                          type="button"
                          className="pill"
                          style={{ padding: "7px 10px", fontSize: 13 }}
                          onClick={() => openTutorDrawer({ tab: "examples", nodeId: mapProofFocusToNodeId(t.focus) })}
                          title="See board-style examples"
                        >
                          Board example
                        </button>
                      </div>
                      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7, whiteSpace: "pre-wrap" }}>
                        {t.question}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionCard>
            ) : null}

            {isLearn && mode === "beast" && misconceptions.length > 0 && (
              <AccordionCard id="misconceptions" title="Common misconceptions">
                
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => {
                    if (isTrianglesTopic) {
                      openTutorDrawer({ tab: "teach", nodeId: guidedOrder[0] });
                      return;
                    }
                    openMentorDrawer({
                      title: `${title} Æ’?â€º Common misconceptions`,
                      question: `Act like a CBSE Class ${grade} teacher. For ${title}:

1) List the TOP 5 common misconceptions students have.
2) For each, show the WRONG thinking, then the CORRECT thinking.
3) Give 1 short example per misconception.
4) If geometry, include a labelled diagram description wherever it helps.
5) End with a 30-second revision checklist.`,
                      solveStyle: "socratic",
                    });
                  }}
                >
                  {isTrianglesTopic ? "Open Tutor ->" : "Ask Mentor ->"}
                </button>
              </div>
<ul style={{ margin: 0, paddingLeft: 18 }}>
                {misconceptions.slice(0, 10).map((m, idx) => (
                  <li key={idx} style={{ marginBottom: 10, lineHeight: 1.55 }}>
                    <b>{String(m?.concept || "Concept")}:</b> {String(m?.commonError || "")}
                    {m?.correction ? (
                      <div style={{ marginTop: 4, opacity: 0.9 }}>
                        <b>Fix:</b> {String(m.correction)}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </AccordionCard>
          )}

          {isGrind && mode === "beast" && markingTips.length > 0 && (
            <AccordionCard id="marking-tips" title="Marking tips (avoid silly mistakes)">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {markingTips.slice(0, 12).map((p, idx) => {
                  const anyP = p as any;
                  const text = String(anyP?.text || anyP?.tip || anyP?.description || anyP?.title || p || "");
                  if (!text) return null;
                  return (
                    <li key={idx} style={{ marginBottom: 8, lineHeight: 1.55 }}>
                      {text}
                    </li>
                  );
                })}
              </ul>
            </AccordionCard>
          )}

          {isGrind && mode === "beast" && scoreTips.length > 0 && (
            <AccordionCard id="score-tips" title="Score tips (how to write for full marks)">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {scoreTips.slice(0, 10).map((t, idx) => (
                  <li key={idx} style={{ marginBottom: 8, lineHeight: 1.55 }}>
                    {String(t || "")}
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="pill"
                  style={{ padding: "7px 10px", fontSize: 13 }}
                  onClick={() => {
                    if (isTrianglesTopic) {
                      openTutorDrawer({ tab: "examples", nodeId: guidedOrder[0] });
                      return;
                    }
                    const joined = scoreTips.slice(0, 10).map((x, i) => `${i + 1}. ${String(x || "")}`).join("\n");
                    openMentorDrawer({
                      title: `Score tips Ã‚Â· ${title}`,
                      question:
                        `You are a CBSE Class ${grade} ${subjectTitle} mentor.\n` +
                        `Using these score tips, teach me how to write answers for FULL marks.\n\n` +
                        `Score tips:\n${joined}\n\n` +
                        `Do this: (1) explain each tip in simple words, (2) show one worked example using the tips, ` +
                        `(3) show how marks are awarded step-by-step (board style).\n\n` +
                        `If a diagram is needed, include a simple labelled ASCII sketch and tell me what to draw in the exam.`,
                      solveStyle: "board",
                      section: "score-tips",
                      anchor: `scoreTips:${topicKey}`,
                      contextText: joined,
                    });
                  }}
                  title="Ask mentor to explain how to use these score tips and show a board-style example with marks"
                >
                  {isTrianglesTopic ? "Open Tutor ->" : "Ask Mentor ->"}
                </button>
              </div>
            </AccordionCard>
          )}
     {isGrind && showInZombie("worked-examples") && (
  <AccordionCard id="worked-examples" title="Worked examples (Board patterns AÃ¢â‚¬â€œE)">
    {(() => {
      const anchors = exampleAnchors as any;
      const exampleSections: Array<"A" | "B" | "C" | "D" | "E"> = ["A", "B", "C", "D", "E"];
      // Fallback marks by board pattern (used only if an anchor is missing marks).
      const marksBySection: Record<"A" | "B" | "C" | "D" | "E", number> = { A: 1, B: 2, C: 3, D: 4, E: 5 };

      const picked = anchors?.[exampleSection] as any;

      const pickedText = String(
        picked?.questionText || picked?.question || picked?.prompt || ""
      ).trim();

      const isAnchor = Boolean(pickedText);
      const questionText = isAnchor
        ? pickedText
        : buildFallbackWorkedExampleQuestion(exampleSection);

      const marks =
        typeof picked?.marks === "number"
          ? picked.marks
          : (marksBySection as any)?.[exampleSection];

      const qs = `topic=${encodeURIComponent(String(title || topicKey || ""))}&section=${encodeURIComponent(
        String(exampleSection)
      )}`;

      return (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            {exampleSections.map((sec) => (
              <button
                key={sec}
                type="button"
                className={sec === exampleSection ? "pill pill--on" : "pill"}
                onClick={() => setExampleSection(sec)}
              >
                Pattern {sec}
              </button>
            ))}
          </div>

          <div
            style={{
              borderRadius: 14,
              padding: "12px 12px",
              border: "1px solid rgba(0,0,0,0.08)",
              background: "rgba(0,0,0,0.02)",
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>
                Example Ã¢â‚¬Â¢ Pattern {exampleSection}{" "}
                <span style={{ fontWeight: 700, opacity: 0.65 }}>
                  {isAnchor ? "(from bank)" : "(auto sample)"}
                </span>
              </div>
              {marks ? (
                <div style={{ fontSize: 12, opacity: 0.75, whiteSpace: "nowrap" }}>
                  Marks: <b>{String(marks)}</b>
                </div>
              ) : null}
            </div>

            <div style={{ marginTop: 8, opacity: 0.92, whiteSpace: "pre-wrap" }}>
              {questionText}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <button
                type="button"
                className="pill"
                onClick={() =>
                  navigate(`/practice/${grade}/${subjectRoute}?${qs}`, {
                    state: { topicKey, sectionFilter: exampleSection },
                  })
                }
                title="Go to Practice page filtered to this Board pattern"
              >
                Practice this type ?
              </button>

              <button
                type="button"
                className="pill"
                onClick={() =>
                  openMentorDrawer({
                    title: `Pattern ${exampleSection} Ã¢â‚¬Â¢ ${title}`,
                    question:
                      `Solve this exact example in exam-ready steps.\n\n` +
                      `Pattern: ${exampleSection}\n` +
                      `Question: ${questionText}\n\n` +
                      `Rules: Use labelled diagrams wherever applicable. Show marks per step.`,
                    solveStyle: "board",
                    marks: typeof marks === "number" ? marks : undefined,
                    section: String(exampleSection),
                    anchor: isAnchor
                      ? picked?.id
                        ? `bank:${String(picked.id)}`
                        : `pattern:${String(exampleSection)}:${String(title)}`
                      : `sample:${String(exampleSection)}:${String(title)}`,
                    contextText: questionText,
                  })
                }
                title="Open Mentor drawer (switch between Board Steps / Solve With Me inside the drawer)"
              >
                Ask Mentor ?
              </button>
            </div>

            {!isAnchor ? (
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                Note: this is an auto-sample because your bank doesnÃ¢â‚¬â„¢t have a stored anchor for
                Pattern {exampleSection} yet. The Mentor can still solve it properly.
              </div>
            ) : null}
          </div>

              <div
                style={{
                  marginTop: 12,
                  borderRadius: 16,
                  padding: "12px 12px",
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 900 }}>
                    Example Ã‚Â· Pattern {exampleSection} {typeof marks === "number" ? `Ã‚Â· ${marks} marks` : ""}
                  </div>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>
                    {isAnchor ? "From your curated bank" : "Sample (fallback)"}
                  </div>
                </div>
                <div style={{ marginTop: 8, opacity: 0.92, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {questionText}
                </div>
              </div>

        </>
      );
    })()}
  </AccordionCard>
          )}

          {isGrind && showInZombie("quick-quiz") && quickQuiz.length > 0 && (
            <AccordionCard id="quick-quiz" title="Quick quiz (2 mins)" defaultOpen={mode === "zombie"}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                {quickQuiz.slice(0, 5).map((q, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderRadius: 14,
                      padding: "12px 12px",
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{String(q?.title || `Q${idx + 1}`)}</div>
                    {q?.question && q.question !== q.title ? (
                      <div style={{ marginTop: 6, opacity: 0.9 }}>{String(q.question)}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </AccordionCard>
          )}

          {isLearn && mode === "beast" && competencies.length > 0 && (
            <AccordionCard id="competencies" title="NCERT competencies">
              {(() => {
                const list = competencies.slice(0, 14);
                const safeIdx = Math.max(0, Math.min(selectedCompetencyIdx, Math.max(0, list.length - 1)));
                const selected = list[safeIdx] as any;
                const cid = String(selected?.id || `C${safeIdx + 1}`);
                const desc = String(selected?.description || "");
                const bloom = selected?.bloomLevel ? String(selected.bloomLevel) : "";

                return (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <button
                        type="button"
                        className="pill"
                        style={{ padding: "7px 10px", fontSize: 13 }}
                        onClick={() => {
                          if (isTrianglesTopic) {
                            openTutorDrawer({ tab: "teach", nodeId: guidedOrder[0] });
                            return;
                          }
                          if (!list.length) return;
                          openMentorDrawer({
                            title: `NCERT competency Ã‚Â· ${cid}`,
                            question:
                              `Explain the NCERT competency ${cid} for Class ${grade} ${subjectTitle}.\n` +
                              `Competency: ${desc}\n\n` +
                              `Do this: (1) explain in simple words, (2) give 1 quick example, (3) give 1 common mistake + fix.\n\n` +
                              `IMPORTANT: If you output JSON, do NOT wrap it in \`\`\` code fences.`,
                            solveStyle: "socratic",
                            section: "learn",
                            anchor: `competency:${cid}`,
                            contextText: desc,
                          });
                        }}
                        title="Ask mentor to explain the selected competency with an example and a common mistake"
                      >
                        {isTrianglesTopic ? "Open Tutor ->" : "Ask Mentor ->"}
                      </button>

                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        Selected: <b>{cid}</b>
                        {bloom ? <span> Ã¢â‚¬Â¢ {bloom}</span> : null}
                      </div>
                    </div>

                    <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                      {list.map((c: any, idx: number) => {
                        const id = String(c?.id || `C${idx + 1}`);
                        const isSel = idx === safeIdx;
                        return (
                          <li
                            key={id}
                            onClick={() => setSelectedCompetencyIdx(idx)}
                            style={{
                              marginBottom: 8,
                              lineHeight: 1.55,
                              padding: "8px 10px",
                              borderRadius: 14,
                              cursor: "pointer",
                              border: isSel ? "1px solid rgba(0,0,0,0.14)" : "1px solid transparent",
                              background: isSel ? "rgba(0,0,0,0.04)" : "transparent",
                            }}
                            title="Click to select; then use Ask Mentor on top"
                          >
                            <b>{id}:</b> {String(c?.description || "")}
                            {c?.bloomLevel ? (
                              <span style={{ opacity: 0.7 }}> Ã¢â‚¬Â¢ {String(c.bloomLevel)}</span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                );
              })()}
            </AccordionCard>
          )}

          {isGrind && mode === "beast" && labActivities.length > 0 && (
            <AccordionCard id="lab" title="Lab / activities">
              
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() =>
                    openMentorDrawer({
                      title: `${title} Ã¢â‚¬Â¢ Lab / activities`,
                      question: `Help me prepare for lab/activities in ${title}. Give the objective, steps, observations, and 2 viva questions with answers.`,
                      solveStyle: "board",
                    })
                  }
                >
                  Ask Mentor ?
                </button>
              </div>
<div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                {labActivities.slice(0, 6).map((a, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderRadius: 16,
                      padding: "14px 14px",
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "rgba(255,255,255,0.60)",
                    }}
                  >
                    <div style={{ fontWeight: 950 }}>{String(a?.title || `Activity ${idx + 1}`)}</div>
                    <div style={{ marginTop: 8, opacity: 0.9, lineHeight: 1.6 }}>
                      <b>Objective:</b> {String(a?.objective || "")}
                    </div>
                    {a?.materialsRequired ? (
                      <div style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.6 }}>
                        <b>Materials:</b> {String(a.materialsRequired)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </AccordionCard>
          )}

          {isGrind && mode === "beast" && caseStudies.length > 0 && (
            <AccordionCard id="case-studies" title="Case studies">
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                {caseStudies.slice(0, 4).map((cs, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderRadius: 16,
                      padding: "14px 14px",
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "rgba(255,255,255,0.60)",
                    }}
                  >
                    <div style={{ fontWeight: 950 }}>Case Study {idx + 1}</div>
                    <div style={{ marginTop: 8, opacity: 0.92, lineHeight: 1.6 }}>{String(cs?.contextText || "")}</div>
                    {safeArray<any>((cs as any)?.subQuestions).length > 0 ? (
                      <ol style={{ marginTop: 10, paddingLeft: 18 }}>
                        {safeArray<any>((cs as any).subQuestions)
                          .slice(0, 5)
                          .map((q, i) => (
                            <li key={i} style={{ marginBottom: 8, lineHeight: 1.55 }}>
                              {String(q?.questionText || "")}
                            </li>
                          ))}
                      </ol>
                    ) : null}
                  </div>
                ))}
              </div>
            </AccordionCard>
          )}

          {isResources && (
            <>
              <AccordionCard id="resources" title="Resources" defaultOpen>
                <p style={{ marginTop: 0, lineHeight: 1.65, opacity: 0.95 }}>
                  Quick revision kit for <b>{title}</b> Ã¢â‚¬â€ mindmap, formula sheet, and top videos.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    type="button"
                    className="pill"
                    onClick={() =>
                      openMentorDrawer({
                        title: `${title} Ã¢â‚¬Â¢ Resources`,
                        question: `Make me a 10-minute revision plan for ${title}. Keep it CBSE-focused and marks-friendly.`,
                        solveStyle: "socratic",
                      })
                    }
                  >
                    Ask Mentor ?
                  </button>
                </div>
              </AccordionCard>

              <AccordionCard id="mindmap" title="Mindmap" defaultOpen>
                {!mindMap ? (
                  <div style={{ fontSize: 13, opacity: 0.8 }}>
                    Mindmap coming soon for this topic. (WeÃ¢â‚¬â„¢ll auto-fill as the bank grows.)
                  </div>
                ) : (
                  <MindMapCanvas
                    mindMap={mindMap}
                    onAskMentor={(seedTitle, seedQuestion) =>
                      openMentorDrawer({
                        title: seedTitle,
                        question: seedQuestion,
                        solveStyle: "socratic",
                      })
                    }
                  />
                )}
              </AccordionCard>

              <AccordionCard id="formulae" title="Formula sheet" defaultOpen={false}>
                {safeArray<any>(formulae).length === 0 ? (
                  <div style={{ fontSize: 13, opacity: 0.8 }}>
                    No formula sheet added yet for this topic.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                    {safeArray<any>(formulae).slice(0, 20).map((f, idx) => {
                      const label = String(f?.title || f?.name || `Formula ${idx + 1}`);
                      const text = String(f?.formula || f?.text || f?.statement || "");
                      const whenToUse = String(
                        f?.whenToUse || f?.useWhen || f?.usage || f?.when || ""
                      );
                      const url = String(f?.pdfUrl || f?.url || f?.downloadUrl || "");
                      return (
                        <div
                          key={idx}
                          style={{
                            borderRadius: 14,
                            padding: "12px 12px",
                            border: "1px solid rgba(0,0,0,0.08)",
                            background: "rgba(0,0,0,0.02)",
                          }}
                        >
                          <div style={{ fontWeight: 950 }}>{label}</div>
                          {text ? (
                            <div style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.55 }}>{text}</div>
                          ) : null}
                          {whenToUse ? (
                            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>
                              <b>When to use:</b> {whenToUse}
                            </div>
                          ) : null}

                          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="pill"
                              style={{ padding: "7px 10px", fontSize: 13 }}
                              onClick={() =>
                                openMentorDrawer({
                                  title: `${title} Ã¢â‚¬Â¢ Formula`,
                                  question: `Teach me the formula: ${label}. Also show 2 solved CBSE-style examples where it is used.`,
                                  solveStyle: "socratic",
                                })
                              }
                            >
                              Ask Mentor
                            </button>

                            {url ? (
                              <a
                                className="pill"
                                style={{
                                  padding: "7px 10px",
                                  fontSize: 13,
                                  textDecoration: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                }}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open PDF ?
                              </a>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </AccordionCard>

              <AccordionCard id="videos" title="Top videos" defaultOpen={false}>
                {safeArray<any>(videos).length === 0 ? (
                  <div style={{ fontSize: 13, opacity: 0.8 }}>No videos added yet for this topic.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                    {safeArray<any>(videos).slice(0, 12).map((v, idx) => {
                      const titleTxt = String(v?.title || v?.name || `Video ${idx + 1}`);
                      const url = String(v?.url || v?.link || v?.youtubeUrl || "");
                      return (
                        <div
                          key={idx}
                          style={{
                            borderRadius: 16,
                            padding: "14px 14px",
                            border: "1px solid rgba(0,0,0,0.08)",
                            background: "rgba(255,255,255,0.60)",
                          }}
                        >
                          <div style={{ fontWeight: 950 }}>{titleTxt}</div>
                          {url ? (
                            <a href={url} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 8 }}>
                              Open video ?
                            </a>
                          ) : (
                            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>Video link missing.</div>
                          )}

                          <div style={{ marginTop: 10 }}>
                            <button
                              type="button"
                              className="pill"
                              style={{ padding: "7px 10px", fontSize: 13 }}
                              onClick={() =>
                                openMentorDrawer({
                                  title: `${title} Ã¢â‚¬Â¢ Video recap`,
                                  question: `Summarize the key takeaways for ${title} as a 1-page CBSE revision note. Add 3 mini-questions with answers.`,
                                  solveStyle: "socratic",
                                })
                              }
                            >
                              Ask Mentor
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </AccordionCard>
            </>
          )}


        </div>
      </div>
      <GrindDrawerV1
        open={grindDrawerOpen && isTrianglesTopic}
        onClose={closeGrindDrawer}
        mindmap={grindMindmap}
        nodeId={grindNodeId || defaultGrindNodeId}
        setNodeId={setGrindNodeId}
        grade={grade}
        subjectTitle={subjectTitle}
        topicKey={topicKey}
        mode={mode}
      />
      <TutorDrawerV2
        open={tutorDrawerOpen && isTrianglesTopic}
        onClose={closeTutorDrawer}
        tab={tutorTab}
        setTab={setTutorTab}
        nodeIndex={tutorNodeIndex}
        setNodeIndex={setTutorNodeIndex}
        nodeId={currentTutorNodeId}
        node={currentTutorNode ? { title: String(currentTutorNode.title), text: currentTutorNode.text } : null}
        core={toTutorConceptCard(currentTutorCore)}
        coreId={toNullableString(currentTutorCoreId)}
        order={guidedOrder}
        nodeTitles={guidedNodeTitleById}
        grade={grade}
        subjectTitle={subjectTitle}
        topicKey={topicKey}
        mode={mode}
      />
          <MentorSolveDrawer
        open={mentorDrawerOpen}
        onClose={closeMentorDrawer}
        seedExample={mentorSeedExample}
        solveStyle={mentorSolveStyle}
        setSolveStyle={setMentorSolveStyle}
        mode={mode}
        grade={grade}
        subjectTitle={subjectTitle}
        topicKey={topicKey}
      />
</div>
  );
}


function TutorDrawerV2(props: {
  open: boolean;
  onClose: () => void;
  tab: TutorTab;
  setTab: (tab: TutorTab) => void;
  nodeIndex: number;
  setNodeIndex: (idx: number) => void;
  nodeId: string | undefined;
  node: { title: string; text?: string } | null;
  core: { means: string; when: string[]; exam: string; trap: string } | null;
  coreId: string | null;
  order: string[];
  nodeTitles: Record<string, string>;
  grade: string;
  subjectTitle: string;
  topicKey: string;
  mode: ModeKey;
}) {
  const {
    open,
    onClose,
    tab,
    setTab,
    nodeIndex,
    setNodeIndex,
    nodeId,
    node,
    core,
    coreId,
    order,
    nodeTitles,
    grade,
    subjectTitle,
    topicKey,
    mode,
  } = props;

  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [doubtInput, setDoubtInput] = useState("");
  const [doubtAnswer, setDoubtAnswer] = useState<string | null>(null);
  const [doubtError, setDoubtError] = useState<string | null>(null);
  const [doubtLoading, setDoubtLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const doubtInputRef = useRef<HTMLInputElement | null>(null);

  const nodeTitle = String(node?.title || "Concept");
  const nodeText = String(node?.text || core?.means || "");
  const coreText = core
    ? [
        `What it means: ${core.means}`,
        core.when?.length ? `When used: ${core.when.join("; ")}` : "",
        `Exam line: ${core.exam}`,
        `Trap: ${core.trap}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const currentKey = nodeId ? `${tab}:${nodeId}` : "";
  const currentResponse = currentKey ? responses[currentKey] : null;
  const currentError = currentKey ? errors[currentKey] : null;
  const isLoading = loadingKey === currentKey;

  const cancelInFlight = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoadingKey(null);
  }, []);

  const safeJsonParse = (raw: string) => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const extractDiagramMeta = (obj: any) => {
    const diagramType =
      String(obj?.diagramType || obj?.diagram?.diagramType || obj?.diagram?.type || "").trim() ||
      "";
    const diagramLabels = obj?.diagramLabels || obj?.diagram?.diagramLabels || obj?.diagram?.labels || null;
    const diagramSpec = obj?.diagram || obj?.diagramSpec || null;
    return { diagramType, diagramLabels, diagramSpec };
  };

  const validateTeach = (obj: any, diagramType: string, diagramSpec: any) => {
    if (!diagramType && !diagramSpec) return "Diagram missing. Please retry.";
    const bullets = Array.isArray(obj?.conceptBullets) ? obj.conceptBullets : [];
    const examLines = Array.isArray(obj?.examLines) ? obj.examLines : [];
    const worked = obj?.workedExample || {};
    const steps = Array.isArray(worked.steps) ? worked.steps : [];
    if (bullets.length < 5) return "Teach response incomplete. Please retry.";
    if (examLines.length < 2) return "Teach response incomplete. Please retry.";
    if (!String(worked.question || "").trim()) return "Teach response incomplete. Please retry.";
    if (!steps.length) return "Teach response incomplete. Please retry.";
    if (!String(worked.finalAnswer || "").trim()) return "Teach response incomplete. Please retry.";
    if (!String(obj?.commonError || "").trim()) return "Teach response incomplete. Please retry.";
    if (!String(obj?.commonFix || "").trim()) return "Teach response incomplete. Please retry.";
    if (!String(obj?.checkQuestion || "").trim()) return "Teach response incomplete. Please retry.";
    return null;
  };

  const validateExamples = (obj: any, diagramType: string, diagramSpec: any) => {
    if (!diagramType && !diagramSpec) return "Diagram missing. Please retry.";
    const teach = obj?.teach || {};
    const simple = Array.isArray(teach.simpleExplanation) ? teach.simpleExplanation : [];
    const exam = Array.isArray(teach.cbseExamSentence) ? teach.cbseExamSentence : [];
    const worked = Array.isArray(obj?.workedExamples) ? obj.workedExamples : [];
    if (simple.length < 4) return "Examples response incomplete. Please retry.";
    if (exam.length < 2) return "Examples response incomplete. Please retry.";
    if (worked.length !== 2) return "Board Examples must include exactly 2 worked examples.";
    return null;
  };

  const formatDoubtStructured = (obj: any) => {
    if (!obj || typeof obj !== "object") return "";
    if (obj.kind === "learn_mindmap") {
      const bullets = Array.isArray(obj.conceptBullets) ? obj.conceptBullets.slice(0, 4) : [];
      const examLines = Array.isArray(obj.examLines) ? obj.examLines.slice(0, 2) : [];
      const lines = [];
      bullets.forEach((b: string) => lines.push(`- ${b}`));
      examLines.forEach((l: string, idx: number) => lines.push(`Exam line ${idx + 1}: ${l}`));
      if (obj.checkQuestion) lines.push(`Quick check: ${obj.checkQuestion}`);
      return lines.join("\n");
    }
    if (obj.kind === "learn_teach") {
      const teach = obj.teach || {};
      const simple = Array.isArray(teach.simpleExplanation) ? teach.simpleExplanation.slice(0, 4) : [];
      const exam = Array.isArray(teach.cbseExamSentence) ? teach.cbseExamSentence.slice(0, 2) : [];
      const lines = [];
      simple.forEach((b: string) => lines.push(`- ${b}`));
      exam.forEach((l: string) => lines.push(`Exam line: ${l}`));
      if (obj.checkQuestion) lines.push(`Quick check: ${obj.checkQuestion}`);
      return lines.join("\n");
    }
    return "";
  };

  const buildPayload = (nextTab: TutorTab, doubtContext?: any, prompt?: string) => {
    const modeApi = nextTab === "teach" ? "learn_mindmap" : "learn_teach";
    return {
      mode: modeApi,
      payload: {
        subject: subjectTitle,
        grade: Number(grade),
        topicKey,
        chapter: topicKey,
        cardTitle: nodeTitle,
        cardName: nodeTitle,
        section: "learn",
        subSection: nextTab === "teach" ? "mindmap" : "board-examples",
        selectedTab: nextTab,
        selectedMode: modeApi,
        mindmapNodeId: nodeId,
        mindmapNodeTitle: nodeTitle,
        mindmapNodeText: nodeText,
        mindmapCoreId: coreId,
        explainType: "mindmap_node",
        contextText: coreText || nodeText,
        stepIndex: nodeIndex,
        vibe: mode,
        doubtContext,
      },
      messages: prompt ? [{ role: "user", content: prompt }] : undefined,
    };
  };

  const requestTutor = useCallback(
    async (nextTab: TutorTab, opts?: { force?: boolean; prompt?: string }) => {
      if (!open || !nodeId) return;
      const key = `${nextTab}:${nodeId}`;
      if (!opts?.force && responses[key]) return;
      if (loadingKey === key) return;

      cancelInFlight();
      setErrors((prev) => ({ ...prev, [key]: "" }));
      setLoadingKey(key);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const body = buildPayload(nextTab, undefined, opts?.prompt);
        const res = await fetch(MENTOR_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Mentor request failed.");

        const structured = data?.data?.structured || safeJsonParse(String(data?.data?.text || ""));
        if (!structured) throw new Error("Mentor response incomplete. Please retry.");

        const meta = extractDiagramMeta(structured);
        const validation =
          nextTab === "teach"
            ? validateTeach(structured, meta.diagramType, meta.diagramSpec)
            : validateExamples(structured, meta.diagramType, meta.diagramSpec);
        if (validation) {
          setErrors((prev) => ({ ...prev, [key]: validation }));
          return;
        }

        setResponses((prev) => ({
          ...prev,
          [key]: {
            structured,
            diagramType: meta.diagramType,
            diagramLabels: meta.diagramLabels,
            diagramSpec: meta.diagramSpec,
            responseId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            summary: JSON.stringify(structured).slice(0, 280),
          },
        }));
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setErrors((prev) => ({ ...prev, [key]: err?.message || "Mentor error. Please retry." }));
      } finally {
        if (!controller.signal.aborted) {
          setLoadingKey(null);
        }
      }
    },
    [
      open,
      nodeId,
      responses,
      loadingKey,
      cancelInFlight,
      subjectTitle,
      grade,
      topicKey,
      nodeTitle,
      nodeText,
      coreId,
      coreText,
      nodeIndex,
      mode,
    ]
  );

  const sendDoubt = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || doubtLoading || !nodeId) return;
      setDoubtError(null);
      setDoubtLoading(true);

      const last = currentResponse || {};
      const doubtContext = {
        chapter: topicKey,
        cardId: nodeId,
        cardTitle: nodeTitle,
        cardSection: "learn",
        cardSubSection: tab,
        selectedTab: tab,
        nodeId,
        nodeTitle,
        stepIndex: nodeIndex,
        lastDiagram: last.diagramType,
        lastResponseId: last.responseId,
        lastResponseSummary: last.summary,
      };

      try {
        const body = buildPayload(tab, doubtContext, prompt);
        const res = await fetch(MENTOR_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Mentor request failed.");

        const structured = data?.data?.structured || safeJsonParse(String(data?.data?.text || ""));
        const formatted = structured ? formatDoubtStructured(structured) : String(data?.data?.text || "");
        setDoubtAnswer(formatted || "Mentor reply received.");
        setDoubtInput("");
      } catch (err: any) {
        setDoubtError(err?.message || "Mentor error. Please retry.");
      } finally {
        setDoubtLoading(false);
      }
    },
    [
      doubtLoading,
      nodeId,
      currentResponse,
      topicKey,
      nodeTitle,
      tab,
      nodeIndex,
      buildPayload,
    ]
  );

  useEffect(() => {
    if (!open) {
      cancelInFlight();
      setDoubtInput("");
      setDoubtAnswer(null);
      setDoubtError(null);
      return;
    }
    if (!nodeId) return;
    if (currentError) return;
    if (!currentResponse && !isLoading) {
      requestTutor(tab);
    }
  }, [open, nodeId, tab, currentResponse, currentError, isLoading, requestTutor, cancelInFlight]);

  useEffect(() => {
    setDoubtAnswer(null);
    setDoubtError(null);
    setDoubtInput("");
  }, [tab, nodeId]);

  if (!open) return null;

  const drawerBg =
    mode === "beast"
      ? "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(245,247,255,0.98) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(245,255,248,0.98) 100%)";

  const handleTabChange = (nextTab: TutorTab) => {
    if (nextTab === tab) return;
    cancelInFlight();
    setTab(nextTab);
  };

  const goToNodeIndex = (idx: number) => {
    if (idx < 0 || idx >= order.length) return;
    cancelInFlight();
    setNodeIndex(idx);
  };

  const handleNextConcept = () => {
    const next = Math.min(nodeIndex + 1, Math.max(0, order.length - 1));
    if (next !== nodeIndex) goToNodeIndex(next);
  };

  const renderTeach = () => {
    const obj = currentResponse?.structured || null;
    if (!obj) return null;
    const bullets = Array.isArray(obj.conceptBullets) ? obj.conceptBullets : [];
    const examLines = Array.isArray(obj.examLines) ? obj.examLines : [];
    const worked = obj.workedExample || {};
    const steps = Array.isArray(worked.steps) ? worked.steps : [];
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <DiagramBlock
          diagramType={currentResponse.diagramType}
          diagramLabels={currentResponse.diagramLabels}
          diagramSpec={currentResponse.diagramSpec}
          note="CBSE diagram block"
        />
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Concept bullets</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {bullets.map((b: any, idx: number) => (
              <li key={idx} style={{ marginBottom: 6 }}>{String(b)}</li>
            ))}
          </ul>
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Exam lines</div>
          {examLines.map((l: any, idx: number) => (
            <div key={idx} style={{ marginBottom: 6, padding: "6px 8px", borderRadius: 10, background: "rgba(0,0,0,0.04)" }}>
              {String(l)}
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Mini worked example</div>
          {worked.question ? (
            <div style={{ marginBottom: 8, opacity: 0.9 }}>{String(worked.question)}</div>
          ) : null}
          {steps.length ? (
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {steps.map((s: any, idx: number) => (
                <li key={idx} style={{ marginBottom: 6 }}>{String(s)}</li>
              ))}
            </ol>
          ) : null}
          {worked.finalAnswer ? (
            <div style={{ marginTop: 6, fontWeight: 700 }}>Final: {String(worked.finalAnswer)}</div>
          ) : null}
        </div>
        <div style={{ borderRadius: 12, padding: "10px 12px", background: "rgba(255,180,0,0.08)" }}>
          <div style={{ fontWeight: 800 }}>Common error + fix</div>
          <div style={{ marginTop: 6 }}>{String(obj.commonError || "")}</div>
          <div style={{ marginTop: 6, fontWeight: 700 }}>Fix: {String(obj.commonFix || "")}</div>
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Quick check</div>
          <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(0,0,0,0.04)" }}>
            {String(obj.checkQuestion || "")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="pill"
            onClick={handleNextConcept}
            disabled={nodeIndex >= order.length - 1}
          >
            Continue
          </button>
          <button
            type="button"
            className="pill"
            onClick={() => doubtInputRef.current?.focus()}
          >
            Ask a doubt
          </button>
          <button
            type="button"
            className="pill"
            onClick={() => handleTabChange("examples")}
          >
            Show an example for this
          </button>
        </div>
      </div>
    );
  };

  const renderExamples = () => {
    const obj = currentResponse?.structured || null;
    if (!obj) return null;
    const teach = obj.teach || {};
    const simple = Array.isArray(teach.simpleExplanation) ? teach.simpleExplanation : [];
    const exam = Array.isArray(teach.cbseExamSentence) ? teach.cbseExamSentence : [];
    const worked = Array.isArray(obj.workedExamples) ? obj.workedExamples : [];
    const mistakes = Array.isArray(obj.commonMistakes) ? obj.commonMistakes : [];
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <DiagramBlock
          diagramType={currentResponse.diagramType}
          diagramLabels={currentResponse.diagramLabels}
          diagramSpec={currentResponse.diagramSpec}
          note="CBSE diagram block"
        />
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Teach bullets</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {simple.map((b: any, idx: number) => (
              <li key={idx} style={{ marginBottom: 6 }}>{String(b)}</li>
            ))}
          </ul>
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Exam line</div>
          {exam.map((l: any, idx: number) => (
            <div key={idx} style={{ marginBottom: 6, padding: "6px 8px", borderRadius: 10, background: "rgba(0,0,0,0.04)" }}>
              {String(l)}
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Worked examples (2)</div>
          {worked.map((ex: any, exIdx: number) => {
            const steps = Array.isArray(ex?.steps) ? ex.steps : [];
            const sumMarks = steps.reduce((acc: number, s: any) => acc + (Number(s?.marks) || 0), 0);
            const total = Number(ex?.totalMarks);
            return (
              <div key={exIdx} style={{ borderRadius: 12, padding: "10px 12px", border: "1px solid rgba(0,0,0,0.08)", marginBottom: 10 }}>
                <div style={{ fontWeight: 800 }}>
                  {exIdx === 0 ? "Example 1: Basic" : "Example 2: Board-style"}
                </div>
                {ex?.question ? <div style={{ marginTop: 6 }}>{String(ex.question)}</div> : null}
                {steps.length ? (
                  <ol style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                    {steps.map((s: any, idx: number) => (
                      <li key={idx} style={{ marginBottom: 6 }}>
                        <b>[{Number(s?.marks) || 0}]</b> {String(s?.text || "")}
                      </li>
                    ))}
                  </ol>
                ) : null}
                {Number.isFinite(total) ? (
                  <div style={{ marginTop: 6, fontWeight: 700 }}>Total marks: {total}</div>
                ) : null}
                {Number.isFinite(total) && Number.isFinite(sumMarks) && total !== sumMarks ? (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#9b5a00" }}>
                    Marking check: step marks sum to {sumMarks}, expected {total}.
                  </div>
                ) : null}
                {ex?.finalAnswer ? (
                  <div style={{ marginTop: 6, fontWeight: 700 }}>Final: {String(ex.finalAnswer)}</div>
                ) : null}
              </div>
            );
          })}
        </div>
        {mistakes.length ? (
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Common mistakes</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {mistakes.map((m: any, idx: number) => (
                <li key={idx} style={{ marginBottom: 6 }}>{String(m)}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {obj.checkQuestion ? (
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Check question</div>
            <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(0,0,0,0.04)" }}>
              {String(obj.checkQuestion)}
            </div>
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="pill" onClick={() => handleTabChange("teach")}>
            Back to teaching (Resume Step {nodeIndex + 1})
          </button>
        </div>
      </div>
    );
  };

  const drawerContent = () => {
    if (currentError) {
      return (
        <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,0,0,0.2)", background: "rgba(255,0,0,0.06)" }}>
          <div>{currentError}</div>
          <button
            type="button"
            className="pill"
            style={{ marginTop: 10 }}
            onClick={() => requestTutor(tab, { force: true })}
          >
            Retry
          </button>
        </div>
      );
    }

    if (!currentResponse && isLoading) {
      return <div style={{ padding: 12, opacity: 0.75 }}>Tutor is preparing your lesson...</div>;
    }

    if (!currentResponse) {
      return <div style={{ padding: 12, opacity: 0.75 }}>No tutor response yet.</div>;
    }

    return tab === "teach" ? renderTeach() : renderExamples();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.35)",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: "min(440px, 94vw)",
          background: drawerBg,
          boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          padding: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Tutor</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              type="button"
              className="pill"
              onClick={() => handleTabChange("teach")}
              style={{ background: tab === "teach" ? "rgba(0,0,0,0.08)" : "white" }}
            >
              Teach
            </button>
            <button
              type="button"
              className="pill"
              onClick={() => handleTabChange("examples")}
              style={{ background: tab === "examples" ? "rgba(0,0,0,0.08)" : "white" }}
            >
              Board Examples
            </button>
            <button
              type="button"
              className="pill"
              onClick={onClose}
              title="Close"
              style={{ background: "white" }}
            >
              Close
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          Youâ€™re learning: <b>{nodeTitle}</b> â€¢ Step {nodeIndex + 1} of {Math.max(1, order.length)}
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="pill"
            onClick={() => goToNodeIndex(0)}
            disabled={nodeIndex === 0}
          >
            Start from basics
          </button>
          <button
            type="button"
            className="pill"
            onClick={handleNextConcept}
            disabled={nodeIndex >= order.length - 1}
          >
            Next concept
          </button>
          <select
            value={nodeId || ""}
            onChange={(e) => goToNodeIndex(order.findIndex((id) => id === e.target.value))}
            style={{
              borderRadius: 999,
              padding: "6px 10px",
              border: "1px solid rgba(0,0,0,0.12)",
              background: "white",
              fontWeight: 700,
            }}
          >
            {order.map((id, idx) => (
              <option key={id} value={id}>
                {idx + 1}. {nodeTitles[id] || id}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            marginTop: 12,
            flex: 1,
            overflow: "auto",
            padding: 10,
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.10)",
            background: "rgba(255,255,255,0.6)",
          }}
        >
          {drawerContent()}
        </div>

        {doubtAnswer ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "rgba(0,0,0,0.04)" }}>
            <div style={{ whiteSpace: "pre-wrap" }}>{doubtAnswer}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="pill" onClick={() => setDoubtAnswer(null)}>
                Resume
              </button>
              <button
                type="button"
                className="pill"
                onClick={() => sendDoubt("Explain this in simpler words, shorter and clearer.")}
                disabled={doubtLoading}
              >
                Explain simpler
              </button>
              <button
                type="button"
                className="pill"
                onClick={() => {
                  setDoubtAnswer(null);
                  handleTabChange("examples");
                }}
              >
                Show board example
              </button>
            </div>
          </div>
        ) : null}

        {doubtError ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "rgba(255,0,0,0.06)" }}>
            {doubtError}
          </div>
        ) : null}

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <input
            ref={doubtInputRef}
            value={doubtInput}
            onChange={(e) => setDoubtInput(e.target.value)}
            placeholder="Ask a doubt about this step..."
            onKeyDown={(e) => {
              if (e.key === "Enter") sendDoubt(doubtInput);
            }}
            style={{
              flex: 1,
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.14)",
              padding: "10px 12px",
              fontSize: 14,
              outline: "none",
              background: "white",
            }}
            disabled={doubtLoading}
          />
          <button
            type="button"
            className="pill"
            onClick={() => sendDoubt(doubtInput)}
            disabled={doubtLoading || !doubtInput.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}




function MentorSolveDrawer({
  open,
  onClose,
    seedExample,
  solveStyle,
  setSolveStyle,
  mode,
  grade,
  subjectTitle,
  topicKey,
}: {
  open: boolean;
  onClose: () => void;
  seedExample: {
    title: string;
    question: string;
    marks?: number;
    section?: string;
    subSection?: string;
    anchor?: string;
    contextText?: string;
    requestedMode?: RequestedMentorMode;
    explainType?: ExplainType;
    itemId?: string;
    itemTitle?: string;
    itemText?: string;
    theoremFocus?: string[];
    mindmapNodeId?: string;
    mindmapNodeTitle?: string;
    mindmapCoreId?: string;
    mindmapNodeText?: string;
  } | null;
  solveStyle: "socratic" | "board";
  setSolveStyle: (v: "socratic" | "board") => void;
  mode: ModeKey;
  grade: string;
  subjectTitle: string;
  topicKey: string;
}) {
  const [messages, setMessages] = useState<MentorChatMsg[]>([]);

  

const stripCodeFences = (raw: string) => {
  const t = String(raw || "");
  // Remove ```lang fences but keep the inner content.
  return t.replace(/```[a-zA-Z0-9_-]*\n?/g, "").replace(/```/g, "").trim();
};

const extractAllJsonObjects = (raw: string) => {
  const t = raw ?? "";
  const out: string[] = [];
  const len = t.length;

  let i = 0;
  while (i < len) {
    if (t[i] !== "{") {
      i += 1;
      continue;
    }

    const startIdx = i;
    let depth = 0;
    let inString = false;
    let esc = false;

    for (; i < len; i++) {
      const ch = t[i];

      if (esc) {
        esc = false;
        continue;
      }

      if (ch === "\\") {
        if (inString) esc = true;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (ch === "{") {
        depth += 1;
      } else if (ch === "}") {
        depth -= 1;
        if (depth === 0) {
          out.push(t.slice(startIdx, i + 1));
          i += 1; // move past closing brace
          break;
        }
      }
    }

    // Ran out of input without closing braces => stop (likely truncated payload)
    if (i >= len) break;
  }

  return out;
};


const repairJsonForParse = (raw: string) => {
  if (!raw) return "";

  // 1) Normalize line endings + quotes
  let s = raw.replace(/\uFEFF/g, "");
  s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");

  // 2) Strip code fences (common when models wrap JSON in ```json)
  s = stripCodeFences(s);

  // 3) If there is surrounding text, keep only the outermost JSON-ish chunk
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first >= 0 && last > first) s = s.slice(first, last + 1);

  // 4) Remove JS-style comments (sometimes models add them)
  s = s.replace(/^\s*\/\/.*$/gm, "");
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");

  // 5) Escape invalid backslashes inside JSON strings (e.g. LaTeX like \triangle, \frac, \( \))
  let out = "";
  let inString = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (!inString) {
      if (ch === '"') inString = true;
      out += ch;
      continue;
    }

    if (esc) {
      out += ch;
      esc = false;
      continue;
    }

    if (ch === "\\") {
      const next = s[i + 1] ?? "";
      const isValid = next === '"' || next === "\\" || next === "/" || next === "b" || next === "f" || next === "n" || next === "r" || next === "t" || next === "u";
      if (!isValid) {
        // Turn "" + "x" into "\\" + "x" so JSON.parse won't choke
        out += "\\\\";
      } else {
        out += ch;
        esc = true;
      }
      continue;
    }

    if (ch === '"') {
      inString = false;
      out += ch;
      continue;
    }

    if (ch === "\u2028" || ch === "\u2029") {
      out += "\n";
      continue;
    }

    out += ch;
  }

  return out;
};

const safeJsonParse = (jsonStr: string) => {
  try {
    let s = repairJsonForParse(jsonStr);
    // remove trailing commas before } or ]
    s = s.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(s);
  } catch {
    return null;
  }
};

const parseSolveWithMe = (raw: string) => {
  try {
    if (!raw) return null;

    const cleaned = stripCodeFences(raw);
    const jsonCandidates = extractAllJsonObjects(cleaned);

    for (const cand of jsonCandidates) {
      const obj = safeJsonParse(cand);
      if (!obj || typeof obj !== "object") continue;

      // Prefer typed protocols first
      if (typeof (obj as any).tutor === "string") return obj as any;
      if (typeof (obj as any).kind === "string") return obj as any;
    }

    return null;
  } catch {
    return null;
  }
};


const normalizeBoardStepMarks = (steps: any[], total: number) => {
  if (!Array.isArray(steps)) return steps;
  if (!Number.isFinite(total) || total <= 0) return steps;
  const cleaned = steps.map((s) => ({
    ...s,
    marks: Number.isFinite(Number(s?.marks)) ? Number(s.marks) : 0,
  }));
  const sum = cleaned.reduce((acc, s) => acc + (Number(s.marks) || 0), 0);
  if (!sum) {
    const per = cleaned.length ? total / cleaned.length : total;
    const rounded = cleaned.map((s) => ({ ...s, marks: Math.round(per * 2) / 2 }));
    const roundedSum = rounded.reduce((acc, s) => acc + (Number(s.marks) || 0), 0);
    const delta = Number((total - roundedSum).toFixed(2));
    if (rounded.length && Math.abs(delta) > 0.001) {
      rounded[rounded.length - 1].marks = Number((rounded[rounded.length - 1].marks + delta).toFixed(2));
    }
    return rounded;
  }
  const factor = total / sum;
  const rounded = cleaned.map((s) => {
    const raw = (Number(s.marks) || 0) * factor;
    return { ...s, marks: Math.round(raw * 2) / 2 };
  });
  const roundedSum = rounded.reduce((acc, s) => acc + (Number(s.marks) || 0), 0);
  const delta = Number((total - roundedSum).toFixed(2));
  if (rounded.length && Math.abs(delta) > 0.001) {
    const lastIdx = rounded.length - 1;
    rounded[lastIdx].marks = Number((rounded[lastIdx].marks + delta).toFixed(2));
  }
  return rounded;
};

const parseDiagramMetaFromText = (rawText: string) => {
  const lines = String(rawText || "").split(/\r?\n/);
  let diagramType = "";
  let diagramLabels: string[] | null = null;
  const kept: string[] = [];

  lines.forEach((line) => {
    const t = line.trim();
    const typeMatch = t.match(/diagramType\s*[:=]\s*([A-Za-z0-9_]+)/i);
    const labelsMatch = t.match(/labels?\s*[:=]\s*([A-Za-z0-9,\s]+)/i);

    if (typeMatch) diagramType = typeMatch[1].toUpperCase();
    if (labelsMatch) {
      diagramLabels = labelsMatch[1]
        .split(/[,\s]+/)
        .map((v) => v.trim())
        .filter(Boolean);
    }

    const isDiagramLine =
      /diagramType\s*[:=]/i.test(t) ||
      /labels?\s*[:=]/i.test(t) ||
      /^diagram\s*:/i.test(t);

    if (!isDiagramLine) kept.push(line);
  });

  return {
    text: kept.join("\n").trim(),
    diagramType,
    diagramLabels,
  };
};

const extractDiagramMetaFromObject = (obj: any) => {
  const diagramType =
    String(obj?.diagramType || obj?.diagram_type || obj?.diagram?.diagramType || obj?.diagram?.diagram_type || "").trim() ||
    "";
  const diagramLabels = obj?.diagramLabels || obj?.diagram_labels || obj?.labels || null;
  const diagramSpec = obj?.diagram || obj?.diagramSpec || null;
  return { diagramType, diagramLabels, diagramSpec };
};

const renderAssistantContentLegacy = (raw: string) => {
  const stripped = stripCodeFences(raw ?? "");
  const candidates = extractAllJsonObjects(stripped);
  let leftover = stripped;
  for (const c of candidates) {
    const at = leftover.indexOf(c);
    if (at >= 0) leftover = leftover.slice(0, at) + leftover.slice(at + c.length);
  }
  leftover = leftover.trim();
  const prefix = leftover ? leftover + "\n\n" : "";

const obj: any = parseSolveWithMe(raw);
if (!obj) {
  // If we see protocol-ish JSON (even if malformed/truncated), never leak it into the UI.
  const protoHint =
    stripped.includes('"kind"') ||
    stripped.includes("board_steps_ms") ||
    stripped.includes('"steps"') ||
    stripped.includes('"totalMarks"');

  if (candidates.length > 0 || protoHint) {
    // Keep any non-JSON leading text, drop the rest.
    let keep = leftover;

    const idxKind = keep.indexOf('"kind"');
    if (idxKind >= 0) {
      const brace = keep.lastIndexOf("{", idxKind);
      if (brace >= 0) keep = keep.slice(0, brace).trim();
    } else {
      const idxBoard = keep.indexOf("board_steps_ms");
      if (idxBoard >= 0) {
        const brace = keep.lastIndexOf("{", idxBoard);
        if (brace >= 0) keep = keep.slice(0, brace).trim();
      }
    }

    const note = "Mentor response incomplete. Please retry.";
    return (keep ? keep + "\n\n" : "") + note;
  }

  return stripped;
}

  // Board steps (one-shot) Ã¢â‚¬â€ show full marking scheme in an exam-friendly format.
  if (obj.kind === "board_steps_ms") {
    const total = Number(obj.totalMarks) || undefined;
    const steps = Array.isArray(obj.steps) ? obj.steps : [];
    const lines: string[] = [];
        const sumMarks = steps.reduce((acc: number, s: any) => {
      const m = s && s.marks != null ? Number(s.marks) : 0;
      return acc + (Number.isFinite(m) ? m : 0);
    }, 0);
    const headerSuffix = total
      ? ` (Total: ${total} marks Ã‚Â· Steps: ${sumMarks} marks)`
      : sumMarks
      ? ` (Steps: ${sumMarks} marks)`
      : "";
    lines.push(`?? Board Steps + Marking Scheme${headerSuffix}`);

    if (total != null && Number.isFinite(total) && sumMarks && total !== sumMarks) {
      lines.push(`?? Marking check: step-marks sum to ${sumMarks}, expected ${total}. (Continue with step-wise marks as shown.)`);
    }

    steps.forEach((s: any, idx: number) => {
      const m = s && s.marks != null ? Number(s.marks) : 0;
      const text = s && s.text ? String(s.text) : "";
      lines.push("");
      lines.push(`${idx + 1}) [${m}] ${text}`);
      if (s?.whyThisGetsMarks) lines.push(`   Ã¢â‚¬Â¢ Why: ${String(s.whyThisGetsMarks)}`);
      if (s?.commonMistake) lines.push(`   Ã¢â‚¬Â¢ Common mistake: ${String(s.commonMistake)}`);
    });

    if (obj.finalAnswer) {
      lines.push("");
      lines.push(`? Final Answer: ${String(obj.finalAnswer)}`);
    }
    if (Array.isArray(obj.warnings) && obj.warnings.length) {
      lines.push("");
      lines.push("?? Notes:");
      obj.warnings.slice(0, 6).forEach((w: any) => lines.push(`- ${String(w)}`));
    }
    return prefix + lines.join("\n");
  }

  // Default: Solve With Me protocol (question/hint/final)
  const lines: string[] = [];
  if (obj.kind === "hint") lines.push("?? Hint:");
  if (obj.kind === "final") lines.push("? Final:");

  lines.push(String(obj.tutor || ""));

  if (obj.mcq && typeof obj.mcq === "object") {
    const opts = ["A", "B", "C", "D"]
      .filter((k) => obj.mcq && obj.mcq[k])
      .map((k) => `${k}. ${obj.mcq[k]}`);
    if (opts.length) {
      lines.push("");
      lines.push(...opts);
    }
  }

  if (obj.answerFormat) {
    lines.push("");
    lines.push(`Answer format: ${obj.answerFormat}`);
  }

  if (obj.kind === "final") {
    if (obj.finalAnswer) {
      lines.push("");
      lines.push(`Final Answer: ${obj.finalAnswer}`);
    }
    if (obj.boardWriteup) {
      lines.push("");
      lines.push("Board Write-up:");
      lines.push(obj.boardWriteup);
    }
  }

  return prefix + lines.join("\n");
};

const renderAssistantContent = (raw: string) => {
  const stripped = stripCodeFences(raw ?? "");
  const legacyText = renderAssistantContentLegacy(raw);
  const obj: any = parseSolveWithMe(raw);
  const parsedText = parseDiagramMetaFromText(legacyText || stripped);

  if (!obj) {
    const diagramType = parsedText.diagramType || "TRIANGLE_GENERIC";
    const cleanText = parsedText.text || stripped;
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <DiagramBlock diagramType={diagramType} diagramLabels={parsedText.diagramLabels} note="Diagram placeholder" />
        <div style={{ whiteSpace: "pre-wrap" }}>{cleanText}</div>
      </div>
    );
  }

  const diagramMeta = extractDiagramMetaFromObject(obj);
  const diagramType = diagramMeta.diagramType || "TRIANGLE_GENERIC";

  if (obj.kind === "learn_teach") {
    const teach = obj.teach || {};
    const simple = Array.isArray(teach.simpleExplanation) ? teach.simpleExplanation : [];
    const exam = Array.isArray(teach.cbseExamSentence) ? teach.cbseExamSentence : [];
    const worked = Array.isArray(obj.workedExamples) ? obj.workedExamples : [];
    const mistakes = Array.isArray(obj.commonMistakes) ? obj.commonMistakes : [];
    const lines: string[] = [];

    if (simple.length) {
      lines.push("Simple explanation:");
      simple.forEach((s: any) => lines.push(`- ${String(s)}`));
    }
    if (exam.length) {
      lines.push("");
      lines.push("CBSE exam lines:");
      exam.forEach((s: any, idx: number) => lines.push(`${idx + 1}) ${String(s)}`));
    }

    worked.forEach((ex: any, idx: number) => {
      lines.push("");
      lines.push(`Worked Example ${idx + 1}: ${String(ex?.title || "Example")}`);
      if (ex?.question) lines.push(`Question: ${String(ex.question)}`);
      if (Array.isArray(ex?.steps)) {
        lines.push("Steps:");
        ex.steps.forEach((step: any, sIdx: number) => {
          const mark = step?.marks != null ? Number(step.marks) : 0;
          lines.push(`${sIdx + 1}) [${mark}] ${String(step?.text || "")}`);
        });
      }
      if (ex?.totalMarks != null) lines.push(`Total Marks: ${String(ex.totalMarks)}`);
      if (ex?.finalAnswer) lines.push(`Final Answer: ${String(ex.finalAnswer)}`);
    });

    if (mistakes.length) {
      lines.push("");
      lines.push("Common mistakes:");
      mistakes.forEach((m: any) => lines.push(`- ${String(m)}`));
    }
    if (obj.checkQuestion) {
      lines.push("");
      lines.push(`Check question: ${String(obj.checkQuestion)}`);
    }

    return (
      <div style={{ display: "grid", gap: 8 }}>
        <DiagramBlock
          diagramType={diagramType}
          diagramLabels={diagramMeta.diagramLabels}
          diagramSpec={diagramMeta.diagramSpec}
          note="CBSE diagram block"
        />
        <div style={{ whiteSpace: "pre-wrap" }}>{lines.join("\n")}</div>
      </div>
    );
  }

  if (obj.kind === "learn_proof") {
    const lines: string[] = [];
    const given = Array.isArray(obj.given) ? obj.given : [];
    const toProve = Array.isArray(obj.toProve) ? obj.toProve : [];
    const construction = Array.isArray(obj.construction) ? obj.construction : [];
    const steps = Array.isArray(obj.proofSteps) ? obj.proofSteps : [];
    const conclusion = Array.isArray(obj.conclusion) ? obj.conclusion : [];

    lines.push("Given:");
    given.forEach((g: any) => lines.push(`- ${String(g)}`));
    lines.push("");
    lines.push("To Prove:");
    toProve.forEach((t: any) => lines.push(`- ${String(t)}`));
    lines.push("");
    lines.push("Construction:");
    if (construction.length) {
      construction.forEach((c: any) => lines.push(`- ${String(c)}`));
    } else {
      lines.push("- Not required.");
    }
    lines.push("");
    lines.push("Proof:");
    steps.forEach((s: any, idx: number) => {
      const mark = s?.mark != null ? Number(s.mark) : 0;
      lines.push(`${idx + 1}) [${mark}] ${String(s?.statement || "")}`);
      if (s?.reason) lines.push(`   Reason: ${String(s.reason)}`);
    });
    lines.push("");
    lines.push("Conclusion:");
    conclusion.forEach((c: any) => lines.push(`- ${String(c)}`));
    if (obj.totalMarks != null) {
      lines.push("");
      lines.push(`Total Marks: ${String(obj.totalMarks)}`);
    }

    return (
      <div style={{ display: "grid", gap: 8 }}>
        <DiagramBlock
          diagramType={diagramType}
          diagramLabels={diagramMeta.diagramLabels}
          diagramSpec={diagramMeta.diagramSpec}
          note="CBSE diagram block"
        />
        <div style={{ whiteSpace: "pre-wrap" }}>{lines.join("\n")}</div>
      </div>
    );
  }

  if (obj.kind === "learn_mindmap") {
    const lines: string[] = [];
    const bullets = Array.isArray(obj.conceptBullets) ? obj.conceptBullets : [];
    const examLines = Array.isArray(obj.examLines) ? obj.examLines : [];
    const worked = obj.workedExample || {};
    const steps = Array.isArray(worked.steps) ? worked.steps : [];

    lines.push("Concept bullets:");
    bullets.forEach((b: any) => lines.push(`- ${String(b)}`));
    if (examLines.length) {
      lines.push("");
      lines.push("CBSE exam lines:");
      examLines.forEach((l: any, idx: number) => lines.push(`${idx + 1}) ${String(l)}`));
    }
    lines.push("");
    lines.push("Worked example:");
    if (worked.question) lines.push(`Question: ${String(worked.question)}`);
    if (steps.length) {
      lines.push("Steps:");
      steps.forEach((s: any, idx: number) => lines.push(`${idx + 1}) ${String(s)}`));
    }
    if (worked.finalAnswer) lines.push(`Final Answer: ${String(worked.finalAnswer)}`);
    if (obj.commonError) {
      lines.push("");
      lines.push(`Common error: ${String(obj.commonError)}`);
    }
    if (obj.commonFix) {
      lines.push("");
      lines.push(`Common fix: ${String(obj.commonFix)}`);
    }
    if (obj.checkQuestion) {
      lines.push("");
      lines.push(`Check question: ${String(obj.checkQuestion)}`);
    }

    return (
      <div style={{ display: "grid", gap: 8 }}>
        <DiagramBlock
          diagramType={diagramType}
          diagramLabels={diagramMeta.diagramLabels}
          diagramSpec={diagramMeta.diagramSpec}
          note="CBSE diagram block"
        />
        <div style={{ whiteSpace: "pre-wrap" }}>{lines.join("\n")}</div>
      </div>
    );
  }

  if (obj.kind === "board_steps_ms") {
    const total = Number(obj.totalMarks) || undefined;
    const rawSteps = Array.isArray(obj.steps) ? obj.steps : [];
    const steps = total != null ? normalizeBoardStepMarks(rawSteps, Number(total)) : rawSteps;
    const lines: string[] = [];
    lines.push(total != null ? `Board Steps (${total} marks):` : "Board Steps:");
    steps.forEach((s: any, idx: number) => {
      const m = s && s.marks != null ? Number(s.marks) : 0;
      const text = s && s.text ? String(s.text) : "";
      lines.push("");
      lines.push(`${idx + 1}) [${m}] ${text}`);
      if (s?.whyThisGetsMarks) lines.push(`   Why: ${String(s.whyThisGetsMarks)}`);
      if (s?.commonMistake) lines.push(`   Common mistake: ${String(s.commonMistake)}`);
    });
    if (obj.finalAnswer) {
      lines.push("");
      lines.push(`Final Answer: ${String(obj.finalAnswer)}`);
    }
    if (Array.isArray(obj.warnings) && obj.warnings.length) {
      lines.push("");
      lines.push("Notes:");
      obj.warnings.slice(0, 6).forEach((w: any) => lines.push(`- ${String(w)}`));
    }

    return (
      <div style={{ display: "grid", gap: 8 }}>
        <DiagramBlock
          diagramType={diagramType}
          diagramLabels={diagramMeta.diagramLabels}
          diagramSpec={diagramMeta.diagramSpec}
          note="CBSE diagram block"
        />
        <div style={{ whiteSpace: "pre-wrap" }}>{lines.join("\n")}</div>
      </div>
    );
  }

  const lines: string[] = [];
  if (obj.kind === "hint") lines.push("Hint:");
  if (obj.kind === "final") lines.push("Final:");

  lines.push(String(obj.tutor || ""));

  if (obj.mcq && typeof obj.mcq === "object") {
    const opts = ["A", "B", "C", "D"]
      .filter((k) => obj.mcq && obj.mcq[k])
      .map((k) => `${k}. ${obj.mcq[k]}`);
    if (opts.length) {
      lines.push("");
      lines.push(...opts);
    }
  }

  if (obj.answerFormat) {
    lines.push("");
    lines.push(`Answer format: ${obj.answerFormat}`);
  }

  if (obj.kind === "final") {
    if (obj.finalAnswer) {
      lines.push("");
      lines.push(`Final Answer: ${obj.finalAnswer}`);
    }
    if (obj.boardWriteup) {
      lines.push("");
      lines.push("Board Write-up:");
      lines.push(obj.boardWriteup);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <DiagramBlock
        diagramType={diagramType}
        diagramLabels={diagramMeta.diagramLabels}
        diagramSpec={diagramMeta.diagramSpec}
        note="CBSE diagram block"
      />
      <div style={{ whiteSpace: "pre-wrap" }}>{lines.join("\n")}</div>
    </div>
  );
};

  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const requestedMode = seedExample?.requestedMode;
  const isExplainOnly = requestedMode === "explain" || requestedMode === "learn_mindmap";
  const isLearnSection = seedExample?.section === "learn";
  const subSectionKey = String(seedExample?.subSection || "").toLowerCase();
  const isLearnKeyDefinitions = isLearnSection && subSectionKey.includes("key-definitions");
  const isLearnProof = isLearnSection && subSectionKey.includes("proof");
  const resolvedMode =
    requestedMode === "explain"
      ? "explain"
      : requestedMode === "learn_mindmap"
      ? "learn_mindmap"
      : isLearnKeyDefinitions && solveStyle === "board"
      ? "learn_teach"
      : isLearnProof && solveStyle === "board"
      ? "learn_proof"
      : solveStyle === "board"
      ? "board_steps_ms"
      : "solve_with_me";

  const getLastAssistantMessage = (history: MentorChatMsg[]) => {
    for (let i = history.length - 1; i >= 0; i -= 1) {
      const msg = history[i];
      if (msg.role === "assistant") return String(msg.content || "");
    }
    return "";
  };

  const buildDoubtContext = (history: MentorChatMsg[]) => ({
    chapter: topicKey,
    cardTitle: seedExample?.title,
    cardSection: seedExample?.section,
    cardSubSection: seedExample?.subSection,
    anchor: seedExample?.anchor,
    itemTitle: seedExample?.itemTitle,
    selectedMode: resolvedMode,
    lastMentorResponse: getLastAssistantMessage(history),
  });
  const buildLessonPlanMessage = () => {
    if (!seedExample || !isLearnSection) {
      return `Problem (${seedExample?.title}): ${seedExample?.question || ""}`;
    }
    if (requestedMode === "learn_mindmap") {
      return [
        "Lesson Plan (Mindmap Teaching)",
        "- Key idea in bullets.",
        "- CBSE exam lines.",
        "- One mini example + check question.",
      ].join("\n");
    }
    if (isExplainOnly) {
      return [
        "Lesson Plan (Board Steps Teaching)",
        "- CBSE-ready steps with marks.",
        "- Clear exam lines with reasons.",
        "- Diagram labels used correctly.",
        "Goal: 1 clean line per key step.",
      ].join("\n");
    }
    if (solveStyle === "board") {
      return [
        "Lesson Plan (Board Steps Teaching)",
        "- CBSE-ready steps with marks.",
        "- Clear exam lines with reasons.",
        "- Diagram labels used correctly.",
        "Goal: 1 clean line per key step.",
      ].join("\n");
    }
    return [
      "Socratic Solve With Me Session",
      "- I ask 1 question -> you answer",
      "- I correct + continue",
    ].join("\n");
  };
  const inputPlaceholder = isExplainOnly
    ? "Ask a doubt about this explanation."
    : solveStyle === "board"
    ? "Ask a doubt about these steps."
    : "Answer mentor's question or ask a doubt.";

  useEffect(() => {
    if (!open || !seedExample?.requestedMode) return;
    if (messages.length > 0) return;
    if (seedExample.requestedMode === "board_steps" && solveStyle !== "board") {
      setSolveStyle("board");
    }
    if (seedExample.requestedMode === "solve_with_me" && solveStyle !== "socratic") {
      setSolveStyle("socratic");
    }
  }, [open, seedExample?.requestedMode, messages.length, solveStyle, setSolveStyle]);

  const resetAndKickoff = useCallback(async () => {
    if (!seedExample) return;

    const apiMode = resolvedMode;
    const firstUser: MentorChatMsg = {
      role: "user",
      content: buildLessonPlanMessage(),
    };
    setMessages([firstUser]);
    setInput("");
    setErrorText(null);

    setLoading(true);
    try {
      const res = await fetch(MENTOR_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: apiMode,
            payload: {
              subject: subjectTitle,
              grade: Number(grade),
              topicKey,
              chapter: topicKey,
              cardName: seedExample.title,
              selectedMode: resolvedMode,
              questionText: seedExample.question,
              marks: seedExample.marks,
              section: seedExample.section,
              subSection: seedExample.subSection,
              solveStyle,
            vibe: mode,
            requestedMode: seedExample.requestedMode,
            explainType: seedExample.explainType,
            itemId: seedExample.itemId,
            itemTitle: seedExample.itemTitle,
            itemText: seedExample.itemText,
            theoremFocus: seedExample.theoremFocus,
            mindmapNodeId: seedExample.mindmapNodeId,
            mindmapNodeTitle: seedExample.mindmapNodeTitle,
            mindmapCoreId: seedExample.mindmapCoreId,
            mindmapNodeText: seedExample.mindmapNodeText,
            anchor: seedExample.anchor,
            contextText: seedExample.contextText,
            doubtContext: buildDoubtContext([{ role: "user", content: firstUser.content }]),
          },
          messages: [{ role: "user", content: firstUser.content }],
        }),
      });

      const data = await res.json();
      const text = data?.data?.text ? String(data.data.text) : "";
      if (!res.ok) {
        console.warn("Mentor request failed", data?.error || data?.details || "Unknown error");
        throw new Error(isLearnSection ? "Mentor is having trouble right now. Please retry." : "Mentor request failed.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: text || "Ã¢â‚¬Â¦" }]);
    } catch (err: any) {
      console.warn("Mentor request error", err);
      setErrorText(
        isLearnSection ? "Mentor is having trouble right now. Please retry." : err?.message || "Mentor request failed."
      );
    } finally {
      setLoading(false);
    }
  }, [seedExample, grade, subjectTitle, topicKey, solveStyle, mode, resolvedMode, buildDoubtContext, isLearnSection]);

  useEffect(() => {
    if (open) {
      if (messages.length === 0) {
        if (seedExample?.requestedMode === "board_steps" && solveStyle !== "board") return;
        if (seedExample?.requestedMode === "solve_with_me" && solveStyle !== "socratic") return;
        resetAndKickoff();
      }
    } else {
      setMessages([]);
      setInput("");
      setErrorText(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seedExample, solveStyle, resetAndKickoff, messages.length]);

  const sendStudentMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setErrorText(null);
    const nextHistory: MentorChatMsg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(MENTOR_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: resolvedMode,
            payload: {
              subject: subjectTitle,
              grade: Number(grade),
              topicKey,
              chapter: topicKey,
              cardName: seedExample?.title,
              selectedMode: resolvedMode,
              questionText: (seedExample?.question || "") + "\n\nIMPORTANT: If you output JSON, do NOT wrap it in ``` code fences.",
              solveStyle,
              vibe: mode,
            section: seedExample?.section,
            subSection: seedExample?.subSection,
            marksTarget: seedExample?.marks,
            anchor: seedExample?.anchor,
            contextText: seedExample?.contextText,
            requestedMode: seedExample?.requestedMode,
            explainType: seedExample?.explainType,
            itemId: seedExample?.itemId,
            itemTitle: seedExample?.itemTitle,
            itemText: seedExample?.itemText,
            theoremFocus: seedExample?.theoremFocus,
            mindmapNodeId: seedExample?.mindmapNodeId,
            mindmapNodeTitle: seedExample?.mindmapNodeTitle,
            mindmapCoreId: seedExample?.mindmapCoreId,
            mindmapNodeText: seedExample?.mindmapNodeText,
            studentAttempt: trimmed,
            studentAnswer: trimmed,
            doubtContext: buildDoubtContext(nextHistory),
          },
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const text = data?.data?.text ? String(data.data.text) : "";
      if (!res.ok) {
        console.warn("Mentor request failed", data?.error || data?.details || "Unknown error");
        throw new Error(isLearnSection ? "Mentor is having trouble right now. Please retry." : "Mentor request failed.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: text || "Ã¢â‚¬Â¦" }]);
    } catch (err: any) {
      console.warn("Mentor request error", err);
      setErrorText(
        isLearnSection ? "Mentor is having trouble right now. Please retry." : err?.message || "Mentor request failed."
      );
    } finally {
      setLoading(false);
    }
  }, [
    input,
    loading,
    messages,
    subjectTitle,
    grade,
    topicKey,
    solveStyle,
    seedExample,
    mode,
    resolvedMode,
    buildDoubtContext,
    isLearnSection,
  ]);

  if (!open) return null;

  const drawerBg =
    mode === "beast"
      ? "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(245,247,255,0.98) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(245,255,248,0.98) 100%)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.35)",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: "min(420px, 92vw)",
          background: drawerBg,
          boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          padding: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Mentor</div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {!isExplainOnly ? (
              <>
                <button
                  onClick={() => setSolveStyle("board")}
                  style={{
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: solveStyle === "board" ? "rgba(0,0,0,0.06)" : "white",
                    padding: "6px 10px",
                    borderRadius: 999,
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                  title="CBSE-style full solution"
                >
                  Board Steps
                </button>

                <button
                  onClick={() => setSolveStyle("socratic")}
                  style={{
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: solveStyle === "socratic" ? "rgba(0,0,0,0.06)" : "white",
                    padding: "6px 10px",
                    borderRadius: 999,
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                  title="Strict Socratic tutoring"
                >
                  Solve With Me
                </button>
              </>
            ) : null}

            <button
              onClick={onClose}
              style={{
                border: "1px solid rgba(0,0,0,0.12)",
                background: "white",
                padding: "6px 10px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 900,
              }}
              title="Close"
            >
              ?
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          Vibe: <b>{mode === "beast" ? "Beast" : "Zombie"}</b> Ã‚Â·{" "}
          {seedExample?.title || "Worked example"}
        </div>

        <div
          style={{
            marginTop: 12,
            flex: 1,
            overflow: "auto",
            padding: 10,
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.10)",
            background: "rgba(255,255,255,0.6)",
          }}
        >
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    maxWidth: "92%",
                    whiteSpace: "pre-wrap",
                    padding: "10px 12px",
                    borderRadius: 14,
                    background: isUser ? "rgba(0,0,0,0.08)" : "white",
                    border: "1px solid rgba(0,0,0,0.08)",
                    fontSize: 14,
                    lineHeight: 1.35,
                  }}
                >
                  {isUser ? m.content : renderAssistantContent(m.content)}
                </div>
              </div>
            );
          })}

          {loading ? (
            <div style={{ fontSize: 13, opacity: 0.7, padding: 6 }}>
              Mentor is typingÃ¢â‚¬Â¦
            </div>
          ) : null}

          {errorText ? (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 12,
                background: "rgba(255,0,0,0.06)",
                border: "1px solid rgba(255,0,0,0.18)",
                fontSize: 13,
              }}
            >
              <div>{errorText}</div>
              <button
                type="button"
                onClick={resetAndKickoff}
                style={{
                  marginTop: 8,
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.14)",
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  background: "white",
                }}
              >
                Retry
              </button>
            </div>
          ) : null}
        </div>

        
{true ? (
  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
    <input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder={inputPlaceholder}
      onKeyDown={(e) => {
        if (e.key === "Enter") sendStudentMessage();
      }}
      style={{
        flex: 1,
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.14)",
        padding: "10px 12px",
        fontSize: 14,
        outline: "none",
        background: "white",
      }}
      disabled={loading}
    />
    <button
      onClick={sendStudentMessage}
      disabled={loading || !input.trim()}
      style={{
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.14)",
        padding: "10px 12px",
        fontSize: 14,
        fontWeight: 900,
        cursor: loading || !input.trim() ? "not-allowed" : "pointer",
        background: loading || !input.trim() ? "rgba(0,0,0,0.05)" : "white",
      }}
    >
      Send
    </button>
  </div>
) : null}

        

        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
          {isExplainOnly ? (
            <>
              Tip: In <b>Explain</b>, focus on the CBSE rule, a micro-example, and exam phrasing.
            </>
          ) : solveStyle === "socratic" ? (
            <>
              Tip: In <b>Solve With Me</b>, mentor asks one question at a time (strict Socratic).
            </>
          ) : (
            <>
              Tip: In <b>Board Steps</b>, copy the steps + marks pattern; thatÃ¢â‚¬â„¢s how CBSE awards marks.
            </>
          )}
        </div>
      </div>
    </div>
  );
}




function AccordionCard(props: { id: string; title: string; children: any; defaultOpen?: boolean }) {
  const { id, title, children, defaultOpen } = props;
  return (
    <details
      id={id}
      open={Boolean(defaultOpen)}
      style={{
        borderRadius: 18,
        padding: "14px 14px",
        background: "rgba(255,255,255,0.55)",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
      }}
    >
      <summary
        style={{
          listStyle: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          fontSize: 18,
          fontWeight: 950,
          userSelect: "none",
        }}
      >
        <span>{title}</span>
        <span style={{ opacity: 0.6, fontWeight: 900 }}>?</span>
      </summary>

      <div style={{ marginTop: 12, fontSize: 15 }}>{children}</div>
    </details>
  );
}


/** Lightweight, dependency-free mindmap renderer (SVG). Accepts multiple possible schemas. */
function MindMapCanvas(props: {
  mindMap: any;
  onAskMentor?: (seedTitle: string, seedQuestion: string) => void;
}) {
  const { mindMap, onAskMentor } = props;

  const nodes = safeArray<any>(mindMap?.nodes || mindMap?.concepts || mindMap?.items);
  const edges = safeArray<any>(mindMap?.edges || mindMap?.links || mindMap?.connections);

  const W = 920;
  const H = 520;

  const layout = useMemo(() => {
    const cleanNodes = nodes.map((n, idx) => {
      const id = String(n?.id || n?.key || idx);
      const label = String(n?.label || n?.title || n?.name || `Node ${idx + 1}`);
      const xRaw = Number(n?.x);
      const yRaw = Number(n?.y);
      return {
        id,
        label,
        description: String(n?.description || n?.note || ''),
        x: Number.isFinite(xRaw) ? xRaw : NaN,
        y: Number.isFinite(yRaw) ? yRaw : NaN,
      };
    });

    const hasXY = cleanNodes.some((n) => Number.isFinite(n.x) && Number.isFinite(n.y));
    if (hasXY) {
      // Normalize coords into viewbox
      const xs = cleanNodes.filter((n) => Number.isFinite(n.x)).map((n) => n.x);
      const ys = cleanNodes.filter((n) => Number.isFinite(n.y)).map((n) => n.y);
      const minX = Math.min(...xs, 0);
      const maxX = Math.max(...xs, 1);
      const minY = Math.min(...ys, 0);
      const maxY = Math.max(...ys, 1);
      const pad = 40;
      const scaleX = (W - pad * 2) / (maxX - minX || 1);
      const scaleY = (H - pad * 2) / (maxY - minY || 1);

      return cleanNodes.map((n) => ({
        ...n,
        x: pad + (Number.isFinite(n.x) ? (n.x - minX) * scaleX : W / 2),
        y: pad + (Number.isFinite(n.y) ? (n.y - minY) * scaleY : H / 2),
      }));
    }

    // Circle layout fallback
    const cx = W / 2;
    const cy = H / 2;
    const r = Math.min(W, H) * 0.34;
    return cleanNodes.map((n, i) => {
      const ang = (2 * Math.PI * i) / Math.max(cleanNodes.length, 1);
      return { ...n, x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
    });
  }, [mindMap, nodes.length]);

  const byId = useMemo(() => {
    const m = new Map<string, { id: string; label: string; description: string; x: number; y: number }>();
    layout.forEach((n) => m.set(n.id, n));
    return m;
  }, [layout]);

  const normalizedEdges = useMemo(() => {
    return edges
      .map((e) => {
        const from = String(e?.from || e?.source || e?.a || '');
        const to = String(e?.to || e?.target || e?.b || '');
        if (!from || !to) return null;
        return { from, to, label: String(e?.label || e?.relation || '') };
      })
      .filter(Boolean) as Array<{ from: string; to: string; label: string }>;
  }, [edges]);

  const askAboutNode = (nodeId: string) => {
    const n = byId.get(nodeId);
    if (!n || !onAskMentor) return;
    onAskMentor(
      `Mindmap Ã¢â‚¬Â¢ ${n.label}`,
      `Teach me "${n.label}" from the mindmap. Explain in CBSE-friendly steps with 2 examples and 3 quick practice questions.`
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
      <div
        style={{
          borderRadius: 18,
          border: '1px solid rgba(0,0,0,0.10)',
          background: 'rgba(255,255,255,0.72)',
          padding: 10,
          overflowX: 'auto',
        }}
      >
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {/* edges */}
          {normalizedEdges.map((e, idx) => {
            const a = byId.get(e.from);
            const b = byId.get(e.to);
            if (!a || !b) return null;
            return (
              <g key={idx}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(0,0,0,0.18)" strokeWidth={2} />
              </g>
            );
          })}

          {/* nodes */}
          {layout.map((n) => (
            <g
              key={n.id}
              onClick={() => askAboutNode(n.id)}
              style={{ cursor: onAskMentor ? 'pointer' : 'default' }}
            >
              <circle cx={n.x} cy={n.y} r={22} fill="rgba(0,0,0,0.04)" stroke="rgba(0,0,0,0.22)" strokeWidth={2} />
              <text
                x={n.x}
                y={n.y + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="900"
                fill="rgba(0,0,0,0.82)"
              >
                {n.label.length > 18 ? `${n.label.slice(0, 18)}Ã¢â‚¬Â¦` : n.label}
              </text>
            </g>
          ))}
        </svg>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
          Tip: click a node to ask Mentor (if available).
        </div>
      </div>

      {/* fallback list view */}
      {layout.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          {layout.slice(0, 18).map((n) => (
            <div
              key={n.id}
              style={{
                borderRadius: 14,
                padding: '12px 12px',
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ fontWeight: 950 }}>{n.label}</div>
              {n.description ? <div style={{ marginTop: 6, opacity: 0.9 }}>{n.description}</div> : null}
              {onAskMentor ? (
                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="pill"
                    style={{ padding: '7px 10px', fontSize: 13 }}
                    onClick={() => askAboutNode(n.id)}
                  >
                    Ask Mentor
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function GuidedMindmapPanel(props: {
  data: {
    recommendedOrder: readonly string[];
    nodes: Array<{ id: string; type: string; title: string; text?: string; links?: string[] }>;
    coreByNodeId: Record<string, { title: string; means: string; when: string[]; exam: string; trap: string }>;
    coreIdByNodeId?: Record<string, string>;
  };
  onAskMentor?: (node: {
    id: string;
    title: string;
    text?: string;
    core?: { title: string; means: string; when: string[]; exam: string; trap: string };
    coreId?: string;
  }) => void;
}) {
  const { data, onAskMentor } = props;
  const nodes = data.nodes || [];
  const [viewMode, setViewMode] = useState<"beginner" | "exam">("beginner");
  const [searchText, setSearchText] = useState("");
  const byId = useMemo(() => {
    const map = new Map<string, { id: string; type: string; title: string; text?: string; links?: string[] }>();
    nodes.forEach((n) => map.set(String(n.id), n));
    return map;
  }, [nodes]);

  const initialId = data.recommendedOrder[0] || nodes[0]?.id || "";
  const [selectedId, setSelectedId] = useState(initialId);
  const selected = byId.get(String(selectedId));
  const core = data.coreByNodeId[String(selectedId)];
  const coreId = data.coreIdByNodeId ? data.coreIdByNodeId[String(selectedId)] : undefined;

  const orderedNodes = data.recommendedOrder
    .map((id) => byId.get(id))
    .filter(Boolean) as Array<{ id: string; type: string; title: string; text?: string; links?: string[] }>;
  const guidedIdSet = useMemo(() => new Set(data.recommendedOrder.map((id) => String(id))), [data.recommendedOrder]);
  const searchTerm = searchText.trim().toLowerCase();
  const matchesSearch = useCallback(
    (n: { id: string; title: string; text?: string }) => {
      if (!searchTerm) return true;
      const coreEntry = data.coreByNodeId[String(n.id)];
      const haystack = [
        n.title,
        n.text || "",
        coreEntry?.title || "",
        coreEntry?.means || "",
        coreEntry?.exam || "",
        coreEntry?.trap || "",
        ...(coreEntry?.when || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchTerm);
    },
    [data.coreByNodeId, searchTerm]
  );
  const visibleNodes = useMemo(() => {
    const base = searchTerm
      ? nodes.filter((n) => matchesSearch(n))
      : viewMode === "beginner"
        ? nodes.filter((n) => guidedIdSet.has(String(n.id)))
        : nodes;
    return base;
  }, [nodes, searchTerm, viewMode, guidedIdSet, matchesSearch]);

  useEffect(() => {
    if (!visibleNodes.length) return;
    const hasSelected = visibleNodes.some((n) => String(n.id) === String(selectedId));
    if (!hasSelected) {
      setSelectedId(String(visibleNodes[0].id));
    }
  }, [visibleNodes, selectedId]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ fontSize: 13, opacity: 0.85 }}>
        Start at the top and follow the guided questions. Click any node to expand details.
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          className={viewMode === "beginner" ? "pill pill--on" : "pill"}
          style={{ fontSize: 12 }}
          onClick={() => setViewMode("beginner")}
        >
          Beginner mode
        </button>
        <button
          type="button"
          className={viewMode === "exam" ? "pill pill--on" : "pill"}
          style={{ fontSize: 12 }}
          onClick={() => setViewMode("exam")}
        >
          Exam mode
        </button>
        <button
          type="button"
          className="pill"
          style={{ fontSize: 12 }}
          onClick={() => {
            setSearchText("");
            setViewMode("beginner");
            if (data.recommendedOrder[0]) setSelectedId(String(data.recommendedOrder[0]));
          }}
        >
          Show guided path first
        </button>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Search</span>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Type a keyword"
            style={{
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.12)",
              padding: "6px 10px",
              fontSize: 12,
              width: 180,
            }}
          />
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Recommended order</div>
        <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          {orderedNodes.map((n) => (
            <li key={n.id}>{n.title}</li>
          ))}
        </ol>
      </div>

      {searchTerm && !visibleNodes.length ? (
        <div style={{ fontSize: 13, opacity: 0.75 }}>
          No matches. Clear search to return to the current view.
        </div>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {visibleNodes.map((n) => {
          const isActive = n.id === selectedId;
          const isGuided = guidedIdSet.has(String(n.id));
          const isMatch = searchTerm ? matchesSearch(n) : false;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => setSelectedId(n.id)}
              className={isActive ? "pill pill--on" : "pill"}
              style={{
                fontSize: 12,
                borderColor: isGuided && viewMode === "beginner" ? "rgba(46, 213, 115, 0.45)" : undefined,
                boxShadow: isMatch ? "0 0 0 2px rgba(255, 193, 7, 0.35)" : undefined,
              }}
              title={n.type}
            >
              {n.title}
            </button>
          );
        })}
      </div>

      <div
        style={{
          borderRadius: 14,
          padding: "12px 12px",
          border: "1px solid rgba(0,0,0,0.08)",
          background: "rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ fontWeight: 950, marginBottom: 6 }}>{selected?.title || "Select a node"}</div>
        {core ? (
          <div style={{ display: "grid", gap: 8, fontSize: 14, lineHeight: 1.55 }}>
            <div>
              <b>What it means:</b> {core.means}
            </div>
            {core.when.length ? (
              <div>
                <b>When used:</b>
                <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                  {core.when.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <b>Exam line:</b> {core.exam}
            </div>
            <div>
              <b>Trap to avoid:</b> {core.trap}
            </div>
          </div>
        ) : selected?.text ? (
          <div style={{ opacity: 0.9, lineHeight: 1.55 }}>{selected.text}</div>
        ) : (
          <div style={{ opacity: 0.7 }}>Select a node to view details.</div>
        )}
        {selected && onAskMentor ? (
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              className="pill"
              style={{ padding: "7px 10px", fontSize: 13 }}
              onClick={() =>
                onAskMentor({
                  id: String(selected.id),
                  title: selected.title,
                  text: selected.text,
                  core,
                  coreId,
                })
              }
            >
              Teach from this node ?
            </button>
          </div>
        ) : null}
      </div>

      <div style={{ fontSize: 12, opacity: 0.75 }}>
        Next steps: Use the Formula sheet or Top videos in Resources if you need deeper examples.
      </div>
    </div>
  );
}









function GrindDrawerV1(props: {
  open: boolean;
  onClose: () => void;
  mindmap: any;
  nodeId: string;
  setNodeId: (id: string) => void;
  grade: string;
  subjectTitle: string;
  topicKey: string;
  mode: ModeKey;
}) {
  const { open, onClose, mindmap, nodeId, setNodeId, grade, subjectTitle, topicKey } = props;

  const nodesById: Record<string, any> = mindmap?.nodesById || {};
  const highways: any[] = Array.isArray(mindmap?.highways) ? mindmap.highways : [];
  const activeNode = nodesById[nodeId] || null;

  const [doubtInput, setDoubtInput] = useState("");
  const [doubtAnswer, setDoubtAnswer] = useState<string | null>(null);
  const [doubtError, setDoubtError] = useState<string | null>(null);
  const [doubtLoading, setDoubtLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) {
      setDoubtInput("");
      setDoubtAnswer(null);
      setDoubtError(null);
      setDoubtLoading(false);
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    // Clear inline doubt thread when switching nodes
    setDoubtAnswer(null);
    setDoubtError(null);
  }, [nodeId]);

  const stop = () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = null;
    setDoubtLoading(false);
  };

  const submitDoubt = async () => {
    const q = String(doubtInput || '').trim();
    if (!q) return;
    if (doubtLoading) return;

    setDoubtLoading(true);
    setDoubtError(null);
    setDoubtAnswer(null);

    stop();
    const controller = new AbortController();
    abortRef.current = controller;

    const nodeTitle = String(activeNode?.title || 'Triangles');
    const context = [
      `Topic: ${topicKey} (Class ${grade} ${subjectTitle})`,
      `Grind node: ${nodeTitle} (${String(activeNode?.nodeId || nodeId)})`,
      activeNode?.rubric ? `Rubric (${activeNode.rubric.totalMarksTypical} marks typical): ` + (Array.isArray(activeNode.rubric.checkpoints) ? activeNode.rubric.checkpoints.map((c: any) => `${c.label} (${c.marks})`).join('; ') : '') : '',
      Array.isArray(activeNode?.solutionSkeleton) ? 'Board skeleton: ' + activeNode.solutionSkeleton.map((s: any) => s.heading).join(' -> ') : '',
      Array.isArray(activeNode?.commonMistakes) ? 'Common traps: ' + activeNode.commonMistakes.map((m: any) => String(m.studentFriendly)).slice(0, 3).join(' | ') : '',
    ].filter(Boolean).join('\n');
    const nodeText = String(activeNode?.text || activeNode?.description || '');
    const selectedNodeId = String(activeNode?.nodeId || nodeId || '');
    const subtopicCandidate =
      activeNode?.subtopicKey || activeNode?.conceptKey || activeNode?.chapter || topicKey || '';
    const subtopicKey = String(subtopicCandidate || '').trim();
    const difficultyRaw =
      typeof activeNode?.difficulty === 'string' && activeNode.difficulty.trim()
        ? activeNode.difficulty.trim()
        : '';
    const difficultyValue = difficultyRaw ? difficultyRaw.toLowerCase() : 'medium';
    const marksCandidate =
      activeNode?.rubric?.totalMarksTypical ??
      activeNode?.rubric?.total_marks ??
      activeNode?.marks ??
      activeNode?.examWeight ??
      null;
    const marksValue = Number(marksCandidate);
    const includeMarks = Number.isFinite(marksValue) && marksValue > 0;

    try {
      const body = {
        mode: 'grind_triangles_v1',
        payload: {
          subject: subjectTitle,
          grade: Number(grade),
          topicKey,
          chapter: topicKey,
          section: 'grind',
          subSection: 'inline-doubt',
          cardTitle: nodeTitle,
          cardId: selectedNodeId,
          mindmapNodeId: selectedNodeId,
          mindmapNodeTitle: nodeTitle,
          mindmapNodeText: nodeText,
          doubtContext: context,
          contextText: context,
          questionText: q,
          difficulty: difficultyValue,
          ...(subtopicKey ? { subtopicKey } : {}),
          ...(includeMarks ? { marks: marksValue } : {}),
        },
        messages: [{ role: 'user', content: `Student doubt: ${q}` }],
      };

      const res = await fetch(MENTOR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Mentor request failed.');

      const txt = String(data?.data?.text || '').trim();
      const structured = data?.data?.structured;
      if (txt) setDoubtAnswer(txt);
      else if (structured) setDoubtAnswer(JSON.stringify(structured, null, 2));
      else setDoubtAnswer('No answer returned. Please retry.');
    } catch (e: any) {
      if (String(e?.name || '') === 'AbortError') return;
      setDoubtError(String(e?.message || 'Failed to get answer.'));
    } finally {
      setDoubtLoading(false);
      abortRef.current = null;
    }
  };

  const trianglesContract = useMemo(() => {
    if (typeof doubtAnswer !== "string") return null;
    try {
      const parsed = JSON.parse(doubtAnswer);
      if (parsed && parsed.type === "grind_triangles_v1") return parsed;
    } catch {
      return null;
    }
    return null;
  }, [doubtAnswer]);
  const boardForContract = trianglesContract?.board || null;
  const contractRubric = trianglesContract?.rubric || null;
  const contractCommonTraps = safeArray(trianglesContract?.commonTraps);
  const contractMicroDrills = safeArray(trianglesContract?.microDrills);
  const contractSectionStyle = {
    borderRadius: 14,
    padding: "12px",
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(255,255,255,0.92)",
  };
  const renderArrayField = (label: string, values: string[]) => (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(0,0,0,0.6)" }}>
        {label}
      </div>
      {values.length ? (
        <div style={{ marginTop: 6, display: "grid", gap: 4 }}>
          {values.map((value, idx) => (
            <div key={`${label}-${idx}`} style={{ fontSize: 13, lineHeight: 1.45 }}>
              {value}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 6, opacity: 0.65 }}>Not provided</div>
      )}
    </div>
  );

  if (!open || !mindmap) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0,0,0,0.38)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 'min(1100px, 100%)',
          height: '100%',
          background: 'rgba(255,255,255,0.98)',
          borderLeft: '1px solid rgba(0,0,0,0.10)',
          boxShadow: '-14px 0 40px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            borderBottom: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <div>
            <div style={{ fontWeight: 950, fontSize: 16 }}>Grind</div>
            <div style={{ fontSize: 12, opacity: 0.72 }}>Triangles • Marks roadmap • Rubrics + board skeletons</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="pill"
              style={{ padding: '8px 12px' }}
              onClick={() => { stop(); onClose(); }}
            >
              Close
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 0 }}>
          {/* Left nav */}
          <div
            style={{
              borderRight: '1px solid rgba(0,0,0,0.08)',
              padding: '12px 12px',
              overflow: 'auto',
            }}
          >
            {highways.map((h) => {
              const order = Array.isArray(h.recommendedNodeOrder) ? h.recommendedNodeOrder : [];
              if (!order.length) return null;
              return (
                <div key={String(h.id)} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 950, fontSize: 13, marginBottom: 6 }}>{String(h.title || h.id)}</div>
                  <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 8, lineHeight: 1.35 }}>{String(h.intent || '')}</div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {order.map((id: string) => {
                      const n = nodesById[id];
                      const active = String(id) === String(nodeId);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setNodeId(String(id))}
                          style={{
                            textAlign: 'left',
                            padding: '10px 10px',
                            borderRadius: 14,
                            border: active ? '1px solid rgba(17,24,39,0.22)' : '1px solid rgba(0,0,0,0.10)',
                            background: active ? 'rgba(17,24,39,0.06)' : 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ fontWeight: 900, fontSize: 13 }}>{String(n?.title || id)}</div>
                          <div style={{ fontSize: 12, opacity: 0.72, marginTop: 2 }}>
                            Weight {String(n?.examWeight || '')} • {String(n?.difficulty || '')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coach panel */}
          <div style={{ padding: '14px 14px', overflow: 'auto' }}>
            {!activeNode ? (
              <div style={{ opacity: 0.75 }}>Pick a node to start.</div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 950, letterSpacing: -0.2 }}>{String(activeNode.title)}</div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.10)' }}>
                        Weight: {String(activeNode.examWeight)}
                      </span>
                      <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.10)' }}>
                        Difficulty: {String(activeNode.difficulty)}
                      </span>
                      {Array.isArray(activeNode.questionTypes) ? (
                        <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.10)' }}>
                          Types: {activeNode.questionTypes.join(', ')}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                  {/* Rubric */}
                  {activeNode.rubric ? (
                    <div style={{ borderRadius: 16, padding: '12px 12px', border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.72)' }}>
                      <div style={{ fontWeight: 950 }}>Rubric (typical {String(activeNode.rubric.totalMarksTypical)} marks)</div>
                      <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                        {Array.isArray(activeNode.rubric.checkpoints)
                          ? activeNode.rubric.checkpoints.map((c: any) => (
                              <div key={String(c.id)} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                <div style={{ lineHeight: 1.4 }}>• {String(c.label)}</div>
                                <div style={{ fontWeight: 900, opacity: 0.8 }}>{String(c.marks)}m</div>
                              </div>
                            ))
                          : null}
                      </div>
                    </div>
                  ) : null}

                  {/* Board skeleton */}
                  {Array.isArray(activeNode.solutionSkeleton) && activeNode.solutionSkeleton.length ? (
                    <div style={{ borderRadius: 16, padding: '12px 12px', border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.72)' }}>
                      <div style={{ fontWeight: 950 }}>Board-style skeleton</div>
                      <ol style={{ margin: '10px 0 0', paddingLeft: 18 }}>
                        {activeNode.solutionSkeleton.map((s: any) => (
                          <li key={String(s.id)} style={{ marginBottom: 8, lineHeight: 1.45 }}>
                            <b>{String(s.heading)}</b>
                            <span style={{ opacity: 0.75 }}> • {String(s.expectedForm)}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}

                  {/* Mistakes */}
                  {Array.isArray(activeNode.commonMistakes) && activeNode.commonMistakes.length ? (
                    <div style={{ borderRadius: 16, padding: '12px 12px', border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.72)' }}>
                      <div style={{ fontWeight: 950 }}>Common traps (and fixes)</div>
                      <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                        {activeNode.commonMistakes.map((m: any) => (
                          <div key={String(m.tag)} style={{ borderRadius: 14, padding: '10px 10px', border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)' }}>
                            <div style={{ fontWeight: 900 }}>{String(m.studentFriendly)}</div>
                            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.88 }}><b>Fix:</b> {String(m.fixTip)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Micro-drills */}
                  {Array.isArray(activeNode.microDrills) && activeNode.microDrills.length ? (
                    <div style={{ borderRadius: 16, padding: '12px 12px', border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.72)' }}>
                      <div style={{ fontWeight: 950 }}>Micro-drills</div>
                      <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                        {activeNode.microDrills.map((d: any) => (
                          <div key={String(d.id)} style={{ borderRadius: 14, padding: '10px 10px', border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)' }}>
                            <div style={{ fontWeight: 900 }}>{String(d.prompt)}</div>
                            {Array.isArray(d.expectedAnswerHints) && d.expectedAnswerHints.length ? (
                              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                                <b>Hint words:</b> {d.expectedAnswerHints.join(', ')}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Inline doubt */}
                  <div style={{ borderRadius: 16, padding: '12px 12px', border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.72)' }}>
                    <div style={{ fontWeight: 950 }}>Ask a doubt</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <input
                        value={doubtInput}
                        onChange={(e) => setDoubtInput(e.target.value)}
                        placeholder="Type your doubt..."
                        style={{
                          flex: 1,
                          minWidth: 220,
                          padding: '10px 12px',
                          borderRadius: 12,
                          border: '1px solid rgba(0,0,0,0.12)',
                          outline: 'none',
                        }}
                      />
                      <button type="button" className="pill" onClick={submitDoubt} disabled={doubtLoading || !String(doubtInput).trim()}>
                        {doubtLoading ? 'Thinking...' : 'Send'}
                      </button>
                      {doubtLoading ? (
                        <button type="button" className="pill" onClick={stop} style={{ opacity: 0.8 }}>
                          Stop
                        </button>
                      ) : null}
                    </div>
                    {doubtError ? (
                      <div style={{ marginTop: 10, color: 'rgba(185,28,28,0.95)', fontSize: 13 }}>{doubtError}</div>
                    ) : null}
                    {doubtAnswer ? (
                      trianglesContract ? (
                        <div
                          style={{
                            marginTop: 10,
                            borderRadius: 14,
                            border: '1px solid rgba(0,0,0,0.08)',
                            background: 'rgba(255,255,255,0.92)',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                          }}
                        >
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 950, fontSize: 15 }}>
                              {String(trianglesContract.node?.title || 'Grind node summary')}
                            </div>
                            {trianglesContract.node?.id ? (
                              <div style={{ fontSize: 12, opacity: 0.7 }}>ID: {trianglesContract.node.id}</div>
                            ) : null}
                          </div>
                          <div style={{ display: 'grid', gap: 12 }}>
                            <div style={contractSectionStyle}>
                              <div style={{ fontWeight: 900 }}>Board</div>
                              <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                                {renderArrayField('Given facts', safeArray(boardForContract?.given))}
                                {renderArrayField('To prove', safeArray(boardForContract?.toProve))}
                                {renderArrayField('Figure hints', safeArray(boardForContract?.figureHints))}
                                {renderArrayField('Steps', safeArray(boardForContract?.steps))}
                              </div>
                            </div>
                            <div style={contractSectionStyle}>
                              <div style={{ fontWeight: 900 }}>Rubric</div>
                              <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: 13, opacity: 0.8 }}>Marks: {contractRubric?.marks ?? 'N/A'}</div>
                                {renderArrayField('Checkpoints', safeArray(contractRubric?.checkpoints))}
                              </div>
                            </div>
                            {contractCommonTraps.length ? (
                              <div style={contractSectionStyle}>
                                <div style={{ fontWeight: 900 }}>
                                  Common traps <span style={{ fontSize: 12, opacity: 0.7 }}>(with fixes)</span>
                                </div>
                                <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                                  {contractCommonTraps.map((trap, idx) => (
                                    <div
                                      key={idx}
                                      style={{
                                        borderRadius: 12,
                                        padding: '10px',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        background: 'rgba(0,0,0,0.01)',
                                      }}
                                    >
                                      <div style={{ fontWeight: 900, fontSize: 13 }}>
                                        {String(trap?.trap || 'Trap missing')}
                                      </div>
                                      <div
                                        style={{
                                          marginTop: 6,
                                          fontSize: 12,
                                          opacity: 0.85,
                                        }}
                                      >
                                        <strong>Fix:</strong> {String(trap?.fix || 'Fix missing')}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            {contractMicroDrills.length ? (
                              <div style={contractSectionStyle}>
                                <div style={{ fontWeight: 900 }}>Micro drills</div>
                                <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                                  {contractMicroDrills.map((drill, idx) => (
                                    <div
                                      key={idx}
                                      style={{
                                        borderRadius: 12,
                                        padding: '10px',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        background: 'rgba(0,0,0,0.01)',
                                      }}
                                    >
                                      <div style={{ fontWeight: 900, fontSize: 13 }}>
                                        {String(drill?.prompt || 'Prompt missing')}
                                      </div>
                                      <div
                                        style={{
                                          marginTop: 4,
                                          fontSize: 12,
                                          opacity: 0.85,
                                        }}
                                      >
                                        Answer key: {String(drill?.answerKey || 'Not provided')}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            {trianglesContract.next ? (
                              <div style={contractSectionStyle}>
                                <div style={{ fontWeight: 900 }}>Next</div>
                                <div style={{ marginTop: 8, fontSize: 13 }}>
                                  <div>
                                    Recommended node: {String(trianglesContract.next.recommendedNodeId || 'Unknown')}
                                  </div>
                                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                                    Reason: {String(trianglesContract.next.reason || 'No reason provided')}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <pre
                          style={{
                            marginTop: 10,
                            whiteSpace: 'pre-wrap',
                            borderRadius: 14,
                            padding: '10px 10px',
                            background: 'rgba(0,0,0,0.03)',
                            border: '1px solid rgba(0,0,0,0.08)',
                            lineHeight: 1.45,
                            fontSize: 13,
                          }}
                        >
                          {doubtAnswer}
                        </pre>
                      )
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
