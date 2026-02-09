import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import { useVibeMode } from "../context/vibeModeContext";
import { useSmartLearning } from "../engine/smartLearningStore";
import type { ChapterMeta } from "../engine/smartLearningTypes";
import { topicHubV2Content } from "../data/topicHubV2Full";
import { getAttempts } from "../services/practiceInsights";
import {
  getStrategyPlan,
  computeDailyMix,
  updateAndGetStreak,
} from "../services/planStorage";
import type { StrategyPlan } from "../services/strategyEngine";
import { normalizeTopicKey } from "../utils/topicResolver";

type SubjectTitle = "Maths" | "Science";

type PerformanceRow = {
  chapterId: string;
  subject: SubjectTitle;
  topicKey: string;
  topicName: string;
  attempted: number;
  correct: number;
  accuracy: number;
  matchScore: number;
  lastPracticedAt?: string;
};

type TopicMetaLight = {
  topicName?: string;
  subject?: string;
  weightagePercent?: number;
  approxWeightage?: number;
  tier?: string;
};

function toTopicMetaLight(value: unknown): TopicMetaLight {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const rec = value as Record<string, unknown>;
  return {
    topicName: typeof rec.topicName === "string" ? rec.topicName : undefined,
    subject: typeof rec.subject === "string" ? rec.subject : undefined,
    weightagePercent:
      typeof rec.weightagePercent === "number" ? rec.weightagePercent : undefined,
    approxWeightage:
      typeof rec.approxWeightage === "number" ? rec.approxWeightage : undefined,
    tier: typeof rec.tier === "string" ? rec.tier : undefined,
  };
}

function parseChapterId(chapterId: string): { grade: string; subject: SubjectTitle; topicKey: string } {
  const raw = String(chapterId || "");
  const match = raw.match(/^(\d+)-([^-]+)-(.+)$/);
  if (!match) {
    return { grade: "10", subject: "Maths", topicKey: normalizeTopicKey(raw) || "topic" };
  }
  const grade = String(match[1] || "10");
  const subject = String(match[2] || "Maths").toLowerCase().includes("science")
    ? "Science"
    : "Maths";
  const topicKey = normalizeTopicKey(String(match[3] || "")) || "topic";
  return { grade, subject, topicKey };
}

function displayTopic(topicKey: string): string {
  const rec = toTopicMetaLight((topicHubV2Content as Record<string, unknown>)[topicKey]);
  const topicName = String(rec.topicName || "").trim();
  if (topicName) return topicName;
  return String(topicKey || "topic")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function subjectMaxWeightage(subject: SubjectTitle): number {
  const values = Object.entries(topicHubV2Content)
    .map(([, rec]) => rec)
    .map((rec) => toTopicMetaLight(rec))
    .filter((rec) => String(rec.subject || "Maths") === subject)
    .map((rec) => Number(rec.weightagePercent ?? rec.approxWeightage ?? 0))
    .filter((v) => Number.isFinite(v) && v > 0);
  return values.length ? Math.max(...values) : 14;
}

function nowDayLabel(): string {
  try {
    return new Date().toLocaleDateString("en-US", { weekday: "long" });
  } catch {
    return "Today";
  }
}

export default function Dashboard() {
  const { profile, strategy } = useProfile();
  const navigate = useNavigate();
  const { mode, setMode } = useVibeMode();
  const { statsByChapter, getMatchScoreForChapter } = useSmartLearning();

  const planRecord = useMemo<StrategyPlan | null>(() => getStrategyPlan(), []);
  const mixItems = useMemo<string[]>(
    () => (planRecord ? computeDailyMix(planRecord) : []),
    [planRecord]
  );
  const [streak] = useState<number>(() => updateAndGetStreak());

  const attempts = useMemo(() => getAttempts(), []);

  const performanceRows = useMemo<PerformanceRow[]>(() => {
    const rows: PerformanceRow[] = [];
    const seen = new Set<string>();

    for (const [chapterId, stats] of Object.entries(statsByChapter || {})) {
      const parsed = parseChapterId(chapterId);
      const rec = toTopicMetaLight((topicHubV2Content as Record<string, unknown>)[parsed.topicKey]);
      const chapterMeta: ChapterMeta = {
        id: chapterId,
        grade: parsed.grade,
        subject: parsed.subject,
        topicKey: parsed.topicKey,
        name: displayTopic(parsed.topicKey),
        boardWeightage: Number(rec.weightagePercent ?? rec.approxWeightage ?? 0),
        tier:
          String(rec.tier || "high-roi") === "must-crack"
            ? "must-crack"
            : String(rec.tier || "high-roi") === "good-to-do"
            ? "good-to-do"
            : "high-roi",
      };
      const maxBoardWeightage = subjectMaxWeightage(parsed.subject);
      const matchScore = getMatchScoreForChapter(chapterMeta, maxBoardWeightage);
      const attempted = Number(stats.totalQuestionsAttempted || 0);
      const correct = Number(stats.totalQuestionsCorrect || 0);
      const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
      rows.push({
        chapterId,
        subject: parsed.subject,
        topicKey: parsed.topicKey,
        topicName: chapterMeta.name,
        attempted,
        correct,
        accuracy,
        matchScore,
        lastPracticedAt: stats.lastPracticedAt,
      });
      seen.add(`${parsed.subject}:${parsed.topicKey}`);
    }

    const attemptAgg = new Map<string, { attempted: number; correct: number; ts: number }>();
    for (const a of attempts) {
      const subject = String(a.subject || "maths").toLowerCase().includes("science")
        ? "Science"
        : "Maths";
      const topicKey = normalizeTopicKey(String(a.topicKey || a.topicName || "")) || "topic";
      const key = `${subject}:${topicKey}`;
      const prev = attemptAgg.get(key) || { attempted: 0, correct: 0, ts: 0 };
      prev.attempted += 1;
      if (a.correct) prev.correct += 1;
      prev.ts = Math.max(prev.ts, Number(a.timestamp || 0));
      attemptAgg.set(key, prev);
    }

    for (const [key, agg] of attemptAgg.entries()) {
      if (seen.has(key)) continue;
      const [subjectRaw, topicKey] = key.split(":");
      const subject = subjectRaw === "Science" ? "Science" : "Maths";
      const chapterId = `10-${subject}-${topicKey}`;
      const rec = toTopicMetaLight((topicHubV2Content as Record<string, unknown>)[topicKey]);
      const chapterMeta: ChapterMeta = {
        id: chapterId,
        grade: "10",
        subject,
        topicKey,
        name: displayTopic(topicKey),
        boardWeightage: Number(rec.weightagePercent ?? rec.approxWeightage ?? 0),
        tier:
          String(rec.tier || "high-roi") === "must-crack"
            ? "must-crack"
            : String(rec.tier || "high-roi") === "good-to-do"
            ? "good-to-do"
            : "high-roi",
      };
      const matchScore = getMatchScoreForChapter(chapterMeta, subjectMaxWeightage(subject));
      const accuracy = agg.attempted > 0 ? Math.round((agg.correct / agg.attempted) * 100) : 0;
      rows.push({
        chapterId,
        subject,
        topicKey,
        topicName: chapterMeta.name,
        attempted: agg.attempted,
        correct: agg.correct,
        accuracy,
        matchScore,
        lastPracticedAt: agg.ts > 0 ? new Date(agg.ts).toISOString() : undefined,
      });
    }

    rows.sort((a, b) => {
      const byMatch = b.matchScore - a.matchScore;
      if (byMatch !== 0) return byMatch;
      return b.attempted - a.attempted;
    });

    return rows.slice(0, 14);
  }, [statsByChapter, attempts, getMatchScoreForChapter]);

  const weakestTopicKey = useMemo(() => {
    const candidates = performanceRows.filter((r) => r.attempted >= 2);
    if (!candidates.length) {
      return normalizeTopicKey(String(planRecord?.dailyMix?.topicKey || "triangles")) || "triangles";
    }
    const sorted = [...candidates].sort((a, b) => a.accuracy - b.accuracy);
    return sorted[0]?.topicKey || "triangles";
  }, [performanceRows, planRecord]);

  if (!profile || !strategy) {
    return (
      <div className="page">
        <h2 className="title">Your Personal Dashboard</h2>
        <div className="card">
          <p>We need your study details to create a plan.</p>
          <button className="cta-btn" onClick={() => navigate("/onboarding")}>
            Fill My Study Details
          </button>
        </div>
      </div>
    );
  }

  const { studentClass, daysLeft, targetPercent, hoursPerDay } = profile;
  const { realisticMin, realisticMax, hoursPerDayRequired, effortStatus } = strategy;

  const effortMessage =
    effortStatus === "high"
      ? "You are putting in strong effort and can exceed your target with consistency."
      : effortStatus === "ok"
      ? "Your plan is realistic and achievable with regular study."
      : "Your daily effort is below what is needed. Increase hours or adjust target.";

  const gradeNum = String((studentClass || "").replace(/\D/g, "")) || "10";
  const dailyMixMinutes = mode === "zombie" ? 20 : 40;
  const dayLabel = nowDayLabel();
  const mixTitle = `Your ${dayLabel} Mix (${dailyMixMinutes} mins)`;

  return (
    <div className="page">
      <h2 className="title">Your Personal Dashboard</h2>

      {planRecord && mixItems.length > 0 && (
        <div className="card focus-card">
          <h3>{mixTitle}</h3>
          <ul className="mix-list">
            {mixItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>

          <div style={{ marginTop: 10, fontSize: "0.9rem", opacity: 0.86 }}>
            <strong>Streak:</strong> {streak} day{streak === 1 ? "" : "s"}
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700 }}>Energy Level:</span>
            <button
              type="button"
              className="pill"
              onClick={() => setMode("zombie")}
              style={{
                background: mode === "zombie" ? "rgba(30,41,59,0.92)" : undefined,
                color: mode === "zombie" ? "#fff" : undefined,
              }}
            >
              Low
            </button>
            <button
              type="button"
              className="pill"
              onClick={() => setMode("beast")}
              style={{
                background: mode === "beast" ? "rgba(30,41,59,0.92)" : undefined,
                color: mode === "beast" ? "#fff" : undefined,
              }}
            >
              High
            </button>
            <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>
              {mode === "zombie"
                ? "Low energy mode: short and lighter practice."
                : "High energy mode: full rigor and harder drills."}
            </span>
          </div>

          <div className="focus-cta-row" style={{ marginTop: 12 }}>
            <button
              className="cta-btn small"
              onClick={() =>
                navigate(
                  `/daily-mix/${gradeNum}/${planRecord.subject}?topic=${encodeURIComponent(weakestTopicKey)}`
                )
              }
            >
              Play Mix
            </button>
            <button
              className="cta-btn small"
              onClick={() => navigate(`/topic-hub/${gradeNum}/${planRecord.subject}`)}
            >
              Open TopicHub
            </button>
            <button
              className="cta-btn small"
              onClick={() => navigate(`/weekly-wrapped`)}
            >
              Weekly Wrapped
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Profile Snapshot</h3>
        <p>
          Class: <strong>{studentClass}</strong> <br />
          Target: <strong>{targetPercent}%</strong> <br />
          Days left: <strong>{daysLeft}</strong> <br />
          Hours/day: <strong>{hoursPerDay}</strong>
        </p>
      </div>

      <div className="card">
        <h3>Realistic Score Range</h3>
        <p>
          With your current pattern, you are heading toward:
          <br />
          <strong style={{ fontSize: "1.2rem" }}>
            {realisticMin}% - {realisticMax}%
          </strong>
        </p>
        <p className="subtitle">{effortMessage}</p>
        <p>
          To target <strong>{targetPercent}%</strong>, you need about
          <br />
          <strong>{hoursPerDayRequired} hours/day</strong> on average.
        </p>
      </div>

      <div className="card" data-testid="performance-matrix-card">
        <h3>Performance Matrix</h3>
        <p style={{ marginTop: 6, opacity: 0.8 }}>
          Topic-wise view of attempts, accuracy, and Match score.
        </p>

        {performanceRows.length === 0 ? (
          <p style={{ marginTop: 10, opacity: 0.8 }}>
            No performance data yet. Attempt a few HPQs or practice sets to unlock the matrix.
          </p>
        ) : (
          <div style={{ marginTop: 12, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 6px", borderBottom: "1px solid rgba(15,23,42,0.15)" }}>
                    Topic
                  </th>
                  <th style={{ textAlign: "left", padding: "8px 6px", borderBottom: "1px solid rgba(15,23,42,0.15)" }}>
                    Subject
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 6px", borderBottom: "1px solid rgba(15,23,42,0.15)" }}>
                    Attempted
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 6px", borderBottom: "1px solid rgba(15,23,42,0.15)" }}>
                    Accuracy
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 6px", borderBottom: "1px solid rgba(15,23,42,0.15)" }}>
                    Match
                  </th>
                  <th style={{ textAlign: "left", padding: "8px 6px", borderBottom: "1px solid rgba(15,23,42,0.15)" }}>
                    Last activity
                  </th>
                </tr>
              </thead>
              <tbody>
                {performanceRows.map((row) => (
                  <tr key={row.chapterId}>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid rgba(15,23,42,0.08)", fontWeight: 600 }}>
                      {row.topicName}
                    </td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid rgba(15,23,42,0.08)" }}>{row.subject}</td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid rgba(15,23,42,0.08)", textAlign: "right" }}>
                      {row.attempted}
                    </td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid rgba(15,23,42,0.08)", textAlign: "right" }}>
                      {row.accuracy}%
                    </td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid rgba(15,23,42,0.08)", textAlign: "right", fontWeight: 700 }}>
                      {row.matchScore}%
                    </td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid rgba(15,23,42,0.08)", opacity: 0.8 }}>
                      {row.lastPracticedAt ? new Date(row.lastPracticedAt).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
