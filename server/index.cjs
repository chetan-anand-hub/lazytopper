// index.cjs
//
// LazyTopper AI Gateway server
// - /api/mentor        : Mentor personas (plan / explain / solve / coach / mindset)
// - /api/more-like-this: HPQ-anchored "more like this" question variants
//
// This file is designed to run on Node 18+ (global fetch available).
// It uses the OpenAI Chat Completions API and expects the following env vars:
//
//   OPENAI_API_KEY  - required
//   OPENAI_MODEL    - optional, defaults to gpt-4o-mini
//
// Responses are simple JSON objects with CORS headers enabled so that the
// browser SPA can call them directly during early stages / demos.

const http = require('http');

const PORT = process.env.PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

/**
 * Helper to send JSON with CORS headers.
 *
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

/**
 * Build a user prompt for plan mode.
 *
 * The frontend can pass fields like:
 *   payload = {
 *     subject: "Maths" | "Science",
 *     topicKey?: string,
 *     daysLeft?: number,
 *     targetPercent?: number,
 *     hoursPerDay?: { total?: number } | number,
 *     extraNotes?: string
 *   }
 *
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
 *
 * @param {any} payload
 */
function buildSolveUserPrompt(payload) {
  const subject = payload.subject || 'Maths/Science';
  const marks = payload.marks != null ? payload.marks : '';
  const questionText = payload.questionText || payload.question || '';
  return [
    `Solve the following CBSE Class 10 ${subject} board-style question step by step.`,
    marks ? `The question carries ${marks} marks.` : '',
    'Show working clearly and then give the final answer.',
    '',
    questionText,
  ].filter(Boolean).join(' ');
}

/**
 * Build a user prompt for explain mode.
 *
 * @param {any} payload
 */
function buildExplainUserPrompt(payload) {
  const subject = payload.subject || 'Maths/Science';
  const topic = payload.topic || payload.topicKey || '';
  const questionText = payload.questionText || '';
  const parts = [
    `Explain this CBSE Class 10 ${subject} concept in simple, exam-oriented language.`,
    topic ? `Topic / chapter focus: ${topic}.` : '',
    'Use short steps, key formulas, and 1–2 quick examples if helpful.',
  ];
  if (questionText) {
    parts.push('Use the following board-style question as context:');
    parts.push(questionText);
  }
  return parts.filter(Boolean).join(' ');
}

/**
 * Build a user prompt for coach/mindset mode.
 *
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
 * Build a user prompt for HPQ-anchored "more like this" questions.
 *
 * Expected payload:
 * {
 *   subject: "Maths" | "Science",
 *   topicKey?: string,
 *   seedQuestion: {
 *     text: string,
 *     marks?: number,
 *     difficulty?: string,
 *     bloomSkill?: string
 *   },
 *   numVariants?: number
 * }
 *
 * @param {any} payload
 */
function buildMoreLikeThisUserPrompt(payload) {
  const subject = payload.subject || 'Maths/Science';
  const topicKey = payload.topicKey || '';
  const seed = payload.seedQuestion || {};
  const seedText = seed.text || '';
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

  return { userPrompt: lines.join('\\n'), numVariants };
}

/**
 * Call the OpenAI chat completions API with the given messages.
 *
 * @param {Array<{role: string, content: string}>} messages
 */
async function callLLM(messages) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.6,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LLM request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  const reply =
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content;

  return reply || '';
}

/**
 * Main request handler.
 *
 *  - POST /api/mentor
 *      { mode, payload, persona? }
 *
 *  - POST /api/more-like-this
 *      { subject, topicKey?, seedQuestion, numVariants? }
 *
 * CORS preflight: OPTIONS for both endpoints.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
function handleRequest(req, res) {
  // CORS preflight for SPA requests
  if (
    req.method === 'OPTIONS' &&
    (req.url === '/api/mentor' || req.url === '/api/more-like-this')
  ) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }

  // Mentor personas endpoint
  if (req.method === 'POST' && req.url === '/api/mentor') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      let reqJson;
      try {
        reqJson = JSON.parse(body || '{}');
      } catch (e) {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }

      const mode = reqJson.mode;
      const payload = reqJson.payload || {};
      const persona = reqJson.persona || null;

      if (!mode) {
        return sendJson(res, 400, { error: 'Missing "mode" in request body' });
      }

      // Normalise legacy names if any
      let normalisedMode = mode;
      if (mode === 'planner') normalisedMode = 'plan';
      if (mode === 'examCoach') normalisedMode = 'coach';

      // Build system prompt from persona (if provided)
      let systemPrompt = '';
      if (persona && Array.isArray(persona.coreRules)) {
        systemPrompt += persona.coreRules.join('\\n') + '\\n';
      }
      if (persona && Array.isArray(persona.modes)) {
        const cfg = persona.modes.find((m) => m.id === normalisedMode);
        if (cfg && cfg.systemPrompt) {
          systemPrompt += cfg.systemPrompt;
        }
      }
      if (!systemPrompt) {
        // Fallback defaults if persona is not provided
        switch (normalisedMode) {
          case 'plan':
            systemPrompt =
              'You are a CBSE Class 10 study planner. Create realistic, chapter-wise plans using the given context.';
            break;
          case 'solve':
            systemPrompt =
              'You are an expert CBSE Class 10 Maths/Science tutor. Solve questions step by step and show all working.';
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
            systemPrompt =
              'You are a helpful CBSE Class 10 tutor for Maths and Science.';
        }
      }

      // Build user prompt based on mode
      let userPrompt = '';
      try {
        switch (normalisedMode) {
          case 'plan':
            userPrompt = buildPlanUserPrompt(payload);
            break;
          case 'solve':
            userPrompt = buildSolveUserPrompt(payload);
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

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      let replyText;
      try {
        replyText = await callLLM(messages);
      } catch (err) {
        console.error(err);
        return sendJson(res, 500, {
          error: 'Failed to query the AI service',
          details: err.message,
        });
      }

      const meta = {
        systemPromptUsed: systemPrompt,
        personaId: persona ? persona.id : undefined,
        model: OPENAI_MODEL,
      };

      sendJson(res, 200, {
        mode: normalisedMode,
        data: { text: replyText },
        meta,
      });
    });

    return;
  }

  // "More like this" endpoint for HPQ-style variants
  if (req.method === 'POST' && req.url === '/api/more-like-this') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      let payload;
      try {
        payload = JSON.parse(body || '{}');
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

        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ];

        let raw;
        try {
          raw = await callLLM(messages);
        } catch (err) {
          console.error(err);
          return sendJson(res, 500, {
            error: 'Failed to query the AI service',
            details: err.message,
          });
        }

        let variants = [];
        try {
          const parsed = JSON.parse(raw);
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
          const lines = String(raw)
            .split(/\\n+/)
            .map((l) => l.trim())
            .filter(Boolean);
          variants = lines.slice(0, numVariants).map((line, idx) => ({
            questionText: line.replace(/^\\d+[.)]\\s*/, ''),
            marks: seed.marks,
            difficulty: seed.difficulty,
            bloomSkill: seed.bloomSkill,
            index: idx,
          }));
        }

        sendJson(res, 200, {
          subject,
          topicKey: payload.topicKey || null,
          model: OPENAI_MODEL,
          variants,
        });
      } catch (err) {
        console.error(err);
        return sendJson(res, 500, {
          error: 'Failed to generate variants',
          details: err.message,
        });
      }
    });

    return;
  }

  // Fallback 404
  sendJson(res, 404, { error: 'Not Found' });
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`LazyTopper AI server running on port ${PORT}`);
});
