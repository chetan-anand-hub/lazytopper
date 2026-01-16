# 2026-01-21 Grind Checklist (Triangles)

North Star: Start Triangles Grind v1 using trianglesGrindMindmap (marks-roadmap) without touching Learn UX.

## Scope lock
- [ ] Grind only (Triangles)
- [ ] No Learn tab UX changes
- [ ] No broad refactors

## Data
- [x] Add src/data/trianglesGrindMindmap.ts (seeded from handoff)

## UI
- [x] Add Triangles Grind entry/CTA in TopicHub (Grind tab)
- [x] Implement Grind drawer v1: left node list + right coach panel
- [x] Coach panel renders: rubric, board skeleton, traps, micro-drill, inline doubts

## Verification
- [ ] TypeScript build passes (tsc -b)
- [ ] Manual walkthrough: TopicHub -> Triangles -> Grind -> open drawer -> switch nodes -> submit doubt

## Packaging
- [ ] Zip snapshot exported (no node_modules/dist)
