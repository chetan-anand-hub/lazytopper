## Reviewer entry point
Start with `tools/codex/codex_gatekeeper.mjs`, then inspect `.project_memory/ops/out/browser_journey_gate_audit.json`, `.project_memory/ops/out/browser_persona_gate_audit.json`, and `.project_memory/ops/out/review_packet_semantic_validation.json`. After those reports, review the new browser journey files and the `package.json` script wiring to confirm the V2 gate is additive rather than disruptive.

## Task summary
This task upgrades LazyTopper Quality Gate from V1 to V2 by adding deterministic browser-journey acceptance checks and semantic review-packet validation on top of the existing codex verify, gatekeeper, and persona-bot infrastructure. The changes keep the V1 static persona and proof workflow intact, add reviewer-grade browser evidence for TopicHub, Practice, Mentor, and Triangles tutoring journeys, and make approval packets fail when they are structurally present but semantically weak.

## Changed files
- `scripts/ops/browser_journeys/browser_journey_lib.mjs`: adds the deterministic local browser stack bootstrap, authenticated page-open helper, report writer, and shared browser utilities used by every journey.
- `scripts/ops/browser_journeys/run_browser_journeys.mjs`: runs one or more named journeys, writes per-journey JSON outputs, and produces the aggregate `.project_memory/ops/out/browser_journey_gate_audit.json` report.
- `scripts/ops/browser_journeys/journeys/topichub_guided_entry_journey.mjs`: validates low-confusion TopicHub entry and coherent chapter guidance in the browser.
- `scripts/ops/browser_journeys/journeys/practice_help_escalation_journey.mjs`: validates Practice handholding, the Why panel, and mentor/help escalation reachability.
- `scripts/ops/browser_journeys/journeys/mentor_kindness_and_recovery_journey.mjs`: validates mentor recovery behavior and constructive fallback copy in a real browser flow.
- `scripts/ops/browser_journeys/journeys/board_readiness_journey.mjs`: validates board-readiness cues and exam-facing affordances in the active practice surface.
- `scripts/ops/browser_journeys/journeys/triangles_human_tutor_browser_journey.mjs`: validates that Triangles behaves like an honest partial tutor path rather than overstating maturity.
- `scripts/ops/browser_persona_gate_auditor.mjs`: maps browser journey outputs into persona-grade browser acceptance signals without replacing the existing static persona bots.
- `tools/codex/review_packet_utils.mjs`: centralizes review-packet parsing, governed changed-file collection, and packet helpers so generated local evidence does not pollute gate decisions.
- `tools/codex/validate_review_packet_semantics.mjs`: validates that review packets contain real changed files, meaningful rationale, aligned pass/fail claims, real manual QA references, and actionable reviewer instructions.
- `tools/codex/codex_gatekeeper.mjs`: now requires semantic packet validation and consumes browser/browser-persona summaries in addition to the existing V1 checks.
- `tools/codex/test_matrix.json`: extends the matrix so TopicHub, Practice, Mentor, tutor-path, and quality-gate changes can require browser journeys and semantic packet validation.
- `package.json`: adds deterministic entrypoints for browser journeys, browser persona aggregation, and semantic review validation.
- `docs/project_memory/review_packets/README.md`: documents the new structural-vs-semantic review split and when browser journeys are mandatory.
- `src/pages/TopicHub.tsx`: adds safe `data-testid` hooks so TopicHub browser tests can use deterministic selectors without changing runtime behavior.
- `src/pages/PracticePage.tsx`: adds safe `data-testid` hooks and a test-only `journeyMentor` deep-link helper so browser journeys can deterministically open the mentor/help drawer from Practice.
- `src/components/MentorPanel.tsx`: adds safe mentor data attributes and test IDs to support deterministic mentor/browser assertions.
- `src/context/AuthContext.tsx`: adds explicit E2E-only local auth bootstrap so browser journeys can reach the product surfaces reliably without depending on flaky network auth.

## Tests run
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/ops/codex_testing/codex_verify.ps1 -TaskName "quality-gate-v2-browser-semantic" -Suite fast`
- `npm run test:persona-gate`
- `npm run test:browser:journeys`
- `npm run test:persona-browser-gate`
- `npm run test:review-packet:semantic`
- `node tools/codex/codex_gatekeeper.mjs`

## Pass/fail
- `codex_verify`: PASS
- `persona gate`: PASS
- `browser journey gate`: PASS
- `browser persona gate`: PASS
- `semantic review validation`: PASS
- `gatekeeper`: pending until semantic validation and the final gate run complete

## Manual QA path
- `docs/project_memory/test_runs/20260316_075906_quality-gate-v2-browser-semantic_manualQA.md`

## Assumptions
The browser layer is intentionally deterministic and local-first: it assumes the repo should prefer explicit E2E auth fallback and stable test IDs over brittle visual heuristics. It also assumes generated proof files under `docs/project_memory/test_runs/` and `docs/project_memory/strategy_reports/` are local evidence, not governed product changes, so the gate should not treat them as substantive changed files.

## Known risks
Browser journeys still validate high-value flows rather than full end-to-end student coverage, so visual polish regressions or obscure edge cases can still escape automation. The semantic validator is strong enough to reject weak packets, but it still cannot judge deep curriculum quality or nuanced pedagogy judgment that requires a human reviewer. The E2E auth fallback is development-only, but because it touches the shared auth context it remains a surface that should be reviewed carefully.

## Reviewer checklist
- Verify the gatekeeper report includes browser journey and semantic validation summaries, not just the old V1 structural checks.
- Inspect the browser journey JSON reports and confirm each required journey passed with zero failed checks.
- Review `src/context/AuthContext.tsx`, `src/pages/PracticePage.tsx`, and `src/pages/TopicHub.tsx` to confirm the test hooks are additive and do not change normal user behavior when test flags are absent.
- Review `tools/codex/validate_review_packet_semantics.mjs` and confirm it checks real changed files, aligned pass/fail claims, and actionable reviewer content rather than only headings.
- Confirm the new `package.json` scripts are narrow wrappers over the new tooling and did not break any existing V1 test entrypoints.
