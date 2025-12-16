// src/pages/DebugPaperEngine.tsx
import React, { useEffect } from "react";
import {
  generatePaperWithSummary,
  generatePaper,
  summarizePaperFit,
} from "../engine/paperEngine";

const DebugPaperEngine: React.FC = () => {
  useEffect(() => {
    // One-shot: P1
    const { paper, summary } = generatePaperWithSummary("P1");
    console.log("=== P1 PAPER ===", paper);
    console.log("=== P1 TOPIC COVERAGE (top 5 deviations) ===");
    console.table(summary.topicCoverage.slice(0, 5));
    console.log("=== P1 DIFFICULTY COVERAGE ===");
    console.table(summary.difficultyCoverage);

    // Another example: P2
    const p2 = generatePaper("P2");
    const debugP2 = summarizePaperFit(p2);
    console.log("=== P2 TOPIC COVERAGE (top 5 deviations) ===");
    console.table(debugP2.topicCoverage.slice(0, 5));
    console.log("=== P2 DIFFICULTY COVERAGE ===");
    console.table(debugP2.difficultyCoverage);
  }, []);

  return (
    <div style={{ padding: "1.5rem", fontFamily: "system-ui" }}>
      <h1>Paper Engine Debug</h1>
      <p>Open the browser console to see generated papers and coverage summaries.</p>
    </div>
  );
};

export default DebugPaperEngine;
