export type AccountingAgent = {
  id: string;
  name: string;
  description: string;
  trigger: string;
  outcome: string;
  sources: string[];
  steps: string[];
  stops: string;
  permissions: string;
  readiness: string;
};
export const ACCOUNTING_AGENTS: AccountingAgent[] = [
  {
    id: "missing-documents",
    name: "Missing document follow-up",
    description:
      "Track missing bills, clearer copies and credit notes until the underlying request is resolved.",
    trigger:
      "A document needs information, a supplier replies, or a follow-up becomes due.",
    outcome:
      "A complete document, or an unresolved request assigned to a person.",
    sources: [
      "Inbox documents and open supplier requests",
      "Verified supplier contacts",
      "Email or WhatsApp replies",
    ],
    steps: [
      "Check for an existing request before creating another.",
      "Prepare a specific request tied to the original document.",
      "Link incoming replies and surface the evidence for review.",
      "Close resolved requests and escalate unanswered ones to the owner.",
    ],
    stops:
      "Stop when the request is resolved or the document is approved or deleted. A reply alone does not prove resolution.",
    permissions:
      "Each recipient and message requires approval. No automatic sending or posting.",
    readiness:
      "Request tracking and sample replies work in this prototype. Scheduled follow-ups and external messaging are not connected.",
  },
  {
    id: "receivables-follow-up",
    name: "Receivables follow-up",
    description:
      "Follow up overdue invoices, track promised payment dates, and stop chasing when payment arrives.",
    trigger:
      "An invoice becomes overdue, a promised date passes, or a receipt or dispute arrives.",
    outcome:
      "A recorded payment, a payment commitment, or an exception assigned to the owner.",
    sources: [
      "Approved customer invoices and due dates",
      "Matched receipts and credit notes",
      "Customer contacts, disputes and payment promises",
    ],
    steps: [
      "Recheck the outstanding balance before proposing a reminder.",
      "Group overdue invoices by customer and prepare the message.",
      "Record replies and route disputes to the owner.",
      "Stop or defer follow-up for settled invoices and agreed payment dates.",
    ],
    stops:
      "Stop for a matched payment. Pause for a dispute or a future agreed payment date; never chase using stale balances.",
    permissions:
      "Approve reminders before sending. No payment initiation, write-offs or changes to customer balances.",
    readiness:
      "Overdue invoices and reminder drafting are available. Automatic reminder scheduling, dispute handling and promise tracking need backend integration.",
  },
  {
    id: "reconciliation-exceptions",
    name: "Reconciliation exceptions",
    description:
      "Revisit unmatched transactions as new evidence arrives and keep unresolved differences moving.",
    trigger:
      "New bank, settlement or accounting data arrives, or an exception passes its review deadline.",
    outcome:
      "An evidence-backed match or an explained difference ready for accountant review.",
    sources: [
      "Bank statements and transactions",
      "Sales and settlement reports",
      "Existing reconciliation results",
    ],
    steps: [
      "Read unresolved exceptions for the selected period.",
      "Check new data for supported matches without changing confirmed matches.",
      "Attach the source evidence and proposed explanation.",
      "Escalate unresolved differences to the assigned accountant.",
    ],
    stops:
      "Stop revisiting confirmed matches. Keep ambiguous matches open; do not force a match to clear the queue.",
    permissions:
      "Propose matches and draft adjustments. An accountant confirms changes before posting.",
    readiness:
      "This page saves a workflow plan. Continuous exception monitoring is not connected yet.",
  },
  {
    id: "month-end-close",
    name: "Month-end close coordinator",
    description:
      "Track close dependencies, follow up with owners, and keep completion evidence in one place.",
    trigger:
      "A close period opens, a task becomes due, or an upstream dependency is completed.",
    outcome:
      "A reviewed close checklist with evidence and clearly assigned blockers.",
    sources: [
      "The company’s close checklist",
      "Reconciliation and adjustment status",
      "Task owners, deadlines and evidence",
    ],
    steps: [
      "Create the period checklist from the agreed close requirements.",
      "Identify prerequisites, owners and deadlines.",
      "Prepare follow-ups for overdue tasks and surface blockers.",
      "Record completion only when the owner supplies supporting evidence.",
    ],
    stops:
      "Stop reminders once a task is verified complete. Closing the period requires an authorised accountant.",
    permissions:
      "Track tasks and prepare owner reminders. Never lock periods or mark the books closed automatically.",
    readiness:
      "This page saves a workflow plan. Task scheduling and close-system integration are not connected yet.",
  },
  {
    id: "supplier-statements",
    name: "Supplier statement reconciliation",
    description:
      "Compare supplier statements with bills, credits and payments to find missing records and balance differences.",
    trigger:
      "A supplier statement arrives or a related bill, credit or payment is recorded.",
    outcome:
      "An explained supplier balance with missing documents and disputed items identified.",
    sources: [
      "Supplier statements",
      "Purchase bills and supplier credit notes",
      "Supplier payments and opening balances",
    ],
    steps: [
      "Confirm supplier identity, statement period and opening balance.",
      "Match statement lines to bills, credits and payments.",
      "Distinguish timing differences from missing or inconsistent entries.",
      "Prepare document requests and hand unresolved differences to the owner.",
    ],
    stops:
      "Stop when all lines are explained and the accountant confirms the result. Do not create a bill from a statement line alone.",
    permissions:
      "Prepare reconciliation and requests. No automatic balance adjustments or supplier payments.",
    readiness:
      "This page saves a workflow plan. Statement ingestion and matching are not connected yet.",
  },
];
