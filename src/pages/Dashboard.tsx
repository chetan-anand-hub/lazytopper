import { useProfile } from "../context/ProfileContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { profile, strategy } = useProfile();
  const navigate = useNavigate();

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
