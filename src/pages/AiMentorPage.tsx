// src/pages/AiMentorPage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  class10TopicTrendList,
  class10MathTopicTrends,
  type Class10TopicKey,
  type TopicTier,
} from "../data/class10MathTopicTrends";

import {
  class10ScienceTopicTrendList,
  class10ScienceTopicTrends,
  type Class10ScienceTopicKey,
} from "../data/class10ScienceTopicTrends";

import { getHighlyProbableQuestions } from "../data/highlyProbableQuestions";

import "./aiMentorStyles.css";
import { MentorPanel } from "../components/MentorPanel";

// Types
type SubjectOption = "Maths" | "Science";

interface HPQStats {
  totalQuestions: number;
  approxMarks: number;
  byDifficulty: Record<string, number>;
}

// Normalize labels for HPQ lookup
const normalizeLabel = (s: string): string =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");

// Difficulty % helpers
const buildDifficultyPercentFromTrends = (mix: any) => ({
  easyPercent: Number(mix?.Easy ?? 0),
  mediumPercent: Number(mix?.Medium ?? 0),
  hardPercent: Number(mix?.Hard ?? 0),
});

const buildDifficultyPercentFromCounts = (
  counts: Record<string, number> | undefined,
  totalQuestions: number
) => {
  if (!counts || totalQuestions <= 0) {
    return { easyPercent: 0, mediumPercent: 0, hardPercent: 0 };
  }

  const easy = counts.Easy ?? 0;
  const medium = counts.Medium ?? 0;
  const hard = counts.Hard ?? 0;
  const total = easy + medium + hard || totalQuestions;

  const pct = (v: number) => Math.round((v / total) * 100);

  return {
    easyPercent: pct(easy),
    mediumPercent: pct(medium),
    hardPercent: pct(hard),
  };
};

const AiMentorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Solve/Explain entry mode
  const state = location.state as any;

  if (state?.conceptId || state?.hpqQuestionId || state?.mode) {
    const pageSubject: "Maths" | "Science" = state.subject ?? "Maths";
    const pageChapter: string | undefined = state.topic;
    const fromPath: string | undefined = state.from;

    const defaultMode =
      state.mode ?? (state.hpqQuestionId ? "solve" : "explain");

    const initialStudentState = {
      grade: state.grade ?? 10,
      daysLeft: state.daysLeft,
      targetScore: state.targetPercent,
      mathTargetScore: state.mathTargetPercent,
      scienceTargetScore: state.scienceTargetPercent,
      mathHoursPerDay: state.mathHoursPerDay,
      scienceHoursPerDay: state.scienceHoursPerDay,
    };

    const pageContext = {
      grade: state.grade ?? 10, // ⭐ REQUIRED by MentorPanel
      subject: pageSubject,
      chapter: pageChapter,
    } as const;

    const handleBack = () => {
      if (fromPath) {
        // Smooth loop back to HPQ (or origin page)
        navigate(fromPath);
      } else {
        // Safe fallback if state.from is missing
        navigate(-1);
      }
    };

    return (
      <div className="mentor-modal">
        {/* Top strip for back + context when opened from HPQ / concept */}
        <div className="mentor-modal-header">
          <button
            type="button"
            className="mentor-back-button"
            onClick={handleBack}
          >
            ← Back to previous view
          </button>
          <div className="mentor-modal-context">
            <span>
              Class {pageContext.grade} • {pageSubject}
              {pageChapter ? ` • ${pageChapter}` : ""}
            </span>
            {state.hpqQuestionId && (
              <span className="mentor-modal-chip">
                HPQ #{state.hpqQuestionId}
              </span>
            )}
          </div>
        </div>

        <MentorPanel
          pageContext={pageContext}
          initialStudentState={initialStudentState}
          defaultMode={defaultMode as any}
          autoFirstPrompt={state.gpt_directive}
          showModes
        />
      </div>
    );
  }

  // ---------------------------------------
  // LOCAL STATES (Planner Mode)
  // ---------------------------------------

  const [daysLeft, setDaysLeft] = useState<number>(90);
  const [mathTargetPercent, setMathTargetPercent] = useState<number>(80);
  const [scienceTargetPercent, setScienceTargetPercent] =
    useState<number>(80);
  const [mathHoursPerDay, setMathHoursPerDay] = useState<number>(1);
  const [scienceHoursPerDay, setScienceHoursPerDay] = useState<number>(1);

  const [subject, setSubject] = useState<SubjectOption>("Maths");
  const [selectedMathTopicKey, setSelectedMathTopicKey] =
    useState<Class10TopicKey | "">("");
  const [selectedScienceTopicName, setSelectedScienceTopicName] =
    useState<string>("");

  const difficultyMix =
    subject === "Maths"
      ? class10MathTopicTrends.difficultyDistributionPercent
      : class10ScienceTopicTrends.difficultyDistributionPercent;

  const mathTopicOptions = class10TopicTrendList;
  const scienceTopicOptions = class10ScienceTopicTrendList;

  // ---------------------------------------
  // Trend snapshot
  // ---------------------------------------
  const currentTrend = useMemo(() => {
    if (subject === "Maths") {
      if (!selectedMathTopicKey) return undefined;

      const entry = mathTopicOptions.find(
        (t) => t.topicKey === selectedMathTopicKey
      );
      if (!entry) return undefined;

      return {
        subject: "Maths",
        topicKey: entry.topicKey,
        topicLabel: entry.topicKey,
        weightagePercent: entry.weightagePercent,
        tier: entry.tier,
        summary: entry.summary,
      };
    } else {
      if (!selectedScienceTopicName) return undefined;

      const entry = scienceTopicOptions.find(
        (t) => t.topicName === selectedScienceTopicName
      );
      if (!entry) return undefined;

      const summaryFromConcepts = entry.concepts
        ?.map((c) => c.summary_and_exam_tips)
        .join(" ");

      return {
        subject: "Science",
        topicKey: entry.topicKey as Class10ScienceTopicKey,
        topicLabel: entry.topicName,
        weightagePercent: entry.weightagePercent,
        tier: entry.tier,
        summary: summaryFromConcepts,
      };
    }
  }, [
    subject,
    selectedMathTopicKey,
    selectedScienceTopicName,
    mathTopicOptions,
    scienceTopicOptions,
  ]);

  // ---------------------------------------
  // HPQ lookup
  // ---------------------------------------
  const hpqBucket = useMemo(() => {
    if (subject === "Maths") {
      if (!selectedMathTopicKey) return undefined;
      const keyNorm = normalizeLabel(selectedMathTopicKey);
      return getHighlyProbableQuestions("Maths").find(
        (b) => normalizeLabel(b.topic) === keyNorm
      );
    } else {
      if (!selectedScienceTopicName) return undefined;
      const nameNorm = normalizeLabel(selectedScienceTopicName);
      return getHighlyProbableQuestions("Science").find(
        (b) => normalizeLabel(b.topic) === nameNorm
      );
    }
  }, [subject, selectedMathTopicKey, selectedScienceTopicName]);

  // ---------------------------------------
  // HPQ Stats
  // ---------------------------------------
  const hpqStats: HPQStats | null = useMemo(() => {
    if (!hpqBucket) return null;

    const totalQuestions = hpqBucket.questions.length;
    const approxMarks = hpqBucket.questions.reduce(
      (sum, q) => sum + (q.marks ?? 0),
      0
    );

    const byDifficulty: Record<string, number> = {};
    hpqBucket.questions.forEach((q) => {
      if (q.difficulty) {
        byDifficulty[q.difficulty] =
          (byDifficulty[q.difficulty] ?? 0) + 1;
      }
    });

    return { totalQuestions, approxMarks, byDifficulty };
  }, [hpqBucket]);

  // ---------------------------------------
  // Planner Payload
  // ---------------------------------------
  const planningPayload = useMemo(() => {
    const targetPercent =
      subject === "Maths" ? mathTargetPercent : scienceTargetPercent;

    const totalDailyHours = mathHoursPerDay + scienceHoursPerDay;

    const mainChapterKey =
      subject === "Maths"
        ? selectedMathTopicKey || ""
        : currentTrend?.topicKey || "";

    const mainChapterName =
      subject === "Maths"
        ? selectedMathTopicKey || ""
        : selectedScienceTopicName || "";

    const trendMeta =
      currentTrend && {
        tier: (currentTrend.tier ?? "good-to-do") as TopicTier,
        weightagePercent: currentTrend.weightagePercent ?? 0,
        difficultyMix: buildDifficultyPercentFromTrends(difficultyMix),
        summaryTips: currentTrend.summary ?? "",
      };

    const hpqSummary =
      hpqBucket && hpqStats
        ? {
            totalQuestions: hpqStats.totalQuestions,
            approxMarks: hpqStats.approxMarks,
            difficultySplit: buildDifficultyPercentFromCounts(
              hpqStats.byDifficulty,
              hpqStats.totalQuestions
            ),
            tier:
              hpqBucket.defaultTier ||
              currentTrend?.tier ||
              "good-to-do",
          }
        : null;

    const topicForUrl = mainChapterName || mainChapterKey || "";
    const encodedTopic = topicForUrl
      ? encodeURIComponent(topicForUrl)
      : undefined;

    const links = {
      topicHubUrl: encodedTopic
        ? `/topic-hub?grade=10&subject=${subject}&topic=${encodedTopic}`
        : undefined,
      hpqUrl: encodedTopic
        ? `/highly-probable?grade=10&subject=${subject}&topic=${encodedTopic}`
        : undefined,
      mockBuilderUrl: `/mock-builder?grade=10&subject=${subject}`,
      predictivePapersUrl: `/predictive-papers?grade=10&subject=${subject}`,
    };

    return {
      subject,
      classLevel: "10",
      board: "CBSE",
      daysLeft,
      targetPercent,
      hoursPerDay: {
        total: totalDailyHours,
        maths: mathHoursPerDay,
        science: scienceHoursPerDay,
      },
      mainChapterKey,
      mainChapterName,
      weakChapters: [],
      trendMeta,
      hpqSummary,
      links,
    };
  }, [
    subject,
    daysLeft,
    mathTargetPercent,
    scienceTargetPercent,
    mathHoursPerDay,
    scienceHoursPerDay,
    selectedMathTopicKey,
    selectedScienceTopicName,
    currentTrend,
    difficultyMix,
    hpqBucket,
    hpqStats,
  ]);

  const handleOpenStudyPlan = () => {
    navigate("/study-plan", {
      state: {
        daysLeft,
        mathTargetPercent,
        scienceTargetPercent,
        mathHoursPerDay,
        scienceHoursPerDay,
        weakMathChapters: [],
        weakScienceChapters: [],
      },
    });
  };

  // ---------------------------------------
  // UI (Planner mode)
  // ---------------------------------------
  return (
    <div className="mentor-page">
      <div className="ai-mentor-header">
        <h1>AI Mentor – Smart Study Planner</h1>
        <p className="ai-mentor-tagline">
          Planner mode only. Enter <strong>targets</strong>,{" "}
          <strong>days left</strong>, <strong>hours/day</strong>. Mentor
          generates chapter-wise plan.
        </p>
      </div>

      {/* --- Board snapshot card --- */}
      <div className="mentor-card mentor-board-card">
        <h2>Board exam snapshot</h2>
        <p className="ai-mentor-hint">
          Later this is auto-fetched from CBSE academic calendar.
        </p>

        <label>
          <span>Days left to boards</span>
          <input
            type="number"
            min={1}
            max={365}
            value={daysLeft}
            onChange={(e) => setDaysLeft(Number(e.target.value) || 1)}
          />
        </label>

        <label>
          <span>Maths target %</span>
          <input
            type="number"
            min={40}
            max={100}
            value={mathTargetPercent}
            onChange={(e) =>
              setMathTargetPercent(Number(e.target.value) || 0)
            }
          />
        </label>

        <label>
          <span>Science target %</span>
          <input
            type="number"
            min={40}
            max={100}
            value={scienceTargetPercent}
            onChange={(e) =>
              setScienceTargetPercent(Number(e.target.value) || 0)
            }
          />
        </label>

        <label>
          <span>Maths hours/day</span>
          <input
            type="number"
            step="0.5"
            min={0.5}
            max={8}
            value={mathHoursPerDay}
            onChange={(e) =>
              setMathHoursPerDay(Number(e.target.value) || 0.5)
            }
          />
        </label>

        <label>
          <span>Science hours/day</span>
          <input
            type="number"
            step="0.5"
            min={0.5}
            max={8}
            value={scienceHoursPerDay}
            onChange={(e) =>
              setScienceHoursPerDay(Number(e.target.value) || 0.5)
            }
          />
        </label>
      </div>

      {/* --- Subject selector card --- */}
      <div className="mentor-card">
        <h2>Choose your subject</h2>
        <div className="mentor-subject-row">
          {(["Maths", "Science"] as SubjectOption[]).map((subj) => (
            <button
              key={subj}
              type="button"
              className={
                "pill-button" +
                (subject === subj ? " pill-button--active" : "")
              }
              onClick={() => {
                setSubject(subj);
                setSelectedMathTopicKey("");
                setSelectedScienceTopicName("");
              }}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* --- Chapter selector --- */}
      <div className="mentor-card">
        <h2>Pick a chapter</h2>

        {subject === "Maths" ? (
          <select
            className="mentor-select"
            value={selectedMathTopicKey}
            onChange={(e) =>
              setSelectedMathTopicKey(e.target.value as Class10TopicKey)
            }
          >
            <option value="">— Select a Maths chapter —</option>
            {mathTopicOptions.map((entry) => (
              <option key={entry.topicKey} value={entry.topicKey}>
                {entry.topicKey} ({entry.weightagePercent}%)
              </option>
            ))}
          </select>
        ) : (
          <select
            className="mentor-select"
            value={selectedScienceTopicName}
            onChange={(e) => setSelectedScienceTopicName(e.target.value)}
          >
            <option value="">— Select a Science chapter —</option>
            {scienceTopicOptions.map((entry) => (
              <option key={entry.topicKey} value={entry.topicName}>
                {entry.topicName} ({entry.weightagePercent}%)
              </option>
            ))}
          </select>
        )}
      </div>

      {/* --- Trend + HPQ row --- */}
      <div className="mentor-trend-hpq">
        {/* LEFT CARD: Trend Snapshot */}
        <div className="mentor-card">
          <h2>Trend snapshot</h2>

          {!currentTrend ? (
            <p className="ai-mentor-hint">
              Select a chapter to view insights.
            </p>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Subject
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {currentTrend.subject}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Chapter
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {currentTrend.topicLabel}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Tier
                  </div>
                  <span
                    className={`tier-chip ${
                      currentTrend.tier ?? "good-to-do"
                    }`}
                  >
                    {currentTrend.tier ?? "—"}
                  </span>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Weightage
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {currentTrend.weightagePercent}%
                  </div>
                </div>
              </div>

              {currentTrend.summary && (
                <p style={{ fontSize: "0.9rem", marginBottom: 8 }}>
                  {currentTrend.summary}
                </p>
              )}

              <h3>Difficulty mix (full paper)</h3>
              <div className="difficulty-bar">
                <span
                  className="easy"
                  style={{
                    width: `${difficultyMix.Easy ?? 0}%`,
                  }}
                />
                <span
                  className="medium"
                  style={{
                    width: `${difficultyMix.Medium ?? 0}%`,
                  }}
                />
                <span
                  className="hard"
                  style={{
                    width: `${difficultyMix.Hard ?? 0}%`,
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* RIGHT CARD: HPQ */}
        <div className="mentor-card">
          <h2>HPQ coverage</h2>

          {!hpqBucket ? (
            <p className="ai-mentor-hint">
              No seeded HPQs yet for this label. Mentor will still plan
              using trends.
            </p>
          ) : (
            <>
              <p style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                Bucket: {hpqBucket.topic}{" "}
                {hpqBucket.defaultTier && (
                  <span
                    className={`tier-chip ${hpqBucket.defaultTier}`}
                  >
                    {hpqBucket.defaultTier}
                  </span>
                )}
              </p>

              {hpqStats && (
                <ul className="hpq-stats-list">
                  <li>
                    Questions:{" "}
                    <strong>{hpqStats.totalQuestions}</strong>
                  </li>
                  <li>
                    Approx. marks:{" "}
                    <strong>{hpqStats.approxMarks}</strong>
                  </li>
                  <li>
                    Difficulty split: Easy{" "}
                    {hpqStats.byDifficulty.Easy ?? 0}, Medium{" "}
                    {hpqStats.byDifficulty.Medium ?? 0}, Hard{" "}
                    {hpqStats.byDifficulty.Hard ?? 0}
                  </li>
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {/* --- PLANNER PAYLOAD + ACTION --- */}
      <div className="mentor-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>AI Mentor payload</h2>
          <button
            type="button"
            className="pill-button pill-button--active"
            onClick={handleOpenStudyPlan}
          >
            Generate full study plan
          </button>
        </div>

        <div className="payload-collapse">
          <details>
            <summary>Show API payload</summary>
            <pre style={{ overflowX: "auto" }}>
              {JSON.stringify(planningPayload, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};

export default AiMentorPage;
