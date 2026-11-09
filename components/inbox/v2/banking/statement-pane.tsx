import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { BankTransaction } from "@/types/pages/inbox/banking";
import { day } from "./table-parts";

/**
 * The bank voucher's source, where a bill's PDF sits on the Purchases
 * review (4 Nov 2026): the statement page the line was read from, on the
 * same white paper in the same viewer frame (`Preview`'s `.source-stage`
 * card), with this line boxed in the brand as the field highlighter boxes
 * a bill's value. The lines either side are there because an accountant
 * reads a bank line against its neighbours — the charge after a transfer,
 * the second half of a split payment.
 */

type Props = {
  txn: BankTransaction;
  /** Every line in this account, any order. */
  lines: BankTransaction[];
  /** How many lines either side of this one to print. */
  around?: number;
};

const money = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const StatementPane = ({ txn, lines, around = 7 }: Props) => {
  const ordered = [...lines].sort(
    (a, b) =>
      a.transactionDate.localeCompare(b.transactionDate) ||
      a.bankLineId - b.bankLineId
  );
  const at = ordered.findIndex((l) => l.bankLineUuid === txn.bankLineUuid);
  const from = Math.max(0, at - around);
  const page = ordered.slice(from, at + around + 1);
  const first = page[0]?.transactionDate ?? txn.transactionDate;
  const last = page[page.length - 1]?.transactionDate ?? txn.transactionDate;
  const mark = useRef<HTMLTableRowElement>(null);

  // The line in view on every open, as the highlighter brings a field in.
  useEffect(() => {
    mark.current?.scrollIntoView({ block: "center" });
  }, [txn.bankLineUuid]);

  return (
    <div data-source-viewer="" className="flex h-full min-h-0 flex-col bg-pi-page p-5">
      <div className="source-stage flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-pi-line">
        <header className="flex shrink-0 items-center gap-3 px-4 py-3">
          <h2
            className="min-w-0 truncate text-overline font-semibold uppercase leading-4 text-pi-body"
            title={txn.bankAccountName}
          >
            Statement · {txn.bankAccountName}
          </h2>
        </header>
        <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
          {/* The page itself: printed, not interface — small print is the
              content here, as on the bill PDFs. */}
          <article className="mx-auto max-w-[640px] rounded-sm bg-white px-6 py-5 shadow-[0_1px_3px_rgb(var(--shadow-rgb)_/_0.12)]">
            <div className="flex items-start justify-between gap-4 border-b border-pi-line pb-3">
              <div>
                <p className="text-body font-semibold text-pi-ink">
                  {txn.bankName || txn.bankAccountName}
                </p>
                <p className="text-caption text-pi-body">
                  Account statement · {txn.bankAccountName}
                </p>
              </div>
              <p className="text-right text-caption text-pi-body">
                {day(first)} – {day(last)}
              </p>
            </div>
            <table className="mt-2 w-full table-fixed border-collapse text-caption">
              <thead>
                <tr className="text-left text-pi-faint">
                  <th className="w-[76px] py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Narration</th>
                  <th className="w-[92px] py-2 text-right font-medium">Debit</th>
                  <th className="w-[92px] py-2 text-right font-medium">Credit</th>
                </tr>
              </thead>
              <tbody>
                {page.map((l) => {
                  const here = l.bankLineUuid === txn.bankLineUuid;
                  const amount = money(Number(l.transactionAmountLc));
                  return (
                    <tr
                      key={l.bankLineUuid}
                      ref={here ? mark : undefined}
                      aria-current={here ? "true" : undefined}
                      className={cn(
                        "border-t border-pi-line align-top",
                        here
                          ? "relative bg-pi-brand-tint text-pi-ink outline outline-2 -outline-offset-1 outline-pi-brand"
                          : "text-pi-body opacity-70"
                      )}
                    >
                      <td className="py-2 pl-1 tabular-nums">
                        {day(l.transactionDate)}
                      </td>
                      <td className="break-words py-2 pr-2">
                        {l.description}
                        {here ? (
                          <span className="ml-2 inline-block rounded-xs bg-pi-brand px-1.5 text-overline font-semibold uppercase leading-4 text-white">
                            This line
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {l.crDr === "debit" ? amount : ""}
                      </td>
                      <td className="py-2 pr-1 text-right tabular-nums">
                        {l.crDr === "credit" ? amount : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-4 border-t border-pi-line pt-3 text-caption text-pi-faint">
              Read from the uploaded statement. {page.length} of{" "}
              {ordered.length} lines shown.
            </p>
          </article>
        </div>
      </div>
    </div>
  );
};

export default StatementPane;

/**
 * A cash voucher's source (4 Nov 2026, phase 2): there is no statement
 * behind cash, so the left pane says so — and, for a voucher raised from an
 * Inbox receipt, names the document and opens it.
 */
export const CashSourcePane = ({
  txn,
  onOpenSource,
}: {
  txn: BankTransaction;
  onOpenSource: (itemId: string) => void;
}) => (
  <div data-source-viewer="" className="flex h-full min-h-0 flex-col bg-pi-page p-5">
    <div className="source-stage flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-pi-line">
      <header className="flex shrink-0 items-center gap-3 px-4 py-3">
        <h2 className="min-w-0 truncate text-overline font-semibold uppercase leading-4 text-pi-body">
          Cash book · {txn.bankAccountName}
        </h2>
      </header>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-lead font-semibold text-pi-ink">
          {txn.source ? "Raised from a receipt" : "Entered by hand"}
        </p>
        <p className="max-w-[40ch] text-small text-pi-body">
          {txn.source
            ? `Cash has no statement. This voucher was raised from ${txn.source.fileName} in the Inbox.`
            : "Cash has no statement to read from, so the date, amount and narration are typed. Keep the receipt with the voucher."}
        </p>
        {txn.source ? (
          <button
            type="button"
            className="text-small font-medium text-pi-brand underline-offset-2 hover:underline"
            onClick={() => onOpenSource(txn.source!.itemId)}
          >
            Open the receipt
          </button>
        ) : null}
      </div>
    </div>
  </div>
);
