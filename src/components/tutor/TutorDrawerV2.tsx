import { useCallback, useEffect, useRef, useState } from "react";
import { DiagramBlock } from "../DiagramBlock";
import { MENTOR_ENDPOINT } from "../../ai/aiClient";
import { extractDiagramMeta, validateTutorStructured } from "../../contracts/tutorContracts.ts";

type ModeKey = "zombie" | "beast";
type TutorTab = "teach" | "examples";
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

  const buildPayload = (nextTab: TutorTab, doubtContext?: any, prompt?: string, requestNextHint?: boolean, hintLadderState?: any) => {
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
      },
      messages: prompt ? [{ role: "user", content: prompt }] : undefined,
    };
  };

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
        const hintLadderState = opts?.requestNextHint ? responses[key]?.structured?.attempt_loop?.hint_ladder : undefined;
        const body = buildPayload(nextTab, undefined, opts?.prompt, opts?.requestNextHint, hintLadderState);
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

        const modeApi = nextTab === "teach" ? "learn_mindmap" : "learn_teach";
        const meta = extractDiagramMeta(structured);
        const check = validateTutorStructured(modeApi, structured, body.payload);
        if (!check.ok) {
          const msg = check.issues[0] || "Mentor response incomplete. Please retry.";
          setErrors((prev) => ({ ...prev, [key]: msg }));
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
        const body = buildPayload(tab, doubtContext, prompt, false, undefined);
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

  const renderAttemptFeedback = (obj: any) => {
    const loop = obj?.attempt_loop;
    const hint = loop?.hint_ladder;
    const rubric = loop?.rubric;
    if (!loop || typeof loop !== "object") return null;
    const diagnosis = loop.diagnosis || {};
    const nextAction = loop.next_action || {};
    const tags = Array.isArray(diagnosis.mistake_tags) ? diagnosis.mistake_tags.slice(0, 3) : [];
    const verdict = String(diagnosis.status || "unclear").toUpperCase();
    const actionType = String(nextAction.type || "");
    const prompt = String(nextAction.prompt || "");
    const brief = loop.bsre?.brief ? String(loop.bsre.brief) : "";
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
        {hint ? (
          <div style={{ marginTop: 8, fontSize: 12 }}>Hint level: <b>{hint.level}</b>/{hint.max_level}</div>
        ) : null}
        {hint?.last_hint?.text ? (
          <div style={{ marginTop: 6, fontSize: 12 }}>{hint.last_hint.text}</div>
        ) : null}
        {hint?.next_hint_available ? (
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
            <div><b>Score:</b> {rubric.total_score}/100 ({rubric.band})</div>
            <div style={{ marginTop: 4 }}>
              Concept: {rubric.dimensions?.concept_selection}/25 | Setup: {rubric.dimensions?.setup_correctness}/20 | Logic: {rubric.dimensions?.logical_progression}/25
            </div>
            <div style={{ marginTop: 2 }}>
              Computation: {rubric.dimensions?.computation_accuracy}/20 | Presentation: {rubric.dimensions?.presentation_exam_style}/10
            </div>
            {rubric.recommended_next ? (
              <div style={{ marginTop: 4 }}><b>Next focus:</b> {rubric.recommended_next.focus_skill}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
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
        {renderAttemptFeedback(obj)}
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
        {renderAttemptFeedback(obj)}
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
      </div>
    </div>
  );
}




