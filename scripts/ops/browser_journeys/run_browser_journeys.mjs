import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureOutDir, launchJourneyBrowser, outDir, startJourneyStack, stopJourneyStack, writeJourneyReport } from "./browser_journey_lib.mjs";
import { journey as topichubGuidedEntryJourney } from "./journeys/topichub_guided_entry_journey.mjs";
import { journey as practiceHelpEscalationJourney } from "./journeys/practice_help_escalation_journey.mjs";
import { journey as mentorKindnessJourney } from "./journeys/mentor_kindness_and_recovery_journey.mjs";
import { journey as boardReadinessJourney } from "./journeys/board_readiness_journey.mjs";
import { journey as trianglesHumanTutorJourney } from "./journeys/triangles_human_tutor_browser_journey.mjs";

const journeys = [
  topichubGuidedEntryJourney,
  practiceHelpEscalationJourney,
  mentorKindnessJourney,
  boardReadinessJourney,
  trianglesHumanTutorJourney,
];

function shouldRestartJourney(error) {
  const text = String(error?.stack || error || "");
  return /ERR_CONNECTION_REFUSED|Target page, context or browser has been closed|Browser has been closed/i.test(text);
}

function parseRequestedJourneyIds() {
  const flag = process.argv.find((arg) => arg.startsWith("--journeys="));
  if (!flag) return journeys.map((journey) => journey.id);
  const ids = flag
    .slice("--journeys=".length)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return ids.length > 0 ? ids : journeys.map((journey) => journey.id);
}

async function main() {
  const requestedIds = new Set(parseRequestedJourneyIds());
  const selectedJourneys = journeys.filter((journey) => requestedIds.has(journey.id));
  if (selectedJourneys.length === 0) {
    throw new Error(`No browser journeys matched: ${Array.from(requestedIds).join(", ")}`);
  }

  await ensureOutDir();
  let runtime = await startJourneyStack();
  let browser = await launchJourneyBrowser();
  const results = [];

  const restartRuntime = async () => {
    try {
      await browser.close();
    } catch {
      // best effort only
    }
    await stopJourneyStack(runtime);
    runtime = await startJourneyStack();
    browser = await launchJourneyBrowser();
  };

  try {
    for (const journey of selectedJourneys) {
      const startedAt = Date.now();
      let attempt = 0;
      let completed = false;
      while (!completed && attempt < 2) {
        try {
          const runResult = await journey.run({ browser, baseUrl: runtime.baseUrl, apiBaseUrl: runtime.apiBaseUrl });
          const { report, outPath } = await writeJourneyReport({
            id: journey.id,
            area: journey.area,
            title: journey.title,
            startUrl: runResult.startUrl,
            checks: runResult.checks,
            meta: {
              durationMs: Date.now() - startedAt,
              attempts: attempt + 1,
              ...(runResult.meta || {}),
            },
          });
          results.push({ id: journey.id, area: journey.area, outPath, report });
          completed = true;
        } catch (error) {
          if (attempt === 0 && shouldRestartJourney(error)) {
            attempt += 1;
            await restartRuntime();
            continue;
          }
          const { report, outPath } = await writeJourneyReport({
            id: journey.id,
            area: journey.area,
            title: journey.title,
            startUrl: runtime.baseUrl,
            checks: [
              {
                name: "journey_runtime_failure",
                ok: false,
                details: String(error?.stack || error),
                severity: "P0",
              },
            ],
            meta: {
              durationMs: Date.now() - startedAt,
              attempts: attempt + 1,
            },
          });
          results.push({ id: journey.id, area: journey.area, outPath, report });
          completed = true;
        }
      }
    }
  } finally {
    await browser.close();
    await stopJourneyStack(runtime);
  }

  const failedJourneys = results.filter((item) => item.report.verdict !== "PASS");
  const summary = {
    totalJourneys: results.length,
    passedJourneys: results.length - failedJourneys.length,
    failedJourneys: failedJourneys.length,
    p0: results.reduce((sum, item) => sum + Number(item.report.summary?.p0 || 0), 0),
    p1: results.reduce((sum, item) => sum + Number(item.report.summary?.p1 || 0), 0),
    p2: results.reduce((sum, item) => sum + Number(item.report.summary?.p2 || 0), 0),
  };

  const aggregate = {
    generatedAt: new Date().toISOString(),
    selectedJourneyIds: selectedJourneys.map((journey) => journey.id),
    summary,
    journeys: results.map((item) => ({
      id: item.id,
      area: item.area,
      verdict: item.report.verdict,
      reportPath: item.outPath,
      summary: item.report.summary,
    })),
  };

  const aggregatePath = path.join(outDir, "browser_journey_gate_audit.json");
  await fs.writeFile(aggregatePath, JSON.stringify(aggregate, null, 2), "utf8");

  console.log(
    `browser_journeys total=${summary.totalJourneys} failed=${summary.failedJourneys} p0=${summary.p0} p1=${summary.p1} p2=${summary.p2}`
  );
  console.log(`report=${aggregatePath.replaceAll("\\", "/")}`);

  if (failedJourneys.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  await ensureOutDir();
  const aggregatePath = path.join(outDir, "browser_journey_gate_audit.json");
  await fs.writeFile(
    aggregatePath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        error: String(error?.stack || error),
      },
      null,
      2
    ),
    "utf8"
  );
  console.error(String(error?.stack || error));
  process.exitCode = 1;
});
