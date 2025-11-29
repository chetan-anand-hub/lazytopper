// src/pages/Home.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const goToClass10Maths = () => {
    navigate("/trends/10/Maths");
  };

  const goToMentor = () => {
    navigate("/mentor");
  };

  const goToTrends = () => {
    navigate("/trends/10/Maths");
  };

  const goToPredictivePapers = () => {
    navigate("/predictive-papers");
  };

  const goToMockBuilder = () => {
    navigate("/mock-builder");
  };

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const howItWorks = [
    {
      step: 1,
      title: "Tell us your board & target",
      body: "Class, subjects, target %, days left – that’s it.",
      emoji: "🎯",
    },
    {
      step: 2,
      title: "We read your PYQs",
      body: "AI scans 8–10 years of papers to find what actually shows up.",
      emoji: "📊",
    },
    {
      step: 3,
      title: "We build a marks-first roadmap",
      body: "Season 1: basics, Season 2: high-yield HPQs, Season 3: exam sprint.",
      emoji: "🗺️",
    },
    {
      step: 4,
      title: "You follow the nudges",
      body: "Daily tasks: HPQs, mini-mocks, revision. Mentor adjusts as you go.",
      emoji: "⚡",
    },
  ];

  return (
    <div className="home-page">
      <div className="home-container">
        {/* TOP NAV */}
        <header className="home-header">
          <div className="home-logo-group">
            <div className="home-logo-badge">LT</div>
            <span className="home-logo-text">LazyTopper</span>
          </div>

          <nav className="home-nav-links">
            <button
              type="button"
              onClick={() => scrollToId("how-it-works")}
              className="home-nav-link"
            >
              How it works
            </button>
            <button
              type="button"
              onClick={() => scrollToId("features")}
              className="home-nav-link"
            >
              Features
            </button>
            <button
              type="button"
              onClick={goToMentor}
              className="home-nav-cta"
            >
              Try AI mentor
            </button>
          </nav>
        </header>

        {/* HERO SECTION */}
        <section className="hero-section">
          <div className="hero-card">
            {/* Left */}
            <div className="hero-left">
              <p className="hero-eyebrow">
                CBSE 10 &amp; 12 • Maths + Science
              </p>

              <h1 className="hero-title">
                Beat the boards, <span>the lazy way.</span>
              </h1>

              <p className="hero-subtitle">
                LazyTopper turns <strong>years of PYQs + HPQs</strong> into a{" "}
                <strong>daily, marks-first study plan</strong> you can actually
                follow.
              </p>

              <div className="hero-chips">
                <span className="hero-chip hero-chip-orange">
                  🔥 Must-crack chapters first
                </span>
                <span className="hero-chip hero-chip-green">
                  📊 Based on real PYQ trends
                </span>
                <span className="hero-chip hero-chip-violet">
                  🎧 Plan that fits your vibe
                </span>
              </div>

              <div className="hero-form">
                <select className="hero-input hero-select">
                  <option>Class 10</option>
                  <option>Class 12</option>
                </select>
                <input
                  className="hero-input hero-text-input"
                  type="text"
                  placeholder="Phone or email"
                />
                <button type="button" className="hero-primary-btn">
                  Get my board plan
                </button>
              </div>

              <p className="hero-small-text">
                No spam. Only exam-prep nudges and your plan link.
              </p>

              <p className="hero-days-text">
                Approx <strong>90+ days</strong> left for CBSE boards.{" "}
                <span className="hero-days-highlight">
                  Start a 1-day streak today. ✨
                </span>
              </p>

              <div className="hero-links-row">
                <button
                  type="button"
                  onClick={() => scrollToId("how-it-works")}
                  className="hero-link hero-link-primary"
                >
                  See how it works ↓
                </button>
                <span className="hero-links-divider">|</span>
                <button
                  type="button"
                  onClick={goToClass10Maths}
                  className="hero-link"
                >
                  Jump into Class 10 Maths trends →
                </button>
              </div>
            </div>

            {/* Right “phone/dashboard” */}
            <div className="hero-right">
              <div className="hero-dashboard">
                <div className="hero-dashboard-header">
                  <span className="hero-dashboard-pill">
                    <span className="hero-dashboard-dot" />
                    Board mode
                  </span>
                  <span className="hero-dashboard-meta">Class 10 • Maths</span>
                </div>

                <div className="hero-dashboard-progress">
                  <div className="hero-progress-bar">
                    <div className="hero-progress-fill" />
                  </div>
                  <p className="hero-dashboard-text">
                    Target <strong>85%</strong> • <strong>82 days</strong> left
                  </p>
                  <p className="hero-dashboard-text hero-dashboard-text-muted">
                    Today: Trigonometry + Life Processes HPQs •{" "}
                    <strong>40-min mini-mock</strong>.
                  </p>
                </div>

                <div className="hero-dashboard-points">
                  <div className="hero-dashboard-point">
                    <div className="hero-dashboard-icon">🔍</div>
                    <p>AI reads your PYQs and tags must-crack chapters.</p>
                  </div>
                  <div className="hero-dashboard-point">
                    <div className="hero-dashboard-icon">📅</div>
                    <p>Daily doable tasks, not 5-hour fantasy timetables.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="how-section">
          <h2 className="section-title">How LazyTopper works</h2>
          <p className="section-subtitle">
            4 quick steps from “Where do I start?” to “Board-ready”.
          </p>

          <div className="how-grid">
            {howItWorks.map((card) => (
              <div key={card.step} className="how-card">
                <div className="how-card-top">
                  <div className="how-step-badge">{card.step}</div>
                  <div className="how-emoji">{card.emoji}</div>
                </div>
                <h3 className="how-title">{card.title}</h3>
                <p className="how-body">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FOUR PIECES */}
        <section id="features" className="pieces-section">
          <h2 className="section-title">Four pieces. One calm exam brain.</h2>
          <p className="section-subtitle">
            Topic trends, predictive papers, smart practice and an AI mentor –
            all talking to each other like one squad.
          </p>

          <div className="pieces-grid">
            {/* Trends */}
            <div className="piece-card">
              <div className="piece-meta">
                <span className="piece-tag">01 • Trends</span>
                <span>📡</span>
              </div>
              <h3 className="piece-title">TopicHub PYQ radar</h3>
              <p className="piece-body">
                10-year CBSE analysis that shows which chapters actually move
                your marks.
              </p>
              <button
                type="button"
                onClick={goToTrends}
                className="piece-btn piece-btn-blue"
              >
                View trends →
              </button>
            </div>

            {/* Predictive papers */}
            <div className="piece-card">
              <div className="piece-meta">
                <span className="piece-tag">02 • Predict</span>
                <span>📄</span>
              </div>
              <h3 className="piece-title">AI predictive papers</h3>
              <p className="piece-body">
                80-mark CBSE-style papers tuned to latest patterns and
                blueprints.
              </p>
              <button
                type="button"
                onClick={goToPredictivePapers}
                className="piece-btn piece-btn-violet"
              >
                See predicted papers →
              </button>
            </div>

            {/* Practice */}
            <div className="piece-card">
              <div className="piece-meta">
                <span className="piece-tag">03 • Practise</span>
                <span>🎮</span>
              </div>
              <h3 className="piece-title">Smart practice &amp; mocks</h3>
              <p className="piece-body">
                Build mini-mocks by topic, tier and difficulty – like a playlist
                for marks.
              </p>
              <button
                type="button"
                onClick={goToMockBuilder}
                className="piece-btn piece-btn-green"
              >
                Build a mock →
              </button>
            </div>

            {/* Mentor */}
            <div className="piece-card">
              <div className="piece-meta">
                <span className="piece-tag">04 • Plan</span>
                <span>🤖</span>
              </div>
              <h3 className="piece-title">AI mentor &amp; planner</h3>
              <p className="piece-body">
                Converts your target, days left and hours/day into a realistic{" "}
                <strong>marks-first roadmap</strong>.
              </p>
              <button
                type="button"
                onClick={goToMentor}
                className="piece-btn piece-btn-blue"
              >
                Open AI mentor →
              </button>
            </div>
          </div>
        </section>

        {/* SNEAK PEEK */}
        <section className="mentor-section">
          <div className="mentor-grid">
            <div className="mentor-copy">
              <h2 className="section-title">Sneak peek: your AI mentor 🎧</h2>
              <p className="section-subtitle">
                Planner-mode only (for now). You tell it{" "}
                <strong>targets, days left and hours/day</strong>; it sends you
                chapter-wise hours and next-step nudges.
              </p>
              <ul className="mentor-list">
                <li>
                  Distributes hours using{" "}
                  <strong>board weightage + must-crack / high-ROI tags</strong>.
                </li>
                <li>
                  Connects to <strong>TopicHub</strong>,{" "}
                  <strong>HPQ bank</strong> and <strong>Mock Builder</strong> so
                  “plan → study → practise” feels like one flow.
                </li>
                <li>
                  Later: logs your mocks + scores to keep tweaking the roadmap.
                </li>
              </ul>
              <button
                type="button"
                onClick={goToMentor}
                className="mentor-btn"
              >
                Open planner →
              </button>
            </div>

            <div className="mentor-card">
              <div className="mentor-card-header">
                <span>Maths • Class 10</span>
                <span className="mentor-avatar">😶</span>
              </div>
              <div className="mentor-card-body">
                <p className="mentor-card-title">
                  <strong>Planner snapshot</strong> for 80% target:
                </p>
                <ul className="mentor-card-list">
                  <li>90 days left • 1 hr/day</li>
                  <li>~60% hours → 🔥 must-crack chapters</li>
                  <li>~30% → 💎 high-ROI + revision</li>
                  <li>~10% → 🌈 good-to-do / buffer</li>
                </ul>
              </div>
              <p className="mentor-card-foot">
                “Today’s focus: <strong>Pair of Linear Equations</strong> +
                <strong> Statistics</strong> HPQs. 40-minute mock, then 20
                minutes revision.”
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
