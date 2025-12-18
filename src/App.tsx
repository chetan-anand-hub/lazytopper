import type React from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import TrendsPage from "./pages/TrendsPage";
import MockPaper from "./pages/MockPaper";
import HighlyProbableQuestions from "./pages/HighlyProbableQuestions";
import PredictivePapersPage from "./pages/PredictivePapers";
import TopicHub from "./pages/TopicHub";
import MockBuilder from "./pages/MockBuilder";
import AiMentorPage from "./pages/AiMentorPage";
import StudyPlanPage from "./pages/StudyPlanPage";
import { StudyPlannerView } from "./components/planner/StudyPlannerView";
import PracticePage from "./pages/PracticePage";


// Import the new Vibe toggle and command palette components.
import { VibeToggle } from './ui/components/VibeToggle';
import { CommandPalette } from './ui/components/CommandPalette';
import { useState, useEffect } from 'react';
import DailyMixPage from './pages/DailyMixPage';
import WeeklyWrappedPage from './pages/WeeklyWrappedPage';
import { useVibeMode } from './context/vibeModeContext';

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

  // Determine which nav item is active.
  const isHome = current === "/";
  // Consider both /trends and /topic-hub as part of the Trends flow
  const isTrends =
    current.startsWith("/trends") ||
    current.startsWith("/topics/") ||
    current.startsWith("/topic-hub");
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
 * A vibe toggle and command palette overlay have been added without altering
 * existing route definitions.  The command palette can be opened via Cmd/Ctrl+K.
 */
export default function App() {
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const { mode, setMode } = useVibeMode();

  const handleCommandSelect = (action: { id: string; handler: string }) => {
    switch (action.handler) {
      case 'navigateToDashboard':
        navigate('/dashboard');
        break;
      case 'navigateToPractice':
        navigate('/practice/10/Maths');
        break;
      case 'navigateToHPQ':
        navigate('/highly-probable/10/Maths');
        break;
      case 'navigateToMockTest':
        navigate('/predictive-papers');
        break;
      case 'navigateToMockBuilder':
        navigate('/mock-builder/10/Maths');
        break;
      case 'navigateToTopicHub':
        navigate('/topic-hub/10/Maths');
        break;
      case 'navigateToMentor':
        navigate('/mentor/10/Maths');
        break;
      case 'navigateToStats':
        navigate('/dashboard');
        break;
      case 'navigateToWeeklyWrap':
        navigate('/weekly-wrapped');
        break;
      case 'navigateToDailyMix':
        navigate('/daily-mix/10/Maths');
        break;
      case 'toggleVibeMode':
        setMode(mode === 'beast' ? 'zombie' : 'beast');
        break;
      default:
        console.log('Executing command:', action.handler);
        break;
    }
    setPaletteOpen(false);
  };

  // Keyboard shortcut to open the command palette (Cmd/Ctrl + K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Top navigation bar with brand name and vibe toggle */}
      <div className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>LazyTopper</span>
        <VibeToggle />
      </div>
      {/* Command palette overlay */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={handleCommandSelect}
      />
      <div style={{ paddingBottom: '60px' }}>
        <Routes>
          {/* Core Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* New Smart Study Planner (grade + subject aware) */}
          <Route path="/planner/:grade/:subject" element={<StudyPlannerView />} />
          {/* Legacy planner route (no params) */}
          <Route path="/planner" element={<StudyPlannerView />} />


          {/* Legacy Topic content hub – maths topics via :topicKey param */}
          <Route path="/topics/:topicKey" element={<TopicHub />} />

          {/* Preferred Topic Hub entry with grade & subject in path */}
          <Route path="/topic-hub/:grade/:subject" element={<TopicHub />} />

          {/* Generic Topic Hub entry via query params (for backwards compatibility) */}
          <Route path="/topic-hub" element={<TopicHub />} />

      

          {/* Dynamic Trends Page (Maths + Science with toggle) */}
          <Route path="/trends/:grade/:subject" element={<TrendsPage />} />

          {/* Auto-mock paper view (legacy + predictive) */}
          <Route path="/mock-paper/:slug" element={<MockPaper />} />

          {/* New Mock Builder v1 with mandatory grade & subject */}
          <Route path="/mock-builder/:grade/:subject" element={<MockBuilder />} />
          {/* Legacy Mock Builder route (no params) */}
          <Route path="/mock-builder" element={<MockBuilder />} />

          {/* Highly Probable Questions with mandatory grade & subject */}
          <Route
            path="/highly-probable/:grade/:subject"
            element={<HighlyProbableQuestions />}
          />
          {/* Legacy HPQ route */}
          <Route
            path="/highly-probable"
            element={<HighlyProbableQuestions />}
          />

          {/* Predictive papers hub */}
          <Route
            path="/predictive-papers"
            element={<PredictivePapersPage />}
          />

          <Route path="/practice/:grade/:subject" element={<PracticePage />} />

          {/* Study Plan with mandatory grade & subject */}
          <Route path="/study-plan/:grade/:subject" element={<StudyPlanPage />} />
          {/* Legacy Study Plan route */}
          <Route path="/study-plan" element={<StudyPlanPage />} />

          {/* AI Mentor / Planner routes with mandatory grade & subject */}
          <Route path="/ai-mentor/:grade/:subject" element={<AiMentorPage />} />
          <Route path="/ai-mentor" element={<AiMentorPage />} />
          {/* Provide both /mentor and /ai-mentor so links remain backwards compatible */}
          <Route path="/mentor/:grade/:subject" element={<AiMentorPage />} />
          <Route path="/mentor" element={<AiMentorPage />} />

          {/* Daily Mix route for personalised study mixes */}
          <Route
            path="/daily-mix/:grade/:subject"
            element={<DailyMixPage />}
          />

          {/* Weekly Wrapped recap route */}
          <Route
            path="/weekly-wrapped"
            element={<WeeklyWrappedPage />}
          />


          {/* Catch-all: redirect unknown routes to a sensible default */}
          <Route path="*" element={<Navigate to="/trends/10/Maths" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </>
  );
}