Last Updated: 2026-01-16 09:24

# Triangles Learn Tab - Tutor Drawer v2 Session Checklist (21-01-2026)
**Last Updated:** 2026-01-16 09:24

## 0) Session guardrails (must be visible at top of MASTER_REPORT)
- [x] North Star written in docs/session/2026-01-21_MASTER_REPORT.md
- [x] Scope box explicitly says: **only Triangles -> Learn tab + drawer**
- [x] Parking Lot file exists and is used for non-blocking ideas

## 1) Repo wiring & entry points
- [x] â€œLet me teach youâ€ CTA exists on **Triangles -> Learn** page
- [x] CTA opens Tutor Drawer directly into **Teach tab**
- [x] Default Teach starts at **first node** in trianglesGuidedMindmap.recommendedOrder
- [x] Any old â€œAsk mentorâ€ buttons in Triangles Learn are repointed to open this same drawer (no extra panels)

**Acceptance check:** Student clicks once and is *immediately in teaching*, not in â€œchoose mode confusionâ€.

## 2) Tutor Drawer v2 UI (locked UX)
### Structure
- [x] Drawer header reads **Tutor** (or locked header copy)
- [x] Only **2 tabs** exist: **Teach** | **Board Examples**
- [x] Shared context state exists (chapterId/cardId/nodeId/stepIndex/lastDiagram/lastResponseId)

### Teach tab layout (in this order)
- [x] Diagram block renders **first**
- [x] Short teach explanation (snacky bullets)
- [x] Quick check (single check)
- [x] Buttons row includes:
  - [x] Continue
  - [x] Ask a doubt (opens inline doubt input / focuses it)
  - [x] **Show an example for this** (switches to Examples tab)

### Board Examples tab layout
- [x] Diagram block renders **first**
- [x] teach.simpleExplanation bullets render
- [x] teach.cbseExamSentence highlighted as â€œExam lineâ€
- [x] Worked examples show **exactly 2**:
  - [x] Example 1: Basic
  - [x] Example 2: Board-style
- [x] Common mistakes render (>=1)
- [x] Check question renders
- [x] Button: **Back to teaching (Resume Step X)**

## 3) Mindmap as the â€œsoulâ€ (Teach progression)
- [x] Teach uses current nodeId from mindmap data
- [x] â€œNext conceptâ€ advances to the next node in recommendedOrder
- [x] (Optional) Jump-to concept dropdown exists (if implemented)
- [x] Current concept title visibly shown (â€œYouâ€™re learning: <node title>â€)

**Acceptance check:** A student can continue step-by-step without needing to interpret the mindmap visually.

## 4) Hard Gates (must exist in both tabs)
### Schema gate
- [x] If schema invalid -> **Friendly error UI** appears (not blank)
- [x] Error UI includes **Retry** button
- [x] Retry re-requests **exactly once** (no loops)

### Diagram gate (geometry strict)
- [x] If diagram missing/irrelevant -> **Diagram missing/bad** error UI + Retry
- [x] No teaching/explanation renders without a diagram block container

## 5) Inline Doubts (Option A) â€” embedded in BOTH tabs
- [x] Single inline doubt input exists in Teach and Examples
- [x] Doubt submit sends full context:
  - [x] chapter/topicKey
  - [x] cardTitle
  - [x] tab (teach/examples)
  - [x] nodeId/title
  - [x] stepIndex
  - [x] lastResponseId/text summary
- [x] Tutor answer appears inline (no new drawer/panel)
- [x] After answer, **Option A buttons** always shown:
  - [x] Resume (returns to exact step)
  - [x] Explain simpler (re-runs same step)
  - [x] Show board example (switches to Examples, same node)

## 6) Request discipline (no storms)
- [x] No API calls on typing
- [x] API calls only on:
  - [x] Open drawer
  - [x] Tab switch
  - [x] Continue / Next concept
  - [x] Example type change (if exists)
  - [x] Doubt submit
  - [x] Retry
- [x] In-flight requests cancelled on tab switch
- [x] No infinite re-render loops
- [ ] Console clean (no repeated POST storms / max update depth)

## 7) DoD compliance checkpoints (Triangles Learn)
- [x] Teach-first is true (no MCQ-first / blank-first)
- [x] Diagram-first is enforced for geometry
- [x] Two modes meaningfully different (Teach â‰  Examples)
- [x] Two-level progression preserved (Basic + Board-style)
- [x] No â€œA/B/C/Dâ€ MCQ text leaks into Learn output
- [x] Friendly failures, never empty outputs

## 8) Build + verification
- [x] npm run build passes
- [ ] Manual walkthrough:
  - [ ] TopicHub -> Triangles -> Learn -> â€œLet me teach youâ€
  - [ ] Teach shows diagram + teach + quick check
  - [ ] â€œShow an example for thisâ€ -> Examples tab correct content
  - [ ] Examples shows 2 examples + marks + mistakes + checkQ
  - [ ] Doubt works and resumes correctly
  - [ ] No request storms

## 9) Documentation deliverables (must be present)
- [x] docs/session/2026-01-21_MASTER_REPORT.md updated
- [ ] docs/session/2026-01-21_CHANGELOG.md updated
- [ ] docs/session/2026-01-21_LEARNINGS_LOG.md updated
- [ ] docs/session/2026-01-21_PARKING_LOT.md updated (if needed)

## 10) Packaging deliverable
- [x] ZIP exported as LazyTopper_repo_snapshot_21-01-2026_LEARN_SHIPPED.zip
- [x] Excludes node_modules/build caches/.git
- [x] Stored at target folder

## â€œStop-the-lineâ€ instant fail flags
If any of these occur, stop and fix immediately:
- [ ] No diagram but explanation renders
- [ ] Examples show â‰  2 examples
- [ ] Doubt loses context / canâ€™t resume step
- [ ] Request storm / repeated API calls
- [ ] Blank output or silent fail
- [ ] Build fails

## Notes
- Docs normalized to UTF-8 (no BOM)
- Re-test set to pending until manual walkthrough is done
- Report-back convergence fix: audit checkpoint + machine verification gate
