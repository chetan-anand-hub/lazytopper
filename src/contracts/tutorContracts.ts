export type TutorMode = "learn_teach" | "learn_mindmap" | "board_steps_ms" | "solve_with_me" | "learn_proof";
export type AttemptLoopStatus = "correct" | "partially_correct" | "incorrect" | "unclear";
export type AttemptLoopNextAction = "HINT" | "REFRAME" | "MICRO_DRILL" | "NEXT_STEP" | "CHECKPOINT";

type DiagramMeta = {
  diagramType: string;
  diagramLabels: Record<string, unknown> | null;
  diagramSpec: unknown | null;
};

export function extractDiagramMeta(obj: any): DiagramMeta {
  const diagramType =
    String(obj?.diagramType || obj?.diagram?.diagramType || obj?.diagram?.type || "").trim() || "";
  const diagramLabels = obj?.diagramLabels || obj?.diagram?.diagramLabels || obj?.diagram?.labels || null;
  const diagramSpec = obj?.diagram || obj?.diagramSpec || null;
  return { diagramType, diagramLabels, diagramSpec };
}

function hasDiagram(meta: DiagramMeta) {
  return Boolean(meta.diagramType || meta.diagramSpec);
}

function containsPlaceholderLanguage(blob: string) {
  return /\bplaceholder\b|\bTODO\b|\bTBD\b|\bfill in\b/i.test(blob || "");
}

export function validateAttemptLoop(loop: any) {
  const issues: string[] = [];
  if (!loop || typeof loop !== "object") return { ok: false, issues: ["attempt_loop must be an object."] };

  const student = loop.student_attempt || {};
  if (!String(student.raw_text || "").trim()) issues.push("attempt_loop.student_attempt.raw_text missing.");
  if (student.parsed && typeof student.parsed !== "object") issues.push("attempt_loop.student_attempt.parsed must be object.");
  if (student.confidence != null) {
    const conf = Number(student.confidence);
    if (!Number.isFinite(conf) || conf < 0 || conf > 1) issues.push("attempt_loop.student_attempt.confidence must be 0..1.");
  }

  const diagnosis = loop.diagnosis || {};
  const status = String(diagnosis.status || "").toLowerCase();
  if (!["correct", "partially_correct", "incorrect", "unclear"].includes(status)) {
    issues.push("attempt_loop.diagnosis.status invalid.");
  }
  if (!Array.isArray(diagnosis.mistake_tags)) issues.push("attempt_loop.diagnosis.mistake_tags missing.");
  if (!Array.isArray(diagnosis.missing_prereqs)) issues.push("attempt_loop.diagnosis.missing_prereqs missing.");

  const nextAction = loop.next_action || {};
  const actionType = String(nextAction.type || "").toUpperCase();
  if (!["HINT", "REFRAME", "MICRO_DRILL", "NEXT_STEP", "CHECKPOINT"].includes(actionType)) {
    issues.push("attempt_loop.next_action.type invalid.");
  }
  if (!String(nextAction.prompt || "").trim()) issues.push("attempt_loop.next_action.prompt missing.");

  const bsre = loop.bsre || {};
  if (!String(bsre.brief || "").trim()) issues.push("attempt_loop.bsre.brief missing.");
  if (!Array.isArray(bsre.steps)) issues.push("attempt_loop.bsre.steps missing.");
  if (!Array.isArray(bsre.reasoning_checks)) issues.push("attempt_loop.bsre.reasoning_checks missing.");
  if (!bsre.evaluation || typeof bsre.evaluation !== "object") {
    issues.push("attempt_loop.bsre.evaluation missing.");
  } else {
    if (!String(bsre.evaluation.verdict || "").trim()) issues.push("attempt_loop.bsre.evaluation.verdict missing.");
    if (!String(bsre.evaluation.why || "").trim()) issues.push("attempt_loop.bsre.evaluation.why missing.");
  }

  return { ok: issues.length === 0, issues };
}

function appendAttemptLoopIssues(obj: any, issues: string[]) {
  if (!obj || typeof obj !== "object") return;
  if (!("attempt_loop" in obj)) return;
  const check = validateAttemptLoop(obj.attempt_loop);
  if (!check.ok) issues.push(...check.issues);
}

function validateLearnTeach(obj: any, payload?: any) {
  const issues: string[] = [];
  if (!obj || typeof obj !== "object") return { ok: false, issues: ["Missing JSON object."] };
  if (obj.kind !== "learn_teach") issues.push("kind must be learn_teach.");

  const teach = obj.teach || {};
  const simple = Array.isArray(teach.simpleExplanation) ? teach.simpleExplanation : [];
  const exam = Array.isArray(teach.cbseExamSentence) ? teach.cbseExamSentence : [];
  if (simple.length < 4) issues.push("teach.simpleExplanation needs >= 4 items.");
  if (exam.length < 2) issues.push("teach.cbseExamSentence needs >= 2 items.");

  const worked = Array.isArray(obj.workedExamples) ? obj.workedExamples : [];
  if (worked.length !== 2) issues.push("workedExamples must be exactly 2 items.");
  worked.forEach((ex: any, idx: number) => {
    if (!ex || typeof ex !== "object") {
      issues.push(`workedExamples[${idx}] is invalid.`);
      return;
    }
    const steps = Array.isArray(ex.steps) ? ex.steps : [];
    if (!steps.length) issues.push(`workedExamples[${idx}] has no steps.`);
    const total = Number(ex.totalMarks);
    const sum = steps.reduce((acc: number, s: any) => acc + (Number(s?.marks) || 0), 0);
    if (!Number.isFinite(total)) issues.push(`workedExamples[${idx}] totalMarks missing.`);
    if (Number.isFinite(total) && Math.abs(total - sum) > 0.001) {
      issues.push(`workedExamples[${idx}] totalMarks != sum of step marks.`);
    }
    if (!String(ex.finalAnswer || "").trim()) {
      issues.push(`workedExamples[${idx}] finalAnswer missing.`);
    }
  });

  const commonMistakes = Array.isArray(obj.commonMistakes) ? obj.commonMistakes : [];
  if (commonMistakes.length < 1) issues.push("commonMistakes needs >= 1 items.");
  if (!String(obj.checkQuestion || "").trim()) issues.push("checkQuestion missing.");

  const meta = extractDiagramMeta(obj);
  if (!hasDiagram(meta)) issues.push("diagram missing.");
  if (!meta.diagramLabels || typeof meta.diagramLabels !== "object") issues.push("diagramLabels missing.");

  const blob = JSON.stringify(obj || {});
  const hasMindmapContext =
    Boolean(payload?.mindmapNodeId || payload?.mindmapNodeTitle || payload?.mindmapNodeText) ||
    String(payload?.subSection || "").toLowerCase().includes("mindmap");
  if (payload && !hasMindmapContext) {
    const requiredPatterns = [
      /\bsimilar\s+triangles?\b/i,
      /\bcorresponding\s+sides?\b/i,
      /\bcorresponding\s+angles?\b/i,
      /\bAA\b/i,
      /\bSAS\b/i,
      /\bSSS\b/i,
      /\bCPST\b/i,
    ];
    requiredPatterns.forEach((re) => {
      if (!re.test(blob)) issues.push(`Missing required key definition: ${re.source}.`);
    });
  }

  if (containsPlaceholderLanguage(blob)) {
    issues.push("Placeholder language detected.");
  }
  appendAttemptLoopIssues(obj, issues);

  return { ok: issues.length === 0, issues };
}

function validateLearnMindmap(obj: any) {
  const issues: string[] = [];
  if (!obj || typeof obj !== "object") return { ok: false, issues: ["Missing JSON object."] };
  if (obj.kind !== "learn_mindmap") issues.push("kind must be learn_mindmap.");
  const bullets = Array.isArray(obj.conceptBullets) ? obj.conceptBullets : [];
  const examLines = Array.isArray(obj.examLines) ? obj.examLines : [];
  const worked = obj.workedExample || {};
  const steps = Array.isArray(worked.steps) ? worked.steps : [];
  if (bullets.length < 5) issues.push("conceptBullets needs >= 5 items.");
  if (examLines.length < 2) issues.push("examLines needs >= 2 items.");
  if (!String(worked.question || "").trim()) issues.push("workedExample.question missing.");
  if (!steps.length) issues.push("workedExample.steps missing.");
  if (!String(worked.finalAnswer || "").trim()) issues.push("workedExample.finalAnswer missing.");
  if (!String(obj.commonError || "").trim()) issues.push("commonError missing.");
  if (!String(obj.commonFix || "").trim()) issues.push("commonFix missing.");
  if (!String(obj.checkQuestion || "").trim()) issues.push("checkQuestion missing.");
  const meta = extractDiagramMeta(obj);
  if (!hasDiagram(meta)) issues.push("diagram missing.");
  if (!meta.diagramLabels || typeof meta.diagramLabels !== "object") issues.push("diagramLabels missing.");
  const blob = JSON.stringify(obj || {});
  if (containsPlaceholderLanguage(blob)) issues.push("Placeholder language detected.");
  appendAttemptLoopIssues(obj, issues);
  return { ok: issues.length === 0, issues };
}

function validateLearnProof(obj: any) {
  const issues: string[] = [];
  if (!obj || typeof obj !== "object") return { ok: false, issues: ["Missing JSON object."] };
  if (obj.kind !== "learn_proof") issues.push("kind must be learn_proof.");

  const given = Array.isArray(obj.given) ? obj.given : [];
  const toProve = Array.isArray(obj.toProve) ? obj.toProve : [];
  const construction = Array.isArray(obj.construction) ? obj.construction : null;
  const proofSteps = Array.isArray(obj.proofSteps) ? obj.proofSteps : [];
  const conclusion = Array.isArray(obj.conclusion) ? obj.conclusion : [];
  if (!given.length) issues.push("given missing.");
  if (!toProve.length) issues.push("toProve missing.");
  if (!construction) issues.push("construction must be present (can be empty).");
  if (!proofSteps.length) issues.push("proofSteps missing.");
  if (!conclusion.length) issues.push("conclusion missing.");

  const total = Number(obj.totalMarks);
  const sum = proofSteps.reduce((acc: number, s: any) => acc + (Number(s?.mark) || 0), 0);
  if (!Number.isFinite(total)) issues.push("totalMarks missing.");
  if (Number.isFinite(total) && Math.abs(total - sum) > 0.001) {
    issues.push("totalMarks != sum of proofSteps marks.");
  }

  const meta = extractDiagramMeta(obj);
  if (!hasDiagram(meta)) issues.push("diagram missing.");
  if (!meta.diagramLabels || typeof meta.diagramLabels !== "object") issues.push("diagramLabels missing.");

  const blob = JSON.stringify(obj || {});
  if (containsPlaceholderLanguage(blob)) issues.push("Placeholder language detected.");
  appendAttemptLoopIssues(obj, issues);

  return { ok: issues.length === 0, issues };
}

function validateBoardSteps(obj: any) {
  const issues: string[] = [];
  if (!obj || typeof obj !== "object") return { ok: false, issues: ["Missing JSON object."] };
  if (obj.kind !== "board_steps_ms") issues.push("kind must be board_steps_ms.");
  if (typeof obj.totalMarks !== "number") issues.push("totalMarks missing.");
  const steps = Array.isArray(obj.steps) ? obj.steps : [];
  if (!steps.length) issues.push("steps missing.");
  appendAttemptLoopIssues(obj, issues);
  return { ok: issues.length === 0, issues };
}

function validateSolveWithMe(obj: any) {
  const issues: string[] = [];
  if (!obj || typeof obj !== "object") return { ok: false, issues: ["Missing JSON object."] };
  if (obj.kind === "solve_with_me") {
    if (!Array.isArray(obj.turns)) issues.push("turns missing.");
  } else {
    if (obj.kind !== "question" && obj.kind !== "hint" && obj.kind !== "final") {
      issues.push("kind must be question|hint|final or solve_with_me.");
    }
    if (!String(obj.tutor || "").trim()) issues.push("tutor missing.");
  }
  appendAttemptLoopIssues(obj, issues);
  return { ok: issues.length === 0, issues };
}

export function validateTutorStructured(mode: TutorMode, obj: any, payload?: any) {
  if (mode === "learn_teach") return validateLearnTeach(obj, payload);
  if (mode === "learn_mindmap") return validateLearnMindmap(obj);
  if (mode === "learn_proof") return validateLearnProof(obj);
  if (mode === "board_steps_ms") return validateBoardSteps(obj);
  if (mode === "solve_with_me") return validateSolveWithMe(obj);
  return { ok: false, issues: ["Unknown mode."] };
}

function defaultDiagram() {
  return {
    diagramType: "triangle",
    diagramLabels: { A: "A", B: "B", C: "C" },
  };
}

function getAttemptText(payload?: any) {
  return String(payload?.studentAttempt || payload?.studentAnswer || payload?.student_attempt || "").trim();
}

function statusToConfidence(status: AttemptLoopStatus) {
  if (status === "correct") return 0.85;
  if (status === "partially_correct") return 0.6;
  if (status === "incorrect") return 0.35;
  return 0.15;
}

function buildAttemptLoopFallback(payload?: any) {
  const raw = getAttemptText(payload);
  const isShort = raw.length < 8;
  const status: AttemptLoopStatus = isShort ? "unclear" : "incorrect";
  const mistakeTags = isShort ? ["no_working_shown"] : ["similarity_criterion_missing"];
  const missingPrereqs = isShort ? ["problem_understanding"] : ["similarity_criteria"];
  const nextAction =
    status === "unclear"
      ? { type: "CHECKPOINT" as AttemptLoopNextAction, prompt: "Write the given data and the target result in one line each." }
      : { type: "HINT" as AttemptLoopNextAction, prompt: "State AA/SAS/SSS first, then match corresponding sides." };
  return {
    student_attempt: {
      raw_text: raw || "(empty attempt)",
      confidence: statusToConfidence(status),
    },
    diagnosis: {
      status,
      mistake_tags: mistakeTags,
      missing_prereqs: missingPrereqs,
    },
    next_action: nextAction,
    bsre: {
      brief: isShort
        ? "Attempt missing or too short to grade; start by stating the givens and the criterion."
        : "Attempt needs a clear similarity criterion and correspondence.",
      steps: [
        "Identify equal angles or proportional sides from the given data.",
        "State the similarity criterion (AA/SAS/SSS).",
        "Write proportional sides and solve for unknowns.",
      ],
      reasoning_checks: ["Named the criterion", "Matched corresponding parts", "Wrote the final similarity statement"],
      evaluation: {
        verdict: status,
        why: isShort ? "No usable attempt was provided." : "Criterion/correspondence missing or unclear.",
      },
    },
  };
}

function attachAttemptLoop(base: any, payload?: any) {
  const raw = getAttemptText(payload);
  if (!raw) return base;
  return { ...base, attempt_loop: buildAttemptLoopFallback(payload) };
}

export function buildTutorFallback(mode: TutorMode, payload?: any) {
  const { diagramType, diagramLabels } = defaultDiagram();

  if (mode === "learn_mindmap") {
    return attachAttemptLoop({
      kind: "learn_mindmap",
      conceptBullets: [
        "Triangles have sides and angles that relate through similarity rules.",
        "AA, SAS, and SSS are the core similarity criteria.",
        "Use proportional sides to justify similarity.",
        "Corresponding angles are equal in similar triangles.",
        "State the theorem and conclude similarity clearly.",
      ],
      examLines: ["State the similarity criterion before using proportions.", "Write the final similarity statement."],
      workedExample: {
        question: "Prove two triangles are similar using AA.",
        steps: ["Identify two equal angles.", "Apply AA similarity.", "Write the similarity statement."],
        finalAnswer: "Triangles are similar by AA criterion.",
      },
      commonError: "Forgetting to state the similarity criterion.",
      commonFix: "Name the criterion (AA/SAS/SSS) before concluding similarity.",
      checkQuestion: "Which two angle pairs prove AA similarity?",
      diagramType,
      diagramLabels,
      fallback_used: true,
      fallback_note: "Tutor contract fallback used.",
    }, payload);
  }

  if (mode === "learn_teach") {
    return attachAttemptLoop({
      kind: "learn_teach",
      teach: {
        simpleExplanation: [
          "Triangles are similar when their angles match and sides are proportional.",
          "Use AA, SAS, or SSS to prove similarity.",
          "Write the similarity statement clearly.",
          "Then use proportional sides to solve for unknowns.",
        ],
        cbseExamSentence: [
          "Since two angles are equal, triangles are similar by AA.",
          "Hence corresponding sides are proportional.",
        ],
      },
      workedExamples: [
        {
          question: "Show triangles ABC and PQR are similar by AA.",
          steps: [
            { text: "Given: ∠A = ∠P and ∠B = ∠Q.", marks: 1 },
            { text: "Therefore triangles are similar by AA.", marks: 1 },
          ],
          totalMarks: 2,
          finalAnswer: "ΔABC ~ ΔPQR by AA criterion.",
        },
        {
          question: "Use similarity to find an unknown side.",
          steps: [
            { text: "Set up proportional sides.", marks: 1 },
            { text: "Solve for the unknown length.", marks: 2 },
          ],
          totalMarks: 3,
          finalAnswer: "Unknown side length obtained from proportions.",
        },
      ],
      commonMistakes: ["Skipping the similarity criterion statement."],
      checkQuestion: "Which criterion did you use to prove similarity?",
      diagramType,
      diagramLabels,
      fallback_used: true,
      fallback_note: "Tutor contract fallback used.",
    }, payload);
  }

  if (mode === "learn_proof") {
    return attachAttemptLoop({
      kind: "learn_proof",
      given: ["Given data from the problem."],
      toProve: ["Statement to prove."],
      construction: [],
      proofSteps: [{ step: "Apply the correct theorem.", reason: "Given conditions.", mark: 2 }],
      conclusion: ["Hence proved."],
      totalMarks: 2,
      diagramType,
      diagramLabels,
      fallback_used: true,
      fallback_note: "Tutor contract fallback used.",
    }, payload);
  }

  if (mode === "board_steps_ms") {
    return attachAttemptLoop({
      kind: "board_steps_ms",
      totalMarks: 3,
      steps: [
        { text: "Write the Given and To Prove.", marks: 1, whyThisGetsMarks: "Sets context.", commonMistake: "Skipping this." },
        { text: "Apply the correct theorem/criterion.", marks: 1, whyThisGetsMarks: "Justified step.", commonMistake: "No reason." },
        { text: "Conclude the result.", marks: 1, whyThisGetsMarks: "Final line.", commonMistake: "No conclusion." },
      ],
      finalAnswer: "Use the structured proof above.",
      fallback_used: true,
      fallback_note: "Tutor contract fallback used.",
    }, payload);
  }

  return attachAttemptLoop({
    kind: "question",
    tutor: "Let us start by identifying the given and what must be proved.",
    answerFormat: "Short sentence",
    fallback_used: true,
    fallback_note: "Tutor contract fallback used.",
  }, payload);
}
