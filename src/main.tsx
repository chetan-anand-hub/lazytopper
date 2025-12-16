import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import { ProfileProvider } from "./context/ProfileContext";
import { SmartLearningProvider } from "./engine/smartLearningStore";
// Import the VibeProvider so that the vibe mode context is available throughout the app.
import { VibeProvider } from "./context/vibeModeContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProfileProvider>
        <SmartLearningProvider>
          {/* Provide the vibe mode to all components */}
          <VibeProvider>
            <App />
          </VibeProvider>
        </SmartLearningProvider>
      </ProfileProvider>
    </BrowserRouter>
  </React.StrictMode>,
);