LazyTopper Phase 1 - Repo Cleanup (Quarantine-first)

Goal
- Make the repo launch-ready by removing Windows junk and moving non-runtime draft/roadmap/legacy files out of /src
- Preserve existing functionality and planned v1 scope (Dashboard, DailyMix, Weekly Wrapped, Planner, AI Mentor, Mock Builder, Predictive Engine, HPQ, Practice, TopicHub)

What's included
1) phase1_cleanup_manifest_2025-12-22.json
   - The authoritative list of actions (keep/move/delete) for the current repo snapshot.

2) Phase1_Apply_Quarantine.ps1
   - Applies the manifest safely.
   - Default behavior: "delete" actions are quarantined into _quarantine/phase1_deleted/ (NOT permanently removed).
   - Use -HardDelete to permanently delete.

3) phase1_file_bucket_map_2025-12-22.csv
   - Same manifest in spreadsheet-friendly format.

4) Phase1_SmokeTest_Checklist.txt
   - Manual checks for your must-ship UI after the move.

Recommended workflow (safe)
A) Create a new git branch (e.g., cleanup/phase1)
B) Copy these files into your repo root (same folder as package.json)
C) Run:
   - PowerShell: ./Phase1_Apply_Quarantine.ps1
D) Re-run Phase 0 checks:
   - npm run repo:check-imports
   - npm run repo:check-canonical-imports
   - npm run lint
   - npm run typecheck
   - npm run build
E) Run the smoke tests in Phase1_SmokeTest_Checklist.txt
F) Commit

Rollback
- Since the script only moves/quarantines, you can rollback via:
  - git restore / git checkout -- .
  - or move folders back from docs/_drafts, docs/_roadmap, docs/_legacy, and _quarantine/phase1_deleted.
