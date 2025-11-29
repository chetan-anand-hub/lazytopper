// src/components/MentorPanel.tsx
import React, { useEffect, useState } from "react";
import type {
  MentorMode,
  MentorMessage,
  MentorRequest,
  PageContext,
  StudentState,
} from "../types/MentorRequest";

interface MentorPanelProps {
  pageContext: PageContext;
  initialStudentState: StudentState;
  defaultMode?: MentorMode;
  autoFirstPrompt?: string;
  showModes?: boolean; // for future full Mentor page
  onPlanUpdated?: (planText: string | null) => void;
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

// 🔹 Step (a): stubbed API – demo reply
async function callMentorStub(payload: MentorRequest): Promise<string> {
  const s = payload.studentState;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        [
          `Planner snapshot for ${payload.pageContext.subject} – demo only 👇`,
          "",
          `• Days left: ${s.daysLeft ?? "?"}`,
          `• Overall target: ${s.targetScore ?? "?"}%`,
          `• Maths: ${s.mathTargetScore ?? "?"}% · ${
            s.mathHoursPerDay ?? "?"
          } hr/day`,
          `• Science: ${s.scienceTargetScore ?? "?"}% · ${
            s.scienceHoursPerDay ?? "?"
          } hr/day`,
          "",
          "When the real backend is wired, I’ll convert this into a detailed day-wise plan",
          "with chapter ordering by PYQ weightage + revision + practice distribution.",
        ].join("\n")
      );
    }, 500);
  });
}

export const MentorPanel: React.FC<MentorPanelProps> = ({
  pageContext,
  initialStudentState,
  defaultMode = "plan",
  autoFirstPrompt,
  showModes = false,
  onPlanUpdated,
}) => {
  // lock to plan mode on this card
  const [mode] = useState<MentorMode>(defaultMode);
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
    };

    try {
      const replyText = await callMentorStub(payload);
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

  // 🔹 Auto-generate first plan using homepage inputs, but do NOT show user bubble
  useEffect(() => {
    if (!autoFirstPrompt || hasAutoPrompted) return;

    setHasAutoPrompted(true);
    setIsLoading(true);

    const run = async () => {
      const payload: MentorRequest = {
        mode,
        message: autoFirstPrompt,
        pageContext: effectivePageContext,
        studentState,
        history: [],
      };
      try {
        const replyText = await callMentorStub(payload);
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
  }, [autoFirstPrompt, hasAutoPrompted]);

  return (
    <div className="mentor-panel">
      {/* HEADER */}
      <div className="mentor-panel__header">
        <div className="mentor-panel__header-text">
          <h3 className="mentor-panel__title">Your AI Mentor</h3>
          <p className="mentor-panel__subtitle">
            Planner-mode: I’ll turn your targets, days left and hours/day into a
            realistic daily roadmap.
          </p>
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

      {/* (Optional) MODE CHIPS – hidden on Home for now */}
      {showModes && (
        <div className="mentor-panel__modes">
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
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

      {/* PLAN PREVIEW (single bubble) */}
      <div className="mentor-panel__messages">
        {planPreview ? (
          <div className="mentor-panel__message mentor-panel__message--assistant">
            <div className="mentor-panel__bubble">
              {planPreview.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ) : !isLoading ? (
          <div className="mentor-panel__message mentor-panel__message--assistant">
            <div className="mentor-panel__bubble mentor-panel__bubble--placeholder">
              I’ll use your Maths &amp; Science targets and hours from the left
              to build a roadmap preview here. Once you’re happy, tap{" "}
              <strong>“Show my study plan”</strong> to see the full schedule.
            </div>
          </div>
        ) : null}

        {isLoading && (
          <div className="mentor-panel__message mentor-panel__message--assistant">
            <div className="mentor-panel__bubble mentor-panel__bubble--loading">
              Typing…
            </div>
          </div>
        )}
      </div>

      {/* TWEAK INPUT – small, secondary */}
      <div className="mentor-panel__input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Want tweaks? Tell me what to adjust — e.g. ‘more revision days’, ‘focus Trigonometry & Light first’…"
          rows={2}
        />
        <button
          type="button"
          className="mentor-panel__send-btn"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? "Updating..." : "Update plan"}
        </button>
      </div>
    </div>
  );
};
