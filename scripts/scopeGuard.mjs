import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const POLICY_PATH = path.join(
  ROOT,
  "docs",
  "project_memory",
  "governance",
  "repo_boundary_policy.json"
);

const rawArgs = process.argv.slice(2);
const modeIdx = rawArgs.indexOf("--mode");
const mode = modeIdx !== -1 && rawArgs[modeIdx + 1] ? rawArgs[modeIdx + 1] : "tooling";

function normalizePath(filePath) {
  return String(filePath || "").replace(/\\/g, "/").replace(/^\.\//, "").trim();
}

function toRule(rule) {
  return normalizePath(rule).toLowerCase();
}

function listFiles(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" })
      .split(/\r?\n/)
      .map((line) => normalizePath(line))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function readPolicy() {
  if (!fs.existsSync(POLICY_PATH)) {
    throw new Error(`scopeGuard: missing policy file at ${normalizePath(POLICY_PATH)}`);
  }
  const parsed = JSON.parse(fs.readFileSync(POLICY_PATH, "utf8"));
  const lanes = parsed?.lanes || {};
  const modeToLanes = parsed?.modeToLanes || {};
  if (!lanes.product || !lanes.trackedTooling || !lanes.generatedEvidence || !lanes.localOnly) {
    throw new Error("scopeGuard: invalid boundary policy (missing required lane arrays).");
  }
  return { lanes, modeToLanes };
}

function matchesRule(filePath, rule) {
  const file = normalizePath(filePath).toLowerCase();
  const matchRule = toRule(rule);
  if (!matchRule) return false;
  if (matchRule.endsWith("/")) return file.startsWith(matchRule);
  return file === matchRule || file.startsWith(`${matchRule}/`);
}

function inLane(filePath, rules) {
  return rules.some((rule) => matchesRule(filePath, rule));
}

function classifyFile(filePath, lanes) {
  if (inLane(filePath, lanes.generatedEvidence)) return "generatedEvidence";
  if (inLane(filePath, lanes.localOnly)) return "localOnly";
  if (inLane(filePath, lanes.product)) return "product";
  if (inLane(filePath, lanes.trackedTooling)) return "trackedTooling";
  return "unknown";
}

function toLaneLabel(laneKey) {
  if (laneKey === "generatedEvidence") return "generated evidence";
  if (laneKey === "localOnly") return "local-only";
  if (laneKey === "trackedTooling") return "tracked tooling";
  return laneKey;
}

function printList(header, files) {
  if (!files.length) return;
  console.log(header);
  for (const file of files) console.log(` - ${file}`);
}

function main() {
  const { lanes, modeToLanes } = readPolicy();
  const allowedLanes = modeToLanes[mode];
  if (!Array.isArray(allowedLanes) || !allowedLanes.length) {
    console.log(`SCOPE_GUARD_FAIL: unknown mode "${mode}"`);
    console.log(`Known modes: ${Object.keys(modeToLanes).join(", ")}`);
    process.exit(1);
  }

  const staged = listFiles("git diff --name-only --cached");
  const unstaged = listFiles("git diff --name-only");
  const untracked = listFiles("git ls-files --others --exclude-standard");
  const all = Array.from(new Set([...staged, ...unstaged, ...untracked]));

  if (!all.length) {
    console.log(`SCOPE_GUARD_OK (mode=${mode}, no changes)`);
    process.exit(0);
  }

  const laneBuckets = {
    product: [],
    trackedTooling: [],
    generatedEvidence: [],
    localOnly: [],
    unknown: [],
  };

  for (const file of all) {
    const lane = classifyFile(file, lanes);
    laneBuckets[lane].push(file);
  }

  const hardBoundaryViolations = [
    ...laneBuckets.generatedEvidence.map((file) => ({ lane: "generatedEvidence", file })),
    ...laneBuckets.localOnly.map((file) => ({ lane: "localOnly", file })),
    ...laneBuckets.unknown.map((file) => ({ lane: "unknown", file })),
  ];

  const changedLanes = ["product", "trackedTooling"].filter((lane) => laneBuckets[lane].length > 0);
  const disallowedLaneChanges = changedLanes
    .filter((lane) => !allowedLanes.includes(lane))
    .flatMap((lane) => laneBuckets[lane].map((file) => ({ lane, file })));

  const hasFailure = hardBoundaryViolations.length > 0 || disallowedLaneChanges.length > 0;
  if (!hasFailure) {
    console.log(
      `SCOPE_GUARD_OK (mode=${mode}, lanes=${changedLanes.length ? changedLanes.join("+") : "none"})`
    );
    process.exit(0);
  }

  console.log("SCOPE_GUARD_FAIL");
  console.log(`mode: ${mode}`);
  console.log(`allowed lanes: ${allowedLanes.join(", ")}`);

  if (hardBoundaryViolations.length) {
    console.log("hard-boundary violations:");
    for (const item of hardBoundaryViolations) {
      const label = item.lane === "unknown" ? "unclassified" : toLaneLabel(item.lane);
      console.log(` - [${label}] ${item.file}`);
    }
  }

  if (disallowedLaneChanges.length) {
    console.log("lane violations:");
    for (const item of disallowedLaneChanges) {
      console.log(` - [${toLaneLabel(item.lane)}] ${item.file}`);
    }
  }

  printList("changed product files:", laneBuckets.product);
  printList("changed tracked tooling files:", laneBuckets.trackedTooling);
  process.exit(1);
}

main();
