// src/pages/AiMentorPage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

type SubjectOption = HPQSubject; // "Maths" | "Science"

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

// Helper to coerce difficulty mix from trends into {easyPercent, mediumPercent, hardPercent}
const buildDifficultyPercentFromTrends = (mix: any) => ({
  easyPercent: Number(mix?.Easy ?? 0),
  mediumPercent: Number(mix?.Medium ?? 0),
  hardPercent: Number(mix?.Hard ?? 0),
});

// Helper to convert HPQ difficulty counts into % mix
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

  // ---- Exam-level inputs ----
  const [daysLeft, setDaysLeft] = useState<number>(90);
  const [mathTargetPercent, setMathTargetPercent] = useState<number>(80);
  const [scienceTargetPercent, setScienceTargetPercent] = useState<number>(80);
  const [mathHoursPerDay, setMathHoursPerDay] = useState<number>(1);
  const [scienceHoursPerDay, setScienceHoursPerDay] = useState<number>(1);

  // ---- Subject + chapter focus (from trends/HPQ) ----
  const [subject, setSubject] = useState<SubjectOption>("Maths");

  // For Maths we use topicKey (e.g. "Real Numbers")
  const [selectedMathTopicKey, setSelectedMathTopicKey] =
    useState<Class10TopicKey | "">("");

  // For Science we use topicName (e.g. "Life Processes")
  const [selectedScienceTopicName, setSelectedScienceTopicName] =
    useState<string>("");

  const difficultyMix =
    subject === "Maths"
      ? class10MathTopicTrends.difficultyDistributionPercent
      : class10ScienceTopicTrends.difficultyDistributionPercent;

  const mathTopicOptions: TopicTrendEntry[] = class10TopicTrendList;
  const scienceTopicOptions: ScienceTopicTrend[] = class10ScienceTopicTrendList;

  // ---- Current chapter trend snapshot ----
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
  }, [
    subject,
    selectedMathTopicKey,
    selectedScienceTopicName,
    mathTopicOptions,
    scienceTopicOptions,
  ]);

  // ---- HPQ lookup (robust name matching) ----
  const hpqBucket: HPQTopicBucket | undefined = useMemo(() => {
    if (subject === "Maths") {
      if (!selectedMathTopicKey) return undefined;
      const keyNorm = normalizeLabel(selectedMathTopicKey);
      const buckets = getHighlyProbableQuestions("Maths");
      return (
        buckets.find((b) => normalizeLabel(b.topic) === keyNorm) || undefined
      );
    } else {
      if (!selectedScienceTopicName) return undefined;
      const nameNorm = normalizeLabel(selectedScienceTopicName);
      const buckets = getHighlyProbableQuestions("Science");
      return (
        buckets.find((b) => normalizeLabel(b.topic) === nameNorm) || undefined
      );
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

  // ---- AI PlannerMentorRequest-style payload preview ----
  const planningPayload = useMemo(() => {
    const targetPercent =
      subject === "Maths" ? mathTargetPercent : scienceTargetPercent;
    const totalDailyHours = mathHoursPerDay + scienceHoursPerDay;

    // Which chapter are we focusing on?
    const mainChapterKey =
      subject === "Maths"
        ? (selectedMathTopicKey as string) || ""
        : (currentTrend?.topicKey as string) || "";

    const mainChapterName =
      subject === "Maths"
        ? (selectedMathTopicKey as string) || ""
        : selectedScienceTopicName || "";

    // Trend meta (tier + wt. + difficulty + summary)
    const trendMeta = currentTrend
      ? {
          tier: (currentTrend.tier ?? "good-to-do") as TopicTier,
          weightagePercent: currentTrend.weightagePercent ?? 0,
          difficultyMix: buildDifficultyPercentFromTrends(difficultyMix),
          summaryTips: currentTrend.summary ?? "",
        }
      : null;

    // HPQ summary
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

    // Deep links into LazyTopper
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
      // We’ll wire weak chapter selection later – for now keep it empty
      weakChapters: [] as string[],

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

  // ---- Navigation to StudyPlan page ----
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

  // ---- Small helpers for UI labels ----
  const difficultyLabel = (key: keyof typeof difficultyMix): string => {
    switch (key) {
      case "Easy":
        return "Easy";
      case "Medium":
        return "Medium";
      case "Hard":
        return "Hard";
      default:
        return key;
    }
  };

  const totalDailyHours = mathHoursPerDay + scienceHoursPerDay;
  const focusSubjectHours =
    subject === "Maths" ? mathHoursPerDay : scienceHoursPerDay;

  return (
    <div className="ai-mentor-page">
      <div className="ai-mentor-header">
        <h1>AI Mentor – Smart Study Planner</h1>
        <p className="ai-mentor-tagline">
          Planner mode only (for now). You tell it{" "}
          <strong>targets, days left and hours/day</strong>; it sends you
          chapter-wise hours and next-step nudges.
        </p>
      </div>

      <div className="ai-mentor-layout">
        {/* LEFT: Inputs / controls */}
        <section className="ai-mentor-controls">
          {/* 0. Exam inputs */}
          <div className="ai-mentor-card ai-mentor-card--exam">
            <h2>0. Board exam snapshot</h2>
            <p className="ai-mentor-hint">
              We&apos;ll later auto-fetch days left from CBSE. For now you can
              tweak it manually.
            </p>
            <div className="ai-mentor-grid">
              <label className="ai-mentor-field">
                <span>Days left to boards</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={daysLeft}
                  onChange={(e) => setDaysLeft(Number(e.target.value) || 1)}
                />
              </label>
              <label className="ai-mentor-field">
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
              <label className="ai-mentor-field">
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
              <label className="ai-mentor-field">
                <span>Maths hours / day</span>
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
              <label className="ai-mentor-field">
                <span>Science hours / day</span>
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
          </div>

          {/* 1. Subject selector */}
          <div className="ai-mentor-card">
            <h2>1. Choose your subject</h2>
            <div className="pill-row">
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

          {/* 2. Chapter selector */}
          <div className="ai-mentor-card">
            <h2>2. Pick a chapter to focus</h2>
            {subject === "Maths" ? (
              <select
                className="ai-mentor-select"
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
                className="ai-mentor-select"
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

            {!currentTrend && (
              <p className="ai-mentor-hint">
                Pick any chapter to see weightage, tier and HPQ snapshot for
                today&apos;s focus.
              </p>
            )}
          </div>
        </section>

        {/* RIGHT: Snapshot + payload */}
        <section className="ai-mentor-summary">
          {/* Planner snapshot card – match home “sneak peek” */}
          <div className="ai-mentor-card ai-mentor-card--snapshot">
            <div className="snapshot-header-line">
              <span className="snapshot-kicker">
                Planner snapshot for {subject} • Class 10
              </span>
              <span className="snapshot-pill">
                {daysLeft} days left • {totalDailyHours.toFixed(1)} hr/day
              </span>
            </div>

            <ul className="snapshot-list">
              <li>
                ~60% hours → 🔥 <strong>must-crack</strong> chapters +
                currently weak topics.
              </li>
              <li>
                ~30% hours → 💎 <strong>high-ROI</strong> +{" "}
                <strong>revision</strong>.
              </li>
              <li>
                ~10% hours → 🌈 <strong>good-to-do / buffer</strong> +
                unexpected school tests.
              </li>
            </ul>

            <p className="snapshot-focus-line">
              Today’s focus:{" "}
              <strong>
                {currentTrend?.topicLabel ??
                  "Start with your top must-crack chapter"}
              </strong>{" "}
              — {focusSubjectHours.toFixed(1)} hr {subject} + HPQs + quick mock.
            </p>
          </div>

          {/* Trend + HPQ snapshot */}
          <div className="ai-mentor-card">
            <h2>Trend + HPQ snapshot</h2>

            {!currentTrend ? (
              <p className="ai-mentor-hint">
                Once you choose a chapter, I’ll show how important it is and how
                much of it is already covered in the HPQ bank.
              </p>
            ) : (
              <>
                <div className="trend-row">
                  <div>
                    <div className="trend-label">Subject</div>
                    <div className="trend-value">{currentTrend.subject}</div>
                  </div>
                  <div>
                    <div className="trend-label">Chapter</div>
                    <div className="trend-value">
                      {currentTrend.topicLabel}
                    </div>
                  </div>
                </div>

                <div className="trend-row">
                  <div>
                    <div className="trend-label">Tier</div>
                    <div className="trend-value trend-tier">
                      {currentTrend.tier ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="trend-label">Weightage (of 80)</div>
                    <div className="trend-value">
                      {currentTrend.weightagePercent}%
                    </div>
                  </div>
                </div>

                {currentTrend.summary && (
                  <p className="trend-summary">{currentTrend.summary}</p>
                )}

                <div className="difficulty-block">
                  <h3>Difficulty mix (full paper)</h3>
                  <ul className="difficulty-list">
                    {(Object.keys(
                      difficultyMix
                    ) as (keyof typeof difficultyMix)[])
                      .sort()
                      .map((key) => (
                        <li key={key}>
                          <span>{difficultyLabel(key)}</span>
                          <span>{difficultyMix[key]}%</span>
                        </li>
                      ))}
                  </ul>
                </div>

                <div className="hpq-block">
                  <h3>HPQ coverage for this chapter</h3>
                  {!hpqBucket ? (
                    <p className="ai-mentor-hint">
                      We haven’t seeded HPQs for this exact label yet, but the
                      AI Mentor can still plan using trends + mocks.
                    </p>
                  ) : (
                    <>
                      <p className="hpq-topic-line">
                        Bucket: <strong>{hpqBucket.topic}</strong>{" "}
                        {hpqBucket.defaultTier && (
                          <span className="hpq-tier-pill">
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
                            Approx. marks covered:{" "}
                            <strong>{hpqStats.approxMarks}</strong>
                          </li>
                          <li>
                            Difficulty split:&nbsp;
                            <span>
                              {(
                                Object.entries(
                                  hpqStats.byDifficulty
                                ) as [HPQDifficulty, number][]
                              )
                                .map(
                                  ([diff, count]) =>
                                    `${diff}: ${count ?? 0}`
                                )
                                .join("  |  ")}
                            </span>
                          </li>
                        </ul>
                      )}
                      <p className="ai-mentor-hint">
                        When we wire the AI backend, this bucket will be used to
                        pick &quot;must-do&quot; practice questions matching
                        your plan.
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Payload + CTA */}
          <div className="ai-mentor-card">
            <div className="ai-mentor-card-header">
              <h2>AI Mentor payload preview</h2>
              <button
                type="button"
                className="primary-pill-button"
                onClick={handleOpenStudyPlan}
              >
                Generate full study plan →
              </button>
            </div>

            <p className="ai-mentor-hint">
              This is the <strong>exact JSON</strong> we’ll send to the backend
              Planner Mentor in Phase&nbsp;1.
            </p>
            <pre className="ai-mentor-payload">
              {JSON.stringify(planningPayload, null, 2)}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AiMentorPage;
