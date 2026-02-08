import { promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const outDir = path.join(repoRoot, ".project_memory", "ops", "out");
const outPath = path.join(outDir, "topic_grind_contracts_acceptance.json");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function addCheck(checks, name, ok, details = "") {
  checks.push({ name, ok: Boolean(ok), details: String(details || "") });
}

async function readText(relPath) {
  return fs.readFile(path.join(repoRoot, relPath), "utf8");
}

async function waitForServer(baseUrl, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/api/mentor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "noop", payload: {} }),
      });
      if (res.status >= 400 || res.status < 600) return;
    } catch {
      // not up yet
    }
    await delay(300);
  }
  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

async function postMentor(baseUrl, body) {
  const res = await fetch(`${baseUrl}/api/mentor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    json = { raw };
  }
  return { status: res.status, json };
}

function parseContract(resp) {
  const structured = resp?.json?.data?.structured;
  if (structured && typeof structured === "object") return structured;
  const txt = String(resp?.json?.data?.text || "").trim();
  if (!txt) return null;
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

function isNonEmptyArray(v) {
  return Array.isArray(v) && v.length > 0;
}

async function run() {
  const checks = [];
  const apiSnapshots = {};
  const port = Number(process.env.MENTOR_TEST_PORT || 3052);
  const baseUrl = `http://localhost:${port}`;

  const topicHubText = await readText("src/pages/TopicHub.tsx");
  const serverText = await readText("server/index.cjs");

  addCheck(
    checks,
    "topic_hub_grind_topic_mode_wired",
    topicHubText.includes("grind_topic_v1"),
    "TopicHub Grind drawer should call grind_topic_v1 for non-triangles."
  );
  addCheck(
    checks,
    "topic_hub_priority_grind_keys_present",
    topicHubText.includes("PRIORITY_TOPIC_GRIND_KEYS"),
    "TopicHub should declare priority topic set for non-triangles grind."
  );
  addCheck(
    checks,
    "server_topic_grind_contract_handler_present",
    serverText.includes("buildGrindTopicContractFallback") &&
      serverText.includes("grind_topic_v1"),
    "Server should expose deterministic grind_topic_v1 contract handler."
  );

  const serverProc = spawn(process.execPath, ["server/index.cjs"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(port),
      AI_PROVIDER: "",
      API_KEY: "",
      NODE_ENV: "test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const logs = [];
  serverProc.stdout.on("data", (chunk) => logs.push(String(chunk || "")));
  serverProc.stderr.on("data", (chunk) => logs.push(String(chunk || "")));

  try {
    await waitForServer(baseUrl);

    const basePayload = {
      subject: "Maths",
      grade: 10,
      section: "grind",
      subSection: "inline-doubt",
      mindmapNodeId: "n1",
      mindmapNodeTitle: "Core grind node",
      mindmapNodeText: "Board-writing focused grind node",
      questionText: "Give a board-style skeleton answer.",
      doubtContext: "Student needs exam-format drilling.",
    };

    const pairsReq = await postMentor(baseUrl, {
      mode: "grind_topic_v1",
      payload: {
        ...basePayload,
        topicKey: "pair-of-linear-equations",
        chapter: "pair-of-linear-equations",
      },
      messages: [{ role: "user", content: "Give me grind contract for pair of linear equations." }],
    });
    apiSnapshots.pair_of_linear_equations = pairsReq;
    const pairsContract = parseContract(pairsReq);
    addCheck(checks, "pair_eq_status_ok", pairsReq.status === 200, `status=${pairsReq.status}`);
    addCheck(
      checks,
      "pair_eq_contract_shape",
      Boolean(
        pairsContract &&
          pairsContract.type === "grind_topic_v1" &&
          String(pairsContract.topicKey || "") === "pair-of-linear-equations" &&
          isNonEmptyArray(pairsContract.board?.steps) &&
          Number.isFinite(Number(pairsContract.rubric?.marks)) &&
          isNonEmptyArray(pairsContract.rubric?.checkpoints) &&
          isNonEmptyArray(pairsContract.commonTraps) &&
          isNonEmptyArray(pairsContract.microDrills)
      ),
      JSON.stringify(pairsContract)
    );

    const electricityReq = await postMentor(baseUrl, {
      mode: "grind_topic_v1",
      payload: {
        ...basePayload,
        subject: "Science",
        topicKey: "electricity",
        chapter: "electricity",
      },
      messages: [{ role: "user", content: "Give me grind contract for electricity." }],
    });
    apiSnapshots.electricity = electricityReq;
    const electricityContract = parseContract(electricityReq);
    addCheck(checks, "electricity_status_ok", electricityReq.status === 200, `status=${electricityReq.status}`);
    addCheck(
      checks,
      "electricity_contract_shape",
      Boolean(
        electricityContract &&
          electricityContract.type === "grind_topic_v1" &&
          String(electricityContract.topicKey || "") === "electricity" &&
          isNonEmptyArray(electricityContract.board?.given) &&
          isNonEmptyArray(electricityContract.board?.steps) &&
          isNonEmptyArray(electricityContract.commonTraps) &&
          isNonEmptyArray(electricityContract.microDrills)
      ),
      JSON.stringify(electricityContract)
    );

    const unsupportedReq = await postMentor(baseUrl, {
      mode: "grind_topic_v1",
      payload: {
        ...basePayload,
        topicKey: "statistics",
        chapter: "statistics",
      },
      messages: [{ role: "user", content: "Give me grind contract for statistics." }],
    });
    apiSnapshots.unsupported = unsupportedReq;
    addCheck(
      checks,
      "unsupported_topic_rejected",
      unsupportedReq.status === 422,
      `status=${unsupportedReq.status} body=${JSON.stringify(unsupportedReq.json)}`
    );
  } finally {
    if (!serverProc.killed) {
      serverProc.kill("SIGTERM");
      await delay(300);
      if (!serverProc.killed) serverProc.kill("SIGKILL");
    }
  }

  const failed = checks.filter((check) => !check.ok);
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: checks.length,
      passed: checks.length - failed.length,
      failed: failed.length,
    },
    checks,
    apiSnapshots,
    logs: logs.slice(-200),
  };

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(report, null, 2), "utf8");

  if (failed.length) {
    console.error(`Topic grind contracts acceptance FAILED (${failed.length}/${checks.length})`);
    failed.forEach((f) => console.error(`- ${f.name}: ${f.details}`));
    console.error(`Report: ${path.relative(repoRoot, outPath)}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Topic grind contracts acceptance PASSED (${checks.length}/${checks.length}).`);
  console.log(`Report: ${path.relative(repoRoot, outPath)}`);
}

run().catch(async (err) => {
  const report = {
    generatedAt: new Date().toISOString(),
    error: String(err?.stack || err?.message || err),
  };
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(report, null, 2), "utf8");
  console.error("Topic grind contracts acceptance errored.");
  console.error(String(err?.stack || err));
  console.error(`Report: ${path.relative(repoRoot, outPath)}`);
  process.exitCode = 1;
});

