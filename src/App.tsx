import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Chapters from "./pages/Chapters";
import TrigChapter from "./pages/TrigChapter";
import TrigQuiz from "./pages/TrigQuiz";
import TrigFlashcards from "./pages/TrigFlashcards";
import TrendsPage from "./pages/TrendsPage";
import MockPaper from "./pages/MockPaper";
import HighlyProbableQuestions from "./pages/HighlyProbableQuestions";
import PredictivePapersPage from "./pages/PredictivePapers";
import TopicHub from "./pages/TopicHub";
import MockBuilder from "./pages/MockBuilder";
import AiMentorPage from "./pages/AiMentorPage";
import StudyPlanPage from "./pages/StudyPlanPage";

/**
 * BottomNav component renders a simple bottom navigation bar for the mobile view.
 * It highlights the active page based on the current location and provides
 * navigation shortcuts to Home, Trends, Predict (predictive papers), and Dashboard.
 */
function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const current = location.pathname;
  const go = (path: string) => navigate(path);

  // Determine which nav item is active
  const isHome = current === "/";
  const isTrends =
    current.startsWith("/trends") || current.startsWith("/topics/");
  const isDashboard = current === "/dashboard";
  const isPredictive =
    current.startsWith("/predictive-papers") ||
    current.startsWith("/mock-paper") ||
    current.startsWith("/mock-builder");

  const baseBtnStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    fontSize: "0.9rem",
    cursor: "pointer",
  };

  const activeColor = "#ffb400";
  const inactiveColor = "#f1f1f1";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-around",
        padding: "10px 12px",
        background: "#111",
        borderTop: "1px solid #333",
        zIndex: 20,
      }}
    >
      <button
        onClick={() => go("/")}
        style={{
          ...baseBtnStyle,
          color: isHome ? activeColor : inactiveColor,
          fontWeight: isHome ? 700 : 500,
        }}
      >
        Home
      </button>

      <button
        onClick={() => go("/trends/10/Maths")}
        style={{
          ...baseBtnStyle,
          color: isTrends ? activeColor : inactiveColor,
          fontWeight: isTrends ? 700 : 500,
        }}
      >
        Trends
      </button>

      <button
        onClick={() => go("/predictive-papers")}
        style={{
          ...baseBtnStyle,
          color: isPredictive ? activeColor : inactiveColor,
          fontWeight: isPredictive ? 700 : 500,
        }}
      >
        Predict
      </button>

      <button
        onClick={() => go("/dashboard")}
        style={{
          ...baseBtnStyle,
          color: isDashboard ? activeColor : inactiveColor,
          fontWeight: isDashboard ? 700 : 500,
        }}
      >
        Dashboard
      </button>
    </div>
  );
}

/**
 * App component defines the top-level routes for the LazyTopper application.
 * It wires all pages together and exposes the AI mentor via /mentor and /ai-mentor.
 */
export default function App() {
  return (
    <>
      <div className="navbar">LazyTopper</div>
      <div style={{ paddingBottom: "60px" }}>
        <Routes>
          {/* Core Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/study-plan" element={<StudyPlanPage />} />

          {/* Old Chapters Overview (Maths-only view) */}
          <Route path="/chapters" element={<Chapters />} />

          {/* Topic content hub – maths topics via :topicKey param */}
          <Route path="/topics/:topicKey" element={<TopicHub />} />

          {/* Generic Topic Hub entry via query params (from Trends) */}
          <Route path="/topic-hub" element={<TopicHub />} />

          {/* Trigonometry Module */}
          <Route path="/chapter/trigonometry" element={<TrigChapter />} />
          <Route
            path="/chapter/trigonometry/flashcards"
            element={<TrigFlashcards />}
          />
          <Route path="/chapter/trigonometry/quiz" element={<TrigQuiz />} />

          {/* NEW Dynamic Trends Page (Maths + Science with toggle) */}
          <Route path="/trends/:grade/:subject" element={<TrendsPage />} />

          {/* Auto-mock paper view (legacy + predictive) */}
          <Route path="/mock-paper/:slug" element={<MockPaper />} />

          {/* New Mock Builder v1 (80‑mark paper from HPQ bank) */}
          <Route path="/mock-builder" element={<MockBuilder />} />

          {/* Highly Probable Questions */}
          <Route
            path="/highly-probable"
            element={<HighlyProbableQuestions />}
          />

          {/* Predictive papers hub */}
          <Route
            path="/predictive-papers"
            element={<PredictivePapersPage />}
          />

          {/* AI Mentor / Planner routes */}
          <Route path="/ai-mentor" element={<AiMentorPage />} />
          {/* Provide both /mentor and /ai-mentor so links remain backwards compatible */}
          <Route path="/mentor" element={<AiMentorPage />} />
        </Routes>
      </div>
      <BottomNav />
    </>
  );
}
