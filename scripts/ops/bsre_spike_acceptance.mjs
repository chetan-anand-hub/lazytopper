import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, ".project_memory", "ops", "out");
const outFile = path.join(outDir, "bsre_spike_acceptance.json");

function check(name, ok, details = "") {
  return { name, ok: Boolean(ok), details: String(details || "") };
}

function fileMissing(rel) {
  return !existsSync(path.join(repoRoot, rel));
}

function rg(query) {
  const res = spawnSync("rg", ["-n", query, "src", "scripts", "server"], {
    cwd: repoRoot,
    shell: process.platform === "win32",
    encoding: "utf8",
  });
  if ((res.status ?? 1) === 1) return [];
  return String(res.stdout || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((line) => !line.includes("bsre_spike_acceptance"));
}

function run() {
  const checks = [];

  checks.push(check("bsre_types_deleted", fileMissing("src/engine/bsre/types.ts"), "BSRE spike type file should be removed"));
  checks.push(check("bsre_evaluator_deleted", fileMissing("src/engine/bsre/evaluator.ts"), "BSRE spike evaluator should be removed"));

  const refs = rg("engine/bsre|BsreEvaluator|triangles_bsre_rubrics_v1");
  checks.push(check("no_bsre_runtime_refs", refs.length === 0, refs.length ? refs.join(" | ") : "none"));

  const failed = checks.filter((c) => !c.ok);
  const report = {
    generatedAt: new Date().toISOString(),
    summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
    checks,
  };

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, JSON.stringify(report, null, 2), "utf8");

  console.log(`bsre spike acceptance: ${report.summary.passed}/${report.summary.total}`);
  console.log(`report: ${path.relative(repoRoot, outFile)}`);

  if (failed.length) process.exit(1);
}

run();