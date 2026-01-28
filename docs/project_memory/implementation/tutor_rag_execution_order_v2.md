# One-Session RAG Execution Order (v2) — with Tooling Health Pre-Block

## B0 — Tooling Health Gate (pre-flight)
Pass criteria: build + tracker + doctor succeed before any tutor RAG work.
- npm run build
- npm run tracker
- npm run tracker:doctor

## B1 — Contract canonicalization (Triangles)

## B2 — Attempt loop + BSRE

## B3 — Hint ladder runtime (H0→H3)

## B4 — Mistake map + remediation drills

## B5 — Mastery gate + spaced review

## B6 — Public ship MVP (deploy + feedback loop)

## Nomenclature Rule
- Roadmap stages: R*
- Blackbox: S*
- Detours: D*
- Tutor RAG blocks: B*
- Tracker must keep these as separate tracks to avoid conflict

## B1 deliverable definition
Canonical tutor contracts live in `src/contracts/tutorContracts.ts` and are enforced on the server (fallback on invalid output).
## B2 deliverable definition
- Tutor responses include an optional attempt_loop (diagnosis + next_action + bsre).
- Server attaches deterministic attempt_loop for Triangles attempts and falls back safely.
- UI shows a compact Attempt Feedback panel when attempt_loop is present.

