// src/pages/Home.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function getDaysLeft(targetDate: string) {
  const today = new Date();
  const exam = new Date(targetDate);
  const diff = exam.getTime() - today.getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export default function Home() {
  const navigate = useNavigate();

  // For now we assume Class 10 Maths as default for the badge.
  const class10ExamDate = "2026-03-01";
  const daysLeft10 = getDaysLeft(class10ExamDate);

  // Mentor mini-form
  const [targetPercent, setTargetPercent] = useState(80);
  const [hoursPerDay, setHoursPerDay] = useState(2);

  const mentorMessage = useMemo(() => {
    const totalStudyHours = hoursPerDay * daysLeft10;
    const expectedPercent = Math.min(
      95,
      Math.round((totalStudyHours / 180) * 80)
    );
    return {
      expectedPercent,
      gap: targetPercent - expectedPercent,
    };
  }, [hoursPerDay, daysLeft10, targetPercent]);

  return (
    <div className="page">
      {/* HERO – pure marketing */}
      <section className="hero-card card">
        <div className="home-hero-layout">
          {/* LEFT: copy + CTAs */}
          <div className="home-hero-text">
            <p className="hero-tagline">
              Board exam prep for the lazy-but-smart.
            </p>
            <h1 className="hero-title">We plan. You execute. ✏️🏆</h1>
            <p className="hero-subtitle">
              LazyTopper mixes AI question prediction, PYQ brains and a chill
              mentor so you can hit 60–90% without living inside books 10 hours
              a day.
            </p>

            {/* Quick USP chips (what actually sells) */}
            <div className="home-feature-pills">
              <span className="feature-pill">📊 PYQ trend analysis</span>
              <span className="feature-pill">🤖 AI question predictor</span>
              <span className="feature-pill">📚 Smart practice sets</span>
              <span className="feature-pill">👨‍🏫 Lazy-friendly AI mentor</span>
            </div>

            <div className="hero-cta-row">
              <button
                className="cta-btn"
                onClick={() => navigate("/chapters")}
              >
                🚀 Start with Class 10 Maths
              </button>

              <button
                className="cta-btn ghost"
                onClick={() => {
                  const el = document.getElementById("how-it-works");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                👀 How does this work?
              </button>
            </div>

            {/* Days left pill */}
            <div className="days-left-pill">
              <div className="days-left-number">{daysLeft10}</div>
              <div className="days-left-text">
                days left for Class 10 Maths board (approx).
                <span className="days-left-sub">
                  Let’s use them like a topper, not a zombie. 👀
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: visual card – NOT trends, just all-in-one stack */}
          <div className="home-hero-visual">
            <div className="home-hero-visual-card">
              <div className="home-hero-chip">LAZYTOPPER STACK</div>

              <div className="home-hero-bars">
                <div className="bar bar-1" />
                <div className="bar bar-2" />
                <div className="bar bar-3" />
                <div className="bar bar-4" />
              </div>

              <p className="home-hero-visual-text">
                One tab that replaces your:
              </p>
              <ul className="home-hero-visual-list">
                <li>📊 Random PYQ spreadsheets</li>
                <li>📝 Hand-made “important chapters” lists</li>
                <li>📺 Endless YouTube video hopping</li>
                <li>📅 Messy study planners</li>
              </ul>
              <p className="home-hero-visual-foot">
                Trends, predictions, plan and mentor – all fused into one chill
                dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MEET YOUR MENTOR – where the real journey starts */}
      <section className="card mentor-card">
        <div className="mentor-layout">
          {/* LEFT: inputs + diagnostic paths */}
          <div className="mentor-left">
            <h2 className="title">Meet your AI mentor</h2>
            <p className="subtitle">
              Think of it as that nerdy senior who actually cares about your
              score and keeps dragging you towards it.
            </p>

            <div className="mentor-form">
              <div>
                <label htmlFor="targetPercent">Target percentage</label>
                <input
                  id="targetPercent"
                  type="number"
                  min={50}
                  max={100}
                  value={targetPercent}
                  onChange={(e) => setTargetPercent(Number(e.target.value))}
                />
              </div>

              <div>
                <label htmlFor="hoursPerDay">
                  Hours you can study per day
                </label>
                <input
                  id="hoursPerDay"
                  type="number"
                  min={1}
                  max={10}
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="mentor-output">
              <p>
                With <strong>{hoursPerDay} hr/day</strong> for{" "}
                <strong>{daysLeft10} days</strong>, a realistic target is around{" "}
                <strong>{mentorMessage.expectedPercent}%</strong> in Maths.
              </p>
              {mentorMessage.gap > 0 ? (
                <p className="mentor-warning">
                  To chase <strong>{targetPercent}%</strong>, you&apos;ll
                  probably need to add{" "}
                  <strong>
                    ~{Math.ceil(mentorMessage.gap / 5)} extra hr/day
                  </strong>{" "}
                  or cover more high-weight chapters.
                </p>
              ) : (
                <p className="mentor-ok">
                  Nice. Your current plan can realistically hit{" "}
                  <strong>{targetPercent}%</strong> if you stay consistent.
                </p>
              )}
            </div>

            <div className="mentor-actions">
              <p className="mentor-actions-title">Step 1: tell me who you are</p>
              <div className="mentor-actions-buttons">
                <button
                  className="cta-btn diagnostic-btn"
                  onClick={() => navigate("/login")} // later hook to real diagnostic
                >
                  ⚡ Take a 15Q smart diagnostic
                </button>
                <button
                  className="cta-btn ghost diagnostic-alt-btn"
                  onClick={() => navigate("/login")} // later: scores flow
                >
                  📝 Enter last 3 test scores
                </button>
              </div>
            </div>

            <button
              className="cta-btn"
              onClick={() => navigate("/chapters")}
            >
              Generate my personalised study plan →
            </button>
          </div>

          {/* RIGHT: simple, fun mentor illustration */}
          <div className="mentor-right">
            <div className="mentor-illustration">
              <div className="mentor-orb mentor-orb-main" />
              <div className="mentor-orb mentor-orb-small" />
              <div className="mentor-face">
                <span className="mentor-eyes">◕ ◕</span>
                <span className="mentor-mouth">▂</span>
              </div>
              <p className="mentor-illustration-text">Your LazyTopper mentor</p>
              <p className="mentor-illustration-sub">
                Watches your targets, time left and PYQ weightage — and nudges
                you whenever you start slacking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW TO USE – flow diagram / comic vibe */}
      <section id="how-it-works" className="card trends-card">
        <h2 className="title">How to use LazyTopper</h2>
        <p className="subtitle">
          Mini flowchart for lazy legends 👇 Use this once, then chill and just
          follow the nudges.
        </p>

        <div className="trends-grid ai-steps-grid">
          <div className="trends-stat ai-step">
            <div className="ai-step-badge">1</div>
            <h3>Pick your class & subject</h3>
            <p>
              Hit <strong>Start with Class 10 Maths</strong> (or go to Chapters)
              and choose what you&apos;re actually writing this year.
            </p>
          </div>

          <div className="trends-stat ai-step">
            <div className="ai-step-badge">2</div>
            <h3>Tell us your current level</h3>
            <p>
              Either take the <strong>15Q smart diagnostic</strong> or feed in
              your last 3 test scores – no judgment, only data.
            </p>
          </div>

          <div className="trends-stat ai-step">
            <div className="ai-step-badge">3</div>
            <h3>Get a marks-first plan</h3>
            <p>
              LazyTopper ranks chapters by PYQ weightage, time left and your
              level, then spits out a realistic daily roadmap.
            </p>
          </div>

          <div className="trends-stat ai-step">
            <div className="ai-step-badge">4</div>
            <h3>Practise & level up</h3>
            <p>
              Solve AI-generated, CBSE-vibe questions + mini mocks. Mentor keeps
              track and shouts when it&apos;s revision time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
