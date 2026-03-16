import { promises as fs } from "node:fs";
import path from "node:path";
import {
  collectGovernedChangedFiles,
  containsPlaceholderText,
  ensureOutDir,
  extractPathishTokens,
  findLatestMatchingTestRun,
  findLatestReviewPacket,
  normalizePacketPath,
  outDir,
  packetHasRequiredSections,
  parseMarkdownSections,
  readJsonIfExists,
  repoRoot,
} from "./review_packet_utils.mjs";

function makeCheck(name, ok, details, severity = "P2") {
  return { name, ok: Boolean(ok), details: String(details || ""), severity };
}

function parseArgs() {
  const fileFlagIndex = process.argv.indexOf("--file");
  const packetPath = fileFlagIndex !== -1 ? process.argv[fileFlagIndex + 1] : "";
  return {
    packetPath: packetPath ? path.resolve(packetPath) : "",
  };
}

function meaningfulLength(text) {
  return String(text || "").replace(/[`*_>#-]/g, " ").replace(/\s+/g, " ").trim().length;
}

function sectionLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function main() {
  const args = parseArgs();
  const latestPacket = args.packetPath
    ? { absPath: args.packetPath, name: path.basename(args.packetPath) }
    : await findLatestReviewPacket();

  if (!latestPacket) {
    throw new Error("No review packet found to validate.");
  }

  const text = await fs.readFile(latestPacket.absPath, "utf8");
  const changedFiles = await collectGovernedChangedFiles();
  const substantialTask = changedFiles.length >= 5;
  const sections = parseMarkdownSections(text);

  const taskSummary = sections.get("task summary") || "";
  const reviewerEntryPoint = sections.get("reviewer entry point") || "";
  const changedFilesSection = sections.get("changed files") || "";
  const testsRun = sections.get("tests run") || "";
  const passFail = sections.get("pass/fail") || "";
  const manualQa = sections.get("manual qa path") || "";
  const assumptions = sections.get("assumptions") || "";
  const knownRisks = sections.get("known risks") || "";
  const reviewerChecklist = sections.get("reviewer checklist") || "";

  const mentionedPaths = extractPathishTokens(changedFilesSection).map(normalizePacketPath);
  const matchedChangedFiles = mentionedPaths.filter((packetPath) =>
    changedFiles.some((changedFile) => {
      const normalizedChangedFile = normalizePacketPath(changedFile);
      return (
        normalizedChangedFile === packetPath ||
        normalizedChangedFile.endsWith(`/${packetPath}`) ||
        packetPath.endsWith(`/${normalizedChangedFile}`)
      );
    })
  );

  const rationaleLines = sectionLines(changedFilesSection).filter((line) => {
    if (!/[:\-]/.test(line)) return false;
    if (extractPathishTokens(line).length === 0) return false;
    const normalized = line.replace(/`[^`]+`/g, "").replace(/\[[^\]]+\]\([^)]*\)/g, "");
    return meaningfulLength(normalized) >= 18;
  });

  const testCommandLines = sectionLines(testsRun).filter((line) => /(npm run|node |powershell )/i.test(line));
  const reviewerChecklistLines = sectionLines(reviewerChecklist).filter((line) => /^-\s+/i.test(line));
  const actionableChecklistLines = reviewerChecklistLines.filter((line) => /(confirm|verify|check|review|inspect|compare)/i.test(line));

  const latestVerifySummary = await findLatestMatchingTestRun(/_summary\.md$/i);
  const latestVerifyText = latestVerifySummary ? await fs.readFile(latestVerifySummary.absPath, "utf8") : "";
  const latestVerifyPassed = /FINAL_STATUS:\s*PASS|Result:\s*PASS|PASS/i.test(latestVerifyText);
  const browserJourneyAudit = await readJsonIfExists(".project_memory/ops/out/browser_journey_gate_audit.json");
  const personaGateAudit = await readJsonIfExists(".project_memory/ops/out/persona_gate_audit.json");
  const browserPersonaAudit = await readJsonIfExists(".project_memory/ops/out/browser_persona_gate_audit.json");

  const checks = [];
  checks.push(
    makeCheck(
      "required_sections_present",
      packetHasRequiredSections(text, substantialTask),
      "Review packet must contain all required sections, including reviewer entry point for substantial tasks.",
      "P0"
    )
  );
  checks.push(
    makeCheck(
      "task_summary_is_meaningful",
      meaningfulLength(taskSummary) >= 40 && !containsPlaceholderText(taskSummary),
      "Task summary must be non-empty, specific, and free of placeholder text.",
      "P1"
    )
  );
  checks.push(
    makeCheck(
      "changed_files_reference_real_changes",
      matchedChangedFiles.length >= Math.min(3, Math.max(1, changedFiles.length)),
      `Packet should mention real changed files. Matched ${matchedChangedFiles.length} of ${changedFiles.length} changed files.`,
      "P1"
    )
  );
  checks.push(
    makeCheck(
      "major_file_rationale_present",
      rationaleLines.length >= Math.min(3, Math.max(1, matchedChangedFiles.length)),
      "Changed-files section should explain why the major files matter, not just list names.",
      "P1"
    )
  );
  checks.push(
    makeCheck(
      "tests_run_mentions_real_commands",
      testCommandLines.length >= (substantialTask ? 3 : 1),
      "Tests run section should list the actual commands executed for this review.",
      "P1"
    )
  );

  const passFailChecks = [];
  if (latestVerifySummary) {
    passFailChecks.push(latestVerifyPassed ? /codex_verify|verify fast/i.test(passFail) : /FAIL/i.test(passFail));
  }
  if (browserJourneyAudit?.summary) {
    const browserPassed = Number(browserJourneyAudit.summary.failedJourneys || 0) === 0;
    passFailChecks.push(browserPassed ? /browser journey/i.test(passFail) && /PASS/i.test(passFail) : /browser journey/i.test(passFail) && /FAIL/i.test(passFail));
  }
  if (personaGateAudit?.summary) {
    const personaPassed = Number(personaGateAudit.summary.failedBots || 0) === 0;
    passFailChecks.push(personaPassed ? /persona gate/i.test(passFail) && /PASS/i.test(passFail) : /persona gate/i.test(passFail) && /FAIL/i.test(passFail));
  }
  if (browserPersonaAudit?.summary) {
    const browserPersonaPassed = Number(browserPersonaAudit.summary.failedBots || 0) === 0;
    passFailChecks.push(
      browserPersonaPassed
        ? /browser persona/i.test(passFail) && /PASS/i.test(passFail)
        : /browser persona/i.test(passFail) && /FAIL/i.test(passFail)
    );
  }

  checks.push(
    makeCheck(
      "pass_fail_aligned_with_outputs",
      passFailChecks.length > 0 ? passFailChecks.every(Boolean) : meaningfulLength(passFail) >= 20,
      "Pass/fail section should reflect the actual verify, browser, and persona outcomes.",
      "P1"
    )
  );

  const manualQaPaths = extractPathishTokens(manualQa);
  const manualQaExists = manualQaPaths.length > 0
    ? await Promise.all(manualQaPaths.map(async (entry) => {
        try {
          await fs.access(path.isAbsolute(entry) ? entry : path.join(repoRoot, entry));
          return true;
        } catch {
          return false;
        }
      }))
    : [];
  checks.push(
    makeCheck(
      "manual_qa_path_is_real",
      substantialTask ? manualQaExists.some(Boolean) : true,
      "Substantial tasks should point to a real manual QA note file.",
      "P1"
    )
  );
  checks.push(
    makeCheck(
      "known_risks_are_non_empty",
      !substantialTask || (meaningfulLength(knownRisks) >= 30 && !containsPlaceholderText(knownRisks)),
      "Known risks should capture meaningful residual review risk for substantial tasks.",
      "P2"
    )
  );
  checks.push(
    makeCheck(
      "assumptions_are_non_placeholder",
      meaningfulLength(assumptions) >= 25 && !containsPlaceholderText(assumptions),
      "Assumptions should be concrete and non-placeholder.",
      "P2"
    )
  );
  checks.push(
    makeCheck(
      "reviewer_checklist_is_actionable",
      actionableChecklistLines.length >= 3,
      "Reviewer checklist should give at least three actionable review steps.",
      "P2"
    )
  );
  checks.push(
    makeCheck(
      "reviewer_entry_point_exists",
      !substantialTask || meaningfulLength(reviewerEntryPoint) >= 25,
      "Substantial tasks should include a reviewer entry point / review order section.",
      "P1"
    )
  );
  checks.push(
    makeCheck(
      "zip_mentions_are_secondary_only",
      !/zip/i.test(text) || /secondary|fallback/i.test(text),
      "If a ZIP is mentioned, it should be clearly marked as secondary or fallback review material.",
      "P2"
    )
  );
  checks.push(
    makeCheck(
      "no_placeholder_text",
      !containsPlaceholderText(text),
      "Review packet should not ship with placeholder text like TBD, placeholder, or FIXME.",
      "P1"
    )
  );

  const failedChecks = checks.filter((check) => !check.ok);
  const summary = {
    packetPath: latestPacket.absPath,
    substantialTask,
    totalChecks: checks.length,
    failedChecks: failedChecks.length,
    verdict: failedChecks.length === 0 ? "PASS" : "FAIL",
    p0: failedChecks.filter((check) => check.severity === "P0").length,
    p1: failedChecks.filter((check) => check.severity === "P1").length,
    p2: failedChecks.filter((check) => check.severity === "P2").length,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    packetPath: latestPacket.absPath,
    changedFiles,
    checks,
  };

  await ensureOutDir();
  const outPath = path.join(outDir, "review_packet_semantic_validation.json");
  await fs.writeFile(outPath, JSON.stringify(report, null, 2), "utf8");

  console.log(`review_packet_semantic_validation: ${summary.verdict}`);
  console.log(`report=${outPath.replaceAll("\\", "/")}`);

  if (failedChecks.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  await ensureOutDir();
  const outPath = path.join(outDir, "review_packet_semantic_validation.json");
  await fs.writeFile(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        error: String(error?.stack || error),
      },
      null,
      2
    ),
    "utf8"
  );
  console.error(String(error?.stack || error));
  process.exitCode = 1;
});
