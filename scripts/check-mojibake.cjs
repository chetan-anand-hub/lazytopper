const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const allowedExt = new Set(['.ts', '.tsx', '.js', '.cjs', '.mjs', '.json', '.md', '.txt', '.css', '.html', '.yml', '.yaml', '.ps1', '.sh']);
const excludedDirs = new Set(['node_modules', 'dist', 'build', '.next', '.git', 'coverage', '.cache', '.vite', '.turbo', 'out', '.vercel']);
const signatures = ['\u0393\u00c7', '\u00e2\u20ac\u2013', '\u00e2\u20ac\u2014', '\u00e2\u20ac\u2122', '\u00e2\u20ac\u02dc', '\u00e2\u20ac\u0153', '\u00e2\u20ac\u201d', '\u00e2\u20ac\u2026', '\u00c2 '];
const repoRoot = path.resolve(__dirname, '..');

const tracked = execSync('git ls-files', { cwd: repoRoot, encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);

const hits = [];

for (const rel of tracked) {
  const parts = rel.split(/[/\\]/);
  if (parts.some((part) => excludedDirs.has(part))) {
    continue;
  }
  const ext = path.extname(rel).toLowerCase();
  if (!allowedExt.has(ext)) {
    continue;
  }
  const abs = path.join(repoRoot, rel);
  let content;
  try {
    content = fs.readFileSync(abs, 'utf8');
  } catch (err) {
    continue;
  }
  const lines = content.split(/\r?\n/);
  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx];
    for (const sig of signatures) {
      if (line.includes(sig)) {
        hits.push({ file: rel, line: idx + 1, sig, snippet: line.trim() });
        if (hits.length >= 50) break;
      }
    }
    if (hits.length >= 50) break;
  }
  if (hits.length >= 50) break;
}

if (hits.length > 0) {
  for (const hit of hits) {
    console.log(hit.file + ':' + hit.line + ':' + hit.sig + ':' + hit.snippet);
  }
  process.exitCode = 1;
} else {
  process.exitCode = 0;
}
