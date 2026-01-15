﻿// src/pages/TopicHub.tsx
// TopicHub (MAIN-safe):
// - Works for BOTH /topic-hub/:grade/:subject and /topic-hub/:grade/:subject/:topicKey
// - If topicKey is missing -> redirects to a sane default (never blank)
// - Renders baked TopicHubV2 content (base + enrichment)
// - Implements the locked UI direction: sticky action bar + progressive disclosure (accordions)

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { getTopicV2Content, normalizeTopicKey } from "../utils/topicHubV2Store";
import { topicHubV2Content } from "../data/topicHubV2Full";
import type { TopicHubV2Content, V2Definition, V2Example, Misconception, Competency, LabActivity, CaseStudy } from "../utils/getTopicV2Content";
import { PredictionCore } from "../data/predictionCore";
import { generatePracticeSet } from "../data/practiceSetGenerator";
import { useVibeMode } from "../context/vibeModeContext";
import { trianglesGuidedMindmap } from "../data/trianglesGuidedMindmap";
import { DiagramBlock } from "../components/DiagramBlock";

type SubjectKey = "maths" | "science";
type ModeKey = "zombie" | "beast";
type RequestedMentorMode = "explain" | "board_steps" | "solve_with_me";
type ExplainType = "misconception" | "competency" | "mindmap_node" | "general";

type MentorChatMsg = { role: "user" | "assistant"; content: string };

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
            Class {grade} • {subject.toUpperCase()}
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
// Board-pattern anchors (A–E) pulled from the canonical question bank for this topic.
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

      const header = `Class ${grade} ${subjectTitle} • ${title}`;
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
In ΔABC and ΔPQR, ∠A = ∠P and ∠B = ∠Q. What can you conclude?

A) ΔABC ≅ ΔPQR
B) ΔABC ~ ΔPQR
C) Areas of triangles are equal
D) Nothing definite can be said

Rules: Pick ONE correct option.`;
          case "B":
            return `${header}

${diagramLine}

Pattern B (${marks} marks, short answer):
In ΔABC, D lies on AB and E lies on AC. If DE ∥ BC, AD = 3 cm, DB = 6 cm and EC = 8 cm, find AE.`;
          case "C":
            return `${header}

Pattern C (${marks} marks):
(i) In ΔABC, ∠A = 50°, ∠B = 60°. In ΔPQR, ∠P = 50°, ∠Q = 60°. Prove ΔABC ~ ΔPQR.
(ii) If AB = 5 cm and PQ = 10 cm, find the ratio of areas of ΔABC and ΔPQR.`;
          case "D":
            return `${header}

${diagramLine}

Pattern D (${marks} marks, typical board steps):
In ΔABC, D is a point on AB and E is a point on AC such that DE ∥ BC.
Given AD = 2 cm, DB = 3 cm and AC = 10 cm.
Find AE and EC.`;
          case "E":
            return `${header}

${diagramLine}

Pattern E (${marks} marks, mixed concept):
In a right triangle ΔABC right-angled at A, AD is drawn perpendicular to BC (D lies on BC).
(i) Prove that AB² = BD · BC and AC² = CD · BC.
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
              ← Trends
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
              Class {grade} • {subject.toUpperCase()}
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
                  onClick={() =>
                    openMentorDrawer({
                      title: `${title} • Key definitions`,
                      question: `Explain the key definitions in ${title} (Class ${grade} ${subjectTitle}).

- Write each definition in NCERT/CBSE exam language (what the student should write).
- Give 2 examples for each: one easy + one board-style.
- If the topic is geometry, include a labelled diagram description and reference it clearly.
- End with 3 common mistakes + the quick fix.`,
                      solveStyle: "socratic",
                      section: "learn",
                      subSection: "key-definitions",
                    })
                  }
                >
                  Ask Mentor →
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
                  const coreText = node.core
                    ? [
                        `What it means: ${node.core.means}`,
                        node.core.when.length ? `When used: ${node.core.when.join("; ")}` : "",
                        `Exam line: ${node.core.exam}`,
                        `Trap: ${node.core.trap}`,
                      ]
                        .filter(Boolean)
                        .join("\n")
                    : node.text || "";
                  openMentorDrawer({
                    title: `Mindmap — ${node.title}`,
                    question: `Teach from the mindmap node "${node.title}".`,
                    solveStyle: "socratic",
                    section: "learn",
                    subSection: "mindmap",
                    requestedMode: "explain",
                    explainType: "mindmap_node",
                    itemId: node.id,
                    itemTitle: node.title,
                    itemText: node.text || node.core?.means || "",
                    contextText: coreText,
                    mindmapNodeId: node.id,
                    mindmapNodeTitle: node.title,
                    mindmapCoreId: node.coreId,
                    mindmapNodeText: node.text || node.core?.means || "",
                  });
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
                          onClick={() =>
                            openMentorDrawer({
                              title: `Proof writing  ${t.title}`,
                              question: t.question,
                              solveStyle: "socratic",
                              requestedMode: "solve_with_me",
                              marks: t.marks,
                              section: "learn",
                              subSection: "proof-writing",
                              theoremFocus: [t.focus],
                              contextText: t.hints.join(" "),
                            })
                          }
                          title="Practice step-by-step with Mentor"
                        >
                          Practice (Solve With Me) 
                        </button>
                        <button
                          type="button"
                          className="pill"
                          style={{ padding: "7px 10px", fontSize: 13 }}
                          onClick={() =>
                            openMentorDrawer({
                              title: `Proof writing  ${t.title}  Board steps`,
                              question: t.question,
                              solveStyle: "board",
                              requestedMode: "board_steps",
                              marks: t.marks,
                              section: "learn",
                              subSection: "proof-writing",
                              theoremFocus: [t.focus],
                              contextText: t.hints.join(" "),
                            })
                          }
                          title="See CBSE board-scoring steps with marks"
                        >
                          Board Steps 
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
                  onClick={() =>
                    openMentorDrawer({
                      title: `${title} • Common misconceptions`,
                      question: `Act like a CBSE Class ${grade} teacher. For ${title}:

1) List the TOP 5 common misconceptions students have.
2) For each, show the WRONG thinking, then the CORRECT thinking.
3) Give 1 short example per misconception.
4) If geometry, include a labelled diagram description wherever it helps.
5) End with a 30-second revision checklist.`,
                      solveStyle: "socratic",
                    })
                  }
                >
                  Ask Mentor →
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
                    const joined = scoreTips.slice(0, 10).map((x, i) => `${i + 1}. ${String(x || "")}`).join("\n");
                    openMentorDrawer({
                      title: `Score tips · ${title}`,
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
                  Ask Mentor →
                </button>
              </div>
            </AccordionCard>
          )}
     {isGrind && showInZombie("worked-examples") && (
  <AccordionCard id="worked-examples" title="Worked examples (Board patterns A–E)">
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
                Example • Pattern {exampleSection}{" "}
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
                Practice this type →
              </button>

              <button
                type="button"
                className="pill"
                onClick={() =>
                  openMentorDrawer({
                    title: `Pattern ${exampleSection} • ${title}`,
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
                Ask Mentor →
              </button>
            </div>

            {!isAnchor ? (
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                Note: this is an auto-sample because your bank doesn’t have a stored anchor for
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
                    Example · Pattern {exampleSection} {typeof marks === "number" ? `· ${marks} marks` : ""}
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
                          if (!list.length) return;
                          openMentorDrawer({
                            title: `NCERT competency · ${cid}`,
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
                        Ask Mentor →
                      </button>

                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        Selected: <b>{cid}</b>
                        {bloom ? <span> • {bloom}</span> : null}
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
                              <span style={{ opacity: 0.7 }}> • {String(c.bloomLevel)}</span>
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
                      title: `${title} • Lab / activities`,
                      question: `Help me prepare for lab/activities in ${title}. Give the objective, steps, observations, and 2 viva questions with answers.`,
                      solveStyle: "board",
                    })
                  }
                >
                  Ask Mentor →
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
                  Quick revision kit for <b>{title}</b> — mindmap, formula sheet, and top videos.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    type="button"
                    className="pill"
                    onClick={() =>
                      openMentorDrawer({
                        title: `${title} • Resources`,
                        question: `Make me a 10-minute revision plan for ${title}. Keep it CBSE-focused and marks-friendly.`,
                        solveStyle: "socratic",
                      })
                    }
                  >
                    Ask Mentor →
                  </button>
                </div>
              </AccordionCard>

              <AccordionCard id="mindmap" title="Mindmap" defaultOpen>
                {!mindMap ? (
                  <div style={{ fontSize: 13, opacity: 0.8 }}>
                    Mindmap coming soon for this topic. (We’ll auto-fill as the bank grows.)
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
                                  title: `${title} • Formula`,
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
                                Open PDF ↗
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
                              Open video ↗
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
                                  title: `${title} • Video recap`,
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

    const note =
      "⚠️ Mentor returned an incomplete structured response (looks like Board Steps). Please click **Board Steps** again.";
    return (keep ? keep + "\n\n" : "") + note;
  }

  return stripped;
}


  // Board steps (one-shot) — show full marking scheme in an exam-friendly format.
  if (obj.kind === "board_steps_ms") {
    const total = Number(obj.totalMarks) || undefined;
    const steps = Array.isArray(obj.steps) ? obj.steps : [];
    const lines: string[] = [];
        const sumMarks = steps.reduce((acc: number, s: any) => {
      const m = s && s.marks != null ? Number(s.marks) : 0;
      return acc + (Number.isFinite(m) ? m : 0);
    }, 0);
    const headerSuffix = total
      ? ` (Total: ${total} marks · Steps: ${sumMarks} marks)`
      : sumMarks
      ? ` (Steps: ${sumMarks} marks)`
      : "";
    lines.push(`🧾 Board Steps + Marking Scheme${headerSuffix}`);

    if (total != null && Number.isFinite(total) && sumMarks && total !== sumMarks) {
      lines.push(`⚠️ Marking check: step-marks sum to ${sumMarks}, expected ${total}. (Continue with step-wise marks as shown.)`);
    }

    steps.forEach((s: any, idx: number) => {
      const m = s && s.marks != null ? Number(s.marks) : 0;
      const text = s && s.text ? String(s.text) : "";
      lines.push("");
      lines.push(`${idx + 1}) [${m}] ${text}`);
      if (s?.whyThisGetsMarks) lines.push(`   • Why: ${String(s.whyThisGetsMarks)}`);
      if (s?.commonMistake) lines.push(`   • Common mistake: ${String(s.commonMistake)}`);
    });

    if (obj.finalAnswer) {
      lines.push("");
      lines.push(`✅ Final Answer: ${String(obj.finalAnswer)}`);
    }
    if (Array.isArray(obj.warnings) && obj.warnings.length) {
      lines.push("");
      lines.push("⚠️ Notes:");
      obj.warnings.slice(0, 6).forEach((w: any) => lines.push(`- ${String(w)}`));
    }
    return prefix + lines.join("\n");
  }

  // Default: Solve With Me protocol (question/hint/final)
  const lines: string[] = [];
  if (obj.kind === "hint") lines.push("💡 Hint:");
  if (obj.kind === "final") lines.push("✅ Final:");

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
  const isExplainOnly = requestedMode === "explain";
  const resolvedMode =
    requestedMode === "explain"
      ? "explain"
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
      content: `Problem (${seedExample.title}): ${seedExample.question}`,
    };
    setMessages([firstUser]);
    setInput("");
    setErrorText(null);

    setLoading(true);
    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: apiMode,
          payload: {
            subject: subjectTitle,
            grade: Number(grade),
            topicKey,
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
        throw new Error(data?.error || data?.details || "Mentor request failed");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: text || "…" }]);
    } catch (err: any) {
      setErrorText(err?.message || "Failed to get mentor response");
    } finally {
      setLoading(false);
    }
  }, [seedExample, grade, subjectTitle, topicKey, solveStyle, mode, resolvedMode, buildDoubtContext]);

  useEffect(() => {
    if (open) {
      if (messages.length === 0) {
        if (seedExample?.requestedMode === "board_steps" && solveStyle !== "board") return;
        if (seedExample?.requestedMode === "solve_with_me" && solveStyle !== "socratic") return;
      }
      resetAndKickoff();
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
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: resolvedMode,
          payload: {
            subject: subjectTitle,
            grade: Number(grade),
            topicKey,
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
            doubtContext: buildDoubtContext(nextHistory),
          },
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const text = data?.data?.text ? String(data.data.text) : "";
      if (!res.ok) {
        throw new Error(data?.error || data?.details || "Mentor request failed");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: text || "…" }]);
    } catch (err: any) {
      setErrorText(err?.message || "Failed to get mentor response");
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, subjectTitle, grade, topicKey, solveStyle, seedExample, mode, resolvedMode, buildDoubtContext]);

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
              ✕
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          Vibe: <b>{mode === "beast" ? "Beast" : "Zombie"}</b> ·{" "}
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
              Mentor is typing…
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
              {errorText}
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
              Tip: In <b>Board Steps</b>, copy the steps + marks pattern; that’s how CBSE awards marks.
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
        <span style={{ opacity: 0.6, fontWeight: 900 }}>▾</span>
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
      `Mindmap • ${n.label}`,
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
                {n.label.length > 18 ? `${n.label.slice(0, 18)}…` : n.label}
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
              Teach from this node →
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
