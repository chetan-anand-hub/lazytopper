# CI lint + tooling commit rules

## Why CI lint differs from local full lint
CI lint runs only on files changed against `origin/feature/topichub-ui-lock` so we can keep CI green while legacy lint debt remains. Full lint still exists for local cleanup and focused refactors.

## Rule
Rule: CI lint blocks only new/changed files; legacy debt is tracked separately.

## When to run lint:full
- Before large refactors or cleanup work that targets legacy lint errors.
- When making sweeping formatting or dependency updates that touch many files.
- When explicitly asked to remediate existing lint debt.

## Commit policy
- Commit/push: tooling changes that are allowed by the tooling scope guard (examples: `.gitattributes`, `scripts/lintCi.mjs`, this document, `package.json`).
- Never commit: generated artifacts under `.project_memory/` or any local outputs. Keep those local and out of git.
