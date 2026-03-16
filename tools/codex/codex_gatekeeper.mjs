import { promises as fs } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  collectGovernedChangedFiles,
  findLatestReviewPacket,
  packetHasRequiredSections,
} from "./review_packet_utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const matrixPath = path.join(__dirname, "test_matrix.json");
const testRunsDir = path.join(repoRoot, "docs", "project_memory", "test_runs");

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function runCommand(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: { ...process.env },
    shell: options.shell ?? false,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
  });
  return {
    ok: (result.status ?? 1) === 0,
    code: result.status ?? 1,
    stdout: String(result.stdout || ""),
    stderr: String(result.stderr || ""),
  };
}

function runShell(commandLine) {
  return runCommand(commandLine, [], { shell: true });
}

function testExecutionPriority(test) {
  const command = String(test?.command || "");
  if (/test:persona-browser-gate/i.test(command)) return 30;
  if (/test:browser:/i.test(command)) return 20;
  if (/test:review-packet:semantic/i.test(command)) return 25;
  return 10;
}

function matchesRule(file, match) {
  const normalized = String(file || "").replaceAll("\\", "/");
  const prefixes = Array.isArray(match?.prefixes) ? match.prefixes : [];
  if (prefixes.some((prefix) => normalized.startsWith(prefix))) return true;
  const contains = Array.isArray(match?.contains) ? match.contains : [];
  if (contains.some((token) => normalized.includes(token))) return true;
  const suffixes = Array.isArray(match?.suffixes) ? match.suffixes : [];
  if (suffixes.some((suffix) => normalized.endsWith(suffix))) return true;
  return false;
}

async function fileExists(relPath) {
  try {
    await fs.access(path.join(repoRoot, relPath));
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(absPath) {
  await fs.mkdir(absPath, { recursive: true });
}

function parseVerifyOutput(stdout) {
  const lines = stdout.split(/\r?\n/);
  const findValue = (label) => {
    const line = lines.find((entry) => entry.startsWith(`${label}: `));
    return line ? line.slice(label.length + 2).trim() : "";
  };
  return {
    logPath: findValue("LOG_PATH"),
    summaryPath: findValue("SUMMARY_PATH"),
    finalStatus: findValue("FINAL_STATUS"),
  };
}

async function findLatestMatchingFile(dirAbsPath, predicate) {
  try {
    const entries = await fs.readdir(dirAbsPath, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const absPath = path.join(dirAbsPath, entry.name);
      if (!predicate(entry.name, absPath)) continue;
      const stats = await fs.stat(absPath);
      files.push({ absPath, name: entry.name, mtimeMs: stats.mtimeMs });
    }
    files.sort((a, b) => b.mtimeMs - a.mtimeMs);
    return files[0] || null;
  } catch {
    return null;
  }
}

async function readJsonReport(relPath) {
  try {
    const raw = await fs.readFile(path.join(repoRoot, relPath), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function main() {
  const matrix = JSON.parse(await fs.readFile(matrixPath, "utf8"));
  const changedFiles = await collectGovernedChangedFiles();
  const matchedRules = matrix.rules
    .map((rule) => ({
      ...rule,
      changedFiles: changedFiles.filter((file) => matchesRule(file, rule.match)),
    }))
    .filter((rule) => rule.changedFiles.length > 0);

  const tests = [];
  const dedupe = new Set();
  for (const rule of matchedRules) {
    for (const test of rule.tests || []) {
      const key = `${test.command}::${test.expectedReport || ""}`;
      if (dedupe.has(key)) continue;
      dedupe.add(key);
      tests.push({ ...test, fromRule: rule.id });
    }
  }
  tests.sort((a, b) => testExecutionPriority(a) - testExecutionPriority(b));

  const verifyRes = runCommand("powershell", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    "scripts/ops/codex_testing/codex_verify.ps1",
    "-TaskName",
    "gatekeeper-fast",
    "-Suite",
    "fast",
  ]);
  const verifyMeta = parseVerifyOutput(verifyRes.stdout);

  const executedTests = [];
  for (const test of tests) {
    const res = runShell(test.command);
    const outputPresent = test.expectedReport ? await fileExists(test.expectedReport) : true;
    executedTests.push({
      label: test.label,
      command: test.command,
      severity: test.severity || "targeted",
      fromRule: test.fromRule,
      ok: res.ok,
      code: res.code,
      expectedReport: test.expectedReport || null,
      outputPresent,
      stdoutTail: res.stdout.split(/\r?\n/).slice(-12),
      stderrTail: res.stderr.split(/\r?\n/).slice(-12),
    });
  }

  const manualQaRequired = matchedRules.some((rule) => rule.proof?.manualQaRequired);
  const reviewPacketRequired =
    changedFiles.length >= Number(matrix.always?.substantialTaskMinChangedFiles || 5) ||
    matchedRules.some((rule) => rule.proof?.reviewPacketRequired);
  const browserJourneysRequired = tests.some((test) => /test:browser:/i.test(test.command));
  const browserPersonaRequired = tests.some((test) => /test:persona-browser-gate/i.test(test.command));

  const latestManualQa = await findLatestMatchingFile(testRunsDir, (name) => /_manualQA\.md$/i.test(name));
  const latestPacket = await findLatestReviewPacket();
  const latestPacketText = latestPacket ? await fs.readFile(latestPacket.absPath, "utf8") : "";
  const latestPacketSectionsOk = latestPacket ? packetHasRequiredSections(latestPacketText, reviewPacketRequired) : false;
  const semanticValidationResult =
    latestPacket && reviewPacketRequired
      ? runCommand(process.execPath, ["tools/codex/validate_review_packet_semantics.mjs", "--file", latestPacket.absPath])
      : null;
  const semanticValidationReport = reviewPacketRequired
    ? await readJsonReport(".project_memory/ops/out/review_packet_semantic_validation.json")
    : null;

  const proof = {
    verify: {
      ok: verifyRes.ok && verifyMeta.finalStatus === "PASS" && Boolean(verifyMeta.summaryPath),
      logPath: verifyMeta.logPath || null,
      summaryPath: verifyMeta.summaryPath || null,
      finalStatus: verifyMeta.finalStatus || null,
    },
    manualQa: {
      required: manualQaRequired,
      ok: manualQaRequired ? Boolean(latestManualQa) : true,
      path: latestManualQa?.absPath || null,
    },
    reviewPacket: {
      required: reviewPacketRequired,
      ok: reviewPacketRequired ? Boolean(latestPacket && latestPacketSectionsOk) : true,
      path: latestPacket?.absPath || null,
      sectionsOk: latestPacketSectionsOk,
      semanticOk: reviewPacketRequired
        ? Boolean(
            semanticValidationResult?.ok &&
              semanticValidationReport?.summary?.verdict === "PASS"
          )
        : true,
      semanticReport:
        reviewPacketRequired && semanticValidationReport
          ? path.join(repoRoot, ".project_memory", "ops", "out", "review_packet_semantic_validation.json")
          : null,
    },
  };

  const personaGateSummary = (await readJsonReport(".project_memory/ops/out/persona_gate_audit.json"))?.summary || null;
  const browserJourneySummary =
    (await readJsonReport(".project_memory/ops/out/browser_journey_gate_audit.json")) || null;
  const browserPersonaSummary =
    (await readJsonReport(".project_memory/ops/out/browser_persona_gate_audit.json")) || null;

  const failedTargetedTests = executedTests.filter((test) => !test.ok || !test.outputPresent);
  const severeRegression = Boolean(
    (personaGateSummary && Number(personaGateSummary.p0 || 0) > 0) ||
      (browserPersonaSummary?.summary && Number(browserPersonaSummary.summary.p0 || 0) > 0)
  );

  let verdict = "ACCEPT";
  const reasons = [];
  if (!proof.verify.ok) {
    verdict = "REJECT";
    reasons.push("Core codex_verify fast failed.");
  } else if (severeRegression) {
    verdict = "REJECT";
    reasons.push("Persona gate reported P0 failures.");
  } else if (
    failedTargetedTests.length > 0 ||
    !proof.manualQa.ok ||
    !proof.reviewPacket.ok ||
    !proof.reviewPacket.semanticOk ||
    (browserJourneysRequired && !browserJourneySummary?.summary) ||
    (browserPersonaRequired && !browserPersonaSummary?.summary)
  ) {
    verdict = "REVISE";
    if (failedTargetedTests.length > 0) reasons.push("One or more required targeted checks failed or did not emit expected outputs.");
    if (!proof.manualQa.ok) reasons.push("Required manual QA note is missing.");
    if (!proof.reviewPacket.ok) reasons.push("Required review packet is missing or incomplete.");
    if (!proof.reviewPacket.semanticOk) reasons.push("Review packet semantic validation failed.");
    if (browserJourneysRequired && !browserJourneySummary?.summary) reasons.push("Required browser journey summary is missing.");
    if (browserPersonaRequired && !browserPersonaSummary?.summary) reasons.push("Required browser persona summary is missing.");
  } else {
    reasons.push("All mandatory core and targeted checks passed, and required proof artifacts are present.");
  }

  const stamp = nowStamp();
  await ensureDir(testRunsDir);
  const jsonPath = path.join(testRunsDir, `${stamp}_codex-gatekeeper.json`);
  const mdPath = path.join(testRunsDir, `${stamp}_codex-gatekeeper.md`);

  const report = {
    generatedAt: new Date().toISOString(),
    changedFiles,
    matchedRules: matchedRules.map((rule) => ({ id: rule.id, changedFiles: rule.changedFiles })),
    verify: proof.verify,
    tests: executedTests,
    proof,
    personaGateSummary,
    browserJourneySummary: browserJourneySummary?.summary || null,
    browserPersonaSummary: browserPersonaSummary?.summary || null,
    decision: {
      verdict,
      reasons,
    },
  };

  const md = [
    "# Codex Gatekeeper",
    "",
    `- Verdict: **${verdict}**`,
    `- Generated: ${report.generatedAt}`,
    "",
    "## Changed files",
    ...changedFiles.map((file) => `- ${file}`),
    "",
    "## Matched rules",
    ...matchedRules.map((rule) => `- ${rule.id}: ${rule.changedFiles.join(", ")}`),
    "",
    "## Core verify",
    `- Final status: ${proof.verify.finalStatus || "UNKNOWN"}`,
    `- Summary path: ${proof.verify.summaryPath || "missing"}`,
    `- Log path: ${proof.verify.logPath || "missing"}`,
    "",
    "## Targeted tests",
    ...executedTests.map((test) => `- ${test.label}: ${test.ok && test.outputPresent ? "PASS" : "FAIL"} via ${test.command}`),
    "",
    "## Proof",
    `- Manual QA required: ${manualQaRequired}`,
    `- Manual QA path: ${proof.manualQa.path || "missing"}`,
    `- Review packet required: ${reviewPacketRequired}`,
    `- Review packet path: ${proof.reviewPacket.path || "missing"}`,
    `- Review packet sections OK: ${proof.reviewPacket.sectionsOk}`,
    `- Review packet semantic OK: ${proof.reviewPacket.semanticOk}`,
    `- Review packet semantic report: ${proof.reviewPacket.semanticReport || "missing"}`,
    `- Browser journeys required: ${browserJourneysRequired}`,
    `- Browser journey summary: ${browserJourneySummary ? JSON.stringify(browserJourneySummary.summary) : "missing"}`,
    `- Browser persona summary: ${browserPersonaSummary ? JSON.stringify(browserPersonaSummary.summary) : "missing"}`,
    "",
    "## Decision",
    ...reasons.map((reason) => `- ${reason}`),
  ].join("\n");

  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(mdPath, md, "utf8");

  console.log(`GATEKEEPER_DECISION: ${verdict}`);
  console.log(`GATEKEEPER_MD: ${mdPath}`);
  console.log(`GATEKEEPER_JSON: ${jsonPath}`);

  if (verdict === "REJECT") {
    process.exitCode = 1;
    return;
  }
  if (verdict === "REVISE") {
    process.exitCode = 1;
    return;
  }
}

main().catch((error) => {
  console.error(String(error?.stack || error));
  process.exitCode = 1;
});
