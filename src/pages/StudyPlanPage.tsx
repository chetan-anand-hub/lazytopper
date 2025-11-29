// src/pages/StudyPlanPage.tsx
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  class10TopicTrendList,
  type TopicTier,
} from "../data/class10MathTopicTrends";
import {
  class10ScienceTopicTrendList,
} from "../data/class10ScienceTopicTrends";

type SubjectKey = "Maths" | "Science";

interface StudyPlanState {
  daysLeft?: number;
  mathTargetPercent?: number;
  scienceTargetPercent?: number;
  mathHoursPerDay?: number;
  scienceHoursPerDay?: number;
  weakMathChapters?: string[];
  weakScienceChapters?: string[];
}

type UITier = "must-crack" | "high-roi" | "good-to-do";

interface PlanRow {
  topicKey: string;
  topicLabel: string;
  tier: UITier;
  weightagePercent: number;
  hours: number;
}

const tierOrder: Record<UITier, number> = {
  "must-crack": 1,
  "high-roi": 2,
  "good-to-do": 3,
};

const tierMeta: Record<
  UITier,
  { label: string; emoji: string; chipBg: string; chipText: string }
> = {
  "must-crack": {
    label: "Must-crack",
    emoji: "🔥",
    chipBg: "#fee2e2",
    chipText: "#b91c1c",
  },
  "high-roi": {
    label: "High-ROI",
    emoji: "💎",
    chipBg: "#e0e7ff",
    chipText: "#3730a3",
  },
  "good-to-do": {
    label: "Good-to-do",
    emoji: "🌈",
    chipBg: "#e0f2fe",
    chipText: "#0369a1",
  },
};

const coerceTier = (t: any): UITier => {
  if (t === "must-crack" || t === "high-roi" || t === "good-to-do") return t;
  return "high-roi";
};

function buildSubjectPlan(
  subject: SubjectKey,
  totalHours: number
): PlanRow[] {
  const rawList =
    subject === "Maths"
      ? class10TopicTrendList
      : class10ScienceTopicTrendList;

  if (!totalHours || totalHours <= 0) return [];

  const rows = rawList.map((entry: any) => {
    const tier = coerceTier(entry.tier as TopicTier);
    const weight = Number(entry.weightagePercent ?? 0);
    const tierBoost =
      tier === "must-crack" ? 1.3 : tier === "high-roi" ? 1.1 : 0.9;

    return {
      topicKey: entry.topicKey ?? entry.topicName ?? "",
      topicLabel:
        subject === "Maths"
          ? entry.topicKey
          : entry.topicName ?? entry.topicKey,
      tier,
      weightagePercent: weight,
      effectiveWeight: weight * tierBoost,
    };
  });

  const positive = rows.filter((r) => r.effectiveWeight > 0);
  const totalEffective =
    positive.reduce((sum, r: any) => sum + r.effectiveWeight, 0) || 1;

  return positive
    .map((r: any) => ({
      topicKey: r.topicKey,
      topicLabel: r.topicLabel,
      tier: r.tier as UITier,
      weightagePercent: r.weightagePercent,
      hours: (r.effectiveWeight / totalEffective) * totalHours,
    }))
    .sort((a, b) => {
      const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
      if (tierDiff !== 0) return tierDiff;
      return (b.weightagePercent || 0) - (a.weightagePercent || 0);
    });
}

const StudyPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state || {}) as StudyPlanState;

  const grade = "10";
  const daysLeft = state.daysLeft ?? 90;
  const mathTargetPercent = state.mathTargetPercent ?? 80;
  const scienceTargetPercent = state.scienceTargetPercent ?? 80;
  const mathHoursPerDay = state.mathHoursPerDay ?? 1;
  const scienceHoursPerDay = state.scienceHoursPerDay ?? 1;

  const totalMathHours = daysLeft * mathHoursPerDay;
  const totalScienceHours = daysLeft * scienceHoursPerDay;

  const [activeSubject, setActiveSubject] = useState<SubjectKey>("Maths");

  const mathsPlan = useMemo(
    () => buildSubjectPlan("Maths", totalMathHours),
    [totalMathHours]
  );
  const sciencePlan = useMemo(
    () => buildSubjectPlan("Science", totalScienceHours),
    [totalScienceHours]
  );

  const handleBackToMentor = () => {
    navigate("/ai-mentor");
  };

  const handleOpenTopicHub = (subject: SubjectKey, topicLabel: string) => {
    const topicParam = encodeURIComponent(topicLabel);
    navigate(
      `/topic-hub?grade=${grade}&subject=${subject}&topic=${topicParam}`,
      {
        state: { from: location.pathname },
      }
    );
  };

  const handleOpenHPQ = (subject: SubjectKey, topicLabel: string) => {
    const topicParam = encodeURIComponent(topicLabel);
    navigate(
      `/highly-probable?grade=${grade}&subject=${subject}&topic=${topicParam}`,
      {
        state: { from: location.pathname },
      }
    );
  };

  const handleOpenMockBuilder = (subject: SubjectKey) => {
    const params = new URLSearchParams();
    params.set("grade", grade);
    params.set("subject", subject);
    navigate(`/mock-builder?${params.toString()}`, {
      state: { from: location.pathname },
    });
  };

  const renderPlanTable = (subject: SubjectKey, rows: PlanRow[]) => {
    const targetPercent =
      subject === "Maths" ? mathTargetPercent : scienceTargetPercent;
    const hoursPerDay =
      subject === "Maths" ? mathHoursPerDay : scienceHoursPerDay;
    const totalHours =
      subject === "Maths" ? totalMathHours : totalScienceHours;

    if (!rows.length || totalHours <= 0) {
      return (
        <div
          style={{
            borderRadius: 24,
            backgroundColor: "rgba(248,250,252,0.98)",
            border: "1px solid rgba(148,163,184,0.35)",
            padding: "18px 20px",
            marginTop: 16,
          }}
        >
          <p
            style={{
              fontSize: "0.85rem",
              color: "#475569",
            }}
          >
            To generate a roadmap, go back to <strong>AI Mentor</strong> and
            fill in <strong>days left</strong> + <strong>target %</strong> +
            <strong> hours/day</strong> for this subject.
          </p>
        </div>
      );
    }

    return (
      <section
        style={{
          marginTop: 18,
          borderRadius: 24,
          backgroundColor: "rgba(248,250,252,0.98)",
          border: "1px solid rgba(148,163,184,0.35)",
          boxShadow: "0 22px 50px rgba(148,163,184,0.32)",
          padding: "20px 22px 18px",
        }}
      >
        <h2
          style={{
            fontSize: "1.4rem",
            fontWeight: 650,
            color: "#020617",
            marginBottom: 4,
          }}
        >
          {subject} roadmap {targetPercent}% target
        </h2>
        <p
          style={{
            fontSize: "0.9rem",
            color: "#475569",
            marginBottom: 14,
          }}
        >
          Roughly{" "}
          <strong>
            {daysLeft} days × {hoursPerDay.toFixed(1)} hr/day
          </strong>{" "}
          ≈{" "}
          <strong>{totalHours.toFixed(0)} focussed hours</strong> that we want
          to distribute by board weightage and topic tier.
        </p>

        {/* Header row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2.2fr 1fr 1.2fr 2.2fr",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "#64748b",
            padding: "6px 10px",
            borderRadius: 14,
            backgroundColor: "#e5edff",
            marginBottom: 8,
          }}
        >
          <div>Chapter</div>
          <div>Tier</div>
          <div>Board wt.</div>
          <div style={{ textAlign: "right" }}>
            Recommended hours & actions
          </div>
        </div>

        {/* Rows */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {rows.map((row) => {
            const tMeta = tierMeta[row.tier];

            return (
              <div
                key={row.topicKey}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.2fr 1fr 1.2fr 2.2fr",
                  padding: "10px 10px",
                  borderRadius: 14,
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(226,232,240,0.9)",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#020617",
                  }}
                >
                  {row.topicLabel}
                </div>

                {/* Tier chip */}
                <div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: 999,
                      padding: "4px 10px",
                      backgroundColor: tMeta.chipBg,
                      color: tMeta.chipText,
                      fontSize: "0.78rem",
                      fontWeight: 600,
                    }}
                  >
                    <span>{tMeta.emoji}</span>
                    <span>{tMeta.label}</span>
                  </span>
                </div>

                {/* Weightage */}
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#475569",
                  }}
                >
                  ≈ {row.weightagePercent || "?"}% of paper
                </div>

                {/* Hours + actions */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    {row.hours.toFixed(1)} hrs
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleOpenTopicHub(subject, row.topicLabel)
                    }
                    style={{
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontSize: "0.78rem",
                      border: "1px solid rgba(59,130,246,0.8)",
                      backgroundColor: "#eef2ff",
                      color: "#1d4ed8",
                      cursor: "pointer",
                    }}
                  >
                    Study in TopicHub
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenHPQ(subject, row.topicLabel)}
                    style={{
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontSize: "0.78rem",
                      border: "1px solid rgba(147,51,234,0.7)",
                      backgroundColor: "#f5f3ff",
                      color: "#6d28d9",
                      cursor: "pointer",
                    }}
                  >
                    Practice HPQs
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenMockBuilder(subject)}
                    style={{
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontSize: "0.78rem",
                      border: "1px solid rgba(34,197,94,0.7)",
                      backgroundColor: "#ecfdf3",
                      color: "#15803d",
                      cursor: "pointer",
                    }}
                  >
                    Quick mock
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const chipsRowStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  };

  const chipStyle: React.CSSProperties = {
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: "0.78rem",
    backgroundColor: "#eef2ff",
    color: "#4338ca",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #e0f2ff 0, #dde7ff 30%, #e5edff 60%, #f1f5f9 100%)",
        paddingBottom: "80px",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "16px 16px 32px",
        }}
      >
        {/* Back to AI Mentor */}
        <button
          onClick={handleBackToMentor}
          style={{
            background: "none",
            border: "none",
            color: "#4b5563",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: 4,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: "1rem" }}>←</span>
          <span>Back to AI Mentor</span>
        </button>

        {/* Hero */}
        <section
          style={{
            borderRadius: 32,
            padding: "24px 24px 24px 28px",
            backgroundColor: "#ffffff",
            boxShadow: "0 24px 60px rgba(148,163,184,0.35)",
          }}
        >
          <h1
            style={{
              fontSize: "2.1rem",
              lineHeight: 1.15,
              fontWeight: 650,
              color: "#020617",
              marginBottom: 6,
            }}
          >
            Your personalised study plan
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              color: "#475569",
              lineHeight: 1.6,
            }}
          >
            Snapshot based on your current inputs. Later you’ll be able to save,
            download and edit this plan – and push it into a day-wise calendar.
          </p>

          {/* Chips row */}
          <div style={chipsRowStyle}>
            <span style={chipStyle}>
              {daysLeft} days left to boards
            </span>
            <span style={chipStyle}>
              Maths target: {mathTargetPercent}%
            </span>
            <span style={chipStyle}>
              Science target: {scienceTargetPercent}%
            </span>
            <span style={chipStyle}>
              Hours/day → Maths: {mathHoursPerDay}, Science:{" "}
              {scienceHoursPerDay}
            </span>
          </div>

          {/* Subject tabs */}
          <div
            style={{
              marginTop: 22,
              borderRadius: 999,
              backgroundColor: "#eef2ff",
              display: "flex",
            }}
          >
            {(["Maths", "Science"] as SubjectKey[]).map((subj) => {
              const active = subj === activeSubject;
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setActiveSubject(subj)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 999,
                    border: "none",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    backgroundColor: active ? "#4f46e5" : "transparent",
                    color: active ? "#f9fafb" : "#1e293b",
                    boxShadow: active
                      ? "0 10px 25px rgba(79,70,229,0.45)"
                      : "none",
                    transition: "all 0.15s ease-out",
                  }}
                >
                  {subj}
                </button>
              );
            })}
          </div>

          {/* Subject-specific content */}
          {activeSubject === "Maths"
            ? renderPlanTable("Maths", mathsPlan)
            : renderPlanTable("Science", sciencePlan)}
        </section>
      </div>
    </div>
  );
};

export default StudyPlanPage;
