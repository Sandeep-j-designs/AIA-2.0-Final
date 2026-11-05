import type { Side, VoucherKind } from "@/types/pages/inbox/voucher";

/**
 * The voucher base, per voucher type (4 Nov 2026).
 *
 * Every voucher reads in one order — Voucher, Account, Lines, References,
 * Tax & deductions, More details, Totals, Needs you — and a profile only
 * switches parts on or off and names them. The same row in this table is
 * the same thing on every form, which is the point: an accountant who has
 * learnt the Payment voucher has learnt the Receipt and the Contra.
 *
 *              Account (top)   Lines                References        Tax
 *   Purchase   —               items + ledgers      New Ref           input GST, RCM, TDS payable
 *   Sales      —               items + ledgers      New Ref           output GST, TDS receivable
 *   Payment    bank / cash     particulars (Dr)     all four types    TDS (phase 2)
 *   Receipt    bank / cash     particulars (Cr)     all four types    TDS by the customer (phase 2)
 *   Contra     bank / cash     bank / cash only     —                 —
 *   Journal    —               Dr / Cr              Agst Ref          TDS
 *
 * Banking (Payment, Receipt, Contra) renders from this today. Purchase and
 * Sales are drawn by the AP/AR engines, which carry the same sections under
 * their own markup; their rows here document the contract the engines
 * follow (phase 4) rather than drive them.
 */

export type VoucherProfile = {
  kind: VoucherKind;
  label: string;
  /**
   * The bank or cash ledger at the top, as ERP's single-entry Payment
   * shows it. Locked to the statement the line came from.
   */
  account: boolean;
  /** The side the lines post to; the account takes the other. */
  lineSide: Side | "both";
  /** What the lines are called on the form. */
  linesTitle: string;
  /** Ledger groups the lines may use; empty means any. */
  lineGroups: string[];
  /** Whether a party line opens bill-wise allocation. */
  references: boolean;
  /** Reference types offered, in ERP's order. */
  referenceTypes: ("new" | "agst" | "advance" | "onacct")[];
  /** The open items a party line settles: bills for a payment, invoices for a receipt. */
  settles?: "bill" | "invoice";
  /** Book name for the "Post as" control and the trail. */
  book: string;
  /** ERP's Bank Allocations under the account (bank ledgers only). */
  bankAllocation?: boolean;
  /** TDS on a party line, and the ledger it posts to. */
  tds?: { ledger: string; journal: string };
};

export const BANK_ACCOUNT_GROUPS = [
  "Bank Accounts",
  "Bank OD A/c",
  "Cash-in-Hand",
];

/** Groups whose ledgers keep balances bill by bill. */
export const PARTY_GROUPS = ["Sundry Creditors", "Sundry Debtors"];

/** Groups whose ledgers take cost centres (ERP's default). */
export const COST_CENTRE_GROUPS = [
  "Direct Expenses",
  "Indirect Expenses",
  "Direct Incomes",
  "Indirect Incomes",
  "Purchase Accounts",
  "Sales Accounts",
];

const ALL_REFS: VoucherProfile["referenceTypes"] = [
  "agst",
  "new",
  "advance",
  "onacct",
];

export const VOUCHER_PROFILES: Record<VoucherKind, VoucherProfile> = {
  purchase: {
    kind: "purchase",
    label: "Purchase",
    account: false,
    lineSide: "Dr",
    linesTitle: "Items",
    lineGroups: [],
    references: true,
    referenceTypes: ["new", "agst", "advance", "onacct"],
    book: "Purchases",
  },
  sales: {
    kind: "sales",
    label: "Sales",
    account: false,
    lineSide: "Cr",
    linesTitle: "Items",
    lineGroups: [],
    references: true,
    referenceTypes: ["new", "agst", "advance", "onacct"],
    book: "Sales",
  },
  payment: {
    kind: "payment",
    label: "Payment",
    account: true,
    lineSide: "Dr",
    linesTitle: "Particulars",
    lineGroups: [],
    references: true,
    referenceTypes: ALL_REFS,
    settles: "bill",
    book: "Banking",
    bankAllocation: true,
    tds: {
      ledger: "TDS Payable",
      journal: "Dr {party} · Cr TDS Payable",
    },
  },
  receipt: {
    kind: "receipt",
    label: "Receipt",
    account: true,
    lineSide: "Cr",
    linesTitle: "Particulars",
    lineGroups: [],
    references: true,
    referenceTypes: ALL_REFS,
    settles: "invoice",
    book: "Banking",
    bankAllocation: true,
    tds: {
      ledger: "TDS Receivable",
      journal: "Dr TDS Receivable · Cr {party}",
    },
  },
  contra: {
    kind: "contra",
    label: "Contra",
    account: true,
    // Money out of this account is Dr to where it went; money in, Cr to
    // where it came from. Set per line from the statement's side.
    lineSide: "both",
    linesTitle: "Transfer to",
    lineGroups: BANK_ACCOUNT_GROUPS,
    references: false,
    referenceTypes: [],
    book: "Banking",
    bankAllocation: true,
  },
  journal: {
    kind: "journal",
    label: "Journal",
    account: false,
    lineSide: "both",
    linesTitle: "Journal entries",
    lineGroups: [],
    references: true,
    referenceTypes: ["agst", "new", "advance", "onacct"],
    book: "Journals",
  },
};

/**
 * The side a bank voucher's lines post to, from the statement: money out
 * debits where it went, money in credits where it came from. The bank
 * account takes the other side.
 */
export const lineSideFor = (crDr: "debit" | "credit"): Side =>
  crDr === "debit" ? "Dr" : "Cr";

export const REFERENCE_TYPE_NAME: Record<
  VoucherProfile["referenceTypes"][number],
  string
> = {
  new: "New Reference",
  agst: "Against Reference",
  advance: "Advance",
  onacct: "On Account",
};

/* ------------------------------------------------------ phase 2 settings */

/**
 * TDS sections a payment can deduct under, with the rate the payer applies
 * (the deductee's PAN status and thresholds are the accountant's call; the
 * form says so). Rates change — the guide says to confirm with your CA.
 */
export const TDS_SECTIONS = [
  { id: "194C-1", section: "194C", label: "194C · Contractor (individual/HUF) 1%", rate: 0.01 },
  { id: "194C-2", section: "194C", label: "194C · Contractor (others) 2%", rate: 0.02 },
  { id: "194J", section: "194J", label: "194J · Professional / technical fees 10%", rate: 0.1 },
  { id: "194I", section: "194I", label: "194I · Rent of building 10%", rate: 0.1 },
  { id: "194H", section: "194H", label: "194H · Commission 5%", rate: 0.05 },
  { id: "194Q", section: "194Q", label: "194Q · Purchase of goods 0.1%", rate: 0.001 },
];

/** ERP's Bank Allocations transaction types. */
export const BANK_TXN_TYPES = [
  "Cheque",
  "e-Fund Transfer",
  "UPI",
  "ECS",
  "Card",
  "ATM",
  "Others",
];

/** Books begin on this date (ERP's "Books beginning from"). */
export const BOOKS_FROM = "2026-04-01";

/**
 * Expense ledgers where a payment straight to the expense loses no input
 * credit: salary and interest carry no GST; electricity and fuel sit outside
 * GST; staff welfare (food) is blocked credit under 17(5); bank charges are
 * claimed off the bank's monthly GST invoice, not line by line.
 */
export const NO_GST_LEDGERS = [
  "Salary",
  "Bank Charges",
  "Staff Welfare",
  "Electricity Charges",
  "Fuel Expenses",
  "Power & Fuel",
  "Interest on Credit Card",
  "Interest Received",
];

/**
 * The cash book's opening balance per company, as ERP holds it on the
 * first day the prototype's vouchers cover.
 * DEV: GET /api/accounts/<cash ledger>/closing-balance?asOn=…
 */
export const CASH_OPENING: Record<string, { amount: number; asOf: string }> = {
  shakun: { amount: 2000, asOf: "2026-09-01" },
  acme: { amount: 15000, asOf: "2026-09-01" },
};
