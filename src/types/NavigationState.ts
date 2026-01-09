/**
 * Defines the shape of navigation state passed through React Router's `state` prop.
 *
 * When navigating between pages, LazyTopper passes a structured state object
 * rather than relying on `navigate(-1)`.  This approach preserves the
 * in‑application history and avoids sending users outside the app when they
 * click a back button【625993344288175†L58-L68】.
 *
 * @template TPayload The type of the payload data carried between pages.
 */
export interface NavigationState<TPayload = any> {
  /**
   * The fully qualified URL (pathname + search) of the page to return to.
   * If this property is absent, components such as BackLink will fall back
   * to a default destination.
   */
  back?: string;

  /**
   * Label to display on the back button.  When not provided, a sensible
   * default (e.g. “Back”) is used.
   */
  backLabel?: string;

  /**
   * Arbitrary data passed between pages.  For example, the HPQ hub may
   * forward the selected question or filter settings to the AI Mentor page.
   */
  payload?: TPayload;

  /**
   * Optional string indicating the mode of the destination page (e.g.
   * 'solve', 'explain' or 'planner' for the AI Mentor page).
   */
  mode?: string;
}