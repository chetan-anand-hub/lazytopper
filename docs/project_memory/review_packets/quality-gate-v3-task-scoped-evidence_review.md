## Task id
quality-gate-v3-task-scoped-evidence

## Evidence bundle
- Manifest: `docs/project_memory/test_runs/quality-gate-v3-task-scoped-evidence/manifest.json`
- Task test bundle: `docs/project_memory/test_runs/quality-gate-v3-task-scoped-evidence`
- Task ops outputs: `.project_memory/ops/out/quality-gate-v3-task-scoped-evidence`

## Reviewer entry point
Open the manifest first, then inspect the gatekeeper report and the task-scoped browser/persona/semantic JSON outputs inside `.project_memory/ops/out/quality-gate-v3-task-scoped-evidence`. Use this review packet as the human-readable index, not as the source-of-truth by itself.

## Task summary
Quality Gate V3 task-scopes review evidence, upgrades browser coverage to scenario-aware journeys, adds an advanced value-seeking student persona, and binds packet validation to manifest-backed proof.

## Changed files
- `docs/project_memory/review_packets/README.md`: Reviewer workflow documentation for task-scoped evidence and V3 semantics lives here.
- `package.json`: V3 wrapper scripts and task-id entrypoints are wired here.
- `scripts/ops/browser_journeys/browser_journey_lib.mjs`: Scenario-aware browser journey execution and task-scoped evidence output live here.
- `scripts/ops/browser_journeys/journeys/board_readiness_journey.mjs`: Scenario-aware browser journey execution and task-scoped evidence output live here.
- `scripts/ops/browser_journeys/journeys/mentor_kindness_and_recovery_journey.mjs`: Scenario-aware browser journey execution and task-scoped evidence output live here.
- `scripts/ops/browser_journeys/journeys/practice_help_escalation_journey.mjs`: Scenario-aware browser journey execution and task-scoped evidence output live here.
- `scripts/ops/browser_journeys/journeys/topichub_guided_entry_journey.mjs`: Scenario-aware browser journey execution and task-scoped evidence output live here.
- `scripts/ops/browser_journeys/journeys/triangles_human_tutor_browser_journey.mjs`: Scenario-aware browser journey execution and task-scoped evidence output live here.
- `scripts/ops/browser_journeys/run_browser_journeys.mjs`: Scenario-aware browser journey execution and task-scoped evidence output live here.
- `scripts/ops/browser_journeys/scenario_matrix.json`: Scenario-aware browser journey execution and task-scoped evidence output live here.
- `scripts/ops/browser_persona_gate_auditor.mjs`: Browser-backed persona mapping and scenario-aware acceptance aggregation live here.
- `scripts/ops/codex_testing/codex_verify.ps1`: Touched by this task; inspect alongside the task manifest and proof reports.
- `scripts/ops/persona_bot_lib.mjs`: Static persona execution and task-scoped report writing live here.
- `scripts/ops/persona_gate_auditor.mjs`: Static persona execution and task-scoped report writing live here.
- `scripts/ops/student_bots/advanced_value_seeking_student_bot.mjs`: The high-agency student value check is implemented here.
- `tools/codex/codex_gatekeeper.mjs`: Task-scoped gate resolution, manifest-driven proof lookup, and V3 approval decisions live here.
- `tools/codex/generate_review_packet.mjs`: Review packets are generated from manifest-backed task evidence here.
- `tools/codex/review_packet_utils.mjs`: Shared task-bundle lookup and manifest path resolution live here.
- `tools/codex/task_evidence_utils.mjs`: Shared task-bundle lookup and manifest path resolution live here.
- `tools/codex/validate_review_packet_semantics.mjs`: Evidence-linked packet truth checks and reviewer-readiness scoring live here.

## Tests run
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/ops/codex_testing/codex_verify.ps1 -TaskName quality-gate-v3-task-scoped-evidence -Suite fast -TaskId quality-gate-v3-task-scoped-evidence`
- `npm run test:persona-gate -- --task-id quality-gate-v3-task-scoped-evidence`
- `npm run test:browser:journeys -- --task-id quality-gate-v3-task-scoped-evidence`
- `npm run test:persona-browser-gate -- --task-id quality-gate-v3-task-scoped-evidence`
- `npm run test:review-packet:semantic -- --task-id quality-gate-v3-task-scoped-evidence`

## Pass/fail
- `codex_verify`: PASS
- `codex verify`: PASS
- `persona gate`: PASS
- `browser journey`: PASS
- `browser persona`: PASS
- `review packet semantic validation`: PASS

## Manual QA path
- `docs/project_memory/test_runs/quality-gate-v3-task-scoped-evidence/quality-gate-v3-task-scoped-evidence_manualQA.md`

## Assumptions
- Task-scoped evidence is now the primary approval path whenever a task id is supplied to the gate scripts.
- Existing V1/V2 commands remain valid entrypoints, with V3 behavior activated through task-scoped flags and bundle-aware utilities.

## Known risks
- Browser journeys remain high-value smoke coverage, not exhaustive end-to-end coverage across every chapter and device state.
- Review-packet semantics are now evidence-linked, but nuanced pedagogy and final reviewer judgment still remain human responsibilities.

## Reviewer checklist
- Verify the manifest task id, changed files, and proof artifact paths all refer to the same task bundle.
- Review the task-scoped browser journey and browser persona JSON reports before trusting the pass/fail summary.
- Confirm the semantic review validator agrees with the packet claims and marks the packet reviewer-ready.
- Treat ZIP exports, if any are mentioned elsewhere, as secondary fallback review material only.