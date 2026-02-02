import React from "react";

type HumanGradeCoachViewProps = {
  tutorObj?: any;
  hintLevel: number;
  onNextHint?: () => void;
  variantLabel?: string;
  compact?: boolean;
};

export const HumanGradeCoachView: React.FC<HumanGradeCoachViewProps> = ({
  tutorObj,
  hintLevel,
  onNextHint,
  variantLabel,
  compact = false,
}) => {
  if (!tutorObj || typeof tutorObj !== "object") return null;

  const diagnosis = tutorObj.diagnosis;
  const socratic = tutorObj.socratic;
  const hint = tutorObj.hint_ladder;
  const board = tutorObj.board_steps_ms;
  const next = tutorObj.next;
  const hasAny = diagnosis || socratic || hint || board || next;
  if (!hasAny) return null;

  const mistakeTags = Array.isArray(diagnosis?.mistake_tags) ? diagnosis.mistake_tags : [];
  const hintText = typeof hint?.hint === "string" ? hint.hint : "";
  const hintWarning = typeof hint?._warning === "string" ? hint._warning : "";
  const hintBusy = Boolean(hint?._busy);
  const canAdvance = typeof hint?._can_advance === "boolean" ? hint._can_advance : Boolean(onNextHint);
  const showSingleHintNote = Boolean(hint?._single_hint_note);
  const steps = Array.isArray(board?.steps) ? board.steps : [];
  const deductions = Array.isArray(board?.deductions) ? board.deductions : [];
  const totalMarks = Number(board?.total_marks);

  const containerStyle = compact
    ? { marginTop: 10 }
    : {
        borderRadius: 12,
        padding: "10px 12px",
        border: "1px solid rgba(0,0,0,0.08)",
        background: "rgba(0,0,0,0.03)",
      };

  return (
    <details style={containerStyle} open={false}>
      <summary style={{ cursor: "pointer", fontWeight: compact ? 700 : 800 }}>
        Human-grade Coach View
      </summary>
      <div style={{ marginTop: 8, display: "grid", gap: compact ? 12 : 10 }}>
        {diagnosis ? (
          <div style={compact ? { padding: "8px 10px", borderRadius: 10, background: "rgba(0,0,0,0.04)" } : {}}>
            <div style={{ fontWeight: compact ? 700 : 800, marginBottom: 4 }}>Diagnosis</div>
            {mistakeTags.length ? (
              <div style={{ marginBottom: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {mistakeTags.map((tag: string, tagIdx: number) => (
                  <span
                    key={`${tag}-${tagIdx}`}
                    className={compact ? "mentor-panel__tag" : undefined}
                    style={
                      compact
                        ? undefined
                        : {
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "rgba(15,23,42,0.08)",
                            fontSize: 12,
                          }
                    }
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            {diagnosis.misconception_summary ? (
              <div style={{ marginBottom: 4 }}>{String(diagnosis.misconception_summary)}</div>
            ) : null}
            {diagnosis.confidence ? (
              <div style={{ fontSize: 12, opacity: compact ? 0.8 : 0.75 }}>
                Confidence: {String(diagnosis.confidence)}
              </div>
            ) : null}
          </div>
        ) : null}

        {socratic ? (
          <div style={compact ? { padding: "8px 10px", borderRadius: 10, background: "rgba(0,0,0,0.04)" } : {}}>
            <div style={{ fontWeight: compact ? 700 : 800, marginBottom: 4 }}>Socratic</div>
            {socratic.question ? (
              <div style={{ fontWeight: 700 }}>{String(socratic.question)}</div>
            ) : null}
            {socratic.expected_thought ? (
              <div style={{ fontSize: 12, opacity: 0.75 }}>{String(socratic.expected_thought)}</div>
            ) : null}
          </div>
        ) : null}

        {hint ? (
          <div style={compact ? { padding: "8px 10px", borderRadius: 10, background: "rgba(0,0,0,0.04)" } : {}}>
            <div style={{ fontWeight: compact ? 700 : 800, marginBottom: 4 }}>Hint ladder</div>
            {variantLabel ? (
              <div style={{ fontSize: 10, opacity: 0.55, marginBottom: 4 }}>
                Variant: {variantLabel}
              </div>
            ) : null}
            <div style={{ fontSize: 12, marginBottom: 6 }}>Level: {hintLevel}</div>
            {hintText ? <div>{hintText}</div> : null}
            {hintWarning ? (
              <div style={{ marginTop: 6, fontSize: 11, opacity: 0.7 }}>{hintWarning}</div>
            ) : null}
            {hintText && onNextHint ? (
              <button
                type="button"
                className={compact ? "mentor-panel__mode-chip" : "pill"}
                style={{ marginTop: 6 }}
                onClick={onNextHint}
                disabled={hintBusy || !canAdvance}
              >
                {hintBusy ? "Loading..." : "Next hint"}
              </button>
            ) : null}
            {showSingleHintNote ? (
              <div style={{ marginTop: 6, fontSize: 11, opacity: 0.7 }}>
                Only one hint available.
              </div>
            ) : null}
          </div>
        ) : null}

        {board ? (
          <div style={compact ? { padding: "8px 10px", borderRadius: 10, background: "rgba(0,0,0,0.04)" } : {}}>
            <div style={{ fontWeight: compact ? 700 : 800, marginBottom: 4 }}>Board steps</div>
            {Number.isFinite(totalMarks) ? (
              <div style={{ fontSize: 12, marginBottom: 6 }}>Total marks: {totalMarks}</div>
            ) : null}
            {steps.length ? (
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                {steps.map((s: any, stepIdx: number) => {
                  const line = String(s?.line || "");
                  const marks = Number(s?.marks);
                  if (!line) return null;
                  return (
                    <li key={stepIdx} style={{ marginBottom: 6 }}>
                      {line} {Number.isFinite(marks) ? <span>({marks} mark)</span> : null}
                    </li>
                  );
                })}
              </ol>
            ) : null}
            {deductions.length ? (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Deductions</div>
                {deductions.map((d: any, dIdx: number) => (
                  <div key={dIdx} style={{ fontSize: 12, marginBottom: 4 }}>
                    {String(d?.reason || "")}{" "}
                    {Number.isFinite(Number(d?.marks_lost)) ? `(-${Number(d.marks_lost)})` : ""}
                  </div>
                ))}
              </div>
            ) : null}
            {board.examiner_note ? (
              <div style={{ fontSize: 12, opacity: 0.75 }}>{String(board.examiner_note)}</div>
            ) : null}
          </div>
        ) : null}

        {next ? (
          <div style={compact ? { padding: "8px 10px", borderRadius: 10, background: "rgba(0,0,0,0.04)" } : {}}>
            <div style={{ fontWeight: compact ? 700 : 800, marginBottom: 4 }}>Next</div>
            {next.micro_drill ? <div style={{ marginBottom: 4 }}>{String(next.micro_drill)}</div> : null}
            {next.revision_hook ? (
              <div style={{ fontSize: 12, opacity: 0.75 }}>{String(next.revision_hook)}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </details>
  );
};
