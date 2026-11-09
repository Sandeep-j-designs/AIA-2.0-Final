import { useState } from "react";
import { RotateCcw, ShieldCheck, Upload } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ExtractionFailedIllustration,
  ReviewClearIllustration,
  SyncOutcomeIllustration,
  type ExtractionFailure,
  type SyncOutcome,
} from "@/components/inbox/v2/illustrations";

/**
 * Dev-only gallery: the Inbox illustrations, each inside a mock of the screen
 * it would live on, with the real copy from workspace.tsx and sync/*. Not
 * wired into the Inbox yet.
 */

const Segmented = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) => (
  <div className="inline-flex rounded-md border border-pi-line bg-pi-sunken p-0.5">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={cn(
          "h-7 rounded px-3 text-caption font-medium text-pi-body transition-colors",
          value === o.value && "bg-pi-surface-panel text-pi-ink shadow-sm"
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const Section = ({
  index,
  title,
  where,
  when,
  controls,
  onReplay,
  children,
}: {
  index: number;
  title: string;
  where: string;
  when: string;
  controls?: React.ReactNode;
  onReplay: () => void;
  children: React.ReactNode;
}) => (
  <section className="border-t border-pi-line py-8">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-xl">
        <h2 className="text-h3 text-pi-ink">
          {index}. {title}
        </h2>
        <p className="mt-1 text-small text-pi-body">{when}</p>
        <p className="mt-1 font-mono text-caption text-pi-faint">{where}</p>
      </div>
      <div className="flex items-center gap-2">
        {controls}
        <Button variant="outline" size="sm" onClick={onReplay}>
          <RotateCcw className="h-3.5 w-3.5" />
          Replay
        </Button>
      </div>
    </div>
    <div className="flex justify-center rounded-lg bg-pi-page px-4 py-10">
      {children}
    </div>
  </section>
);

const SYNC_COPY: Record<
  SyncOutcome,
  { title: string; body: string; action: string }
> = {
  success: {
    title: "All 4 bills are in ERP",
    body: "Done in 6 seconds.",
    action: "Done",
  },
  partial: {
    title: "1 bill didn’t reach ERP",
    body: "3 of 4 went through. Check the rest and sync again.",
    action: "See what failed",
  },
  failure: {
    title: "Nothing reached ERP",
    body: "None of the 4 bills went through. Check that ERP is open and connected, then sync again.",
    action: "See what went wrong",
  },
};

const FAILURE_COPY: Record<ExtractionFailure, string> = {
  password:
    "Password-protected PDF. Remove the password, then upload it again.",
  damaged: "File is damaged. It can’t be opened. Export or scan it again.",
  unreadable:
    "The document could not be read reliably. Check that its text and amounts are clearly visible.",
};

export default function IllustrationGallery() {
  const [still, setStill] = useState(false);
  const [runs, setRuns] = useState({ clear: 0, sync: 0, fail: 0 });
  const [outcome, setOutcome] = useState<SyncOutcome>("success");
  const [cause, setCause] = useState<ExtractionFailure>("password");
  const replay = (k: keyof typeof runs) =>
    setRuns((r) => ({ ...r, [k]: r[k] + 1 }));
  const replayAll = () =>
    setRuns((r) => ({ clear: r.clear + 1, sync: r.sync + 1, fail: r.fail + 1 }));

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
          <div>
            <p className="text-overline font-semibold uppercase text-pi-faint">
              Inbox · motion study
            </p>
            <h1 className="mt-1 text-h1 text-pi-ink">Animated illustrations</h1>
            <p className="mt-2 max-w-xl text-small text-pi-body">
              Each scene plays once, then rests on its final frame. Reduced
              motion shows only that final frame. CSS and inline SVG only.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-small text-pi-body">
              <input
                type="checkbox"
                checked={still}
                onChange={(e) => setStill(e.target.checked)}
                className="h-4 w-4 accent-[var(--pi-brand)]"
              />
              Reduced motion
            </label>
            <Button variant="outline" size="sm" onClick={replayAll}>
              <RotateCcw className="h-3.5 w-3.5" />
              Replay all
            </Button>
          </div>
        </header>

        {/* 1 ------------------------------------------------------------ */}
        <Section
          index={1}
          title="Review queue cleared"
          when="Plays once when the user's own approvals take Needs review to 0. Opening an already-empty tab shows the still frame."
          where="workspace.tsx:6222 · FlowEmptyState, Needs review"
          onReplay={() => replay("clear")}
        >
          <div className="flex w-full max-w-lg flex-col items-center text-center">
            <div className="w-[240px]">
              <ReviewClearIllustration key={runs.clear} still={still} />
            </div>
            <h3 className="mt-4 text-h2 text-pi-ink">
              Nothing waiting for your review
            </h3>
            <p className="mt-2 max-w-md text-small leading-5 text-pi-body">
              You’ve reviewed all 48 documents received, and 17 are approved.
              New documents appear here once AI Accountant has read them.
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="outline">View approved</Button>
              <Button>
                <Upload className="h-4 w-4" />
                Upload Documents
              </Button>
            </div>
          </div>
        </Section>

        {/* 2 ------------------------------------------------------------ */}
        <Section
          index={2}
          title="Sync result"
          when="Replaces the static ring in the sync result dialog. Plays on every sync — it runs a few times a day, not per document."
          where="sync/sync-result-modal.tsx:88"
          onReplay={() => replay("sync")}
          controls={
            <Segmented
              value={outcome}
              onChange={(v) => {
                setOutcome(v);
                replay("sync");
              }}
              options={[
                { value: "success", label: "Success" },
                { value: "partial", label: "Partial" },
                { value: "failure", label: "Failure" },
              ]}
            />
          }
        >
          <div className="w-full max-w-[460px] overflow-hidden rounded-lg border border-pi-line bg-pi-surface-panel shadow-[var(--shadow-2)]">
            <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-6 text-center">
              <div className="w-[260px]">
                <SyncOutcomeIllustration
                  key={`${outcome}-${runs.sync}`}
                  outcome={outcome}
                  still={still}
                />
              </div>
              <h3 className="text-h2 text-pi-ink">{SYNC_COPY[outcome].title}</h3>
              <p className="max-w-[24rem] text-small leading-5 text-pi-body">
                {SYNC_COPY[outcome].body}
              </p>
            </div>
            <div className="flex justify-end border-t border-pi-line px-6 py-4">
              <Button>{SYNC_COPY[outcome].action}</Button>
            </div>
          </div>
        </Section>

        {/* 6 ------------------------------------------------------------ */}
        <Section
          index={6}
          title="Extraction failed"
          when="Replaces the FileWarning tile on the failed-document card, one scene per cause. Plays once per document opened."
          where="workspace.tsx:3910 · item.status === 'Failed'"
          onReplay={() => replay("fail")}
          controls={
            <Segmented
              value={cause}
              onChange={(v) => {
                setCause(v);
                replay("fail");
              }}
              options={[
                { value: "password", label: "Password" },
                { value: "damaged", label: "Damaged" },
                { value: "unreadable", label: "Unreadable" },
              ]}
            />
          }
        >
          <div className="w-full max-w-xl overflow-hidden rounded-md border border-pi-line bg-background shadow-sm">
            <div className="space-y-5 p-6">
              <div className="w-[180px]">
                <ExtractionFailedIllustration
                  key={`${cause}-${runs.fail}`}
                  cause={cause}
                  still={still}
                />
              </div>
              <div>
                <p className="mb-2 text-overline font-semibold uppercase text-secondary-foreground">
                  Extraction failed
                </p>
                <h3 className="text-h2 text-foreground">
                  Let’s get this document ready
                </h3>
                <p className="mt-2 text-body leading-6 text-secondary-foreground">
                  We couldn’t read all the details. Try again, or use the
                  original document to complete them yourself.
                </p>
              </div>
              <div className="rounded-md border border-pi-line bg-pi-sunken p-4">
                <h4 className="mb-1 text-body font-semibold">
                  What we couldn’t read
                </h4>
                <p className="text-body leading-6 text-secondary-foreground">
                  {FAILURE_COPY[cause]}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 border-t border-pi-line px-6 py-4 text-caption leading-5 text-secondary-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              <span>Your original document is preserved and stays attached.</span>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
