import { execSync } from "child_process";

const rawArgs = process.argv.slice(2);
let mode = "tooling";
const modeIdx = rawArgs.indexOf("--mode");
if (modeIdx !== -1 && rawArgs[modeIdx + 1]) {
  mode = rawArgs[modeIdx + 1];
}

const ALLOWED_TOOLING = [
  "docs/project_memory/implementation/",
  "scripts/tracker",
  ".vscode/",
];

const ALLOWED_TUTOR = [
  "src/",
  "server/",
  "docs/project_memory/implementation/",
  "scripts/tracker",
  ".vscode/",
];

const ALLOWED_PREFIXES = mode === "tutor" ? ALLOWED_TUTOR : ALLOWED_TOOLING;

function listFiles(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" })
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const staged = listFiles("git diff --name-only --cached");
const unstaged = listFiles("git diff --name-only");
const all = Array.from(new Set([...staged, ...unstaged]));

const disallowed = all.filter((p) => !ALLOWED_PREFIXES.some((pre) => p.startsWith(pre)));

if (disallowed.length) {
  console.log("SCOPE_GUARD_FAIL: disallowed paths detected");
  console.log(`mode: ${mode}`);
  for (const p of disallowed) console.log(` - ${p}`);
  console.log("Allowed prefixes:");
  for (const pre of ALLOWED_PREFIXES) console.log(` - ${pre}`);
  process.exit(1);
}

console.log(`SCOPE_GUARD_OK (mode=${mode})`);
process.exit(0);
