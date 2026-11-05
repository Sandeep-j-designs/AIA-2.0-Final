import React from "react";
import { RefreshCcw } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { TallyConnection } from "@/types/pages/inbox/sync";

type SyncChromeButtonProps = {
  onClick: () => void;
  isSyncing: boolean;
  connection: TallyConnection;
};

/**
 * Sync, as it sits in the app bar.
 *
 * Moved out of the page header because syncing is not a property of whichever
 * screen you happen to be on — one ERP connection, one queue, one company.
 * In the page header it read as "sync this list"; up here it reads as what it
 * is, and it stops disappearing when you open a document.
 *
 * Styled off the company chip rather than the Button component: `variant`
 * outline is drawn for a light page and goes to dark-on-dark against the bar.
 * Filled chip, so it pairs with the company switcher beside it and still reads
 * as a control next to the ghost Guide and What's-new buttons.
 */
const SyncChromeButton = ({
  onClick,
  isSyncing,
  connection,
}: SyncChromeButtonProps) => {
  const status = isSyncing
    ? "syncing"
    : connection === "offline"
      ? "offline"
      : "connected";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        status === "syncing"
          ? "Syncing to ERP"
          : status === "offline"
            ? "Sync — ERP not connected"
            : "Sync to ERP"
      }
      title={
        status === "syncing"
          ? "Syncing to ERP"
          : status === "offline"
            ? "ERP not connected"
            : "Sync to ERP"
      }
      // A secondary button (27 Oct 2026, the button hierarchy): brand
      // outline and label, white ground. Its state still lives in the dot
      // on the glyph, not in a coloured fill.
      className={cn(
        "relative flex h-9 flex-none items-center gap-2 rounded-sm border border-pi-brand-border bg-background px-3 text-small font-medium text-pi-brand",
        "transition-[border-color,background-color] duration-150 hover:border-pi-brand hover:bg-pi-brand-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand focus-visible:ring-offset-2"
      )}
    >
      <span className="relative">
        <RefreshCcw className={cn("size-4", isSyncing && "animate-spin motion-reduce:animate-none")} />
      </span>
      <span className="hidden sm:inline">Sync</span>

      {/* Whether ERP is reachable decides whether pressing this does
          anything, so the dot rides on the button. The ring is the BAR's
          colour, not the page's — it is punching a hole in dark chrome. */}
      <span
        aria-hidden
        className={cn(
          "absolute left-[18px] top-[7px] size-2 rounded-full ring-2 ring-pi-surface-panel",
          status === "connected" && "bg-pi-success-dot",
          status === "offline" && "bg-pi-danger-dot",
          status === "syncing" && "animate-pulse bg-pi-warning-dot motion-reduce:animate-none"
        )}
      />
    </button>
  );
};

export default SyncChromeButton;
