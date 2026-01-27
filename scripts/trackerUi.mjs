import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const IN_JSON = path.join(ROOT, ".project_memory", "tracker", "stage_status.json");
const OUT_DIR = path.join(ROOT, ".project_memory", "tracker_ui");
const OUT_HTML = path.join(OUT_DIR, "index.html");

if (!fs.existsSync(IN_JSON)) {
  console.error("Missing tracker json. Run: npm run tracker");
  process.exit(1);
}
const dataRaw = fs.readFileSync(IN_JSON, "utf8");

fs.mkdirSync(OUT_DIR, { recursive: true });

const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>LazyTopper Tracker — Screener</title>
<style>
:root{--bg:#0b0f14;--card:#0f1620;--muted:#94a3b8;--text:#e5e7eb;--good:#22c55e;--bad:#ef4444;--blue:#60a5fa;--border:#1f2937;}
*{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
header{position:sticky;top:0;z-index:9;display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);
background:linear-gradient(180deg, rgba(15,22,32,.95), rgba(11,15,20,.95));backdrop-filter: blur(10px);}
h1{font-size:20px;margin:0;font-weight:700}
main{max-width:1200px;margin:0 auto;padding:18px 20px}
.meta{color:var(--muted);font-size:12px;margin:10px 0 18px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 14px 10px;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.card h2{margin:0;font-size:16px}
.pill{display:inline-flex;align-items:center;gap:8px;font-size:12px;padding:6px 10px;border-radius:999px;border:1px solid var(--border);color:var(--muted);margin-top:8px}
.pill b{color:var(--text)}
.stage{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:10px 10px;margin-top:8px;border-radius:12px;border:1px solid rgba(31,41,55,.8);background:rgba(2,6,23,.35)}
.stage .left{display:flex;flex-direction:column;gap:4px}
.id{font-weight:800;letter-spacing:.3px}
.title{opacity:.92}
.state{font-size:12px;color:var(--muted)}
.badge{font-size:12px;font-weight:800;padding:6px 10px;border-radius:999px;border:1px solid var(--border);white-space:nowrap}
.done{color:var(--good);border-color:rgba(34,197,94,.35);background:rgba(34,197,94,.08)}
.doing{color:var(--blue);border-color:rgba(96,165,250,.35);background:rgba(96,165,250,.08)}
.todo{color:var(--muted)}
.blocked{color:var(--bad);border-color:rgba(239,68,68,.35);background:rgba(239,68,68,.08)}
.currentRing{outline:2px solid rgba(96,165,250,.55);box-shadow:0 0 0 6px rgba(96,165,250,.08);}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}
@media (max-width:980px){.grid{grid-template-columns:1fr}}
</style></head>
<body>
<header><h1>LazyTopper Tracker — Screener</h1></header>
<main>
<div class="meta">
  <div>Generated: <span class="mono" id="genAt"></span></div>
  <div>Overall current: <b class="mono" id="overall"></b></div>
</div>
<div class="grid" id="tracks"></div>
</main>
<script id="TRACKER_DATA" type="application/json">${dataRaw.replaceAll("<","\\u003c")}</script>
<script>
const data = JSON.parse(document.getElementById("TRACKER_DATA").textContent);
document.getElementById("genAt").textContent = data.generatedAt || "";
document.getElementById("overall").textContent = data.overallCurrent || "";
const tracksEl = document.getElementById("tracks");

function badgeClass(state){
  state = String(state||"").toUpperCase();
  if(state==="DONE"||state==="SKIP") return "badge done";
  if(state==="DOING") return "badge doing";
  if(state==="BLOCKED") return "badge blocked";
  return "badge todo";
}
function badgeText(state){
  state = String(state||"").toUpperCase();
  if(state==="SKIP") return "SKIP";
  if(state==="DONE") return "DONE";
  if(state==="DOING") return "DOING";
  if(state==="BLOCKED") return "BLOCKED";
  return "TODO";
}
for(const t of (data.tracks||[])){
  const card = document.createElement("div"); card.className="card";
  const h2 = document.createElement("h2"); h2.textContent=t.title||t.id; card.appendChild(h2);
  const pill = document.createElement("div"); pill.className="pill"; pill.innerHTML='Current: <b class="mono">'+(t.currentStage||"")+"</b>"; card.appendChild(pill);
  for(const s of (t.stages||[])){
    const row = document.createElement("div");
    row.className = "stage" + ((t.currentStage===s.id) ? " currentRing" : "");
    const left = document.createElement("div"); left.className="left";
    const id = document.createElement("div"); id.className="id mono"; id.textContent=s.id;
    const title = document.createElement("div"); title.className="title"; title.textContent=s.title||"";
    const st = document.createElement("div"); st.className="state mono"; st.textContent="state: "+badgeText(s.state);
    left.appendChild(id); left.appendChild(title); left.appendChild(st);
    const badge = document.createElement("div"); badge.className=badgeClass(s.state); badge.textContent=badgeText(s.state);
    row.appendChild(left); row.appendChild(badge);
    card.appendChild(row);
  }
  tracksEl.appendChild(card);
}
</script>
</body></html>`;

fs.writeFileSync(OUT_HTML, html, "utf8");
console.log("Wrote:", path.relative(ROOT, OUT_HTML));
