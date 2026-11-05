import React, { useState } from "react";
import EmptyState from "../empty-state";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  FileSpreadsheet as SheetIcon,
} from "@/components/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FileIcon from "@/components/inbox/common/file-icon";
import { IMPORT_MODE_LABELS } from "@/config/pages/inbox/sales-upload";
import {
  useSalesBatches,
  useSalesBatch,
} from "@/hooks/pages/inbox/use-sales-upload";
import { cn } from "@/lib/utils";
import {
  ARVoucherImportBatchStatus,
  type ResponseARVoucherImportBatch,
} from "@/types/pages/inbox/sales-upload";
import { batchStep } from "@/utils/pages/inbox/sales-upload";
import { T } from "../ui";
import { actor } from "../store";
import { nextSort, sortRows, type SortState } from "../banking/table-parts";
import { BatchStatusPill } from "./common";
import ProcessingModal from "./processing-modal";

/**
 * The Sales register's Uploaded Invoice tab — production's
 * ARUploadedInvoicesTab, drawn as the Purchases register's Bill Uploads
 * table: file first with its mode underneath, the counts, then status.
 * A row opens the step its batch is waiting on; a batch still being read
 * opens its progress.
 *
 * The pager is the register's: it sits below the register's page scroller,
 * which this table renders inside, so the register owns the page and counts
 * the rows with `batchRows`.
 */

type Props = {
  company: string;
  search: string;
  onOpen: (batchId: string, step: "mapping" | "preview") => void;
  page: number;
  pageSize: number;
};

/** The batches the tab lists for a search, for the table and the pager. */
export const batchRows = (
  entries: { batch: ResponseARVoucherImportBatch }[],
  search: string
) => {
  const term = search.trim().toLowerCase();
  return entries
    .map((e) => e.batch)
    .filter((b) => !term || b.originalFileName.toLowerCase().includes(term));
};

/** Production: formatDisplayDate — "12 Sep 2026". */
const uploadDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/** What is still to create: production's Pending Rows figure. */
const pendingOf = (batch: ResponseARVoucherImportBatch) =>
  Math.max(0, batch.totalRows - batch.createdRows);

/*
  Uploaded By (28 Oct 2026, Figma's column). The batch record carries no
  uploader, and in this prototype only the signed-in accountant uploads, so
  it reads the store's actor. Production fills it from the batch's creator.
*/
const uploaderOf = (_batch: ResponseARVoucherImportBatch) => actor;

type SortKey = "uploaded" | "total" | "pending" | "created" | "status";
/** The columns Figma draws a sort button on, and what each sorts by. */
const SORT_VALUE: Record<
  SortKey,
  (batch: ResponseARVoucherImportBatch) => string | number
> = {
  uploaded: (b) => b.createdAt,
  total: (b) => b.totalRows,
  pending: pendingOf,
  created: (b) => b.createdRows,
  status: (b) => b.status,
};

/** A header label with the registers' quiet 20px sort button. */
const SortHead = ({
  label,
  dir,
  onSort,
  align = "left",
}: {
  label: string;
  dir: "asc" | "desc" | "none";
  onSort: () => void;
  align?: "left" | "right";
}) => (
  <div
    className={cn(
      "flex h-4 min-w-0 items-center gap-1",
      align === "right" && "justify-end"
    )}
  >
    <span className="truncate">{label}</span>
    <button
      type="button"
      onClick={onSort}
      aria-label={`Sort by ${label}`}
      className={cn(
        "grid h-5 w-5 flex-none place-items-center rounded-xs transition-colors duration-100 hover:bg-pi-fill hover:text-pi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
        dir === "none" ? "text-pi-faint" : "text-pi-brand"
      )}
    >
      {dir === "asc" ? (
        <ArrowUp className="h-3 w-3" />
      ) : dir === "desc" ? (
        <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3" />
      )}
    </button>
  </div>
);

const PendingRows = ({ batch }: { batch: ResponseARVoucherImportBatch }) => {
  if (batch.status === ARVoucherImportBatchStatus.PROCESSING) {
    // The AI pass reports rows done; the first read does not, so it waits
    // on a dash rather than a 0% bar that never moves.
    if (!batch.totalRows) return <span>-</span>;
    const pct = Math.round((batch.aiProcessedRowCount * 100) / batch.totalRows);
    return (
      <span className="flex w-full max-w-[140px] flex-col gap-1">
        <span className="flex items-center justify-between tabular-nums">
          <span>{batch.aiProcessedRowCount}</span>
          <span className="text-pi-faint">{pct}%</span>
        </span>
        <span className="h-1 w-full overflow-hidden rounded-xs bg-pi-fill">
          <span
            className="block h-full rounded-xs bg-pi-brand transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </span>
      </span>
    );
  }
  // Production compares status to (NEEDS_REVIEW || COMPLETE), which is only
  // ever NEEDS_REVIEW — so a complete batch showed "-". Both count here, and
  // a complete batch has nothing pending.
  if (
    batch.status === ARVoucherImportBatchStatus.NEEDS_REVIEW ||
    batch.status === ARVoucherImportBatchStatus.COMPLETE
  )
    return (
      <span className="tabular-nums">{pendingOf(batch)}</span>
    );
  return <span>-</span>;
};

const UploadedInvoicesTable = ({
  company,
  search,
  onOpen,
  page,
  pageSize,
}: Props) => {
  const entries = useSalesBatches(company);
  const [progressId, setProgressId] = useState("");
  const progress = useSalesBatch(progressId);
  const [sort, setSort] = useState<SortState<SortKey>>(null);

  const term = search.trim().toLowerCase();
  // Sorted before paging, so a sort orders every batch, not just this page.
  const rows = sortRows(batchRows(entries, search), sort, SORT_VALUE);
  const pageRows = rows.slice(page * pageSize, (page + 1) * pageSize);

  const head = cn("h-row-header whitespace-nowrap px-4 py-0 align-middle", T.head);
  // Row hover wash across the whole row, the Inbox's.
  const cell = cn(
    "h-row px-4 py-0 align-middle transition-colors duration-100 group-hover:bg-pi-row-hover group-focus-visible:bg-pi-row-hover motion-reduce:transition-none",
    T.cell
  );

  const sortProps = (key: SortKey) => ({
    dir: sort?.key === key ? sort.dir : ("none" as const),
    onSort: () => setSort((current) => nextSort(current, key)),
  });

  const open = (batch: ResponseARVoucherImportBatch) => {
    if (batch.status === ARVoucherImportBatchStatus.PROCESSING) {
      setProgressId(batch.importBatchUuid);
      return;
    }
    const step = batchStep(batch.status);
    if (step) onOpen(batch.importBatchUuid, step);
  };

  return (
    <>
      {/* No scroll of its own: the register page scrolls both axes. Hairline
          rules between the columns. */}
      <div className="min-w-0 flex-1">
        <Table className="min-w-[1000px] table-fixed border-separate border-spacing-0 bg-background [&_:is(th,td):not(:last-child)]:border-r [&_td]:border-b [&_td]:border-pi-line [&_th]:border-b [&_th]:border-pi-line">
          <TableHeader className="sticky top-0 z-10 bg-pi-head-bg [&_tr]:shadow-none">
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(head, "pl-5")}>
                File Details
              </TableHead>
              {/* Widths hold each label with its 20px sort button. */}
              <TableHead className={cn(head, "w-[156px]")}>
                <SortHead label="Upload Date" {...sortProps("uploaded")} />
              </TableHead>
              <TableHead className={cn(head, "w-[168px]")}>Uploaded By</TableHead>
              <TableHead className={cn(head, "w-[136px]")}>
                <SortHead label="Total Rows" align="right" {...sortProps("total")} />
              </TableHead>
              <TableHead className={cn(head, "w-[176px]")}>
                <SortHead label="Pending Rows" {...sortProps("pending")} />
              </TableHead>
              <TableHead className={cn(head, "w-[120px]")}>
                <SortHead label="Created" align="right" {...sortProps("created")} />
              </TableHead>
              <TableHead className={cn(head, "w-[164px] pr-5")}>
                <SortHead label="Status" {...sortProps("status")} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((batch) => {
              const openable =
                !!batchStep(batch.status) ||
                batch.status === ARVoucherImportBatchStatus.PROCESSING;
              const failed = batch.status === ARVoucherImportBatchStatus.FAILED;
              return (
                <TableRow
                  key={batch.importBatchUuid}
                  tabIndex={openable ? 0 : undefined}
                  onClick={() => open(batch)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") open(batch);
                  }}
                  className={cn(
                    "hover:bg-transparent",
                    openable &&
                      "group cursor-pointer focus-visible:outline-none"
                  )}
                >
                  <TableCell className={cn(cell, "pl-5")}>
                    <div className="flex min-w-0 items-center gap-2">
                      <FileIcon ext={batch.fileType} bare />
                      <div className="min-w-0">
                        <span
                          className="block truncate font-medium text-pi-ink"
                          title={batch.originalFileName}
                        >
                          {batch.originalFileName}
                        </span>
                        <span
                          className={cn(
                            T.sub,
                            "block truncate",
                            failed && "text-pi-danger"
                          )}
                          title={
                            failed ? (batch.failureMessage ?? "") : undefined
                          }
                        >
                          {failed && batch.failureMessage
                            ? batch.failureMessage
                            : IMPORT_MODE_LABELS[batch.importMode]}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={cn(cell, "whitespace-nowrap")}>
                    {uploadDate(batch.createdAt)}
                  </TableCell>
                  <TableCell className={cn(cell, "truncate text-pi-body")}>
                    {uploaderOf(batch)}
                  </TableCell>
                  <TableCell className={cn(cell, "fig text-right")}>
                    {batch.totalRows || "-"}
                  </TableCell>
                  <TableCell className={cell}>
                    <PendingRows batch={batch} />
                  </TableCell>
                  <TableCell className={cn(cell, "fig text-right")}>
                    {batch.createdRows}
                  </TableCell>
                  <TableCell className={cn(cell, "pr-5")}>
                    {/* -ml-2: the chip's padding, so its dot sits on the
                        header's line. */}
                    <span className="-ml-2 inline-flex max-w-full">
                      <BatchStatusPill status={batch.status} />
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {!pageRows.length &&
          (term ? (
            <EmptyState
              title="No uploads match your search"
              body="Search looks at the spreadsheet's file name."
              filters={[{ label: `Search: “${search.trim()}”` }]}
            />
          ) : (
            <EmptyState
              icon={SheetIcon}
              title="No sales spreadsheets uploaded yet"
              body="Spreadsheets you upload with Upload Sales are listed here while their columns are mapped and the invoices reviewed."
            />
          ))}
      </div>

      {progress && (
        <ProcessingModal
          key={progress.batch.importBatchUuid}
          batch={progress.batch}
          open
          onClose={() => setProgressId("")}
          onGoToUploads={() => setProgressId("")}
          onComplete={() => setProgressId("")}
        />
      )}
    </>
  );
};

export default UploadedInvoicesTable;
