import { promises as fs } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const matrixPath = path.join(__dirname, "test_matrix.json");
const testRunsDir = path.join(repoRoot, "docs", "project_memory", "test_runs");
const reviewPacketDir = path.join(repoRoot, "docs", "project_memory", "review_packets");

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

function parseChangedFiles() {
  const diffRes = runCommand("git", ["diff", "--name-only", "HEAD"]);
  const statusRes = runCommand("git", ["status", "--porcelain"]);
  const files = new Set();

  for (const line of diffRes.stdout.split(/\r?\n/)) {
    const file = line.trim();
    if (file) files.add(file.replaceAll("\\", "/"));
  }

  for (const rawLine of statusRes.stdout.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line) continue;
    const payload = line.slice(3).trim();
    if (!payload) continue;
    const file = payload.includes("->") ? payload.split("->").pop().trim() : payload;
    if (file) files.add(file.replaceAll("\\", "/"));
  }

  return Array.from(files).sort();
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

function packetHasRequiredSections(text) {
  const required = [
    "## Task summary",
    "## Changed files",
    "## Tests run",
    "## Pass/fail",
    "## Manual QA path",
    "## Assumptions",
    "## Known risks",
    "## Reviewer checklist",
  ];
  return required.every((heading) => text.includes(heading));
}

async function main() {
  const matrix = JSON.parse(await fs.readFile(matrixPath, "utf8"));
  const changedFiles = parseChangedFiles();
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

  const latestManualQa = await findLatestMatchingFile(testRunsDir, (name) => /_manualQA\.md$/i.test(name));
  const latestPacket = await findLatestMatchingFile(reviewPacketDir, (name) => /\.md$/i.test(name) && name !== "README.md");
  const latestPacketText = latestPacket ? await fs.readFile(latestPacket.absPath, "utf8") : "";
  const latestPacketSectionsOk = latestPacket ? packetHasRequiredSections(latestPacketText) : false;

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
    },
  };

  let personaGateSummary = null;
  if (await fileExists(".project_memory/ops/out/persona_gate_audit.json")) {
    try {
      const raw = await fs.readFile(path.join(repoRoot, ".project_memory/ops/out/persona_gate_audit.json"), "utf8");
      personaGateSummary = JSON.parse(raw)?.summary || null;
    } catch {
      personaGateSummary = null;
    }
  }

  const failedTargetedTests = executedTests.filter((test) => !test.ok || !test.outputPresent);
  const severeRegression = Boolean(personaGateSummary && Number(personaGateSummary.p0 || 0) > 0);

  let verdict = "ACCEPT";
  const reasons = [];
  if (!proof.verify.ok) {
    verdict = "REJECT";
    reasons.push("Core codex_verify fast failed.");
  } else if (severeRegression) {
    verdict = "REJECT";
    reasons.push("Persona gate reported P0 failures.");
  } else if (failedTargetedTests.length > 0 || !proof.manualQa.ok || !proof.reviewPacket.ok) {
    verdict = "REVISE";
    if (failedTargetedTests.length > 0) reasons.push("One or more required targeted checks failed or did not emit expected outputs.");
    if (!proof.manualQa.ok) reasons.push("Required manual QA note is missing.");
    if (!proof.reviewPacket.ok) reasons.push("Required review packet is missing or incomplete.");
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
