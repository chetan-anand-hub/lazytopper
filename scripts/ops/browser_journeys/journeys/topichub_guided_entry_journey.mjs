import { bodyText, isVisible, makeJourneyCheck, openAuthenticatedPath } from "../browser_journey_lib.mjs";

export const journey = {
  id: "topichub_guided_entry_journey",
  area: "topichub",
  title: "TopicHub guided entry journey",
  async run({ browser }) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const startUrl = await openAuthenticatedPath(page, "/topic-hub/10/Maths/trigonometry?tab=learn");
    const checks = [];

    try {
      checks.push(
        makeJourneyCheck(
          "chapter_heading_visible",
          await isVisible(page.getByRole("heading", { level: 1, name: /trigonometry/i }).first()),
          "TopicHub should open the requested chapter with a visible chapter heading.",
          "P1"
        )
      );
      checks.push(
        makeJourneyCheck(
          "study_flow_visible",
          await isVisible(page.getByTestId("topichub-learn-grind-practice-timeline")),
          "TopicHub should show the study flow timeline as the chapter entry signal.",
          "P0"
        )
      );
      const tabLabels = ["Learn", "Grind", "Resources"];
      const visibleTabs = [];
      for (const label of tabLabels) {
        if (await isVisible(page.getByRole("button", { name: new RegExp(`^${label}$`, "i") }).first(), 2500)) {
          visibleTabs.push(label);
        }
      }
      checks.push(
        makeJourneyCheck(
          "low_confusion_tabs_visible",
          visibleTabs.length === 3,
          `Expected Learn, Grind, Resources tabs. Visible tabs: ${visibleTabs.join(", ") || "none"}.`,
          "P1"
        )
      );
      const text = await bodyText(page);
      checks.push(
        makeJourneyCheck(
          "recommended_order_copy_visible",
          text.includes("Recommended order:") && text.includes("Learn concept") && text.includes("Practice timed questions"),
          "TopicHub should explain the recommended learning order in plain language.",
          "P1"
        )
      );
      checks.push(
        makeJourneyCheck(
          "entry_surface_not_chaotic",
          text.includes("Study flow") && text.includes("Mastery"),
          "A first-time chapter entry should surface a clear flow and progress cues before deep branching.",
          "P2"
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
