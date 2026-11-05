import React from "react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RupeeInput from "@/components/common/rupee-input";
import {
  TDS_SECTIONS,
  type VoucherProfile,
} from "@/config/pages/inbox/voucher-profiles";
import {
  groupOf,
  isPartyLedger,
  r2,
  rupee,
  suggestTds,
} from "@/utils/pages/inbox/voucher";
import type { OpenDocument } from "@/types/pages/inbox/bank-automation";
import type { VoucherLine } from "@/types/pages/inbox/voucher";

/**
 * Tax & deductions on the voucher base — the bill's section of the same
 * name, here holding TDS (4 Nov 2026, phase 2).
 *
 * The Tally guide's rule: don't push the gross through the payment. The
 * bank moves the net; a Journal settles the TDS against the same bill. So a
 * party line carries the deduction, the section works it out (rate on the
 * bills' taxable value, or on the gross when there is no bill), and the
 * journal it will draft is spelt out before anyone approves.
 *
 * TDS is worked out by a fixed rule from the Act, so it carries no AI mark.
 */

type Props = {
  profile: VoucherProfile;
  company: string;
  lines: VoucherLine[];
  docs: OpenDocument[];
  readOnly: boolean;
  onLines: (lines: VoucherLine[]) => void;
};

const TaxDeductions = ({
  profile,
  company,
  lines,
  docs,
  readOnly,
  onLines,
}: Props) => {
  if (!profile.tds) return null;
  // TDS sits between a payer and a payee: a supplier you pay, a customer
  // who pays you. A supplier on a receipt (a returned cheque, a refund) is
  // neither, so it gets no TDS row.
  const receiptSide = profile.kind === "receipt";
  const parties = lines.filter(
    (l) =>
      l.ledger &&
      isPartyLedger(company, l.ledger) &&
      groupOf(company, l.ledger) ===
        (receiptSide ? "Sundry Debtors" : "Sundry Creditors") &&
      !l.refs?.some((r) => r.reopens)
  );
  if (!parties.length) return null;
  const receipt = profile.kind === "receipt";

  const set = (id: string, tds: VoucherLine["tds"]) =>
    onLines(lines.map((l) => (l.id === id ? { ...l, tds } : l)));

  const turnOn = (line: VoucherLine, sectionId: string) => {
    const s = TDS_SECTIONS.find((x) => x.id === sectionId) ?? TDS_SECTIONS[2];
    const sug = suggestTds(line, docs, s.rate);
    set(line.id, {
      section: s.section,
      rate: s.rate,
      base: sug.base,
      amount: sug.amount,
      ledger: profile.tds!.ledger,
      refId: sug.refId,
      refName: sug.refName,
    });
  };

  return (
    <section className="vb-tax" aria-label="Tax and deductions">
      <div className="cr-items-head">
        <h3>Tax &amp; deductions</h3>
      </div>
      <div className="rounded-md border border-pi-line bg-pi-surface-panel">
        {parties.map((line) => {
          const t = line.tds;
          const sectionId = t
            ? (TDS_SECTIONS.find(
                (s) => s.section === t.section && s.rate === t.rate
              )?.id ?? "")
            : "";
          const gross = t ? r2(line.amount + t.amount) : line.amount;
          return (
            <div
              key={line.id}
              data-line-tds={line.id}
              className="border-b border-pi-line px-4 py-3 last:border-b-0"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Switch
                  id={`tds-${line.id}`}
                  checked={!!t}
                  disabled={readOnly}
                  onCheckedChange={(on) =>
                    on ? turnOn(line, receipt ? "194C-2" : "194J") : set(line.id, null)
                  }
                />
                <label
                  htmlFor={`tds-${line.id}`}
                  className="text-small font-medium text-pi-ink"
                >
                  TDS {receipt ? "deducted by" : "deducted from"} {line.ledger}
                </label>
                {!t ? (
                  <span className="text-small text-pi-faint">
                    {receipt
                      ? "Turn on if the customer paid you less tax deducted at source."
                      : "Turn on if you held back tax from this payment."}
                  </span>
                ) : null}
              </div>
              {t ? (
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-caption font-medium text-pi-body">
                      Section
                    </span>
                    <Select
                      value={sectionId}
                      disabled={readOnly}
                      onValueChange={(id) => turnOn(line, id)}
                    >
                      <SelectTrigger className="h-[38px]" aria-label="TDS section">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {TDS_SECTIONS.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-caption font-medium text-pi-body">
                      On {t.refName ? `${t.refName}'s taxable value` : "the gross"}
                    </span>
                    <div className="flex h-[38px] items-center justify-end rounded-sm border border-pi-line-2 bg-pi-page px-3 text-body tabular-nums text-pi-body">
                      {rupee(t.base)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-caption font-medium text-pi-body">
                      TDS amount
                    </span>
                    <RupeeInput
                      aria-label="TDS amount"
                      value={t.amount}
                      disabled={readOnly}
                      hasError={!(t.amount > 0)}
                      onChange={(v) => set(line.id, { ...t, amount: r2(v || 0) })}
                    />
                  </div>
                  <p className="text-small text-pi-body md:col-span-3">
                    {t.refName ? `${t.refName} is settled at ${rupee(gross)}: ` : `${line.ledger} is settled at ${rupee(gross)}: `}
                    {rupee(line.amount)} {receipt ? "received" : "paid"} through the bank and{" "}
                    {rupee(t.amount)} TDS. Approving drafts a Journal in Journals ›
                    Needs Review —{" "}
                    <b className="font-medium text-pi-ink">
                      {profile.tds!.journal.replace("{party}", line.ledger)} ·{" "}
                      {rupee(t.amount)}
                    </b>
                    {t.refName ? `, against ${t.refName}` : ""}. Rates and limits
                    change; confirm the section with your CA.
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TaxDeductions;
