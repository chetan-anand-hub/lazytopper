// src/App.tsx
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

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const current = location.pathname;

  const go = (path: string) => navigate(path);

  const isHome = current === "/";
  // Treat Chapters page + TopicHub + TrendsPage as the same “Trends” tab
  const isTrends =
    current.startsWith("/chapters") ||
    current.startsWith("/topics/") ||
    current.startsWith("/trends/");
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
        onClick={() => go("/chapters")}
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

          {/* Trends entry hub (old “Chapters” page) */}
          <Route path="/chapters" element={<Chapters />} />

          {/* Topic content hub – uses :topicKey param */}
          <Route path="/topics/:topicKey" element={<TopicHub />} />

          {/* Trigonometry Module */}
          <Route path="/chapter/trigonometry" element={<TrigChapter />} />
          <Route
            path="/chapter/trigonometry/flashcards"
            element={<TrigFlashcards />}
          />
          <Route path="/chapter/trigonometry/quiz" element={<TrigQuiz />} />

          {/* Dynamic Trends Page (Maths / Science, grade-aware) */}
          <Route path="/trends/:grade/:subject" element={<TrendsPage />} />

          {/* Auto-mock paper view (legacy + predictive) */}
          <Route path="/mock-paper" element={<MockPaper />} />

          {/* New Mock Builder v1 (80-mark paper from HPQ bank) */}
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
        </Routes>
      </div>

      <BottomNav />
    </>
  );
}
