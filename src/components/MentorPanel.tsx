import React, { useEffect, useState } from "react";
// Import the strategy plan helper.  Use a relative import since this file
// sits at the project root alongside planStorage.ts.
// We no longer persist plan drafts from within the MentorPanel.  Plan
// persistence is handled in the Planner flow (e.g. AiMentorPage) where
// the structured study plan is generated and saved.  Removing this
// import avoids unused variable errors and mismatched argument counts.
// import { saveStrategyPlan } from "../services/planStorage";
import { callMentor } from "../ai/aiClient";
import type {
  MentorMode,
  MentorMessage,
  MentorRequest,
  PageContext,
  StudentState,
  MentorPersona,
} from "../types/MentorRequest";

/**
 * MentorPanel
 *
 * This component powers the interactive AI mentor experience.  It supports
 * multiple mentor modes (solve, explain, plan, coach, mindset) via a single
 * unified persona.  When `showModes` is enabled, users can switch between
 * modes using the chips; otherwise it defaults to planner functionality.
 * A `persona` prop can optionally be provided to forward persona metadata to
 * the backend.  The UI remains largely unchanged from the original version –
 * subject/chapter selectors, plan preview bubble and tweak input are all
 * preserved.
 */
interface MentorPanelProps {
  pageContext: PageContext;
  initialStudentState: StudentState;
  /** initial mentor mode (defaults to "plan"). */
  defaultMode?: MentorMode;
  /** initial prompt to auto-generate a plan when landing on the page. */
  autoFirstPrompt?: string;
  /** whether to display mode chips for switching between solve/explain/plan/etc. */
  showModes?: boolean;
  /** callback fired when the plan preview text updates. */
  onPlanUpdated?: (planText: string | null) => void;
  /** optional persona definition forwarded to the backend. */
  persona?: MentorPersona;
}

const MODES: { key: MentorMode; label: string }[] = [
  { key: "solve", label: "Solve" },
  { key: "explain", label: "Explain" },
  { key: "plan", label: "Plan" },
  { key: "coach", label: "Coach" },
  { key: "mindset", label: "Mindset" },
];

// Full-ish CBSE Class 10 chapter lists for now
const CHAPTERS_BY_SUBJECT: Record<"Maths" | "Science", string[]> = {
  Maths: [
    "All Chapters",
    "Real Numbers",
    "Polynomials",
    "Pair of Linear Equations in Two Variables",
    "Quadratic Equations",
    "Arithmetic Progressions",
    "Triangles",
    "Coordinate Geometry",
    "Introduction to Trigonometry",
    "Applications of Trigonometry",
    "Circles",
    "Constructions",
    "Areas Related to Circles",
    "Surface Areas and Volumes",
    "Statistics",
    "Probability",
  ],
  Science: [
    "All Chapters",
    "Chemical Reactions and Equations",
    "Acids, Bases and Salts",
    "Metals and Non-Metals",
    "Carbon and Its Compounds",
    "Periodic Classification of Elements",
    "Life Processes",
    "Control and Coordination",
    "How do Organisms Reproduce?",
    "Heredity and Evolution",
    "Light – Reflection and Refraction",
    "The Human Eye and the Colourful World",
    "Electricity",
    "Magnetic Effects of Electric Current",
    "Our Environment",
    "Sustainable Management of Natural Resources",
  ],
};

/**
 * Call the backend API.  This function sends the request payload to the
 * mentor API running on port 3001 and returns a string representation of
 * the response.  For plan mode, it formats the study plan into a readable
 * preview.  For other modes, it simply stringifies the returned data.
 */
async function callMentorAPI(payload: MentorRequest): Promise<string> {
  // Build a compact MentorPayload-style object from the richer MentorRequest.
  // This keeps all the planner logic here, while delegating the actual HTTP
  // call + error handling to src/ai/aiClient.ts.
  const mentorPayload: any =
    payload.mode === "plan"
      ? {
          subject: payload.pageContext.subject,
          daysLeft: payload.studentState.daysLeft ?? 90,
          targetPercent: payload.studentState.targetScore ?? 80,
          // Total focussed study time per day across Maths + Science.
          hoursPerDay:
            (payload.studentState.mathHoursPerDay ?? 0) +
            (payload.studentState.scienceHoursPerDay ?? 0),
          topicKey: (payload.pageContext as any).topicKey ?? payload.pageContext.chapter ?? undefined,
          // Keep weak chapters for future prompt tuning (gateway ignores unknown keys safely).
          weakChapters: (payload.studentState as any).weakChapters,
          optionalChapters: [],
          extraNotes: undefined,
        }
      : payload.mode === "solve"
      ? {
          grade: String(payload.pageContext.grade),
          subject: payload.pageContext.subject,
          topicKey: payload.pageContext.chapter ?? "",
          questionText: payload.message,
          marks: payload.pageContext.marks,
        }
      : payload.mode === "explain"
      ? {
          grade: String(payload.pageContext.grade),
          subject: payload.pageContext.subject,
          // Prefer a canonical topic/concept key when available.
          topicKey:
            (payload.pageContext as any).topic ??
            payload.pageContext.chapter ??
            "",
          questionText: payload.message,
        }
      : {
          grade: String(payload.pageContext.grade),
          subject: payload.pageContext.subject,
          daysLeft: payload.studentState.daysLeft ?? 90,
          extraNotes: payload.message,
        };

  const result = await callMentor(
    payload.mode as any,
    mentorPayload,
    payload.persona as any
  );

  // Prefer the plain text if present, otherwise attempt to format a study plan.
  const { mode, data } = result;

  if (data && typeof data.text === "string") {
    const text = data.text.trim();
    return text.length > 0 ? text : "No response.";
  }

  if (mode === "plan") {
    const lines: string[] = [];

    if (Array.isArray((data as any)?.seasonPlan)) {
      lines.push("Study phases:");
      (data as any).seasonPlan.forEach((phase: any) => {
        lines.push(
          `• ${phase.phase} – ${phase.durationDays} days: ${phase.focus}`
        );
      });
      lines.push("");
    }

    if (Array.isArray((data as any)?.chapterHours)) {
      lines.push("Chapter allocation:");
      (data as any).chapterHours.forEach((ch: any) => {
        lines.push(
          `• ${ch.chapter} [${ch.tier}] – ${ch.recommendedHours} hrs (${ch.weightagePercent}% weightage)`
        );
      });
      lines.push("");
    }

    if (Array.isArray((data as any)?.dailySchedule)) {
      lines.push("First few days schedule:");
      (data as any).dailySchedule.forEach((d: any) => {
        const parts: string[] = [];
        if (d.hours) {
          if (d.hours.Maths) parts.push(`Maths: ${d.hours.Maths}h`);
          if (d.hours.Science) parts.push(`Science: ${d.hours.Science}h`);
        }
        lines.push(`• Day ${d.dayNumber}: ${parts.join(", ")}`);
      });
    }

    if (lines.length > 0) {
      return lines.join("\n");
    }
  }

  // Fallback: pretty-print whatever data we received
  return JSON.stringify(result.data ?? {}, null, 2);
}


export const MentorPanel: React.FC<MentorPanelProps> = ({
  pageContext,
  initialStudentState,
  defaultMode = "plan",
  autoFirstPrompt,
  showModes = false,
  onPlanUpdated,
  persona,
}) => {
  // Current mentor mode.  Defaults to the provided mode and can change via chips.
  const [mode, setMode] = useState<MentorMode>(defaultMode);
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [planPreview, setPlanPreview] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [studentState] = useState<StudentState>(initialStudentState);
  const [subject, setSubject] = useState<"Maths" | "Science">(
    pageContext.subject
  );
  const [chapter, setChapter] = useState<string>(
    pageContext.chapter ?? "All Chapters"
  );
  const [hasAutoPrompted, setHasAutoPrompted] = useState(false);

  const effectivePageContext: PageContext = {
    ...pageContext,
    subject,
    chapter,
  };
  const chaptersForSubject = CHAPTERS_BY_SUBJECT[subject] ?? ["All Chapters"];

  const handleAssistantReply = (replyText: string) => {
    const assistantMsg: MentorMessage = {
      role: "assistant",
      content: replyText,
      mode,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setPlanPreview(replyText);
    if (onPlanUpdated) onPlanUpdated(replyText);

    // Persist plan drafts in plan mode so the dashboard can load a
    // strategy plan later.  We save only when mode is "plan" and the
    // reply is nonempty.  The context contains grade and subject
    // information, which we forward to the storage helper.  Saving
    // plans helps bridge the mentor and dashboard flows.
    if (mode === "plan" && replyText && replyText.trim().length > 0) {
      try {
        // grade is stored as e.g. "Class 10", remove non‑digits for route convenience
        const _gradeNum = String(
          (effectivePageContext.grade || "Class 10").replace(/\D/g, "")
        ) || "10";
        // Persist a deep link to the study plan page so the dashboard can
        // later load the plan.  We compute a route of the form
        // `/study-plan/{gradeNum}/{subject}` where subject is lower-case.
        // The actual plan text is saved via the strategy engine in the
        // dedicated planner flow; this call only stores the link.
        const subjectKey = (effectivePageContext.subject || "Maths").toLowerCase();
        const planDeepLink = `/study-plan/${_gradeNum}/${subjectKey}`;
        try {
          window.localStorage.setItem('lazytopper.lastPlanDeepLink', planDeepLink);
        } catch {
          // Ignore localStorage errors (e.g. quota exceeded)
        }
      } catch (err) {
        console.warn("Failed to persist strategy plan", err);
      }
    }
  };

  const sendPrompt = async (prompt: string) => {
    if (!prompt.trim()) return;
    const userMsg: MentorMessage = { role: "user", content: prompt, mode };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);
    const payload: MentorRequest = {
      mode,
      message: prompt,
      pageContext: effectivePageContext,
      studentState,
      history: newHistory,
      persona,
    };
    try {
      const replyText = await callMentorAPI(payload);
      handleAssistantReply(replyText);
    } catch {
      handleAssistantReply(
        "Hmm, something glitched while talking to your mentor. Try again in a few seconds."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    await sendPrompt(trimmed);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 🔹 Auto-generate first plan using homepage inputs, but only in plan mode.
  useEffect(() => {
    if (!autoFirstPrompt || hasAutoPrompted || mode !== "plan") return;
    setHasAutoPrompted(true);
    setIsLoading(true);
    const run = async () => {
      const payload: MentorRequest = {
        mode,
        message: autoFirstPrompt,
        pageContext: effectivePageContext,
        studentState,
        history: [],
        persona,
      };
      try {
        const replyText = await callMentorAPI(payload);
        handleAssistantReply(replyText);
      } catch {
        handleAssistantReply(
          "I couldn’t auto-generate your plan. Try typing a quick tweak and I’ll rebuild it."
        );
      } finally {
        setIsLoading(false);
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFirstPrompt, hasAutoPrompted, mode]);

  // Simple descriptions per mode for the header subtitle.
  const MODE_DESCRIPTIONS: Partial<Record<MentorMode, string>> = {
    solve:
      "Solve mode: I’ll walk through a question step-by-step and highlight common mistakes.",
    explain:
      "Explain mode: I’ll break down tough topics into simple, easy-to-follow explanations.",
    plan:
      "Planner mode: I’ll turn your targets, days left and hours/day into a realistic daily roadmap.",
    coach:
      "Coach mode: I’ll offer tips, strategies and exam-ready advice based on your progress.",
    mindset:
      "Mindset mode: I’ll help you build a positive growth mindset and exam resilience.",
  };

  // Placeholders for the input box depending on the active mode.  This helps
  // users understand what to type when not in planner mode.
  const INPUT_PLACEHOLDERS: Partial<Record<MentorMode, string>> = {
    solve: "Type your question here…",
    explain: "Type the topic or concept you want explained…",
    plan:
      "Want tweaks? Tell me what to adjust — e.g. ‘more revision days’, ‘focus Trigonometry & Light first’…",
    coach: "Tell me about your study challenges or ask for exam tips…",
    mindset: "Share any thoughts or worries for mindset advice…",
  };

  return (
    <div className="mentor-panel">
      {/* HEADER */}
      <div className="mentor-panel__header">
        <div className="mentor-panel__header-text">
          <h3 className="mentor-panel__title">Your AI Mentor</h3>
          <p className="mentor-panel__subtitle">{MODE_DESCRIPTIONS[mode] ?? ""}</p>
        </div>
        {/* AI avatar */}
        <div className="mentor-panel__avatar">
          <div className="mentor-panel__avatar-glow" />
          <div className="mentor-panel__avatar-face">
            <div className="mentor-panel__avatar-eyes">
              <span className="mentor-panel__eye mentor-panel__eye--left" />
              <span className="mentor-panel__eye mentor-panel__eye--right" />
            </div>
            <div className="mentor-panel__avatar-mouth" />
          </div>
        </div>
      </div>
      {/* (Optional) MODE CHIPS – hidden on home for now */}
      {showModes && (
        <div className="mentor-panel__modes">
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setMode(key);
                // reset history and preview when switching modes to avoid mixing contexts
                setMessages([]);
                setPlanPreview(null);
              }}
              className={
                "mentor-panel__mode-chip" +
                (key === mode ? " mentor-panel__mode-chip--active" : "")
              }
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {/* SUBJECT + CHAPTER PICKER */}
      <div className="mentor-panel__subject-row">
        <div className="mentor-panel__subject-toggle">
          <button
            type="button"
            className={
              "mentor-panel__subject-chip" +
              (subject === "Maths" ? " mentor-panel__subject-chip--active" : "")
            }
            onClick={() => setSubject("Maths")}
          >
            Maths
          </button>
          <button
            type="button"
            className={
              "mentor-panel__subject-chip" +
              (subject === "Science"
                ? " mentor-panel__subject-chip--active"
                : "")
            }
            onClick={() => setSubject("Science")}
          >
            Science
          </button>
        </div>
        <select
          className="mentor-panel__chapter-select"
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
        >
          {chaptersForSubject.map((ch) => (
            <option key={ch} value={ch}>
              {ch}
            </option>
          ))}
        </select>
      </div>
      {/* CONTEXT TAGS */}
      <div className="mentor-panel__context">
        <span className="mentor-panel__tag">
          {subject} · {effectivePageContext.grade}
        </span>
        {chapter && <span className="mentor-panel__tag">{chapter}</span>}
      </div>
      {/* CONVERSATION & PLAN PREVIEW */}
      <div className="mentor-panel__messages">
        {/* If there are any chat messages, render them as a conversation thread. */}
        {messages.length > 0 &&
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={
                "mentor-panel__message " +
                (msg.role === "user"
                  ? "mentor-panel__message--user"
                  : "mentor-panel__message--assistant")
              }
            >
              <div className="mentor-panel__bubble">
                {msg.content.split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          ))}
        {/* If no conversation yet and we’re in plan mode with a plan preview, show the plan preview bubble. */}
        {messages.length === 0 && planPreview && mode === "plan" && (
          <div className="mentor-panel__message mentor-panel__message--assistant">
            <div className="mentor-panel__bubble">
              {planPreview.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}
        {/* When there’s no plan preview and no messages, display a friendly placeholder. */}
        {messages.length === 0 && !planPreview && !isLoading && (
          <div className="mentor-panel__message mentor-panel__message--assistant">
            <div className="mentor-panel__bubble mentor-panel__bubble--placeholder">
              I’ll use your Maths &amp; Science targets and hours from the left to build a
              roadmap preview here. Once you’re happy, tap <strong>“Show my study plan”</strong>
              to see the full schedule.
            </div>
          </div>
        )}
        {/* Loading indicator when waiting for the mentor to reply. */}
        {isLoading && (
          <div className="mentor-panel__message mentor-panel__message--assistant">
            <div className="mentor-panel__bubble mentor-panel__bubble--loading">
              Typing…
            </div>
          </div>
        )}
      </div>
      {/* INPUT AREA */}
      <div className="mentor-panel__input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={INPUT_PLACEHOLDERS[mode] ?? ""}
          /* Provide more space by default; let the textarea grow as needed. */
          rows={3}
          style={{ resize: "vertical" }}
        />
        <button
          type="button"
          className="mentor-panel__send-btn"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
        >
          {/* Change the button label based on the mode.  In plan mode we update
              the plan; in other modes we simply send the query. */}
          {mode === "plan"
            ? isLoading
              ? "Updating..."
              : "Update plan"
            : isLoading
            ? "Sending..."
            : "Send"}
        </button>
      </div>
    </div>
  );
};