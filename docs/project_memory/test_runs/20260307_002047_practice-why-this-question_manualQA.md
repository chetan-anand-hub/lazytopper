# Manual QA - practice-why-this-question

1. Flag OFF: open Practice for Trigonometry and confirm the page layout is unchanged and no "Why this question?" panel is shown.
2. Flag ON + Trigonometry: open `/practice/10/Maths?topic=Trigonometry` and confirm the panel appears and shows skill/CBSE format plus LO details for a tagged question.
3. Flag ON + Non-trig: open a non-trigonometry topic Practice page and confirm the panel is not rendered.
4. Untagged trig question: in Trigonometry, focus a question ID not present in `trigonometryQuestionTagIndex` and confirm the panel shows: "This question isn’t tagged yet. Practice normally."
