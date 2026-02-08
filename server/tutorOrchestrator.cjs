const { initHintState, computeNextHint } = require('../src/tutor/hintLadder.ts');
const { scoreRubric } = require('../src/tutor/rubricScore.ts');

function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

function pickString(primary, fallback) {
  const value = String(primary || '').trim();
  return value ? value : String(fallback || '').trim();
}

function normalizeConfidence(value) {
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'low' || v === 'med' || v === 'high') return v;
    if (v === 'medium') return 'med';
  }
  const num = Number(value);
  if (Number.isFinite(num)) {
    if (num >= 0.75) return 'high';
    if (num >= 0.45) return 'med';
    return 'low';
  }
  return 'low';
}

function extractAttemptText(payload, messages, attemptLoop) {
  const loopText = String(attemptLoop?.student_attempt?.raw_text || '').trim();
  if (loopText) return loopText;
  const payloadText = String(
    payload?.studentAttempt ||
      payload?.studentAnswer ||
      payload?.student_attempt ||
      payload?.attempt ||
      payload?.attemptText ||
      ''
  ).trim();
  if (payloadText) return payloadText;
  if (Array.isArray(messages)) {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      if (!msg || String(msg.role || '').toLowerCase() !== 'user') continue;
      const text = String(msg.content || '').trim();
      if (text) return text;
    }
  }
  return '';
}

function pickBlock(tutorObj, structuredDraft, key) {
  const nested = tutorObj && typeof tutorObj === 'object' ? tutorObj[key] : null;
  if (nested && typeof nested === 'object') return nested;
  const legacy = structuredDraft && typeof structuredDraft[key] === 'object' ? structuredDraft[key] : null;
  if (legacy && typeof legacy === 'object') return legacy;
  return {};
}

function buildDiagnosisBlock(tutorObj, structuredDraft, attemptLoop) {
  const base = pickBlock(tutorObj, structuredDraft, 'diagnosis');
  const loopDiagnosis = attemptLoop?.diagnosis || {};
  const mistakeTags = Array.isArray(base.mistake_tags)
    ? base.mistake_tags
    : normalizeStringList(loopDiagnosis.mistake_tags);
  const misconceptionSummary = pickString(
    base.misconception_summary,
    loopDiagnosis.summary ||
      attemptLoop?.bsre?.brief ||
      attemptLoop?.bsre?.evaluation?.why ||
      ''
  );
  const confidence = normalizeConfidence(
    base.confidence || attemptLoop?.student_attempt?.confidence || loopDiagnosis.confidence
  );
  return {
    ...base,
    mistake_tags: mistakeTags,
    misconception_summary: misconceptionSummary,
    confidence,
  };
}

function buildSocraticBlock(mode, tutorObj, structuredDraft, attemptLoop) {
  const base = pickBlock(tutorObj, structuredDraft, 'socratic');
  let question = pickString(base.question, attemptLoop?.next_action?.prompt || '');
  if (!question) {
    question =
      mode === 'board_steps_ms'
        ? 'Which theorem or similarity criterion should you apply first?'
        : mode === 'solve_with_me'
          ? 'What is the key criterion that links the two triangles?'
          : 'What is the first clear step you would write for this problem?';
  }
  if (!question.endsWith('?')) question += '?';
  const expectedThought = pickString(
    base.expected_thought,
    attemptLoop?.rubric?.recommended_next?.micro_drill_prompt ||
      'Identify matching angles or sides, then state the criterion clearly.'
  );
  return {
    ...base,
    question,
    expected_thought: expectedThought,
  };
}

function buildHintContext(payload, attemptLoop, attemptText) {
  const status = String(attemptLoop?.diagnosis?.status || '').toLowerCase() || 'unclear';
  return {
    status,
    mistakeTags: normalizeStringList(attemptLoop?.diagnosis?.mistake_tags),
    attemptText: attemptText || '',
    topicKey: payload?.topicKey,
    questionText: payload?.questionText || payload?.question || payload?.prompt || '',
    theoremFocus: payload?.theoremFocus,
  };
}

function buildHintLadderBlock(payload, tutorObj, structuredDraft, attemptLoop, attemptText) {
  const base = pickBlock(tutorObj, structuredDraft, 'hint_ladder');
  let level = Number.isFinite(Number(base.level)) ? Number(base.level) : null;
  let hint = pickString(base.hint, '');
  let nextAction = pickString(base.next_action, '');

  const loopHint = attemptLoop?.hint_ladder;
  if (loopHint && typeof loopHint === 'object') {
    if (level == null) {
      const lastLevel = Number(loopHint?.last_hint?.level);
      level = Number.isFinite(lastLevel) ? lastLevel : Number(loopHint.level);
    }
    if (!hint) hint = pickString(loopHint?.last_hint?.text, '');
    if (!nextAction) {
      nextAction = loopHint.next_hint_available
        ? 'Request the next hint if still stuck.'
        : 'Try solving with this hint.';
    }
  }

  if (!hint) {
    const context = buildHintContext(payload, attemptLoop, attemptText);
    const state =
      payload && typeof payload.hintLadderState === 'object' && payload.hintLadderState
        ? payload.hintLadderState
        : initHintState();
    const computed = computeNextHint(state, context, true);
    if (level == null) {
      const computedLevel = Number(computed?.last_hint?.level);
      level = Number.isFinite(computedLevel) ? computedLevel : Number(computed.level);
    }
    hint = pickString(computed?.last_hint?.text, '');
    if (!nextAction) {
      nextAction = computed.next_hint_available
        ? 'Request the next hint if still stuck.'
        : 'Try solving with this hint.';
    }
  }

  if (!hint) hint = 'Start by stating the given data and the target result.';
  if (level == null || !Number.isFinite(level)) level = 0;
  if (!nextAction) nextAction = 'Try the hint and show the next step.';

  return {
    ...base,
    level,
    hint,
    next_action: nextAction,
  };
}

function normalizeBoardSteps(rawSteps, totalMarks) {
  if (!Array.isArray(rawSteps)) return [];
  const steps = rawSteps
    .map((step) => {
      if (typeof step === 'string') return { line: step, marks: null };
      if (!step || typeof step !== 'object') return null;
      return {
        line: pickString(step.line, step.text || step.step || ''),
        marks: step.marks ?? step.mark ?? step.points ?? step.score ?? null,
      };
    })
    .filter((step) => step && String(step.line || '').trim());

  if (!steps.length) return [];
  const marksTotal = Number.isFinite(totalMarks) && totalMarks > 0 ? totalMarks : 0;
  const perStep = marksTotal > 0 ? Number((marksTotal / steps.length).toFixed(1)) : 1;
  let remaining = marksTotal > 0 ? marksTotal : steps.length;
  return steps.map((step, idx) => {
    let marks = Number(step.marks);
    if (!Number.isFinite(marks)) {
      if (idx === steps.length - 1) {
        marks = Number(remaining.toFixed(1));
      } else {
        marks = perStep;
      }
    }
    remaining = Number((remaining - marks).toFixed(1));
    return { line: String(step.line || '').trim(), marks };
  });
}

function normalizeDeductions(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const reason = pickString(item.reason, item.issue || '');
      const marksLost = Number(item.marks_lost ?? item.marksLost ?? item.marks ?? 0);
      if (!reason) return null;
      return { reason, marks_lost: Number.isFinite(marksLost) ? marksLost : 0 };
    })
    .filter(Boolean);
}

function buildBoardStepsBlock(mode, tutorObj, structuredDraft, payload, attemptLoop) {
  const base = pickBlock(tutorObj, structuredDraft, 'board_steps_ms');
  const totalMarksRaw =
    base.total_marks ??
    structuredDraft?.totalMarks ??
    payload?.totalMarks ??
    payload?.total_marks ??
    payload?.marks;
  const totalMarks = Number.isFinite(Number(totalMarksRaw)) && Number(totalMarksRaw) > 0 ? Number(totalMarksRaw) : 3;

  let steps = Array.isArray(base.steps) ? base.steps : null;
  if ((!steps || !steps.length) && mode === 'board_steps_ms' && Array.isArray(structuredDraft?.steps)) {
    steps = structuredDraft.steps;
  }
  let normalizedSteps = normalizeBoardSteps(steps, totalMarks);
  if (!normalizedSteps.length) {
    normalizedSteps = normalizeBoardSteps(
      [
        { line: 'State the given data and the target result.' },
        { line: 'Apply the correct theorem/criterion with a reason.' },
        { line: 'Conclude with the required statement.' },
      ],
      totalMarks
    );
  }

  const examinerNote = pickString(base.examiner_note, attemptLoop?.bsre?.brief || '');
  const deductions = normalizeDeductions(base.deductions);

  return {
    ...base,
    steps: normalizedSteps,
    total_marks: totalMarks,
    deductions,
    examiner_note: examinerNote,
  };
}

function buildNextBlock(tutorObj, structuredDraft, payload, attemptLoop, attemptText) {
  const base = pickBlock(tutorObj, structuredDraft, 'next');
  const status = String(attemptLoop?.diagnosis?.status || '').toLowerCase() || 'unclear';
  const mistakeTags = normalizeStringList(attemptLoop?.diagnosis?.mistake_tags);
  const rubric =
    attemptLoop?.rubric ||
    scoreRubric({
      status,
      mistakeTags,
      attemptText: attemptText || '',
      theoremFocus: payload?.theoremFocus,
    });

  const microDrill = pickString(
    base.micro_drill,
    rubric?.recommended_next?.micro_drill_prompt ||
      'State the criterion and write one proportionality step.'
  );
  const revisionHook = pickString(
    base.revision_hook,
    rubric?.recommended_next?.focus_skill
      ? `Review ${rubric.recommended_next.focus_skill} with 2 quick examples.`
      : 'Review the key criterion and correspondence once more.'
  );
  let suggestedPracticeIds = base.suggested_practice_ids;
  if (!Array.isArray(suggestedPracticeIds)) {
    const alt = payload?.suggestedPracticeIds || payload?.suggested_practice_ids;
    if (Array.isArray(alt)) suggestedPracticeIds = alt;
  }

  const nextBlock = {
    ...base,
    micro_drill: microDrill,
    revision_hook: revisionHook,
  };
  if (Array.isArray(suggestedPracticeIds) && suggestedPracticeIds.length) {
    nextBlock.suggested_practice_ids = suggestedPracticeIds;
  }
  return nextBlock;
}

function orchestrateTutorResponse({ mode, payload, messages, structuredDraft }) {
  if (!structuredDraft || typeof structuredDraft !== 'object') return structuredDraft;
  const base = {
    ...structuredDraft,
    kind: structuredDraft.kind ?? 'tutor',
    finalAnswer: structuredDraft.finalAnswer ?? '',
  };
  let tutorObj = structuredDraft.tutor;
  if (typeof tutorObj === 'string') tutorObj = { text: tutorObj };
  if (Array.isArray(tutorObj)) tutorObj = { items: tutorObj };
  if (!tutorObj || typeof tutorObj !== 'object') tutorObj = {};

  const attemptLoop =
    structuredDraft.attempt_loop || structuredDraft.attemptLoop || tutorObj.attempt_loop || tutorObj.attemptLoop || null;
  const attemptText = extractAttemptText(payload, messages, attemptLoop);

  tutorObj.diagnosis = buildDiagnosisBlock(tutorObj, structuredDraft, attemptLoop);
  tutorObj.socratic = buildSocraticBlock(mode, tutorObj, structuredDraft, attemptLoop);
  tutorObj.hint_ladder = buildHintLadderBlock(payload, tutorObj, structuredDraft, attemptLoop, attemptText);
  tutorObj.board_steps_ms = buildBoardStepsBlock(mode, tutorObj, structuredDraft, payload, attemptLoop);
  tutorObj.next = buildNextBlock(tutorObj, structuredDraft, payload, attemptLoop, attemptText);

  return { ...base, tutor: tutorObj };
}

module.exports = {
  orchestrateTutorResponse,
};
