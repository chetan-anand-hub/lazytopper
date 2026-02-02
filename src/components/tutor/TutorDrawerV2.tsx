import { useCallback, useEffect, useRef, useState } from "react";
import { DiagramBlock } from "../DiagramBlock";
import { MENTOR_ENDPOINT } from "../../ai/aiClient";
import { extractDiagramMeta, validateTutorStructured } from "../../contracts/tutorContracts.ts";
import { getHintVariant } from "../../services/abFlags";
import { logActivity } from "../../services/sessionLogger";
import { HumanGradeCoachView } from "../mentor/HumanGradeCoachView";
import { isRecord } from "../../types/mentor";
import type { MentorDiagramSpec, MentorStructured, TutorBlock } from "../../types/mentor";

type ModeKey = "zombie" | "beast";
type TutorTab = "teach" | "examples";

const getTutorObject = (structured?: MentorStructured | null): TutorBlock | null => {
  const tutor = structured?.tutor;
  if (tutor && typeof tutor === "object" && !Array.isArray(tutor)) return tutor;
  return null;
};

const getTutorText = (structured?: MentorStructured | null) => {
  const tutor = structured?.tutor;
  if (typeof tutor === "string") return tutor;
  if (isRecord(tutor)) {
    const text = typeof tutor.text === "string" ? tutor.text : "";
    const rawText = typeof tutor.rawText === "string" ? tutor.rawText : "";
    return text || rawText || "";
  }
  return "";
};

const asString = (v: unknown): string => (typeof v === "string" ? v : "");
const getErrorName = (err: unknown): string =>
  isRecord(err) && typeof err.name === "string" ? err.name : "";
const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message) return err.message;
  if (isRecord(err) && typeof err.message === "string") return err.message;
  return fallback;
};
const safeJsonParse = (raw: string): unknown | null => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
const getResponseError = (payload: unknown, fallback: string) => {
  if (!isRecord(payload)) return fallback;
  if (typeof payload.error === "string") return payload.error;
  if (typeof payload.message === "string") return payload.message;
  return fallback;
};
const getResponseStructured = (payload: unknown): MentorStructured | null => {
  if (!isRecord(payload)) return null;
  const dataBlock = isRecord(payload.data) ? payload.data : null;
  const structuredCandidate = dataBlock?.structured;
  const textFallback = dataBlock?.text;
  const parsed = structuredCandidate ?? safeJsonParse(String(textFallback ?? ""));
  return (parsed ?? null) as MentorStructured | null;
};
const getResponseText = (payload: unknown): string => {
  if (!isRecord(payload)) return "";
  const dataBlock = isRecord(payload.data) ? payload.data : null;
  return dataBlock && typeof dataBlock.text === "string" ? dataBlock.text : "";
};

type TutorResponseEntry = {
  structured?: MentorStructured;
  diagramType?: string;
  diagramLabels?: Record<string, string> | string[] | null;
  diagramSpec?: MentorDiagramSpec | null;
  responseId?: string;
  summary?: string;
};
export default function TutorDrawerV2(props: {
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

  const [responses, setResponses] = useState<Record<string, TutorResponseEntry>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [doubtInput, setDoubtInput] = useState("");
  const [doubtAnswer, setDoubtAnswer] = useState<string | null>(null);
  const [doubtError, setDoubtError] = useState<string | null>(null);
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [feedbackChoice, setFeedbackChoice] = useState<"yes" | "no" | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [coachHintLevel, setCoachHintLevel] = useState(1);
  const [coachHintLoading, setCoachHintLoading] = useState(false);
  const [coachHintWarning, setCoachHintWarning] = useState<string | null>(null);
  const [coachHintFallback, setCoachHintFallback] = useState(false);
  const [hintVariant] = useState(() => getHintVariant());
  const isDev = Boolean(import.meta?.env?.DEV);
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



  const formatDoubtStructured = (obj: unknown) => {
    if (!isRecord(obj)) return "";
    const tutorText = getTutorText(obj as MentorStructured);
    if (tutorText) return tutorText;
    const kind = asString(obj.kind);
    if (kind === "learn_mindmap") {
      const bullets = Array.isArray(obj.conceptBullets) ? obj.conceptBullets.slice(0, 4) : [];
      const examLines = Array.isArray(obj.examLines) ? obj.examLines.slice(0, 2) : [];
      const lines = [];
      bullets.forEach((b) => lines.push(`- ${String(b)}`));
      examLines.forEach((l, idx: number) => lines.push(`Exam line ${idx + 1}: ${String(l)}`));
      if (obj.checkQuestion) lines.push(`Quick check: ${String(obj.checkQuestion)}`);
      return lines.join("\n");
    }
    if (kind === "learn_teach") {
      const teach = isRecord(obj.teach) ? obj.teach : {};
      const simple = Array.isArray(teach.simpleExplanation) ? teach.simpleExplanation.slice(0, 4) : [];
      const exam = Array.isArray(teach.cbseExamSentence) ? teach.cbseExamSentence.slice(0, 2) : [];
      const lines = [];
      simple.forEach((b) => lines.push(`- ${String(b)}`));
      exam.forEach((l) => lines.push(`Exam line: ${String(l)}`));
      if (obj.checkQuestion) lines.push(`Quick check: ${String(obj.checkQuestion)}`);
      return lines.join("\n");
    }
    return "";
  };

  const logHintEvent = (event: string, level: number) => {
    try {
      logActivity({
        type: "mentor",
        topicKey,
        questionIds: [event, hintVariant],
        score: level,
      });
    } catch {
      // Ignore logging failures.
    }
    if (isDev) {
      console.log("hint_event", { event, level, variant: hintVariant });
    }
  };


  const buildPayload = useCallback(
    (
      nextTab: TutorTab,
      doubtContext?: Record<string, unknown>,
      prompt?: string,
      requestNextHint?: boolean,
      hintLadderState?: unknown,
      hintLevel?: number
    ) => {
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
          requestNextHint,
          hintLadderState,
          hintLevel,
        },
        messages: prompt ? [{ role: "user", content: prompt }] : undefined,
      };
    },
    [
      subjectTitle,
      grade,
      topicKey,
      nodeTitle,
      nodeId,
      nodeText,
      coreId,
      coreText,
      nodeIndex,
      mode,
    ]
  );

  const requestTutor = useCallback(
    async (nextTab: TutorTab, opts?: { force?: boolean; prompt?: string; requestNextHint?: boolean }) => {
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
        const priorStructured = responses[key]?.structured;
        const attemptLoop = isRecord(priorStructured) ? priorStructured.attempt_loop : undefined;
        const hintLadderState =
          opts?.requestNextHint && isRecord(attemptLoop) ? attemptLoop.hint_ladder : undefined;
        const body = buildPayload(nextTab, undefined, opts?.prompt, opts?.requestNextHint, hintLadderState);
        const res = await fetch(MENTOR_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(getResponseError(data, "Mentor request failed."));

        const nextStructured = getResponseStructured(data);
        if (!nextStructured) throw new Error("Mentor response incomplete. Please retry.");

        const modeApi = nextTab === "teach" ? "learn_mindmap" : "learn_teach";
        const meta = extractDiagramMeta(nextStructured);
        const tutorObj = getTutorObject(nextStructured);
        const check = tutorObj ? { ok: true, issues: [] } : validateTutorStructured(modeApi, nextStructured, body.payload);
        if (!check.ok) {
          const msg = check.issues[0] || "Mentor response incomplete. Please retry.";
          setErrors((prev) => ({ ...prev, [key]: msg }));
          return;
        }

        setResponses((prev) => ({
          ...prev,
          [key]: {
            structured: nextStructured,
            diagramType: meta.diagramType,
            diagramLabels: meta.diagramLabels as Record<string, string> | string[] | null,
            diagramSpec: meta.diagramSpec as MentorDiagramSpec | null,
            responseId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            summary: JSON.stringify(nextStructured).slice(0, 280),
          },
        }));
      } catch (err) {
        if (getErrorName(err) === "AbortError") return;
        setErrors((prev) => ({
          ...prev,
          [key]: getErrorMessage(err, "Mentor error. Please retry."),
        }));
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
      buildPayload,
    ]
  );

  const refreshCoachHint = async (targetLevel: number) => {
    if (!open || !nodeId || coachHintLoading) return;
    setCoachHintLoading(true);
    setCoachHintWarning(null);

    const prompt = `Give me hint level ${targetLevel} only (keep it short).`;
    const body = buildPayload(tab, undefined, prompt, true, undefined, targetLevel);

    try {
      const res = await fetch(MENTOR_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(getResponseError(data, "Mentor request failed."));

      const structured = getResponseStructured(data);
      if (!structured) throw new Error("Mentor response incomplete. Please retry.");

      const meta = extractDiagramMeta(structured);
      setResponses((prev) => ({
        ...prev,
        [currentKey]: {
          ...(prev[currentKey] || {}),
          structured,
          diagramType: meta.diagramType,
          diagramLabels: meta.diagramLabels as Record<string, string> | string[] | null,
          diagramSpec: meta.diagramSpec as MentorDiagramSpec | null,
          responseId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          summary: JSON.stringify(structured).slice(0, 280),
        },
      }));
      setCoachHintLevel(Math.min(3, targetLevel));
      setCoachHintFallback(false);
      logHintEvent("hint_level_reached", targetLevel);
    } catch {
      setCoachHintWarning("Hint refresh failed; showing local hint.");
      setCoachHintLevel((prev) => Math.min(3, Math.max(prev, targetLevel)));
      setCoachHintFallback(true);
      logHintEvent("hint_refresh_failed", targetLevel);
    } finally {
      setCoachHintLoading(false);
    }
  };


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
        const body = buildPayload(tab, doubtContext, prompt, false, undefined);
        const res = await fetch(MENTOR_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(getResponseError(data, "Mentor request failed."));

        const structured = getResponseStructured(data);
        const formatted = structured ? formatDoubtStructured(structured) : String(getResponseText(data) || "");
        setDoubtAnswer(formatted || "Mentor reply received.");
        setDoubtInput("");
      } catch (err) {
        setDoubtError(getErrorMessage(err, "Mentor error. Please retry."));
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
    setFeedbackChoice(null);
    setFeedbackText("");
    setFeedbackStatus("idle");
    setFeedbackMessage(null);
    setCoachHintWarning(null);
    setCoachHintLoading(false);
    setCoachHintFallback(false);
  }, [tab, nodeId]);

  useEffect(() => {
    const tutorObj = getTutorObject(currentResponse?.structured);
    const hint = tutorObj?.hint_ladder;
    const hintRecord = isRecord(hint) ? hint : null;
    const base = Number(hintRecord?.level);
    setCoachHintLevel(Number.isFinite(base) ? Math.min(3, base) : 1);
    setCoachHintWarning(null);
    setCoachHintLoading(false);
    setCoachHintFallback(false);
  }, [currentKey, currentResponse]);

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

  const renderAttemptFeedback = (obj: unknown) => {
    const loop = isRecord(obj) ? obj.attempt_loop : undefined;
    if (!isRecord(loop)) return null;
    const hint = loop.hint_ladder;
    const hintRecord = isRecord(hint) ? hint : null;
    const rubric = isRecord(loop.rubric) ? loop.rubric : null;
    const rubricDimensions = isRecord(rubric?.dimensions) ? rubric.dimensions : null;
    const rubricNext = isRecord(rubric?.recommended_next) ? rubric.recommended_next : null;
    const rubricTotal = Number(rubric?.total_score);
    const rubricBand = asString(rubric?.band);
    const hintLevelValue = Number(hintRecord?.level);
    const hintMaxValue = Number(hintRecord?.max_level);
    const conceptScore = Number(rubricDimensions?.concept_selection);
    const setupScore = Number(rubricDimensions?.setup_correctness);
    const logicScore = Number(rubricDimensions?.logical_progression);
    const computationScore = Number(rubricDimensions?.computation_accuracy);
    const presentationScore = Number(rubricDimensions?.presentation_exam_style);
    const sources = Array.isArray(loop.sources) ? loop.sources : [];
    const diagnosis = isRecord(loop.diagnosis) ? loop.diagnosis : {};
    const nextAction = isRecord(loop.next_action) ? loop.next_action : {};
    const tags = Array.isArray(diagnosis.mistake_tags)
      ? diagnosis.mistake_tags.slice(0, 3).map((tag) => String(tag))
      : [];
    const verdict = String(diagnosis.status || "unclear").toUpperCase();
    const actionType = String(nextAction.type || "");
    const prompt = String(nextAction.prompt || "");
    const brief = isRecord(loop.bsre) && loop.bsre.brief ? String(loop.bsre.brief) : "";
    return (
      <div style={{ borderRadius: 12, padding: "10px 12px", border: "1px solid rgba(0,0,0,0.08)", background: "rgba(56,189,248,0.10)" }}>
        <div style={{ fontWeight: 800 }}>Attempt Feedback</div>
        <div style={{ marginTop: 6 }}>Diagnosis: <b>{verdict}</b></div>
        {tags.length ? (
          <div style={{ marginTop: 6, fontSize: 12 }}>Mistake tags: {tags.join(", ")}</div>
        ) : null}
        {actionType || prompt ? (
          <div style={{ marginTop: 6 }}><b>{actionType || "Next"}:</b> {prompt}</div>
        ) : null}
        {brief ? <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>{brief}</div> : null}
        {hintRecord ? (
          <div style={{ marginTop: 8, fontSize: 12 }}>
            Hint level: <b>{Number.isFinite(hintLevelValue) ? hintLevelValue : ""}</b>/
            {Number.isFinite(hintMaxValue) ? hintMaxValue : ""}
          </div>
        ) : null}
        {isRecord(hintRecord?.last_hint) && hintRecord.last_hint.text ? (
          <div style={{ marginTop: 6, fontSize: 12 }}>{String(hintRecord.last_hint.text)}</div>
        ) : null}
        {hintRecord?.next_hint_available ? (
          <button
            type="button"
            className="pill"
            style={{ marginTop: 8 }}
            onClick={() => requestTutor(tab, { force: true, requestNextHint: true })}
          >
            Get next hint
          </button>
        ) : null}
        {rubric ? (
          <div style={{ marginTop: 10, fontSize: 12, borderTop: '1px dashed rgba(0,0,0,0.12)', paddingTop: 8 }}>
            {sources.length ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 800 }}>Sources</div>
                {sources.map((s, idx: number) => (
                  <div key={idx} style={{ marginTop: 6 }}>
                    <div>
                      <b>{isRecord(s) ? String(s.title || "") : ""}</b>{" "}
                      <span style={{ opacity: 0.7 }}>({isRecord(s) ? String(s.path || "") : ""})</span>
                    </div>
                    <div style={{ opacity: 0.8 }}>{isRecord(s) ? String(s.excerpt || "") : ""}</div>
                  </div>
                ))}
              </div>
            ) : null}
            <div><b>Score:</b> {Number.isFinite(rubricTotal) ? rubricTotal : 0}/100 ({rubricBand})</div>
            <div style={{ marginTop: 4 }}>
              Concept: {Number.isFinite(conceptScore) ? conceptScore : ""}/25 | Setup: {Number.isFinite(setupScore) ? setupScore : ""}/20 | Logic: {Number.isFinite(logicScore) ? logicScore : ""}/25
            </div>
            <div style={{ marginTop: 2 }}>
              Computation: {Number.isFinite(computationScore) ? computationScore : ""}/20 | Presentation: {Number.isFinite(presentationScore) ? presentationScore : ""}/10
            </div>
            {rubricNext ? (
              <div style={{ marginTop: 4 }}><b>Next focus:</b> {String(rubricNext.focus_skill || "")}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  const buildCoachViewProps = (obj?: MentorStructured | null) => {
    const tutorObj = getTutorObject(obj);
    if (!tutorObj) return null;

    const hint = tutorObj.hint_ladder;
    const hintRecord = isRecord(hint) ? hint : null;
    const hints = Array.isArray(hintRecord?.hints) ? hintRecord.hints : [];
    const baseLevel = Number.isFinite(Number(hintRecord?.level)) ? Number(hintRecord?.level) : 1;
    const maxHintLevel = hints.length ? Math.min(3, hints.length) : 3;
    const displayLevel = Math.min(maxHintLevel, coachHintLevel || baseLevel);
    const hintTextRaw = typeof hintRecord?.hint === "string" ? hintRecord.hint : "";
    const hintFromList = hints.length ? String(hints[Math.max(0, displayLevel - 1)] || "") : "";
    const effectiveVariant =
      hintVariant === "C_REFRESH" && coachHintFallback ? "B_LOCAL" : hintVariant;
    const displayHint =
      effectiveVariant === "B_LOCAL" && hints.length
        ? hintFromList
        : hintTextRaw || hintFromList;
    const showSingleHintNote =
      effectiveVariant === "B_LOCAL" && !hints.length && Boolean(hintTextRaw);
    const canAdvance =
      effectiveVariant === "C_REFRESH"
        ? displayLevel < 3 && !coachHintLoading
        : hints.length > 1 && displayLevel < maxHintLevel;

    const coachTutorObj = hintRecord
      ? {
          ...tutorObj,
          hint_ladder: {
            ...hintRecord,
            hint: displayHint,
            _warning: coachHintWarning,
            _busy: coachHintLoading,
            _single_hint_note: showSingleHintNote,
            _can_advance: canAdvance,
          },
        }
      : tutorObj;

    const onNextHint = hintRecord
      ? () => {
          const nextLevel = Math.min(maxHintLevel, displayLevel + 1);
          logHintEvent("next_hint_clicked", nextLevel);
          if (effectiveVariant === "C_REFRESH") {
            void refreshCoachHint(nextLevel);
          } else if (hints.length > 1) {
            setCoachHintLevel(nextLevel);
            logHintEvent("hint_level_reached", nextLevel);
          }
        }
      : undefined;

    return {
      tutorObj: coachTutorObj,
      hintLevel: displayLevel,
      onNextHint,
      variantLabel: isDev ? hintVariant : undefined,
      compact: false,
    };
  };


  const renderTeach = () => {
    const response = currentResponse;
    if (!response || !response.structured) return null;
    const obj = response.structured;
    const tutorText = getTutorText(obj);
    const coachProps = buildCoachViewProps(obj);
    const bullets = Array.isArray(obj.conceptBullets) ? obj.conceptBullets : [];
    const examLines = Array.isArray(obj.examLines) ? obj.examLines : [];
    const worked = isRecord(obj.workedExample) ? obj.workedExample : {};
    const steps = Array.isArray(worked.steps) ? worked.steps : [];
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <DiagramBlock
          diagramType={response.diagramType}
          diagramLabels={response.diagramLabels}
          diagramSpec={response.diagramSpec}
          note="CBSE diagram block"
        />
        {tutorText ? (
          <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(0,0,0,0.04)" }}>
            {String(tutorText)}
          </div>
        ) : null}
        {coachProps ? <HumanGradeCoachView {...coachProps} /> : null}
        {renderAttemptFeedback(obj)}
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Concept bullets</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {bullets.map((b, idx: number) => (
              <li key={idx} style={{ marginBottom: 6 }}>{String(b)}</li>
            ))}
          </ul>
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Exam lines</div>
          {examLines.map((l, idx: number) => (
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
              {steps.map((s, idx: number) => (
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
    const response = currentResponse;
    if (!response || !response.structured) return null;
    const obj = response.structured;
    const tutorText = getTutorText(obj);
    const coachProps = buildCoachViewProps(obj);
    const teach = isRecord(obj.teach) ? obj.teach : {};
    const simple = Array.isArray(teach.simpleExplanation) ? teach.simpleExplanation : [];
    const exam = Array.isArray(teach.cbseExamSentence) ? teach.cbseExamSentence : [];
    const worked = Array.isArray(obj.workedExamples) ? obj.workedExamples : [];
    const mistakes = Array.isArray(obj.commonMistakes) ? obj.commonMistakes : [];
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <DiagramBlock
          diagramType={response.diagramType}
          diagramLabels={response.diagramLabels}
          diagramSpec={response.diagramSpec}
          note="CBSE diagram block"
        />
        {tutorText ? (
          <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(0,0,0,0.04)" }}>
            {String(tutorText)}
          </div>
        ) : null}
        {coachProps ? <HumanGradeCoachView {...coachProps} /> : null}
        {renderAttemptFeedback(obj)}
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Teach bullets</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {simple.map((b, idx: number) => (
              <li key={idx} style={{ marginBottom: 6 }}>{String(b)}</li>
            ))}
          </ul>
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Exam line</div>
          {exam.map((l, idx: number) => (
            <div key={idx} style={{ marginBottom: 6, padding: "6px 8px", borderRadius: 10, background: "rgba(0,0,0,0.04)" }}>
              {String(l)}
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Worked examples (2)</div>
          {worked.map((ex, exIdx: number) => {
            const exRecord = isRecord(ex) ? ex : {};
            const steps = Array.isArray(exRecord.steps) ? exRecord.steps : [];
            const sumMarks = steps.reduce((acc: number, s) => acc + (isRecord(s) ? Number(s.marks) || 0 : 0), 0);
            const total = Number(exRecord.totalMarks);
            return (
              <div key={exIdx} style={{ borderRadius: 12, padding: "10px 12px", border: "1px solid rgba(0,0,0,0.08)", marginBottom: 10 }}>
                <div style={{ fontWeight: 800 }}>
                  {exIdx === 0 ? "Example 1: Basic" : "Example 2: Board-style"}
                </div>
                {exRecord.question ? <div style={{ marginTop: 6 }}>{String(exRecord.question)}</div> : null}
                {steps.length ? (
                  <ol style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                    {steps.map((s, idx: number) => (
                      <li key={idx} style={{ marginBottom: 6 }}>
                        <b>[{isRecord(s) ? Number(s.marks) || 0 : 0}]</b> {isRecord(s) ? String(s.text || "") : ""}
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
                {exRecord.finalAnswer ? (
                  <div style={{ marginTop: 6, fontWeight: 700 }}>Final: {String(exRecord.finalAnswer)}</div>
                ) : null}
              </div>
            );
          })}
        </div>
        {mistakes.length ? (
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Common mistakes</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {mistakes.map((m, idx: number) => (
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
          You're learning: <b>{nodeTitle}</b> - Step {nodeIndex + 1} of {Math.max(1, order.length)}
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

        <div style={{ marginTop: 12, borderRadius: 12, padding: "10px 12px", background: "rgba(0,0,0,0.03)" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Was this helpful?</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="pill"
              onClick={() => setFeedbackChoice("yes")}
              style={{ background: feedbackChoice === "yes" ? "rgba(34,197,94,0.15)" : "white" }}
            >
              Yes
            </button>
            <button
              type="button"
              className="pill"
              onClick={() => setFeedbackChoice("no")}
              style={{ background: feedbackChoice === "no" ? "rgba(239,68,68,0.15)" : "white" }}
            >
              No
            </button>
          </div>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Optional feedback (what helped / what was missing)"
            rows={3}
            style={{
              marginTop: 8,
              width: "100%",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              padding: "8px 10px",
              fontSize: 13,
              resize: "vertical",
              background: "white",
            }}
          />
          <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="pill"
              disabled={!feedbackChoice || feedbackStatus === "sending"}
              onClick={async () => {
                if (!feedbackChoice) return;
                setFeedbackStatus("sending");
                setFeedbackMessage(null);
                try {
                  const payload = {
                    helpful: feedbackChoice === "yes",
                    comment: feedbackText,
                    topicKey,
                    nodeId,
                    responseId: currentResponse?.responseId || null,
                    tab,
                    mode,
                    grade,
                    subject: subjectTitle,
                    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
                    clientTs: new Date().toISOString(),
                  };
                  const res = await fetch("/api/tutor-feedback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(getResponseError(data, "Feedback failed."));
                  setFeedbackStatus("success");
                  setFeedbackMessage("Thanks! Your feedback was saved.");
                } catch (err) {
                  setFeedbackStatus("error");
                  setFeedbackMessage(getErrorMessage(err, "Could not save feedback."));
                }
              }}
            >
              {feedbackStatus === "sending" ? "Submitting..." : "Submit"}
            </button>
            {feedbackMessage ? (
              <div style={{ fontSize: 12, color: feedbackStatus === "error" ? "#b91c1c" : "#166534" }}>
                {feedbackMessage}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}




