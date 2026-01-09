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
  const parts = [
    `Explain this CBSE Class 10 ${subject} concept in simple, exam-oriented language.`,
    topic ? `Topic / chapter focus: ${topic}.` : '',
    'Use short bullet steps, key formulas, and 1–2 quick examples if helpful.',
  ];
  if (questionText) {
    parts.push('Use the following board-style question as context:');
    parts.push(String(questionText).trim());
  }
  return parts.filter(Boolean).join(' ');
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
    '  "warnings": ["optional short notes like \'draw diagram\' / \'units\'"]',
    '}',
    '',
    'RULES:',
    '- totalMarks MUST equal the sum of step.marks.',
    '- Keep steps minimal but complete for board marking.',
    '- If a diagram is needed, add a warning in warnings.',
    '',
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

    // Build user prompt
    let userPrompt = '';
    try {
      switch (normalisedMode) {
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
          userPrompt = buildExplainUserPrompt(payload);
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
