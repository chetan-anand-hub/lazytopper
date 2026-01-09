import { useMemo } from "react";
import type { DailyMixItem } from "../services/dailyMixPlayback";
import { useDailyMixPlayback } from "../services/dailyMixPlayback";

/**
 * DailyMixPlayer
 * - Lightweight playback UI for a "Daily Mix" playlist.
 * - It can be used in two ways:
 *    1) Preferred: pass `items` explicitly (player-only responsibility).
 *    2) Compatibility (MS-D7): callers may pass `grade`/`subject` and generate items upstream.
 *
 * Notes:
 * - This component intentionally does not generate the mix by itself.
 * - `grade`, `subject`, and `onExit` are accepted to keep routing/pages simple and
 *   avoid prop-type errors in the calling page.
 */
export interface DailyMixPlayerProps {
  /** The already-generated mix items to play. */
  items?: DailyMixItem[];

  /** Optional context for display / callers (does not affect playback). */
  grade?: string;
  subject?: string;

  /** Optional callback used by pages to return to dashboard, etc. */
  onExit?: () => void | Promise<void>;

  className?: string;
}

export function DailyMixPlayer({
  items,
  grade,
  subject,
  onExit,
  className,
}: DailyMixPlayerProps) {
  const safeItems = useMemo(() => items ?? [], [items]);

  const {
    current,
    currentIndex,
    isPlaying,
    canPrev,
    canNext,
    play,
    pause,
    next,
    prev,
    seek,
  } = useDailyMixPlayback(safeItems);

  if (!safeItems.length) {
    return (
      <div className={className}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 700 }}>Daily Mix</div>
          {onExit ? (
            <button type="button" onClick={() => void onExit()}>
              ✕ Close
            </button>
          ) : null}
        </div>

        {grade || subject ? (
          <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
            {grade ? `Grade: ${grade}` : ""}
            {grade && subject ? " • " : ""}
            {subject ? `Subject: ${subject}` : ""}
          </div>
        ) : null}

        <div style={{ marginTop: 12, opacity: 0.85 }}>No Daily Mix items yet.</div>
        <div style={{ marginTop: 6, opacity: 0.7, fontSize: 12 }}>
          Tip: generate the mix items in the page/service and pass them via the <code>items</code> prop.
        </div>
      </div>
    );
  }

  const title = current?.title ?? "Untitled";
  const description = current?.description ?? "";
  const kind = (current?.type as any) ?? "item";

  return (
    <div className={className}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{ fontWeight: 700 }}>{title}</div>
            <div style={{ opacity: 0.7, fontSize: 12 }}>{kind}</div>
          </div>

          {grade || subject ? (
            <div style={{ marginTop: 4, opacity: 0.7, fontSize: 12 }}>
              {grade ? `Grade: ${grade}` : ""}
              {grade && subject ? " • " : ""}
              {subject ? `Subject: ${subject}` : ""}
            </div>
          ) : null}
        </div>

        {onExit ? (
          <button type="button" onClick={() => void onExit()}>
            ✕ Close
          </button>
        ) : null}
      </div>

      {description ? (
        <div style={{ marginTop: 8, opacity: 0.9 }}>{description}</div>
      ) : null}

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={prev} disabled={!canPrev}>
          ◀ Prev
        </button>

        {isPlaying ? (
          <button type="button" onClick={pause}>
            ⏸ Pause
          </button>
        ) : (
          <button type="button" onClick={play}>
            ▶ Play
          </button>
        )}

        <button type="button" onClick={next} disabled={!canNext}>
          Next ▶
        </button>

        <span style={{ marginLeft: 8, opacity: 0.75 }}>
          {currentIndex + 1} / {safeItems.length}
        </span>
      </div>

      <div style={{ marginTop: 10 }}>
        <input
          aria-label="Daily mix position"
          type="range"
          min={0}
          max={Math.max(0, safeItems.length - 1)}
          value={currentIndex}
          onChange={(e) => seek(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}

export default DailyMixPlayer;
