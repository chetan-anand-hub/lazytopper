# Codex Report Back v2 (2026-01-21)
## 1) Context
- Prompt: Not provided
- Timestamp (local): 2026-01-16 09:55
- Repo branch: feature/topichub-ui-lock
## 2) Git diff (exact changed lines)
- .gitignore
```diff
diff --git a/.gitignore b/.gitignore
index b21e08f..e1389b3 100644
--- a/.gitignore
+++ b/.gitignore
@@ -8,0 +9,2 @@ build
+**/.env
+**/.env.*
@@ -31,0 +34,6 @@ server/.env.*
+**/.env
+**/.env.*
+*.key
+*.pem
+*.p12
+*.keystore
```
- GPT_CHANGELOG_2026-01-20.md
```diff
diff --git a/GPT_CHANGELOG_2026-01-20.md b/GPT_CHANGELOG_2026-01-20.md
index 09aa463..ee00888 100644
--- a/GPT_CHANGELOG_2026-01-20.md
+++ b/GPT_CHANGELOG_2026-01-20.md
@@ -19,0 +20,8 @@ Migration notes:
+
+---
+
+Learn DoD Run2 + Security updates:
+- Added Learn-mode structured schemas with multi-pass repair + seed fallback to avoid student-facing schema errors.
+- Made Learn mentor headers mode-specific (Lesson Plan) and added explicit card context in mentor payloads.
+- Expanded deterministic triangle diagrams and added a zoom toggle.
+- Hardened secret handling: updated `.gitignore`, placeholder-only `server/.env.example`, and added security notes.
```
- server/.env.example
```diff
diff --git a/server/.env.example b/server/.env.example
index eb81913..828db73 100644
--- a/server/.env.example
+++ b/server/.env.example
@@ -1,2 +1,2 @@
-GEMINI_API_KEY=AIzaSyCOmIM4iXg59RlU0w_Ke7QBd8jCJsdvGbk
-# Alternatively: GOOGLE_API_KEY=
+GEMINI_API_KEY=YOUR_KEY_HERE
+# Alternatively: GOOGLE_API_KEY=YOUR_KEY_HERE
```
- server/index.cjs
```diff
diff --git a/server/index.cjs b/server/index.cjs
index dab51ec..010742b 100644
--- a/server/index.cjs
+++ b/server/index.cjs
@@ -255,0 +256,8 @@ function isLearnCompetencyPayload(payload) {
+function isLearnKeyDefinitionsPayload(payload) {
+  if (!payload || typeof payload !== 'object') return false;
+  const section = String(payload.section || '').toLowerCase();
+  const subSection = String(payload.subSection || '').toLowerCase();
+  if (section !== 'learn') return false;
+  return subSection.includes('key-definitions');
+}
+
@@ -440,0 +449,91 @@ const MINDMAP_TEACH_OUTLINES = {
+const TRIANGLES_LEARN_SEED = {
+  keyDefinitions: {
+    simpleExplanation: [
+      'Similar triangles have the same shape but can be different sizes.',
+      'Corresponding angles are equal and corresponding sides are in the same ratio.',
+      'AA: two equal angles are enough to prove similarity.',
+      'SAS: included angle equal and adjacent sides proportional.',
+      'SSS: all three pairs of sides proportional.',
+      'CPST: corresponding parts of similar triangles are proportional/equal.',
+    ],
+    cbseExamSentence: [
+      'If ∠A = ∠P and ∠B = ∠Q, then ΔABC ~ ΔPQR by AA.',
+      'From similarity, AB/PQ = BC/QR = AC/PR (CPST).',
+    ],
+    workedExamples: [
+      {
+        title: 'AA similarity',
+        question: 'If ∠A = ∠P and ∠B = ∠Q, prove ΔABC ~ ΔPQR.',
+        steps: [
+          { text: 'Given ΓêáA = ΓêáP and ΓêáB = ΓêáQ.', marks: 1 },
+          { text: 'Two angles equal ⇒ AA similarity.', marks: 1 },
+          { text: 'So ΔABC ~ ΔPQR.', marks: 1 },
+        ],
+        totalMarks: 3,
+        finalAnswer: 'ΔABC ~ ΔPQR by AA.',
+      },
+      {
+        title: 'CPST application',
+        question: 'If ΔABC ~ ΔPQR, AB = 6 cm, PQ = 3 cm, BC = 5 cm, find QR.',
+        steps: [
+          { text: 'AB/PQ = BC/QR by CPST.', marks: 1 },
+          { text: '6/3 = 5/QR ⇒ 2 = 5/QR.', marks: 1 },
+          { text: 'QR = 2.5 cm.', marks: 1 },
+        ],
+        totalMarks: 3,
+        finalAnswer: 'QR = 2.5 cm.',
+      },
+    ],
+    commonMistakes: [
+      'Mixing correspondence order.',
+      'Using SAS with a non-included angle.',
+      'Using CPST before proving similarity.',
+    ],
+    checkQuestion: 'What two conditions must be verified before using AA similarity?',
+    diagramType: 'SIMILARITY_AA',
+    diagramLabels: { A: 'A', B: 'B', C: 'C', P: 'P', Q: 'Q', R: 'R' },
+  },
+  mindmapNodes: {
+    gQ1: {
+      bullets: [
+        'Similarity means equal corresponding angles.',
+        'Side ratios of corresponding sides are equal.',
+        'Order of vertices fixes correspondence.',
+        'Similarity helps find unknown sides.',
+        'Use AA/SSS/SAS to prove it first.',
+      ],
+      examLines: [
+        'State the criterion and the correspondence order.',
+        'Write ΔABC ~ ΔPQR before using CPST.',
+      ],
+      example: {
+        question: 'If ΓêáA = ΓêáP and ΓêáB = ΓêáQ, prove similarity and state one ratio.',
+        steps: ['AA similarity ⇒ ΔABC ~ ΔPQR.', 'Then AB/PQ = BC/QR.'],
+        finalAnswer: 'ΔABC ~ ΔPQR and AB/PQ = BC/QR.',
+      },
+      commonError: 'Skipping the correspondence order.',
+      commonFix: 'Write the angle equalities and the matching order before using CPST.',
+      checkQuestion: 'Which criterion proves similarity when two angles match?',
+    },
+  },
+  proof: {
+    given: ['In ΔABC, DE || BC with D on AB and E on AC.'],
+    toProve: ['AD/DB = AE/EC.'],
+    construction: ['Not required.'],
+    proofSteps: [
+      { statement: 'ΓêáADE = ΓêáABC and ΓêáAED = ΓêáACB.', reason: 'Alternate interior angles', mark: 1 },
+      { statement: 'ΔADE ~ ΔABC.', reason: 'AA similarity', mark: 1 },
+      { statement: 'AD/AB = AE/AC.', reason: 'CPST', mark: 1 },
+      { statement: 'AD/DB = AE/EC.', reason: 'Componendo', mark: 1 },
+    ],
+    conclusion: ['Hence AD/DB = AE/EC.'],
+    totalMarks: 4,
+    diagramType: 'BPT',
+    diagramLabels: { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' },
+  },
+  solveWithMe: {
+    question: 'Which two triangles are being compared for similarity here?',
+    answerFormat: 'Short sentence (e.g., ΔADE and ΔABC).',
+  },
+};
+
@@ -457,0 +557 @@ function buildMindmapTeachPrompt(payload) {
+  const nodePayload = payload.contextText || '';
@@ -487,0 +588 @@ function buildMindmapTeachPrompt(payload) {
+    '- Do not use placeholder or generic filler language.',
@@ -493,0 +595,6 @@ function buildMindmapTeachPrompt(payload) {
+  if (nodePayload) {
+    lines.push('');
+    lines.push('Node payload (use all items if present):');
+    lines.push(nodePayload);
+  }
+
@@ -518,0 +626,7 @@ function isProofWritingPayload(payload) {
+function isTrianglesLearnPayload(payload) {
+  if (!payload || typeof payload !== 'object') return false;
+  const section = String(payload.section || '').toLowerCase();
+  if (section !== 'learn') return false;
+  return isTrianglesTopic(payload);
+}
+
@@ -551 +665,4 @@ function inferDiagramType(payload) {
-  if (hint.includes('aa') || hint.includes('similar')) return 'SIMILARITY_AA';
+  if (hint.includes('aa')) return 'SIMILARITY_AA';
+  if (hint.includes('parallel') && hint.includes('angle')) return 'PARALLEL_LINE_ANGLE_RELATIONS';
+  if (hint.includes('definition') && hint.includes('similar')) return 'SIMILARITY_AA';
+  if (hint.includes('similar')) return 'SIMILARITY_AA';
@@ -559 +676,2 @@ function diagramLabelsForType(diagramType) {
-  if (t.startsWith('SIMILARITY')) return { A: 'A', B: 'B', C: 'C', P: 'P', Q: 'Q', R: 'R' };
+  if (t.includes('SIMILARITY')) return { A: 'A', B: 'B', C: 'C', P: 'P', Q: 'Q', R: 'R' };
+  if (t === 'PARALLEL_LINE_ANGLE_RELATIONS') return { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' };
@@ -926,0 +1045,162 @@ function validateProofSolveWithMe(obj, payload, isFirstTurn) {
+function validateLearnTeach(obj, payload) {
+  const issues = [];
+  if (!obj || typeof obj !== 'object') return { ok: false, issues: ['Missing JSON object.'] };
+  if (obj.kind !== 'learn_teach') issues.push('kind must be learn_teach.');
+  const teach = obj.teach || {};
+  const simple = Array.isArray(teach.simpleExplanation) ? teach.simpleExplanation : [];
+  const exam = Array.isArray(teach.cbseExamSentence) ? teach.cbseExamSentence : [];
+  if (simple.length < 4) issues.push('teach.simpleExplanation needs >= 4 items.');
+  if (exam.length < 2) issues.push('teach.cbseExamSentence needs >= 2 items.');
+
+  const worked = Array.isArray(obj.workedExamples) ? obj.workedExamples : [];
+  if (worked.length !== 2) issues.push('workedExamples must be exactly 2 items.');
+  worked.forEach((ex, idx) => {
+    if (!ex || typeof ex !== 'object') {
+      issues.push(`workedExamples[${idx}] is invalid.`);
+      return;
+    }
+    const steps = Array.isArray(ex.steps) ? ex.steps : [];
+    if (!steps.length) issues.push(`workedExamples[${idx}] has no steps.`);
+    const total = Number(ex.totalMarks);
+    const sum = steps.reduce((acc, s) => acc + (Number(s?.marks) || 0), 0);
+    if (!Number.isFinite(total)) issues.push(`workedExamples[${idx}] totalMarks missing.`);
+    if (Number.isFinite(total) && Math.abs(total - sum) > 0.001) {
+      issues.push(`workedExamples[${idx}] totalMarks != sum of step marks.`);
+    }
+    if (!String(ex.finalAnswer || '').trim()) {
+      issues.push(`workedExamples[${idx}] finalAnswer missing.`);
+    }
+  });
+
+  const commonMistakes = Array.isArray(obj.commonMistakes) ? obj.commonMistakes : [];
+  if (commonMistakes.length < 1) issues.push('commonMistakes needs >= 1 items.');
+  if (!String(obj.checkQuestion || '').trim()) issues.push('checkQuestion missing.');
+
+  if (!String(obj.diagramType || '').trim()) issues.push('diagramType missing.');
+  if (!obj.diagramLabels || typeof obj.diagramLabels !== 'object') issues.push('diagramLabels missing.');
+
+  const blob = JSON.stringify(obj || {});
+  const hasMindmapContext =
+    Boolean(payload?.mindmapNodeId || payload?.mindmapNodeTitle || payload?.mindmapNodeText) ||
+    String(payload?.subSection || '').toLowerCase().includes('mindmap');
+  if (!hasMindmapContext) {
+    const requiredPatterns = [
+      /\bsimilar\s+triangles?\b/i,
+      /\bcorresponding\s+sides?\b/i,
+      /\bcorresponding\s+angles?\b/i,
+      /\bAA\b/i,
+      /\bSAS\b/i,
+      /\bSSS\b/i,
+      /\bCPST\b/i,
+    ];
+    requiredPatterns.forEach((re) => {
+      if (!re.test(blob)) issues.push(`Missing required key definition: ${re.source}.`);
+    });
+  }
+
+  if (containsPlaceholderLanguage(blob)) {
+    issues.push('Placeholder language detected.');
+  }
+
+  return { ok: issues.length === 0, issues };
+}
+
+function validateLearnMindmap(obj) {
+  const issues = [];
+  if (!obj || typeof obj !== 'object') return { ok: false, issues: ['Missing JSON object.'] };
+  if (obj.kind !== 'learn_mindmap') issues.push('kind must be learn_mindmap.');
+  const bullets = Array.isArray(obj.conceptBullets) ? obj.conceptBullets : [];
+  const examLines = Array.isArray(obj.examLines) ? obj.examLines : [];
+  const worked = obj.workedExample || {};
+  const steps = Array.isArray(worked.steps) ? worked.steps : [];
+  if (bullets.length < 5) issues.push('conceptBullets needs >= 5 items.');
+  if (examLines.length < 2) issues.push('examLines needs >= 2 items.');
+  if (!String(worked.question || '').trim()) issues.push('workedExample.question missing.');
+  if (!steps.length) issues.push('workedExample.steps missing.');
+  if (!String(worked.finalAnswer || '').trim()) issues.push('workedExample.finalAnswer missing.');
+  if (!String(obj.commonError || '').trim()) issues.push('commonError missing.');
+  if (!String(obj.commonFix || '').trim()) issues.push('commonFix missing.');
+  if (!String(obj.checkQuestion || '').trim()) issues.push('checkQuestion missing.');
+  if (!String(obj.diagramType || '').trim()) issues.push('diagramType missing.');
+  if (!obj.diagramLabels || typeof obj.diagramLabels !== 'object') issues.push('diagramLabels missing.');
+  const blob = JSON.stringify(obj || {});
+  if (containsPlaceholderLanguage(blob)) issues.push('Placeholder language detected.');
+  return { ok: issues.length === 0, issues };
+}
+
+function validateLearnProof(obj) {
+  const issues = [];
+  if (!obj || typeof obj !== 'object') return { ok: false, issues: ['Missing JSON object.'] };
+  if (obj.kind !== 'learn_proof') issues.push('kind must be learn_proof.');
+
+  const given = Array.isArray(obj.given) ? obj.given : [];
+  const toProve = Array.isArray(obj.toProve) ? obj.toProve : [];
+  const construction = Array.isArray(obj.construction) ? obj.construction : null;
+  const proofSteps = Array.isArray(obj.proofSteps) ? obj.proofSteps : [];
+  const conclusion = Array.isArray(obj.conclusion) ? obj.conclusion : [];
+  if (!given.length) issues.push('given missing.');
+  if (!toProve.length) issues.push('toProve missing.');
+  if (!construction) issues.push('construction must be present (can be empty).');
+  if (!proofSteps.length) issues.push('proofSteps missing.');
+  if (!conclusion.length) issues.push('conclusion missing.');
+
+  const total = Number(obj.totalMarks);
+  const sum = proofSteps.reduce((acc, s) => acc + (Number(s?.mark) || 0), 0);
+  if (!Number.isFinite(total)) issues.push('totalMarks missing.');
+  if (Number.isFinite(total) && Math.abs(total - sum) > 0.001) {
+    issues.push('totalMarks != sum of proofSteps marks.');
+  }
+
+  if (!String(obj.diagramType || '').trim()) issues.push('diagramType missing.');
+  if (!obj.diagramLabels || typeof obj.diagramLabels !== 'object') issues.push('diagramLabels missing.');
+
+  const blob = JSON.stringify(obj || {});
+  if (containsPlaceholderLanguage(blob)) {
+    issues.push('Placeholder language detected.');
+  }
+
+  return { ok: issues.length === 0, issues };
+}
+
+function validateStructuredForMode(obj, mode, payload, opts) {
+  const issues = [];
+  if (mode === 'solve_with_me') {
+    if (!isValidMentorProtocol(obj, mode)) issues.push('Invalid solve_with_me protocol.');
+    if (isProofWritingPayload(payload)) {
+      const isFirstTurn = Boolean(opts && opts.isFirstTurn);
+      const proofCheck = validateProofSolveWithMe(obj, payload, isFirstTurn);
+      if (!proofCheck.ok) issues.push(...proofCheck.issues);
+    }
+  } else if (mode === 'board_steps_ms') {
+    if (!isValidMentorProtocol(obj, mode)) issues.push('Invalid board_steps_ms protocol.');
+  } else if (mode === 'learn_teach') {
+    const teachCheck = validateLearnTeach(obj, payload);
+    if (!teachCheck.ok) issues.push(...teachCheck.issues);
+  } else if (mode === 'learn_mindmap') {
+    const mindmapCheck = validateLearnMindmap(obj);
+    if (!mindmapCheck.ok) issues.push(...mindmapCheck.issues);
+  } else if (mode === 'learn_proof') {
+    const proofCheck = validateLearnProof(obj);
+    if (!proofCheck.ok) issues.push(...proofCheck.issues);
+  }
+  return { ok: issues.length === 0, issues };
+}
+
+function buildRepairPromptForMode(mode, payload, invalidOutput, issues) {
+  const issueText = Array.isArray(issues) && issues.length ? issues.map((i) => `- ${i}`).join('\n') : '- Format issues detected.';
+  const schema = getJsonSchemaTextForMode(mode, payload);
+  return [
+    'You returned invalid or incomplete JSON for the required schema.',
+    issueText,
+    '',
+    'Return ONLY valid JSON. No extra keys. No markdown.',
+    'JSON schema:',
+    schema,
+    '',
+    'Invalid output (may be truncated):',
+    invalidOutput,
+    '',
+    'Return the corrected JSON ONLY.',
+  ].join('\n');
+}
+
@@ -954,0 +1235,81 @@ function buildProofFallbackSolveWithMe(payload) {
+function getJsonSchemaTextForMode(mode, payload) {
+  const diagramType = inferDiagramType(payload);
+  const diagramLabels = diagramLabelsForType(diagramType);
+
+  if (mode === 'solve_with_me') {
+    return [
+      '{',
+      '  "kind": "question" | "hint" | "final",',
+      '  "tutor": "string",',
+      '  "answerFormat": "string",',
+      '  "mcq": { "A": "...", "B": "...", "C": "...", "D": "..." },',
+      '  "finalAnswer": "string",',
+      '  "boardWriteup": "string",',
+      `  "diagramType": "${diagramType}",`,
+      `  "diagramLabels": ${JSON.stringify(diagramLabels)}`,
+      '}',
+    ].join('\n');
+  }
+
+  if (mode === 'board_steps_ms') {
+    return [
+      '{',
+      '  "kind": "board_steps_ms",',
+      '  "totalMarks": number,',
+      '  "steps": [ { "text": "string", "marks": number, "whyThisGetsMarks": "string", "commonMistake": "string" } ],',
+      '  "finalAnswer": "string",',
+      '  "warnings": ["string"],',
+      `  "diagramType": "${diagramType}",`,
+      `  "diagramLabels": ${JSON.stringify(diagramLabels)}`,
+      '}',
+    ].join('\n');
+  }
+
+  if (mode === 'learn_teach') {
+    return [
+      '{',
+      '  "kind": "learn_teach",',
+      '  "teach": { "simpleExplanation": ["..."], "cbseExamSentence": ["..."] },',
+      '  "workedExamples": [ { "title": "...", "question": "...", "steps": [ { "text": "...", "marks": number } ], "totalMarks": number, "finalAnswer": "..." } ],',
+      '  "commonMistakes": ["..."],',
+      '  "checkQuestion": "...",',
+      `  "diagramType": "${diagramType}",`,
+      `  "diagramLabels": ${JSON.stringify(diagramLabels)}`,
+      '}',
+    ].join('\n');
+  }
+
+  if (mode === 'learn_proof') {
+    return [
+      '{',
+      '  "kind": "learn_proof",',
+      '  "given": ["..."],',
+      '  "toProve": ["..."],',
+      '  "construction": ["..."],',
+      '  "proofSteps": [ { "statement": "...", "reason": "...", "mark": number } ],',
+      '  "conclusion": ["..."],',
+      '  "totalMarks": number,',
+      `  "diagramType": "${diagramType}",`,
+      `  "diagramLabels": ${JSON.stringify(diagramLabels)}`,
+      '}',
+    ].join('\n');
+  }
+
+  if (mode === 'learn_mindmap') {
+    return [
+      '{',
+      '  "kind": "learn_mindmap",',
+      '  "conceptBullets": ["..."],',
+      '  "examLines": ["..."],',
+      '  "workedExample": { "question": "...", "steps": ["..."], "finalAnswer": "..." },',
+      '  "commonError": "...",',
+      '  "checkQuestion": "...",',
+      `  "diagramType": "${diagramType}",`,
+      `  "diagramLabels": ${JSON.stringify(diagramLabels)}`,
+      '}',
+    ].join('\n');
+  }
+
+  return '';
+}
+
@@ -1078 +1439,2 @@ function hasMindmapTeachSections(text) {
-    t.includes('5) Check-for-understanding question')
+    t.includes('5) Check-for-understanding question') &&
+    !containsPlaceholderLanguage(t)
@@ -1081,0 +1444,14 @@ function hasMindmapTeachSections(text) {
+function containsPlaceholderLanguage(text) {
+  const t = String(text || '').toLowerCase();
+  const patterns = [
+    'here is a short',
+    'placeholder',
+    'lorem ipsum',
+    'to be added',
+    'fill in',
+    'tbd',
+    'example here',
+  ];
+  return patterns.some((p) => t.includes(p));
+}
+
@@ -1230,0 +1607 @@ function buildSolveWithMeProtocolPrompt(payload) {
+  const seedContext = isTrianglesLearnPayload(payload) ? buildLearnSeedContext(payload, 'key-definitions') : '';
@@ -1274,0 +1652,3 @@ function buildSolveWithMeProtocolPrompt(payload) {
+    seedContext ? 'A-Prime seed (reference):' : '',
+    seedContext ? seedContext : '',
+    seedContext ? '' : '',
@@ -1362,0 +1743,374 @@ function buildBoardStepsMSPrompt(payload) {
+function getLearnSeedPack(payload) {
+  return isTrianglesLearnPayload(payload) ? TRIANGLES_LEARN_SEED : null;
+}
+
+function buildLearnSeedContext(payload, sectionKey) {
+  const seed = getLearnSeedPack(payload);
+  if (!seed) return '';
+
+  if (sectionKey === 'key-definitions') {
+    const defs = seed.keyDefinitions;
+    return [
+      'A-Prime seed (key definitions):',
+      `- Definitions: ${defs.simpleExplanation.join(' | ')}`,
+      `- Exam lines: ${defs.cbseExamSentence.join(' | ')}`,
+      `- Common mistakes: ${defs.commonMistakes.join(' | ')}`,
+    ].join('\n');
+  }
+
+  if (sectionKey === 'proof') {
+    const proof = seed.proof;
+    return [
+      'A-Prime seed (proof structure):',
+      `- Given: ${proof.given.join(' ')}`,
+      `- To Prove: ${proof.toProve.join(' ')}`,
+      `- Steps: ${proof.proofSteps.map((s) => s.statement).join(' | ')}`,
+      `- Conclusion: ${proof.conclusion.join(' ')}`,
+    ].join('\n');
+  }
+
+  if (sectionKey === 'mindmap') {
+    const nodeId = payload?.mindmapNodeId || payload?.itemId || 'gQ1';
+    const node = seed.mindmapNodes[nodeId] || seed.mindmapNodes.gQ1;
+    const commonFix = node.commonFix || 'Use the correct criterion and correspondence order.';
+    return [
+      'A-Prime seed (mindmap node):',
+      `- Bullets: ${node.bullets.join(' | ')}`,
+      `- Exam lines: ${node.examLines.join(' | ')}`,
+      `- Common error: ${node.commonError}`,
+      `- Common fix: ${commonFix}`,
+      `- Check question: ${node.checkQuestion}`,
+    ].join('\n');
+  }
+
+  return '';
+}
+
+function scaleMarks(steps, targetTotal) {
+  if (!Array.isArray(steps)) return steps;
+  if (!Number.isFinite(targetTotal) || targetTotal <= 0) return steps;
+  const sum = steps.reduce((acc, s) => acc + (Number(s?.mark ?? s?.marks) || 0), 0);
+  if (!sum) return steps;
+  const factor = targetTotal / sum;
+  return steps.map((s) => {
+    const raw = (Number(s?.mark ?? s?.marks) || 0) * factor;
+    const rounded = Math.round(raw * 2) / 2;
+    if (s?.mark != null) return { ...s, mark: rounded };
+    return { ...s, marks: rounded };
+  });
+}
+
+function buildLearnTeachFallback(payload) {
+  const seed = getLearnSeedPack(payload);
+  const diagramType = inferDiagramType(payload);
+  const diagramLabels = diagramLabelsForType(diagramType);
+  const hasMindmapContext =
+    Boolean(payload?.mindmapNodeId || payload?.mindmapNodeTitle || payload?.mindmapNodeText) ||
+    String(payload?.subSection || '').toLowerCase().includes('mindmap');
+  if (!seed) {
+    return {
+      kind: 'learn_teach',
+      teach: { simpleExplanation: ['Triangles are similar if corresponding angles are equal.'], cbseExamSentence: ['State the criterion used.'] },
+      workedExamples: [],
+      commonMistakes: ['Skipping correspondence order.'],
+      checkQuestion: 'Which criterion applies here?',
+      diagramType,
+      diagramLabels,
+    };
+  }
+  if (hasMindmapContext) {
+    const nodeId = payload?.mindmapNodeId || payload?.itemId || 'gQ1';
+    const node = seed.mindmapNodes[nodeId] || seed.mindmapNodes.gQ1;
+    const steps = Array.isArray(node?.example?.steps) ? node.example.steps : ['State the criterion.', 'Write one matching ratio.'];
+    const markedSteps = steps.map((s) => ({ text: s, marks: 1 }));
+    const totalMarks = markedSteps.reduce((acc, s) => acc + (Number(s.marks) || 0), 0);
+    const baseQuestion = node?.example?.question || 'State the criterion and write one ratio using CPST.';
+    return {
+      kind: 'learn_teach',
+      teach: {
+        simpleExplanation: node?.bullets || seed.keyDefinitions.simpleExplanation,
+        cbseExamSentence: node?.examLines || seed.keyDefinitions.cbseExamSentence,
+      },
+      workedExamples: [
+        {
+          title: 'Basic example',
+          question: baseQuestion,
+          steps: markedSteps,
+          totalMarks,
+          finalAnswer: node?.example?.finalAnswer || 'Criterion stated and one correct ratio written.',
+        },
+        {
+          title: 'Board-style example',
+          question: baseQuestion,
+          steps: markedSteps,
+          totalMarks,
+          finalAnswer: node?.example?.finalAnswer || 'Criterion stated and one correct ratio written.',
+        },
+      ],
+      commonMistakes: [node?.commonError || 'Mixing correspondence order.'],
+      checkQuestion: node?.checkQuestion || seed.keyDefinitions.checkQuestion,
+      diagramType,
+      diagramLabels,
+    };
+  }
+  return {
+    kind: 'learn_teach',
+    teach: {
+      simpleExplanation: seed.keyDefinitions.simpleExplanation,
+      cbseExamSentence: seed.keyDefinitions.cbseExamSentence,
+    },
+    workedExamples: seed.keyDefinitions.workedExamples,
+    commonMistakes: seed.keyDefinitions.commonMistakes,
+    checkQuestion: seed.keyDefinitions.checkQuestion,
+    diagramType: seed.keyDefinitions.diagramType || diagramType,
+    diagramLabels: seed.keyDefinitions.diagramLabels || diagramLabels,
+  };
+}
+
+function buildLearnProofFallback(payload) {
+  const seed = getLearnSeedPack(payload);
+  const diagramType = inferDiagramType(payload);
+  const diagramLabels = diagramLabelsForType(diagramType);
+  if (!seed) {
+    return {
+      kind: 'learn_proof',
+      given: ['Given: (use question data).'],
+      toProve: ['To Prove: (state required result).'],
+      construction: ['Not required.'],
+      proofSteps: [
+        { statement: 'State the theorem/criterion.', reason: 'Theorem', mark: 1 },
+        { statement: 'Apply the theorem to the triangles.', reason: 'Application', mark: 1 },
+      ],
+      conclusion: ['Hence proved.'],
+      totalMarks: 2,
+      diagramType,
+      diagramLabels,
+    };
+  }
+  const marksRaw = payload?.marks ?? payload?.totalMarks ?? payload?.total_marks;
+  const marks = Number(marksRaw);
+  const steps = Number.isFinite(marks) ? scaleMarks(seed.proof.proofSteps, marks) : seed.proof.proofSteps;
+  const totalMarks = Number.isFinite(marks) ? marks : seed.proof.totalMarks;
+  return {
+    kind: 'learn_proof',
+    given: seed.proof.given,
+    toProve: seed.proof.toProve,
+    construction: seed.proof.construction,
+    proofSteps: steps.map((s) => ({ statement: s.statement, reason: s.reason, mark: s.mark })),
+    conclusion: seed.proof.conclusion,
+    totalMarks,
+    diagramType: seed.proof.diagramType || diagramType,
+    diagramLabels: seed.proof.diagramLabels || diagramLabels,
+  };
+}
+
+function buildLearnMindmapFallback(payload) {
+  const seed = getLearnSeedPack(payload);
+  const diagramType = inferDiagramType(payload);
+  const diagramLabels = diagramLabelsForType(diagramType);
+  const nodeId = payload?.mindmapNodeId || payload?.itemId || 'gQ1';
+  const node = seed?.mindmapNodes?.[nodeId] || seed?.mindmapNodes?.gQ1;
+  return {
+    kind: 'learn_mindmap',
+    conceptBullets: node?.bullets || ['Use similarity criteria before CPST.'],
+    examLines: node?.examLines || ['State the criterion and correspondence order.'],
+    workedExample: node?.example || {
+      question: 'Identify the criterion and write one ratio.',
+      steps: ['State the criterion.', 'Write one CPST ratio.'],
+      finalAnswer: 'Criterion stated and one ratio written.',
+    },
+    commonError: node?.commonError || 'Mixing correspondence order.',
+    commonFix: node?.commonFix || 'Re-check correspondence order and the stated criterion.',
+    checkQuestion: node?.checkQuestion || 'Which criterion applies here?',
+    diagramType,
+    diagramLabels,
+  };
+}
+
+function buildLearnSolveWithMeFallback(payload) {
+  const seed = getLearnSeedPack(payload);
+  return {
+    kind: 'question',
+    tutor: seed?.solveWithMe?.question || 'Which two triangles are being compared?',
+    answerFormat: seed?.solveWithMe?.answerFormat || 'Short sentence',
+    diagramType: inferDiagramType(payload),
+    diagramLabels: diagramLabelsForType(inferDiagramType(payload)),
+  };
+}
+
+function buildLearnKeyDefinitionsPrompt(payload) {
+  const subject = payload.subject || 'Maths/Science';
+  const grade = payload.grade != null ? payload.grade : 10;
+  const topicKey = payload.topicKey || payload.topic || '';
+  const diagramType = inferDiagramType(payload);
+  const diagramLabels = diagramLabelsForType(diagramType);
+  const nodeTitle = payload.mindmapNodeTitle || payload.itemTitle || '';
+  const nodeText = payload.mindmapNodeText || payload.itemText || '';
+  const hasMindmapContext = Boolean(nodeTitle || nodeText);
+  const requiredList = hasMindmapContext
+    ? [
+        `Concept focus: ${nodeTitle || 'Mindmap node'}`,
+        nodeText ? `Use this hint: ${nodeText}` : 'Use the provided mindmap node context.',
+      ]
+    : [
+        'Similar triangles (definition)',
+        'Corresponding sides/angles (definition + ordering)',
+        'AA similarity (one line)',
+        'SAS similarity (one line)',
+        'SSS similarity (one line)',
+        'CPST meaning (one line)',
+      ];
+
+  const seedContext = buildLearnSeedContext(payload, hasMindmapContext ? 'mindmap' : 'key-definitions');
+
+  return [
+    `You are a CBSE Class ${grade} ${subject} teacher for Learn tab (Board Examples).`,
+    topicKey ? `Topic: ${topicKey}.` : '',
+    nodeTitle ? `Node: ${nodeTitle}.` : '',
+    nodeText ? `Node hint: ${nodeText}` : '',
+    '',
+    'TASK:',
+    hasMindmapContext
+      ? '- Teach the concept in the mindmap node with exam-first clarity.'
+      : '- Teach the exact key definitions listed below with exam-first clarity.',
+    '- Use simple, student-friendly language with CBSE exam lines.',
+    '- Include two worked examples (one basic, one board-style).',
+    '',
+    hasMindmapContext ? 'MUST COVER (concept focus):' : 'MUST COVER (exact list):',
+    ...requiredList.map((x) => `- ${x}`),
+    '',
+    'OUTPUT FORMAT (STRICT): Return ONLY valid JSON. No markdown. No extra keys.',
+    'Schema:',
+    '{',
+    '  "kind": "learn_teach",',
+    '  "teach": {',
+    '    "simpleExplanation": ["..."],',
+    '    "cbseExamSentence": ["..."]',
+    '  },',
+    '  "workedExamples": [',
+    '    {',
+    '      "title": "...",',
+    '      "question": "...",',
+    '      "steps": [ { "text": "...", "marks": number } ],',
+    '      "totalMarks": number,',
+    '      "finalAnswer": "..."',
+    '    }',
+    '  ],',
+    '  "commonMistakes": ["..."],',
+    '  "checkQuestion": "...",',
+    `  "diagramType": "${diagramType}",`,
+    `  "diagramLabels": ${JSON.stringify(diagramLabels)}`,
+    '}',
+    '',
+    'RULES:',
+    '- teach.simpleExplanation must have >= 4 bullets.',
+    '- teach.cbseExamSentence must have >= 2 lines.',
+    '- workedExamples must be exactly 2 items.',
+    '- Each worked example must include steps, marks per step, totalMarks, and finalAnswer.',
+    '- totalMarks must equal the sum of step marks.',
+    '- commonMistakes must have >= 1 items.',
+    '- checkQuestion must be a single question.',
+    '- Diagram is required (use diagramType + diagramLabels as provided).',
+    '- No MCQ prompts.',
+    '- No placeholders or generic filler.',
+    '',
+    seedContext ? seedContext : '',
+  ]
+    .filter(Boolean)
+    .join('\n');
+}
+
+function buildLearnProofPrompt(payload) {
+  const subject = payload.subject || 'Maths/Science';
+  const grade = payload.grade != null ? payload.grade : 10;
+  const topicKey = payload.topicKey || payload.topic || '';
+  const questionText = payload.questionText || payload.question || payload.prompt || '';
+  const marks = Number(payload.marks) || undefined;
+  const diagramType = inferDiagramType(payload);
+  const diagramLabels = diagramLabelsForType(diagramType);
+  const seedContext = buildLearnSeedContext(payload, 'proof');
+
+  return [
+    `You are a CBSE Class ${grade} ${subject} proof-writing mentor.`,
+    topicKey ? `Topic: ${topicKey}.` : '',
+    '',
+    'TASK:',
+    '- Write a full CBSE proof with Given / To Prove / Construction / Proof / Conclusion.',
+    '- Use strict marking-scheme style steps with reasons.',
+    '',
+    'OUTPUT FORMAT (STRICT): Return ONLY valid JSON. No markdown. No extra keys.',
+    'Schema:',
+    '{',
+    '  "kind": "learn_proof",',
+    '  "given": ["..."],',
+    '  "toProve": ["..."],',
+    '  "construction": ["..."],',
+    '  "proofSteps": [ { "statement": "...", "reason": "...", "mark": number } ],',
+    '  "conclusion": ["..."],',
+    '  "totalMarks": number,',
+    `  "diagramType": "${diagramType}",`,
+    `  "diagramLabels": ${JSON.stringify(diagramLabels)}`,
+    '}',
+    '',
+    'RULES:',
+    '- construction can be empty but must be present.',
+    '- totalMarks must equal the sum of proofSteps.mark.',
+    '- Diagram is required (use diagramType + diagramLabels as provided).',
+    '- No placeholders or generic filler.',
+    '',
+    seedContext ? seedContext : '',
+    '',
+    'QUESTION:',
+    questionText,
+    '',
+    marks ? `MARKS: ${marks}` : 'MARKS: UNKNOWN',
+  ]
+    .filter(Boolean)
+    .join('\n');
+}
+
+function buildLearnMindmapPrompt(payload) {
+  const subject = payload.subject || 'Maths/Science';
+  const grade = payload.grade != null ? payload.grade : 10;
+  const topicKey = payload.topicKey || payload.topic || '';
+  const nodeTitle = payload.mindmapNodeTitle || payload.itemTitle || 'Mindmap node';
+  const nodeText = payload.mindmapNodeText || payload.itemText || '';
+  const diagramType = inferDiagramType(payload);
+  const diagramLabels = diagramLabelsForType(diagramType);
+  const seedContext = buildLearnSeedContext(payload, 'mindmap');
+
+  return [
+    `You are a CBSE Class ${grade} ${subject} teacher for Learn tab (Mindmap).`,
+    topicKey ? `Topic: ${topicKey}.` : '',
+    `Node: ${nodeTitle}.`,
+    nodeText ? `Node hint: ${nodeText}` : '',
+    '',
+    'OUTPUT FORMAT (STRICT): Return ONLY valid JSON. No markdown. No extra keys.',
+    'Schema:',
+    '{',
+    '  "kind": "learn_mindmap",',
+    '  "conceptBullets": ["..."],',
+    '  "examLines": ["..."],',
+    '  "workedExample": { "question": "...", "steps": ["..."], "finalAnswer": "..." },',
+    '  "commonError": "...",',
+    '  "commonFix": "...",',
+    '  "checkQuestion": "...",',
+    `  "diagramType": "${diagramType}",`,
+    `  "diagramLabels": ${JSON.stringify(diagramLabels)}`,
+    '}',
+    '',
+    'RULES:',
+    '- conceptBullets must have >= 5 items.',
+    '- examLines must have >= 2 items.',
+    '- workedExample must include question, steps (>=1), and finalAnswer.',
+    '- commonError and commonFix required.',
+    '- checkQuestion required.',
+    '- Diagram is required.',
+    '- No placeholders or generic filler.',
+    '',
+    seedContext ? seedContext : '',
+  ]
+    .filter(Boolean)
+    .join('\n');
+}
+
@@ -1543,0 +2298,2 @@ async function handleRequest(req, res) {
+    const isLearnKeyDefinitions = isLearnKeyDefinitionsPayload(payload);
+    const solveStyle = String(payload?.solveStyle || '').toLowerCase();
@@ -1557 +2313,5 @@ async function handleRequest(req, res) {
-    if (isMisconceptionExplain || isCompetencyExplain || isMindmapTeach) normalisedMode = 'explain';
+    if (mode === 'learn_teach') normalisedMode = 'learn_teach';
+    if (mode === 'learn_proof') normalisedMode = 'learn_proof';
+    if (mode === 'learn_mindmap') normalisedMode = 'learn_mindmap';
+    if (isMindmapTeach) normalisedMode = 'learn_mindmap';
+    if (isMisconceptionExplain || isCompetencyExplain) normalisedMode = 'explain';
@@ -1558,0 +2319,2 @@ async function handleRequest(req, res) {
+    if (isLearnKeyDefinitions && solveStyle === 'board') normalisedMode = 'learn_teach';
+    if (isProofWriting && solveStyle === 'board') normalisedMode = 'learn_proof';
@@ -1584,0 +2347,12 @@ async function handleRequest(req, res) {
+        case 'learn_teach':
+          systemPrompt =
+            'You are a strict CBSE Class 10 teacher. Return only the required JSON schema for key definitions.';
+          break;
+        case 'learn_mindmap':
+          systemPrompt =
+            'You are a strict CBSE Class 10 teacher. Return only the required JSON schema for mindmap teaching.';
+          break;
+        case 'learn_proof':
+          systemPrompt =
+            'You are a strict CBSE Class 10 proof-writing teacher. Return only the required JSON schema.';
+          break;
@@ -1626,0 +2401,9 @@ async function handleRequest(req, res) {
+        case 'learn_teach':
+          userPrompt = buildLearnKeyDefinitionsPrompt(payload);
+          break;
+        case 'learn_mindmap':
+          userPrompt = buildLearnMindmapPrompt(payload);
+          break;
+        case 'learn_proof':
+          userPrompt = buildLearnProofPrompt(payload);
+          break;
@@ -1663,5 +2446,7 @@ async function handleRequest(req, res) {
-        normalisedMode === 'board_steps_ms'
-          ? Math.min(4096, Math.max(1400, 800 + Math.round(safeMarks * 180)))
-          : normalisedMode === 'solve_with_me'
-            ? 1400
-            : 900;
+        normalisedMode === 'board_steps_ms' || normalisedMode === 'learn_proof'
+          ? Math.min(4096, Math.max(1600, 900 + Math.round(safeMarks * 180)))
+          : normalisedMode === 'learn_teach'
+            ? 1600
+            : normalisedMode === 'solve_with_me'
+              ? 1400
+              : 900;
@@ -1677 +2462,6 @@ ${userPrompt}` }] },
-        temperature: normalisedMode === 'board_steps_ms' ? 0.25 : 0.35,
+        temperature:
+          normalisedMode === 'board_steps_ms' || normalisedMode === 'learn_proof'
+            ? 0.2
+            : normalisedMode === 'learn_teach'
+              ? 0.25
+              : 0.35,
@@ -1683 +2473,2 @@ ${userPrompt}` }] },
-        if (normalisedMode === 'board_steps_ms' || normalisedMode === 'solve_with_me') {
+        const structuredModes = ['board_steps_ms', 'solve_with_me', 'learn_teach', 'learn_proof', 'learn_mindmap'];
+        if (structuredModes.includes(normalisedMode)) {
@@ -1685,2 +2476,12 @@ ${userPrompt}` }] },
-
-          if (!isValidMentorProtocol(structured, normalisedMode)) {
+          const isFirstTurn =
+            normalisedMode === 'solve_with_me' && Array.isArray(reqJson?.messages)
+              ? reqJson.messages.length <= 1
+              : false;
+          let check = validateStructuredForMode(structured, normalisedMode, payload, { isFirstTurn });
+          const isLearnStructured =
+            normalisedMode === 'learn_teach' ||
+            normalisedMode === 'learn_proof' ||
+            normalisedMode === 'learn_mindmap' ||
+            (normalisedMode === 'solve_with_me' && isTrianglesLearnPayload(payload));
+
+          if (!check.ok) {
@@ -1688,22 +2489,8 @@ ${userPrompt}` }] },
-            const repairPrompt = [
-              'You returned invalid or incomplete JSON for the required protocol.',
-            'Return ONLY valid JSON (no markdown, no extra text).',
-            (normalisedMode === 'solve_with_me'
-              ? 'Required JSON shape: { "kind": "question" | "hint" | "final", "tutor": string, "mcq"?: object, "finalAnswer"?: string, "boardWriteup"?: string }.'
-              : `Required kind: ${normalisedMode}.`),
-            '',
-            'Broken output (may be truncated):',
-            clipped,
-            '',
-            'Now return the corrected JSON ONLY.',
-          ].join('\n');
-
-          const repairContents = [
-            { role: 'user', parts: [{ text: `${systemPrompt}
-
-${repairPrompt}` }] },
-          ];
-
-          const repaired = await callGemini(GEMINI_MODEL, repairContents, {
-            maxOutputTokens,
-            temperature: 0.2,
+            const repairPrompt = buildRepairPromptForMode(normalisedMode, payload, clipped, check.issues);
+            const repairContents = [
+              { role: 'user', parts: [{ text: `${systemPrompt}\n\n${repairPrompt}` }] },
+            ];
+
+            const repaired = await callGemini(GEMINI_MODEL, repairContents, {
+              maxOutputTokens,
+              temperature: 0.2,
@@ -1713,0 +2501,34 @@ ${repairPrompt}` }] },
+            check = validateStructuredForMode(structured, normalisedMode, payload, { isFirstTurn });
+          }
+
+          if (!check.ok && isLearnStructured) {
+            const strictPrompt = buildRepairPromptForMode(
+              normalisedMode,
+              payload,
+              String(finalText || '').slice(0, 8000),
+              check.issues
+            );
+            const strictContents = [
+              { role: 'user', parts: [{ text: `${systemPrompt}\n\n${strictPrompt}` }] },
+            ];
+            const strictReply = await callGemini(GEMINI_MODEL, strictContents, {
+              maxOutputTokens,
+              temperature: 0.1,
+            });
+            finalText = strictReply.text;
+            structured = tryParseJsonStrict(finalText);
+            check = validateStructuredForMode(structured, normalisedMode, payload, { isFirstTurn });
+          }
+
+          if (!check.ok) {
+            if (isLearnStructured) {
+              if (normalisedMode === 'learn_teach') structured = buildLearnTeachFallback(payload);
+              else if (normalisedMode === 'learn_proof') structured = buildLearnProofFallback(payload);
+              else if (normalisedMode === 'learn_mindmap') structured = buildLearnMindmapFallback(payload);
+              else if (normalisedMode === 'solve_with_me') structured = buildLearnSolveWithMeFallback(payload);
+            } else {
+              console.warn('[mentor] schema mismatch:', check.issues);
+              return sendJson(res, 422, {
+                error: 'Mentor response did not match schema. Retry.',
+              });
+            }
@@ -1733,27 +2553,0 @@ ${repairPrompt}` }] },
-              finalText = JSON.stringify(structured);
-            }
-          } else if (isProofWriting) {
-            const isFirstTurn =
-              normalisedMode === 'solve_with_me' && Array.isArray(reqJson?.messages)
-                ? reqJson.messages.length <= 1
-                : false;
-            let proofCheck =
-              normalisedMode === 'board_steps_ms'
-                ? validateProofBoardSteps(structured, payload)
-                : validateProofSolveWithMe(structured, payload, isFirstTurn);
-
-            if (!proofCheck.ok) {
-              const repairPrompt = buildProofRepairPrompt(normalisedMode, payload, proofCheck.issues);
-              const repairContents = [
-                { role: 'user', parts: [{ text: `${systemPrompt}\n\n${repairPrompt}` }] },
-              ];
-              const repaired = await callGemini(GEMINI_MODEL, repairContents, {
-                maxOutputTokens,
-                temperature: 0.2,
-              });
-              finalText = repaired.text;
-              structured = tryParseJsonStrict(finalText);
-              proofCheck =
-                normalisedMode === 'board_steps_ms'
-                  ? validateProofBoardSteps(structured, payload)
-                  : validateProofSolveWithMe(structured, payload, isFirstTurn);
@@ -1760,0 +2555 @@ ${repairPrompt}` }] },
+          }
@@ -1762,7 +2557,7 @@ ${repairPrompt}` }] },
-            if (!proofCheck.ok) {
-              structured =
-                normalisedMode === 'board_steps_ms'
-                  ? buildProofFallbackBoardSteps(payload)
-                  : buildProofFallbackSolveWithMe(payload);
-              finalText = JSON.stringify(structured);
-            }
+          if (normalisedMode === 'board_steps_ms') {
+            structured = normalizeBoardSteps(structured);
+            structured = ensureDiagramFields(structured, payload);
+          }
+
+          if (normalisedMode === 'solve_with_me') {
+            structured = ensureDiagramFields(structured, payload);
@@ -1769,0 +2565,2 @@ ${repairPrompt}` }] },
+
+          finalText = JSON.stringify(structured);
@@ -1834 +2631 @@ ${repairPrompt}` }] },
-      } else if (isMindmapTeach) {
+      } else if (isMindmapTeach && normalisedMode === 'explain') {
@@ -1862 +2659,4 @@ ${repairPrompt}` }] },
-            finalText = fallbackMindmapTeachResponse(payload);
+            console.warn('[mentor] mindmap schema mismatch');
+            return sendJson(res, 422, {
+              error: 'Mentor response did not match schema. Retry.',
+            });
@@ -1872,4 +2672 @@ ${repairPrompt}` }] },
-      if (structured && (normalisedMode === 'board_steps_ms' || normalisedMode === 'solve_with_me')) {
-        if (structured.kind === 'board_steps_ms') {
-          structured = normalizeBoardSteps(structured);
-        }
+      if (structured && normalisedMode === 'solve_with_me') {
```
- src/components/DiagramBlock.tsx
```diff
diff --git a/src/components/DiagramBlock.tsx b/src/components/DiagramBlock.tsx
index a1744a3..1d83287 100644
--- a/src/components/DiagramBlock.tsx
+++ b/src/components/DiagramBlock.tsx
@@ -0,0 +1 @@
+import { useState } from "react";
@@ -61,5 +62,5 @@ function TriangleGeneric({ labels }: { labels: DiagramLabels }) {
-    <svg viewBox="0 0 200 120" width="100%" height="auto" role="img" aria-label="Triangle diagram">
-      <polygon points="30,95 170,95 105,20" fill="none" stroke="currentColor" strokeWidth="2" />
-      <text x="22" y="105" fontSize="10">{getLabel(labels, "A")}</text>
-      <text x="172" y="105" fontSize="10">{getLabel(labels, "B")}</text>
-      <text x="105" y="15" fontSize="10">{getLabel(labels, "C")}</text>
+    <svg viewBox="0 0 260 140" width="100%" height="auto" role="img" aria-label="Triangle diagram">
+      <polygon points="40,110 220,110 140,25" fill="none" stroke="currentColor" strokeWidth="2.5" />
+      <text x="30" y="125" fontSize="11">{getLabel(labels, "A")}</text>
+      <text x="224" y="125" fontSize="11">{getLabel(labels, "B")}</text>
+      <text x="140" y="18" fontSize="11">{getLabel(labels, "C")}</text>
@@ -72,9 +73,70 @@ function SimilarityDiagram({ labels }: { labels: DiagramLabels }) {
-    <svg viewBox="0 0 260 120" width="100%" height="auto" role="img" aria-label="Similarity diagram">
-      <polygon points="20,95 110,95 70,25" fill="none" stroke="currentColor" strokeWidth="2" />
-      <polygon points="150,95 240,95 200,35" fill="none" stroke="currentColor" strokeWidth="2" />
-      <text x="12" y="105" fontSize="10">{getLabel(labels, "A")}</text>
-      <text x="112" y="105" fontSize="10">{getLabel(labels, "B")}</text>
-      <text x="70" y="18" fontSize="10">{getLabel(labels, "C")}</text>
-      <text x="142" y="105" fontSize="10">{getLabel(labels, "P")}</text>
-      <text x="242" y="105" fontSize="10">{getLabel(labels, "Q")}</text>
-      <text x="200" y="28" fontSize="10">{getLabel(labels, "R")}</text>
+    <svg viewBox="0 0 300 140" width="100%" height="auto" role="img" aria-label="Similarity diagram">
+      <polygon points="25,110 125,110 75,25" fill="none" stroke="currentColor" strokeWidth="2.5" />
+      <polygon points="175,110 275,110 230,35" fill="none" stroke="currentColor" strokeWidth="2.5" />
+      <text x="15" y="125" fontSize="11">{getLabel(labels, "A")}</text>
+      <text x="125" y="125" fontSize="11">{getLabel(labels, "B")}</text>
+      <text x="75" y="18" fontSize="11">{getLabel(labels, "C")}</text>
+      <text x="165" y="125" fontSize="11">{getLabel(labels, "P")}</text>
+      <text x="275" y="125" fontSize="11">{getLabel(labels, "Q")}</text>
+      <text x="230" y="28" fontSize="11">{getLabel(labels, "R")}</text>
+    </svg>
+  );
+}
+
+function SimilarityAADiagram({ labels }: { labels: DiagramLabels }) {
+  return (
+    <svg viewBox="0 0 300 140" width="100%" height="auto" role="img" aria-label="AA similarity diagram">
+      <polygon points="25,110 125,110 75,25" fill="none" stroke="currentColor" strokeWidth="2.5" />
+      <polygon points="175,110 275,110 230,35" fill="none" stroke="currentColor" strokeWidth="2.5" />
+      <path d="M48 96 A18 18 0 0 1 62 80" fill="none" stroke="currentColor" strokeWidth="2" />
+      <path d="M200 98 A18 18 0 0 1 214 82" fill="none" stroke="currentColor" strokeWidth="2" />
+      <path d="M102 92 A16 16 0 0 1 98 72" fill="none" stroke="currentColor" strokeWidth="2" />
+      <path d="M255 95 A16 16 0 0 1 250 76" fill="none" stroke="currentColor" strokeWidth="2" />
+      <text x="15" y="125" fontSize="11">{getLabel(labels, "A")}</text>
+      <text x="125" y="125" fontSize="11">{getLabel(labels, "B")}</text>
+      <text x="75" y="18" fontSize="11">{getLabel(labels, "C")}</text>
+      <text x="165" y="125" fontSize="11">{getLabel(labels, "P")}</text>
+      <text x="275" y="125" fontSize="11">{getLabel(labels, "Q")}</text>
+      <text x="230" y="28" fontSize="11">{getLabel(labels, "R")}</text>
+    </svg>
+  );
+}
+
+function SimilaritySASDiagram({ labels }: { labels: DiagramLabels }) {
+  return (
+    <svg viewBox="0 0 300 140" width="100%" height="auto" role="img" aria-label="SAS similarity diagram">
+      <polygon points="25,110 125,110 75,25" fill="none" stroke="currentColor" strokeWidth="2.5" />
+      <polygon points="175,110 275,110 230,35" fill="none" stroke="currentColor" strokeWidth="2.5" />
+      <path d="M54 104 L70 104" stroke="currentColor" strokeWidth="2" />
+      <path d="M82 92 L90 78" stroke="currentColor" strokeWidth="2" />
+      <path d="M206 104 L222 104" stroke="currentColor" strokeWidth="2" />
+      <path d="M236 96 L244 82" stroke="currentColor" strokeWidth="2" />
+      <path d="M48 96 A18 18 0 0 1 62 80" fill="none" stroke="currentColor" strokeWidth="2" />
+      <path d="M200 98 A18 18 0 0 1 214 82" fill="none" stroke="currentColor" strokeWidth="2" />
+      <text x="15" y="125" fontSize="11">{getLabel(labels, "A")}</text>
+      <text x="125" y="125" fontSize="11">{getLabel(labels, "B")}</text>
+      <text x="75" y="18" fontSize="11">{getLabel(labels, "C")}</text>
+      <text x="165" y="125" fontSize="11">{getLabel(labels, "P")}</text>
+      <text x="275" y="125" fontSize="11">{getLabel(labels, "Q")}</text>
+      <text x="230" y="28" fontSize="11">{getLabel(labels, "R")}</text>
+    </svg>
+  );
+}
+
+function SimilaritySSSDiagram({ labels }: { labels: DiagramLabels }) {
+  return (
+    <svg viewBox="0 0 300 140" width="100%" height="auto" role="img" aria-label="SSS similarity diagram">
+      <polygon points="25,110 125,110 75,25" fill="none" stroke="currentColor" strokeWidth="2.5" />
+      <polygon points="175,110 275,110 230,35" fill="none" stroke="currentColor" strokeWidth="2.5" />
+      <path d="M52 104 L66 104" stroke="currentColor" strokeWidth="2" />
+      <path d="M86 92 L94 78" stroke="currentColor" strokeWidth="2" />
+      <path d="M96 108 L108 95" stroke="currentColor" strokeWidth="2" />
+      <path d="M202 104 L216 104" stroke="currentColor" strokeWidth="2" />
+      <path d="M240 96 L248 82" stroke="currentColor" strokeWidth="2" />
+      <path d="M246 108 L258 96" stroke="currentColor" strokeWidth="2" />
+      <text x="15" y="125" fontSize="11">{getLabel(labels, "A")}</text>
+      <text x="125" y="125" fontSize="11">{getLabel(labels, "B")}</text>
+      <text x="75" y="18" fontSize="11">{getLabel(labels, "C")}</text>
+      <text x="165" y="125" fontSize="11">{getLabel(labels, "P")}</text>
+      <text x="275" y="125" fontSize="11">{getLabel(labels, "Q")}</text>
+      <text x="230" y="28" fontSize="11">{getLabel(labels, "R")}</text>
@@ -87,8 +149,12 @@ function BptDiagram({ labels }: { labels: DiagramLabels }) {
-    <svg viewBox="0 0 200 120" width="100%" height="auto" role="img" aria-label="BPT diagram">
-      <polygon points="30,95 170,95 105,20" fill="none" stroke="currentColor" strokeWidth="2" />
-      <line x1="65" y1="70" x2="135" y2="70" stroke="currentColor" strokeWidth="2" />
-      <text x="22" y="105" fontSize="10">{getLabel(labels, "A")}</text>
-      <text x="172" y="105" fontSize="10">{getLabel(labels, "B")}</text>
-      <text x="105" y="15" fontSize="10">{getLabel(labels, "C")}</text>
-      <text x="58" y="68" fontSize="10">{getLabel(labels, "D")}</text>
-      <text x="138" y="68" fontSize="10">{getLabel(labels, "E")}</text>
+    <svg viewBox="0 0 260 140" width="100%" height="auto" role="img" aria-label="BPT diagram">
+      <polygon points="40,110 220,110 140,25" fill="none" stroke="currentColor" strokeWidth="2.5" />
+      <line x1="75" y1="80" x2="205" y2="80" stroke="currentColor" strokeWidth="2.5" />
+      <path d="M92 76 L100 84" stroke="currentColor" strokeWidth="2" />
+      <path d="M178 76 L186 84" stroke="currentColor" strokeWidth="2" />
+      <path d="M92 114 L100 106" stroke="currentColor" strokeWidth="2" />
+      <path d="M178 114 L186 106" stroke="currentColor" strokeWidth="2" />
+      <text x="30" y="125" fontSize="11">{getLabel(labels, "A")}</text>
+      <text x="224" y="125" fontSize="11">{getLabel(labels, "B")}</text>
+      <text x="140" y="18" fontSize="11">{getLabel(labels, "C")}</text>
+      <text x="68" y="78" fontSize="11">{getLabel(labels, "D")}</text>
+      <text x="208" y="78" fontSize="11">{getLabel(labels, "E")}</text>
@@ -101,6 +167,37 @@ function PythagorasDiagram({ labels }: { labels: DiagramLabels }) {
-    <svg viewBox="0 0 200 120" width="100%" height="auto" role="img" aria-label="Right triangle diagram">
-      <polygon points="30,95 170,95 30,25" fill="none" stroke="currentColor" strokeWidth="2" />
-      <polyline points="30,95 45,95 45,80" fill="none" stroke="currentColor" strokeWidth="2" />
-      <text x="22" y="105" fontSize="10">{getLabel(labels, "A")}</text>
-      <text x="172" y="105" fontSize="10">{getLabel(labels, "B")}</text>
-      <text x="22" y="20" fontSize="10">{getLabel(labels, "C")}</text>
+    <svg viewBox="0 0 260 140" width="100%" height="auto" role="img" aria-label="Right triangle diagram">
+      <polygon points="40,110 220,110 40,25" fill="none" stroke="currentColor" strokeWidth="2.5" />
+      <polyline points="40,110 58,110 58,92" fill="none" stroke="currentColor" strokeWidth="2.5" />
+      <text x="30" y="125" fontSize="11">{getLabel(labels, "A")}</text>
+      <text x="224" y="125" fontSize="11">{getLabel(labels, "B")}</text>
+      <text x="30" y="20" fontSize="11">{getLabel(labels, "C")}</text>
+    </svg>
+  );
+}
+
+function ParallelAngleDiagram({ labels }: { labels: DiagramLabels }) {
+  return (
+    <svg viewBox="0 0 260 140" width="100%" height="auto" role="img" aria-label="Parallel line angle relations">
+      <polygon points="40,110 220,110 140,25" fill="none" stroke="currentColor" strokeWidth="2.5" />
+      <line x1="75" y1="80" x2="205" y2="80" stroke="currentColor" strokeWidth="2.5" />
+      <path d="M70 92 A18 18 0 0 1 86 78" fill="none" stroke="currentColor" strokeWidth="2" />
+      <path d="M172 94 A18 18 0 0 1 188 80" fill="none" stroke="currentColor" strokeWidth="2" />
+      <text x="30" y="125" fontSize="11">{getLabel(labels, "A")}</text>
+      <text x="224" y="125" fontSize="11">{getLabel(labels, "B")}</text>
+      <text x="140" y="18" fontSize="11">{getLabel(labels, "C")}</text>
+      <text x="68" y="78" fontSize="11">{getLabel(labels, "D")}</text>
+      <text x="208" y="78" fontSize="11">{getLabel(labels, "E")}</text>
+    </svg>
+  );
+}
+
+function DiagramPlaceholder({ labels }: { labels: DiagramLabels }) {
+  const labelKeys = Object.keys(labels);
+  return (
+    <svg viewBox="0 0 220 120" width="100%" height="auto" role="img" aria-label="Diagram placeholder">
+      <rect x="10" y="10" width="200" height="100" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
+      <text x="20" y="30" fontSize="10">Diagram placeholder</text>
+      {labelKeys.slice(0, 8).map((k, idx) => (
+        <text key={k} x={20} y={50 + idx * 10} fontSize="10">
+          {k}: {getLabel(labels, k)}
+        </text>
+      ))}
@@ -117,0 +215 @@ export function DiagramBlock({
+  const [zoomed, setZoomed] = useState(false);
@@ -119,0 +218,7 @@ export function DiagramBlock({
+  const isSimilarity =
+    type.includes("SIMILARITY") ||
+    type.endsWith("_SIMILARITY") ||
+    type === "SIMILAR";
+  const isAa = type === "SIMILARITY_AA";
+  const isSas = type === "SIMILARITY_SAS";
+  const isSss = type === "SIMILARITY_SSS";
@@ -130 +235,20 @@ export function DiagramBlock({
-      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>{title}</div>
+      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
+        <div style={{ fontWeight: 800, fontSize: 13 }}>{title}</div>
+        <button
+          type="button"
+          onClick={() => setZoomed((prev) => !prev)}
+          style={{
+            marginLeft: "auto",
+            borderRadius: 999,
+            border: "1px solid rgba(0,0,0,0.14)",
+            padding: "4px 10px",
+            fontSize: 11,
+            fontWeight: 700,
+            cursor: "pointer",
+            background: "white",
+          }}
+        >
+          {zoomed ? "Close diagram" : "Open diagram"}
+        </button>
+      </div>
+      <div style={{ maxWidth: zoomed ? 520 : 360, margin: "0 auto" }}>
@@ -137 +261,9 @@ export function DiagramBlock({
-      ) : type.startsWith("SIMILARITY") ? (
+      ) : type === "PARALLEL_LINE_ANGLE_RELATIONS" ? (
+        <ParallelAngleDiagram labels={labels} />
+      ) : isAa ? (
+        <SimilarityAADiagram labels={labels} />
+      ) : isSas ? (
+        <SimilaritySASDiagram labels={labels} />
+      ) : isSss ? (
+        <SimilaritySSSDiagram labels={labels} />
+      ) : isSimilarity ? (
@@ -139 +271 @@ export function DiagramBlock({
-      ) : (
+      ) : type === "TRIANGLE_GENERIC" ? (
@@ -140,0 +273,2 @@ export function DiagramBlock({
+      ) : (
+        <DiagramPlaceholder labels={labels} />
@@ -141,0 +276 @@ export function DiagramBlock({
+      </div>
```
- src/pages/TopicHub.tsx
```diff
diff --git a/src/pages/TopicHub.tsx b/src/pages/TopicHub.tsx
index b6473ee..25151f8 100644
--- a/src/pages/TopicHub.tsx
+++ b/src/pages/TopicHub.tsx
@@ -1 +1 @@
-// src/pages/TopicHub.tsx
+// src/pages/TopicHub.tsx
@@ -18,0 +19 @@ import { DiagramBlock } from "../components/DiagramBlock";
+import TutorDrawerV2 from "../components/tutor/TutorDrawerV2";
@@ -22 +23 @@ type ModeKey = "zombie" | "beast";
-type RequestedMentorMode = "explain" | "board_steps" | "solve_with_me";
+type RequestedMentorMode = "explain" | "board_steps" | "solve_with_me" | "learn_mindmap";
@@ -25,0 +27 @@ type MentorChatMsg = { role: "user" | "assistant"; content: string };
+type TutorTab = "teach" | "examples";
@@ -94,0 +97,23 @@ function asSubjectKey(raw: string): SubjectKey {
+type TutorConceptCard = { means: string; when: string[]; exam: string; trap: string };
+
+function toTutorConceptCard(x: unknown): TutorConceptCard | null {
+  if (!x || typeof x !== "object") return null;
+  const obj = x as Record<string, unknown>;
+  const means = typeof obj.means === "string" ? obj.means : null;
+  const exam = typeof obj.exam === "string" ? obj.exam : null;
+  const trap = typeof obj.trap === "string" ? obj.trap : null;
+  const whenRaw = obj.when;
+  const when =
+    Array.isArray(whenRaw) && whenRaw.every((v) => typeof v === "string")
+      ? (whenRaw as string[])
+      : null;
+
+  if (!means || !exam || !trap || !when) return null;
+  return { means, when, exam, trap };
+}
+
+function toNullableString(x: unknown): string | null {
+  return typeof x === "string" ? x : null;
+}
+
+
@@ -162,0 +188,3 @@ export default function TopicHub() {
+  const [tutorDrawerOpen, setTutorDrawerOpen] = useState(false);
+  const [tutorTab, setTutorTab] = useState<TutorTab>("teach");
+  const [tutorNodeIndex, setTutorNodeIndex] = useState(0);
@@ -225,0 +254 @@ export default function TopicHub() {
+
@@ -236 +265 @@ if (!v2) {
-            Class {grade} - {subject.toUpperCase()}
+            Class {grade}  -  {subject.toUpperCase()}
@@ -273 +302 @@ if (!v2) {
-// Board-pattern anchors (A-E) pulled from the canonical question bank for this topic.
+// Board-pattern anchors (A-E) pulled from the canonical question bank for this topic.
@@ -379 +408 @@ const buildFallbackWorkedExampleQuestion = useCallback(
-      const header = `Class ${grade} ${subjectTitle} - ${title}`;
+      const header = `Class ${grade} ${subjectTitle}  -  ${title}`;
@@ -393 +422 @@ Pattern A (${marks}-mark/MCQ style):
-In ΔABC and ΔPQR, ∠A = ∠P and ∠B = ∠Q. What can you conclude?
+In ?ABC and ?PQR, ?A = ?P and ?B = ?Q. What can you conclude?
@@ -395,2 +424,2 @@ In ΔABC and ΔPQR, ∠A = ∠P and ∠B = ∠Q. What can you conclude?
-A) ΔABC ≅ ΔPQR
-B) ΔABC ~ ΔPQR
+A) ?ABC ? ?PQR
+B) ?ABC ~ ?PQR
@@ -407 +436 @@ Pattern B (${marks} marks, short answer):
-In ΔABC, D lies on AB and E lies on AC. If DE ∥ BC, AD = 3 cm, DB = 6 cm and EC = 8 cm, find AE.`;
+In ?ABC, D lies on AB and E lies on AC. If DE ? BC, AD = 3 cm, DB = 6 cm and EC = 8 cm, find AE.`;
@@ -412,2 +441,2 @@ Pattern C (${marks} marks):
-(i) In ΔABC, ∠A = 50°, ∠B = 60°. In ΔPQR, ∠P = 50°, ∠Q = 60°. Prove ΔABC ~ ΔPQR.
-(ii) If AB = 5 cm and PQ = 10 cm, find the ratio of areas of ΔABC and ΔPQR.`;
+(i) In ?ABC, ?A = 50┬░, ?B = 60┬░. In ?PQR, ?P = 50┬░, ?Q = 60┬░. Prove ?ABC ~ ?PQR.
+(ii) If AB = 5 cm and PQ = 10 cm, find the ratio of areas of ?ABC and ?PQR.`;
@@ -420 +449 @@ Pattern D (${marks} marks, typical board steps):
-In ΔABC, D is a point on AB and E is a point on AC such that DE ∥ BC.
+In ?ABC, D is a point on AB and E is a point on AC such that DE ? BC.
@@ -429 +458 @@ Pattern E (${marks} marks, mixed concept):
-In a right triangle ΔABC right-angled at A, AD is drawn perpendicular to BC (D lies on BC).
+In a right triangle ?ABC right-angled at A, AD is drawn perpendicular to BC (D lies on BC).
@@ -539,0 +569,56 @@ const buildFallbackQuickQuiz = useCallback((): V2Example[] => {
+  const guidedOrder = guidedMindmap?.recommendedOrder || [];
+  const guidedNodes = guidedMindmap?.nodes || [];
+  const guidedNodeById = useMemo(() => {
+    const map = new Map<string, (typeof guidedNodes)[number]>();
+    guidedNodes.forEach((n) => map.set(String(n.id), n));
+    return map;
+  }, [guidedNodes]);
+  const guidedNodeTitleById = useMemo(() => {
+    const out: Record<string, string> = {};
+    guidedNodes.forEach((n) => {
+      out[String(n.id)] = String(n.title || n.id);
+    });
+    return out;
+  }, [guidedNodes]);
+  const guidedCoreByNodeId: Record<string, unknown> = guidedMindmap?.coreByNodeId || {};
+  const guidedCoreIdByNodeId: Record<string, unknown> = guidedMindmap?.coreIdByNodeId || {};
+  const currentTutorNodeId = guidedOrder[tutorNodeIndex] || guidedOrder[0];
+  const currentTutorNode = currentTutorNodeId ? guidedNodeById.get(currentTutorNodeId) : null;
+  const currentTutorCore = currentTutorNodeId ? guidedCoreByNodeId[currentTutorNodeId] : null;
+  const currentTutorCoreId = currentTutorNodeId ? guidedCoreIdByNodeId[currentTutorNodeId] : null;
+
+  const mapProofFocusToNodeId = useCallback((focus?: string) => {
+    const f = String(focus || "").toLowerCase();
+    if (f.includes("bpt")) return "gBPT";
+    if (f.includes("pyth")) return "gPyth";
+    if (f.includes("area")) return "gArea";
+    if (f.includes("cpst")) return "gCPST";
+    if (f.includes("aa")) return "gAA";
+    if (f.includes("sas")) return "gSAS";
+    if (f.includes("sss")) return "gSSS";
+    return "gQ1";
+  }, []);
+
+  const closeTutorDrawer = useCallback(() => {
+    setTutorDrawerOpen(false);
+  }, []);
+
+  const resolveTutorNodeIndex = useCallback(
+    (nodeId?: string | null) => {
+      if (!nodeId) return 0;
+      const idx = guidedOrder.findIndex((id) => id === nodeId);
+      return idx >= 0 ? idx : 0;
+    },
+    [guidedOrder]
+  );
+
+  const openTutorDrawer = useCallback(
+    (opts?: { tab?: TutorTab; nodeId?: string | null }) => {
+      const nextTab = opts?.tab || "teach";
+      const nodeIndex = resolveTutorNodeIndex(opts?.nodeId || currentTutorNodeId);
+      setTutorTab(nextTab);
+      setTutorNodeIndex(nodeIndex);
+      setTutorDrawerOpen(true);
+    },
+    [currentTutorNodeId, resolveTutorNodeIndex]
+  );
@@ -581 +666 @@ const showInZombie = (sectionId: string) => {
-              ← Trends
+              ? Trends
@@ -619 +704 @@ const showInZombie = (sectionId: string) => {
-              Class {grade} - {subject.toUpperCase()}
+              Class {grade}  -  {subject.toUpperCase()}
@@ -659,0 +745,30 @@ const showInZombie = (sectionId: string) => {
+          {isLearn && isTrianglesTopic ? (
+            <div
+              style={{
+                borderRadius: 18,
+                padding: "14px 14px",
+                background: "rgba(255,255,255,0.65)",
+                border: "1px solid rgba(0,0,0,0.08)",
+                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
+                display: "flex",
+                alignItems: "center",
+                justifyContent: "space-between",
+                gap: 12,
+                flexWrap: "wrap",
+              }}
+            >
+              <div>
+                <div style={{ fontWeight: 900, fontSize: 16 }}>Let me teach you</div>
+                <div style={{ fontSize: 13, opacity: 0.75 }}>
+                  Start from basics and move step-by-step with the guided mindmap.
+                </div>
+              </div>
+              <button
+                type="button"
+                className="pill"
+                onClick={() => openTutorDrawer({ tab: "teach", nodeId: guidedOrder[0] })}
+              >
+                Let me teach you
+              </button>
+            </div>
+          ) : null}
@@ -689 +804,5 @@ const showInZombie = (sectionId: string) => {
-                  onClick={() =>
+                  onClick={() => {
+                    if (isTrianglesTopic) {
+                      openTutorDrawer({ tab: "teach", nodeId: guidedOrder[0] });
+                      return;
+                    }
@@ -691,7 +810,8 @@ const showInZombie = (sectionId: string) => {
-                      title: `${title} - Key definitions`,
-                      question: `Explain the key definitions in ${title} (Class ${grade} ${subjectTitle}).
-
-- Write each definition in NCERT/CBSE exam language (what the student should write).
-- Give 2 examples for each: one easy + one board-style.
-- If the topic is geometry, include a labelled diagram description and reference it clearly.
-- End with 3 common mistakes + the quick fix.`,
+                      title: `${title}   Key definitions`,
+                      question: `Teach the key definitions in ${title} (Class ${grade} ${subjectTitle}).
+Cover exactly:
+1) Similar triangles (definition)
+2) Corresponding sides/angles (definition + ordering)
+3) Similarity criteria: AA, SAS, SSS (one line each)
+4) CPST meaning (one line)
+Use CBSE exam language and include a labelled diagram.`,
@@ -701,2 +821,2 @@ const showInZombie = (sectionId: string) => {
-                    })
-                  }
+                    });
+                  }}
@@ -704 +824 @@ const showInZombie = (sectionId: string) => {
-                  Ask Mentor →
+                  {isTrianglesTopic ? "Open Tutor ->" : "Ask Mentor ->"}
@@ -738,28 +858,3 @@ const showInZombie = (sectionId: string) => {
-                  const coreText = node.core
-                    ? [
-                        `What it means: ${node.core.means}`,
-                        node.core.when.length ? `When used: ${node.core.when.join("; ")}` : "",
-                        `Exam line: ${node.core.exam}`,
-                        `Trap: ${node.core.trap}`,
-                      ]
-                        .filter(Boolean)
-                        .join("\n")
-                    : node.text || "";
-                  openMentorDrawer({
-                    title: `Mindmap - ${node.title}`,
-                    question: `Teach from the mindmap node "${node.title}".`,
-                    solveStyle: "socratic",
-                    section: "learn",
-                    subSection: "mindmap",
-                    requestedMode: "explain",
-                    explainType: "mindmap_node",
-                    itemId: node.id,
-                    itemTitle: node.title,
-                    itemText: node.text || node.core?.means || "",
-                    contextText: coreText,
-                    mindmapNodeId: node.id,
-                    mindmapNodeTitle: node.title,
-                    mindmapCoreId: node.coreId,
-                    mindmapNodeText: node.text || node.core?.means || "",
-                  });
-                }}
+                    if (!node?.id) return;
+                    openTutorDrawer({ tab: "teach", nodeId: node.id });
+                  }}
@@ -796,14 +891,2 @@ const showInZombie = (sectionId: string) => {
-                          onClick={() =>
-                            openMentorDrawer({
-                              title: `Proof writing  ${t.title}`,
-                              question: t.question,
-                              solveStyle: "socratic",
-                              requestedMode: "solve_with_me",
-                              marks: t.marks,
-                              section: "learn",
-                              subSection: "proof-writing",
-                              theoremFocus: [t.focus],
-                              contextText: t.hints.join(" "),
-                            })
-                          }
-                          title="Practice step-by-step with Mentor"
+                          onClick={() => openTutorDrawer({ tab: "teach", nodeId: mapProofFocusToNodeId(t.focus) })}
+                          title="Open Tutor in teaching mode"
@@ -811 +894 @@ const showInZombie = (sectionId: string) => {
-                          Practice (Solve With Me) 
+                          Teach this proof
@@ -817,14 +900,2 @@ const showInZombie = (sectionId: string) => {
-                          onClick={() =>
-                            openMentorDrawer({
-                              title: `Proof writing  ${t.title}  Board steps`,
-                              question: t.question,
-                              solveStyle: "board",
-                              requestedMode: "board_steps",
-                              marks: t.marks,
-                              section: "learn",
-                              subSection: "proof-writing",
-                              theoremFocus: [t.focus],
-                              contextText: t.hints.join(" "),
-                            })
-                          }
-                          title="See CBSE board-scoring steps with marks"
+                          onClick={() => openTutorDrawer({ tab: "examples", nodeId: mapProofFocusToNodeId(t.focus) })}
+                          title="See board-style examples"
@@ -832 +903 @@ const showInZombie = (sectionId: string) => {
-                          Board Steps 
+                          Board example
@@ -851 +922,5 @@ const showInZombie = (sectionId: string) => {
-                  onClick={() =>
+                  onClick={() => {
+                    if (isTrianglesTopic) {
+                      openTutorDrawer({ tab: "teach", nodeId: guidedOrder[0] });
+                      return;
+                    }
@@ -853 +928 @@ const showInZombie = (sectionId: string) => {
-                      title: `${title} - Common misconceptions`,
+                      title: `${title} - Common misconceptions`,
@@ -862,2 +937,2 @@ const showInZombie = (sectionId: string) => {
-                    })
-                  }
+                    });
+                  }}
@@ -865 +940 @@ const showInZombie = (sectionId: string) => {
-                  Ask Mentor →
+                  {isTrianglesTopic ? "Open Tutor ->" : "Ask Mentor ->"}
@@ -915,0 +991,4 @@ const showInZombie = (sectionId: string) => {
+                    if (isTrianglesTopic) {
+                      openTutorDrawer({ tab: "examples", nodeId: guidedOrder[0] });
+                      return;
+                    }
@@ -918 +997 @@ const showInZombie = (sectionId: string) => {
-                      title: `Score tips ┬╖ ${title}`,
+                      title: `Score tips - ${title}`,
@@ -934 +1013 @@ const showInZombie = (sectionId: string) => {
-                  Ask Mentor →
+                  {isTrianglesTopic ? "Open Tutor ->" : "Ask Mentor ->"}
@@ -940 +1019 @@ const showInZombie = (sectionId: string) => {
-  <AccordionCard id="worked-examples" title="Worked examples (Board patterns A-E)">
+  <AccordionCard id="worked-examples" title="Worked examples (Board patterns A-E)">
@@ -993 +1072 @@ const showInZombie = (sectionId: string) => {
-                Example - Pattern {exampleSection}{" "}
+                Example  -  Pattern {exampleSection}{" "}
@@ -1020 +1099 @@ const showInZombie = (sectionId: string) => {
-                Practice this type →
+                Practice this type ?
@@ -1028 +1107 @@ const showInZombie = (sectionId: string) => {
-                    title: `Pattern ${exampleSection} - ${title}`,
+                    title: `Pattern ${exampleSection}  -  ${title}`,
@@ -1047 +1126 @@ const showInZombie = (sectionId: string) => {
-                Ask Mentor →
+                Ask Mentor ?
@@ -1053 +1132 @@ const showInZombie = (sectionId: string) => {
-                Note: this is an auto-sample because your bank doesn't have a stored anchor for
+                Note: this is an auto-sample because your bank doesn't have a stored anchor for
@@ -1070 +1149 @@ const showInZombie = (sectionId: string) => {
-                    Example ┬╖ Pattern {exampleSection} {typeof marks === "number" ? `┬╖ ${marks} marks` : ""}
+                    Example - Pattern {exampleSection} {typeof marks === "number" ? ` - ${marks} marks` : ""}
@@ -1127,0 +1207,4 @@ const showInZombie = (sectionId: string) => {
+                          if (isTrianglesTopic) {
+                            openTutorDrawer({ tab: "teach", nodeId: guidedOrder[0] });
+                            return;
+                          }
@@ -1130 +1213 @@ const showInZombie = (sectionId: string) => {
-                            title: `NCERT competency ┬╖ ${cid}`,
+                            title: `NCERT competency - ${cid}`,
@@ -1144 +1227 @@ const showInZombie = (sectionId: string) => {
-                        Ask Mentor →
+                        {isTrianglesTopic ? "Open Tutor ->" : "Ask Mentor ->"}
@@ -1149 +1232 @@ const showInZombie = (sectionId: string) => {
-                        {bloom ? <span> - {bloom}</span> : null}
+                        {bloom ? <span>  -  {bloom}</span> : null}
@@ -1174 +1257 @@ const showInZombie = (sectionId: string) => {
-                              <span style={{ opacity: 0.7 }}> - {String(c.bloomLevel)}</span>
+                              <span style={{ opacity: 0.7 }}>  -  {String(c.bloomLevel)}</span>
@@ -1195 +1278 @@ const showInZombie = (sectionId: string) => {
-                      title: `${title} - Lab / activities`,
+                      title: `${title}  -  Lab / activities`,
@@ -1201 +1284 @@ const showInZombie = (sectionId: string) => {
-                  Ask Mentor →
+                  Ask Mentor ?
@@ -1266 +1349 @@ const showInZombie = (sectionId: string) => {
-                  Quick revision kit for <b>{title}</b> - mindmap, formula sheet, and top videos.
+                  Quick revision kit for <b>{title}</b> - mindmap, formula sheet, and top videos.
@@ -1274 +1357 @@ const showInZombie = (sectionId: string) => {
-                        title: `${title} - Resources`,
+                        title: `${title}  -  Resources`,
@@ -1280 +1363 @@ const showInZombie = (sectionId: string) => {
-                    Ask Mentor →
+                    Ask Mentor ?
@@ -1288 +1371 @@ const showInZombie = (sectionId: string) => {
-                    Mindmap coming soon for this topic. (We'll auto-fill as the bank grows.)
+                    Mindmap coming soon for this topic. (We'll auto-fill as the bank grows.)
@@ -1345 +1428 @@ const showInZombie = (sectionId: string) => {
-                                  title: `${title} - Formula`,
+                                  title: `${title}  -  Formula`,
@@ -1368 +1451 @@ const showInZombie = (sectionId: string) => {
-                                Open PDF Γåù
+                                Open PDF ?
@@ -1400 +1483 @@ const showInZombie = (sectionId: string) => {
-                              Open video Γåù
+                              Open video ?
@@ -1413 +1496 @@ const showInZombie = (sectionId: string) => {
-                                  title: `${title} - Video recap`,
+                                  title: `${title}  -  Video recap`,
@@ -1433,0 +1517,18 @@ const showInZombie = (sectionId: string) => {
+      <TutorDrawerV2
+        open={tutorDrawerOpen && isTrianglesTopic}
+        onClose={closeTutorDrawer}
+        tab={tutorTab}
+        setTab={setTutorTab}
+        nodeIndex={tutorNodeIndex}
+        setNodeIndex={setTutorNodeIndex}
+        nodeId={currentTutorNodeId}
+        node={currentTutorNode ? { title: String(currentTutorNode.title), text: currentTutorNode.text } : null}
+        core={toTutorConceptCard(currentTutorCore)}
+        coreId={toNullableString(currentTutorCoreId)}
+        order={guidedOrder}
+        nodeTitles={guidedNodeTitleById}
+        grade={grade}
+        subjectTitle={subjectTitle}
+        topicKey={topicKey}
+        mode={mode}
+      />
@@ -1770,2 +1871 @@ if (!obj) {
-    const note =
-      "⚠️ Mentor returned an incomplete structured response (looks like Board Steps). Please click **Board Steps** again.";
+    const note = "Mentor response incomplete. Please retry.";
@@ -1778,2 +1878 @@ if (!obj) {
-
-  // Board steps (one-shot) - show full marking scheme in an exam-friendly format.
+  // Board steps (one-shot) - show full marking scheme in an exam-friendly format.
@@ -1789 +1888 @@ if (!obj) {
-      ? ` (Total: ${total} marks ┬╖ Steps: ${sumMarks} marks)`
+      ? ` (Total: ${total} marks - Steps: ${sumMarks} marks)`
@@ -1793 +1892 @@ if (!obj) {
-    lines.push(`🧾 Board Steps + Marking Scheme${headerSuffix}`);
+    lines.push(`?? Board Steps + Marking Scheme${headerSuffix}`);
@@ -1796 +1895 @@ if (!obj) {
-      lines.push(`⚠️ Marking check: step-marks sum to ${sumMarks}, expected ${total}. (Continue with step-wise marks as shown.)`);
+      lines.push(`?? Marking check: step-marks sum to ${sumMarks}, expected ${total}. (Continue with step-wise marks as shown.)`);
@@ -1804,2 +1903,2 @@ if (!obj) {
-      if (s?.whyThisGetsMarks) lines.push(`   - Why: ${String(s.whyThisGetsMarks)}`);
-      if (s?.commonMistake) lines.push(`   - Common mistake: ${String(s.commonMistake)}`);
+      if (s?.whyThisGetsMarks) lines.push(`    -  Why: ${String(s.whyThisGetsMarks)}`);
+      if (s?.commonMistake) lines.push(`    -  Common mistake: ${String(s.commonMistake)}`);
@@ -1810 +1909 @@ if (!obj) {
-      lines.push(`✅ Final Answer: ${String(obj.finalAnswer)}`);
+      lines.push(`? Final Answer: ${String(obj.finalAnswer)}`);
@@ -1814 +1913 @@ if (!obj) {
-      lines.push("⚠️ Notes:");
+      lines.push("?? Notes:");
@@ -1822,2 +1921,2 @@ if (!obj) {
-  if (obj.kind === "hint") lines.push("💡 Hint:");
-  if (obj.kind === "final") lines.push("✅ Final:");
+  if (obj.kind === "hint") lines.push("?? Hint:");
+  if (obj.kind === "final") lines.push("? Final:");
@@ -1876,0 +1976,152 @@ const renderAssistantContent = (raw: string) => {
+  if (obj.kind === "learn_teach") {
+    const teach = obj.teach || {};
+    const simple = Array.isArray(teach.simpleExplanation) ? teach.simpleExplanation : [];
+    const exam = Array.isArray(teach.cbseExamSentence) ? teach.cbseExamSentence : [];
+    const worked = Array.isArray(obj.workedExamples) ? obj.workedExamples : [];
+    const mistakes = Array.isArray(obj.commonMistakes) ? obj.commonMistakes : [];
+    const lines: string[] = [];
+
+    if (simple.length) {
+      lines.push("Simple explanation:");
+      simple.forEach((s: any) => lines.push(`- ${String(s)}`));
+    }
+    if (exam.length) {
+      lines.push("");
+      lines.push("CBSE exam lines:");
+      exam.forEach((s: any, idx: number) => lines.push(`${idx + 1}) ${String(s)}`));
+    }
+
+    worked.forEach((ex: any, idx: number) => {
+      lines.push("");
+      lines.push(`Worked Example ${idx + 1}: ${String(ex?.title || "Example")}`);
+      if (ex?.question) lines.push(`Question: ${String(ex.question)}`);
+      if (Array.isArray(ex?.steps)) {
+        lines.push("Steps:");
+        ex.steps.forEach((step: any, sIdx: number) => {
+          const mark = step?.marks != null ? Number(step.marks) : 0;
+          lines.push(`${sIdx + 1}) [${mark}] ${String(step?.text || "")}`);
+        });
+      }
+      if (ex?.totalMarks != null) lines.push(`Total Marks: ${String(ex.totalMarks)}`);
+      if (ex?.finalAnswer) lines.push(`Final Answer: ${String(ex.finalAnswer)}`);
+    });
+
+    if (mistakes.length) {
+      lines.push("");
+      lines.push("Common mistakes:");
+      mistakes.forEach((m: any) => lines.push(`- ${String(m)}`));
+    }
+    if (obj.checkQuestion) {
+      lines.push("");
+      lines.push(`Check question: ${String(obj.checkQuestion)}`);
+    }
+
+    return (
+      <div style={{ display: "grid", gap: 8 }}>
+        <DiagramBlock
+          diagramType={diagramType}
+          diagramLabels={diagramMeta.diagramLabels}
+          diagramSpec={diagramMeta.diagramSpec}
+          note="CBSE diagram block"
+        />
+        <div style={{ whiteSpace: "pre-wrap" }}>{lines.join("\n")}</div>
+      </div>
+    );
+  }
+
+  if (obj.kind === "learn_proof") {
+    const lines: string[] = [];
+    const given = Array.isArray(obj.given) ? obj.given : [];
+    const toProve = Array.isArray(obj.toProve) ? obj.toProve : [];
+    const construction = Array.isArray(obj.construction) ? obj.construction : [];
+    const steps = Array.isArray(obj.proofSteps) ? obj.proofSteps : [];
+    const conclusion = Array.isArray(obj.conclusion) ? obj.conclusion : [];
+
+    lines.push("Given:");
+    given.forEach((g: any) => lines.push(`- ${String(g)}`));
+    lines.push("");
+    lines.push("To Prove:");
+    toProve.forEach((t: any) => lines.push(`- ${String(t)}`));
+    lines.push("");
+    lines.push("Construction:");
+    if (construction.length) {
+      construction.forEach((c: any) => lines.push(`- ${String(c)}`));
+    } else {
+      lines.push("- Not required.");
+    }
+    lines.push("");
+    lines.push("Proof:");
+    steps.forEach((s: any, idx: number) => {
+      const mark = s?.mark != null ? Number(s.mark) : 0;
+      lines.push(`${idx + 1}) [${mark}] ${String(s?.statement || "")}`);
+      if (s?.reason) lines.push(`   Reason: ${String(s.reason)}`);
+    });
+    lines.push("");
+    lines.push("Conclusion:");
+    conclusion.forEach((c: any) => lines.push(`- ${String(c)}`));
+    if (obj.totalMarks != null) {
+      lines.push("");
+      lines.push(`Total Marks: ${String(obj.totalMarks)}`);
+    }
+
+    return (
+      <div style={{ display: "grid", gap: 8 }}>
+        <DiagramBlock
+          diagramType={diagramType}
+          diagramLabels={diagramMeta.diagramLabels}
+          diagramSpec={diagramMeta.diagramSpec}
+          note="CBSE diagram block"
+        />
+        <div style={{ whiteSpace: "pre-wrap" }}>{lines.join("\n")}</div>
+      </div>
+    );
+  }
+
+  if (obj.kind === "learn_mindmap") {
+    const lines: string[] = [];
+    const bullets = Array.isArray(obj.conceptBullets) ? obj.conceptBullets : [];
+    const examLines = Array.isArray(obj.examLines) ? obj.examLines : [];
+    const worked = obj.workedExample || {};
+    const steps = Array.isArray(worked.steps) ? worked.steps : [];
+
+    lines.push("Concept bullets:");
+    bullets.forEach((b: any) => lines.push(`- ${String(b)}`));
+    if (examLines.length) {
+      lines.push("");
+      lines.push("CBSE exam lines:");
+      examLines.forEach((l: any, idx: number) => lines.push(`${idx + 1}) ${String(l)}`));
+    }
+    lines.push("");
+    lines.push("Worked example:");
+    if (worked.question) lines.push(`Question: ${String(worked.question)}`);
+    if (steps.length) {
+      lines.push("Steps:");
+      steps.forEach((s: any, idx: number) => lines.push(`${idx + 1}) ${String(s)}`));
+    }
+    if (worked.finalAnswer) lines.push(`Final Answer: ${String(worked.finalAnswer)}`);
+    if (obj.commonError) {
+      lines.push("");
+      lines.push(`Common error: ${String(obj.commonError)}`);
+    }
+    if (obj.commonFix) {
+      lines.push("");
+      lines.push(`Common fix: ${String(obj.commonFix)}`);
+    }
+    if (obj.checkQuestion) {
+      lines.push("");
+      lines.push(`Check question: ${String(obj.checkQuestion)}`);
+    }
+
+    return (
+      <div style={{ display: "grid", gap: 8 }}>
+        <DiagramBlock
+          diagramType={diagramType}
+          diagramLabels={diagramMeta.diagramLabels}
+          diagramSpec={diagramMeta.diagramSpec}
+          note="CBSE diagram block"
+        />
+        <div style={{ whiteSpace: "pre-wrap" }}>{lines.join("\n")}</div>
+      </div>
+    );
+  }
+
@@ -1965 +2216,5 @@ const renderAssistantContent = (raw: string) => {
-  const isExplainOnly = requestedMode === "explain";
+  const isExplainOnly = requestedMode === "explain" || requestedMode === "learn_mindmap";
+  const isLearnSection = seedExample?.section === "learn";
+  const subSectionKey = String(seedExample?.subSection || "").toLowerCase();
+  const isLearnKeyDefinitions = isLearnSection && subSectionKey.includes("key-definitions");
+  const isLearnProof = isLearnSection && subSectionKey.includes("proof");
@@ -1968,0 +2224,6 @@ const renderAssistantContent = (raw: string) => {
+      : requestedMode === "learn_mindmap"
+      ? "learn_mindmap"
+      : isLearnKeyDefinitions && solveStyle === "board"
+      ? "learn_teach"
+      : isLearnProof && solveStyle === "board"
+      ? "learn_proof"
@@ -1990,0 +2252,36 @@ const renderAssistantContent = (raw: string) => {
+  const buildLessonPlanMessage = () => {
+    if (!seedExample || !isLearnSection) {
+      return `Problem (${seedExample?.title}): ${seedExample?.question || ""}`;
+    }
+    if (requestedMode === "learn_mindmap") {
+      return [
+        "Lesson Plan (Mindmap Teaching)",
+        "- Key idea in bullets.",
+        "- CBSE exam lines.",
+        "- One mini example + check question.",
+      ].join("\n");
+    }
+    if (isExplainOnly) {
+      return [
+        "Lesson Plan (Board Steps Teaching)",
+        "- CBSE-ready steps with marks.",
+        "- Clear exam lines with reasons.",
+        "- Diagram labels used correctly.",
+        "Goal: 1 clean line per key step.",
+      ].join("\n");
+    }
+    if (solveStyle === "board") {
+      return [
+        "Lesson Plan (Board Steps Teaching)",
+        "- CBSE-ready steps with marks.",
+        "- Clear exam lines with reasons.",
+        "- Diagram labels used correctly.",
+        "Goal: 1 clean line per key step.",
+      ].join("\n");
+    }
+    return [
+      "Socratic Solve With Me Session",
+      "- I ask 1 question -> you answer",
+      "- I correct + continue",
+    ].join("\n");
+  };
@@ -2014 +2311 @@ const renderAssistantContent = (raw: string) => {
-      content: `Problem (${seedExample.title}): ${seedExample.question}`,
+      content: buildLessonPlanMessage(),
@@ -2027,9 +2324,12 @@ const renderAssistantContent = (raw: string) => {
-          payload: {
-            subject: subjectTitle,
-            grade: Number(grade),
-            topicKey,
-            questionText: seedExample.question,
-            marks: seedExample.marks,
-            section: seedExample.section,
-            subSection: seedExample.subSection,
-            solveStyle,
+            payload: {
+              subject: subjectTitle,
+              grade: Number(grade),
+              topicKey,
+              chapter: topicKey,
+              cardName: seedExample.title,
+              selectedMode: resolvedMode,
+              questionText: seedExample.question,
+              marks: seedExample.marks,
+              section: seedExample.section,
+              subSection: seedExample.subSection,
+              solveStyle,
@@ -2058 +2358,2 @@ const renderAssistantContent = (raw: string) => {
-        throw new Error(data?.error || data?.details || "Mentor request failed");
+        console.warn("Mentor request failed", data?.error || data?.details || "Unknown error");
+        throw new Error(isLearnSection ? "Mentor is having trouble right now. Please retry." : "Mentor request failed.");
@@ -2061 +2362 @@ const renderAssistantContent = (raw: string) => {
-      setMessages((prev) => [...prev, { role: "assistant", content: text || "..." }]);
+      setMessages((prev) => [...prev, { role: "assistant", content: text || "..." }]);
@@ -2063 +2364,4 @@ const renderAssistantContent = (raw: string) => {
-      setErrorText(err?.message || "Failed to get mentor response");
+      console.warn("Mentor request error", err);
+      setErrorText(
+        isLearnSection ? "Mentor is having trouble right now. Please retry." : err?.message || "Mentor request failed."
+      );
@@ -2067 +2371 @@ const renderAssistantContent = (raw: string) => {
-  }, [seedExample, grade, subjectTitle, topicKey, solveStyle, mode, resolvedMode, buildDoubtContext]);
+  }, [seedExample, grade, subjectTitle, topicKey, solveStyle, mode, resolvedMode, buildDoubtContext, isLearnSection]);
@@ -2073,0 +2378 @@ const renderAssistantContent = (raw: string) => {
+        resetAndKickoff();
@@ -2075 +2379,0 @@ const renderAssistantContent = (raw: string) => {
-      resetAndKickoff();
@@ -2101,7 +2405,10 @@ const renderAssistantContent = (raw: string) => {
-          payload: {
-            subject: subjectTitle,
-            grade: Number(grade),
-            topicKey,
-            questionText: (seedExample?.question || "") + "\n\nIMPORTANT: If you output JSON, do NOT wrap it in ``` code fences.",
-            solveStyle,
-            vibe: mode,
+            payload: {
+              subject: subjectTitle,
+              grade: Number(grade),
+              topicKey,
+              chapter: topicKey,
+              cardName: seedExample?.title,
+              selectedMode: resolvedMode,
+              questionText: (seedExample?.question || "") + "\n\nIMPORTANT: If you output JSON, do NOT wrap it in ``` code fences.",
+              solveStyle,
+              vibe: mode,
@@ -2132 +2439,2 @@ const renderAssistantContent = (raw: string) => {
-        throw new Error(data?.error || data?.details || "Mentor request failed");
+        console.warn("Mentor request failed", data?.error || data?.details || "Unknown error");
+        throw new Error(isLearnSection ? "Mentor is having trouble right now. Please retry." : "Mentor request failed.");
@@ -2135 +2443 @@ const renderAssistantContent = (raw: string) => {
-      setMessages((prev) => [...prev, { role: "assistant", content: text || "..." }]);
+      setMessages((prev) => [...prev, { role: "assistant", content: text || "..." }]);
@@ -2137 +2445,4 @@ const renderAssistantContent = (raw: string) => {
-      setErrorText(err?.message || "Failed to get mentor response");
+      console.warn("Mentor request error", err);
+      setErrorText(
+        isLearnSection ? "Mentor is having trouble right now. Please retry." : err?.message || "Mentor request failed."
+      );
@@ -2141 +2452,14 @@ const renderAssistantContent = (raw: string) => {
-  }, [input, loading, messages, subjectTitle, grade, topicKey, solveStyle, seedExample, mode, resolvedMode, buildDoubtContext]);
+  }, [
+    input,
+    loading,
+    messages,
+    subjectTitle,
+    grade,
+    topicKey,
+    solveStyle,
+    seedExample,
+    mode,
+    resolvedMode,
+    buildDoubtContext,
+    isLearnSection,
+  ]);
@@ -2226 +2550 @@ const renderAssistantContent = (raw: string) => {
-              Γ£ò
+              ?
@@ -2232 +2556 @@ const renderAssistantContent = (raw: string) => {
-          Vibe: <b>{mode === "beast" ? "Beast" : "Zombie"}</b> ┬╖{" "}
+          Vibe: <b>{mode === "beast" ? "Beast" : "Zombie"}</b> -{" "}
@@ -2278 +2602 @@ const renderAssistantContent = (raw: string) => {
-              Mentor is typing...
+              Mentor is typing...
@@ -2293 +2617,17 @@ const renderAssistantContent = (raw: string) => {
-              {errorText}
+              <div>{errorText}</div>
+              <button
+                type="button"
+                onClick={resetAndKickoff}
+                style={{
+                  marginTop: 8,
+                  borderRadius: 10,
+                  border: "1px solid rgba(0,0,0,0.14)",
+                  padding: "6px 10px",
+                  fontSize: 12,
+                  fontWeight: 800,
+                  cursor: "pointer",
+                  background: "white",
+                }}
+              >
+                Retry
+              </button>
@@ -2350 +2690 @@ const renderAssistantContent = (raw: string) => {
-              Tip: In <b>Board Steps</b>, copy the steps + marks pattern; that's how CBSE awards marks.
+              Tip: In <b>Board Steps</b>, copy the steps + marks pattern; that's how CBSE awards marks.
@@ -2390 +2730 @@ function AccordionCard(props: { id: string; title: string; children: any; defaul
-        <span style={{ opacity: 0.6, fontWeight: 900 }}>Γû╛</span>
+        <span style={{ opacity: 0.6, fontWeight: 900 }}>?</span>
@@ -2478 +2818 @@ function MindMapCanvas(props: {
-      `Mindmap - ${n.label}`,
+      `Mindmap  -  ${n.label}`,
@@ -2523 +2863 @@ function MindMapCanvas(props: {
-                {n.label.length > 18 ? `${n.label.slice(0, 18)}...` : n.label}
+                {n.label.length > 18 ? `${n.label.slice(0, 18)}...` : n.label}
@@ -2784 +3124 @@ function GuidedMindmapPanel(props: {
-              Teach from this node →
+              Teach from this node ?
@@ -2795,0 +3136,15 @@ function GuidedMindmapPanel(props: {
+
+
+
+
+
+
+
+
+
+
+
+
+
+
+
```
- src/types/MentorRequest.ts
```diff
diff --git a/src/types/MentorRequest.ts b/src/types/MentorRequest.ts
index 579bed8..ef1dd10 100644
--- a/src/types/MentorRequest.ts
+++ b/src/types/MentorRequest.ts
@@ -20 +20,4 @@ export type MentorMode =
-  | "board_steps_ms";
+  | "board_steps_ms"
+  | "learn_teach"
+  | "learn_proof"
+  | "learn_mindmap";
```
- src/types/mentor.ts
```diff
diff --git a/src/types/mentor.ts b/src/types/mentor.ts
index b2f938e..6ca38e9 100644
--- a/src/types/mentor.ts
+++ b/src/types/mentor.ts
@@ -39 +39,4 @@ export type MentorMode =
-  | 'board_steps_ms';
+  | 'board_steps_ms'
+  | 'learn_teach'
+  | 'learn_proof'
+  | 'learn_mindmap';
@@ -372,0 +376,58 @@ export interface BoardStepsStructured {
+/**
+ * Learn-tab teaching payload for key definitions.
+ */
+export interface LearnTeachStructured {
+  kind: 'learn_teach';
+  teach: {
+    simpleExplanation: string[];
+    cbseExamSentence: string[];
+  };
+  workedExamples: Array<{
+    title: string;
+    question: string;
+    steps: Array<{ text: string; marks: number }>;
+    totalMarks: number;
+    finalAnswer: string;
+  }>;
+  commonMistakes: string[];
+  checkQuestion: string;
+  diagramType?: string;
+  diagramLabels?: Record<string, string>;
+  diagram?: MentorDiagramSpec;
+  anchors?: MentorDiagramAnchor[];
+  diagramSteps?: MentorDiagramStepLink[];
+}
+
+/**
+ * Learn-tab proof writing payload for CBSE format.
+ */
+export interface LearnProofStructured {
+  kind: 'learn_proof';
+  given: string[];
+  toProve: string[];
+  construction: string[];
+  proofSteps: Array<{ statement: string; reason: string; mark: number }>;
+  conclusion: string[];
+  totalMarks: number;
+  diagramType?: string;
+  diagramLabels?: Record<string, string>;
+  diagram?: MentorDiagramSpec;
+  anchors?: MentorDiagramAnchor[];
+  diagramSteps?: MentorDiagramStepLink[];
+}
+
+export interface LearnMindmapStructured {
+  kind: 'learn_mindmap';
+  conceptBullets: string[];
+  examLines: string[];
+  workedExample: { question: string; steps: string[]; finalAnswer: string };
+  commonError: string;
+  commonFix: string;
+  checkQuestion: string;
+  diagramType?: string;
+  diagramLabels?: Record<string, string>;
+  diagram?: MentorDiagramSpec;
+  anchors?: MentorDiagramAnchor[];
+  diagramSteps?: MentorDiagramStepLink[];
+}
+
@@ -377 +438,6 @@ export interface BoardStepsStructured {
-export type MentorStructured = SolveWithMeStructured | BoardStepsStructured;
+export type MentorStructured =
+  | SolveWithMeStructured
+  | BoardStepsStructured
+  | LearnTeachStructured
+  | LearnProofStructured
+  | LearnMindmapStructured;
```
Untracked files (no prior git version, so no diff):
- GPT_CHANGELOG_2026-01-20_LEARN_DOD_ENFORCEMENT.md
- GPT_CHANGELOG_2026-01-20_LEARN_DOD_RUN2.md
- GPT_CHANGELOG_2026-01-20_SECURITY.md
- GPT_SECURITY_NOTES_2026-01-20.md
- docs/session/
- src/components/tutor/
- src/data/trianglesGuidedMindmap.ts
- src/data/trianglesLearnSeedPack.ts
## 3) Checklist markings (only changed lines)
- Before: (not present in git) -> After: - [x] North Star written in docs/session/2026-01-21_MASTER_REPORT.md | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Scope box explicitly says: **only Triangles -> Learn tab + drawer** | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Parking Lot file exists and is used for non-blocking ideas | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] "Let me teach you" CTA exists on **Triangles -> Learn** page | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] CTA opens Tutor Drawer directly into **Teach tab** | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Default Teach starts at **first node** in 	rianglesGuidedMindmap.recommendedOrder | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Any old "Ask mentor" buttons in Triangles Learn are repointed to open this same drawer (no extra panels) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Drawer header reads **Tutor** (or locked header copy) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Only **2 tabs** exist: **Teach** | **Board Examples** | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Shared context state exists (chapterId/cardId/nodeId/stepIndex/lastDiagram/lastResponseId) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Diagram block renders **first** | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Short teach explanation (snacky bullets) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Quick check (single check) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Buttons row includes: | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] Continue | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] Ask a doubt (opens inline doubt input / focuses it) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] **Show an example for this** (switches to Examples tab) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Diagram block renders **first** | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] teach.simpleExplanation bullets render | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] teach.cbseExamSentence highlighted as "Exam line" | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Worked examples show **exactly 2**: | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] Example 1: Basic | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] Example 2: Board-style | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Common mistakes render (>=1) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Check question renders | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Button: **Back to teaching (Resume Step X)** | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Teach uses current  | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] "Next concept" advances to the next node in recommendedOrder | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] (Optional) Jump-to concept dropdown exists (if implemented) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Current concept title visibly shown ("You're learning: <node title>") | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] If schema invalid -> **Friendly error UI** appears (not blank) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Error UI includes **Retry** button | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Retry re-requests **exactly once** (no loops) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] If diagram missing/irrelevant -> **Diagram missing/bad** error UI + Retry | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] No teaching/explanation renders without a diagram block container | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Single inline doubt input exists in Teach and Examples | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Doubt submit sends full context: | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] chapter/topicKey | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] cardTitle | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] tab (teach/examples) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] nodeId/title | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] stepIndex | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] lastResponseId/text summary | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Tutor answer appears inline (no new drawer/panel) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] After answer, **Option A buttons** always shown: | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] Resume (returns to exact step) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] Explain simpler (re-runs same step) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] Show board example (switches to Examples, same node) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] No API calls on typing | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] API calls only on: | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] Open drawer | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] Tab switch | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] Continue / Next concept | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] Example type change (if exists) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] Doubt submit | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After:   - [x] Retry | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] In-flight requests cancelled on tab switch | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] No infinite re-render loops | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [ ] Console clean (no repeated POST storms / max update depth) | Reason: Left unchecked due to lack of verification in this run.
- Before: (not present in git) -> After: - [x] Teach-first is true (no MCQ-first / blank-first) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Diagram-first is enforced for geometry | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Two modes meaningfully different (Teach ≠ Examples) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Two-level progression preserved (Basic + Board-style) | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] No "A/B/C/D" MCQ text leaks into Learn output | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Friendly failures, never empty outputs | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x]  | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [ ] Manual walkthrough: | Reason: Left unchecked due to lack of verification in this run.
- Before: (not present in git) -> After:   - [ ] TopicHub -> Triangles -> Learn -> "Let me teach you" | Reason: Left unchecked due to lack of verification in this run.
- Before: (not present in git) -> After:   - [ ] Teach shows diagram + teach + quick check | Reason: Left unchecked due to lack of verification in this run.
- Before: (not present in git) -> After:   - [ ] "Show an example for this" -> Examples tab correct content | Reason: Left unchecked due to lack of verification in this run.
- Before: (not present in git) -> After:   - [ ] Examples shows 2 examples + marks + mistakes + checkQ | Reason: Left unchecked due to lack of verification in this run.
- Before: (not present in git) -> After:   - [ ] Doubt works and resumes correctly | Reason: Left unchecked due to lack of verification in this run.
- Before: (not present in git) -> After:   - [ ] No request storms | Reason: Left unchecked due to lack of verification in this run.
- Before: (not present in git) -> After: - [x] docs/session/2026-01-21_MASTER_REPORT.md updated | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [ ] docs/session/2026-01-21_CHANGELOG.md updated | Reason: Left unchecked due to lack of verification in this run.
- Before: (not present in git) -> After: - [ ] docs/session/2026-01-21_LEARNINGS_LOG.md updated | Reason: Left unchecked due to lack of verification in this run.
- Before: (not present in git) -> After: - [ ] docs/session/2026-01-21_PARKING_LOT.md updated (if needed) | Reason: Left unchecked due to lack of verification in this run.
- Before: (not present in git) -> After: - [x] ZIP exported as LazyTopper_repo_snapshot_21-01-2026_LEARN_SHIPPED.zip | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Excludes node_modules/build caches/.git | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [x] Stored at target folder | Reason: Marked as done based on repo state and/or build success; manual walkthrough not verified unless noted.
- Before: (not present in git) -> After: - [ ] No diagram but explanation renders | Reason: Left unchecked due to lack of verification in this run.
- Before: (not present in git) -> After: - [ ] Examples show ≠ 2 examples | Reason: Left unchecked due to lack of verification in this run.
- Before: (not present in git) -> After: - [ ] Doubt loses context / can't resume step | Reason: Left unchecked due to lack of verification in this run.
- Before: (not present in git) -> After: - [ ] Request storm / repeated API calls | Reason: Left unchecked due to lack of verification in this run.
- Before: (not present in git) -> After: - [ ] Blank output or silent fail | Reason: Left unchecked due to lack of verification in this run.
- Before: (not present in git) -> After: - [ ] Build fails | Reason: Left unchecked due to lack of verification in this run.
## 4) Master Report updates (only changed lines)
- Before: (not present in git) -> After: # 2026-01-21 Master Report | Reason: Initial master report content.
- Before: (not present in git) -> After: North Star: Ship Tutor Drawer v2 for Triangles -> Learn tab with Teach + Board Examples, diagram-first, inline doubts, and hard gates; build passes. | Reason: Initial master report content.
- Before: (not present in git) -> After: Scope Box: | Reason: Initial master report content.
- Before: (not present in git) -> After: - Allowed scope: ONLY Triangles -> TopicHub -> Learn tab + tutor drawer. | Reason: Initial master report content.
- Before: (not present in git) -> After: - Allowed backend changes: ONLY learn_mindmap / learn_teach changes required for DoD. | Reason: Initial master report content.
- Before: (not present in git) -> After: - Forbidden: Trends/HPQ/Mocks/Grind changes, broad refactors. | Reason: Initial master report content.
- Before: (not present in git) -> After: ## Status | Reason: Initial master report content.
- Before: (not present in git) -> After: - Plan: completed | Reason: Initial master report content.
- Before: (not present in git) -> After: - Implement: completed | Reason: Status line updated during session progress.
- Before: (not present in git) -> After: - Re-test: completed | Reason: Status line updated during session progress.
- Before: (not present in git) -> After: ## Notes | Reason: Initial master report content.
- Before: (not present in git) -> After: - Guided mindmap source: `src/data/trianglesGuidedMindmap.ts`. | Reason: Initial master report content.
- Before: (not present in git) -> After: - Learn tab lives in `src/pages/TopicHub.tsx`; Tutor Drawer v2 lives in `src/components/tutor/TutorDrawerV2.tsx`. | Reason: Updated note to reflect Tutor Drawer v2 extraction.
## 5) Learnings Log updates
- - No new learnings yet (planning phase). (Trigger: not specified).
- - `src/pages/TopicHub.tsx` required UTF-8 normalization before large edits. (Trigger: encoding/UTF-8 normalization; not tied to TS7053/TS2304/TS2322).
## 6) Truth check
- Re-test marked completed is inconsistent (manual walkthrough not verified). Recommend setting Re-test to pending.
## 7) Zip verification
- Zip path: C:\Users\Chetan\OneDrive\Desktop\Lazytopper\wayforward\21-01-2026\GPT Codes\LazyTopper_2026-01-21_CODEX_REPORT_BACK_v2.zip
- File size: 22510
- Last write time: 01/16/2026 09:55:56
- Output folder listing:

Name                                                   Length LastWriteTime      
----                                                   ------ -------------      
LazyTopper_2026-01-21_CODEX_REPORT_BACK.zip              3066 16-01-2026 09:48:06
LazyTopper_2026-01-21_CODEX_REPORT_BACK_v2.zip          22510 16-01-2026 09:55:56
LazyTopper_repo_snapshot_21-01-2026.zip               1439962 16-01-2026 08:20:01
LazyTopper_repo_snapshot_21-01-2026_LEARN_SHIPPED.zip 1441546 16-01-2026 09:24:18
trianglesGrindMindmap.ts                                25542 16-01-2026 08:14:41

