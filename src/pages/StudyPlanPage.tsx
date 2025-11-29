// src/pages/StudyPlanPage.tsx
import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  class10TopicTrendList,
  type TopicTier,
} from "../data/class10MathTopicTrends";
import {
  class10ScienceTopicTrendList,
  type ScienceTopicTrend,
} from "../data/class10ScienceTopicTrends";

interface StudyPlanState {
  daysLeft?: number;
  mathTargetPercent?: number;
  scienceTargetPercent?: number;
  mathHoursPerDay?: number;
  scienceHoursPerDay?: number;
  weakMathChapters?: string[];
  weakScienceChapters?: string[];
  // planText?: string | null; // fallback – optional now
}

const StudyPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as StudyPlanState;

  const {
    daysLeft = 90,
    mathTargetPercent = 80,
    scienceTargetPercent = 80,
    mathHoursPerDay = 1,
    scienceHoursPerDay = 1,
    weakMathChapters = [],
    weakScienceChapters = [],
  } = state;

  const totalMathHours = daysLeft * mathHoursPerDay;
  const totalScienceHours = daysLeft * scienceHoursPerDay;

  const tierMultiplier: Record<TopicTier, number> = {
    "must-crack": 1.2,
    "high-roi": 1.0,
    "good-to-do": 0.7,
  };

  // Maths distribution
  const mathRoadmap = useMemo(() => {
    const totalWeight = class10TopicTrendList.reduce(
      (sum, t) => sum + t.weightagePercent,
      0
    );

    const rows = class10TopicTrendList.map((topic) => {
      const weightShare = topic.weightagePercent / totalWeight;

      const tier = topic.tier ?? "good-to-do";
      const baseHours = totalMathHours * weightShare;

      const tierBoost = tierMultiplier[tier];
      const weakBoost = weakMathChapters.includes(topic.topicKey) ? 1.15 : 1;

      const hours = baseHours * tierBoost * weakBoost;

      return {
        name: topic.topicKey,
        tier,
        weightagePercent: topic.weightagePercent,
        hours,
      };
    });

    const totalRaw = rows.reduce((s, r) => s + r.hours, 0);
    const normalised = rows.map((r) => ({
      ...r,
      hours: (r.hours / totalRaw) * totalMathHours,
    }));

    return normalised.sort((a, b) => (b.tier === "must-crack" ? 1 : 0) - (a.tier === "must-crack" ? 1 : 0));
  }, [totalMathHours, weakMathChapters]);

  // Science distribution
  const scienceRoadmap = useMemo(() => {
    const topics = class10ScienceTopicTrendList;
    const totalWeight = topics.reduce(
      (sum, t) => sum + t.weightagePercent,
      0
    );

    const rows = topics.map((topic: ScienceTopicTrend) => {
      const weightShare = topic.weightagePercent / totalWeight;
      const tier = topic.tier;
      const baseHours = totalScienceHours * weightShare;

      const tierBoost = tierMultiplier[tier];
      const weakBoost = weakScienceChapters.includes(topic.topicName)
        ? 1.15
        : 1;

      const hours = baseHours * tierBoost * weakBoost;

      return {
        name: topic.topicName,
        tier,
        weightagePercent: topic.weightagePercent,
        hours,
      };
    });

    const totalRaw = rows.reduce((s, r) => s + r.hours, 0);
    const normalised = rows.map((r) => ({
      ...r,
      hours: (r.hours / totalRaw) * totalScienceHours,
    }));

    return normalised;
  }, [totalScienceHours, weakScienceChapters]);

  const formatHours = (h: number) => h.toFixed(1);

  const tierPill = (tier: TopicTier) => {
    if (tier === "must-crack") {
      return (
        <span className="tier-pill tier-pill--must">
          🔥 Must-crack
        </span>
      );
    }
    if (tier === "high-roi") {
      return (
        <span className="tier-pill tier-pill--high">
          💎 High-ROI
        </span>
      );
    }
    return (
      <span className="tier-pill tier-pill--good">
        🌈 Good-to-do
      </span>
    );
  };

  const handleBack = () => navigate(-1);

  const openTopicHub = (subject: "Maths" | "Science", topicName: string) => {
    navigate(
      `/topic-hub?grade=10&subject=${subject}&topic=${encodeURIComponent(
        topicName
      )}`
    );
  };

  const openHPQ = (subject: "Maths" | "Science", topicName: string) => {
    navigate(
      `/highly-probable?grade=10&subject=${subject}&topic=${encodeURIComponent(
        topicName
      )}`
    );
  };

  const openMockBuilder = (subject: "Maths" | "Science") => {
    navigate(`/mock-builder?grade=10&subject=${subject}`);
  };

  return (
    <div className="page study-plan-page">
      <section className="card study-plan-card">
        <button className="study-plan-back" onClick={handleBack}>
          ← Back to AI Mentor
        </button>

        <h1 className="title">Your personalised study plan</h1>
        <p className="subtitle">
          Snapshot based on your current inputs. Later you&apos;ll be able to
          save, download and edit this plan – and push it into a day-wise
          calendar.
        </p>

        {/* meta line */}
        <div className="plan-meta">
          <span>{daysLeft} days left to boards</span>
          <span>Maths target: {mathTargetPercent}%</span>
          <span>Science target: {scienceTargetPercent}%</span>
          <span>
            Hours/day → Maths: {mathHoursPerDay}, Science: {scienceHoursPerDay}
          </span>
        </div>

        {/* MATHS TABLE */}
        <div className="plan-block">
          <h2 className="plan-heading">
            Maths roadmap {mathTargetPercent}% target
          </h2>
          <p className="plan-subline">
            Roughly <strong>{daysLeft} days × {mathHoursPerDay} hr/day</strong>{" "}
            ≈ <strong>{totalMathHours.toFixed(0)} focussed hours</strong> that
            we want to distribute by board weightage.
          </p>

          <div className="plan-table">
            <div className="plan-table-header">
              <span>Chapter</span>
              <span>Tier</span>
              <span>Board wt.</span>
              <span>Recommended hours &amp; actions</span>
            </div>

            {mathRoadmap.map((row) => (
              <div key={row.name} className="plan-table-row">
                <span className="plan-chapter">{row.name}</span>
                <span>{tierPill(row.tier as TopicTier)}</span>
                <span>~{row.weightagePercent}% of paper</span>
                <span className="plan-actions">
                  <span className="plan-hours">
                    {formatHours(row.hours)} hrs
                  </span>
                  <button
                    className="chip-link"
                    onClick={() => openTopicHub("Maths", row.name)}
                  >
                    Study in TopicHub →
                  </button>
                  <button
                    className="chip-link chip-link--alt"
                    onClick={() => openHPQ("Maths", row.name)}
                  >
                    Practice HPQs →
                  </button>
                  <button
                    className="chip-link chip-link--alt2"
                    onClick={() => openMockBuilder("Maths")}
                  >
                    Quick mock →
                  </button>
                </span>
              </div>
            ))}
          </div>

          <p className="plan-note">
            As a starting point, cover the 🔥 must-crack chapters first, then 💎
            high-ROI, and only then 🌈 good-to-do. We’ll later break this into a
            day-by-day calendar with revision slots.
          </p>
        </div>

        {/* SCIENCE TABLE */}
        <div className="plan-block plan-block--science">
          <h2 className="plan-heading">
            Science roadmap {scienceTargetPercent}% target
          </h2>
          <p className="plan-subline">
            Roughly <strong>{daysLeft} days × {scienceHoursPerDay} hr/day</strong>{" "}
            ≈ <strong>{totalScienceHours.toFixed(0)} focussed hours</strong>{" "}
            that we want to distribute by board weightage.
          </p>

          <div className="plan-table">
            <div className="plan-table-header">
              <span>Chapter</span>
              <span>Tier</span>
              <span>Board wt.</span>
              <span>Recommended hours &amp; actions</span>
            </div>

            {scienceRoadmap.map((row) => (
              <div key={row.name} className="plan-table-row">
                <span className="plan-chapter">{row.name}</span>
                <span>{tierPill(row.tier)}</span>
                <span>~{row.weightagePercent}% of paper</span>
                <span className="plan-actions">
                  <span className="plan-hours">
                    {formatHours(row.hours)} hrs
                  </span>
                  <button
                    className="chip-link"
                    onClick={() => openTopicHub("Science", row.name)}
                  >
                    Study in TopicHub →
                  </button>
                  <button
                    className="chip-link chip-link--alt"
                    onClick={() => openHPQ("Science", row.name)}
                  >
                    Practice HPQs →
                  </button>
                  <button
                    className="chip-link chip-link--alt2"
                    onClick={() => openMockBuilder("Science")}
                  >
                    Quick mock →
                  </button>
                </span>
              </div>
            ))}
          </div>

          <p className="plan-note">
            Same logic here: 🔥 must-crack first (Life Processes, Light,
            Electricity…), then 💎 high-ROI and finally 🌈 good-to-do once your
            core is strong.
          </p>
        </div>
      </section>
    </div>
  );
};

export default StudyPlanPage;
