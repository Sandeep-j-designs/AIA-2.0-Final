import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import "@/hooks/pages/inbox/use-bank-drafts";
import { draftPurchaseFor } from "@/hooks/pages/inbox/use-bank-drafts";
import { PageButton, PageDialog, StatusPill } from "@/components/inbox/v2/ui";
import { PaneResizer } from "@/components/inbox/v2/pane-resizer";
import SyncCloud from "@/components/inbox/v2/sync/sync-cloud";
import { AiMark } from "@/components/inbox/v2/ai-mark";
import VoucherForm, {
  type VoucherHeader,
} from "@/components/inbox/v2/voucher/voucher-form";
import { bankingActions } from "@/hooks/pages/inbox/use-banking";
import {
  bankMatchActions,
  settlementsOf,
} from "@/hooks/pages/inbox/use-bank-matches";
import {
  VOUCHER_TYPE_LABEL,
  gstRegistrationsOf,
} from "@/config/pages/inbox/mock-banking";
import {
  BANK_ACCOUNT_GROUPS,
  BOOKS_FROM,
  CASH_OPENING,
  NO_GST_LEDGERS,
  VOUCHER_PROFILES,
  lineSideFor,
} from "@/config/pages/inbox/voucher-profiles";
import {
  bankLinesOf,
  bankVoucherChecks,
  cashBalance,
  groupOf,
  isPartyLedger,
  ledgerListOf,
  outsideBooks,
  readAllocation,
  returnedCheque,
  rupee,
  transferPair,
  vid,
} from "@/utils/pages/inbox/voucher";
import type {
  BankLedgerData,
  BankTransaction,
  TallyVoucherPaymentType,
} from "@/types/pages/inbox/banking";
import type {
  MatchSuggestion,
  OpenDocument,
} from "@/types/pages/inbox/bank-automation";
import type {
  BankAllocation,
  BillReference,
  VoucherCheck,
  VoucherLine,
} from "@/types/pages/inbox/voucher";
import MatchPanel, { MatchedNote } from "./match-panel";
import StatementPane, { CashSourcePane } from "./statement-pane";
import Preview from "@/components/inbox/v2/preview";
import { getState as getInbox } from "@/components/inbox/v2/store";
import { ledgerGroupsFor, typeOptionsFor } from "./transactions-table";

/**
 * A bank line's review, on the voucher base (4 Nov 2026). Sandeep chose
 * the full review screen over the docked panel: it is the Purchases review
 * — the toolbar with Post as, the queue counter, Delete and Approve &
 * Next; the source on the left behind the same resizer; the form on the
 * right — with the statement page where the bill's PDF would be.
 *
 * Edits save as you make them, as a bill's draft does. Approve checks the
 * same list Needs you shows and moves on to the next line in the list you
 * came from. "Approved" is the status word, as in every other book.
 *
 * DEV: POST /api/transactions/v1/transaction-link/{payment|receipt|contra}
 * -voucher on each save (ledgerAllocations[].billAllocations[] from the
 * lines), PATCH /api/transactions/bank/toggle-accounting-ready on Approve.
 */

type Props = {
  txn: BankTransaction | null;
  company: string;
  /** Every line in this account: the statement and the queue read it. */
  account: BankTransaction[];
  /** Every line in the company, every account: pairs, cash, duplicates. */
  all: BankTransaction[];
  /** The company's bank and cash ledgers. */
  accounts: BankLedgerData[];
  docs: OpenDocument[];
  /** The list the line was opened from, in its order. */
  queue: string[];
  /** Where the queue came from: "Needs review", "Approved". */
  queueName: string;
  onOpen: (uuid: string) => void;
  onClose: () => void;
  notify: (message: string, kind?: "success" | "error" | "info") => void;
  onUnbuilt: (what: string) => void;
  observe: (uuids: string[]) => void;
  match?: {
    suggestion: MatchSuggestion;
    candidates: OpenDocument[];
    onAccept: () => void;
    onChoose: (docIds: string[]) => void;
    onDismiss: () => void;
  };
  ruleNote?: string;
};

const headerOf = (txn: BankTransaction, company: string): VoucherHeader => ({
  date: txn.transactionDate,
  dateLabel: "Voucher date",
  voucherNo: txn.voucherNo ?? "",
  gst: txn.companyGstUuid || (gstRegistrationsOf(company)[0]?.uuid ?? ""),
  narration: txn.narration ?? txn.description,
});

/** "Banking / Payment": the book in grey, the type in ink. */
const postAs = (type: string) => (
  <span className="flex items-center gap-2 whitespace-nowrap">
    <span className="font-normal text-pi-body">Banking</span>
    <span aria-hidden className="text-pi-faint">
      /
    </span>
    <span>{type}</span>
  </span>
);

const fmtDay = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const agstOf = (lines: VoucherLine[]) =>
  lines.flatMap((l) => l.refs ?? []).filter((r) => r.type === "agst");

const Review = ({
  txn,
  company,
  account,
  all,
  accounts,
  docs,
  queue,
  queueName,
  onOpen,
  onClose,
  notify,
  onUnbuilt,
  observe,
  match,
  ruleNote,
}: Props & { txn: BankTransaction }) => {
  const amount = Number(txn.transactionAmountLc);
  const ready = txn.accoutingReady;
  const synced =
    txn.thirdPartySyncStatus === "synced" ||
    txn.thirdPartySyncStatus === "in_progress";
  const [editingApproved, setEditingApproved] = useState(false);
  // The other half of a transfer another account's Contra records posts
  // nothing of its own, so there is nothing here to change.
  const readOnly = synced || !!txn.pairedBy || (ready && !editingApproved);
  const router = useRouter();
  const [attempted, setAttempted] = useState(false);
  const [needs, setNeeds] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const kind = txn.paymentType;
  const profile = kind ? VOUCHER_PROFILES[kind] : null;
  const side = lineSideFor(txn.crDr);
  const lines = useMemo(() => bankLinesOf(txn, docs), [txn, docs]);
  const header = headerOf(txn, company);
  // What this voucher has already taken off the open items: an approved
  // line's references, as they stood when it was approved.
  const appliedAtStart = useRef<BillReference[]>(
    ready ? settlementsOf(lines) : []
  );
  const applied = ready ? appliedAtStart.current : [];

  const gstOptions = gstRegistrationsOf(company).map((g) => ({
    label: g.label,
    value: g.uuid,
  }));
  const groups = ledgerGroupsFor(kind, txn.bankAccountName, company);
  const sourceItem = txn.source
    ? getInbox().items.find((x) => x.id === txn.source!.itemId)
    : undefined;
  const accountLedger = accounts.find((a) => a.id === txn.bankAccountUuid);
  const accountGroup = groupOf(company, txn.bankAccountName);
  const isCash =
    !!txn.manual || accountGroup === "Cash-in-Hand" ||
    accountLedger?.typeOfAccountFixed === "cash";
  const cashLedger = accounts.find(
    (a) => a.typeOfAccountFixed === "cash" || a.accountParent === "Cash-in-Hand"
  );

  // ERP's Bank Allocations: what's saved, else what the narration says.
  const firstParty = lines.find(
    (l) => l.ledger && isPartyLedger(company, l.ledger)
  )?.ledger;
  const readOff = readAllocation(
    txn.description,
    txn.transactionDate,
    kind === "contra" ? "" : (firstParty ?? "")
  );
  const allocationValue: BankAllocation = txn.bankAllocation ?? readOff;
  const allocationRead = (
    Object.keys(readOff) as (keyof BankAllocation)[]
  ).filter((k) => readOff[k] && allocationValue[k] === readOff[k]);

  // The other half of a transfer, the cheque this line hands back, and
  // where the cash book stands — the module's own reading of the line.
  const pair = kind === "contra" ? transferPair(txn, lines, all, accounts) : null;
  const pairAccount = pair
    ? accounts.find((a) => a.id === pair.bankAccountUuid)
    : undefined;
  const bounced = returnedCheque(txn, all);
  const touchesCash =
    !!cashLedger &&
    (isCash ||
      (kind === "contra" && lines.some((l) => l.ledger === cashLedger.ledgerName)));
  const cashAfter =
    touchesCash && cashLedger
      ? cashBalance(cashLedger, all, CASH_OPENING[company], txn.transactionDate)
      : null;

  const checks: VoucherCheck[] = [
    ...bankVoucherChecks({ kind, amount, lines, company, docs, applied }),
    ...(txn.manual && !(amount > 0)
      ? [
          {
            key: "cash-amount",
            label: "Enter the amount paid or received",
            target: "[data-row=account]",
            where: "Account",
          },
        ]
      : []),
    // Cash limits in the Income-tax Act, said where the cash is: 40A(3)
    // disallows a cash expense over ₹10,000 to one person in a day; 269ST
    // bars receiving ₹2 lakh or more in cash. Worth a look, not a block —
    // there are exceptions (Rule 6DD) the accountant knows about.
    ...(isCash && kind === "payment" && amount > 10000
      ? [
          {
            key: "40a3",
            label: `A cash payment of ${rupee(amount)}. Cash expenses over ₹10,000 to one person in a day are disallowed under section 40A(3); pay by bank unless a Rule 6DD exception applies.`,
            target: "[data-row=account]",
            where: "Cash limit",
            level: "check" as const,
          },
        ]
      : []),
    ...(isCash && kind === "receipt" && amount >= 200000
      ? [
          {
            key: "269st",
            label: `A cash receipt of ${rupee(amount)}. Receiving ₹2,00,000 or more in cash from one person is barred under section 269ST.`,
            target: "[data-row=account]",
            where: "Cash limit",
            level: "check" as const,
          },
        ]
      : []),
    ...(accountGroup && !BANK_ACCOUNT_GROUPS.includes(accountGroup)
      ? [
          {
            key: "account-group",
            label: `${txn.bankAccountName} is filed under ${accountGroup}. Move it to Bank Accounts (or Bank OD A/c) in the Chart of Accounts — ERP won't post a voucher on it.`,
            target: "[data-row=account]",
            where: "Account",
          },
        ]
      : []),
    ...(outsideBooks(txn.transactionDate, BOOKS_FROM)
      ? [
          {
            key: "books",
            label: `Dated before the books begin (${BOOKS_FROM}). Open the right financial year, or correct the date.`,
            target: "[data-row=date]",
            where: "Voucher",
          },
        ]
      : []),
    ...lines
      .filter((l) => l.tds && !(l.tds.amount > 0))
      .map((l) => ({
        key: `tds-${l.id}`,
        label: `TDS on ${l.ledger} has no amount`,
        target: `[data-line-tds="${l.id}"]`,
        where: "Tax & deductions",
      })),
    ...(cashAfter !== null && cashAfter < 0
      ? [
          {
            key: "cash-negative",
            label: `Cash would stand at −${rupee(cashAfter)} on ${fmtDay(txn.transactionDate)}. Cash can't go below zero: a receipt or a withdrawal is missing, or dated after this.`,
            target: ".vb-cash",
            where: "Cash book",
          },
        ]
      : []),
    ...(kind === "payment"
      ? lines
          .filter((l) => l.ledger)
          .flatMap((l) => {
            const twin = all.find(
              (t) =>
                t.bankLineUuid !== txn.bankLineUuid &&
                t.paymentType === "payment" &&
                !t.pairedBy &&
                Number(t.transactionAmountLc) === amount &&
                t.ledgersNameList.includes(l.ledger) &&
                Math.abs(
                  new Date(t.transactionDate).getTime() -
                    new Date(txn.transactionDate).getTime()
                ) <= 7 * 864e5
            );
            return twin
              ? [
                  {
                    key: `dup-${l.id}`,
                    label: `${l.ledger} was also paid ${rupee(amount)} on ${fmtDay(twin.transactionDate)} (${twin.bankAccountName}). Paid twice?`,
                    target: `[data-line="${l.id}"]`,
                    where: "Possible duplicate",
                    level: "check" as const,
                  },
                ]
              : [];
          })
      : []),
  ];
  const blocking = checks.filter((c) => c.level !== "check");

  // The AI's categorisation, still as it chose it: one mark, on the type.
  const aiPicked =
    txn.categorisedBy === "ai" && !!kind && !synced && !match;

  /** Every edit is the draft: written to the line as it is made. */
  const save = (patch: Partial<BankTransaction>, coding = false) =>
    bankingActions.updateTransaction(company, txn.bankLineUuid, {
      ...patch,
      ...(coding ? { categorisedBy: "user" as const } : {}),
    });

  const setLines = (next: VoucherLine[]) => {
    const names = ledgerListOf(next);
    const agst = agstOf(next);
    save(
      {
        lines: next,
        ledgersNameList: names,
        ledgersUuidList: names.map((n) => `led-${n}`),
        matchedDocuments: agst.length ? agst.map((r) => r.name) : undefined,
      },
      true
    );
  };

  const setHeader = (patch: Partial<VoucherHeader>) => {
    const gst = gstRegistrationsOf(company).find(
      (g) => g.uuid === (patch.gst ?? header.gst)
    );
    save({
      ...(patch.voucherNo !== undefined
        ? { voucherNo: patch.voucherNo || null }
        : {}),
      ...(patch.narration !== undefined ? { narration: patch.narration } : {}),
      ...(patch.gst !== undefined
        ? { companyGstUuid: gst?.uuid ?? "", companyGstLabel: gst?.label ?? "" }
        : {}),
    });
  };

  const setKind = (next: TallyVoucherPaymentType) => {
    // Ledgers the new type can't post to come off; the rest stay.
    const allowed = ledgerGroupsFor(next, txn.bankAccountName, company).flatMap(
      (g) => g.options
    );
    const kept = lines.map((l) =>
      allowed.includes(l.ledger) ? l : { ...l, ledger: "", refs: undefined }
    );
    const names = ledgerListOf(kept);
    save(
      {
        paymentType: next,
        lines: kept,
        ledgersNameList: names,
        ledgersUuidList: names.map((n) => `led-${n}`),
      },
      true
    );
  };

  const at = queue.indexOf(txn.bankLineUuid);
  const next = () => {
    const after = queue.slice(at + 1).find((id) => id !== txn.bankLineUuid);
    if (after) onOpen(after);
    else {
      onClose();
      notify(`${queueName} is clear.`);
    }
  };

  const approve = () => {
    if (blocking.length) {
      setAttempted(true);
      setNeeds(true);
      return;
    }
    // Stamp the line as the form shows it, so a line coded only in the
    // table carries its lines and references from here on.
    const gst = gstRegistrationsOf(company).find((g) => g.uuid === header.gst);
    save({
      lines,
      narration: header.narration,
      ...(isCash ? {} : { bankAllocation: allocationValue }),
      ...(pair ? { pairedWith: pair.bankLineUuid } : {}),
      ...(gst ? { companyGstUuid: gst.uuid, companyGstLabel: gst.label } : {}),
    });
    // A transfer posts once: the other account's line is recorded by this
    // Contra and leaves its own Needs review.
    if (pair) {
      bankingActions.updateTransaction(company, pair.bankLineUuid, {
        paymentType: "contra",
        categorisedBy: "user",
        pairedBy: txn.bankLineUuid,
        ledgersNameList: [txn.bankAccountName],
        ledgersUuidList: [`led-${txn.bankAccountName}`],
        lines: [
          {
            id: `${pair.bankLineUuid}-1`,
            ledger: txn.bankAccountName,
            amount: Number(pair.transactionAmountLc),
            narration: "",
            costCentre: "",
            costAllocation: null,
          },
        ],
        narration: `Recorded by the Contra on ${txn.bankAccountName} (${fmtDay(txn.transactionDate)}).`,
      });
      bankingActions.setAccountingReady(company, [pair.bankLineUuid], true);
    }
    bankingActions.setAccountingReady(company, [txn.bankLineUuid], true);
    observe([txn.bankLineUuid]);
    const tdsCount = lines.filter((l) => l.tds?.amount).length;
    notify(
      `${profile?.label ?? "Bank"} voucher approved.${
        tdsCount
          ? ` TDS journal drafted in Journals › Needs Review.`
          : ""
      }${pair ? ` ${pairAccount?.ledgerName ?? "The other account"}'s line is recorded by it.` : ""} It goes to ERP with the next sync.`
    );
    next();
  };

  /** The cheque comes back: a Receipt against the bill it paid, reopening it. */
  const postReturn = () => {
    if (!bounced) return;
    const paid = bankLinesOf(bounced, docs);
    const party = paid.find((l) => l.ledger && isPartyLedger(company, l.ledger));
    const no = bounced.description.match(/\b(\d{6})\b/)?.[1] ?? "";
    const refs: BillReference[] | undefined = party?.refs?.length
      ? party.refs
          .filter((r) => r.type === "agst" && r.refId)
          .map((r) => ({
            ...r,
            id: vid("br"),
            side: "Cr" as const,
            reopens: true,
          }))
      : undefined;
    const line: VoucherLine = {
      id: vid(),
      ledger: party?.ledger ?? paid[0]?.ledger ?? "",
      amount,
      narration: `Cheque ${no} returned unpaid`,
      costCentre: "",
      costAllocation: null,
      refs,
    };
    save(
      {
        paymentType: "receipt",
        lines: [line],
        ledgersNameList: line.ledger ? [line.ledger] : [],
        ledgersUuidList: line.ledger ? [`led-${line.ledger}`] : [],
        narration: `Cheque ${no} to ${line.ledger || "the payee"} returned unpaid (${txn.description}).`,
      },
      true
    );
  };

  const bookBill = () => {
    const d = draftPurchaseFor();
    if (!d) return;
    save({ drafts: [...(txn.drafts ?? []), d] });
    notify("Purchase bill started in Purchases › Needs Review. Enter it from the bill, then pay the vendor against it.");
  };

  /** A cash voucher's own date and amount. */
  const setAccount = (patch: { date?: string; amount?: number }) => {
    // One line that held the whole amount keeps holding it.
    const follow =
      patch.amount !== undefined &&
      lines.length === 1 &&
      (lines[0].amount === 0 || lines[0].amount === amount);
    save({
      ...(patch.date ? { transactionDate: patch.date } : {}),
      ...(patch.amount !== undefined
        ? { transactionAmountLc: patch.amount.toFixed(2) }
        : {}),
      ...(follow ? { lines: [{ ...lines[0], amount: patch.amount! }] } : {}),
    });
  };

  // Changing an approved voucher's references moves what the bills owe.
  const finishEditing = () => {
    if (blocking.length) {
      setAttempted(true);
      setNeeds(true);
      return;
    }
    bankMatchActions.reapply(
      company,
      appliedAtStart.current,
      settlementsOf(lines)
    );
    appliedAtStart.current = settlementsOf(lines);
    setEditingApproved(false);
    setAttempted(false);
    notify("Changes saved. The voucher stays approved.");
  };

  const remove = () => {
    bankingActions.deleteTransactions(company, [txn.bankLineUuid]);
    setConfirmDelete(false);
    notify("Transaction deleted.");
    next();
  };

  const Note = ({ children, tone }: { children: React.ReactNode; tone?: "warn" }) => (
    <div
      className={cn(
        "rounded-md border px-4 py-3 text-small text-pi-body",
        // One ground for every note; a warning says so in its words and
        // its dot, not with a tinted box.
        "border-pi-line bg-pi-surface-panel",
        tone === "warn" && "border-l-[3px] border-l-pi-warning"
      )}
    >
      {children}
    </div>
  );
  const expenseLines =
    kind === "payment" && !readOnly
      ? lines.filter((l) => {
          const g = groupOf(company, l.ledger);
          return (
            (g === "Indirect Expenses" || g === "Direct Expenses") &&
            !NO_GST_LEDGERS.includes(l.ledger)
          );
        })
      : [];
  const purchaseDraft = txn.drafts?.find((d) => d.kind === "purchase");
  const returnNote = bounced ? (
    <Note tone="warn">
      <b className="font-medium text-pi-ink">A cheque coming back.</b> This
      hands back {bounced.description} ({fmtDay(bounced.transactionDate)}).
      Don&apos;t delete the payment: post this as a Receipt from{" "}
      {bankLinesOf(bounced, docs)[0]?.ledger || "the payee"} against the bill
      it paid, and the bill is owed again.{" "}
      <Button variant="tertiary" className="h-auto px-0" onClick={postReturn}>
        Post as the return
      </Button>
      {!bounced.paymentType ? (
        <span className="block pt-1 text-caption text-pi-faint">
          The cheque payment isn&apos;t coded yet; code it first so the return
          can reopen its bill.
        </span>
      ) : null}
    </Note>
  ) : null;
  const afterLines = (
    <>
      {kind === "contra" && lines[0]?.ledger && !txn.pairedBy ? (
        <Note>
          {pair ? (
            <>
              <b className="font-medium text-pi-ink">One transfer, one Contra.</b>{" "}
              Pairs with {pairAccount?.ledgerName}'s line of{" "}
              {fmtDay(pair.transactionDate)} ({pair.description}, {rupee(Number(pair.transactionAmountLc))}{" "}
              {pair.crDr === "credit" ? "in" : "out"}). Approving records both
              sides here; that line posts nothing of its own.
            </>
          ) : accounts.some((a) => a.ledgerName === lines[0].ledger && a.typeOfAccountFixed !== "cash") ? (
            <>
              No matching line in {lines[0].ledger} yet. When its statement
              arrives, its line for {rupee(amount)} is recorded by this Contra.
            </>
          ) : (
            <>Cash is moved by this Contra; nothing else posts for it.</>
          )}
        </Note>
      ) : null}
      {bounced && !lines.some((l) => l.refs?.some((r) => r.reopens)) && !readOnly ? (
        returnNote
      ) : null}
      {expenseLines.length && !purchaseDraft ? (
        <Note>
          <b className="font-medium text-pi-ink">Bill has GST?</b>{" "}
          {expenseLines.map((l) => l.ledger).join(", ")}{" "}
          {expenseLines.length === 1 ? "is" : "are"} paid straight to the
          expense, which hides the bill's GST. To claim the input credit, book
          the bill in Purchases first, then pay the vendor against it.{" "}
          <Button variant="tertiary" className="h-auto px-0" onClick={bookBill}>
            Start the bill in Purchases
          </Button>
        </Note>
      ) : null}
      {txn.drafts?.length ? (
        <Note>
          <b className="font-medium text-pi-ink">Drafted from this line:</b>{" "}
          {txn.drafts.map((d, i) => (
            <React.Fragment key={d.itemId}>
              {i ? " · " : ""}
              <button
                type="button"
                className="font-medium text-pi-brand underline-offset-2 hover:underline"
                onClick={() => void router.push(`/inbox?id=${encodeURIComponent(d.itemId)}`)}
              >
                {d.label}
              </button>
            </React.Fragment>
          ))}
        </Note>
      ) : null}
      {cashAfter !== null ? (
        <div className="vb-cash">
          <Note tone={cashAfter < 0 ? "warn" : undefined}>
            <b className="font-medium text-pi-ink">Cash book.</b> Cash stands at{" "}
            <b className={cn("font-semibold tabular-nums", cashAfter < 0 ? "text-pi-danger" : "text-pi-ink")}>
              {cashAfter < 0 ? "−" : ""}
              {rupee(cashAfter)}
            </b>{" "}
            at the end of {fmtDay(txn.transactionDate)}, with this voucher and every
            coded cash movement before it (opening {rupee(CASH_OPENING[company]?.amount ?? 0)} on{" "}
            {CASH_OPENING[company] ? fmtDay(CASH_OPENING[company].asOf) : "—"}).
          </Note>
        </div>
      ) : null}
    </>
  );

  // A new line starts clean: no red edges, Needs you shut, not editing.
  useEffect(() => {
    setAttempted(false);
    setNeeds(false);
    setEditingApproved(false);
  }, [txn.bankLineUuid]);

  return (
    <>
      <div className="review-toolbar-container shrink-0 border-b border-pi-line bg-background">
        <div className="review-toolbar min-h-[52px] px-6 py-2">
          <div className="review-toolbar-routing">
            <Dialog.Close asChild>
              <PageButton
                label={`Back to ${txn.bankAccountName}`}
                disabled={false}
                onClick={onClose}
              >
                <ChevronLeft className="h-4 w-4" />
              </PageButton>
            </Dialog.Close>
            <Dialog.Title className="sr-only">
              {profile ? `${profile.label} voucher` : "Bank transaction"} ·{" "}
              {txn.description}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Review this bank line as a voucher.
            </Dialog.Description>
            {readOnly ? (
              <span className="text-body font-semibold text-pi-ink">
                {profile ? `${profile.label} voucher` : "Bank transaction"}
              </span>
            ) : (
              <>
                {/* Post as, as on the Purchases review: one grouped select,
                    the book in grey and the type in ink. Banking's book
                    holds the types the statement's side allows. */}
                <Label
                  htmlFor="bank-post-as"
                  className="whitespace-nowrap text-body text-secondary-foreground"
                >
                  Post as
                </Label>
                <Select
                  value={kind ?? undefined}
                  onValueChange={(v) => setKind(v as TallyVoucherPaymentType)}
                >
                  <SelectTrigger
                    id="bank-post-as"
                    aria-label={`Post as Banking, ${kind ? VOUCHER_TYPE_LABEL[kind] : "no type yet"}`}
                    aria-invalid={attempted && !kind}
                    className={cn(
                      "h-9 w-auto gap-2 rounded-sm border border-pi-line-2 bg-background px-3 shadow-contact",
                      "text-small font-medium text-pi-ink hover:border-pi-line-strong focus:ring-0",
                      "[&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:opacity-70",
                      attempted && !kind && "border-pi-danger"
                    )}
                  >
                    {/* Radix draws the placeholder while there is no value,
                        so the empty state carries the same book / type. */}
                    <SelectValue placeholder={postAs("Select type")}>
                      {kind ? postAs(VOUCHER_TYPE_LABEL[kind]) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="text-overline font-semibold uppercase text-pi-faint">
                        Banking
                      </SelectLabel>
                      {typeOptionsFor(txn).map((label) => (
                        <SelectItem key={label} value={label.toLowerCase()}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {aiPicked ? (
                  <AiMark
                    reason={ruleNote ?? "Categorised from this payee and narration"}
                  />
                ) : null}
              </>
            )}
            {ready ? <StatusPill status="Approved" /> : null}
            {ready ? (
              <SyncCloud
                className="h-4 w-4"
                side="bottom"
                state={
                  txn.thirdPartySyncStatus === "synced"
                    ? "synced"
                    : txn.thirdPartySyncStatus === "in_progress"
                      ? "syncing"
                      : "pending"
                }
              />
            ) : null}
          </div>

          <div className="review-toolbar-actions">
            <div className="flex items-center gap-1">
              <PageButton
                label="Previous transaction"
                disabled={at <= 0}
                className="text-pi-faint hover:bg-pi-fill hover:text-pi-ink disabled:opacity-40"
                onClick={() => onOpen(queue[at - 1])}
              >
                <ChevronLeft className="h-4 w-4" />
              </PageButton>
              <span className="whitespace-nowrap text-small font-medium tabular-nums text-pi-ink">
                <span className="review-toolbar-document-label">
                  Transactions{" "}
                </span>
                {Math.max(0, at) + 1} of {Math.max(queue.length, 1)}
                <span className="review-toolbar-origin font-normal text-pi-faint">
                  {" · "}
                  {txn.bankAccountName} › {queueName}
                </span>
              </span>
              <PageButton
                label="Next transaction"
                disabled={at < 0 || at >= queue.length - 1}
                className="text-pi-faint hover:bg-pi-fill hover:text-pi-ink disabled:opacity-40"
                onClick={() => onOpen(queue[at + 1])}
              >
                <ChevronRight className="h-4 w-4" />
              </PageButton>
            </div>
            {!synced && ready && !editingApproved && !txn.pairedBy ? (
              <Button variant="secondary" onClick={() => setEditingApproved(true)}>
                Edit entry
              </Button>
            ) : null}
            {!synced && !ready ? (
              <Button
                variant="ghost"
                isDestructive
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            ) : null}
            {editingApproved ? (
              <Button onClick={finishEditing}>Done editing</Button>
            ) : null}
            {!ready && !txn.pairedBy ? (
              <Button onClick={approve}>Approve &amp; Next</Button>
            ) : null}
          </div>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={36} minSize={18} className="min-w-0">
          {txn.source && sourceItem ? (
            // Raised from an Inbox receipt: the document beside the form,
            // in the same viewer the Purchases review uses.
            // It left the Inbox queue as "Deleted"; here it is this cash
            // voucher's document, so it wears the voucher's status.
            <Preview
              item={{
                ...sourceItem,
                status: txn.accoutingReady ? "Approved" : "Needs Review",
              }}
            />
          ) : txn.manual ? (
            <CashSourcePane txn={txn} onOpenSource={(id) => void router.push(`/inbox?id=${encodeURIComponent(id)}`)} />
          ) : (
            <StatementPane txn={txn} lines={account} />
          )}
        </ResizablePanel>
        <PaneResizer />
        <ResizablePanel defaultSize={64} minSize={40} className="min-w-0">
          <div className="payable-review h-full min-w-0 overflow-auto">
            {profile ? (
              <VoucherForm
                profile={profile}
                company={company}
                header={header}
                onHeader={setHeader}
                gstOptions={gstOptions}
                account={{
                  name: txn.bankAccountName,
                  amount,
                  side: side === "Dr" ? "Cr" : "Dr",
                }}
                onAccount={txn.manual ? setAccount : undefined}
                allocation={
                  profile.bankAllocation && !isCash
                    ? {
                        value: allocationValue,
                        read: allocationRead,
                        onChange: (patch) =>
                          save({ bankAllocation: { ...allocationValue, ...patch } }),
                      }
                    : undefined
                }
                afterLines={afterLines}
                lines={lines}
                onLines={setLines}
                lineSide={side}
                ledgerGroups={groups}
                docs={docs}
                applied={applied}
                checks={checks}
                attempted={attempted}
                readOnly={readOnly}
                lockedNote={
                  txn.pairedBy
                    ? `${txn.narration ?? "Recorded by the Contra on the other account."} This line posts nothing of its own; change it there.`
                    : synced
                    ? "Synced to ERP. Changing a synced voucher isn't built yet."
                    : ready && !editingApproved
                      ? "Approved. Edit entry to change it; it stays approved."
                      : undefined
                }
                lead={
                  match && !ready ? (
                    <details className="rounded-md border border-pi-line p-4" open>
                      <summary className="cursor-pointer text-body font-semibold text-pi-brand">
                        Suggested match ·{" "}
                        {match.suggestion.documents.map((d) => d.number).join(", ")}
                      </summary>
                      <div className="mt-4">
                        <MatchPanel
                          txn={txn}
                          suggestion={match.suggestion}
                          candidates={match.candidates}
                          onAccept={match.onAccept}
                          onChoose={match.onChoose}
                          onDismiss={match.onDismiss}
                        />
                      </div>
                    </details>
                  ) : (
                    <MatchedNote txn={txn} />
                  )
                }
                needsOpen={needs}
                onNeedsOpen={setNeeds}
                onCreateLedger={() => onUnbuilt("Creating a ledger")}
              />
            ) : (
              // No type yet: the one decision that shapes the rest.
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                {bounced ? (
                  // A returned cheque says so before anything else is asked:
                  // it is the one answer here that isn't a guess.
                  <div className="mb-4 max-w-[560px] text-left">{returnNote}</div>
                ) : null}
                <p className="text-lead font-semibold text-pi-ink">
                  Choose what this line posts as
                </p>
                <p className="max-w-[44ch] text-small text-pi-body">
                  Money {txn.crDr === "debit" ? "out" : "in"}:{" "}
                  {typeOptionsFor(txn).join(" or ")}. Pick it in Post as, above.
                </p>
                <div className="flex gap-2">
                  {typeOptionsFor(txn).map((label) => (
                    <Button
                      key={label}
                      variant="secondary"
                      onClick={() =>
                        setKind(label.toLowerCase() as TallyVoucherPaymentType)
                      }
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <PageDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this transaction?"
        description="The line is removed from Banking. Upload the statement again to bring it back."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button isDestructive onClick={remove}>
              Delete transaction
            </Button>
          </>
        }
      >
        <p className="text-small text-pi-body">{txn.description}</p>
      </PageDialog>
    </>
  );
};

const BankReview = (props: Props) => (
  <Dialog.Root
    open={!!props.txn}
    onOpenChange={(open) => !open && props.onClose()}
  >
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-background" />
      <Dialog.Content className="fixed inset-0 z-50 flex h-dvh w-full flex-col overflow-hidden bg-background outline-none">
        {props.txn ? (
          <Review key={props.txn.bankLineUuid} {...props} txn={props.txn} />
        ) : null}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

export default BankReview;
