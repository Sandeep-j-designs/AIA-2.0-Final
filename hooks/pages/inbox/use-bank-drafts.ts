import {
  actor,
  blankForm,
  createBlank,
  discardCreated,
  getState,
  personCreate,
  type Item,
} from "@/components/inbox/v2/store";
import { bankingActions, onReadyChange } from "@/hooks/pages/inbox/use-banking";
import type { BankTransaction } from "@/types/pages/inbox/banking";
import type { CompanionDraft, VoucherLine } from "@/types/pages/inbox/voucher";

/**
 * The vouchers a bank line raises in other books (4 Nov 2026, phase 2).
 *
 *   TDS      the Tally guide's Journal + Payment: the payment moves the net,
 *            and a Journal (Dr party · Cr TDS Payable, or Dr TDS Receivable
 *            · Cr party on a receipt) settles the rest of the bill. Drafted
 *            in Journals › Needs Review when the bank voucher is approved,
 *            taken back if it returns to Needs review untouched.
 *   GST      a payment straight to an expense hides the bill's GST. "Book
 *            the bill" starts a Purchase in Purchases › Needs Review so the
 *            credit is claimed and the payment can be set against it.
 *
 * Both are ordinary Inbox drafts credited to the person (personCreate),
 * so they are reviewed and approved where every other voucher is.
 */

const day = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const rupee = (n: number) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** The TDS journals a bank voucher raises, one per line that deducts. */
export const draftTdsJournals = (
  company: string,
  txn: BankTransaction,
  lines: VoucherLine[]
): CompanionDraft[] => {
  const template = getState().items.find((x) => x.company === company);
  if (!template || getState().company !== company) return [];
  const receipt = txn.paymentType === "receipt";
  return lines
    .filter((l) => l.tds && l.tds.amount > 0 && l.ledger)
    .map((l, i) => {
      const t = l.tds!;
      const id = `TDS-${txn.bankLineUuid}-${i + 1}`;
      const narration = `TDS u/s ${t.section} at ${t.rate * 100}% on ${rupee(t.base)}${
        t.refName ? `, against ${t.refName}` : ""
      }. ${receipt ? "Deducted by" : "Deducted from the payment to"} ${l.ledger} on ${day(txn.transactionDate)} (${txn.bankAccountName}).`;
      const partyLine = {
        description: t.refName ? `Agst Ref ${t.refName}` : "On account",
        ledger: l.ledger,
        amount: t.amount,
        dr: receipt ? 0 : t.amount,
        cr: receipt ? t.amount : 0,
        costCentre: "",
      };
      const tdsLine = {
        description: `TDS ${t.section}`,
        ledger: t.ledger,
        amount: t.amount,
        dr: receipt ? t.amount : 0,
        cr: receipt ? 0 : t.amount,
        costCentre: "",
      };
      const form = {
        ...blankForm(),
        gst: template.form.gst,
        voucherType: "Journal",
        voucherNo: "",
        date: txn.transactionDate,
        narration,
        lines: receipt ? [tdsLine, partyLine] : [partyLine, tdsLine],
      };
      const draft: Item = {
        ...structuredClone(template),
        id,
        route: "JV",
        aiRoute: "JV",
        topChoice: "JV",
        created: true,
        priorVoucher: false,
        form,
        amount: t.amount,
        reason: narration,
        source: "upload",
        sender: actor,
        file: {
          name: `TDS ${t.section} · ${l.ledger}`,
          size: `From ${txn.bankAccountName}`,
          ext: "pdf",
        },
        original: {
          ...structuredClone(template.original),
          id,
          route: "JV",
          bill: undefined,
          invoice: undefined,
          jv: {
            narration,
            lines: form.lines.map((x) => ({
              ledger: x.ledger,
              dr: x.dr || null,
              cr: x.cr || null,
            })),
          },
        },
        arSheet: undefined,
        arSnapshot: undefined,
        sheet: undefined,
        snapshot: undefined,
        hardRef: undefined,
        softRef: undefined,
        doneBy: undefined,
        doneAt: undefined,
        edited: [],
        autoApproved: undefined,
        autoHold: undefined,
      };
      // Approving the same line twice must not raise a second journal.
      if (getState().items.some((x) => x.id === id))
        return { kind: "journal" as const, itemId: id, label: `TDS journal · ${rupee(t.amount)}` };
      personCreate(draft, `bank-tds-${txn.bankLineUuid}`);
      return {
        kind: "journal" as const,
        itemId: id,
        label: `TDS journal · ${rupee(t.amount)}`,
      };
    });
};

/** Take back the TDS journals of a line returned to Needs review. */
export const discardTdsJournals = (drafts: CompanionDraft[] = []) =>
  drafts
    .filter((d) => d.kind === "journal")
    .map((d) => ({ ...d, gone: discardCreated(d.itemId) }));

/** Start the Purchase bill a payment to an expense should have gone through. */
export const draftPurchaseFor = (): CompanionDraft | null => {
  const item = createBlank("AP");
  return item
    ? { kind: "purchase", itemId: item.id, label: "Purchase bill · draft" }
    : null;
};

/*
  Approving raises the journals and reverting takes them back, however the
  line was approved — the review's Approve & Next or the table's bulk
  Approve — because both go through setAccountingReady. One listener, even
  after a hot reload re-runs this module.
*/
const KEY = "__aiaBankDraftsListener";
const holder = globalThis as unknown as Record<string, (() => void) | undefined>;
holder[KEY]?.();
holder[KEY] = onReadyChange((company, txn, ready) => {
  if (!txn.lines?.some((l) => l.tds?.amount)) return;
  if (ready) {
    const made = draftTdsJournals(company, txn, txn.lines);
    const keep = (txn.drafts ?? []).filter((d) => d.kind !== "journal");
    bankingActions.updateTransaction(company, txn.bankLineUuid, {
      drafts: [...keep, ...made],
    });
  } else {
    const gone = discardTdsJournals(txn.drafts);
    bankingActions.updateTransaction(company, txn.bankLineUuid, {
      // A journal someone has already changed or approved stays, and stays
      // listed, so the line still says where it is.
      drafts: (txn.drafts ?? []).filter(
        (d) => d.kind !== "journal" || !gone.find((g) => g.itemId === d.itemId)?.gone
      ),
    });
  }
}) as () => void;
