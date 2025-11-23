import { useEffect, useState } from "react";
import type { TrigQuestion } from "../data/trigQuestions";
import { generateTrigQuiz } from "../utils/trigQuiz";
import { useNavigate } from "react-router-dom";

export default function TrigQuiz() {
  const [questions, setQuestions] = useState<TrigQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [finished, setFinished] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    startNewQuiz();
  }, []);

  const startNewQuiz = () => {
    const quiz = generateTrigQuiz(15);
    setQuestions(quiz);
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setShowExplanation(false);
    setFinished(false);
  };

  if (questions.length === 0) {
    return (
      <div className="page">
        <h2 className="title">Trigonometry Quiz</h2>
        <p className="subtitle">Loading your 15-question set…</p>
      </div>
    );
  }

  const current = questions[currentIndex];

  const handleCheck = () => {
    if (selectedOption === null) return;
    setShowExplanation(true);
    if (selectedOption === current.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex === questions.length - 1) {
      setFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    }
  };

  const progressText = `Q${currentIndex + 1} of ${questions.length}`;

  return (
    <div className="page">
      <h2 className="title">Trigonometry – 15Q Practice</h2>
      <p className="subtitle">
        PYQ-style MCQs on ratios, identities, standard values and heights &
        distances. New set every time you start again.
      </p>

      {/* Progress + score */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span>{progressText}</span>
          <span>
            Score: <strong>{score}</strong>
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 999,
            background: "#333",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
              height: "100%",
              background: "#29b87a",
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="card">
        <p
          style={{
            marginBottom: 12,
            fontWeight: 600,
          }}
        >
          {current.question}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {current.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === current.correctIndex;

            let bg = "#2e2e2e";
            if (showExplanation) {
              if (isCorrect) bg = "#29b87a"; // green
              else if (isSelected) bg = "#f55a42"; // red-ish
            } else if (isSelected) {
              bg = "#3467d6";
            }

            return (
              <button
                key={idx}
                onClick={() => !showExplanation && setSelectedOption(idx)}
                style={{
                  textAlign: "left",
                  border: "none",
                  borderRadius: 12,
                  padding: "10px 12px",
                  background: bg,
                  color: "#f1f1f1",
                  cursor: showExplanation ? "default" : "pointer",
                  fontSize: "0.95rem",
                }}
              >
                {String.fromCharCode(65 + idx)}. {opt}
              </button>
            );
          })}
        </div>

        {!showExplanation && (
          <button
            className="cta-btn"
            style={{ marginTop: 16 }}
            onClick={handleCheck}
            disabled={selectedOption === null}
          >
            Check Answer
          </button>
        )}

        {showExplanation && (
          <>
            <p
              className="subtitle"
              style={{ marginTop: 12, marginBottom: 4 }}
            >
              Explanation:
            </p>
            <p style={{ fontSize: "0.9rem" }}>{current.explanation}</p>

            <button
              className="cta-btn"
              style={{ marginTop: 16 }}
              onClick={handleNext}
            >
              {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
            </button>
          </>
        )}
      </div>

      {/* Footer: New quiz & navigation */}
      <div className="card">
        {finished && (
          <p className="subtitle" style={{ marginBottom: 8 }}>
            You’ve completed this 15-question set. Try a fresh set to see new
            questions and practice again.
          </p>
        )}

        <button className="cta-btn" onClick={startNewQuiz}>
          New 15-Question Set
        </button>

        <button
          className="cta-btn"
          style={{ marginTop: 10, background: "#3467d6", color: "#fff" }}
          onClick={() => navigate("/chapter/trigonometry")}
        >
          Back to Trigonometry Hub
        </button>
      </div>
    </div>
  );
}
