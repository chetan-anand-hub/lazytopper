import { bodyText, isVisible, makeJourneyCheck, openAuthenticatedPath } from "../browser_journey_lib.mjs";

export const journey = {
  id: "triangles_human_tutor_browser_journey",
  area: "topichub",
  title: "Triangles human tutor browser journey",
  async run({ browser }) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const startUrl = await openAuthenticatedPath(page, "/topic-hub/10/Maths/triangles?tab=learn");
    const checks = [];

    try {
      checks.push(
        makeJourneyCheck(
          "triangles_heading_visible",
          await isVisible(page.getByRole("heading", { level: 1, name: /triangles/i }).first(), 12000),
          "Triangles TopicHub should open with the chapter heading visible.",
          "P1"
        )
      );
      checks.push(
        makeJourneyCheck(
          "triangles_study_flow_visible",
          await isVisible(page.getByTestId("topichub-learn-grind-practice-timeline"), 8000),
          "Triangles should still show the core guided study flow timeline.",
          "P0"
        )
      );
      checks.push(
        makeJourneyCheck(
          "practice_progression_visible",
          await isVisible(page.getByRole("button", { name: /3\. practice/i }).first(), 8000),
          "Triangles should visibly connect learning into practice.",
          "P1"
        )
      );
      checks.push(
        makeJourneyCheck(
          "mentor_progression_visible",
          (await page.locator('[title*="Ask mentor" i]').count()) > 0,
          "Triangles should still expose mentor escalation from the chapter surface.",
          "P1"
        )
      );
      const text = await bodyText(page);
      checks.push(
        makeJourneyCheck(
          "partial_maturity_is_honest",
          !text.includes("Board question types in this chapter"),
          "Triangles should not pretend to have the Trigonometry-only QTF tile strip yet.",
          "P2"
        )
      );
      return {
        startUrl,
        checks,
        meta: {
          finalUrl: page.url(),
          bodySnippet: text.slice(0, 800),
        },
      };
    } finally {
      await context.close();
    }
  },
};
