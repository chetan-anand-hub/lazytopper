# Trig Pack1 Schema Note

## Required fields used at runtime

PracticePage and the practice/session pipeline currently depend on these question keys:

- `id`
- `subject`
- `topicKey`
- `subtopic`
- `section`
- `marks`
- `format`
- `difficulty`
- `bloomSkill`
- `questionText`
- `answer`
- `explanation`
- `solutionSteps`
- `finalAnswer`

These are additionally used by the Question-Type-First overlay for Pack1:

- `questionId`
- `cbseFormat`
- `skillFamily`
- `loIds`

## Repo-truth example question object

Source: [canonicalQuestionBank.ts](c:/Projects/lazytopper/lazytopper_MAIN_WORKTREE/src/data/canonicalQuestionBank.ts)

```ts
{
  id: "2026-TRIG-SA-01",
  subject: "Maths",
  topicKey: "Introduction to Trigonometry",
  subtopic: "Introduction to Trigonometry",
  section: "B",
  marks: 3,
  format: "Short",
  difficulty: "Medium",
  bloomSkill: "Applying",
  questionText: "If sin theta = 3/5 and theta is acute, find cos theta and tan theta.",
  options: [],
  answer: "",
  explanation: "",
  solutionSteps: [
    "Given sin theta = 3/5, interpret this as opposite side / hypotenuse = 3/5.",
    "Consider a right-angled triangle with perpendicular = 3k and hypotenuse = 5k for some k.",
    "Use Pythagoras theorem to find the base: base^2 = hyp^2 - perp^2 = (5k)^2 - (3k)^2 = 25k^2 - 9k^2 = 16k^2.",
    "So base = 4k, taking the positive value as sides are lengths.",
    "Now cos theta = base / hypotenuse = 4k / 5k = 4/5.",
    "tan theta = perpendicular / base = 3k / 4k = 3/4.",
    "Thus, cos theta = 4/5 and tan theta = 3/4."
  ],
  finalAnswer: "",
  strategyHint: "",
  predictionScore: 0
}
```
