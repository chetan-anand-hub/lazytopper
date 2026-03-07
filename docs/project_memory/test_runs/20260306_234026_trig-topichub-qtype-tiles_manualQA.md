# Trig TopicHub QType Tiles - Manual QA

1. Flag OFF: open Trigonometry TopicHub and confirm no new "Board question types" tile strip is shown.
2. Flag ON + Trigonometry: set `VITE_QTYPE_FIRST_TRIGONOMETRY=true`, reload TopicHub for Trigonometry, and confirm tile strip appears.
3. Tile click navigation: click any tile and confirm Practice URL includes `focusBankIds=...` and `strictFocus=true` plus section filter.
4. Practice behavior: confirm focused IDs appear first/only when present; if not enough, question set still fills via normal top-up.
5. Non-trigonometry topics: with flag ON, open another topic and confirm tile strip is not rendered.
