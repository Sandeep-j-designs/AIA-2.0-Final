import React, { useState } from "react";
import { ChevronRight, Lock } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ComboBox } from "@/components/common/combo-box";
import {
  AmountText,
  DateField,
  RequiredNote,
} from "@/components/inbox/v2/ui";
import RupeeInput from "@/components/common/rupee-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet } from "@/components/inbox/journal/sheet";
import { cn } from "@/lib/utils";
import {
  BANK_TXN_TYPES,
  type VoucherProfile,
} from "@/config/pages/inbox/voucher-profiles";
import { r2, rupee } from "@/utils/pages/inbox/voucher";
import type { OpenDocument } from "@/types/pages/inbox/bank-automation";
import type {
  BankAllocation,
  BillReference,
  Side,
  VoucherCheck,
  VoucherLine,
} from "@/types/pages/inbox/voucher";
import VoucherLines from "./voucher-lines";
import TaxDeductions from "./tax-deductions";

/**
 * The voucher base's form (4 Nov 2026): Voucher → Account → Lines (with
 * their References) → Totals, with Needs you behind the totals' count. The
 * sections, row metrics and totals card are the journal's and the bill's
 * (`jv-form`, `cr-*` from styles/bill-form.css), so a bank voucher reads as
 * the bill beside it does.
 *
 * Profiles decide what shows; this file never asks which module it is in.
 * Phase 2 adds Bank allocation under the account, Tax & deductions (TDS)
 * under the lines, and a hand-entered account (a cash voucher has no
 * statement, so its date and amount are typed).
 */

export type VoucherHeader = {
  date: string;
  dateLabel: string;
  voucherNo: string;
  gst: string;
  narration: string;
};

type Props = {
  profile: VoucherProfile;
  company: string;
  header: VoucherHeader;
  onHeader: (patch: Partial<VoucherHeader>) => void;
  gstOptions: { label: string; value: string }[];
  /** The bank or cash ledger the voucher is drawn on, and the statement amount. */
  account: { name: string; amount: number; side: Side };
  /**
   * A voucher with no statement behind it (cash): its date and amount are
   * typed, so they are fields rather than locked values.
   */
  onAccount?: (patch: { date?: string; amount?: number }) => void;
  /** ERP's Bank Allocations: the value, what the narration says, and edits. */
  allocation?: {
    value: BankAllocation;
    /** Fields still as read off the narration, for the caption. */
    read: (keyof BankAllocation)[];
    onChange: (patch: Partial<BankAllocation>) => void;
  };
  /** The module's notes under the lines: a transfer's pair, a returned cheque. */
  afterLines?: React.ReactNode;
  lines: VoucherLine[];
  onLines: (lines: VoucherLine[]) => void;
  lineSide: Side;
  ledgerGroups: { heading: string; options: string[] }[];
  docs: OpenDocument[];
  applied?: BillReference[];
  checks: VoucherCheck[];
  attempted: boolean;
  readOnly: boolean;
  /** Said above the form while it is read-only: why, and how to change it. */
  lockedNote?: React.ReactNode;
  /** Anything the module adds above the sections — a match suggestion. */
  lead?: React.ReactNode;
  needsOpen: boolean;
  onNeedsOpen: (open: boolean) => void;
  onCreateLedger?: (query: string) => void;
};

const Row = ({
  id,
  label,
  optional,
  tone,
  wide,
  row,
  className,
  children,
}: {
  id?: string;
  /** A name Needs you can find the row by (`[data-row=…]`). */
  row?: string;
  label: string;
  optional?: boolean;
  tone?: "err" | "warn" | "muted";
  /** Across the card's three columns, as the journal's narration sits. */
  wide?: boolean;
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={cn("cr-row", className)}
    data-tone={tone ?? "muted"}
    data-row={row}
    style={wide ? { gridColumn: "1 / -1" } : undefined}
  >
    <label className="cr-row-label" htmlFor={id}>
      {label}
      {optional ? null : <i aria-hidden="true"> *</i>}
    </label>
    <div className="cr-row-value">
      <div className="jv-row-control">{children}</div>
    </div>
    <span className="cr-status" aria-hidden="true" />
  </div>
);

const VoucherForm = ({
  profile,
  company,
  header,
  onHeader,
  gstOptions,
  account,
  onAccount,
  allocation,
  afterLines,
  lines,
  onLines,
  lineSide,
  ledgerGroups,
  docs,
  applied,
  checks,
  attempted,
  readOnly,
  lockedNote,
  lead,
  needsOpen,
  onNeedsOpen,
  onCreateLedger,
}: Props) => {
  const [expanded, setExpanded] = useState(false);
  const total = r2(lines.reduce((s, l) => s + (l.amount || 0), 0));
  const diff = r2(account.amount - total);
  // What stops Approve, then what is only worth a look.
  const blocking = checks.filter((c) => c.level !== "check");
  const looks = checks.filter((c) => c.level === "check");

  const go = (check: VoucherCheck) => {
    onNeedsOpen(false);
    requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(
        `.vb-form ${check.target}`
      );
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
      (target?.matches("input, button")
        ? target
        : target?.querySelector<HTMLElement>("input, button")
      )?.focus({ preventScroll: true });
    });
  };

  const table = (inSheet: boolean) => (
    <VoucherLines
      profile={profile}
      company={company}
      lines={lines}
      total={account.amount}
      side={lineSide}
      groups={ledgerGroups}
      docs={docs}
      voucherDate={header.date}
      applied={applied}
      readOnly={readOnly}
      attempted={attempted}
      onChange={onLines}
      onCreateLedger={onCreateLedger}
      onExpand={inSheet ? undefined : () => setExpanded(true)}
    />
  );

  return (
    <div className="vb-form jv-form flex min-h-full min-w-0 flex-col gap-6 bg-pi-surface-panel px-6 pb-6 pt-5">
      {lockedNote ? (
        <p className="flex items-start gap-2 text-small text-pi-body">
          <Lock className="mt-0.5 h-4 w-4 flex-none text-pi-faint" />
          <span>{lockedNote}</span>
        </p>
      ) : null}
      {lead}

      <section>
        <div className="cr-section-label">
          <span className="cr-card-title text-lead font-semibold text-pi-ink">
            {profile.label} voucher
          </span>
          <RequiredNote />
        </div>
        <div className="cr-cards">
          <section className="cr-card" data-card="main" aria-label="Voucher">
            <div className="cr-card-body">
              <div className="cr-subhead cr-subhead--main">
                <span className="cr-card-title">Voucher</span>
              </div>
              <Row label={header.dateLabel} row="date">
                {onAccount && !readOnly ? (
                  <DateField
                    value={header.date}
                    onChange={(iso) => onAccount({ date: iso })}
                  />
                ) : (
                  <Input value={header.date ? fmt(header.date) : ""} disabled readOnly />
                )}
              </Row>
              <Row id="vb-voucher-no" label="Voucher no." optional>
                <Input
                  id="vb-voucher-no"
                  placeholder="Set by ERP's numbering"
                  value={header.voucherNo}
                  disabled={readOnly}
                  onChange={(e) => onHeader({ voucherNo: e.target.value })}
                />
              </Row>
              <Row label="GST registration" optional>
                <ComboBox
                  title="Select GST registration"
                  options={gstOptions}
                  selectedValue={header.gst}
                  onChange={(value) => onHeader({ gst: String(value) })}
                  hasSearch={false}
                  isMultiSelect={false}
                  disabled={readOnly}
                  hideClearButton
                />
              </Row>

              {profile.account ? (
                <>
                  {/* --main: the form only shows main subheads (priority form). */}
                  <div className="cr-subhead cr-subhead--main">
                    <span className="cr-card-title">Account</span>
                  </div>
                  {/* ERP's single-entry Payment: the bank or cash ledger at
                      the top, the amount it moved. Both come off the
                      statement, so both are locked. */}
                  <Row label="Account" row="account">
                    <Input value={account.name} disabled readOnly />
                  </Row>
                  <Row label={`Amount (${account.side})`}>
                    {onAccount && !readOnly ? (
                      <RupeeInput
                        aria-label="Amount"
                        value={account.amount}
                        hasError={attempted && !(account.amount > 0)}
                        onChange={(v) => onAccount({ amount: r2(v || 0) })}
                      />
                    ) : (
                      <div className="flex h-[38px] items-center justify-end rounded-sm border border-pi-line-2 bg-pi-page px-3 text-body">
                        <AmountText value={account.amount} />
                      </div>
                    )}
                  </Row>
                  {allocation ? (
                    <>
                      {/* ERP's Bank Allocations, as rows of the account. The
                          values are copied off the narration, so they carry
                          a caption rather than the AI mark. */}
                      <div className="cr-subhead cr-subhead--main" style={{ gridColumn: "1 / -1" }}>
                        <span className="cr-card-title">Bank allocation</span>
                        {allocation.read.length ? (
                          <span className="ml-2 text-caption font-normal text-pi-faint">
                            Read from the narration
                          </span>
                        ) : null}
                      </div>
                      <Row label="Transaction type">
                        <Select
                          value={allocation.value.type}
                          disabled={readOnly}
                          onValueChange={(type) => allocation.onChange({ type })}
                        >
                          <SelectTrigger className="h-[38px]" aria-label="Transaction type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BANK_TXN_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Row>
                      <Row
                        id="vb-instrument"
                        label={
                          allocation.value.type === "Cheque"
                            ? "Cheque no."
                            : "Instrument no. / UTR"
                        }
                        optional
                      >
                        <Input
                          id="vb-instrument"
                          value={allocation.value.instrumentNo}
                          placeholder="Not in the narration"
                          disabled={readOnly}
                          onChange={(e) =>
                            allocation.onChange({ instrumentNo: e.target.value })
                          }
                        />
                      </Row>
                      <Row label="Instrument date" optional>
                        <DateField
                          value={allocation.value.instrumentDate}
                          disabled={readOnly}
                          onChange={(iso) =>
                            allocation.onChange({ instrumentDate: iso })
                          }
                        />
                      </Row>
                      {profile.kind !== "contra" ? (
                        <Row id="vb-favouring" label="Favouring name" optional>
                          <Input
                            id="vb-favouring"
                            value={allocation.value.favouring}
                            placeholder={
                              profile.kind === "receipt"
                                ? "Who paid"
                                : "Who the money went to"
                            }
                            disabled={readOnly}
                            onChange={(e) =>
                              allocation.onChange({ favouring: e.target.value })
                            }
                          />
                        </Row>
                      ) : null}
                    </>
                  ) : null}
                </>
              ) : null}

              <Row
                id="vb-narration"
                label="Narration"
                optional
                wide
              >
                <Textarea
                  id="vb-narration"
                  placeholder="What this voucher is for, as it should read in the books"
                  value={header.narration}
                  disabled={readOnly}
                  onChange={(e) => onHeader({ narration: e.target.value })}
                  className="min-h-[72px]"
                />
              </Row>
            </div>
          </section>
        </div>
      </section>

      {table(false)}
      {afterLines}
      <TaxDeductions
        profile={profile}
        company={company}
        lines={lines}
        docs={docs}
        readOnly={readOnly}
        onLines={onLines}
      />

      {/* The totals card, as the bill's and the journal's: the account's
          figure, what the lines take, and the difference, brand while it
          is nil. Its count opens Needs you. */}
      <div className="vb-totals cr-totals jv-totals" role="group" aria-label="Totals">
        <span>
          <small>{account.name}</small>
          <b>{rupee(account.amount)} {account.side}</b>
        </span>
        <span>
          <small>{profile.linesTitle}</small>
          <b>{rupee(total)} {lineSide}</b>
        </span>
        <span data-tone={Math.abs(diff) < 0.005 ? "ok" : "err"}>
          <small>Difference</small>
          <b>{rupee(diff)}</b>
        </span>
      </div>
      {!readOnly ? (
        <button
          type="button"
          className={cn(
            "cr-balance -mt-3 self-start",
            blocking.length ? "warn" : "ok"
          )}
          onClick={() => onNeedsOpen(true)}
        >
          {blocking.length
            ? `${blocking.length} ${blocking.length === 1 ? "thing" : "things"} to resolve before approving`
            : "Ready to approve"}
          {looks.length
            ? ` · ${looks.length} worth a look`
            : ""}
          {checks.length ? (
            <ChevronRight className="ml-1 inline h-3 w-3" aria-hidden />
          ) : null}
        </button>
      ) : null}

      <Sheet
        open={needsOpen}
        onClose={() => onNeedsOpen(false)}
        title="Needs you"
        blurb="What is left to resolve"
      >
        {checks.length ? (
          [...blocking, ...looks].map((check) => (
            <div className="cr-need" key={check.key}>
              <span
                className="cr-dot"
                data-tone={
                  check.level === "check" ? "warn" : attempted ? "err" : "warn"
                }
                aria-hidden="true"
                title={check.level === "check" ? "Worth a look; doesn't stop Approve" : undefined}
              />
              <span>{check.label}</span>
              <small>{check.where}</small>
              <button
                type="button"
                className="cr-propose"
                onClick={() => go(check)}
              >
                Go to it
                <ChevronRight size={12} aria-hidden="true" />
              </button>
            </div>
          ))
        ) : (
          <p className="cr-empty-needs">Nothing left to resolve.</p>
        )}
      </Sheet>

      <Sheet
        open={expanded}
        onClose={() => setExpanded(false)}
        title={profile.linesTitle}
        blurb="Changes stay in your draft"
        doneLabel="Back to review"
        wide
      >
        {table(true)}
      </Sheet>
    </div>
  );
};

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default VoucherForm;
