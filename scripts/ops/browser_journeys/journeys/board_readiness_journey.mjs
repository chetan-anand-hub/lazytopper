import { isVisible, makeJourneyCheck, openAuthenticatedPath } from "../browser_journey_lib.mjs";

export const journey = {
  id: "board_readiness_journey",
  area: "practice",
  title: "Board readiness journey",
  async run({ browser }) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const startUrl = await openAuthenticatedPath(page, "/practice/10/Maths?topic=trigonometry&count=4&journeyMentor=check_cbse");
    const checks = [];

    try {
      checks.push(
        makeJourneyCheck(
          "mentor_drawer_reachable",
          await isVisible(page.getByTestId("practice-mentor-drawer"), 15000),
          "Practice should open the CBSE mentor drawer for the board-readiness journey.",
          "P0"
        )
      );
      checks.push(
        makeJourneyCheck(
          "board_steps_discoverable",
          await isVisible(page.getByTestId("practice-board-steps-panel"), 12000),
          "Board Steps / CBSE checking should be discoverable from practice.",
          "P0"
        )
      );
      checks.push(
        makeJourneyCheck(
          "board_steps_panel_visible",
          await isVisible(page.getByTestId("practice-board-steps-panel"), 12000),
          "Board readiness should expose the offline CBSE board-steps template panel.",
          "P0"
        )
      );
      checks.push(
        makeJourneyCheck(
          "solution_photo_affordance_visible",
          await isVisible(page.getByRole("button", { name: /upload solution photo/i }).first(), 8000),
          "CBSE solution checking should expose the handwritten-solution upload affordance.",
          "P1"
        )
      );
      return {
        startUrl,
        checks,
        meta: {
          finalUrl: page.url(),
          bodySnippet: (await page.locator("body").innerText()).replace(/\s+/g, " ").trim().slice(0, 800),
        },
      };
    } finally {
      await context.close();
    }
  },
};
