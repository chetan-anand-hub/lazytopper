# Codex Review Packet Standard

Every substantial Codex task should add a packet under this folder using:
`<timestamp>_<task>.md`

Required sections:
- `## Reviewer entry point`
- `## Task summary`
- `## Changed files`
- `## Tests run`
- `## Pass/fail`
- `## Manual QA path`
- `## Assumptions`
- `## Known risks`
- `## Reviewer checklist`

Purpose:
- give reviewers one deterministic entry point
- tie code changes to proof artifacts
- capture assumptions and residual risks before lane-wise commit/push

Validation:
- Structural validation checks the required headings exist.
- Semantic validation checks the packet is useful: real changed files, real tests, aligned pass/fail, meaningful risks, and actionable reviewer steps.

When browser journeys are required:
- TopicHub, Practice, Mentor, and tutor-path changes should carry browser journey proof.
- Quality-gate or review-workflow changes should include browser journey proof plus semantic packet validation.

What reviewers can trust more strongly:
- browser journey JSON reports for real student/tutor surfaces
- semantic packet validation for approval-packet completeness

What remains manual:
- visual polish and nuanced pedagogy judgment beyond the deterministic checks
- edge-case content quality that depends on human curriculum review
