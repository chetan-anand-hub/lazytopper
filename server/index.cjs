// server/index.cjs
//
// LazyTopper AI Gateway server (Gemini-powered)
// - POST /api/mentor         : Mentor personas (plan / explain / solve / coach / mindset)
// - POST /api/more-like-this : HPQ-anchored "more like this" question variants
// - GET  /health, /api/health: basic health checks
//
// Node 18+ recommended.
//
// Auth (recommended):
//   Put GEMINI_API_KEY and optional GEMINI_MODEL into server/.env
//   Example:
//     GEMINI_API_KEY=your_key_here
//     GEMINI_MODEL=gemini-2.5-flash
//
// The server will also read GEMINI_API_KEY / GOOGLE_API_KEY from environment variables if set.

const http = require('http');
const fs = require('fs');
const path = require('path');

function loadDotEnvIfPresent() {
  // Load ONLY server/.env by default, without external dependencies.
  // This keeps secrets out of git and avoids requiring `dotenv`.
  const envPath = path.join(__dirname, '.env');
  try {
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = String(line || '').trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const k = trimmed.slice(0, eq).trim();
      let v = trimmed.slice(eq + 1).trim();
      // Strip surrounding quotes
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (k && process.env[k] == null) process.env[k] = v;
    });
  } catch (e) {
    // Don't crash server if env file is malformed; log and continue.
    console.warn('[env] Failed to load server/.env:', e.message);
  }
}
loadDotEnvIfPresent();

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_MODEL_ZOMBIE = process.env.GEMINI_MODEL_ZOMBIE || '';
const GEMINI_MODEL_BEAST = process.env.GEMINI_MODEL_BEAST || '';

/**
 * Helper to send JSON with CORS headers.
 * @param {import('http').ServerResponse} res
 * @param {number} status
 * @param {any} body
 */
function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
}

function tryParseJsonStrict(text) {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function isValidMentorProtocol(obj, mode) {
  if (!obj || typeof obj !== 'object') return false;

  // Board-steps protocol: strict envelope
  if (mode === 'board_steps_ms') {
    if (obj.kind !== 'board_steps_ms') return false;
    return typeof obj.totalMarks === 'number' && Array.isArray(obj.steps);
  }

  // Solve-with-me protocol: frontend expects a SINGLE turn object:
  // { kind: "question" | "hint" | "final", tutor: string, ... }
  // Keep backward compatibility for older { kind: "solve_with_me", turns: [...] } shapes.
  if (mode === 'solve_with_me') {
    if (obj.kind === 'solve_with_me') return Array.isArray(obj.turns);

    if (obj.kind !== 'question' && obj.kind !== 'hint' && obj.kind !== 'final') return false;
    if (typeof obj.tutor !== 'string' || !String(obj.tutor).trim()) return false;
    return true;
  }

  // Unknown protocol mode
  return false;
}


/**
 * Read request body as JSON.
 * @param {import('http').IncomingMessage} req
 */
function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk.toString()));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        reject(e);
      }
    });
  });
}

/**
 * Build a user prompt for plan mode.
 * @param {any} payload
 */
function buildPlanUserPrompt(payload) {
  const subject = payload.subject || 'Maths & Science';
  const daysLeft = payload.daysLeft != null ? payload.daysLeft : 60;
  const targetPercent = payload.targetPercent != null ? payload.targetPercent : 95;
  const hours =
    typeof payload.hoursPerDay === 'number'
      ? payload.hoursPerDay
      : payload.hoursPerDay && typeof payload.hoursPerDay.total === 'number'
      ? payload.hoursPerDay.total
      : 2;
  const topicKey = payload.topicKey || null;

  const lines = [
    `Create a practical CBSE Class 10 ${subject} study plan.`,
    `Target score around ${targetPercent}%.`,
    `There are about ${daysLeft} days left until the board exam.`,
    `The student can study roughly ${hours} hours per day.`,
    topicKey ? `Prioritise topicKey "${topicKey}" and similar high-yield topics.` : '',
    payload.extraNotes ? `Extra context: ${payload.extraNotes}` : '',
    'Break the plan into weeks and days with clear tasks (practice, revision, mocks).',
  ].filter(Boolean);

  return lines.join(' ');
}

/**
 * Build a user prompt for solve mode.
 * @param {any} payload
 */
function buildSolveUserPrompt(payload) {
  const subject = payload.subject || 'Maths/Science';
  const marks = payload.marks != null ? payload.marks : '';
  const questionText = payload.questionText || payload.question || payload.prompt || '';
  return [
    `Solve the following CBSE Class 10 ${subject} board-style question step by step.`,
    marks ? `The question carries ${marks} marks.` : '',
    'Use Socratic-friendly micro-steps (no big jumps).',
    'End with a clearly labeled final answer.',
    '',
    String(questionText || '').trim(),
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Build a user prompt for explain mode.
 * @param {any} payload
 */
function buildExplainUserPrompt(payload) {
  const subject = payload.subject || 'Maths/Science';
  const topic = payload.topic || payload.topicKey || '';
  const questionText = payload.questionText || payload.question || payload.prompt || '';
  const diagramLine = shouldRequireDiagram(payload) ? diagramLineForExplain(payload) : '';
  const doubtContext = formatDoubtContext(payload);
  const parts = [
    `Explain this CBSE Class 10 ${subject} concept in simple, exam-oriented language.`,
    topic ? `Topic / chapter focus: ${topic}.` : '',
    'Use short bullet steps, key formulas, and 1–2 quick examples if helpful.',
    diagramLine ? `Include this diagram line in the example: ${diagramLine}.` : '',
    doubtContext ? `${doubtContext}` : '',
  ];
  if (questionText) {
    parts.push('Use the following board-style question as context:');
    parts.push(String(questionText).trim());
  }
  return parts.filter(Boolean).join(' ');
}

function isLearnMisconceptionPayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  const section = String(payload.section || '').toLowerCase();
  const subSection = String(payload.subSection || '').toLowerCase();
  const explainType = String(payload.explainType || '').toLowerCase();
  const itemId = String(payload.itemId || '').toLowerCase();
  if (section !== 'learn') return false;
  if (subSection.includes('misconception')) return true;
  if (explainType === 'misconception') return true;
  if (itemId.startsWith('misconception')) return true;
  return false;
}

function buildMisconceptionExplainPrompt(payload) {
  const subject = payload.subject || 'Maths/Science';
  const topic = payload.topic || payload.topicKey || '';
  const itemTitle = payload.itemTitle || payload.concept || payload.title || '';
  const itemText = payload.itemText || payload.commonError || payload.contextText || '';
  const diagramLine = shouldRequireDiagram(payload) ? diagramLineForExplain(payload) : '';
  const doubtContext = formatDoubtContext(payload);
  const lines = [
    `Explain this misconception for CBSE Class 10 ${subject}.`,
    topic ? `Topic: ${topic}.` : '',
    itemTitle ? `Misconception title: ${itemTitle}.` : '',
    itemText ? `Misconception detail: ${itemText}.` : '',
    '',
    'Return EXACTLY these five sections in order (no extra headings, no JSON, no questions):',
    '1) Misconception',
    "2) Why it's wrong",
    '3) Correct CBSE rule/theorem',
    '4) Micro-example',
    '5) Exam tip',
    '',
    'Rules:',
    '- 1-3 short lines per section.',
    '- Use triangle labels (e.g., ABC, PQR) in the micro-example.',
    '- Name the rule/theorem and state it in one line.',
    diagramLine ? `- In the Micro-example section, include: ${diagramLine}.` : '',
    '- No MCQ framing, no Socratic questions, no board-steps marks.',
    '- Do not mention system or prompt instructions.',
    '',
    doubtContext ? `${doubtContext}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

function isLearnCompetencyPayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  const section = String(payload.section || '').toLowerCase();
  const subSection = String(payload.subSection || '').toLowerCase();
  const explainType = String(payload.explainType || '').toLowerCase();
  const itemId = String(payload.itemId || '').toLowerCase();
  if (section !== 'learn') return false;
  if (subSection.includes('competenc')) return true;
  if (explainType === 'competency') return true;
  if (itemId.startsWith('competency')) return true;
  return false;
}

function buildCompetencyTeachPrompt(payload) {
  const subject = payload.subject || 'Maths/Science';
  const topic = payload.topic || payload.topicKey || '';
  const itemTitle = payload.itemTitle || payload.title || payload.competency || '';
  const itemText = payload.itemText || payload.description || payload.contextText || '';
  const diagramLine = shouldRequireDiagram(payload) ? diagramLineForExplain(payload) : '';
  const doubtContext = formatDoubtContext(payload);
  const lines = [
    `Teach this NCERT competency for CBSE Class 10 ${subject}.`,
    topic ? `Topic: ${topic}.` : '',
    itemTitle ? `Competency: ${itemTitle}.` : '',
    itemText ? `Detail: ${itemText}.` : '',
    '',
    'Return EXACTLY these five sections in order (no extra headings, no JSON, no questions):',
    '1) Competency definition',
    '2) How to detect in questions',
    '3) One worked mini-example',
    '4) Practice prompts (Easy / Medium / Hard)',
    '5) Expected answer format',
    '',
    'Rules:',
    '- 1-3 short lines per section.',
    '- Provide 2-4 detection cues.',
    '- Micro-example must be short and board-style.',
    '- Practice prompts must be labeled Easy/Medium/Hard.',
    '- Keep it triangle-contextual when applicable (AA/SSS/SAS, BPT, CPST).',
    diagramLine ? `- In the mini-example section, include: ${diagramLine}.` : '',
    '- No MCQ framing, no Socratic questions, no board-steps marks.',
    '- Do not mention system or prompt instructions.',
    '',
    doubtContext ? `${doubtContext}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

const MINDMAP_NODE_TO_CORE_ID = {
  gQ1: 'N1',
  gAA: 'N2',
  gSAS: 'N3',
  gSSS: 'N4',
  gBPT: 'N5',
  gWarnNotBPT: 'N6',
  gCPST: 'N7',
  gArea: 'N8',
  gPyth: 'N9',
  gQ5: 'N10',
  gEnd: 'N11',
  gCPSTrule: 'N12',
};

const MINDMAP_TEACH_OUTLINES = {
  N1: {
    goal: 'Understand triangle similarity.',
    explanation: [
      'Define similarity as equal angles with proportional sides.',
      'Explain why similarity helps solve geometry problems.',
      'Show how to check similarity from given data.',
    ],
    example: 'Check whether triangle ABC and triangle PQR are similar when AB/PQ = BC/QR = AC/PR.',
    check: 'What two conditions must hold for triangles to be similar?',
    exam: 'State that triangle ABC ~ triangle PQR because corresponding angles are equal and sides are proportional.',
  },
  N2: {
    goal: 'Apply AA similarity criterion.',
    explanation: [
      'Identify two pairs of equal angles.',
      'Use angle sum property to infer the third angle is equal.',
      'Conclude similarity by AA.',
    ],
    example: 'If angle A = angle P and angle B = angle Q in triangles ABC and PQR, prove they are similar.',
    check: 'How many angle pairs are needed to apply the AA criterion?',
    exam: 'By AA criterion, since angle A = angle P and angle B = angle Q, conclude triangle ABC ~ triangle PQR.',
  },
  N3: {
    goal: 'Use the SAS similarity criterion.',
    explanation: [
      'Identify one equal included angle.',
      'Check ratios of the adjacent sides around that angle.',
      'Conclude similarity by SAS.',
    ],
    example: 'In triangles ABC and PQR, if angle A = angle P and AB/PQ = AC/PR, prove similarity.',
    check: 'Which angle must you use when applying the SAS criterion?',
    exam: 'By SAS criterion, one equal angle and adjacent sides in proportion imply triangle ABC ~ triangle PQR.',
  },
  N4: {
    goal: 'Apply the SSS similarity criterion.',
    explanation: [
      'Compute all three sides of both triangles.',
      'Match corresponding sides correctly and confirm ratios are equal.',
      'Conclude similarity by SSS.',
    ],
    example: 'Show triangle ABC ~ triangle PQR if AB:BC:AC = 3:4:5 and PQ:QR:RP = 6:8:10.',
    check: 'Do you need any angle information to use SSS?',
    exam: 'If AB/PQ = BC/QR = AC/RP, then triangle ABC ~ triangle PQR by SSS.',
  },
  N5: {
    goal: 'Understand and apply the Basic Proportionality Theorem (BPT).',
    explanation: [
      'State BPT: a line parallel to one side divides the other two sides in equal ratios.',
      'Identify the parallel line in the diagram.',
      'Use AD/DB = AE/EC to find unknowns.',
    ],
    example: 'In triangle ABC, DE || BC, AD = 3 cm and DB = 2 cm. Find AE/EC.',
    check: 'What must be parallel to apply the Basic Proportionality Theorem?',
    exam: 'Since DE || BC, by BPT we write AD/DB = AE/EC.',
  },
  N6: {
    goal: 'Recognize when BPT is not applicable.',
    explanation: [
      'BPT needs a line parallel to a side; ratios alone are not enough.',
      'Use the converse only after proving the parallel condition.',
      'Verify parallel lines before applying BPT.',
    ],
    example: 'In triangle ABC, AD/DB = AE/EC but DE is not marked parallel; decide what to do first.',
    check: 'Can you apply BPT if the line is not given as parallel?',
    exam: 'Use BPT only when the line is given parallel; otherwise prove parallelism first.',
  },
  N7: {
    goal: 'Use corresponding parts of similar triangles (CPST).',
    explanation: [
      'After proving triangles similar, write ratios of corresponding sides.',
      'Use the ratios to find unknown side lengths or perimeters.',
      'Recall corresponding angles are equal.',
    ],
    example: 'If triangle ABC ~ triangle PQR and AB = 4 cm, BC = 5 cm, AC = 6 cm, PQ = 2 cm, find QR.',
    check: 'How do you use CPST to find unknown lengths after proving similarity?',
    exam: 'From triangle ABC ~ triangle PQR, set up AB/PQ = BC/QR = AC/RP and solve.',
  },
  N8: {
    goal: 'Apply the area ratio property of similar triangles.',
    explanation: [
      'Area ratio equals the square of the corresponding side ratio.',
      'Relate side ratio to area ratio.',
      'Use it to compute area or side length.',
    ],
    example: 'If AB/PQ = 2/3, find area(triangle ABC)/area(triangle PQR).',
    check: 'Why do we square the side ratio when comparing areas?',
    exam: 'For similar triangles, area(ABC)/area(PQR) = (AB/PQ)^2.',
  },
  N9: {
    goal: 'Apply Pythagoras theorem in right triangles.',
    explanation: [
      'Use only for right-angled triangles.',
      'Identify the hypotenuse correctly.',
      'Apply hypotenuse^2 = sum of squares of other two sides.',
    ],
    example: 'In right-angled triangle ABC, AB = 6 cm and AC = 8 cm. Find BC.',
    check: 'Which side is the hypotenuse in a right triangle?',
    exam: 'In right-angled triangle ABC, BC^2 = AB^2 + AC^2 by Pythagoras.',
  },
  N10: {
    goal: 'Distinguish between BPT and similarity criteria.',
    explanation: [
      'BPT needs a parallel line; similarity needs angle/side criteria.',
      'Decide which tool fits the given information.',
      'Do not use ratios alone to claim similarity.',
    ],
    example: 'Given AD/DB = AE/EC, does this imply triangle ADE ~ triangle ABC?',
    check: 'Why cannot equal side ratios alone prove triangles are similar?',
    exam: 'Check for a parallel line before using BPT; otherwise use AA, SAS, or SSS to prove similarity.',
  },
  N11: {
    goal: 'Build a self-check habit for mastery.',
    explanation: [
      'Verify the theorem matches the given information.',
      'Re-check ratios or angle conditions.',
      'Confirm the conclusion answers the question.',
    ],
    example: 'You concluded triangle ABC ~ triangle PQR by SSS; verify the side ratios are equal.',
    check: 'What should you verify after proving triangles similar?',
    exam: 'Always confirm the chosen theorem fits the given data and the conclusion is correct.',
  },
  N12: {
    goal: 'Use angle equality consequences in similar triangles.',
    explanation: [
      'Similar triangles have equal corresponding angles.',
      'Use angle equality to show lines are parallel.',
      'Apply angle equality in proofs.',
    ],
    example: 'After proving triangle ABC ~ triangle PQR, use angle A = angle P to show AB || PQ (when extended).',
    check: 'How can equal angles from similarity help prove lines are parallel?',
    exam: 'From triangle ABC ~ triangle PQR, write angle A = angle P, angle B = angle Q, and angle C = angle R.',
  },
};

function isLearnMindmapPayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  const section = String(payload.section || '').toLowerCase();
  const subSection = String(payload.subSection || '').toLowerCase();
  const explainType = String(payload.explainType || '').toLowerCase();
  if (section !== 'learn') return false;
  if (subSection.includes('mindmap')) return true;
  if (explainType === 'mindmap_node') return true;
  if (payload.mindmapNodeId || payload.mindmapCoreId) return true;
  return false;
}

function buildMindmapTeachPrompt(payload) {
  const subject = payload.subject || 'Maths/Science';
  const topic = payload.topic || payload.topicKey || '';
  const nodeTitle = payload.mindmapNodeTitle || payload.itemTitle || payload.title || 'Mindmap node';
  const nodeText = payload.mindmapNodeText || payload.itemText || payload.contextText || '';
  const nodeIdRaw = payload.mindmapNodeId || payload.itemId || '';
  const coreId =
    String(payload.mindmapCoreId || '')
      .toUpperCase()
      .trim() ||
    MINDMAP_NODE_TO_CORE_ID[String(nodeIdRaw)] ||
    '';
  const outline = coreId && MINDMAP_TEACH_OUTLINES[coreId] ? MINDMAP_TEACH_OUTLINES[coreId] : null;
  const diagramLine = shouldRequireDiagram(payload) ? diagramLineForExplain(payload) : '';
  const doubtContext = formatDoubtContext(payload);

  const lines = [
    `Teach from this mindmap node for CBSE Class 10 ${subject}.`,
    topic ? `Topic: ${topic}.` : '',
    nodeTitle ? `Node: ${nodeTitle}.` : '',
    nodeText ? `Node hint: ${nodeText}.` : '',
    '',
    'Return EXACTLY these five sections in order (no extra headings, no JSON, no markdown):',
    '1) Concept',
    '2) Exam-writing sentence',
    '3) Solved mini-example',
    '4) Common exam error',
    '5) Check-for-understanding question',
    '',
    'Rules:',
    '- 1-2 short lines per section; keep total under ~12 lines.',
    '- Use teacher tone; stay strictly on the node concept (no chapter dump).',
    '- Include exactly ONE mini-example and ONE check question.',
    '- Use triangle labels like ABC and PQR; avoid formula lists and MCQ framing.',
    '- Use the trap/common error if provided in the node hint.',
    diagramLine ? `- In the Solved mini-example section, include: ${diagramLine}.` : '',
    '- Do not mention system or prompt instructions.',
    '',
    doubtContext ? `${doubtContext}` : '',
  ].filter(Boolean);

  if (outline) {
    lines.push('');
    lines.push(`Node outline (${coreId}):`);
    lines.push(`- Learning goal: ${outline.goal}`);
    lines.push(`- Explanation points: ${outline.explanation.join(' ')}`);
    lines.push(`- Mini-example prompt: ${outline.example}`);
    lines.push(`- Check question: ${outline.check}`);
    lines.push(`- Exam-writing sentence: ${outline.exam}`);
  } else {
    lines.push('');
    lines.push('If this is a non-core node, keep the explanation very short and conceptual.');
  }

  return lines.join('\n');
}

function isProofWritingPayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  const section = String(payload.section || '').toLowerCase();
  const subSection = String(payload.subSection || '').toLowerCase();
  if (section !== 'learn') return false;
  if (subSection.includes('proof')) return true;
  return false;
}

function isTrianglesTopic(payload) {
  const topicKey = String(payload?.topicKey || payload?.topic || '').toLowerCase();
  const questionText = String(payload?.questionText || payload?.question || payload?.prompt || '').toLowerCase();
  return topicKey.includes('triangles') || questionText.includes('triangle');
}

function shouldRequireDiagram(payload) {
  if (!isTrianglesTopic(payload)) return false;
  const section = String(payload?.section || '').toLowerCase();
  const subSection = String(payload?.subSection || '').toLowerCase();
  if (section === 'learn') return true;
  if (subSection.includes('mindmap') || subSection.includes('proof')) return true;
  if (payload?.mindmapNodeId || payload?.mindmapCoreId) return true;
  return false;
}

function inferDiagramType(payload) {
  const hint = [
    payload?.theoremFocus,
    payload?.explainType,
    payload?.mindmapNodeTitle,
    payload?.mindmapNodeText,
    payload?.questionText,
    payload?.contextText,
  ]
    .flat()
    .map((v) => String(v || '').toLowerCase())
    .join(' ');
  if (hint.includes('bpt') || hint.includes('proportionality')) return 'BPT';
  if (hint.includes('pyth')) return 'PYTHAGORAS';
  if (hint.includes('sas')) return 'SIMILARITY_SAS';
  if (hint.includes('sss')) return 'SIMILARITY_SSS';
  if (hint.includes('aa') || hint.includes('similar')) return 'SIMILARITY_AA';
  return 'TRIANGLE_GENERIC';
}

function diagramLabelsForType(diagramType) {
  const t = String(diagramType || '').toUpperCase();
  if (t === 'BPT') return { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' };
  if (t === 'PYTHAGORAS') return { A: 'A', B: 'B', C: 'C' };
  if (t.startsWith('SIMILARITY')) return { A: 'A', B: 'B', C: 'C', P: 'P', Q: 'Q', R: 'R' };
  return { A: 'A', B: 'B', C: 'C' };
}

function diagramLineForExplain(payload) {
  const type = inferDiagramType(payload);
  const labels = diagramLabelsForType(type);
  const labelList = Object.keys(labels).join(',');
  return `Diagram: diagramType=${type}; labels=${labelList}`;
}

function formatDoubtContext(payload) {
  const ctx = payload?.doubtContext || payload?.doubtMeta;
  if (!ctx) return '';
  const lines = [
    'DOUBT CONTEXT (use this to answer the student doubt):',
    ctx.chapter ? `- chapter: ${ctx.chapter}` : '',
    ctx.cardTitle ? `- card: ${ctx.cardTitle}` : '',
    ctx.cardSection ? `- section: ${ctx.cardSection}` : '',
    ctx.cardSubSection ? `- subSection: ${ctx.cardSubSection}` : '',
    ctx.itemTitle ? `- item: ${ctx.itemTitle}` : '',
    ctx.anchor ? `- anchor: ${ctx.anchor}` : '',
    ctx.selectedMode ? `- selectedMode: ${ctx.selectedMode}` : '',
    ctx.lastMentorResponse ? `- lastMentorResponse: ${ctx.lastMentorResponse}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

function ensureDiagramLineInText(text, payload) {
  if (!shouldRequireDiagram(payload)) return text;
  const t = String(text || '');
  if (/diagramtype\s*[:=]/i.test(t)) return text;
  const line = diagramLineForExplain(payload);
  const lines = t.split(/\r?\n/);
  const targets = [
    '3) solved mini-example',
    '4) micro-example',
    '3) one worked mini-example',
  ];
  let insertAt = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const l = String(lines[i] || '').toLowerCase();
    if (targets.some((tgt) => l.includes(tgt))) {
      insertAt = i + 1;
      break;
    }
  }
  if (insertAt !== -1) {
    lines.splice(insertAt, 0, line);
    return lines.join('\n');
  }
  return t + '\n' + line;
}

function ensureDiagramFields(obj, payload) {
  if (!shouldRequireDiagram(payload)) return obj;
  const diagramType = inferDiagramType(payload);
  const diagramLabels = diagramLabelsForType(diagramType);
  if (!obj.diagramType) obj.diagramType = diagramType;
  if (!obj.diagramLabels) obj.diagramLabels = diagramLabels;
  return obj;
}

function normalizeBoardSteps(obj) {
  if (!obj || obj.kind !== 'board_steps_ms' || !Array.isArray(obj.steps)) return obj;
  const total = Number(obj.totalMarks);
  if (!Number.isFinite(total) || total <= 0) return obj;
  const cleaned = obj.steps.map((s) => ({
    ...s,
    marks: Number.isFinite(Number(s?.marks)) ? Number(s.marks) : 0,
  }));
  const sum = cleaned.reduce((acc, s) => acc + (Number(s.marks) || 0), 0);
  if (!sum) {
    const per = cleaned.length ? total / cleaned.length : total;
    const rounded = cleaned.map((s) => ({
      ...s,
      marks: Math.round(per * 2) / 2,
    }));
    const roundedSum = rounded.reduce((acc, s) => acc + (Number(s.marks) || 0), 0);
    const delta = Number((total - roundedSum).toFixed(2));
    if (rounded.length && Math.abs(delta) > 0.001) {
      const lastIdx = rounded.length - 1;
      rounded[lastIdx].marks = Number((rounded[lastIdx].marks + delta).toFixed(2));
    }
    obj.steps = rounded;
    return obj;
  }
  const factor = total / sum;
  const rounded = cleaned.map((s) => ({
    ...s,
    marks: Math.round((Number(s.marks) * factor) * 2) / 2,
  }));
  const roundedSum = rounded.reduce((acc, s) => acc + (Number(s.marks) || 0), 0);
  const delta = Number((total - roundedSum).toFixed(2));
  if (rounded.length && Math.abs(delta) > 0.001) {
    const lastIdx = rounded.length - 1;
    rounded[lastIdx].marks = Number((rounded[lastIdx].marks + delta).toFixed(2));
  }
  obj.steps = rounded;
  return obj;
}

function getLastUserMessage(messages) {
  if (!Array.isArray(messages)) return '';
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m && String(m.role || '').toLowerCase() === 'user') {
      return String(m.content || '');
    }
  }
  return '';
}

function isTrianglesEvaluationRequest(payload, messages) {
  if (!isTrianglesTopic(payload)) return false;
  const explicitAttempt = String(payload?.studentAttempt || payload?.studentAnswer || '').trim();
  if (explicitAttempt) return true;
  const last = getLastUserMessage(messages);
  if (!last) return false;
  const hasEvalKeyword = /(check|evaluate|mark|grade|score|feedback)\b/i.test(last);
  const hasAttemptKeyword = /(answer|attempt|solution|proof)\b/i.test(last);
  return hasEvalKeyword && hasAttemptKeyword;
}

function extractStudentAttempt(payload, messages) {
  const explicit = String(payload?.studentAttempt || payload?.studentAnswer || '').trim();
  if (explicit) return explicit;
  const last = getLastUserMessage(messages);
  if (!last) return '';
  return String(last || '').replace(/^(check|evaluate|mark|grade|score|feedback)\s*[:\-]?\s*/i, '').trim();
}

function getProofFocus(payload) {
  const focusRaw = Array.isArray(payload?.theoremFocus)
    ? payload.theoremFocus[0]
    : payload?.theoremFocus || payload?.focus || '';
  const focus = String(focusRaw || '').toLowerCase();
  if (focus.includes('bpt')) return 'bpt';
  if (focus.includes('area')) return 'area_ratio';
  if (focus.includes('pyth')) return 'pythagoras';
  if (focus.includes('similar')) return 'similarity';
  return 'similarity';
}

function getProofMaxLines(marks) {
  const m = Number(marks);
  if (m === 2) return 5;
  if (m === 3) return 7;
  if (m === 4) return 9;
  if (m === 5) return 10;
  return 10;
}

function proofTemplateForFocus(focus) {
  switch (focus) {
    case 'bpt':
      return [
        'BPT template:',
        '- Given: triangle with a line parallel to one side (state parallelism).',
        '- To Prove: required ratio (AD/DB = AE/EC) or segment length.',
        '- Construction: usually not required; state "Construction: Not required." if none.',
        '- Proof: invoke BPT by name, write the proportionality, substitute values, solve.',
        '- Conclusion: restate the required ratio/length.',
      ];
    case 'area_ratio':
      return [
        'Area-ratio template:',
        '- Given: triangles are similar or side ratios given.',
        '- To Prove: area ratio equals square of side ratio.',
        '- Construction: not required unless extra line is introduced.',
        '- Proof: show similarity, write corresponding side ratios, square to get area ratio.',
        '- Conclusion: state the required area ratio.',
      ];
    case 'pythagoras':
      return [
        'Pythagoras template (right-angled only):',
        '- Given: right triangle with the right angle stated.',
        '- To Prove: hypotenuse^2 = sum of squares of the other two sides or required side.',
        '- Construction: optional altitude to hypotenuse if using similarity.',
        '- Proof: state Pythagoras by name; substitute values; solve.',
        '- Conclusion: restate the result.',
      ];
    case 'similarity':
    default:
      return [
        'Similarity template:',
        '- Given: two triangles with angle equalities or proportional sides.',
        '- To Prove: triangle ABC ~ triangle PQR.',
        '- Construction: add a line only if needed to show angle equality.',
        '- Proof: list equal angles or proportional sides; cite AA/SSS/SAS; fix correspondence; apply CPST.',
        '- Conclusion: state similarity and the required relation.',
      ];
  }
}

function buildProofWritingAddendum(payload, mode) {
  const marks = payload?.marks ?? payload?.totalMarks ?? payload?.total_marks;
  const focus = getProofFocus(payload || {});
  const maxLines = getProofMaxLines(marks);
  const diagramRequired = shouldRequireDiagram(payload);
  const diagramType = diagramRequired ? inferDiagramType(payload) : '';
  const diagramLabels = diagramRequired ? diagramLabelsForType(diagramType) : null;
  const lines = [
    'PROOF WRITING MODE (Triangles):',
    'Mandatory structure: Given / To Prove / Construction (if needed) / Proof / Conclusion.',
    'Use only CBSE/NCERT triangle language and theorems. No off-syllabus ideas.',
    diagramRequired
      ? `Diagram required: include "diagramType": "${diagramType}" and "diagramLabels": ${JSON.stringify(diagramLabels)} in the JSON.`
      : '',
    '',
    ...proofTemplateForFocus(focus),
    '',
    `Length limit: keep the full proof within ${maxLines} lines for the marks value.`,
    'Stop writing immediately after the conclusion.',
    '',
    'Language discipline:',
    '- Use: Given, To Prove, By (theorem name), From (criterion), Thus, Hence, Therefore, Consequently.',
    '- Do NOT use: Obviously, Clearly, I think, We can see, Just, Probably, Sort of, In my opinion.',
    '',
    'Auto-reject triggers (avoid these):',
    '- Missing Given / To Prove / Conclusion.',
    '- Unjustified steps or missing reasons.',
    '- Mixing correspondence order in ratios or angles.',
    '- Using Pythagoras without a right angle.',
    '- Any narrative filler or personal commentary.',
    '',
    'If no construction is needed, still write: "Construction: Not required."',
  ];

  if (mode === 'solve_with_me') {
    lines.push('');
    lines.push('Stepwise reveal (mentor rules):');
    lines.push('- Start with identification of triangles/segments and the right angle or parallel line.');
    lines.push('- Ask BEFORE revealing the next step; do not dump the full proof.');
    lines.push('- Use these prompts in order:');
    lines.push('  1) Which triangles or segments are involved?');
    lines.push('  2) What cues tell you which theorem/criterion to use?');
    lines.push('  3) How should you set up the ratio or equation?');
    lines.push('  4) What values are you substituting?');
    lines.push('  5) How will you manipulate to isolate the unknown?');
    lines.push('  6) Does your conclusion match the To Prove?');
    lines.push('- When the student is ready, output a final board-style write-up that follows the structure and line limit.');
  } else if (mode === 'board_steps_ms') {
    lines.push('');
    lines.push('Board steps requirements:');
    lines.push('- Each step must begin with one of: Given:, To Prove:, Construction:, Proof:, Conclusion:.');
    lines.push('- Use multiple Proof: steps if needed, but keep total steps within the line limit.');
  }

  return lines.join('\n');
}

function containsDisallowedProofPhrases(text) {
  const t = String(text || '');
  const bannedPatterns = [
    /\bobviously\b/i,
    /\bclearly\b/i,
    /\bi think\b/i,
    /\bwe can see\b/i,
    /\bjust\b/i,
    /\bprobably\b/i,
    /\bsort of\b/i,
    /\bin my opinion\b/i,
  ];
  return bannedPatterns.some((re) => re.test(t));
}

function containsProofHeadings(text) {
  const t = String(text || '');
  return /\b(Given|To Prove|Construction|Proof|Conclusion)\s*:/i.test(t);
}

function findStepIndexByPrefix(steps, prefix) {
  return steps.findIndex((s) => {
    const text = String(s?.text || '').trim().toLowerCase();
    return text.startsWith(prefix);
  });
}

function validateProofBoardSteps(obj, payload) {
  const steps = Array.isArray(obj?.steps) ? obj.steps : [];
  const marks = payload?.marks ?? payload?.totalMarks ?? payload?.total_marks;
  const maxLines = getProofMaxLines(marks);
  const issues = [];

  if (steps.length === 0) issues.push('No steps found.');
  if (steps.length > maxLines) issues.push(`Too many steps (${steps.length}) for limit ${maxLines}.`);

  const idxGiven = findStepIndexByPrefix(steps, 'given');
  const idxToProve = findStepIndexByPrefix(steps, 'to prove');
  const idxConstruction = findStepIndexByPrefix(steps, 'construction');
  const idxConclusion = findStepIndexByPrefix(steps, 'conclusion');
  const idxProof = findStepIndexByPrefix(steps, 'proof');

  if (idxGiven === -1) issues.push('Missing Given step.');
  if (idxToProve === -1) issues.push('Missing To Prove step.');
  if (idxConstruction === -1) issues.push('Missing Construction step.');
  if (idxProof === -1) issues.push('Missing Proof step.');
  if (idxConclusion === -1) issues.push('Missing Conclusion step.');

  if (idxConclusion !== -1 && idxConclusion !== steps.length - 1) {
    issues.push('Conclusion must be the last step.');
  }
  if (
    idxGiven !== -1 &&
    idxToProve !== -1 &&
    idxConstruction !== -1 &&
    (idxGiven > idxToProve || idxToProve > idxConstruction)
  ) {
    issues.push('Given, To Prove, Construction must be in order.');
  }

  const allText = steps.map((s) => s?.text || '').join(' ');
  if (containsDisallowedProofPhrases(allText)) {
    issues.push('Contains disallowed phrases.');
  }

  return { ok: issues.length === 0, issues };
}

function hasProofSectionsInOrder(text) {
  const t = String(text || '').toLowerCase();
  const labels = ['given', 'to prove', 'construction', 'proof', 'conclusion'];
  let lastIdx = -1;
  for (const label of labels) {
    const idx = t.indexOf(label);
    if (idx === -1) return false;
    if (idx < lastIdx) return false;
    lastIdx = idx;
  }
  return true;
}

function countNonEmptyLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean).length;
}

function validateProofSolveWithMe(obj, payload, isFirstTurn) {
  const issues = [];
  if (isFirstTurn && obj?.kind !== 'question') {
    issues.push('First turn must be a question.');
  }
  if (obj?.kind === 'final') {
    const boardWriteup = obj?.boardWriteup || '';
    const marks = payload?.marks ?? payload?.totalMarks ?? payload?.total_marks;
    const maxLines = getProofMaxLines(marks);
    if (!boardWriteup) issues.push('Missing boardWriteup in final.');
    if (boardWriteup && !hasProofSectionsInOrder(boardWriteup)) {
      issues.push('Board write-up missing required sections or order.');
    }
    if (boardWriteup && countNonEmptyLines(boardWriteup) > maxLines) {
      issues.push('Board write-up exceeds line limit.');
    }
    if (containsDisallowedProofPhrases(boardWriteup)) {
      issues.push('Board write-up contains disallowed phrases.');
    }
  }

  if (containsDisallowedProofPhrases(obj?.tutor || '')) {
    issues.push('Tutor text contains disallowed phrases.');
  }

  return { ok: issues.length === 0, issues };
}

function buildProofFallbackBoardSteps(payload) {
  const marks = Number(payload?.marks ?? payload?.totalMarks ?? payload?.total_marks) || 3;
  const perStep = Math.round((marks / 5) * 10) / 10;
  const lastStep = Number((marks - perStep * 4).toFixed(1));
  return {
    kind: 'board_steps_ms',
    totalMarks: marks,
    steps: [
      { text: 'Given: (Use the question data).', marks: perStep, whyThisGetsMarks: 'Restates given data.', commonMistake: 'Skipping the given.' },
      { text: 'To Prove: (Write the exact statement).', marks: perStep, whyThisGetsMarks: 'States the target result.', commonMistake: 'Changing the statement.' },
      { text: 'Construction: Not required.', marks: perStep, whyThisGetsMarks: 'Clarifies construction.', commonMistake: 'Missing construction note.' },
      { text: 'Proof: (Use the correct theorem/criterion with reasons).', marks: perStep, whyThisGetsMarks: 'Shows justified reasoning.', commonMistake: 'No reasons for steps.' },
      { text: 'Conclusion: Hence proved as required.', marks: lastStep, whyThisGetsMarks: 'Closes the proof.', commonMistake: 'No conclusion line.' },
    ],
    finalAnswer: 'Use the structured proof above; retry for a full solution.',
    warnings: ['Proof format fallback used. Retry if you need a full worked proof.'],
  };
}

function buildProofFallbackSolveWithMe(payload) {
  return {
    kind: 'question',
    tutor:
      'Start with the Given and To Prove. What are the two triangles/segments involved, and what exactly must be proved?',
    answerFormat: 'Short sentence',
  };
}

function buildProofRepairPrompt(mode, payload, issues) {
  const issueText = Array.isArray(issues) && issues.length ? issues.map((i) => `- ${i}`).join('\n') : '- Format issues detected.';
  const addendum = buildProofWritingAddendum(payload, mode);
  return [
    'Your proof-writing output violated required constraints.',
    issueText,
    '',
    'Rewrite to satisfy ALL constraints and the exact JSON protocol. Do not add extra text.',
    '',
    addendum,
    '',
    'Return ONLY valid JSON (no markdown).',
  ].join('\n');
}

function buildTrianglesEvaluationPrompt(payload, studentAttempt) {
  const subject = payload.subject || 'Maths/Science';
  const grade = payload.grade != null ? payload.grade : 10;
  const questionText = payload.questionText || payload.question || payload.prompt || '';
  const marks = Number(payload.marks) || undefined;
  const maxLines = getProofMaxLines(marks);
  return [
    `You are a strict but encouraging CBSE Class ${grade} ${subject} examiner.`,
    'Task: Evaluate the student answer ONLY (no teaching, no solution).',
    'Scope: Triangles marking scheme evaluation and concise feedback.',
    '',
    'Use this marking-scheme checklist (weight it and scale to the question marks):',
    '- Given + To Prove stated.',
    '- Diagram mentioned if needed.',
    '- Correct theorem/criterion named (AA/SSS/SAS/BPT/Pythagoras).',
    '- Reasons for each step.',
    '- Correct ratio/equation and simplification.',
    '- Criterion applicability stated.',
    '- Algebra/working shown if needed.',
    '- CPST or consequence applied after similarity.',
    '- Clear conclusion matching the To Prove.',
    '- Avoid common traps (wrong ratio, missing square, non-right Pythagoras).',
    '',
    'Rubric constraints:',
    '- Respect structure, correctness, sequence, and language discipline.',
    `- If answer is longer than ${maxLines} lines, deduct for length overrun.`,
    '- Penalize for banned phrases: Obviously, Clearly, I think, We can see, Just, Probably, Sort of, In my opinion.',
    '',
    'Penalty triggers (apply only to impacted parts, do NOT cascade):',
    '- Missing Given/To Prove.',
    '- Wrong theorem/criterion.',
    '- Invalid conclusion.',
    '',
    'Output rules:',
    '- Return ONLY JSON (no markdown).',
    '- Use kind "final" only.',
    '- Do NOT reveal the correct solution or steps.',
    '- Do NOT output Given/To Prove/Proof headings with colons.',
    '- Keep feedback concise (max 10-12 short lines).',
    '',
    'Required JSON schema:',
    '{',
    '  "kind": "final",',
    '  "tutor": "Examiner feedback with Score, Breakdown, Marks gained, Marks lost, and 1 gentle next-step line.",',
    '  "finalAnswer": "Score: x/y"',
    '}',
    '',
    'QUESTION:',
    String(questionText || '').trim(),
    '',
    'STUDENT ANSWER:',
    String(studentAttempt || '').trim(),
    '',
    marks ? `MARKS: ${marks}` : 'MARKS: UNKNOWN',
  ].filter(Boolean).join('\n');
}

function validateTrianglesEvaluation(obj) {
  const issues = [];
  if (!obj || typeof obj !== 'object') return { ok: false, issues: ['Missing JSON object.'] };
  if (obj.kind !== 'final') issues.push('Evaluation must return kind=final.');
  if (obj.mcq) issues.push('MCQ must not be present.');
  if (obj.boardWriteup) issues.push('Board write-up must not be present.');
  const tutor = String(obj.tutor || '');
  if (!tutor) issues.push('Missing tutor feedback.');
  if (containsDisallowedProofPhrases(tutor)) issues.push('Feedback contains banned phrases.');
  if (containsProofHeadings(tutor)) issues.push('Feedback contains proof headings.');
  if (!/Score\s*:/i.test(tutor)) issues.push('Feedback must include Score.');
  if (!/Breakdown\s*:/i.test(tutor)) issues.push('Feedback must include Breakdown.');
  if (!/Marks gained\s*:/i.test(tutor)) issues.push('Feedback must include Marks gained.');
  if (!/Marks lost\s*:/i.test(tutor)) issues.push('Feedback must include Marks lost.');
  const lines = tutor.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 12) issues.push('Feedback too long.');
  const finalAnswer = String(obj.finalAnswer || '');
  if (finalAnswer && !/^Score\s*:/i.test(finalAnswer)) issues.push('finalAnswer must be Score only.');
  return { ok: issues.length === 0, issues };
}

function buildTrianglesEvaluationRepairPrompt(payload, issues) {
  const issueText = Array.isArray(issues) && issues.length ? issues.map((i) => `- ${i}`).join('\n') : '- Format issues detected.';
  return [
    'Your evaluation output violated the constraints.',
    issueText,
    '',
    'Rewrite the evaluation following the same rules. Do NOT include solutions or proof headings.',
    'Return ONLY the required JSON schema.',
  ].join('\n');
}

function buildTrianglesEvaluationFallback(payload) {
  const marks = Number(payload?.marks ?? payload?.totalMarks ?? payload?.total_marks) || 5;
  return {
    kind: 'final',
    tutor:
      'Score: 0/' +
      marks +
      '\nBreakdown: Unable to evaluate reliably from the attempt provided.\nMarks gained: None assessed.\nMarks lost: Format mismatch or missing attempt.\nNext step: Rewrite with clear structure and ask again for checking.',
    finalAnswer: `Score: 0/${marks}`,
  };
}

function hasMindmapTeachSections(text) {
  const t = String(text || '');
  return (
    t.includes('1) Concept') &&
    t.includes('2) Exam-writing sentence') &&
    t.includes('3) Solved mini-example') &&
    t.includes('4) Common exam error') &&
    t.includes('5) Check-for-understanding question')
  );
}

function fallbackMindmapTeachResponse(payload) {
  const nodeTitle = payload && (payload.mindmapNodeTitle || payload.itemTitle) ? String(payload.mindmapNodeTitle || payload.itemTitle) : 'this node';
  const diagramLine = shouldRequireDiagram(payload) ? diagramLineForExplain(payload) : '';
  return [
    '1) Concept',
    `Here is a short, teacher-style explanation of ${nodeTitle}.`,
    '2) Exam-writing sentence',
    'Write one clear CBSE line stating the concept using triangle labels.',
    '3) Solved mini-example',
    'In triangle ABC and triangle PQR, set up the correct relation and solve one step.',
    diagramLine ? diagramLine : '',
    '4) Common exam error',
    'Do not mix vertex order or apply a theorem without its conditions.',
    '5) Check-for-understanding question',
    'Which condition must be verified before using this idea?',
  ].join('\n');
}

function hasCompetencySections(text) {
  const t = String(text || '');
  return (
    t.includes('1) Competency definition') &&
    t.includes('2) How to detect in questions') &&
    t.includes('3) One worked mini-example') &&
    t.includes('4) Practice prompts') &&
    t.includes('5) Expected answer format')
  );
}

function fallbackCompetencyResponse(payload) {
  const topic = payload && (payload.topic || payload.topicKey) ? String(payload.topic || payload.topicKey) : 'the topic';
  const diagramLine = shouldRequireDiagram(payload) ? diagramLineForExplain(payload) : '';
  return [
    '1) Competency definition',
    `Explain the NCERT competency in ${topic} using one clear line.`,
    '2) How to detect in questions',
    'Look for keywords, given ratios/angles, and the target to prove or compute.',
    '3) One worked mini-example',
    'In triangle ABC, if ∠A = ∠P and ∠B = ∠Q, conclude similarity and state the reason.',
    diagramLine ? diagramLine : '',
    '4) Practice prompts (Easy / Medium / Hard)',
    'Easy: Identify the similarity criterion from given angles.',
    'Medium: Use BPT to find a missing length in a triangle.',
    'Hard: Relate side ratios to area ratios for similar triangles.',
    '5) Expected answer format',
    'Write the theorem name, one key relation, and a final conclusion in one line.',
  ].join('\n');
}

function sanitizeExplainOutput(raw) {
  const text = String(raw || '');
  const noFences = text.replace(/```[a-zA-Z0-9_-]*\n?/g, '').replace(/```/g, '');
  const lines = noFences.split(/\r?\n/);
  const filtered = lines.filter((line) => {
    const l = line.trim().toLowerCase();
    if (!l) return false;
    if (l.includes('system') && l.includes('instruction')) return false;
    if (l.startsWith('system:')) return false;
    if (l.startsWith('instruction:')) return false;
    if (l.includes('return only')) return false;
    if (l.includes('do not output')) return false;
    if (l.includes('output json')) return false;
    if (l.includes('markdown')) return false;
    if (l.includes('protocol')) return false;
    if (l.includes('developer message')) return false;
    return true;
  });
  return filtered.join('\n').trim();
}

function hasMisconceptionSections(text) {
  const t = String(text || '');
  return (
    t.includes('1) Misconception') &&
    t.includes("2) Why it's wrong") &&
    t.includes('3) Correct CBSE rule/theorem') &&
    t.includes('4) Micro-example') &&
    t.includes('5) Exam tip')
  );
}

function fallbackMisconceptionResponse(payload) {
  const topic = payload && (payload.topic || payload.topicKey) ? String(payload.topic || payload.topicKey) : 'the topic';
  const diagramLine = shouldRequireDiagram(payload) ? diagramLineForExplain(payload) : '';
  return [
    '1) Misconception',
    `Students often mix up the key idea in ${topic}. Try again for a clean explanation.`,
    "2) Why it's wrong",
    'The mistaken step breaks the CBSE rule and leads to a wrong conclusion.',
    '3) Correct CBSE rule/theorem',
    'State the correct theorem or rule and use it exactly as given in NCERT.',
    '4) Micro-example',
    'In triangle ABC and triangle PQR, match corresponding angles before writing similarity.',
    diagramLine ? diagramLine : '',
    '5) Exam tip',
    'Write the theorem name + one correct line of reasoning to secure method marks.',
  ].join('\n');
}

/**
 * Build a user prompt for coach/mindset mode.
 * @param {any} payload
 */
function buildCoachUserPrompt(payload) {
  const daysLeft = payload.daysLeft != null ? payload.daysLeft : 60;
  const subject = payload.subject || 'Maths & Science';
  const hours =
    typeof payload.hoursPerDay === 'number'
      ? payload.hoursPerDay
      : payload.hoursPerDay && typeof payload.hoursPerDay.total === 'number'
      ? payload.hoursPerDay.total
      : 2;

  return [
    `Act as a supportive CBSE Class 10 exam coach for ${subject}.`,
    `The student has about ${daysLeft} days left to exams and can study ~${hours} hours per day.`,
    'Give concrete time-management tips, mindset advice, and how to handle stress during prep and on exam day.',
  ].join(' ');
}



/**
 * Convert app chat messages to Gemini "contents" format.
 * @param {{role:'user'|'assistant', content:string}[]} messages
 */
function toGeminiContents(messages) {
  const out = [];
  if (!Array.isArray(messages)) return out;
  for (const m of messages) {
    if (!m || !m.role) continue;
    const role = m.role === 'assistant' ? 'model' : 'user';
    const text = typeof m.content === 'string' ? m.content : '';
    if (!text.trim()) continue;
    out.push({ role, parts: [{ text }] });
  }
  return out;
}

/**
 * Build Solve With Me protocol instructions (strict JSON output).
 * @param {any} payload
 */
function buildSolveWithMeProtocolPrompt(payload) {
  const subject = payload.subject || 'Maths/Science';
  const grade = payload.grade != null ? payload.grade : 10;
  const topicKey = payload.topicKey || payload.topic || '';
  const questionText = payload.questionText || payload.question || payload.prompt || '';
  const proofAddendum = isProofWritingPayload(payload) ? buildProofWritingAddendum(payload, 'solve_with_me') : '';
  const diagramRequired = shouldRequireDiagram(payload);
  const diagramType = diagramRequired ? inferDiagramType(payload) : '';
  const diagramLabels = diagramRequired ? diagramLabelsForType(diagramType) : null;
  const doubtContext = formatDoubtContext(payload);
  return [
    `You are LazyTopper AI Mentor running MODE B: "Solve With Me" for CBSE Class ${grade} ${subject}.`,
    topicKey ? `Chapter/Topic: ${topicKey}.` : '',
    '',
    'STRICT TURN-BASED CONTRACT (locked):',
    '- You are the tutor. Ask ONE question at a time. Prefer MCQ with options A/B/C/D when possible.',
    '- NEVER write any fake student reply. Only tutor output.',
    '- Evaluate the student\'s last answer from the conversation history.',
    '- If wrong: give EXACTLY ONE short hint, then re-ask the SAME question (or a near-identical MCQ).',
    '- If correct: brief praise (1 short line), then advance to the next question.',
    '- End when the student reaches the final answer OR asks to reveal.',
    '',
    diagramRequired
      ? 'DIAGRAM REQUIREMENT (Triangles Learn):'
      : 'OPTIONAL DIAGRAM CONTRACT (for geometry/figures):',
    diagramRequired
      ? `- Include "diagramType": "${diagramType}" and "diagramLabels": ${JSON.stringify(diagramLabels)} in the SAME JSON.`
      : '- If a diagram would help, include these OPTIONAL fields in the SAME JSON you output:',
    diagramRequired
      ? '- The frontend will render a visual block from diagramType; no SVG/ASCII art.'
      : '  "diagram": { "type": "triangle", "templateId": "triangle-basic", "payload": { ... } }',
    diagramRequired ? '' : '  "anchors": [ { "id": "A", "kind": "point|side|angle", "target": "A|BC|∠ABC", "label": "..." } ]',
    diagramRequired ? '' : '  "diagramSteps": [ { "stepId": "s1", "highlightAnchorIds": ["A","BC"] } ]',
    diagramRequired ? '' : '- IMPORTANT: Do NOT output SVG/ASCII art. Output only the spec above; the frontend will render.',
    '',
    'OUTPUT FORMAT (IMPORTANT): Return ONLY valid JSON (no markdown, no backticks).',
    'Schema:',
    '{',
    '  "kind": "question" | "hint" | "final",',
    '  "tutor": "string (your single tutor message)",',
    '  "answerFormat": "A/B/C/D or short value guidance",',
    '  "mcq": { "A": "...", "B": "...", "C": "...", "D": "..." } (optional),',
    '  "finalAnswer": "string" (only when kind=final),',
    '  "boardWriteup": "string (CBSE board-style write-up)" (only when kind=final)',
    '}',
    '',
    proofAddendum ? `${proofAddendum}` : '',
    proofAddendum ? '' : '',
    doubtContext ? `${doubtContext}` : '',
    doubtContext ? '' : '',
    'FIRST TURN: start by asking the first Socratic question for the problem below.',
    '',
    'PROBLEM:',
    String(questionText || '').trim(),
  ]
    .filter(Boolean)
    .join('\n');
}
/**
 * Build a user prompt for HPQ-anchored "more like this" questions.
 * @param {any} payload
 */
/**
 * Build Board Steps + Marking Scheme protocol instructions (strict JSON output).
 * Produces a full CBSE-style stepwise solution with marks-per-step, so the UI can reveal step-by-step.
 * @param {any} payload
 */
function buildBoardStepsMSPrompt(payload) {
  const subject = payload.subject || 'Maths/Science';
  const grade = payload.grade != null ? payload.grade : 10;
  const topicKey = payload.topicKey || payload.topic || '';
  const questionText = payload.questionText || payload.question || payload.prompt || '';
  const marks = Number(payload.marks) || undefined;
  const section = payload.section ? String(payload.section) : undefined;
  const proofAddendum = isProofWritingPayload(payload) ? buildProofWritingAddendum(payload, 'board_steps_ms') : '';
  const diagramRequired = shouldRequireDiagram(payload);
  const diagramType = diagramRequired ? inferDiagramType(payload) : '';
  const diagramLabels = diagramRequired ? diagramLabelsForType(diagramType) : null;
  const doubtContext = formatDoubtContext(payload);

  return [
    `You are a CBSE Board examiner + Gen-Z friendly tutor for Class ${grade} ${subject}.`,
    topicKey ? `Topic key: ${topicKey}.` : '',
    '',
    'TASK:',
    '- Create a CBSE marking-scheme style solution for the given question.',
    '- Use clear steps that would fetch marks in a board exam.',
    '- Assign marks per step so that the total equals the question marks.',
    '- Keep wording short and exam-like (no long essays).',
    '',
    'IF MARKS NOT PROVIDED:',
    '- Infer marks from section if possible (A=1, B=2, C=3, D=5, E=4). Otherwise choose the most reasonable marks based on the work required.',
    '',
    'OUTPUT FORMAT (IMPORTANT): Return ONLY valid JSON (no markdown, no backticks).',
    'CONCISENESS RULES (to avoid truncation):',
    '- Keep each step text short (ideally 1–2 lines).',
    '- Avoid long paragraphs; prefer bullet-style within a step if needed.',
    '- Aim for <= 14 steps for 1–5 marks, <= 20 steps for 6–10 marks, <= 28 steps for 11–20 marks.',
    '- Do NOT include any extra explanation outside the JSON.',
    'Schema:',
    '{',
    '  "kind": "board_steps_ms",',
    '  "totalMarks": number,',
    '  "steps": [',
    '    {',
    '      "text": "One exam step (what to write)",',
    '      "marks": number,',
    '      "whyThisGetsMarks": "1 line: what examiner awards marks for",',
    '      "commonMistake": "1 line: typical mistake that loses marks"',
    '    }',
    '  ],',
    '  "finalAnswer": "string",',
    diagramRequired ? `  "diagramType": "${diagramType}",` : '  // OPTIONAL (for geometry/figures):',
    diagramRequired ? `  "diagramLabels": ${JSON.stringify(diagramLabels)},` : '  "diagram": { "type": "triangle", "templateId": "triangle-basic", "payload": { ... } },',
    diagramRequired ? '' : '  "anchors": [ { "id": "A", "kind": "point|side|angle", "target": "A|BC|∠ABC", "label": "..." } ],',
    diagramRequired ? '' : '  "diagramSteps": [ { "stepId": "s1", "highlightAnchorIds": ["A","BC"] } ],',
    diagramRequired ? '  // IMPORTANT: No SVG. Frontend renders from diagramType.' : '  // IMPORTANT: No SVG. Frontend renders from the spec.',
    '  "warnings": ["optional short notes like \'draw diagram\' / \'units\'"]',
    '}',
    '',
      'RULES:',
      '- totalMarks MUST equal the sum of step.marks.',
      '- Keep steps minimal but complete for board marking.',
      diagramRequired ? '- Diagram is mandatory: include diagramType + diagramLabels.' : '- If a diagram is needed, add a warning in warnings.',
      '',
      proofAddendum ? `${proofAddendum}` : '',
      proofAddendum ? '' : '',
      doubtContext ? `${doubtContext}` : '',
      doubtContext ? '' : '',
      'QUESTION:',
      questionText,
      '',
      'METADATA:',
    marks ? `- marks=${marks}` : '- marks=UNKNOWN',
    section ? `- section=${section}` : '- section=UNKNOWN'
  ].filter(Boolean);
}


function buildMoreLikeThisUserPrompt(payload) {
  const subject = payload.subject || 'Maths/Science';
  const topicKey = payload.topicKey || '';
  const seed = payload.seedQuestion || {};
  const seedText = seed.text || seed.questionText || '';
  const marks = seed.marks != null ? seed.marks : '';
  const difficulty = seed.difficulty || '';
  const bloom = seed.bloomSkill || '';
  const numVariantsRaw = payload.numVariants != null ? payload.numVariants : 3;
  const numVariants = Math.max(1, Math.min(10, Number(numVariantsRaw) || 3));

  const lines = [
    `We are building an exam-style practice set for CBSE Class 10 ${subject}.`,
    topicKey ? `Topic key (chapter) in our system: ${topicKey}.` : '',
    'You will receive a seed board-style question from our highly-probable-question (HPQ) bank.',
    'Generate NEW questions on exactly the same underlying concept, not random other concepts.',
    '',
    'Seed question:',
    seedText,
    '',
    `Metadata: marks=${marks || 'same as seed'}, difficulty=${difficulty || 'same band'}, bloomSkill=${bloom || 'same as seed'}.`,
    '',
    `Generate ${numVariants} new CBSE board-style questions that:`,
    '- Keep the same marks value as the seed (or as close as reasonable).',
    '- Stay in the same difficulty band (Easy/Medium/Hard) and Bloom level.',
    '- Change numbers, scenarios, or wording so they are not copies of the seed.',
    '',
    'Return ONLY a single JSON object with this exact shape:',
    '{',
    '  "questions": [',
    '    {',
    '      "questionText": "...",',
    '      "marks": <number>,',
    '      "difficulty": "Easy | Medium | Hard",',
    '      "bloomSkill": "Remembering | Understanding | Applying | Analysing | Evaluating | Creating"',
    '    }',
    '  ]',
    '}',
    '',
    'Do not include explanations, answers, or any text outside this JSON.',
  ];

  return { userPrompt: lines.join('\n'), numVariants };
}

/**
 * Call Gemini generateContent (REST).
 * Docs: https://ai.google.dev/api  (Gemini API) and models list: /v1beta/models
 * @param {string} model
 * @param {Array<{role?: string, parts?: Array<{text?: string}>}>} contents
 * @param {{temperature?: number, maxOutputTokens?: number}} [config]
 */
async function callGemini(model, finalContents, config) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY (or GOOGLE_API_KEY) is not set. Put it in server/.env or as an environment variable.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const body = {
    contents: finalContents,
    generationConfig: {
      temperature: config && typeof config.temperature === 'number' ? config.temperature : 0.6,
      maxOutputTokens: config && typeof config.maxOutputTokens === 'number' ? config.maxOutputTokens : 900,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();

  // Typical response shape: candidates[0].content.parts[].text
  const parts =
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    Array.isArray(data.candidates[0].content.parts)
      ? data.candidates[0].content.parts
      : [];

  const text = parts
    .map((p) => (p && p.text ? String(p.text) : ''))
    .filter(Boolean)
    .join('\n')
    .trim();

  return { text, raw: data };
}

/**
 * Normalize request shapes:
 * - preferred: { mode, payload, persona? }
 * - legacy/flat: { mode, persona, subject, grade, topicKey, prompt/questionText/... }
 */
function normalizeMentorRequest(reqJson) {
  const mode = reqJson.mode;
  const persona = reqJson.persona || null;

  if (reqJson.payload && typeof reqJson.payload === 'object') {
    return { mode, persona, payload: reqJson.payload };
  }

  // Flat/legacy support
  const payload = {
    subject: reqJson.subject,
    grade: reqJson.grade,
    topicKey: reqJson.topicKey,
    topic: reqJson.topic,
    daysLeft: reqJson.daysLeft,
    targetPercent: reqJson.targetPercent,
    hoursPerDay: reqJson.hoursPerDay,
    extraNotes: reqJson.extraNotes,
    marks: reqJson.marks,
    questionText: reqJson.questionText || reqJson.question || reqJson.prompt || '',
  };

  return { mode, persona, payload };
}

/**
 * Main request handler.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
async function handleRequest(req, res) {
  // CORS preflight
  if (
    req.method === 'OPTIONS' &&
    (req.url === '/api/mentor' || req.url === '/api/more-like-this')
  ) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }

  // Health checks
  if (req.method === 'GET' && (req.url === '/health' || req.url === '/api/health')) {
    return sendJson(res, 200, {
      ok: true,
      service: 'lazytopper-ai-server',
      provider: 'gemini',
      model: GEMINI_MODEL,
      modelZombie: GEMINI_MODEL_ZOMBIE || null,
      modelBeast: GEMINI_MODEL_BEAST || null,
      hasKey: Boolean(GEMINI_API_KEY),
      node: process.version,
    });
  }

  // Mentor endpoint
  if (req.method === 'POST' && req.url === '/api/mentor') {
    let reqJson;
    try {
      reqJson = await readJson(req);
    } catch (e) {
      return sendJson(res, 400, { error: 'Invalid JSON' });
    }

    const { mode, persona, payload } = normalizeMentorRequest(reqJson);
    const isMisconceptionExplain = isLearnMisconceptionPayload(payload);
    const isCompetencyExplain = isLearnCompetencyPayload(payload);
    const isMindmapTeach = isLearnMindmapPayload(payload);
    const isProofWriting = isProofWritingPayload(payload);
    const isTrianglesEvaluation = isTrianglesEvaluationRequest(payload, reqJson?.messages);

    if (!mode) return sendJson(res, 400, { error: 'Missing "mode" in request body' });

    let normalisedMode = mode;
    if (mode === 'planner') normalisedMode = 'plan';
    if (mode === 'examCoach') normalisedMode = 'coach';
    // TopicHub / MentorPanel aliases
    if (mode === 'topic_explain') normalisedMode = 'explain';
    if (mode === 'topic_exam_tips') normalisedMode = 'coach';
    if (mode === 'topic_solve') normalisedMode = 'solve';
    if (mode === 'solve_with_me') normalisedMode = 'solve_with_me';
    if (mode === 'board_steps_ms') normalisedMode = 'board_steps_ms';
    if (isMisconceptionExplain || isCompetencyExplain || isMindmapTeach) normalisedMode = 'explain';
    if (isTrianglesEvaluation) normalisedMode = 'solve_with_me';

    // Build system prompt from persona (if provided as object)
    let systemPrompt = '';
    if (persona && typeof persona === 'object') {
      if (Array.isArray(persona.coreRules)) systemPrompt += persona.coreRules.join('\n') + '\n';
      if (Array.isArray(persona.modes)) {
        const cfg = persona.modes.find((m) => m && m.id === normalisedMode);
        if (cfg && cfg.systemPrompt) systemPrompt += cfg.systemPrompt;
      }
    }

    // Fallback defaults
    if (!systemPrompt) {
      switch (normalisedMode) {
        case 'plan':
          systemPrompt =
            'You are a CBSE Class 10 study planner. Create realistic, chapter-wise plans using the given context.';
          break;
        case 'solve':
          systemPrompt =
            'You are an expert CBSE Class 10 tutor. Use Socratic, step-by-step reasoning and end with a clear final answer.';
          break;
        case 'explain':
          systemPrompt =
            'You are a CBSE Class 10 concept explainer. Explain topics in simple steps, aligning with board exam style.';
          break;
        case 'coach':
        case 'mindset':
          systemPrompt =
            'You are a supportive CBSE exam coach and mindset mentor. Provide practical strategies and encouragement.';
          break;
        default:
          systemPrompt = 'You are a helpful CBSE Class 10 tutor for Maths and Science.';
      }
    }
    if (isMisconceptionExplain) {
      systemPrompt =
        'You are a strict CBSE Class 10 teacher. Output must follow the exact five-section format for misconceptions.';
    } else if (isCompetencyExplain) {
      systemPrompt =
        'You are a strict CBSE Class 10 teacher. Output must follow the exact five-section format for competencies.';
    } else if (isMindmapTeach) {
      systemPrompt =
        'You are a strict CBSE Class 10 teacher. Output must follow the exact five-section format for mindmap node teaching.';
    } else if (isTrianglesEvaluation) {
      systemPrompt =
        'You are a strict but supportive CBSE Class 10 examiner. Provide concise marking feedback only.';
    }

    // Build user prompt
    let userPrompt = '';
    try {
      if (isTrianglesEvaluation) {
        const attempt = extractStudentAttempt(payload, reqJson?.messages);
        userPrompt = buildTrianglesEvaluationPrompt(payload, attempt);
      } else switch (normalisedMode) {
        case 'plan':
          userPrompt = buildPlanUserPrompt(payload);
          break;
        case 'solve':
          userPrompt = buildSolveUserPrompt(payload);
          break;
        case 'solve_with_me':
          userPrompt = buildSolveWithMeProtocolPrompt(payload);
          break;
        case 'board_steps_ms':
          userPrompt = buildBoardStepsMSPrompt(payload);
          break;
        case 'explain':
          userPrompt = isMisconceptionExplain
            ? buildMisconceptionExplainPrompt(payload)
            : isCompetencyExplain
            ? buildCompetencyTeachPrompt(payload)
            : isMindmapTeach
            ? buildMindmapTeachPrompt(payload)
            : buildExplainUserPrompt(payload);
          break;
        case 'coach':
        case 'mindset':
          userPrompt = buildCoachUserPrompt(payload);
          break;
        default:
          return sendJson(res, 400, { error: `Unsupported mode: ${mode}` });
      }
    } catch (e) {
      return sendJson(res, 400, { error: 'Invalid payload' });
    }

    // Gemini content format (multi-turn supported):
    // We keep the system prompt as a leading instruction message,
    // then replay prior chat history (if any), then append the latest user prompt.
    const history = toGeminiContents(reqJson && reqJson.messages);
    const contents = [
      { role: 'user', parts: [{ text: String(systemPrompt || '').trim() }] },
      ...history,
      { role: 'user', parts: [{ text: String(userPrompt || '').trim() }] },
    ].filter((c) => c && c.parts && c.parts[0] && String(c.parts[0].text || '').trim());

    try {
      const marksRaw = payload && (payload.marks ?? payload.totalMarks ?? payload.total_marks);
      const marksNum = Number(marksRaw);
      const safeMarks = Number.isFinite(marksNum) && marksNum > 0 ? marksNum : 5;

      const maxOutputTokens =
        normalisedMode === 'board_steps_ms'
          ? Math.min(4096, Math.max(1400, 800 + Math.round(safeMarks * 180)))
          : normalisedMode === 'solve_with_me'
            ? 1400
            : 900;

      const contents = [
        { role: 'user', parts: [{ text: `${systemPrompt}

${userPrompt}` }] },
      ];

      const reply = await callGemini(GEMINI_MODEL, contents, {
        maxOutputTokens,
        temperature: normalisedMode === 'board_steps_ms' ? 0.25 : 0.35,
      });

      let finalText = reply.text;
      let structured = null;

        if (normalisedMode === 'board_steps_ms' || normalisedMode === 'solve_with_me') {
          structured = tryParseJsonStrict(finalText);

          if (!isValidMentorProtocol(structured, normalisedMode)) {
            const clipped = String(finalText || '').slice(0, 8000);
            const repairPrompt = [
              'You returned invalid or incomplete JSON for the required protocol.',
            'Return ONLY valid JSON (no markdown, no extra text).',
            (normalisedMode === 'solve_with_me'
              ? 'Required JSON shape: { "kind": "question" | "hint" | "final", "tutor": string, "mcq"?: object, "finalAnswer"?: string, "boardWriteup"?: string }.'
              : `Required kind: ${normalisedMode}.`),
            '',
            'Broken output (may be truncated):',
            clipped,
            '',
            'Now return the corrected JSON ONLY.',
          ].join('\n');

          const repairContents = [
            { role: 'user', parts: [{ text: `${systemPrompt}

${repairPrompt}` }] },
          ];

          const repaired = await callGemini(GEMINI_MODEL, repairContents, {
            maxOutputTokens,
            temperature: 0.2,
            });

            finalText = repaired.text;
            structured = tryParseJsonStrict(finalText);
          }

          if (isTrianglesEvaluation) {
            let evalCheck = validateTrianglesEvaluation(structured);
            if (!evalCheck.ok) {
              const repairPrompt = buildTrianglesEvaluationRepairPrompt(payload, evalCheck.issues);
              const repairContents = [
                { role: 'user', parts: [{ text: `${systemPrompt}\n\n${repairPrompt}` }] },
              ];
              const repaired = await callGemini(GEMINI_MODEL, repairContents, {
                maxOutputTokens,
                temperature: 0.2,
              });
              finalText = repaired.text;
              structured = tryParseJsonStrict(finalText);
              evalCheck = validateTrianglesEvaluation(structured);
            }
            if (!evalCheck.ok) {
              structured = buildTrianglesEvaluationFallback(payload);
              finalText = JSON.stringify(structured);
            }
          } else if (isProofWriting) {
            const isFirstTurn =
              normalisedMode === 'solve_with_me' && Array.isArray(reqJson?.messages)
                ? reqJson.messages.length <= 1
                : false;
            let proofCheck =
              normalisedMode === 'board_steps_ms'
                ? validateProofBoardSteps(structured, payload)
                : validateProofSolveWithMe(structured, payload, isFirstTurn);

            if (!proofCheck.ok) {
              const repairPrompt = buildProofRepairPrompt(normalisedMode, payload, proofCheck.issues);
              const repairContents = [
                { role: 'user', parts: [{ text: `${systemPrompt}\n\n${repairPrompt}` }] },
              ];
              const repaired = await callGemini(GEMINI_MODEL, repairContents, {
                maxOutputTokens,
                temperature: 0.2,
              });
              finalText = repaired.text;
              structured = tryParseJsonStrict(finalText);
              proofCheck =
                normalisedMode === 'board_steps_ms'
                  ? validateProofBoardSteps(structured, payload)
                  : validateProofSolveWithMe(structured, payload, isFirstTurn);
            }

            if (!proofCheck.ok) {
              structured =
                normalisedMode === 'board_steps_ms'
                  ? buildProofFallbackBoardSteps(payload)
                  : buildProofFallbackSolveWithMe(payload);
              finalText = JSON.stringify(structured);
            }
          }
        }

      if (isMisconceptionExplain) {
        finalText = sanitizeExplainOutput(finalText);
        if (!hasMisconceptionSections(finalText)) {
          const repairPrompt = [
            'Rewrite the answer using ONLY the five required sections, in order.',
            'Return plain text with the exact headings:',
            '1) Misconception',
            "2) Why it's wrong",
            '3) Correct CBSE rule/theorem',
            '4) Micro-example',
            '5) Exam tip',
            '',
            'Rules:',
            '- 1-3 short lines per section.',
            '- No questions, no JSON, no markdown.',
            '- No system or prompt references.',
          ].join('\n');

          const repairContents = [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\n${repairPrompt}` }] },
          ];
          const repaired = await callGemini(GEMINI_MODEL, repairContents, {
            maxOutputTokens: 700,
            temperature: 0.2,
          });
          finalText = sanitizeExplainOutput(repaired.text);
          if (!hasMisconceptionSections(finalText)) {
            finalText = fallbackMisconceptionResponse(payload);
          }
        }
        structured = null;
      } else if (isCompetencyExplain) {
        finalText = sanitizeExplainOutput(finalText);
        if (!hasCompetencySections(finalText)) {
          const repairPrompt = [
            'Rewrite the answer using ONLY the five required sections, in order.',
            'Return plain text with the exact headings:',
            '1) Competency definition',
            '2) How to detect in questions',
            '3) One worked mini-example',
            '4) Practice prompts (Easy / Medium / Hard)',
            '5) Expected answer format',
            '',
            'Rules:',
            '- 1-3 short lines per section.',
            '- No questions, no JSON, no markdown.',
            '- No system or prompt references.',
          ].join('\n');

          const repairContents = [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\n${repairPrompt}` }] },
          ];
          const repaired = await callGemini(GEMINI_MODEL, repairContents, {
            maxOutputTokens: 700,
            temperature: 0.2,
          });
          finalText = sanitizeExplainOutput(repaired.text);
          if (!hasCompetencySections(finalText)) {
            finalText = fallbackCompetencyResponse(payload);
          }
        }
        structured = null;
      } else if (isMindmapTeach) {
        finalText = sanitizeExplainOutput(finalText);
        if (!hasMindmapTeachSections(finalText)) {
          const repairPrompt = [
            'Rewrite the answer using ONLY the five required sections, in order.',
            'Return plain text with the exact headings:',
            '1) Concept',
            '2) Exam-writing sentence',
            '3) Solved mini-example',
            '4) Common exam error',
            '5) Check-for-understanding question',
            '',
            'Rules:',
            '- 1-2 short lines per section.',
            '- Exactly one mini-example and one check question.',
            '- No JSON, no markdown, no extra headings.',
            '- No system or prompt references.',
          ].join('\n');

          const repairContents = [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\n${repairPrompt}` }] },
          ];
          const repaired = await callGemini(GEMINI_MODEL, repairContents, {
            maxOutputTokens: 650,
            temperature: 0.2,
          });
          finalText = sanitizeExplainOutput(repaired.text);
          if (!hasMindmapTeachSections(finalText)) {
            finalText = fallbackMindmapTeachResponse(payload);
          }
        }
        structured = null;
      }

      if (normalisedMode === 'explain') {
        finalText = ensureDiagramLineInText(finalText, payload);
      }

      if (structured && (normalisedMode === 'board_steps_ms' || normalisedMode === 'solve_with_me')) {
        if (structured.kind === 'board_steps_ms') {
          structured = normalizeBoardSteps(structured);
        }
        structured = ensureDiagramFields(structured, payload);
        finalText = JSON.stringify(structured);
      }

      return sendJson(res, 200, {
        ok: true,
        data: {
          text: finalText,
          structured: structured && isValidMentorProtocol(structured, normalisedMode) ? structured : null,
        },
      });
    } catch (err) {
      console.error(err);
      return sendJson(res, 500, {
        error: 'Failed to query the AI service',
        details: err.message,
      });
    }
  }

  // More-like-this endpoint
  if (req.method === 'POST' && req.url === '/api/more-like-this') {
    let payload;
    try {
      payload = await readJson(req);
    } catch (e) {
      return sendJson(res, 400, { error: 'Invalid JSON' });
    }

    try {
      const { userPrompt, numVariants } = buildMoreLikeThisUserPrompt(payload);
      const subject = payload.subject || 'Maths/Science';

      const systemPrompt =
        'You are an expert CBSE Class 10 board question setter for Maths and Science. ' +
        'You strictly follow the CBSE exam blueprint, marks scheme and language style. ' +
        'You always generate high-quality board-style questions that are safe and syllabus-aligned.';

      const contents = [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
      ];

      const reply = await callGemini(GEMINI_MODEL, contents, {
        temperature: 0.6,
        maxOutputTokens: 900,
      });

      let variants = [];
      try {
        const parsed = JSON.parse(reply.text);
        if (parsed && Array.isArray(parsed.questions)) {
          variants = parsed.questions.map((q, idx) => ({
            questionText: String(q.questionText || q.text || '').trim(),
            marks:
              q.marks != null
                ? q.marks
                : payload.seedQuestion && payload.seedQuestion.marks != null
                ? payload.seedQuestion.marks
                : undefined,
            difficulty:
              q.difficulty ||
              (payload.seedQuestion && payload.seedQuestion.difficulty) ||
              undefined,
            bloomSkill:
              q.bloomSkill ||
              (payload.seedQuestion && payload.seedQuestion.bloomSkill) ||
              undefined,
            index: idx,
          }));
        }
      } catch (e) {
        // Fallback: treat each non-empty line as a question
        const seed = payload.seedQuestion || {};
        const lines = String(reply.text)
          .split(/\n+/)
          .map((l) => l.trim())
          .filter(Boolean);
        variants = lines.slice(0, numVariants).map((line, idx) => ({
          questionText: line.replace(/^\d+[.)]\s*/, ''),
          marks: seed.marks,
          difficulty: seed.difficulty,
          bloomSkill: seed.bloomSkill,
          index: idx,
        }));
      }

      return sendJson(res, 200, {
        subject,
        topicKey: payload.topicKey || null,
        provider: 'gemini',
        model: GEMINI_MODEL,
        variants,
      });
    } catch (err) {
      console.error(err);
      return sendJson(res, 500, {
        error: 'Failed to generate variants',
        details: err.message,
      });
    }
  }

  // 404
  return sendJson(res, 404, { error: 'Not Found' });
}

const server = http.createServer((req, res) => {
  // ensure async handler errors don't crash process
  handleRequest(req, res).catch((e) => {
    console.error(e);
    sendJson(res, 500, { error: 'Unhandled server error', details: e.message });
  });
});

server.listen(PORT, () => {
  console.log(`LazyTopper AI server running on port ${PORT}`);
  console.log(`Provider: Gemini | Model: ${GEMINI_MODEL} | KeyPresent: ${Boolean(GEMINI_API_KEY)}`);
});
function messagesToGeminiContents(messages, systemPrompt) {
  const contents = [];
  let injected = false;

  for (const m of messages || []) {
    const roleRaw = String(m?.role || "user").toLowerCase();
    if (roleRaw === "system") continue;

    const role = roleRaw === "assistant" ? "model" : "user";
    let text = String(m?.content ?? "");

    if (!injected && role === "user") {
      text = systemPrompt + "\n\n" + text;
      injected = true;
    }

    contents.push({ role, parts: [{ text }] });
  }

  if (!injected) {
    contents.unshift({ role: "user", parts: [{ text: systemPrompt }] });
  }

  return contents;
}
