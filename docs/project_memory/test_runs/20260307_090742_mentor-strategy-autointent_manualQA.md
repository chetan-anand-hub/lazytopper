# Manual QA - mentor-strategy-autointent

- Trig MCQ: open a tagged Section A Trigonometry question and confirm the new `Ask mentor about this question` action opens the mentor with `Hint / Next step` behavior by default.
- Trig SA/LA: open tagged Section B/C questions and confirm the mentor defaults to `Explain`; open tagged Section D/E or proof-style questions and confirm it defaults to `Check my solution (CBSE)`.
- Chip switching still works and does not wipe chat in `MentorPanel`; Practice mentor drawer keeps the same conversation while messaging within the open question.
- Non-trig topics remain unchanged because the strategy context and auto-intent are only applied when `VITE_QTYPE_FIRST_TRIGONOMETRY === "true"` and the canonical topic resolves to `trigonometry`.
- Mentor requests for flagged/tagged trig questions include the prepended `[CONTEXT] ... [/CONTEXT]` header with CBSE format, skill family, LO titles, board tip, and up to 2 common mistakes.
