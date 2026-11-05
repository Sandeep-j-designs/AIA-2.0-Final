import { Skeleton } from "@/components/ui/skeleton";

/**
 * What the Inbox shows before the store has loaded (27 Oct 2026).
 *
 * It was a line of text on white, and before the script arrived nothing at
 * all, so a slow first load read as a broken page. This draws the page's own
 * frame instead — the navy rail, the top bar, the tabs and toolbar, a run of
 * rows — so the screen has its shape from the first paint and the content
 * lands into it. A document opened full screen gets the frame without the
 * rail and bar, as it renders.
 */
const ROWS = 10;

const Rows = () => (
  <div className="flex-1 overflow-hidden bg-background">
    <div className="flex h-11 items-center gap-6 border-b border-pi-line bg-pi-head-bg px-4">
      {[140, 120, 90, 110, 100].map((w, i) => (
        <Skeleton key={i} className="h-3" style={{ width: w }} />
      ))}
    </div>
    {Array.from({ length: ROWS }, (_, r) => (
      <div
        key={r}
        className="flex h-14 items-center gap-6 border-b border-pi-line px-4"
      >
        <Skeleton className="size-4 flex-none" />
        <div className="w-[220px] space-y-2">
          <Skeleton className="h-3 w-[70%]" />
          <Skeleton className="h-2 w-[45%]" />
        </div>
        <Skeleton className="h-3 w-[160px]" />
        <Skeleton className="ml-auto h-3 w-[96px]" />
        <Skeleton className="h-3 w-[120px]" />
      </div>
    ))}
  </div>
);

const WorkspaceSkeleton = ({ fullScreen }: { fullScreen?: boolean }) => (
  <div
    role="status"
    aria-live="polite"
    className="flex h-screen w-full overflow-hidden bg-pi-page"
  >
    <span className="sr-only">Loading…</span>
    {!fullScreen && (
      <div className="workbench-sidebar h-full w-[216px] flex-none max-sm:w-16" />
    )}
    <div className="flex min-w-0 flex-1 flex-col">
      {!fullScreen && (
        <div className="flex h-14 flex-none items-center gap-4 border-b border-pi-line bg-background px-6">
          <Skeleton className="h-3 w-[140px]" />
          <Skeleton className="ml-auto h-9 w-[280px] max-lg:hidden" />
          <Skeleton className="h-9 w-[210px]" />
        </div>
      )}
      <div className="flex flex-none items-center gap-4 px-page py-4">
        <Skeleton className="h-9 w-[420px] max-w-[60%]" />
        <Skeleton className="ml-auto h-9 w-[180px]" />
      </div>
      <Rows />
    </div>
  </div>
);

export default WorkspaceSkeleton;
