import  { useEffect, useState } from "react";
import { useProfile } from "../context/ProfileContext";
import { useNavigate } from "react-router-dom";
// Import plan helpers from the current directory.  Our project does not use a
// nested `services` folder, so reference the modules directly.  The
// `getStrategyPlan` call returns a structured study plan (StrategyPlan),
// not a wrapper record.  We compute the daily mix from the plan itself and
// derive the grade from the user profile.
import { getStrategyPlan, computeDailyMix, updateAndGetStreak } from "../services/planStorage";

// Pull in the StrategyPlan type from our strategy engine.  This helps us
// describe the shape of the plan returned by getStrategyPlan().
import type { StrategyPlan } from "../services/strategyEngine";

export default function Dashboard() {
  const { profile, strategy } = useProfile();
  const navigate = useNavigate();

  // ------------------------------------------------------------------
  // Local state for storing the saved strategy plan and daily mix
  // ------------------------------------------------------------------
  // Local state for the persisted strategy plan.  This stores the
  // structured plan itself (subject, planRows, dailyMix).  We no longer
  // expect a wrapper record with grade/subject properties because those
  // come from the user profile.
  const [planRecord, setPlanRecord] = useState<StrategyPlan | null>(null);
  const [mixItems, setMixItems] = useState<string[]>([]);
  const [streak, setStreak] = useState<number>(0);

  // On mount, load any persisted strategy plan and compute the day’s mix
  useEffect(() => {
    const record = getStrategyPlan();
    setPlanRecord(record);
    if (record) {
      // The plan itself contains the dailyMix; compute a user‑friendly mix
      // description from the plan directly.
      setMixItems(computeDailyMix(record));
      setStreak(updateAndGetStreak());
    }
  }, []);

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
  const { realisticMin, realisticMax, hoursPerDayRequired, effortStatus } =
    strategy;

  const effortMessage =
    effortStatus === "high"
      ? "🔥 You're putting in strong effort. You might even exceed your target if you stay consistent."
      : effortStatus === "ok"
      ? "💪 Good! Your plan is realistic and achievable with regular study."
      : "⚠️ Your daily effort is below what is needed. Consider increasing your hours or adjusting your target.";

  return (
    <div className="page">
      <h2 className="title">Your Personal Dashboard</h2>

      {/* Show today’s focus mix if a strategy plan exists */}
      {planRecord && mixItems.length > 0 && (
        <div className="card focus-card">
          <h3>🔥 Today's Focus Mix</h3>
          <ul className="mix-list">
            {mixItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
          <p style={{ marginTop: "8px", fontSize: "0.9rem", opacity: 0.8 }}>
            <strong>Streak:</strong> {streak} day{streak === 1 ? "" : "s"}
          </p>
          <div className="focus-cta-row">
            <button
              className="cta-btn small"
              onClick={() => {
                // Derive the grade number from the profile's studentClass
                const gradeNum = String((studentClass || "").replace(/\D/g, "")) || "10";
                navigate(`/daily-mix/${gradeNum}/${planRecord.subject}`);
              }}
            >
              ▶ Start Mix
            </button>
            <button
              className="cta-btn small"
              onClick={() => {
                const gradeNum = String((studentClass || "").replace(/\D/g, "")) || "10";
                navigate(`/topic-hub/${gradeNum}/${planRecord.subject}`);
              }}
            >
              📚 TopicHub
            </button>
            <button
              className="cta-btn small"
              onClick={() => {
                const gradeNum = String((studentClass || "").replace(/\D/g, "")) || "10";
                navigate(`/highly-probable/${gradeNum}/${planRecord.subject}`);
              }}
            >
              🧠 HPQ
            </button>
            <button
              className="cta-btn small"
              onClick={() => {
                const gradeNum = String((studentClass || "").replace(/\D/g, "")) || "10";
                navigate(`/mock-builder/${gradeNum}/${planRecord.subject}`);
              }}
            >
              📝 Mock
            </button>
            <button
              className="cta-btn small"
              onClick={() => navigate(`/weekly-wrapped`)}
            >
              📈 Weekly Wrap
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h3>🎓 Profile Snapshot</h3>
        <p>
          Class: <strong>{studentClass}</strong> <br />
          Target: <strong>{targetPercent}%</strong> <br />
          Days left: <strong>{daysLeft}</strong> <br />
          Hours/day: <strong>{hoursPerDay}</strong>
        </p>
      </div>

      <div className="card">
        <h3>🎯 Realistic Score Range</h3>
        <p>
          With your current study pattern, you're realistically headed towards:
          <br />
          <strong style={{ fontSize: "1.2rem" }}>
            {realisticMin}% – {realisticMax}%
          </strong>
        </p>
        <p className="subtitle">{effortMessage}</p>
        <p>
          To honestly target <strong>{targetPercent}%</strong>, you would need
          around
          <br />
          <strong>{hoursPerDayRequired} hours/day</strong> on average.
        </p>
      </div>
    </div>
  );
}
