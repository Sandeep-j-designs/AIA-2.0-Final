import React from "react";
import { Paperclip } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { InboxPaymentStatus } from "@/types/pages/inbox";
import { actor, type Item, type Route } from "./store";
import { AmountText } from "./ui";

/*
  The voucher columns the Figma library's registers can show beyond their
  defaults ("AIA - Component Library" › Table: Sales 603:3440, Purchases
  603:4007). They start hidden and are switched on from the Columns menu
  (28 Oct 2026). Shared by Purchases, Sales and Journals so one column reads
  the same in all three.

  Left out: Billing Address, GST treatment, GSTIN, Source / Destination of
  supply and RCM Applied — the voucher records hold nothing to fill them with.
*/

export type VoucherColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
  cell: (item: Item) => React.ReactNode;
  sort?: (item: Item) => string | number;
};

export const day = (value?: string) =>
  value && !Number.isNaN(Date.parse(value))
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const text = (value: string | undefined, ink = "text-pi-body") => (
  <span className={cn("block truncate", ink)} title={value || undefined}>
    {value || "—"}
  </span>
);

/** The voucher's own lines, before tax. */
export const taxableOf = (item: Item) =>
  item.route === "JV"
    ? item.amount
    : item.form.lines.reduce((sum, line) => sum + line.amount, 0);
export const taxOf = (item: Item) =>
  item.route === "JV" ? 0 : Math.max(0, item.amount - taxableOf(item));

/** "CGST + SGST" inside the state, "IGST" outside it. */
const taxLedgerOf = (item: Item) => {
  const taxes = (
    item.original as { bill?: { taxes?: Record<string, number> } }
  ).bill?.taxes;
  const heads = Object.entries(taxes ?? {})
    .filter(([, value]) => value)
    .map(([head]) => head.toUpperCase());
  return heads.join(" + ");
};

export const PAYMENT: Record<
  InboxPaymentStatus,
  { label: string; dot: string }
> = {
  unpaid: { label: "Unpaid", dot: "bg-pi-danger-dot" },
  partiallyPaid: { label: "Partially Paid", dot: "bg-pi-warning-dot" },
  paid: {
    label: "Paid",
    dot: "bg-pi-success-dot shadow-[0_0_0_2px_var(--pi-success-bg)]",
  },
};
export const paymentOf = (item: Item): InboxPaymentStatus =>
  item.original.paymentStatus ?? "unpaid";
export const attachmentsOf = (item: Item) =>
  item.original.attachmentCount ?? 1;

/** Dot + label, as every register's status cells read (28 Oct 2026). */
export const PaymentCell = ({ item }: { item: Item }) => {
  const state = PAYMENT[paymentOf(item)] ?? PAYMENT.unpaid;
  return (
    <span
      title={state.label}
      className="-ml-2 inline-flex max-w-full items-center gap-2 rounded-xs px-2 py-1 text-small leading-4 text-pi-body"
    >
      <span
        aria-hidden
        className={cn("size-[7px] flex-none rounded-full", state.dot)}
      />
      <span className="min-w-0 truncate">{state.label}</span>
    </span>
  );
};

export const AttachmentsCell = ({ item }: { item: Item }) => (
  <span className="inline-flex items-center gap-1 text-pi-body">
    <Paperclip className="h-3.5 w-3.5 text-pi-faint" aria-hidden />
    <span className="tabular-nums">{attachmentsOf(item)}</span>
  </span>
);

/**
 * The hidden-by-default columns for one register, in Figma's order. Keys
 * already used by a register's default set are not repeated here.
 */
export const voucherExtraColumns = (route: Route): VoucherColumn[] => {
  const sales = route === "AR";
  const journal = route === "JV";
  const firstLedger = (item: Item) =>
    item.form.lines.find((line) => line.ledger)?.ledger;
  const costCentre = (item: Item) =>
    item.form.costCentre ||
    item.form.costClass ||
    item.form.lines.find((line) => line.costCentre)?.costCentre;
  return [
    {
      key: "gst",
      label: "My GST Registration",
      cell: (item) => text(item.form.gst),
      sort: (item) => item.form.gst,
    },
    ...(journal
      ? []
      : ([
          {
            key: "type",
            label: "Type",
            cell: (item) => text(item.form.voucherType),
            sort: (item) => item.form.voucherType,
          },
          {
            key: "invoiceNo",
            label: sales ? "Invoice No." : "Bill No.",
            cell: (item) => text(item.form.invoiceNo),
            sort: (item) => item.form.invoiceNo,
          },
          {
            key: "docDate",
            label: sales ? "Invoice Date" : "Bill Date",
            cell: (item) => (
              <span className="whitespace-nowrap tabular-nums text-pi-body">
                {day(item.form.date)}
              </span>
            ),
            sort: (item) => item.form.date,
          },
          {
            key: "due",
            label: "Due Date",
            cell: (item) => (
              <span className="whitespace-nowrap tabular-nums text-pi-body">
                {day(item.form.due)}
              </span>
            ),
            sort: (item) => item.form.due,
          },
        ] as VoucherColumn[])),
    {
      key: "ledger",
      label: "Ledger",
      cell: (item) => text(firstLedger(item)),
      sort: (item) => firstLedger(item) || "",
    },
    ...(journal
      ? []
      : ([
          {
            key: "taxLedger",
            label: "Tax Ledger",
            cell: (item) => text(taxLedgerOf(item)),
          },
        ] as VoucherColumn[])),
    {
      key: "costCentre",
      label: "Cost Centre",
      cell: (item) => text(costCentre(item)),
      sort: (item) => costCentre(item) || "",
    },
    ...(journal
      ? []
      : ([
          {
            key: "narration",
            label: "Narration",
            cell: (item) => text(item.form.narration),
          },
          {
            key: "taxable",
            label: "Taxable Amount",
            align: "right",
            cell: (item) => (
              <span className="block truncate text-right tabular-nums">
                <AmountText value={taxableOf(item)} />
              </span>
            ),
            sort: taxableOf,
          },
          {
            key: "tax",
            label: "Tax Amount",
            align: "right",
            cell: (item) => (
              <span className="block truncate text-right tabular-nums">
                <AmountText value={taxOf(item)} />
              </span>
            ),
            sort: taxOf,
          },
        ] as VoucherColumn[])),
    ...(journal
      ? []
      : ([
          {
            key: "createdBy",
            label: "Created By",
            cell: (item) => text(item.sender || actor),
            sort: (item) => item.sender || actor,
          },
        ] as VoucherColumn[])),
    {
      key: "createdAt",
      label: "Created At",
      cell: (item) => (
        <span className="whitespace-nowrap tabular-nums text-pi-body">
          {day(item.received)}
        </span>
      ),
      sort: (item) => item.received,
    },
    ...(journal
      ? []
      : ([
          {
            key: "documentStatus",
            label: sales ? "Document Status" : "Payment Status",
            cell: (item) => <PaymentCell item={item} />,
            sort: paymentOf,
          },
          {
            key: "attachments",
            label: "Attachments",
            cell: (item) => <AttachmentsCell item={item} />,
            sort: attachmentsOf,
          },
        ] as VoucherColumn[])),
  ];
};
