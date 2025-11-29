// src/pages/MockPaper.tsx

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  predictedQuestions as predictedMathQuestions,
  type PredictedQuestion,
  type SectionKey,
} from "../data/predictedQuestions";
import { predictedQuestionsScience } from "../data/predictedQuestionsScience";
import { buildMockPaperFromBank } from "../utils/mockPaperEngine";
import {
  predictivePapers,
  type SubjectKey,
} from "../data/predictivePapers";
import "../print.css"; // print styles

const sectionOrder: SectionKey[] = ["A", "B", "C", "D", "E"];

const MockPaperPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ slug?: string }>();

  // 1️⃣ Which predictive paper are we showing? (slug from URL)
  const slugFromUrl = params.slug;
  const paperMeta =
    predictivePapers.find((p) => p.slug === slugFromUrl) ?? null;

  // Subject of this paper (default to Maths)
  const subject: SubjectKey = paperMeta?.subject ?? "Maths";

  // 2️⃣ Pick the right bank (Maths vs Science)
  const questionBank: PredictedQuestion[] =
    subject === "Science"
      ? (predictedQuestionsScience as unknown as PredictedQuestion[])
      : predictedMathQuestions;

  // 3️⃣ Build the mock paper from the engine
  const mockResult = React.useMemo(() => {
    return buildMockPaperFromBank({
      questionBank,
    });
  }, [questionBank]);

  const { sections, totalMarks } = mockResult;

  const handleBack = () => {
    navigate("/predictive-papers");
  };

  // 🖨️ Print / Download as PDF (browser print dialog)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        paddingBottom: 60,
      }}
    >
      {/* 👇 Everything we want in the PDF goes inside #print-area */}
      <div id="print-area">
        {/* Hero */}
        <header
          style={{
            borderRadius: 32,
            padding: "22px 22px 24px",
            background:
              "linear-gradient(135deg,rgba(15,23,42,0.98),rgba(37,99,235,0.95))",
            color: "#e5e7eb",
            boxShadow: "0 26px 70px rgba(15,23,42,0.7)",
            marginBottom: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.8rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  opacity: 0.85,
                  marginBottom: 6,
                }}
              >
                Class 10 • {subject} • Auto-mock Paper
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.8rem",
                  lineHeight: 1.2,
                }}
              >
                {paperMeta?.title ?? "AI-generated Predictive Paper"}
              </h1>
              <p
                style={{
                  marginTop: 8,
                  marginBottom: 0,
                  fontSize: "0.9rem",
                  maxWidth: 720,
                }}
              >
                Built from the{" "}
                <strong>high-probability question bank</strong>, tuned to ~80
                marks and CBSE A–E pattern. Use it as a{" "}
                <strong>full-length mock paper</strong>.
              </p>
            </div>

            <div
              className="mockpaper-controls" // print.css hides these in print view
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={handleBack}
                style={{
                  borderRadius: 999,
                  padding: "6px 14px",
                  border: "1px solid #e5e7eb",
                  background: "rgba(15,23,42,0.8)",
                  color: "#e5e7eb",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                ← Back to Predictive Papers hub
              </button>

              {/* Print / Download PDF button */}
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  borderRadius: 999,
                  padding: "7px 16px",
                  border: "none",
                  background: "#22c55e",
                  color: "#0f172a",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 12px 30px rgba(34,197,94,0.35)",
                }}
              >
                🖨️ Print paper / Download PDF
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: "0.8rem",
              opacity: 0.9,
            }}
          >
            Total marks in this auto-built paper:{" "}
            <strong>{totalMarks}</strong> (target: 80).{" "}
            {paperMeta?.vibe && (
              <>
                Vibe: <span>{paperMeta.vibe}</span>
              </>
            )}
          </div>
        </header>

        {/* Paper body */}
        <main
          style={{
            background: "#ffffff",
            borderRadius: 24,
            border: "1px solid #e5e7eb",
            padding: "20px 22px 26px",
            boxShadow: "0 20px 45px rgba(148,163,184,0.35)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 4,
              fontSize: "1rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#6b7280",
            }}
          >
            CBSE Board-style Mock Paper • {subject} • Class 10
          </h2>
          <p
            style={{
              marginTop: 0,
              marginBottom: 16,
              fontSize: "0.85rem",
              color: "#4b5563",
            }}
          >
            General instructions: Attempt all questions. Use log tables or
            calculators only if allowed by your school/board. Show all working
            clearly for 2, 3 and 4-mark questions.
          </p>

          {sectionOrder.map((sec) => {
            const section = sections[sec];
            if (!section || !section.questions.length) return null;

            return (
              <section key={sec} style={{ marginBottom: 18 }}>
                <h3
                  style={{
                    margin: "12px 0 6px",
                    fontSize: "0.98rem",
                    color: "#111827",
                  }}
                >
                  Section {sec} • {section.questions.length} questions ·{" "}
                  {section.sectionMarks} marks
                </h3>
                <ol
                  style={{
                    margin: "0 0 4px 1.2rem",
                    padding: 0,
                    fontSize: "0.9rem",
                    color: "#111827",
                  }}
                >
                  {section.questions.map((q: PredictedQuestion) => (
                    <li
                      key={q.id}
                      style={{
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 500,
                        }}
                      >
                        {q.questionText}
                      </div>
                      {q.options && q.options.length > 0 && (
                        <ul
                          style={{
                            margin: "4px 0 0 1.1rem",
                            padding: 0,
                            listStyle: "lower-alpha",
                            fontSize: "0.88rem",
                          }}
                        >
                          {q.options.map((opt, i) => (
                            <li key={i} style={{ marginBottom: 2 }}>
                              {opt}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div
                        style={{
                          marginTop: 2,
                          fontSize: "0.75rem",
                          color: "#6b7280",
                        }}
                      >
                        Topic: {q.topicKey} • Marks: {q.marks} • Difficulty:{" "}
                        {q.difficulty}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </main>
      </div>
      {/* 👆 end of #print-area */}
    </div>
  );
};

export default MockPaperPage;
