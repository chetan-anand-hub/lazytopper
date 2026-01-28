import { execSync } from "child_process";

const ALLOWED_PREFIXES = [
  "docs/project_memory/implementation/",
  "scripts/tracker",
  ".vscode/",
];

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
  for (const p of disallowed) console.log(` - ${p}`);
  console.log("Allowed prefixes:");
  for (const pre of ALLOWED_PREFIXES) console.log(` - ${pre}`);
  process.exit(1);
}

console.log("SCOPE_GUARD_OK");
process.exit(0);
