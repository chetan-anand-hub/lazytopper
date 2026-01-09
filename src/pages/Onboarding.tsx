import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useProfile } from "../context/ProfileContext";

// Central place to keep / update board exam dates
// TODO: update these when CBSE announces official dates.
const BOARD_EXAM_DATES: Record<"10" | "12", string> = {
  "10": "2026-03-01",
  "12": "2026-03-01",
};

function getDaysLeft(targetDateStr: string): number {
  const today = new Date();
  const target = new Date(targetDateStr + "T00:00:00");
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  // If date has passed, give a default 90 days placeholder
  return diffDays > 0 ? diffDays : 90;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { setProfileAndCompute } = useProfile();

  const [studentClass, setStudentClass] = useState<"10" | "12">("10");
  const [assessmentMode, setAssessmentMode] = useState<"diagnostic" | "marks">(
    "marks"
  );

  const [autoDaysLeft, setAutoDaysLeft] = useState<number>(() =>
    getDaysLeft(BOARD_EXAM_DATES["10"])
  );
  const [days, setDays] = useState<string>(() =>
    String(getDaysLeft(BOARD_EXAM_DATES["10"]))
  );

  const [target, setTarget] = useState("");
  const [hours, setHours] = useState("");

  // last three test marks (for option B)
  const [mark1, setMark1] = useState("");
  const [mark2, setMark2] = useState("");
  const [mark3, setMark3] = useState("");

  // recompute days left whenever class changes
  useEffect(() => {
    const d = getDaysLeft(BOARD_EXAM_DATES[studentClass]);
    setAutoDaysLeft(d);
    setDays(String(d));
  }, [studentClass]);

  const handleSubmit = () => {
    const daysLeft = Number(days);
    const targetPercent = Number(target);
    const hoursPerDay = Number(hours);

    if (!daysLeft || !targetPercent || !hoursPerDay) {
      alert("Please fill days, target % and hours/day with valid numbers 🙂");
      return;
    }

    let currentPercent: number | undefined = undefined;

    if (assessmentMode === "marks") {
      const m1 = Number(mark1);
      const m2 = Number(mark2);
      const m3 = Number(mark3);

      if (!m1 || !m2 || !m3) {
        alert(
          "Please enter your last three test/pre-board percentages for a better estimate 🙂"
        );
        return;
      }

      currentPercent = (m1 + m2 + m3) / 3;
    }

    // For diagnostic mode, currentPercent remains undefined for now.
    // Later we will plug in the diagnostic test score here.

    const profile: any = {
      studentClass,
      daysLeft,
      targetPercent,
      hoursPerDay,
    };

    if (typeof currentPercent === "number") {
      profile.currentPercent = currentPercent;
    }

    setProfileAndCompute(profile);
    navigate("/dashboard");
  };

  return (
    <div className="page">
      <h2 className="title center">Tell us about you</h2>

      {/* Class + boards countdown */}
      <div className="card">
        <label>Class</label>
        <select
          value={studentClass}
          onChange={(e) => setStudentClass(e.target.value as "10" | "12")}
        >
          <option value="10">Class 10 (CBSE)</option>
          <option value="12">Class 12 (CBSE)</option>
        </select>

        <p className="subtitle" style={{ marginTop: 12 }}>
          Approx. board exam date for Class {studentClass}:{" "}
          <strong>{BOARD_EXAM_DATES[studentClass]}</strong> <br />
          That’s around{" "}
          <strong>
            {autoDaysLeft} {autoDaysLeft === 1 ? "day" : "days"}
          </strong>{" "}
          from today. You can adjust if your school has a different schedule.
        </p>

        <label>Days left for your board exam (you can edit)</label>
        <input
          type="number"
          placeholder="e.g., 40"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        />
      </div>

      {/* Assessment mode – A/B choice */}
      <div className="card">
        <h3 style={{ marginBottom: 8 }}>How should we estimate your level?</h3>
        <p className="subtitle" style={{ marginBottom: 12 }}>
          Choose one. We’ll use this to decide how hard you need to push.
        </p>

        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <button
            className="pill-btn"
            style={{
              background:
                assessmentMode === "diagnostic" ? "#3467d6" : "#2e2e2e",
            }}
            onClick={() => setAssessmentMode("diagnostic")}
          >
            A. Quick Diagnostic Test
          </button>
          <button
            className="pill-btn"
            style={{
              background: assessmentMode === "marks" ? "#3467d6" : "#2e2e2e",
            }}
            onClick={() => setAssessmentMode("marks")}
          >
            B. Use Last 3 Test Marks
          </button>
        </div>

        {assessmentMode === "diagnostic" && (
          <p className="subtitle" style={{ marginTop: 4 }}>
            We’ll soon add a 20-question diagnostic based on PYQs to auto-detect
            your current level. For now, we’ll use your target & hours/day to
            build a plan. (Marks option gives a more accurate prediction.)
          </p>
        )}

        {assessmentMode === "marks" && (
          <>
            <label>Last test / pre-board % (latest)</label>
            <input
              type="number"
              placeholder="e.g., 72"
              value={mark1}
              onChange={(e) => setMark1(e.target.value)}
            />

            <label>Second last test %</label>
            <input
              type="number"
              placeholder="e.g., 68"
              value={mark2}
              onChange={(e) => setMark2(e.target.value)}
            />

            <label>Third last test %</label>
            <input
              type="number"
              placeholder="e.g., 65"
              value={mark3}
              onChange={(e) => setMark3(e.target.value)}
            />
          </>
        )}
      </div>

      {/* Target + hours */}
      <div className="card">
        <label>Your target percentage</label>
        <input
          type="number"
          placeholder="e.g., 85"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />

        <label>Hours you can study per day (honestly)</label>
        <input
          type="number"
          placeholder="e.g., 2"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
        />

        <button className="cta-btn" onClick={handleSubmit}>
          Generate My Strategy
        </button>
      </div>
    </div>
  );
}
