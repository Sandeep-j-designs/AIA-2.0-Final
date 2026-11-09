import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SyncOutcomeIllustration } from "../illustrations";
import type { SyncRun } from "@/types/pages/inbox/sync";

type SyncResultModalProps = {
  open: boolean;
  run: SyncRun | null;
  onDone: () => void;
  /** Partial and failed runs hand the user somewhere to go, not just an OK. */
  onReviewFailures: () => void;
};

/**
 * The card a run ends on — one of three, never a generic alert.
 *
 * The three differ in more than colour: a success is dismissed, a partial and a
 * failure hand the user somewhere to go. So the button is the outcome's whole
 * point, which is why it is full width and alone.
 *
 * Built from Figma 21436:18787 (success), 21448:20151 (partial),
 * 21448:22142 (failure).
 */
const SyncResultModal = ({
  open,
  run,
  onDone,
  onReviewFailures,
}: SyncResultModalProps) => {
  if (!run) return null;

  const { outcome, pushed, failed, total, durationSeconds, unitPlural } = run;

  /**
   * "None of the 1 invoices" reads as a bug even when the count is right, and
   * a run of one is the common case early in a session — the Inbox only syncs
   * what has been approved so far.
   */
  const unit = total === 1 ? unitPlural.replace(/s$/, "") : unitPlural;

  const content = {
    success: {
      // "All 1 Invoice" — the "All" only earns its place over a plural.
      title:
        total === 1
          ? `${unit} is in ERP`
          : `All ${total} ${unit.toLowerCase()} are in ERP`,
      body: `Done in ${durationSeconds} seconds.`,
      action: "Done",
      onAction: onDone,
    },
    partial: {
      title: `${failed} ${failed === 1 ? unitPlural.replace(/s$/, "").toLowerCase() : unitPlural.toLowerCase()} didn’t reach ERP`,
      body: `${pushed} of ${total} went through. Check the rest and sync again.`,
      action: "See what failed",
      onAction: onReviewFailures,
    },
    failure: {
      title: "Nothing reached ERP",
      body: `None of the ${total} ${unit.toLowerCase()} went through. Check that ERP is open and connected, then sync again.`,
      action: "See what went wrong",
      onAction: onReviewFailures,
    },
  }[outcome];

  return (
    <Dialog open={open}>
      <DialogContent
        className="refined-dialog w-[calc(100vw-32px)] max-w-[460px] gap-0 overflow-hidden rounded-lg p-0 sm:rounded-lg [&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-6 text-center">
          <div className="mb-1 w-[260px] max-w-full">
            <SyncOutcomeIllustration outcome={outcome} />
          </div>
          <DialogTitle className="text-h2 text-pi-ink">
            {content.title}
          </DialogTitle>
          <DialogDescription className="max-w-[24rem] text-small leading-5 text-pi-body">
            {content.body}
          </DialogDescription>
        </div>

        <div className="border-t border-pi-line px-6 py-4">
          <Button className="w-full" onClick={content.onAction}>
            {content.action}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SyncResultModal;
