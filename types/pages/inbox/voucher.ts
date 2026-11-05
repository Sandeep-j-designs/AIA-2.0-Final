import type { CostAllocation } from "@/config/pages/inbox/mock-cost-centres";

/**
 * The voucher base (4 Nov 2026): one shape for every voucher the prototype
 * raises, whatever book it sits in. Purchase, Sales, Payment, Receipt,
 * Contra and Journal are the same object — a header, the lines it posts and
 * the references those lines settle — and differ only in which parts a
 * profile switches on (config/pages/inbox/voucher-profiles.ts).
 *
 * Banking is the first module on it. The AP and AR engines keep their own
 * models for now and carry the same parts under their own names (their
 * bill allocation is BillReference here, line for line).
 *
 * camelCase, as the API sends it.
 */

/** ERP's voucher types, as the profiles key them. */
export type VoucherKind =
  | "purchase"
  | "sales"
  | "payment"
  | "receipt"
  | "contra"
  | "journal";

export type Side = "Dr" | "Cr";

/**
 * ERP's four types of reference — the AP engine's BR_TYPES, same ids.
 *   new      a fresh open item the party will settle later
 *   agst     settles a reference the party already holds
 *   advance  money before the bill (or the invoice) exists
 *   onacct   linked to nothing; outstanding reports can't age it
 */
export type ReferenceType = "new" | "agst" | "advance" | "onacct";

/** One row of a line's bill-wise allocation. */
export type BillReference = {
  id: string;
  type: ReferenceType;
  /** The pending reference an `agst` row settles. */
  refId: string;
  /** The name a `new` or `advance` row creates. */
  name: string;
  /** Only a new reference ages, so only it carries a due date. */
  dueDate: string;
  amount: number;
  side: Side;
  /**
   * Undoes an earlier settlement rather than making one: a returned cheque
   * puts the bill it paid back to owing (4 Nov 2026, phase 2).
   */
  reopens?: boolean;
};

/** A reference the party already holds, as the open-items list returns it. */
export type PendingReference = {
  id: string;
  party: string;
  name: string;
  /** What raised it. */
  kind: "bill" | "invoice" | "advance" | "onacct";
  date: string;
  dueDate: string;
  /** Left to settle. */
  pending: number;
  /** The side it leans: a bill is Cr to the vendor, an invoice Dr to the customer. */
  side: Side;
};

/** One posting line under the voucher's account. */
export type VoucherLine = {
  id: string;
  ledger: string;
  amount: number;
  narration: string;
  costCentre: string;
  costAllocation?: CostAllocation | null;
  /** Bill-wise allocation, on a party line only. */
  refs?: BillReference[];
  /**
   * TDS deducted on this party line (phase 2). The bank moves the net; a
   * companion Journal (Dr party · Cr TDS Payable, or Dr TDS Receivable · Cr
   * party on a receipt) settles the rest of the bill — the Tally guide's
   * Journal + Payment.
   */
  tds?: LineTds | null;
};

export type LineTds = {
  section: string;
  rate: number;
  /** What the rate is applied to: the bills' taxable value, or the gross. */
  base: number;
  amount: number;
  ledger: string;
  /** The bill the TDS is set against; the line's first Against Reference. */
  refId: string;
  refName: string;
};

/** How the money moved, as ERP's Bank Allocations screen asks it. */
export type BankAllocation = {
  type: string;
  instrumentNo: string;
  instrumentDate: string;
  favouring: string;
};

/** A voucher the bank line drafted in another book. */
export type CompanionDraft = {
  kind: "journal" | "purchase";
  itemId: string;
  label: string;
};

/** A failed check, for the dots on the form and the Needs you list. */
export type VoucherCheck = {
  key: string;
  label: string;
  /** A selector inside the form for the way to it. */
  target: string;
  /** Where it is: "Voucher", "Particulars"… */
  where: string;
  /**
   * "check" is worth a look but doesn't stop Approve (a possible duplicate);
   * absent means it has to be resolved.
   */
  level?: "check";
};
