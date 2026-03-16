<!-- Category: Tracked Tooling (Governance); Purpose: Keep commits lane-pure and release-safe. -->
# Commit Lane Playbook

## Three Practical Buckets
- `Product`: user-facing behavior and runtime code (`src/`, `server/`, `public/`, product tests).
- `Tooling`: governance, scripts, CI/workflows, docs that improve delivery speed and quality.
- `Generated/Local`: evidence outputs and local-only helpers (`.project_memory/`, `docs/session/`, `docs/project_memory/test_runs/`, `docs/project_memory/strategy_reports/`, generated `docs/project_memory/review_packets/*_review.*` or timestamped packet instances, `RUN_*`, `tools/.local_ops/`) and never committed.

## Commit Rule (Hard)
- One commit = one lane + one intention.
- Never mix `Product` and `Tooling` files in a single commit.
- Never stage `Generated/Local` files.
- Track reusable review/QA infrastructure, not task-run artifacts:
  - track `tools/codex/`, `scripts/ops/`, stable governance docs, `docs/project_memory/review_packets/README.md`, and stable templates/contracts.
  - do not track generated packet instances, test-run summaries, strategy reports, or `.project_memory/` outputs.

## Pre-Commit Routine
1. `git status --short`
2. `npm run scope:guard -- --mode product` for product commits, or `npm run scope:guard` for tooling commits.
3. Product lane gates: `npm run lint:debt:check` and relevant acceptance tests.
4. Tooling lane gate: `npm run test:repo-boundary`.

## Push Rule
1. Push only after lane-specific checks pass.
2. Keep history readable: separate commit messages for product vs tooling.
3. If a commit touches both lanes, split it before pushing.
