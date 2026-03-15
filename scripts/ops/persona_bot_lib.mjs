import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, "..", "..");
export const outDir = path.join(repoRoot, ".project_memory", "ops", "out");

export function makeCheck(name, ok, details = "", severity = "P2", remediation = "") {
  return {
    name,
    ok: Boolean(ok),
    details: String(details || ""),
    severity,
    remediation: String(remediation || ""),
  };
}

export async function ensureOutDir() {
  await fs.mkdir(outDir, { recursive: true });
}

export async function readText(relPath) {
  return fs.readFile(path.join(repoRoot, relPath), "utf8");
}

export async function fileExists(relPath) {
  try {
    await fs.access(path.join(repoRoot, relPath));
    return true;
  } catch {
    return false;
  }
}

export function runNodeScript(relPath, args = []) {
  const scriptAbs = path.join(repoRoot, relPath);
  const result = spawnSync(process.execPath, [scriptAbs, ...args], {
    cwd: repoRoot,
    env: { ...process.env },
    shell: false,
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

export async function readJsonOutput(fileName) {
  const absPath = path.join(outDir, fileName);
  const raw = await fs.readFile(absPath, "utf8");
  return JSON.parse(raw);
}

export function countMatches(text, pattern) {
  const regex = pattern instanceof RegExp ? pattern : new RegExp(String(pattern), "g");
  return [...String(text || "").matchAll(regex)].length;
}

function rewriteRelativeSpecifiers(code) {
  return code.replace(/((?:from|import)\s*["'])(\.{1,2}\/[^"']+)(["'])/g, (match, prefix, specifier, suffix) => {
    if (/\.(?:[cm]?js|json|mjs)$/.test(specifier)) return `${prefix}${specifier}${suffix}`;
    if (specifier.endsWith(".ts")) return `${prefix}${specifier.replace(/\.ts$/, ".mjs")}${suffix}`;
    return `${prefix}${specifier}.mjs${suffix}`;
  });
}

export async function loadTutorRegistry() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "lt-persona-registry-"));
  const files = [
    "src/data/tutor/tutorFlowTypes.ts",
    "src/data/tutor/topics/trigonometryTutorPath.ts",
    "src/data/tutor/topics/trianglesTutorPath.ts",
    "src/data/tutor/chapterTutorRegistry.ts",
  ];

  try {
    for (const relPath of files) {
      const absPath = path.join(repoRoot, relPath);
      const source = await fs.readFile(absPath, "utf8");
      const transpiled = ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ES2022,
          target: ts.ScriptTarget.ES2022,
        },
        fileName: absPath,
      }).outputText;
      const outPath = path.join(tempDir, relPath).replace(/\.ts$/, ".mjs");
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, rewriteRelativeSpecifiers(transpiled), "utf8");
    }
    const mod = await import(pathToFileURL(path.join(tempDir, "src/data/tutor/chapterTutorRegistry.mjs")).href);
    return mod.chapterTutorRegistry;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

export async function finalizeBotReport({ reportFileName, bot, checks, extra = {} }) {
  await ensureOutDir();
  const failedChecks = checks.filter((check) => !check.ok);
  const severityCounts = {
    P0: failedChecks.filter((check) => check.severity === "P0").length,
    P1: failedChecks.filter((check) => check.severity === "P1").length,
    P2: failedChecks.filter((check) => check.severity === "P2").length,
  };
  const verdict = failedChecks.length === 0 ? "PASS" : "FAIL";
  const report = {
    generatedAt: new Date().toISOString(),
    bot,
    summary: {
      total: checks.length,
      passed: checks.length - failedChecks.length,
      failed: failedChecks.length,
      verdict,
      severities: severityCounts,
    },
    checks,
    ...extra,
  };

  const absPath = path.join(outDir, reportFileName);
  await fs.writeFile(absPath, JSON.stringify(report, null, 2), "utf8");

  if (failedChecks.length > 0) {
    console.error(`${bot.id}: FAIL (${failedChecks.length}/${checks.length})`);
    for (const check of failedChecks) {
      console.error(`- [${check.severity}] ${check.name}: ${check.details}`);
    }
    console.error(`Report: ${path.relative(repoRoot, absPath).replaceAll("\\", "/")}`);
    process.exitCode = 1;
    return report;
  }

  console.log(`${bot.id}: PASS (${checks.length}/${checks.length})`);
  console.log(`Report: ${path.relative(repoRoot, absPath).replaceAll("\\", "/")}`);
  return report;
}
