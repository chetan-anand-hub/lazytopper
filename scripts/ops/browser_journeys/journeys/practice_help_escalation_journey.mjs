import { bodyText, isVisible, makeJourneyCheck, openAuthenticatedPath } from "../browser_journey_lib.mjs";

export const journey = {
  id: "practice_help_escalation_journey",
  area: "practice",
  title: "Practice help escalation journey",
  async run({ browser }) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const startUrl = await openAuthenticatedPath(page, "/practice/10/Maths?topic=trigonometry&count=5&journeyMentor=auto");
    const checks = [];

    try {
      const firstQuestion = page.getByTestId("practice-question-card").first();
      checks.push(
        makeJourneyCheck(
          "practice_questions_loaded",
          await isVisible(firstQuestion, 20000),
          "Practice should load at least one question for Trigonometry.",
          "P0"
        )
      );
      checks.push(
        makeJourneyCheck(
          "why_panel_visible",
          await isVisible(page.getByTestId("practice-why-panel"), 8000),
          "The Why this question panel should be visible for flagged Trigonometry practice.",
          "P1"
        )
      );
      const mentorButton = firstQuestion.getByTestId("practice-mentor-cta").first();
      checks.push(
        makeJourneyCheck(
          "mentor_escalation_cta_visible",
          await isVisible(mentorButton, 8000),
          "Practice should show a clear mentor escalation CTA on the question card.",
          "P1"
        )
      );
      checks.push(
        makeJourneyCheck(
          "mentor_drawer_reachable",
          await isVisible(page.getByTestId("practice-mentor-drawer"), 12000),
          "The mentor drawer should open from practice without leaving the question context.",
          "P0"
        )
      );
      checks.push(
        makeJourneyCheck(
          "handholding_preserved",
          /strategy context is being used for this question|answer mentor's question|paste your working or add a short note/i.test(
            await bodyText(page)
          ),
          "Practice help escalation should preserve question-level context and handholding cues.",
          "P1"
        )
      );
      return {
        startUrl,
        checks,
        meta: {
          finalUrl: page.url(),
          bodySnippet: (await bodyText(page)).slice(0, 800),
        },
      };
    } finally {
      await context.close();
    }
  },
};
