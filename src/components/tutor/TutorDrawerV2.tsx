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
export type TutorMasteryState =
  | "unseen"
  | "learning"
  | "checkpoint_passed"
  | "needs_practice"
  | "mastered";

export type TutorNodeProgress = {
  nodeId: string;
  tab: TutorTab;
  masteryState: TutorMasteryState;
  score?: number;
  band?: string;
  status?: string;
  source: "attempt_loop";
};

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
const parseResponsePayload = async (res: Response): Promise<unknown> => {
  const raw = await res.text();
  const trimmed = String(raw || "").trim();
  if (!trimmed) return {};
  const parsed = safeJsonParse(trimmed);
  if (parsed !== null) return parsed;
  return {
    data: { text: trimmed },
    message: trimmed,
  };
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
const MENTOR_REQUEST_TIMEOUT_MS = 30_000;
const fetchMentorPayload = async (
  body: unknown,
  externalSignal?: AbortSignal
): Promise<{ res: Response; data: unknown }> => {
  const controller = new AbortController();
  let timedOut = false;
  const relayAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", relayAbort, { once: true });
    }
  }
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, MENTOR_REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(MENTOR_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await parseResponsePayload(res);
    return { res, data };
  } catch (err) {
    if (timedOut && getErrorName(err) === "AbortError") {
      throw new Error("Mentor request timed out. Please retry.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", relayAbort);
    }
  }
};
const toTutorErrorMessage = (err: unknown, fallback: string): string => {
  const msg = getErrorMessage(err, fallback);
  if (/timed out|timeout/i.test(msg)) {
    return "Mentor is taking too long. Please retry.";
  }
  if (/unexpected end of json input/i.test(msg)) return fallback;
  if (/failed to fetch|networkerror|network request failed/i.test(msg)) {
    return "Network issue while contacting mentor. Please retry.";
  }
  return msg;
};

const deriveMasteryState = (status: string, score: number): TutorMasteryState => {
  const norm = String(status || "").toLowerCase();
  if (norm === "correct" || (Number.isFinite(score) && score >= 70)) return "mastered";
  if (norm === "partially_correct" || (Number.isFinite(score) && score >= 50)) {
    return "checkpoint_passed";
  }
  return "needs_practice";
};

const masteryMeta: Record<
  TutorMasteryState,
  { label: string; bg: string; color: string; border: string }
> = {
  unseen: {
    label: "Unseen",
    bg: "rgba(148,163,184,0.16)",
    color: "rgba(30,41,59,0.9)",
    border: "rgba(148,163,184,0.35)",
  },
  learning: {
    label: "Learning",
    bg: "rgba(59,130,246,0.12)",
    color: "rgba(30,64,175,0.95)",
    border: "rgba(59,130,246,0.35)",
  },
  checkpoint_passed: {
    label: "Checkpoint Passed",
    bg: "rgba(14,165,233,0.12)",
    color: "rgba(12,74,110,0.95)",
    border: "rgba(14,165,233,0.35)",
  },
  needs_practice: {
    label: "Needs Practice",
    bg: "rgba(245,158,11,0.16)",
    color: "rgba(146,64,14,0.95)",
    border: "rgba(245,158,11,0.40)",
  },
  mastered: {
    label: "Mastered",
    bg: "rgba(34,197,94,0.14)",
    color: "rgba(20,83,45,0.95)",
    border: "rgba(34,197,94,0.38)",
  },
};

type TutorResponseEntry = {
  structured?: MentorStructured;
  diagramType?: string;
  diagramLabels?: Record<string, string> | string[] | null;
  diagramSpec?: MentorDiagramSpec | null;
  responseId?: string;
  summary?: string;
};
type TutorChatTurn = {
  role: "user" | "assistant";
  text: string;
};
type TutorDrawerProps = {
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
  nodeMasteryState?: TutorMasteryState;
  onNodeProgress?: (progress: TutorNodeProgress) => void;
  onPracticeThisNode?: (nodeId: string) => void;
};

export default function TutorDrawerV2(props: TutorDrawerProps) {
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
    nodeMasteryState = "unseen",
    onNodeProgress,
    onPracticeThisNode,
  } = props;

  const [responses, setResponses] = useState<Record<string, TutorResponseEntry>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [doubtInput, setDoubtInput] = useState("");
  const [doubtError, setDoubtError] = useState<string | null>(null);
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [chatTurns, setChatTurns] = useState<TutorChatTurn[]>([]);
  const [showLessonPack, setShowLessonPack] = useState(true);
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [feedbackChoice, setFeedbackChoice] = useState<"yes" | "no" | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [coachHintLevel, setCoachHintLevel] = useState(1);
  const [coachHintLoading, setCoachHintLoading] = useState(false);
  const [coachHintWarning, setCoachHintWarning] = useState<string | null>(null);
  const [coachHintFallback, setCoachHintFallback] = useState(false);
  const [showSoftGateWarning, setShowSoftGateWarning] = useState(false);
  const [hintVariant] = useState(() => getHintVariant());
  const isDev = Boolean(import.meta?.env?.DEV);
  const abortRef = useRef<AbortController | null>(null);
  const doubtInputRef = useRef<HTMLInputElement | null>(null);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const lastProgressRef = useRef<string>("");

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
  const canAdvanceWithoutWarning =
    nodeMasteryState === "checkpoint_passed" || nodeMasteryState === "mastered";

  useEffect(() => {
    if (!nodeId || !onNodeProgress) return;
    const structured = currentResponse?.structured;
    if (!isRecord(structured)) return;
    const loop = isRecord(structured.attempt_loop) ? structured.attempt_loop : null;
    if (!loop) return;
    const diagnosis = isRecord(loop.diagnosis) ? loop.diagnosis : null;
    const rubric = isRecord(loop.rubric) ? loop.rubric : null;
    const status = asString(diagnosis?.status);
    const scoreRaw = Number(rubric?.total_score);
    const score = Number.isFinite(scoreRaw) ? scoreRaw : Number.NaN;
    const band = asString(rubric?.band);
    const masteryState = deriveMasteryState(status, score);
    const dedupeKey = [
      nodeId,
      tab,
      masteryState,
      Number.isFinite(score) ? String(score) : "",
      status,
      band,
    ].join("|");
    if (lastProgressRef.current === dedupeKey) return;
    lastProgressRef.current = dedupeKey;
    onNodeProgress({
      nodeId,
      tab,
      masteryState,
      score: Number.isFinite(score) ? score : undefined,
      band: band || undefined,
      status: status || undefined,
      source: "attempt_loop",
    });
  }, [nodeId, tab, currentResponse, onNodeProgress]);

  const cancelInFlight = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoadingKey(null);
  }, []);



  const formatDoubtStructured = (obj: unknown) => {
    if (!isRecord(obj)) return "";
    const tutorObj = getTutorObject(obj as MentorStructured);
    const attemptLoop = isRecord(tutorObj?.attempt_loop) ? tutorObj.attempt_loop : null;
    if (attemptLoop) {
      const diagnosis = isRecord(attemptLoop.diagnosis) ? attemptLoop.diagnosis : null;
      const nextAction = isRecord(attemptLoop.next_action) ? attemptLoop.next_action : null;
      const hintLadder = isRecord(attemptLoop.hint_ladder) ? attemptLoop.hint_ladder : null;
      const rubric = isRecord(attemptLoop.rubric) ? attemptLoop.rubric : null;
      const statusRaw = asString(diagnosis?.status);
      const status =
        statusRaw
          ? statusRaw
              .split("_")
              .filter(Boolean)
              .join(" ")
          : "";
      const misconception = asString(diagnosis?.misconception_summary);
      const nextPrompt = asString(nextAction?.prompt);
      const hintText =
        asString(hintLadder?.hint) ||
        (isRecord(hintLadder?.last_hint) ? asString(hintLadder.last_hint.text) : "");
      const score = Number(rubric?.total_score);
      const lines: string[] = [];
      if (status) lines.push(`Checkpoint verdict: ${status}.`);
      if (misconception) lines.push(`Issue spotted: ${misconception}`);
      if (nextPrompt) lines.push(`Next step: ${nextPrompt}`);
      if (hintText) lines.push(`Hint: ${hintText}`);
      if (Number.isFinite(score)) lines.push(`Score now: ${score}/100.`);
      if (lines.length) return lines.join("\n");
    }
    if (isRecord(tutorObj?.socratic) && asString(tutorObj.socratic.response)) {
      return asString(tutorObj.socratic.response);
    }
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
      const keyIdeas = Array.isArray(teach.keyIdeas)
        ? teach.keyIdeas.slice(0, 4)
        : Array.isArray(teach.simpleExplanation)
          ? teach.simpleExplanation.slice(0, 4)
          : [];
      const exam = Array.isArray(teach.cbseExamSentence)
        ? teach.cbseExamSentence.slice(0, 2)
        : Array.isArray(teach.examLines)
          ? teach.examLines.slice(0, 2)
          : [];
      const checkpoint = isRecord(obj.checkpoint) ? obj.checkpoint : isRecord(teach.checkpoint) ? teach.checkpoint : {};
      const lines = [];
      keyIdeas.forEach((b) => lines.push(`- ${String(b)}`));
      exam.forEach((l) => lines.push(`Exam line: ${String(l)}`));
      if (checkpoint.question) lines.push(`Quick check: ${String(checkpoint.question)}`);
      else if (obj.checkQuestion) lines.push(`Quick check: ${String(obj.checkQuestion)}`);
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
      const modeApi = "learn_teach";
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
          subSection: nextTab === "teach" ? "teach" : "board-examples",
          selectedTab: nextTab,
          selectedMode: modeApi,
          mindmapNodeId: nodeId,
          mindmapNodeTitle: nodeTitle,
          mindmapNodeText: nodeText,
          mindmapCoreId: coreId,
          explainType: nextTab === "teach" ? "teach_contract" : "board_examples",
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
        const { res, data } = await fetchMentorPayload(body, controller.signal);
        const nextStructured = getResponseStructured(data);
        const rateLimitedWithFallback = res.status === 429 && Boolean(nextStructured);
        if (!res.ok && !rateLimitedWithFallback) {
          throw new Error(getResponseError(data, "Mentor request failed."));
        }
        if (!nextStructured) throw new Error("Mentor response incomplete. Please retry.");

        const modeApi = "learn_teach";
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
          [key]: toTutorErrorMessage(err, "Mentor error. Please retry."),
        }));
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setLoadingKey((prev) => (prev === key ? null : prev));
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
      const { res, data } = await fetchMentorPayload(body);
      const structured = getResponseStructured(data);
      const rateLimitedWithFallback = res.status === 429 && Boolean(structured);
      if (!res.ok && !rateLimitedWithFallback) {
        throw new Error(getResponseError(data, "Mentor request failed."));
      }
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
      const promptTrimmed = String(prompt || "").trim();
      if (!promptTrimmed || doubtLoading || !nodeId) return;
      setDoubtError(null);
      setShowLessonPack(false);
      setChatTurns((prev) => [...prev, { role: "user", text: promptTrimmed }]);
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
        const mentorPrompt = promptTrimmed;
        const body = buildPayload(tab, doubtContext, mentorPrompt, false, undefined);
        const { res, data } = await fetchMentorPayload(body);
        const structured = getResponseStructured(data);
        const rateLimitedWithFallback = res.status === 429 && Boolean(structured);
        if (!res.ok && !rateLimitedWithFallback) {
          throw new Error(getResponseError(data, "Mentor request failed."));
        }
        if (structured && currentKey) {
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
        }
        const formatted = structured ? formatDoubtStructured(structured) : String(getResponseText(data) || "");
        const finalAnswer = String(formatted || "").trim()
          ? String(formatted).trim()
          : "I could not generate a clear reply yet. Try: Explain AA similarity with one solved example.";
        setChatTurns((prev) => [...prev, { role: "assistant", text: finalAnswer }]);
        setDoubtInput("");
      } catch (err) {
        setDoubtError(toTutorErrorMessage(err, "Mentor error. Please retry."));
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
      currentKey,
    ]
  );

  useEffect(() => {
    if (!open) {
      cancelInFlight();
      setDoubtInput("");
      setDoubtError(null);
      setChatTurns([]);
      return;
    }
    if (!nodeId) return;
    if (currentError) return;
    if (!currentResponse && !isLoading) {
      requestTutor(tab);
    }
  }, [open, nodeId, tab, currentResponse, currentError, isLoading, requestTutor, cancelInFlight]);

  useEffect(() => {
    setDoubtError(null);
    setDoubtInput("");
    setChatTurns([]);
    setShowLessonPack(true);
    setShowSoftGateWarning(false);
    setShowFeedbackPanel(false);
    setFeedbackChoice(null);
    setFeedbackText("");
    setFeedbackStatus("idle");
    setFeedbackMessage(null);
    setCoachHintWarning(null);
    setCoachHintLoading(false);
    setCoachHintFallback(false);
    lastProgressRef.current = "";
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

  useEffect(() => {
    if (!open || tab !== "teach") return;
    const el = contentScrollRef.current;
    if (!el) return;
    const id = window.setTimeout(() => {
      el.scrollTop = el.scrollHeight;
    }, 0);
    return () => window.clearTimeout(id);
  }, [open, tab, nodeId, chatTurns, doubtLoading, showLessonPack]);

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
    setShowSoftGateWarning(false);
    setNodeIndex(idx);
  };

  const handleNextConcept = (force = false) => {
    const next = Math.min(nodeIndex + 1, Math.max(0, order.length - 1));
    if (!force && !canAdvanceWithoutWarning) {
      setShowSoftGateWarning(true);
      return;
    }
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

  const normalizeWorkedSteps = (
    raw: unknown,
    fallbackFromBoard: Array<{ text: string; marks?: number }>
  ): Array<{ text: string; marks?: number }> => {
    const fromRaw = Array.isArray(raw)
      ? raw
          .map((step) => {
            if (typeof step === "string") {
              const text = step.trim();
              return text ? { text } : null;
            }
            if (!isRecord(step)) return null;
            const text = String(step.text || step.line || step.statement || "").trim();
            if (!text) return null;
            const marksNum = Number(step.marks ?? step.mark ?? step.points);
            return Number.isFinite(marksNum) ? { text, marks: marksNum } : { text };
          })
          .filter((s): s is { text: string; marks?: number } => Boolean(s))
      : [];
    if (fromRaw.length) return fromRaw;
    if (fallbackFromBoard.length) return fallbackFromBoard;
    return [
      { text: `State the key theorem/criterion for ${nodeTitle}.`, marks: 1 },
      { text: "Write one correct relation with correspondence and conclude.", marks: 1 },
    ];
  };

  const normalizeTeachView = (obj: MentorStructured) => {
    const teach = isRecord(obj.teach) ? obj.teach : {};
    const tutorObj = getTutorObject(obj);
    const board = isRecord(tutorObj?.board_steps_ms) ? tutorObj.board_steps_ms : null;
    const next = isRecord(tutorObj?.next) ? tutorObj.next : null;
    const socratic = isRecord(tutorObj?.socratic) ? tutorObj.socratic : null;
    const diagnosis = isRecord(tutorObj?.diagnosis) ? tutorObj.diagnosis : null;
    const checkpoint =
      isRecord(obj.checkpoint) ? obj.checkpoint : isRecord(teach.checkpoint) ? teach.checkpoint : {};
    const boardSteps = Array.isArray(board?.steps)
      ? board.steps
          .map((step) => {
            if (!isRecord(step)) return null;
            const text = String(step.line || step.text || "").trim();
            if (!text) return null;
            const marksNum = Number(step.marks);
            return Number.isFinite(marksNum) ? { text, marks: marksNum } : { text };
          })
          .filter((s): s is { text: string; marks?: number } => Boolean(s))
      : [];

    const keyIdeasRaw = [
      ...(Array.isArray(obj.conceptBullets) ? obj.conceptBullets : []),
      ...(Array.isArray(teach.conceptBullets) ? teach.conceptBullets : []),
      ...(Array.isArray(teach.keyIdeas) ? teach.keyIdeas : []),
      ...(Array.isArray(teach.simpleExplanation) ? teach.simpleExplanation : []),
    ].map((x) => String(x || "").trim()).filter(Boolean);
    const keyIdeas = keyIdeasRaw.length
      ? keyIdeasRaw
      : [
          `Definition first: identify what ${nodeTitle} means in this question.`,
          "Write the exact criterion/theorem name before using it.",
          "Maintain correspondence order when writing ratios or equal angles.",
        ];

    const examLinesRaw = [
      ...(Array.isArray(obj.examLines) ? obj.examLines : []),
      ...(Array.isArray(teach.examLines) ? teach.examLines : []),
      ...(Array.isArray(teach.cbseExamSentence) ? teach.cbseExamSentence : []),
      ...boardSteps.map((s) => s.text),
    ].map((x) => String(x || "").trim()).filter(Boolean);
    const examLines = examLinesRaw.length
      ? examLinesRaw
      : [
          "CBSE examiner line: state theorem/criterion and correspondence explicitly.",
          "Final line must clearly conclude the required result.",
        ];

    const workedSingle =
      isRecord(obj.workedExample)
        ? obj.workedExample
        : Array.isArray(obj.workedExamples) && isRecord(obj.workedExamples[0])
          ? obj.workedExamples[0]
          : {};
    const workedQuestion =
      String(workedSingle.question || "").trim() ||
      String(next?.micro_drill || "").trim() ||
      `Micro-drill: write two board-style steps for ${nodeTitle}.`;
    const workedSteps = normalizeWorkedSteps(workedSingle.steps, boardSteps);
    const workedFinal =
      String(workedSingle.finalAnswer || "").trim() ||
      String(next?.revision_hook || "").trim() ||
      `Therefore, ${nodeTitle} is established with correct reasoning.`;

    type NormalizedWorkedExample = {
      question: string;
      steps: Array<{ text: string; marks?: number }>;
      totalMarks?: number;
      finalAnswer: string;
    };
    const rawWorkedExamples = Array.isArray(obj.workedExamples) ? obj.workedExamples : [];
    const workedExamples: NormalizedWorkedExample[] = [];
    if (rawWorkedExamples.length > 0) {
      rawWorkedExamples.forEach((entry) => {
        if (!isRecord(entry)) return;
        const steps = normalizeWorkedSteps(entry.steps, boardSteps);
        const totalMarks = Number(entry.totalMarks);
        const sumMarks = steps.reduce((acc, s) => acc + (Number.isFinite(Number(s.marks)) ? Number(s.marks) : 0), 0);
        workedExamples.push({
          question: String(entry.question || workedQuestion),
          steps,
          totalMarks: Number.isFinite(totalMarks) ? totalMarks : sumMarks > 0 ? sumMarks : undefined,
          finalAnswer: String(entry.finalAnswer || workedFinal),
        });
      });
    }
    if (workedExamples.length === 0) {
      workedExamples.push({
        question: workedQuestion,
        steps: workedSteps,
        totalMarks:
          workedSteps.reduce(
            (acc, s) => acc + (Number.isFinite(Number(s.marks)) ? Number(s.marks) : 0),
            0
          ) || undefined,
        finalAnswer: workedFinal,
      });
    }

    const goalLine =
      String(teach.goal || teach.headline || teach.oneLiner || obj.goalLine || "").trim() ||
      `Learn ${nodeTitle} in exam-writing format.`;
    const checkpointQuestion =
      String(checkpoint.question || obj.checkQuestion || socratic?.question || "").trim() ||
      `Quick check: which criterion/theorem applies for ${nodeTitle}?`;
    const checkpointAnswer =
      String(checkpoint.answer || "").trim() ||
      "Expected answer: state the theorem/criterion and the correspondence clearly.";
    const commonMistake =
      String(
        obj.commonMistake ||
          teach.commonMistake ||
          obj.commonError ||
          diagnosis?.misconception_summary ||
          (Array.isArray(obj.commonMistakes) ? obj.commonMistakes[0] : "")
      ).trim() || "Common mistake: skipping theorem name or correspondence order.";
    const commonFix =
      String(obj.commonFix || next?.micro_drill || next?.revision_hook || "").trim() ||
      "Fix: write theorem name, correspondence, and final conclusion line.";

    const boardQuestion =
      workedExamples.length > 1
        ? String(workedExamples[1].question || "").trim()
        : checkpointQuestion;

    return {
      goalLine,
      keyIdeas,
      examLines,
      workedQuestion,
      workedSteps,
      workedFinal,
      workedExamples,
      checkpointQuestion,
      checkpointAnswer,
      commonMistake,
      commonFix,
      boardQuestion,
    };
  };


  const renderTeach = () => {
    const response = currentResponse;
    if (!response || !response.structured) return null;
    const obj = response.structured;
    const coachProps = buildCoachViewProps(obj);
    const view = normalizeTeachView(obj);
    const tutorText = getTutorText(obj);
    const workedStepText = view.workedSteps
      .map((step, idx) => {
        const marks = Number.isFinite(Number(step.marks)) ? ` (${Number(step.marks)}M)` : "";
        return `${idx + 1}. ${String(step.text)}${marks}`;
      })
      .join("\n");
    const lessonMessages: Array<{ id: string; role: "assistant"; title: string; text: string; tone?: "neutral" | "warn" }> = [
      {
        id: "lesson",
        role: "assistant",
        title: "Lesson",
        text: [view.goalLine, ...view.keyIdeas.map((line) => `- ${line}`)].join("\n"),
      },
      {
        id: "intuition",
        role: "assistant",
        title: "Why This Works",
        text: view.examLines.map((line) => `- ${line}`).join("\n"),
      },
      {
        id: "worked",
        role: "assistant",
        title: "Worked Example",
        text: `${view.workedQuestion}\n\n${workedStepText}\n\nFinal: ${view.workedFinal}`,
      },
      {
        id: "board-q",
        role: "assistant",
        title: "Board-Style Question",
        text: `${view.boardQuestion}\n\nTry it in the input box below. I will hint before giving full steps.`,
      },
      {
        id: "checkpoint",
        role: "assistant",
        title: "Checkpoint",
        text: `${view.checkpointQuestion}\n\nExpected answer style: ${view.checkpointAnswer}`,
      },
      {
        id: "mistake",
        role: "assistant",
        title: "Common Trap",
        text: `${view.commonMistake}\n\nFix: ${view.commonFix}`,
        tone: "warn",
      },
    ];
    const chatMessages = chatTurns.map((turn, idx) => ({
      id: `chat-${idx}`,
      role: turn.role,
      title: turn.role === "assistant" ? "Tutor" : "You",
      text: turn.text,
      tone: "neutral" as const,
    }));
    const allMessages = [
      ...(showLessonPack ? lessonMessages : []),
      ...chatMessages,
      ...(doubtLoading
        ? [{ id: "pending", role: "assistant" as const, title: "Tutor", text: "Thinking...", tone: "neutral" as const }]
        : []),
    ];
    const bubbleStyle = (role: "assistant" | "user", tone?: "neutral" | "warn") => ({
      maxWidth: "82%",
      borderRadius: 14,
      padding: "10px 12px",
      border: role === "assistant" ? "1px solid rgba(0,0,0,0.10)" : "1px solid rgba(59,130,246,0.35)",
      background:
        role === "assistant"
          ? tone === "warn"
            ? "rgba(245,158,11,0.10)"
            : "rgba(255,255,255,0.92)"
          : "rgba(59,130,246,0.12)",
    });
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <DiagramBlock
          diagramType={response.diagramType}
          diagramLabels={response.diagramLabels}
          diagramSpec={response.diagramSpec}
          note="CBSE diagram block"
        />
        {tutorText ? (
          <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.08)" }}>
            {String(tutorText)}
          </div>
        ) : null}
        {coachProps ? <HumanGradeCoachView {...coachProps} compact /> : null}
        {renderAttemptFeedback(obj)}
        {chatTurns.length > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="pill"
              style={{ padding: "6px 10px", fontSize: 12 }}
              onClick={() => setShowLessonPack((prev) => !prev)}
            >
              {showLessonPack ? "Hide lesson pack" : "Show lesson pack"}
            </button>
            {!showLessonPack ? (
              <span style={{ fontSize: 12, opacity: 0.7 }}>Focus mode: chat and guidance only.</span>
            ) : null}
          </div>
        ) : null}
        <div style={{ display: "grid", gap: 10 }}>
          {allMessages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div style={bubbleStyle(msg.role, msg.tone)}>
                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4, opacity: 0.8 }}>{msg.title}</div>
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{msg.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="pill"
            onClick={() => requestTutor(tab, { force: true, requestNextHint: true })}
          >
            Need hint
          </button>
          <button
            type="button"
            className="pill"
            onClick={() => {
              setDoubtInput("Checkpoint attempt: ");
              doubtInputRef.current?.focus();
            }}
          >
            Try checkpoint
          </button>
          <button
            type="button"
            className="pill"
            onClick={() => handleNextConcept()}
            disabled={nodeIndex >= order.length - 1}
          >
            Continue
          </button>
          <button
            type="button"
            className="pill"
            onClick={() => {
              if (!nodeId || !onPracticeThisNode) return;
              onPracticeThisNode(nodeId);
            }}
            disabled={!nodeId || !onPracticeThisNode}
          >
            Practice this node
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
    const view = normalizeTeachView(obj);
    const mistakes = Array.isArray(obj.commonMistakes)
      ? obj.commonMistakes.map((m) => String(m || "").trim()).filter(Boolean)
      : [view.commonMistake];
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
            {view.keyIdeas.map((b, idx: number) => (
              <li key={idx} style={{ marginBottom: 6 }}>{String(b)}</li>
            ))}
          </ul>
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Exam line</div>
          {view.examLines.map((l, idx: number) => (
            <div key={idx} style={{ marginBottom: 6, padding: "6px 8px", borderRadius: 10, background: "rgba(0,0,0,0.04)" }}>
              {String(l)}
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Worked examples</div>
          {view.workedExamples.map((ex, exIdx: number) => {
            const sumMarks = ex.steps.reduce(
              (acc: number, s) => acc + (Number.isFinite(Number(s.marks)) ? Number(s.marks) : 0),
              0
            );
            const total = Number(ex.totalMarks);
            return (
              <div key={exIdx} style={{ borderRadius: 12, padding: "10px 12px", border: "1px solid rgba(0,0,0,0.08)", marginBottom: 10 }}>
                <div style={{ fontWeight: 800 }}>
                  {exIdx === 0 ? "Example 1: Basic" : "Example 2: Board-style"}
                </div>
                {ex.question ? <div style={{ marginTop: 6 }}>{String(ex.question)}</div> : null}
                {ex.steps.length ? (
                  <ol style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                    {ex.steps.map((s, idx: number) => (
                      <li key={idx} style={{ marginBottom: 6 }}>
                        {Number.isFinite(Number(s.marks)) ? <b>[{Number(s.marks)}]</b> : null} {String(s.text || "")}
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
                {ex.finalAnswer ? (
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
              {mistakes.map((m, idx: number) => (
                <li key={idx} style={{ marginBottom: 6 }}>{String(m)}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {view.checkpointQuestion ? (
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Check question</div>
            <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(0,0,0,0.04)" }}>
              {view.checkpointQuestion}
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

  const inputPlaceholder =
    tab === "teach" ? "Answer checkpoint or ask a doubt..." : "Ask a doubt about this step...";
  const sendButtonLabel = tab === "teach" ? "Submit" : "Send";
  const checkpointHint =
    tab === "teach"
      ? "Checkpoint = answer the quick check above in your own words."
      : "Ask any doubt about this step.";
  const quickPrompts =
    tab === "teach"
      ? [
          "Explain this in simple Class 10 language.",
          "Give one board-style solved example for this step.",
          "Check my checkpoint answer and tell me one mistake.",
        ]
      : [
          "Show one more board example for this node.",
          "What is the most common exam mistake here?",
        ];

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
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(1360px, 98vw)",
          height: "min(96vh, 980px)",
          maxHeight: "96vh",
          minHeight: "620px",
          background: drawerBg,
          borderRadius: 18,
          border: "1px solid rgba(0,0,0,0.12)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          padding: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Tutor</div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: "3px 8px",
              borderRadius: 999,
              background: masteryMeta[nodeMasteryState].bg,
              color: masteryMeta[nodeMasteryState].color,
              border: `1px solid ${masteryMeta[nodeMasteryState].border}`,
            }}
          >
            {masteryMeta[nodeMasteryState].label}
          </span>
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

        {showSoftGateWarning ? (
          <div
            style={{
              marginTop: 10,
              borderRadius: 12,
              padding: "10px 12px",
              border: "1px solid rgba(245,158,11,0.45)",
              background: "rgba(245,158,11,0.12)",
            }}
          >
            <div style={{ fontWeight: 800 }}>Checkpoint not yet passed for this node.</div>
            <div style={{ marginTop: 4, fontSize: 13, opacity: 0.88 }}>
              You can still continue, but mastery will improve faster if you checkpoint first.
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="pill"
                onClick={() => {
                  setDoubtInput("Checkpoint attempt: ");
                  doubtInputRef.current?.focus();
                }}
              >
                Try checkpoint
              </button>
              <button
                type="button"
                className="pill"
                onClick={() => requestTutor(tab, { force: true, requestNextHint: true })}
              >
                Next hint
              </button>
              <button
                type="button"
                className="pill"
                onClick={() => {
                  if (!nodeId || !onPracticeThisNode) return;
                  onPracticeThisNode(nodeId);
                }}
                disabled={!nodeId || !onPracticeThisNode}
              >
                Practice this node
              </button>
              <button type="button" className="pill" onClick={() => handleNextConcept(true)}>
                Continue anyway
              </button>
            </div>
          </div>
        ) : null}

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
            onClick={() => handleNextConcept()}
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
          ref={contentScrollRef}
          style={{
            marginTop: 12,
            flex: 1,
            overflow: "auto",
            padding: 10,
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.10)",
            background: "rgba(255,255,255,0.6)",
            minHeight: 280,
          }}
        >
          {drawerContent()}
        </div>

        {doubtError ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "rgba(255,0,0,0.06)" }}>
            {doubtError}
          </div>
        ) : null}

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.78 }}>{checkpointHint}</div>
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <input
            ref={doubtInputRef}
            value={doubtInput}
            onChange={(e) => setDoubtInput(e.target.value)}
            placeholder={inputPlaceholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void sendDoubt(doubtInput);
              }
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
            {doubtLoading ? "Thinking..." : sendButtonLabel}
          </button>
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="pill"
              style={{ padding: "6px 10px", fontSize: 12 }}
              onClick={() => {
                setDoubtInput(prompt);
                doubtInputRef.current?.focus();
              }}
              disabled={doubtLoading}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12, borderRadius: 12, padding: "10px 12px", background: "rgba(0,0,0,0.03)" }}>
          <button
            type="button"
            className="pill"
            onClick={() => setShowFeedbackPanel((prev) => !prev)}
            style={{ padding: "6px 10px", fontSize: 13, background: "white" }}
          >
            {showFeedbackPanel ? "Hide feedback" : "Was this helpful? Add feedback (optional)"}
          </button>
          {showFeedbackPanel ? (
            <div style={{ marginTop: 10 }}>
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
                      const data = await parseResponsePayload(res);
                      if (!res.ok) throw new Error(getResponseError(data, "Feedback failed."));
                      setFeedbackStatus("success");
                      setFeedbackMessage("Thanks! Your feedback was saved.");
                    } catch (err) {
                      setFeedbackStatus("error");
                      setFeedbackMessage(toTutorErrorMessage(err, "Could not save feedback."));
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
          ) : null}
        </div>
      </div>
    </div>
  );
}




