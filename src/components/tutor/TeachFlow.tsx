// src/components/tutor/TeachFlow.tsx
import { useRef, useState } from "react";
import { DiagramBlock } from "../DiagramBlock";

interface TeachFlowProps {
  topicKey: string;
  subject: string;
  grade: string;
  nodeId?: string;
  onComplete?: () => void;
}

type Phase = "intro" | "teaching" | "awaiting_answer" | "responding" | "complete";

interface TeachCard {
  goal?: string;
  goalLine?: string;
  keyIdeas?: string[];
  keyIdeaBullets?: string[];
  diagram?: { type?: string; altText?: string };
  checkpoint?: { question?: string; answer?: string };
}

function extractFeedbackText(payload: any): string {
  if (!payload) return "Good effort! Let's continue.";
  const data = payload.data ?? payload;
  if (typeof data.feedback === "string" && data.feedback.trim()) return data.feedback.trim();
  if (typeof data.responseText === "string" && data.responseText.trim()) return data.responseText.trim();
  if (data.teach?.checkpoint?.answer && typeof data.teach.checkpoint.answer === "string")
    return data.teach.checkpoint.answer.trim();
  if (typeof data.checkpointAnswer === "string" && data.checkpointAnswer.trim())
    return data.checkpointAnswer.trim();
  if (typeof data.text === "string" && data.text.trim()) return data.text.trim();
  if (typeof payload.message === "string" && payload.message.trim()) return payload.message.trim();
  return "Good effort! Let's continue.";
}

function extractTeachCard(payload: any): TeachCard | null {
  if (!payload) return null;
  // Try nested teach object first
  if (payload.teach && typeof payload.teach === "object") return payload.teach as TeachCard;
  if (payload.data?.teach && typeof payload.data.teach === "object") return payload.data.teach as TeachCard;
  // The server's topicTeachContracts returns fields at the top level of data
  const data = payload.data ?? payload;
  if (data && (data.goalLine || data.keyIdeas || data.checkpointQuestion)) {
    return {
      goal: data.goalLine,
      goalLine: data.goalLine,
      keyIdeas: Array.isArray(data.keyIdeas) ? data.keyIdeas : [],
      checkpoint: {
        question: data.checkpointQuestion ?? data.checkpoint?.question ?? "",
        answer: data.checkpointAnswer ?? data.checkpoint?.answer ?? "",
      },
    } as TeachCard;
  }
  return null;
}

function getGoal(card: TeachCard): string {
  return String(card.goalLine || card.goal || "").trim() || "Understand the core idea.";
}

function getKeyIdeas(card: TeachCard): string[] {
  const raw = card.keyIdeas || card.keyIdeaBullets || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((s: any) => String(s).trim()).filter(Boolean);
}

const styles = {
  container: { maxWidth: 640, margin: "0 auto", padding: 24 } as React.CSSProperties,
  heading: { fontSize: 22, fontWeight: 700, color: "#1a1a2e", marginBottom: 8 } as React.CSSProperties,
  hook: { fontSize: 15, color: "#555", marginBottom: 24 } as React.CSSProperties,
  card: { background: "white", border: "1px solid #e8e8e8", borderRadius: 12, padding: 20, marginBottom: 16 } as React.CSSProperties,
  goalLine: { fontSize: 15, fontWeight: 600, color: "#1a1a2e", marginBottom: 10 } as React.CSSProperties,
  bullet: { fontSize: 14, lineHeight: 1.8, color: "#333" } as React.CSSProperties,
  checkpointQ: { fontSize: 14, fontWeight: 600, color: "#333", marginTop: 16, marginBottom: 8 } as React.CSSProperties,
  input: { width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #ccc", borderRadius: 8, boxSizing: "border-box", marginBottom: 12, fontFamily: "inherit" } as React.CSSProperties,
  primaryBtn: { background: "#4f46e5", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginRight: 10 } as React.CSSProperties,
  secondaryBtn: { background: "transparent", color: "#4f46e5", border: "1px solid #4f46e5", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
  spinner: { color: "#888", fontSize: 14, padding: "20px 0" } as React.CSSProperties,
  error: { color: "#cc0000", fontSize: 13, marginTop: 8, marginBottom: 12 } as React.CSSProperties,
  feedback: { fontSize: 14, color: "#333", lineHeight: 1.7, marginBottom: 16 } as React.CSSProperties,
  stepBadge: { fontSize: 12, color: "#888", marginBottom: 16 } as React.CSSProperties,
  complete: { textAlign: "center", padding: "32px 0" } as React.CSSProperties,
  completeTick: { fontSize: 40, marginBottom: 12 } as React.CSSProperties,
  completeMsg: { fontSize: 16, fontWeight: 600, color: "#1a1a2e", marginBottom: 8 } as React.CSSProperties,
  completeSub: { fontSize: 14, color: "#666", marginBottom: 24 } as React.CSSProperties,
};

export function TeachFlow({ topicKey, subject, grade, nodeId, onComplete }: TeachFlowProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [stepCount, setStepCount] = useState(0);
  const [teachCard, setTeachCard] = useState<TeachCard | null>(null);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [aiFeedback, setAiFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  async function callMentor(body: object): Promise<any> {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const raw = await res.text();
      let payload: any = {};
      try {
        payload = raw ? JSON.parse(raw) : {};
      } catch {
        payload = { text: raw };
      }
      if (!res.ok) throw new Error(payload?.error || payload?.message || `Server error ${res.status}`);
      return payload;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") throw new Error("The tutor is taking too long. Please try again.");
      throw err;
    }
  }

  async function startLearning() {
    setLoading(true);
    setError(null);
    setAiFeedback("");
    setPhase("teaching");
    try {
      const payload = await callMentor({
        mode: "learn_teach",
        section: "learn",
        subSection: "teach",
        selectedTab: "teach",
        topic: topicKey,
        subject,
        grade,
        nodeId: nodeId ?? `${topicKey}-step-1`,
        messages: [],
      });
      const card = extractTeachCard(payload) || extractTeachCard(payload?.data);
      if (card) {
        setTeachCard(card);
        setHistory([{ role: "assistant", content: `${getGoal(card)}. ${getKeyIdeas(card).join(". ")}` }]);
      } else {
        setTeachCard({
          goal: `Let's learn ${topicKey}`,
          keyIdeas: [
            "Review the key concepts for this topic.",
            "Focus on definitions and theorems.",
          ],
          checkpoint: { question: "What do you already know about this topic?" },
        });
      }
      setPhase("awaiting_answer");
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
      setPhase("intro");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!studentAnswer.trim()) return;
    setLoading(true);
    setError(null);
    setPhase("responding");
    const newHistory = [...history, { role: "user", content: studentAnswer.trim() }];
    try {
      const payload = await callMentor({
        mode: "learn_teach",
        section: "learn",
        subSection: "teach",
        selectedTab: "teach",
        topic: topicKey,
        subject,
        grade,
        nodeId: nodeId ?? `${topicKey}-step-${stepCount + 1}`,
        messages: newHistory,
        attempt_loop: { student_attempt: { raw_text: studentAnswer.trim() } },
      });
      const data = payload?.data ?? payload;
      const feedback = extractFeedbackText(data);
      const nextCard = extractTeachCard(data);
      setAiFeedback(feedback);
      setHistory([...newHistory, { role: "assistant", content: feedback }]);
      if (nextCard) setTeachCard(nextCard);
      setStudentAnswer("");
      const nextStep = stepCount + 1;
      setStepCount(nextStep);
      setPhase(nextStep >= 3 ? "complete" : "awaiting_answer");
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
      setPhase("awaiting_answer");
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    setError(null);
    if (phase === "intro" || stepCount === 0) startLearning();
    else submitAnswer();
  }

  function reset() {
    setPhase("intro");
    setStepCount(0);
    setTeachCard(null);
    setStudentAnswer("");
    setAiFeedback("");
    setError(null);
    setHistory([]);
  }

  if (phase === "intro") {
    return (
      <div style={styles.container}>
        <div style={styles.heading}>{topicKey}</div>
        <div style={styles.hook}>Let's understand {topicKey} - step by step, concept by concept.</div>
        {loading && <div style={styles.spinner}>Preparing your lesson...</div>}
        {error && (
          <>
            <div style={styles.error}>{error}</div>
            <button style={styles.primaryBtn} onClick={retry}>Retry</button>
          </>
        )}
        {!loading && !error && (
          <button style={styles.primaryBtn} onClick={startLearning}>Start Learning</button>
        )}
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.complete }}>
          <div style={styles.completeTick}>Done</div>
          <div style={styles.completeMsg}>Great work!</div>
          <div style={styles.completeSub}>You've covered the key ideas for {topicKey}. Ready to test yourself?</div>
          <button style={styles.primaryBtn} onClick={() => onComplete?.()}>Try a Practice Question</button>
          <button style={styles.secondaryBtn} onClick={reset}>Review Again</button>
        </div>
      </div>
    );
  }

  const card = teachCard;
  const goal = card ? getGoal(card) : "";
  const ideas = card ? getKeyIdeas(card) : [];
  const checkpointQ = card?.checkpoint?.question || "";
  const diagram = card?.diagram;

  return (
    <div style={styles.container}>
      <div style={styles.heading}>{topicKey}</div>
      <div style={styles.stepBadge}>Step {stepCount + 1} of 3</div>

      {aiFeedback && phase === "awaiting_answer" && (
        <div style={styles.card}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#4f46e5", marginBottom: 8 }}>Tutor's Response</div>
          <div style={styles.feedback}>{aiFeedback}</div>
        </div>
      )}

      {card && (
        <div style={styles.card}>
          <div style={styles.goalLine}>{goal}</div>
          {ideas.length > 0 && (
            <ul style={{ ...styles.bullet, paddingLeft: 20, margin: 0 }}>
              {ideas.map((idea, i) => <li key={i}>{idea}</li>)}
            </ul>
          )}
          {diagram && diagram.type && String(diagram.type).toLowerCase() !== "generic" && (
            <div style={{ marginBottom: 16 }}>
              <DiagramBlock
                diagramType={diagram.type}
                diagramLabels={[]}
                title="Concept diagram"
                note={diagram.altText || "Concept diagram"}
              />
            </div>
          )}
          {checkpointQ && <div style={styles.checkpointQ}>{checkpointQ}</div>}
        </div>
      )}

      {phase === "awaiting_answer" && (
        <>
          <textarea
            style={{ ...styles.input, height: 80, resize: "vertical" } as React.CSSProperties}
            placeholder="Type your answer here..."
            value={studentAnswer}
            onChange={(e) => setStudentAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) submitAnswer();
            }}
          />
          {error && <div style={styles.error}>{error}</div>}
          <button style={styles.primaryBtn} onClick={submitAnswer} disabled={loading || !studentAnswer.trim()}>
            {loading ? "Checking..." : "Submit Answer"}
          </button>
          {error && <button style={{ ...styles.secondaryBtn, marginLeft: 8 }} onClick={retry}>Retry</button>}
          {phase === "awaiting_answer" && stepCount >= 1 && (
            <button
              style={{ ...styles.secondaryBtn, marginTop: 8, display: "block" }}
              onClick={() => setPhase("complete")}
            >
              I'm ready to practice
            </button>
          )}
        </>
      )}

      {(phase === "teaching" || phase === "responding") && loading && (
        <div style={styles.spinner}>Your tutor is thinking...</div>
      )}
    </div>
  );
}

export default TeachFlow;
