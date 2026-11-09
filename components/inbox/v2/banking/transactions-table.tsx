import React, { useEffect, useState } from "react";
import { Check, Eye, MoreVertical, Undo2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip } from "@/components/common/tooltip";
import { cn } from "@/lib/utils";
import type { useColumnResize } from "@/hooks/pages/inbox/use-column-resize";
import {
  CONTRA_GROUPS,
  gstRegistrationsOf,
  ledgerGroupsOf,
  VOUCHER_TYPE_LABEL,
} from "@/config/pages/inbox/mock-banking";
import type {
  BankTransaction,
  TallyVoucherPaymentType,
} from "@/types/pages/inbox/banking";
import type { MatchSuggestion } from "@/types/pages/inbox/bank-automation";
import EditableCell from "@/components/inbox/v2/editable-cell";
import {
  ACTIONS_WIDTH,
  SELECT_WIDTH,
} from "@/components/inbox/v2/table-sizing";
import type { ColumnSpec } from "@/components/inbox/v2/columns-menu";
import {
  AmountText,
  CELL_TRIGGER,
  T,
  type PillTone,
} from "@/components/inbox/v2/ui";
import { TRANSACTION_SIZES } from "./table-sizing";
import {
  CellBox,
  EmptyBlock,
  HEADER_CLASS,
  HeaderCell,
  TABLE_CLASS,
  day,
  type SortState,
} from "./table-parts";
import { DotChip, ROW_GROUND } from "./page-parts";
import { AiMark } from "../ai-mark";

/**
 * One account's transactions — the ERP columns of production's
 * components/transactions/common/table/columns/index.tsx, drawn in the
 * Purchases register's grid.
 *
 * Needs Review rows edit in place (voucher no., GST registration, type,
 * ledger); Approved rows are read-only until reverted.
 */

export type TxnColumn =
  | "date"
  | "sync"
  | "gst"
  | "voucherNo"
  | "description"
  | "type"
  | "ledger"
  | "amount";

const LABEL: Record<TxnColumn, string> = {
  date: "Date",
  sync: "Sync Status",
  gst: "GST Registration",
  voucherNo: "Voucher No.",
  description: "Description",
  type: "Type",
  ledger: "Ledger",
  amount: "Amount",
};

/*
  The columns per tab, in Figma's order (28 Oct 2026; "AIA - Component
  Library" › Table): Date | Description | Voucher No. | Type | Ledger |
  Amount, then Reviewed or Sync Status. Figma's wide variant adds GST
  Registration, Bank Allocation, Cost Centre, Cheque/Instrument No. and
  Supplier/Reference No. after Ledger; only GST Registration has data on a
  bank line here, so it is the one extra, off until turned on in Columns.
  Date and Description say what the line is, so they cannot be hidden.
*/
const spec = (key: TxnColumn, extra?: Partial<ColumnSpec>): ColumnSpec => ({
  key,
  label: LABEL[key],
  ...extra,
});
export const REVIEW_COLUMNS: ColumnSpec[] = [
  spec("date", { locked: true }),
  spec("description", { locked: true }),
  spec("voucherNo"),
  spec("type"),
  spec("ledger"),
  spec("gst", { hidden: true }),
  spec("amount"),
];
export const READY_COLUMNS: ColumnSpec[] = [...REVIEW_COLUMNS, spec("sync")];

/**
 * Ink per column, as the Inbox reads a row: what the transaction is
 * (description) and what it is worth (amount) in ink at 500; the fields that
 * describe it in body ink.
 */
const CELL_INK: Partial<Record<TxnColumn, string>> = {
  date: "text-pi-body",
  gst: "text-pi-body",
  description: "font-medium text-pi-ink",
  type: "text-pi-body",
  ledger: "text-pi-body",
  amount: "font-medium text-pi-ink",
};

export const TYPE_BY_LABEL: Record<string, TallyVoucherPaymentType> = {
  Payment: "payment",
  Receipt: "receipt",
  Contra: "contra",
};
/** Money out is a Payment, money in a Receipt; either can be a Contra. */
export const typeOptionsFor = (txn: Pick<BankTransaction, "crDr">) =>
  txn.crDr === "debit" ? ["Payment", "Contra"] : ["Receipt", "Contra"];

/**
 * A Contra moves money between bank and cash ledgers; nothing else. The
 * ledgers are the company's own.
 */
export const ledgerGroupsFor = (
  type: TallyVoucherPaymentType | null,
  ownLedger: string,
  company: string
) =>
  ledgerGroupsOf(company)
    .filter((g) => type !== "contra" || CONTRA_GROUPS.includes(g.heading))
    .map((g) => ({
      heading: g.heading,
      options: g.options.filter((o) => o !== ownLedger),
    }))
    .filter((g) => g.options.length);

/** production's getDisplayCrDr: the bank ledger's side in the books. */
export const displayCrDr = (txn: BankTransaction) =>
  txn.crDr === "debit" ? "Credit" : "Debit";

const locked = (txn: BankTransaction) =>
  txn.thirdPartySyncStatus === "synced" ||
  txn.thirdPartySyncStatus === "in_progress";

/*
  Sync Status as the registers state it (28 Oct 2026): a dot and a label, in
  the registers' words, where it was an icon with no header. The tooltip
  keeps production's detail — when it posted, or why it failed.
*/
const SYNC: Record<
  BankTransaction["thirdPartySyncStatus"],
  { label: string; tone: PillTone; live?: boolean }
> = {
  synced: { label: "Synced", tone: "ok" },
  in_progress: { label: "Syncing…", tone: "info", live: true },
  event_creations_failed: { label: "Sync failed", tone: "error" },
  not_synced: { label: "Not synced", tone: "warn" },
};

const SyncStatus = ({ txn }: { txn: BankTransaction }) => {
  const status = txn.thirdPartySyncStatus;
  const { label, tone, live } = SYNC[status];
  const erp = txn.thirdPartyProduct || "ERP";
  const detail =
    status === "synced"
      ? txn.thirdPartyPostingDate
        ? `Synced to ${erp} on ${new Date(
            txn.thirdPartyPostingDate
          ).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}`
        : `Synced to ${erp}`
      : status === "in_progress"
        ? `Syncing to ${erp}. Updates will appear shortly.`
        : status === "event_creations_failed"
          ? txn.thirdPartySyncError || `Could not sync to ${erp}.`
          : `Not in ${erp} yet.`;
  return (
    <Tooltip message={detail} side="bottom" align="start">
      {/* The -ml-2 that puts the dot on the label line sits on this box: on
          the chip inside it, the box would size to the chip less 8px and
          clip the label. */}
      <span className="-ml-2 inline-flex max-w-full">
        <DotChip tone={tone} live={live}>
          {label}
        </DotChip>
      </span>
    </Tooltip>
  );
};

/** Production's inline voucher-number field: saves on blur or Enter. */
const VoucherInput = ({
  value,
  onSave,
}: {
  value: string;
  onSave: (value: string) => void;
}) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    const next = draft.trim();
    if (next !== value) onSave(next);
  };
  return (
    <input
      value={draft}
      placeholder="Voucher no."
      aria-label="Voucher No."
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(value);
          e.currentTarget.blur();
        }
      }}
      className="code -mx-2 h-8 w-[calc(100%+16px)] min-w-0 rounded-sm border border-transparent !bg-transparent px-2 text-small text-pi-ink transition-colors duration-100 placeholder:font-sans placeholder:text-pi-faint hover:border-pi-line-2 hover:!bg-background focus-visible:border-pi-brand focus-visible:!bg-background focus-visible:outline-none motion-reduce:transition-none"
    />
  );
};

type Props = {
  rows: BankTransaction[];
  ready: boolean;
  /** The columns on screen, in order — the Columns menu's layout. */
  shown: TxnColumn[];
  /** The page's resize state: the Columns menu resets its widths. */
  resize: ReturnType<typeof useColumnResize>;
  selected: string[];
  onSelectedChange: React.Dispatch<React.SetStateAction<string[]>>;
  sort: SortState<TxnColumn>;
  onSort: (key: TxnColumn) => void;
  sortable: Set<TxnColumn>;
  filterFor: (key: TxnColumn) => React.ReactNode | undefined;
  filterActive: (key: TxnColumn) => boolean;
  onOpen: (txn: BankTransaction) => void;
  onUpdate: (
    txn: BankTransaction,
    change: Partial<BankTransaction>,
    message: string
  ) => void;
  onToggleReady: (txn: BankTransaction) => void;
  onUnbuilt: (what: string) => void;
  empty: React.ComponentProps<typeof EmptyBlock>;
  /** The active company — its ledgers and GST registrations fill the pickers. */
  company: string;
  /** The AI's open match for a line, if it has one (13 Oct 2026). */
  matchFor?: (txn: BankTransaction) => MatchSuggestion | undefined;
  /** The bank rule that coded a line, as its citation. */
  ruleNoteFor?: (txn: BankTransaction) => string | undefined;
};

const TransactionsTable = ({
  rows,
  ready,
  shown,
  resize,
  selected,
  onSelectedChange,
  sort,
  onSort,
  sortable,
  filterFor,
  filterActive,
  onOpen,
  onUpdate,
  onToggleReady,
  onUnbuilt,
  empty,
  company,
  matchFor,
  ruleNoteFor,
}: Props) => {
  const gstRegistrations = gstRegistrationsOf(company);
  const [openCell, setOpenCell] = useState("");

  const allOnPage =
    !!rows.length && rows.every((x) => selected.includes(x.bankLineUuid));
  const someOnPage = rows.some((x) => selected.includes(x.bankLineUuid));

  const cell = (key: TxnColumn, txn: BankTransaction) => {
    const editable = !ready && !locked(txn);
    const cellId = `${txn.bankLineUuid}:${key}`;
    const picker = {
      open: openCell === cellId,
      onOpenChange: (open: boolean) => setOpenCell(open ? cellId : ""),
    };
    switch (key) {
      case "date":
        return <span className="truncate">{day(txn.transactionDate)}</span>;
      case "sync":
        return <SyncStatus txn={txn} />;
      case "gst":
        return (
          <EditableCell
            className={CELL_TRIGGER}
            label="GST Registration"
            value={txn.companyGstLabel}
            options={gstRegistrations.map((g) => g.label)}
            editable={editable}
            onChange={(label) => {
              const gst = gstRegistrations.find((g) => g.label === label);
              onUpdate(
                txn,
                {
                  companyGstLabel: label,
                  companyGstUuid: gst?.uuid ?? "",
                },
                "GST registration updated"
              );
              return true;
            }}
            {...picker}
          />
        );
      case "voucherNo":
        return editable ? (
          <VoucherInput
            value={txn.voucherNo ?? ""}
            onSave={(voucherNo) =>
              onUpdate(txn, { voucherNo }, "Voucher number updated")
            }
          />
        ) : (
          <span className={cn("truncate", txn.voucherNo && "code")}>
            {txn.voucherNo || "—"}
          </span>
        );
      case "description": {
        // A match the AI proposes sits under the narration, marked as the
        // AI's decision; once accepted it reads as a plain link, unmarked.
        const match = matchFor?.(txn);
        return (
          <span className="flex min-w-0 flex-col">
            <Tooltip message={txn.description} side="bottom" align="start">
              <span className="block truncate">{txn.description}</span>
            </Tooltip>
            {match ? (
              <span className="flex min-w-0 items-center gap-1 text-caption font-normal leading-4 text-pi-body">
                <AiMark size={10} quiet reason={match.evidence} />
                <span className="truncate" title={`Match: ${match.headline}`}>
                  Match: {match.headline}
                </span>
              </span>
            ) : txn.matchNote ? (
              <span className="truncate text-caption font-normal leading-4 text-pi-faint">
                Linked: {txn.matchNote}
              </span>
            ) : null}
          </span>
        );
      }
      case "type": {
        // One mark per decision: an open match is the decision on this
        // line, so its mark is on the match line, not here.
        const ai =
          txn.categorisedBy === "ai" && !!txn.paymentType && !matchFor?.(txn);
        return (
          <span className="flex min-w-0 items-center gap-1">
            <span className="inline-flex w-3.5 flex-none justify-center">
              {ai ? (
                <AiMark
                  quiet
                  reason={
                    ruleNoteFor?.(txn) ??
                    "categorised from this payee and narration"
                  }
                />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <EditableCell
                className={CELL_TRIGGER}
                label="Transaction Type"
                value={
                  txn.paymentType ? VOUCHER_TYPE_LABEL[txn.paymentType] : ""
                }
                options={typeOptionsFor(txn)}
                editable={editable}
                onChange={(label) => {
                  const paymentType = TYPE_BY_LABEL[label];
                  const allowed = ledgerGroupsFor(
                    paymentType,
                    txn.bankAccountName,
                    company
                  ).flatMap((g) => g.options);
                  const keep = txn.ledgersNameList.filter((l) =>
                    allowed.includes(l)
                  );
                  onUpdate(
                    txn,
                    {
                      paymentType,
                      categorisedBy: "user",
                      ledgersNameList: keep,
                      ledgersUuidList: keep.map((l) => `led-${l}`),
                      // Lines the new type can't post to lose their ledger;
                      // the form's Needs you says what is left to code.
                      ...(txn.lines
                        ? {
                            lines: txn.lines.map((l) =>
                              allowed.includes(l.ledger)
                                ? l
                                : { ...l, ledger: "", refs: undefined }
                            ),
                          }
                        : {}),
                    },
                    "Transaction type updated"
                  );
                  return true;
                }}
                {...picker}
              />
            </span>
          </span>
        );
      }
      case "ledger":
        // Split across ledgers on the review form (4 Nov 2026): the cell
        // names the split and leaves editing to the form, where the
        // amounts are — one picker here would overwrite every line.
        if ((txn.lines?.length ?? 0) > 1)
          return (
            <span
              className="truncate text-pi-body"
              title={txn.lines!.map((l) => l.ledger || "—").join("\n")}
            >
              Split · {txn.lines!.length} ledgers
            </span>
          );
        return (
          <EditableCell
            className={CELL_TRIGGER}
            label="Ledger"
            value={txn.ledgersNameList[0] ?? ""}
            groups={ledgerGroupsFor(
              txn.paymentType,
              txn.bankAccountName,
              company
            )}
            options={ledgerGroupsFor(
              txn.paymentType,
              txn.bankAccountName,
              company
            ).flatMap((g) => g.options)}
            editable={editable}
            createNoun="ledger"
            onCreate={() => onUnbuilt("Creating a ledger")}
            onChange={(name) => {
              onUpdate(
                txn,
                {
                  ledgersNameList: [name],
                  ledgersUuidList: [`led-${name}`],
                  categorisedBy: "user",
                  // One ledger for the whole amount: the form rebuilds its
                  // single line from this.
                  lines: undefined,
                },
                "Ledger updated"
              );
              return true;
            }}
            {...picker}
          />
        );
      case "amount":
        return (
          <span className="flex flex-col items-end">
            <span className="truncate tabular-nums">
              <AmountText value={Number(txn.transactionAmountLc)} />
            </span>
            <span className="text-caption font-normal leading-4 text-pi-faint">
              {displayCrDr(txn)}
            </span>
          </span>
        );
    }
  };

  const reviewButton = (txn: BankTransaction) => {
    if (ready) {
      const can = !locked(txn);
      const button = (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Move Back to Needs Review"
          disabled={!can}
          className="w-7 text-pi-faint hover:text-pi-ink"
          onClick={() => onToggleReady(txn)}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
      );
      return can ? (
        <Tooltip message="Move Back to Needs Review">{button}</Tooltip>
      ) : (
        button
      );
    }
    const can = txn.isReadyToSync && !locked(txn);
    return (
      <Tooltip
        message={
          can ? "Approve" : "Transaction is not ready to approve"
        }
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Approve"
          disabled={!can}
          className="w-7 text-pi-faint hover:text-pi-brand"
          onClick={() => onToggleReady(txn)}
        >
          <Check className="h-4 w-4" />
        </Button>
      </Tooltip>
    );
  };

  /*
    The row's ⋯ menu (28 Oct 2026, Figma): the same two things the row
    already does — open the line to categorise or view it, and move it
    between tabs — beside the inline check or undo, which stays. The menu
    keeps its clicks and keys to itself: the row behind it opens the sheet.
  */
  const rowMenu = (txn: BankTransaction) => {
    const canMove = ready ? !locked(txn) : txn.isReadyToSync && !locked(txn);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`More actions for ${txn.description}`}
            className="w-7 text-pi-faint hover:text-pi-ink"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[220px]"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {/* Figma: "Categorise Transactions" / "View Categorise
              Transactions" — one row, so singular, and "Categorised". */}
          <DropdownMenuItem onSelect={() => onOpen(txn)}>
            <Eye className="mr-2 h-4 w-4" />
            {ready ? "View Categorised Transaction" : "Categorise Transaction"}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canMove}
            onSelect={() => onToggleReady(txn)}
          >
            {ready ? (
              <Undo2 className="mr-2 h-4 w-4" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {ready ? "Undo" : "Approve"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    // No scroll of its own: the page scroller owns both axes.
    <div ref={resize.gridRef} className="min-w-0 flex-1">
      <Table style={{ width: resize.tableWidth }} className={TABLE_CLASS}>
        <TableHeader className={HEADER_CLASS}>
          <TableRow>
            <TableHead
              style={{ width: SELECT_WIDTH }}
              className="pin-edge-l sticky left-0 z-10 h-row-header bg-pi-head-bg px-3 py-0 align-middle"
            >
              <Checkbox
                aria-label="Select every transaction on this page"
                checked={allOnPage ? true : someOnPage ? "indeterminate" : false}
                onCheckedChange={() => {
                  const ids = rows.map((x) => x.bankLineUuid);
                  onSelectedChange(
                    someOnPage
                      ? selected.filter((id) => !ids.includes(id))
                      : Array.from(new Set([...selected, ...ids]))
                  );
                }}
              />
            </TableHead>
            {shown.map((key) => (
              <HeaderCell
                key={key}
                columnKey={key}
                label={LABEL[key]}
                sizes={TRANSACTION_SIZES}
                resize={resize}
                align={key === "amount" ? "right" : "left"}
                sort={
                  sortable.has(key)
                    ? sort?.key === key
                      ? sort.dir
                      : "none"
                    : undefined
                }
                onSort={() => onSort(key)}
                filter={filterFor(key)}
                filterActive={filterActive(key)}
              />
            ))}
            <TableHead
              style={{ width: ACTIONS_WIDTH }}
              className="pin-edge-r sticky right-0 z-10 h-row-header bg-pi-head-bg px-2 py-0 align-middle"
            >
              <span
                className={cn(
                  T.head,
                  "flex h-4 items-center justify-center truncate"
                )}
              >
                {ready ? "Undo" : "Reviewed"}
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((txn) => {
            const ticked = selected.includes(txn.bankLineUuid);
            // Precision Indigo rows: the row-hover wash, or the brand tint
            // for a ticked row. Sticky bookends paint the same grounds
            // opaquely so scrolled columns never show through.
            const ground = (sticky: boolean) =>
              ticked
                ? "bg-pi-brand-tint"
                : cn(sticky && "bg-background", ROW_GROUND);
            return (
              <TableRow
                key={txn.bankLineUuid}
                aria-selected={ticked}
                onClick={() => onOpen(txn)}
                className={cn(
                  "group cursor-pointer hover:bg-transparent",
                  ticked && "bg-pi-brand-tint"
                )}
              >
                <TableCell
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "pin-edge-l sticky left-0 z-[1] h-row px-3 py-0 align-middle",
                    ground(true),
                    ticked && "shadow-[inset_2px_0_0_var(--pi-brand)]"
                  )}
                >
                  <Checkbox
                    aria-label={`Select ${txn.description}`}
                    checked={ticked}
                    onCheckedChange={(checked) =>
                      onSelectedChange((current) =>
                        checked
                          ? [...current, txn.bankLineUuid]
                          : current.filter((id) => id !== txn.bankLineUuid)
                      )
                    }
                  />
                </TableCell>
                {shown.map((key) => (
                  <TableCell
                    key={key}
                    onClick={
                      // Editors swallow their own clicks; the rest open the
                      // details sheet. A synced line's editors read as plain
                      // text, so they open it too rather than going dead.
                      ["gst", "type", "ledger", "voucherNo"].includes(key) &&
                      !ready &&
                      !locked(txn)
                        ? (e) => e.stopPropagation()
                        : undefined
                    }
                    className={cn(
                      "h-row overflow-hidden px-4 py-0 align-middle",
                      T.cell,
                      CELL_INK[key],
                      ground(false),
                      key === "amount" && "text-right"
                    )}
                  >
                    <CellBox>{cell(key, txn)}</CellBox>
                  </TableCell>
                ))}
                <TableCell
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "pin-edge-r sticky right-0 z-[1] h-row px-2 py-0 text-center align-middle",
                    ground(true)
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {reviewButton(txn)}
                    {rowMenu(txn)}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {!rows.length && <EmptyBlock {...empty} />}
    </div>
  );
};

export default TransactionsTable;
