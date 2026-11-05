import React, { useState } from "react";
import { Link, Maximize, Plus, Trash2 } from "@/components/icons";
import RupeeInput from "@/components/common/rupee-input";
import { ComboBox } from "@/components/common/combo-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import AllocationCell from "@/components/inbox/journal/allocation-cell";
import CostAllocationPanel from "@/components/inbox/journal/cost-allocation-panel";
import type { VoucherProfile } from "@/config/pages/inbox/voucher-profiles";
import {
  blankLine,
  isPartyLedger,
  pendingBefore,
  r2,
  rupee,
  takesCostCentre,
  unallocated,
} from "@/utils/pages/inbox/voucher";
import type { OpenDocument } from "@/types/pages/inbox/bank-automation";
import type {
  BillReference,
  Side,
  VoucherLine,
} from "@/types/pages/inbox/voucher";
import ReferencesDialog from "./references-dialog";

/**
 * The voucher base's lines: what the voucher posts under its account.
 *
 * Built from the journal's ledger lines (components/inbox/journal/
 * ledger-lines.tsx) — same table, same cells, same cost centre split under
 * the row — with one amount column instead of Debit and Credit, because
 * every line sits on the profile's one side, and a References column for
 * party lines, which open the bill-wise allocation.
 */

type Group = { heading: string; options: string[] };

type Props = {
  profile: VoucherProfile;
  company: string;
  lines: VoucherLine[];
  /** The figure the lines must come to: the statement amount. */
  total: number;
  side: Side;
  groups: Group[];
  docs: OpenDocument[];
  voucherDate: string;
  /** References this voucher already applied to the open items (once approved). */
  applied?: BillReference[];
  readOnly?: boolean;
  /** Show the red edges: Approve has been tried. */
  attempted?: boolean;
  onChange: (lines: VoucherLine[]) => void;
  onCreateLedger?: (query: string) => void;
  onExpand?: () => void;
};

const HEAD_ROW = "border-b border-pi-line bg-pi-head-bg hover:bg-pi-head-bg";
const HEAD_CELL =
  "h-[42px] px-3 py-3 align-middle text-caption font-medium text-pi-body whitespace-nowrap";
const BODY_ROW =
  "border-b border-pi-line last:border-b-0 hover:bg-pi-row-hover";
const BODY_CELL = "h-[64px] px-3 py-3 align-middle";

const VoucherLines = ({
  profile,
  company,
  lines,
  total,
  side,
  groups,
  docs,
  voucherDate,
  applied,
  readOnly,
  attempted,
  onChange,
  onCreateLedger,
  onExpand,
}: Props) => {
  const [splitAt, setSplitAt] = useState<string | null>(null);
  const [refsAt, setRefsAt] = useState<string | null>(null);
  const refsLine = lines.find((l) => l.id === refsAt);
  const showRefs = profile.references;
  const columns = 4 + (showRefs ? 1 : 0) + (readOnly ? 0 : 1);
  const options = groups.flatMap((g) => g.options);

  const setLine = (id: string, patch: Partial<VoucherLine>) =>
    onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  /** A new line holds whatever the statement amount still has spare. */
  const add = () => {
    const spare = r2(total - lines.reduce((s, l) => s + (l.amount || 0), 0));
    onChange([...lines, blankLine(spare > 0 ? spare : 0)]);
  };

  /** Never below one line: a voucher posts to something. */
  const remove = (id: string) =>
    onChange(
      lines.length <= 1
        ? [blankLine(total)]
        : lines.filter((l) => l.id !== id)
    );

  const coded = lines.filter((l) => l.ledger).length;

  return (
    <section className="vb-lines jv-lines">
      <div className="cr-items-head">
        <h3>
          {profile.linesTitle} <span>{lines.length}</span>
        </h3>
        <div>
          <span className="cr-items-coded">
            {coded} of {lines.length} coded
          </span>
          <span className="cr-items-cur">INR</span>
          {onExpand ? (
            <button
              type="button"
              className="cr-expand"
              aria-label={`Expand ${profile.linesTitle.toLowerCase()}`}
              onClick={onExpand}
            >
              <Maximize size={14} />
              <span>Expand</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-pi-line bg-pi-surface-panel shadow-table">
        <Table
          className={cn(
            "w-full table-fixed border-collapse",
            showRefs ? "min-w-[820px]" : "min-w-[680px]"
          )}
        >
          <TableHeader>
            <TableRow className={HEAD_ROW}>
              <TableHead className={cn(HEAD_CELL, "w-[200px]")}>Ledger</TableHead>
              <TableHead className={HEAD_CELL}>Line narration</TableHead>
              <TableHead className={cn(HEAD_CELL, "w-[150px] text-right")}>
                Amount ({side})
              </TableHead>
              <TableHead className={cn(HEAD_CELL, "w-[150px]")}>
                Cost centre
              </TableHead>
              {showRefs ? (
                <TableHead className={cn(HEAD_CELL, "w-[168px]")}>
                  References
                </TableHead>
              ) : null}
              {!readOnly ? (
                <TableHead className={cn(HEAD_CELL, "w-[44px]")} />
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => {
              const party =
                showRefs && !!line.ledger && isPartyLedger(company, line.ledger);
              const splitting = splitAt === line.id;
              const ledgerBad = attempted && !line.ledger;
              const amountBad = attempted && !(line.amount > 0);
              const gap = party
                ? unallocated(line.amount, line.refs ?? [], side)
                : 0;
              const refsOpen =
                party && (!line.refs?.length || Math.abs(gap) >= 0.005);
              return (
                <React.Fragment key={line.id}>
                  <TableRow
                    className={cn(BODY_ROW, splitting && "border-b-0")}
                    data-line={line.id}
                  >
                    <TableCell className={BODY_CELL} data-cell="ledger">
                      <ComboBox
                        title="Select ledger"
                        size="sm"
                        searchPlaceholder="Search ledgers…"
                        isMultiSelect={false}
                        hideClearButton
                        modal={false}
                        disabled={readOnly}
                        invalid={ledgerBad}
                        selectedValue={line.ledger}
                        options={[
                          ...new Set([line.ledger, ...options].filter(Boolean)),
                        ].map((name) => ({ label: name, value: name }))}
                        optionGroups={groups.map((g) => ({
                          label: g.heading,
                          options: g.options.map((o) => ({ label: o, value: o })),
                        }))}
                        wrapperClassName="min-w-[280px]"
                        triggerClassName="text-body jv-cell-trigger"
                        onChange={(value) => {
                          const ledger = String(value);
                          // A new party starts with no references: the old
                          // ones were the other party's bills.
                          setLine(line.id, {
                            ledger,
                            refs: ledger === line.ledger ? line.refs : undefined,
                          });
                        }}
                        actionLabel={
                          onCreateLedger
                            ? (q) => (q ? `Create ledger “${q}”` : "Create ledger")
                            : undefined
                        }
                        onAction={onCreateLedger}
                      />
                    </TableCell>
                    <TableCell className={BODY_CELL}>
                      <Input
                        aria-label="Line narration"
                        placeholder="Add a line narration"
                        readOnly={readOnly}
                        value={line.narration}
                        onChange={(e) =>
                          setLine(line.id, { narration: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell className={BODY_CELL} data-cell="amount">
                      <RupeeInput
                        aria-label="Amount"
                        value={line.amount}
                        disabled={readOnly}
                        hasError={amountBad}
                        onChange={(value) =>
                          setLine(line.id, { amount: r2(value || 0) })
                        }
                      />
                    </TableCell>
                    <TableCell className={BODY_CELL}>
                      <AllocationCell
                        value={line.costCentre}
                        allocation={line.costAllocation}
                        amount={line.amount}
                        applicable={takesCostCentre(company, line.ledger)}
                        readOnly={readOnly}
                        splitting={splitting}
                        onSplit={() => setSplitAt(line.id)}
                        onChange={(patch) => {
                          setLine(line.id, patch);
                          if (splitting) setSplitAt(null);
                        }}
                      />
                    </TableCell>
                    {showRefs ? (
                      <TableCell className={BODY_CELL} data-cell="refs">
                        {party ? (
                          <button
                            type="button"
                            disabled={readOnly && !line.refs?.length}
                            onClick={() => setRefsAt(line.id)}
                            className={cn(
                              "flex w-full min-w-0 items-center gap-2 rounded-sm px-2 py-1 text-left text-small",
                              "hover:bg-pi-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand",
                              refsOpen
                                ? attempted
                                  ? "text-pi-danger"
                                  : "text-pi-warning"
                                : "text-pi-ink"
                            )}
                            title={
                              line.refs?.length
                                ? line.refs
                                    .map(
                                      (r) =>
                                        `${r.type === "agst" ? "Agst" : r.type === "advance" ? "Advance" : r.type === "new" ? "New" : "On Account"} ${r.name} · ${rupee(r.amount)} ${r.side}`
                                    )
                                    .join("\n")
                                : undefined
                            }
                          >
                            <Link className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="truncate">
                              {!line.refs?.length
                                ? "Allocate to bills"
                                : Math.abs(gap) >= 0.005
                                  ? `${rupee(gap)} unallocated`
                                  : line.refs.length === 1
                                    ? `${line.refs[0].reopens ? "Reopens" : line.refs[0].type === "agst" ? "Agst" : line.refs[0].type === "advance" ? "Advance" : line.refs[0].type === "new" ? "New" : ""} ${line.refs[0].name}`.trim()
                                    : `${line.refs.length} references`}
                            </span>
                          </button>
                        ) : (
                          <span className="px-2 text-small text-pi-faint">—</span>
                        )}
                      </TableCell>
                    ) : null}
                    {!readOnly ? (
                      <TableCell className={cn(BODY_CELL, "px-0")}>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remove line"
                          className="mx-auto"
                          onClick={() => remove(line.id)}
                        >
                          <Trash2 className="h-4 w-4 text-pi-faint" />
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                  {splitting ? (
                    <TableRow className={cn(BODY_ROW, "jv-split-row hover:bg-transparent")}>
                      <TableCell colSpan={columns} className="px-3 pb-3 pt-0">
                        <CostAllocationPanel
                          amount={line.amount}
                          initial={line.costAllocation ?? null}
                          seedCentre={line.costCentre}
                          notchRight={(showRefs ? 168 : 0) + (readOnly ? 80 : 124)}
                          onClose={() => setSplitAt(null)}
                          onSave={(next) =>
                            setLine(line.id, {
                              costCentre: "",
                              costAllocation: next,
                            })
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
        {!readOnly ? (
          <div className="cr-grid-bar">
            <button type="button" className="cr-add" onClick={add}>
              <Plus className="h-4 w-4" />
              Add ledger line
            </button>
          </div>
        ) : null}
      </div>

      {refsLine ? (
        <ReferencesDialog
          open
          onClose={() => setRefsAt(null)}
          onSave={(refs) => {
            if (!readOnly) setLine(refsLine.id, { refs });
            setRefsAt(null);
          }}
          party={refsLine.ledger}
          amount={refsLine.amount}
          side={side}
          pending={pendingBefore(
            refsLine.ledger,
            docs,
            applied,
            (refsLine.refs ?? []).filter((r) => r.reopens).map((r) => r.refId)
          )}
          initial={refsLine.refs}
          voucherDate={voucherDate}
          types={profile.referenceTypes}
          noun={profile.kind}
          readOnly={readOnly}
        />
      ) : null}
    </section>
  );
};

export default VoucherLines;
