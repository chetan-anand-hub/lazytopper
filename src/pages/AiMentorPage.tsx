import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// Data imports for trends and HPQs remain unchanged
import {
  class10TopicTrendList,
  class10MathTopicTrends,
  type Class10TopicKey,
  type TopicTrendEntry,
  type TopicTier,
} from "../data/class10MathTopicTrends";

import {
  class10ScienceTopicTrendList,
  class10ScienceTopicTrends,
  type Class10ScienceTopicKey,
  type ScienceTopicTrend,
} from "../data/class10ScienceTopicTrends";

import {
  getHighlyProbableQuestions,
  type HPQSubject,
  type HPQTopicBucket,
  type HPQDifficulty,
} from "../data/highlyProbableQuestions";

// Import our new styles for improved UI
import "./aiMentorStyles.css";

// Type for subject (Maths or Science)
type SubjectOption = HPQSubject;

interface HPQStats {
  totalQuestions: number;
  approxMarks: number;
  byDifficulty: Partial<Record<HPQDifficulty, number>>;
}

const normalizeLabel = (s: string): string =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");

// Helper functions to build difficulty percentages
const buildDifficultyPercentFromTrends = (mix: any) => ({
  easyPercent: Number(mix?.Easy ?? 0),
  mediumPercent: Number(mix?.Medium ?? 0),
  hardPercent: Number(mix?.Hard ?? 0),
});

const buildDifficultyPercentFromCounts = (
  counts: Partial<Record<HPQDifficulty, number>> | undefined,
  totalQuestions: number
) => {
  if (!counts || totalQuestions <= 0) {
    return {
      easyPercent: 0,
      mediumPercent: 0,
      hardPercent: 0,
    };
  }

  const easy = counts.Easy ?? 0;
  const medium = counts.Medium ?? 0;
  const hard = counts.Hard ?? 0;
  const total = easy + medium + hard || totalQuestions;

  const toPct = (v: number) => Math.round((v / total) * 100);

  return {
    easyPercent: toPct(easy),
    mediumPercent: toPct(medium),
    hardPercent: toPct(hard),
  };
};

const AiMentorPage: React.FC = () => {
  const navigate = useNavigate();

  // Exam-level inputs
  const [daysLeft, setDaysLeft] = useState<number>(90);
  const [mathTargetPercent, setMathTargetPercent] = useState<number>(80);
  const [scienceTargetPercent, setScienceTargetPercent] = useState<number>(80);
  const [mathHoursPerDay, setMathHoursPerDay] = useState<number>(1);
  const [scienceHoursPerDay, setScienceHoursPerDay] = useState<number>(1);

  // Subject and chapter selections
  const [subject, setSubject] = useState<SubjectOption>("Maths");
  const [selectedMathTopicKey, setSelectedMathTopicKey] =
    useState<Class10TopicKey | "">("");
  const [selectedScienceTopicName, setSelectedScienceTopicName] =
    useState<string>("");

  const difficultyMix =
    subject === "Maths"
      ? class10MathTopicTrends.difficultyDistributionPercent
      : class10ScienceTopicTrends.difficultyDistributionPercent;

  const mathTopicOptions: TopicTrendEntry[] = class10TopicTrendList;
  const scienceTopicOptions: ScienceTopicTrend[] = class10ScienceTopicTrendList;

  // Current chapter trend snapshot
  const currentTrend = useMemo(() => {
    if (subject === "Maths") {
      if (!selectedMathTopicKey) return undefined;
      const entry = mathTopicOptions.find(
        (t) => t.topicKey === selectedMathTopicKey
      );
      if (!entry) return undefined;
      return {
        subject: "Maths" as SubjectOption,
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
        subject: "Science" as SubjectOption,
        topicKey: entry.topicKey as Class10ScienceTopicKey,
        topicLabel: entry.topicName,
        weightagePercent: entry.weightagePercent,
        tier: entry.tier,
        summary: summaryFromConcepts,
      };
    }
  }, [subject, selectedMathTopicKey, selectedScienceTopicName, mathTopicOptions, scienceTopicOptions]);

  // HPQ lookup
  const hpqBucket: HPQTopicBucket | undefined = useMemo(() => {
    if (subject === "Maths") {
      if (!selectedMathTopicKey) return undefined;
      const keyNorm = normalizeLabel(selectedMathTopicKey);
      const buckets = getHighlyProbableQuestions("Maths");
      return buckets.find((b) => normalizeLabel(b.topic) === keyNorm) || undefined;
    } else {
      if (!selectedScienceTopicName) return undefined;
      const nameNorm = normalizeLabel(selectedScienceTopicName);
      const buckets = getHighlyProbableQuestions("Science");
      return buckets.find((b) => normalizeLabel(b.topic) === nameNorm) || undefined;
    }
  }, [subject, selectedMathTopicKey, selectedScienceTopicName]);

  const hpqStats: HPQStats | null = useMemo(() => {
    if (!hpqBucket) return null;
    const totalQuestions = hpqBucket.questions.length;
    const approxMarks = hpqBucket.questions.reduce(
      (sum, q) => sum + (q.marks ?? 0),
      0
    );
    const byDifficulty: Partial<Record<HPQDifficulty, number>> = {};
    hpqBucket.questions.forEach((q) => {
      if (q.difficulty) {
        byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] ?? 0) + 1;
      }
    });
    return { totalQuestions, approxMarks, byDifficulty };
  }, [hpqBucket]);

  // Build the planner payload for preview
  const planningPayload = useMemo(() => {
    const targetPercent =
      subject === "Maths" ? mathTargetPercent : scienceTargetPercent;
    const totalDailyHours = mathHoursPerDay + scienceHoursPerDay;
    const mainChapterKey =
      subject === "Maths"
        ? (selectedMathTopicKey as string) || ""
        : (currentTrend?.topicKey as string) || "";
    const mainChapterName =
      subject === "Maths"
        ? (selectedMathTopicKey as string) || ""
        : selectedScienceTopicName || "";
    const trendMeta = currentTrend
      ? {
          tier: (currentTrend.tier ?? "good-to-do") as TopicTier,
          weightagePercent: currentTrend.weightagePercent ?? 0,
          difficultyMix: buildDifficultyPercentFromTrends(difficultyMix),
          summaryTips: currentTrend.summary ?? "",
        }
      : null;
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
              (hpqBucket.defaultTier as TopicTier) ||
              (currentTrend?.tier ?? "good-to-do"),
          }
        : null;
    const topicForUrl = mainChapterName || mainChapterKey || "";
    const encodedTopic = topicForUrl ? encodeURIComponent(topicForUrl) : undefined;
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
      classLevel: "10" as const,
      board: "CBSE" as const,
      daysLeft,
      targetPercent,
      hoursPerDay: {
        total: totalDailyHours,
        maths: mathHoursPerDay,
        science: scienceHoursPerDay,
      },
      mainChapterKey,
      mainChapterName,
      weakChapters: [] as string[],
      trendMeta,
      hpqSummary,
      links,
    };
  }, [subject, daysLeft, mathTargetPercent, scienceTargetPercent, mathHoursPerDay, scienceHoursPerDay, selectedMathTopicKey, selectedScienceTopicName, currentTrend, difficultyMix, hpqBucket, hpqStats]);

  // Navigate to the study plan page
  const handleOpenStudyPlan = () => {
    navigate("/study-plan", {
      state: {
        daysLeft,
        mathTargetPercent,
        scienceTargetPercent,
        mathHoursPerDay,
        scienceHoursPerDay,
        weakMathChapters: [] as string[],
        weakScienceChapters: [] as string[],
      },
    });
  };

  // NOTE: difficultyLabel, totalDailyHours and focusSubjectHours were
  // previously defined here but never used. They have been removed to
  // avoid TypeScript "declared but never read" warnings.

  return (
    <div className="mentor-page">
      <div className="ai-mentor-header">
        <h1>AI Mentor – Smart Study Planner</h1>
        <p className="ai-mentor-tagline">
          Planner mode only (for now). You tell it <strong>targets, days left and hours/day</strong>; it sends you chapter‑wise hours and next‑step nudges.
        </p>
      </div>

      {/* Board exam snapshot */}
      <div className="mentor-card mentor-board-card">
        <h2>Board exam snapshot</h2>
        <p className="ai-mentor-hint">We'll later auto‑fetch days left from CBSE. For now you can tweak it manually.</p>
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
            onChange={(e) => setMathTargetPercent(Number(e.target.value) || 0)}
          />
        </label>
        <label>
          <span>Science target %</span>
          <input
            type="number"
            min={40}
            max={100}
            value={scienceTargetPercent}
            onChange={(e) => setScienceTargetPercent(Number(e.target.value) || 0)}
          />
        </label>
        <label>
          <span>Maths hours / day</span>
          <input
            type="number"
            step="0.5"
            min={0.5}
            max={8}
            value={mathHoursPerDay}
            onChange={(e) => setMathHoursPerDay(Number(e.target.value) || 0.5)}
          />
        </label>
        <label>
          <span>Science hours / day</span>
          <input
            type="number"
            step="0.5"
            min={0.5}
            max={8}
            value={scienceHoursPerDay}
            onChange={(e) => setScienceHoursPerDay(Number(e.target.value) || 0.5)}
          />
        </label>
      </div>

      {/* Subject selector */}
      <div className="mentor-card">
        <h2>Choose your subject</h2>
        <div className="mentor-subject-row">
          {(["Maths", "Science"] as SubjectOption[]).map((subj) => (
            <button
              key={subj}
              type="button"
              className={
                "pill-button" + (subject === subj ? " pill-button--active" : "")
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

      {/* Chapter selector */}
      <div className="mentor-card">
        <h2>Pick a chapter to focus</h2>
        {subject === "Maths" ? (
          <select
            className="mentor-select"
            value={selectedMathTopicKey}
            onChange={(e) => setSelectedMathTopicKey(e.target.value as Class10TopicKey)}
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

      {/* Trend and HPQ snapshots */}
      <div className="mentor-trend-hpq">
        {/* Trend card */}
        <div className="mentor-card">
          <h2>Trend snapshot</h2>
          {!currentTrend ? (
            <p className="ai-mentor-hint">
              Pick a chapter to see weightage, tier and tips for today’s focus.
            </p>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Subject</div>
                  <div style={{ fontWeight: 600 }}>{currentTrend.subject}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Chapter</div>
                  <div style={{ fontWeight: 600 }}>{currentTrend.topicLabel}</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Tier</div>
                  <span className={`tier-chip ${currentTrend.tier ?? "good-to-do"}`}>
                    {currentTrend.tier ?? "—"}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Weightage (of 80)</div>
                  <div style={{ fontWeight: 600 }}>{currentTrend.weightagePercent}%</div>
                </div>
              </div>
              {currentTrend.summary && (
                <p style={{ fontSize: "0.9rem", marginBottom: 8 }}>
                  {currentTrend.summary}
                </p>
              )}
              <h3>Difficulty mix (full paper)</h3>
              <div className="difficulty-bar">
                <span className="easy" style={{ width: `${difficultyMix.Easy ?? 0}%` }} />
                <span className="medium" style={{ width: `${difficultyMix.Medium ?? 0}%` }} />
                <span className="hard" style={{ width: `${difficultyMix.Hard ?? 0}%` }} />
              </div>
            </>
          )}
        </div>
        {/* HPQ card */}
        <div className="mentor-card">
          <h2>HPQ coverage</h2>
          {!hpqBucket ? (
            <p className="ai-mentor-hint">
              We haven’t seeded HPQs for this exact label yet, but the AI Mentor can still plan using trends & mocks.
            </p>
          ) : (
            <>
              <p style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                Bucket: {hpqBucket.topic}{" "}
                {hpqBucket.defaultTier && (
                  <span className={`tier-chip ${hpqBucket.defaultTier}`}>{hpqBucket.defaultTier}</span>
                )}
              </p>
              {hpqStats && (
                <ul className="hpq-stats-list">
                  <li>
                    Questions: <strong>{hpqStats.totalQuestions}</strong>
                  </li>
                    
                  <li>
                    Approx. marks covered: <strong>{hpqStats.approxMarks}</strong>
                  </li>
                  <li>
                    Difficulty split: Easy {hpqStats.byDifficulty.Easy ?? 0}, Medium {hpqStats.byDifficulty.Medium ?? 0}, Hard {hpqStats.byDifficulty.Hard ?? 0}
                  </li>
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {/* Payload preview and CTA */}
      <div className="mentor-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>AI Mentor payload</h2>
          <button type="button" className="pill-button pill-button--active" onClick={handleOpenStudyPlan}>
            Generate full study plan
          </button>
        </div>
        <div className="payload-collapse">
          <details>
            <summary>Show API payload</summary>
            <pre style={{ overflowX: "auto" }}>{JSON.stringify(planningPayload, null, 2)}</pre>
          </details>
        </div>
      </div>
    </div>
  );
};

export default AiMentorPage;