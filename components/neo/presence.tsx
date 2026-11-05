import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { onNeoChatPage } from "@/utils/pages/neo/route";
import { Pause, Play } from "@/components/icons";
import { useStore } from "@/components/inbox/v2/store";
import { useNeo } from "@/hooks/pages/neo/use-neo";
import NeoMark from "./common/neo-mark";

/**
 * Neo, visible in the screens it is working in — not only in its panel.
 *
 * Rows it is on are marked in whatever list is showing (working, done, held),
 * and while a run is live a row below the workspace header says what it is
 * doing, how far it has got, and lets you pause it without opening the panel.
 *
 * Rows are marked by attribute rather than by prop so no list has to know Neo
 * exists: any row carrying `data-item-id` takes part. The marks are re-applied
 * after every store change, because a list re-rendering its rows is exactly
 * what happens while Neo works.
 *
 * DEV: production would render the mark from the row's own state (a
 * `neoState` field on the list item); delete the effect below on transplant.
 */
const NeoPresence = () => {
  const neo = useNeo();
  const state = useStore();
  const router = useRouter();

  useEffect(() => {
    const apply = () =>
      document
        .querySelectorAll<HTMLElement>("[data-item-id]")
        .forEach((row) => {
          const mark = neo.presence[row.dataset.itemId || ""];
          if (mark) row.dataset.neo = mark;
          else delete row.dataset.neo;
        });
    apply();
    const frame = window.requestAnimationFrame(apply);
    return () => window.cancelAnimationFrame(frame);
  }, [neo.presence, state]);

  const live = neo.liveStatus;
  // Neo's chat page shows the run in the thread itself; no strip over it.
  if (!live || onNeoChatPage(router.query)) return null;
  const pct =
    live.progress && live.progress.total > 0
      ? Math.min(
          100,
          Math.round((live.progress.done / live.progress.total) * 100)
        )
      : undefined;

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative flex min-h-11 flex-none items-center gap-3 border-b border-pi-line bg-pi-brand-tint px-4 py-2 text-pi-ink"
    >
      <NeoMark className="h-6 w-6" live={!neo.paused} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-caption font-semibold">
          {neo.paused ? "Paused · " : ""}
          {live.text}
        </span>
        {pct !== undefined && (
          <span
            role="progressbar"
            aria-label="Neo task progress"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-1 block h-0.5 overflow-hidden rounded-full bg-pi-line"
          >
            <span
              className="block h-full rounded-full bg-pi-brand transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={neo.paused ? neo.resume : neo.pause}
        className="flex h-7 flex-none items-center gap-1 rounded-sm border border-pi-line-2 px-2 text-caption font-semibold hover:bg-pi-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
      >
        {neo.paused ? (
          <Play className="h-3 w-3 fill-current" />
        ) : (
          <Pause className="h-3 w-3 fill-current" />
        )}
        {neo.paused ? "Resume" : "Pause"}
      </button>
      {!neo.open && (
        <button
          type="button"
          onClick={() => neo.setOpen(true)}
          className="h-7 flex-none rounded-sm px-3 text-caption font-semibold text-pi-brand hover:bg-pi-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
        >
          View chat
        </button>
      )}
    </div>
  );
};

export default NeoPresence;
