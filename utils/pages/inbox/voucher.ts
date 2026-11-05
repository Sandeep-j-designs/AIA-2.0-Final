import {
  COST_CENTRE_GROUPS,
  PARTY_GROUPS,
  VOUCHER_PROFILES,
  lineSideFor,
} from "@/config/pages/inbox/voucher-profiles";
import { ledgerGroupsOf } from "@/config/pages/inbox/mock-banking";
import type { BankTransaction } from "@/types/pages/inbox/banking";
import type { OpenDocument } from "@/types/pages/inbox/bank-automation";
import type {
  BankAllocation,
  BillReference,
  PendingReference,
  Side,
  VoucherCheck,
  VoucherKind,
  VoucherLine,
} from "@/types/pages/inbox/voucher";

/**
 * The voucher base's rules, kept pure so every form (and Neo, and the
 * tests) reads them the same way. The AP engine's bill allocation is the
 * source for the reference rules; its comments are kept where the rule is.
 */

let seq = 0;
export const vid = (prefix = "vl") =>
  `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const r2 = (n: number) => Math.round(n * 100) / 100;

export const blankLine = (amount = 0): VoucherLine => ({
  id: vid(),
  ledger: "",
  amount,
  narration: "",
  costCentre: "",
  costAllocation: null,
});

/* ------------------------------------------------------------- ledgers */

/** The ERP group a ledger sits under, for this company. */
export const groupOf = (company: string, ledger: string) =>
  ledgerGroupsOf(company).find((g) => g.options.includes(ledger))?.heading ??
  "";

/**
 * Bill-wise is a property of the ledger. Sundry creditors and debtors keep
 * their balances bill by bill; nothing else does.
 */
export const isPartyLedger = (company: string, ledger: string) =>
  PARTY_GROUPS.includes(groupOf(company, ledger));

export const takesCostCentre = (company: string, ledger: string) =>
  COST_CENTRE_GROUPS.includes(groupOf(company, ledger));

/* ----------------------------------------------------------- bank lines */

/** The voucher kind a bank line posts as, if it has one. */
export const kindOf = (txn: BankTransaction): VoucherKind | null =>
  txn.paymentType;

/**
 * A bank line's posting lines. A line coded in the table or by a rule has
 * a ledger and no lines yet: it is one line for the whole amount, carrying
 * the references a match left on it.
 */
export const bankLinesOf = (
  txn: BankTransaction,
  docs: OpenDocument[] = []
): VoucherLine[] => {
  if (txn.lines?.length) return txn.lines;
  const amount = Number(txn.transactionAmountLc);
  const side = lineSideFor(txn.crDr);
  const refs: BillReference[] | undefined = txn.matchedDocuments?.length
    ? txn.matchedDocuments.map((number) => {
        const doc = docs.find((d) => d.number === number);
        return {
          id: vid("br"),
          type: "agst" as const,
          refId: doc?.id ?? "",
          name: number,
          dueDate: "",
          amount: 0,
          side,
        };
      })
    : undefined;
  // A single match settles the whole line against it.
  if (refs?.length === 1) refs[0].amount = amount;
  return [
    {
      id: `${txn.bankLineUuid}-1`,
      ledger: txn.ledgersNameList[0] ?? "",
      amount,
      narration: "",
      costCentre: "",
      costAllocation: null,
      refs,
    },
  ];
};

/** What the table and the sync read off the lines. */
export const ledgerListOf = (lines: VoucherLine[]) =>
  lines.map((l) => l.ledger).filter(Boolean);

/* ----------------------------------------------------------- references */

/**
 * The open items a party holds, as references. A bill leans Cr (the book
 * owes the vendor), an invoice Dr (the customer owes the book).
 */
export const pendingFor = (
  party: string,
  docs: OpenDocument[]
): PendingReference[] =>
  docs
    .filter((d) => d.party === party && d.outstanding > 0.004)
    .map((d) => ({
      id: d.id,
      party: d.party,
      name: d.number,
      kind: d.kind,
      date: d.date,
      dueDate: "",
      pending: d.outstanding,
      side: d.kind === "bill" ? ("Cr" as const) : ("Dr" as const),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

/**
 * The open items as this voucher found them. Once a voucher is approved
 * the bills it settled show less outstanding, so reopening it would find
 * its own references gone; `applied` (its saved references) are added back.
 */
export const pendingBefore = (
  party: string,
  docs: OpenDocument[],
  applied: BillReference[] = [],
  /** Bills a row reopens: listed even when nothing is left on them. */
  keep: string[] = []
): PendingReference[] => {
  const back = new Map<string, number>();
  applied
    .filter((r) => r.type === "agst" && r.refId)
    .forEach((r) =>
      back.set(
        r.refId,
        (back.get(r.refId) ?? 0) + (r.reopens ? -r.amount : r.amount)
      )
    );
  const adjusted = docs.map((d) =>
    back.has(d.id)
      ? { ...d, outstanding: r2(d.outstanding + (back.get(d.id) ?? 0)) }
      : d
  );
  const open = pendingFor(party, adjusted);
  const kept = adjusted
    .filter(
      (d) =>
        d.party === party &&
        keep.includes(d.id) &&
        !open.some((p) => p.id === d.id)
    )
    .map((d) => ({
      id: d.id,
      party: d.party,
      name: d.number,
      kind: d.kind,
      date: d.date,
      dueDate: "",
      pending: d.outstanding,
      side: d.kind === "bill" ? ("Cr" as const) : ("Dr" as const),
    }));
  return [...open, ...kept];
};

/** A reference row's amount, signed onto the line's own side. */
const signed = (r: BillReference, target: Side) =>
  r.side === target ? r2(r.amount) : -r2(r.amount);

export const allocated = (refs: BillReference[], target: Side) =>
  r2(refs.reduce((s, r) => s + signed(r, target), 0));

export const unallocated = (
  amount: number,
  refs: BillReference[],
  target: Side
) => r2(amount - allocated(refs, target));

const dayMonth = (iso: string) =>
  iso ? `${iso.slice(8, 10)}${iso.slice(5, 7)}` : "";
const initials = (party: string) =>
  party
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join("");

/** "ADV/0906/VPP" — what a payment ahead of the bill is named by default. */
export const advanceName = (party: string, date: string) =>
  `ADV/${dayMonth(date)}/${initials(party) || "PTY"}`;

/**
 * The opening answer, as the AP engine's brSeed gives it: ERP opens the
 * screen empty and makes you remember what the party is holding; the book
 * already knows. So the items the line settles are laid out first, oldest
 * first, and whatever is left becomes an Advance — on a payment, money
 * beyond the bills is money ahead of the next one. Returns the rows and
 * the note that says what was set.
 */
export const seedReferences = (
  party: string,
  amount: number,
  side: Side,
  pending: PendingReference[],
  date: string
): { refs: BillReference[]; note: string } => {
  const refs: BillReference[] = [];
  let left = r2(amount);
  pending
    .filter((p) => p.side !== side && p.pending > 0.004)
    .forEach((p) => {
      if (left <= 0.004) return;
      const amt = r2(Math.min(p.pending, left));
      refs.push({
        id: vid("br"),
        type: "agst",
        refId: p.id,
        name: p.name,
        dueDate: p.dueDate,
        amount: amt,
        side,
      });
      left = r2(left - amt);
    });
  if (left > 0.004 || !refs.length)
    refs.push({
      id: vid("br"),
      type: "advance",
      refId: "",
      name: advanceName(party, date),
      dueDate: "",
      amount: Math.max(left, 0),
      side,
    });
  const used = refs.filter((r) => r.type === "agst");
  const note = used.length
    ? `${party} is holding ${
        used.length === 1
          ? "a pending reference"
          : `${used.length} pending references`
      } — ${used
        .map((r) => {
          const p = pending.find((x) => x.id === r.refId);
          return p ? `${p.name} (${rupee(p.pending)} ${p.side})` : r.name;
        })
        .join(", ")}. ${
        used.length === 1 ? "It has" : "They have"
      } been set against this ${side === "Dr" ? "payment" : "receipt"}. Change the amounts or remove the ${
        used.length === 1 ? "row" : "rows"
      } if that is not what it settles.`
    : "";
  return { refs, note };
};

export const rupee = (n: number) =>
  `₹${Math.abs(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Every way a reference row can be wrong, per field (the engine's brFaults). */
export const referenceFaults = (
  refs: BillReference[],
  pending: PendingReference[],
  voucherDate: string
) => {
  const out: { id: string; f: "ref" | "due" | "amount"; msg: string }[] = [];
  const seen = new Set<string>();
  const held = new Set(pending.map((p) => p.name.trim().toLowerCase()));
  refs.forEach((r) => {
    const amt = r2(r.amount);
    if (r.type === "agst") {
      if (!r.refId)
        out.push({ id: r.id, f: "ref", msg: "Pick the reference this settles." });
      else {
        const hit = pending.find((p) => p.id === r.refId);
        // ERP's one refusal on this type: a reference cannot give up more
        // than it is holding, and the excess has nowhere to go.
        if (!r.reopens && hit && amt > r2(hit.pending) + 0.004)
          out.push({
            id: r.id,
            f: "amount",
            msg: `${hit.name} has only ${rupee(hit.pending)} left to settle.`,
          });
      }
    } else if (r.type !== "onacct") {
      const nm = r.name.trim();
      const key = nm.toLowerCase();
      if (!nm) out.push({ id: r.id, f: "ref", msg: "A reference needs a name." });
      else if (seen.has(key))
        out.push({ id: r.id, f: "ref", msg: `This voucher names “${nm}” twice.` });
      else if (held.has(key))
        out.push({
          id: r.id,
          f: "ref",
          msg: `“${nm}” is already pending against this party.`,
        });
      else seen.add(key);
    }
    if (r.type === "new") {
      if (!r.dueDate)
        out.push({ id: r.id, f: "due", msg: "A new reference needs a due date." });
      else if (voucherDate && r.dueDate < voucherDate)
        out.push({
          id: r.id,
          f: "due",
          msg: "A due date cannot fall before the voucher date.",
        });
    }
    if (amt <= 0)
      out.push({
        id: r.id,
        f: "amount",
        msg: "An allocation has to be more than zero.",
      });
  });
  return out;
};

/* --------------------------------------------------------------- checks */

/**
 * What stands between a bank voucher and Approve, in the order the form
 * reads. The same list colours the dots, fills Needs you and blocks the
 * button, so the three never disagree.
 */
export const bankVoucherChecks = ({
  kind,
  amount,
  lines,
  company,
  docs,
  applied,
}: {
  kind: VoucherKind | null;
  amount: number;
  lines: VoucherLine[];
  company: string;
  docs: OpenDocument[];
  applied?: BillReference[];
}): VoucherCheck[] => {
  const out: VoucherCheck[] = [];
  if (!kind) {
    out.push({
      key: "type",
      label: "Voucher type",
      target: "#bank-post-as",
      where: "Voucher",
    });
    return out;
  }
  const profile = VOUCHER_PROFILES[kind];
  const used = lines.filter((l) => l.ledger || l.amount);
  if (!used.length)
    out.push({
      key: "lines",
      label: `Add a ledger to ${profile.linesTitle}`,
      target: ".vb-lines",
      where: profile.linesTitle,
    });
  used.forEach((l, i) => {
    const n = used.length > 1 ? `Line ${i + 1}: ` : "";
    if (!l.ledger)
      out.push({
        key: `ledger-${l.id}`,
        label: `${n}choose a ledger`,
        target: `[data-line="${l.id}"] [data-cell="ledger"]`,
        where: profile.linesTitle,
      });
    else if (
      profile.lineGroups.length &&
      !profile.lineGroups.includes(groupOf(company, l.ledger))
    )
      out.push({
        key: `group-${l.id}`,
        label: `${n}${l.ledger} is not a bank or cash ledger — a Contra only moves money between them`,
        target: `[data-line="${l.id}"] [data-cell="ledger"]`,
        where: profile.linesTitle,
      });
    if (!(l.amount > 0))
      out.push({
        key: `amount-${l.id}`,
        label: `${n}enter an amount`,
        target: `[data-line="${l.id}"] [data-cell="amount"]`,
        where: profile.linesTitle,
      });
    if (
      profile.references &&
      l.ledger &&
      l.amount > 0 &&
      isPartyLedger(company, l.ledger)
    ) {
      const side: Side = profile.lineSide === "Cr" ? "Cr" : "Dr";
      if (!l.refs?.length)
        out.push({
          key: `refs-${l.id}`,
          label: `${n}allocate ${l.ledger}'s amount to its bills`,
          target: `[data-line="${l.id}"] [data-cell="refs"]`,
          where: "References",
        });
      else {
        const gap = unallocated(l.amount, l.refs, side);
        const faults = referenceFaults(
          l.refs,
          pendingBefore(l.ledger, docs, applied),
          ""
        );
        if (Math.abs(gap) >= 0.005 || faults.length)
          out.push({
            key: `refs-${l.id}`,
            label: `${n}references ${
              Math.abs(gap) >= 0.005
                ? `are ${rupee(gap)} ${gap > 0 ? "short of" : "over"} the line`
                : "need fixing"
            }`,
            target: `[data-line="${l.id}"] [data-cell="refs"]`,
            where: "References",
          });
      }
    }
  });
  const total = r2(used.reduce((s, l) => s + (l.amount || 0), 0));
  if (used.length && Math.abs(total - amount) >= 0.005)
    out.push({
      key: "total",
      label: `${profile.linesTitle} come to ${rupee(total)}; the statement says ${rupee(amount)}`,
      target: ".vb-totals",
      where: "Totals",
    });
  const names = used.map((l) => l.ledger).filter(Boolean);
  const dup = names.find((n, i) => names.indexOf(n) !== i);
  // A label with no "Line n: " in front starts as a sentence does.
  out.forEach((c) => {
    c.label = c.label[0].toUpperCase() + c.label.slice(1);
  });
  if (dup)
    out.push({
      key: "dup",
      label: `${dup} is on two lines — put it on one`,
      target: ".vb-lines",
      where: profile.linesTitle,
    });
  return out;
};

/* ======================================================= phase 2 rules */

/**
 * ERP's Bank Allocations, read off the statement's narration. These are
 * values copied from the source, so they carry no AI mark (the AI-mark
 * rule): the form captions them "Read from the narration" instead.
 *
 *   NEFT / RTGS / IMPS → e-Fund Transfer, the UTR or bank reference
 *   UPI                → UPI, the 12-digit RRN
 *   CHQ                → Cheque, the 6-digit cheque number
 *   NACH / ACH / ECS   → ECS, the mandate reference
 *   POS                → Card · ATM / CASH WDL → ATM
 */
export const readAllocation = (
  description: string,
  date: string,
  favouring = ""
): BankAllocation => {
  const d = description.toUpperCase();
  const type = /^(UPI)/.test(d)
    ? "UPI"
    : /CHQ|CHEQUE|CLG/.test(d)
      ? "Cheque"
      : /NEFT|RTGS|IMPS|TRF/.test(d)
        ? "e-Fund Transfer"
        : /NACH|ACH|ECS/.test(d)
          ? "ECS"
          : /^POS/.test(d)
            ? "Card"
            : /ATM|CASH WDL/.test(d)
              ? "ATM"
              : "Others";
  const instrumentNo =
    type === "Cheque"
      ? (d.match(/\b(\d{6})\b/)?.[1] ?? "")
      : type === "UPI" || /IMPS/.test(d)
        ? (d.match(/\b(\d{12})\b/)?.[1] ?? "")
        : type === "e-Fund Transfer"
          ? (d.match(/\b([A-Z]{4}R?\d{6,})\s*$/)?.[1] ??
            d.match(/-([A-Z]{4}R\d{6,})/)?.[1] ??
            "")
          : type === "ECS"
            ? (d.match(/-([A-Z]{3}-?\d{4,})\s*$/)?.[1] ??
              d.match(/(\d{5,})\s*$/)?.[1] ??
              "")
            : "";
  return { type, instrumentNo, instrumentDate: date, favouring };
};

/**
 * TDS on a party line: the rate on the bills' taxable value when the line
 * settles known bills, else on the gross the net was paid out of
 * (net ÷ (1 − rate)). Rounded to the rupee, as ERP rounds TDS.
 */
export const suggestTds = (
  line: VoucherLine,
  docs: OpenDocument[],
  rate: number
) => {
  const agst = (line.refs ?? []).filter((r) => r.type === "agst" && r.refId);
  const bills = agst
    .map((r) => docs.find((d) => d.id === r.refId))
    .filter((d): d is OpenDocument => !!d);
  const base = bills.length
    ? r2(bills.reduce((s, d) => s + d.taxable, 0))
    : r2(line.amount / (1 - rate));
  return {
    base,
    amount: Math.round(base * rate),
    refId: agst[0]?.refId ?? "",
    refName: agst[0]?.name ?? "",
  };
};

/** Books-from and future-date check: a voucher has to sit in an open year. */
export const outsideBooks = (date: string, from: string) =>
  !!date && date < from;

/**
 * The cash book: opening balance plus every coded movement through Cash up
 * to and including `upto` — cash vouchers on the Cash ledger, and Contras on
 * the banks that withdraw into or deposit from it. Uncoded lines don't move
 * it: nothing says yet where the money went.
 */
export const cashBalance = (
  cashLedger: { id: string; ledgerName: string },
  all: BankTransaction[],
  opening: { amount: number; asOf: string } | undefined,
  upto: string,
  /** The voucher being reviewed, as the form holds it now. */
  current?: { uuid: string; signed: number }
) => {
  let bal = opening?.amount ?? 0;
  all.forEach((t) => {
    if (t.transactionDate > upto) return;
    if (opening && t.transactionDate < opening.asOf) return;
    if (t.pairedBy) return;
    const amt = Number(t.transactionAmountLc);
    if (t.bankAccountUuid === cashLedger.id) {
      if (current && t.bankLineUuid === current.uuid) return;
      if (!t.paymentType) return;
      bal += t.crDr === "credit" ? amt : -amt;
      return;
    }
    if (t.paymentType !== "contra") return;
    const toCash = (t.lines?.length ? t.lines.map((l) => l.ledger) : t.ledgersNameList).includes(
      cashLedger.ledgerName
    );
    if (!toCash) return;
    // Withdrawn from the bank is into cash; deposited into the bank is out of it.
    bal += t.crDr === "debit" ? amt : -amt;
  });
  if (current) bal += current.signed;
  return r2(bal);
};

/**
 * A credit that hands back a cheque this account paid out: the narration
 * says it came back and names the cheque. Returns the debit it reverses.
 */
export const returnedCheque = (txn: BankTransaction, all: BankTransaction[]) => {
  if (txn.crDr !== "credit") return null;
  const d = txn.description.toUpperCase();
  if (!/RTN|RETURN|BOUNCE|DISHON|UNPAID/.test(d)) return null;
  const no = d.match(/\b(\d{6})\b/)?.[1];
  if (!no) return null;
  return (
    all.find(
      (t) =>
        t.bankAccountUuid === txn.bankAccountUuid &&
        t.crDr === "debit" &&
        t.transactionDate <= txn.transactionDate &&
        Number(t.transactionAmountLc) === Number(txn.transactionAmountLc) &&
        new RegExp(`\\b${no}\\b`).test(t.description)
    ) ?? null
  );
};

/**
 * The other half of a transfer between the company's own accounts: a line
 * in the account the Contra names, the other way round, for the same
 * amount, within three days. A transfer posts once, from the side that
 * pairs first.
 */
export const transferPair = (
  txn: BankTransaction,
  lines: VoucherLine[],
  all: BankTransaction[],
  accounts: { id: string; ledgerName: string }[]
) => {
  if (txn.paymentType !== "contra" || lines.length !== 1) return null;
  const other = accounts.find((a) => a.ledgerName === lines[0].ledger);
  if (!other) return null;
  const day = (s: string) => new Date(`${s}T00:00:00`).getTime();
  const amount = Number(txn.transactionAmountLc);
  return (
    all
      .filter(
        (t) =>
          t.bankAccountUuid === other.id &&
          t.crDr !== txn.crDr &&
          Number(t.transactionAmountLc) === amount &&
          Math.abs(day(t.transactionDate) - day(txn.transactionDate)) <=
            3 * 864e5 &&
          (!t.pairedBy || t.pairedBy === txn.bankLineUuid) &&
          !t.pairedWith
      )
      .sort(
        (a, b) =>
          Math.abs(day(a.transactionDate) - day(txn.transactionDate)) -
          Math.abs(day(b.transactionDate) - day(txn.transactionDate))
      )[0] ?? null
  );
};
