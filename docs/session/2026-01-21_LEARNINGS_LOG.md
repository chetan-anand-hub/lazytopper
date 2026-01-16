# 2026-01-21 Learnings Log

## Plan
- No new learnings yet (planning phase).

## Implement
- `src/pages/TopicHub.tsx` required UTF-8 normalization before large edits.

## 2026-01-21 - Convergence + docs integrity incident
- Root cause: untracked docs/session and new files -> git diff empty -> report-back couldn't show hunks.
- Fix: audit checkpoint commit (hash 464a334) before report-back.
- Root cause: zip verification asked but not enforced -> TBD placeholders.
- Fix: machine-output gate (Test-Path/Get-Item/Get-ChildItem) pasted into report.
- Root cause: encoding/BOM corruption made docs unreadable.
- Fix: normalize markdown to UTF-8 no BOM + replace mojibake with ASCII.
- Rule: "No TBD allowed in verification sections; stop-the-line if present".