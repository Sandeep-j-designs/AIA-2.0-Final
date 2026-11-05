import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RupeeInput from "@/components/common/rupee-input";
import { DateField, PageDialog } from "@/components/inbox/v2/ui";
import { cn } from "@/lib/utils";
import {
  REFERENCE_TYPE_NAME,
  type VoucherProfile,
} from "@/config/pages/inbox/voucher-profiles";
import {
  advanceName,
  allocated,
  referenceFaults,
  rupee,
  r2,
  seedReferences,
  unallocated,
  vid,
} from "@/utils/pages/inbox/voucher";
import type {
  BillReference,
  PendingReference,
  Side,
} from "@/types/pages/inbox/voucher";

/**
 * Bill-wise allocation for one party line — the voucher base's References.
 *
 * A port of the AP engine's Bill Allocation dialog (#br-dialog in
 * public/ap/index.html): the same six columns, the same opening answer
 * (what the party is holding is laid out first, oldest first), the same
 * four types and the same refusals, read through the same totals line. It
 * edits a copy, so Cancel really cancels, and faults show on the first
 * refused Confirm rather than while typing.
 *
 * Deliberate differences from the bill's version, because a bank line is
 * not a bill:
 *   - what the party's items don't take becomes an Advance, not a New
 *     Reference — money beyond the bills is money ahead of the next one;
 *   - "Net voucher amount" rather than "Net Bill/voucher amount";
 *   - the subtitle names the payment or receipt.
 *
 * DEV: production's ledgerAllocations[].billAllocations[]
 * ({ referenceType, referenceUuid | referenceNo + dueDate, amount }).
 */

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (refs: BillReference[]) => void;
  party: string;
  /** The line's amount, on the line's side. */
  amount: number;
  side: Side;
  pending: PendingReference[];
  initial: BillReference[] | undefined;
  voucherDate: string;
  types: VoucherProfile["referenceTypes"];
  /** "payment" / "receipt", for the subtitle. */
  noun: string;
  /** An approved or synced voucher: the allocation is shown, not changed. */
  readOnly?: boolean;
};

const KIND: Record<PendingReference["kind"], string> = {
  bill: "Bill",
  invoice: "Invoice",
  advance: "Advance",
  onacct: "On account",
};

const ROW =
  "grid grid-cols-[minmax(150px,196px)_minmax(168px,1.4fr)_minmax(132px,174px)_minmax(118px,1fr)_72px_28px] items-center gap-3";
const BOX =
  "flex h-[38px] items-center gap-2 rounded-sm border border-pi-line-2 bg-pi-page px-3 text-body text-pi-body";

const ReferencesDialog = ({
  open,
  onClose,
  onSave,
  party,
  amount,
  side,
  pending,
  initial,
  voucherDate,
  types,
  noun,
  readOnly,
}: Props) => {
  const [rows, setRows] = useState<BillReference[]>([]);
  const [note, setNote] = useState("");
  const [showErrs, setShowErrs] = useState(false);

  // Each opening starts from what the line holds, or the book's answer.
  useEffect(() => {
    if (!open) return;
    setShowErrs(false);
    if (initial?.length) {
      setRows(initial.map((r) => ({ ...r })));
      setNote("");
    } else {
      const seeded = seedReferences(party, amount, side, pending, voucherDate);
      setRows(seeded.refs);
      setNote(seeded.note);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const other: Side = side === "Dr" ? "Cr" : "Dr";
  const faults = showErrs ? referenceFaults(rows, pending, voucherDate) : [];
  const bad = (id: string, f: string) =>
    faults.some((x) => x.id === id && x.f === f);
  const alloc = allocated(rows, side);
  const bal = unallocated(amount, rows, side);
  const square = Math.abs(bal) < 0.005;
  const sideOf = (n: number): Side => (n < 0 ? other : side);

  const set = (id: string, patch: Partial<BillReference>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  /*
    What a row may be set against: a reference with something left on it,
    leaning the other way from the row, and not already spoken for by
    another row on this voucher. Settling one reference twice on one voucher
    is the fault this last clause exists to prevent.
  */
  const candidates = (row: BillReference) => {
    const taken = new Set(
      rows
        .filter((r) => r !== row && r.type === "agst" && r.refId)
        .map((r) => r.refId)
    );
    return pending.filter(
      (p) => p.pending > 0.004 && p.side !== row.side && !taken.has(p.id)
    );
  };

  const confirm = () => {
    const errs = referenceFaults(rows, pending, voucherDate);
    if (errs.length || !square) {
      setShowErrs(true);
      return;
    }
    onSave(
      rows.map((r) => ({
        ...r,
        amount: r2(r.amount),
        name:
          r.type === "agst"
            ? (pending.find((p) => p.id === r.refId)?.name ?? r.name)
            : r.type === "onacct"
              ? "On Account"
              : r.name.trim(),
      }))
    );
  };

  /*
    A new row opens holding whatever is still unallocated, on the side it is
    short — which is what somebody pressing Add is almost always about to
    type.
  */
  const add = () =>
    setRows((rs) => [
      ...rs,
      {
        id: vid("br"),
        type: "agst",
        refId: "",
        name: "",
        dueDate: "",
        amount: Math.abs(bal) >= 0.005 ? Math.abs(bal) : 0,
        side: sideOf(bal),
      },
    ]);

  const msgs = showErrs ? [...new Set(faults.map((f) => f.msg))] : [];
  if (showErrs && !square)
    msgs.unshift(
      `${rupee(bal)} ${sideOf(bal)} is still unallocated — the references have to come to the line amount exactly.`
    );

  return (
    <PageDialog
      open={open}
      onClose={onClose}
      title={`Bill Allocation for ${party}`}
      description={
        readOnly
          ? `What this ${noun} settles. Edit entry to change it.`
          : `Allocate this ${noun} against pending references.`
      }
      className="max-w-[min(1000px,95vw)]"
      footer={
        <>
          {msgs.length ? (
            <p
              role="alert"
              className="mr-auto max-w-[56ch] text-caption font-semibold text-pi-danger"
            >
              {msgs.join("  ")}
            </p>
          ) : null}
          {readOnly ? (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={confirm}>Confirm &amp; Allocate</Button>
            </>
          )}
        </>
      }
    >
      {note ? (
        <p className="mb-3 text-small text-pi-body">{note}</p>
      ) : null}
      {rows.some((r) => r.reopens) ? (
        <p className="mb-3 text-small text-pi-body">
          A returned cheque: this puts{" "}
          {rows
            .filter((r) => r.reopens)
            .map((r) => `${r.name} (${rupee(r.amount)})`)
            .join(", ")}{" "}
          back to owing. The payment stays in the books, and the audit trail
          shows both.
        </p>
      ) : null}
      <fieldset disabled={readOnly} className="min-w-0">
        <div>
          <div
            className={cn(
              ROW,
              "border-b border-pi-line pb-2 text-caption font-medium text-pi-body"
            )}
          >
            <span>Type of reference</span>
            <span>Name/Ref no.</span>
            <span>Due date</span>
            <span className="text-right">Amount</span>
            <span>Dr/Cr</span>
            <span />
          </div>
          {rows.map((r) => {
            const hit =
              r.type === "agst"
                ? pending.find((p) => p.id === r.refId)
                : undefined;
            // The reference this row already holds stays on its own list even
            // when the filter would now drop it — a picker that cannot show
            // its own value is a picker that looks empty.
            const list =
              r.type === "agst"
                ? [
                    ...(hit && !candidates(r).includes(hit) ? [hit] : []),
                    ...candidates(r),
                  ]
                : [];
            return (
              <div
                key={r.id}
                className={cn(ROW, "border-b border-pi-line py-3 last:border-b-0")}
              >
                <Select
                  value={r.type}
                  onValueChange={(v) => {
                    const type = v as BillReference["type"];
                    set(r.id, {
                      type,
                      refId: "",
                      dueDate: type === "new" ? voucherDate : "",
                      name:
                        type === "advance"
                          ? advanceName(party, voucherDate)
                          : type === "new"
                            ? ""
                            : r.name,
                    });
                  }}
                >
                  <SelectTrigger
                    aria-label="Type of reference"
                    className="h-[38px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t} value={t}>
                        {REFERENCE_TYPE_NAME[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* The name cell is a different control per type, because the
                    type decides whether the reference is being named or found. */}
                {r.type === "agst" ? (
                  <Select
                    value={r.refId || undefined}
                    onValueChange={(id) => {
                      const p = pending.find((x) => x.id === id);
                      set(r.id, {
                        refId: id,
                        name: p?.name ?? "",
                        dueDate: p?.dueDate ?? "",
                        amount:
                          r.amount > 0
                            ? r.amount
                            : Math.min(p?.pending ?? 0, Math.max(bal, 0)),
                      });
                    }}
                  >
                    <SelectTrigger
                      aria-label="Pending reference"
                      aria-invalid={bad(r.id, "ref")}
                      className={cn(
                        "h-[38px]",
                        bad(r.id, "ref") && "border-pi-danger"
                      )}
                    >
                      {/* The trigger names the reference; the list says
                          what kind it is and what is left on it. */}
                      {hit ? (
                        <SelectValue>{hit.name}</SelectValue>
                      ) : (
                        <SelectValue
                          placeholder={
                            list.length
                              ? "Select a pending reference"
                              : "Nothing pending to set against"
                          }
                        />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {list.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} · {KIND[p.kind]} · {rupee(p.pending)}{" "}
                          {p.side}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : r.type === "onacct" ? (
                  <div className={BOX}>On Account</div>
                ) : (
                  <Input
                    aria-label="Reference number"
                    placeholder="Enter reference no."
                    value={r.name}
                    aria-invalid={bad(r.id, "ref")}
                    className={cn(bad(r.id, "ref") && "border-pi-danger")}
                    onChange={(e) => set(r.id, { name: e.target.value })}
                  />
                )}

                {/* Only a new reference has a due date to set. An against
                    reference inherits the one it settles; an advance and an
                    on-account amount are not owed on any date. */}
                {r.type === "new" ? (
                  <DateField
                    value={r.dueDate}
                    onChange={(iso) => set(r.id, { dueDate: iso })}
                    className={cn(bad(r.id, "due") && "border-pi-danger")}
                  />
                ) : (
                  <div className={BOX}>
                    {r.type === "agst" && hit?.dueDate ? hit.dueDate : "—"}
                  </div>
                )}

                <RupeeInput
                  aria-label="Amount"
                  value={r.amount}
                  hasError={bad(r.id, "amount")}
                  onChange={(v) => set(r.id, { amount: v })}
                />

                <Select
                  value={r.side}
                  onValueChange={(v) => set(r.id, { side: v as Side })}
                >
                  <SelectTrigger aria-label="Debit or credit" className="h-[38px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dr">Dr</SelectItem>
                    <SelectItem value="Cr">Cr</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove this reference"
                  disabled={rows.length < 2}
                  className={cn(
                    "text-pi-faint hover:text-pi-danger",
                    readOnly && "invisible"
                  )}
                  onClick={() =>
                    setRows((rs) => rs.filter((x) => x.id !== r.id))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          <Button
            variant="tertiary"
            className={cn("mt-2 px-0", readOnly && "hidden")}
            onClick={add}
          >
            <Plus className="h-4 w-4" />
            Add Another Reference
          </Button>
        </div>
      </fieldset>

      {/* The two figures the rule is about, side by side, so agreeing or not
          is read rather than worked out. The third only exists while they
          disagree. */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-x-8 gap-y-2 border-t border-pi-line pt-4 text-small text-pi-body">
        <span>
          Net voucher amount:
          <b className="ml-2 font-semibold tabular-nums text-pi-ink">
            {rupee(amount)} {side}
          </b>
        </span>
        <span>
          Total allocated:
          <b
            className={cn(
              "ml-2 font-semibold tabular-nums",
              square ? "text-pi-success" : "text-pi-danger"
            )}
          >
            {rupee(alloc)} {sideOf(alloc)}
          </b>
        </span>
        {square ? null : (
          <span>
            Balance to allocate:
            <b className="ml-2 font-semibold tabular-nums text-pi-danger">
              {rupee(bal)} {sideOf(bal)}
            </b>
          </span>
        )}
      </div>
    </PageDialog>
  );
};

export default ReferencesDialog;
