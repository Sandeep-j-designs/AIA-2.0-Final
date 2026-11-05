/** A versioned procedure, separate from company policy, scheduling and runs.
 * The prototype executes taskId through its existing deterministic handlers.
 * Production can supply procedural resources to a model without changing this contract.
 */
export type NeoSkill = {
  id: string;
  version: number;
  taskId: string;
  name: string;
  slash: string;
  does: string;
  when: string;
  requestExample: string;
  prompt: string;
  inputs: string[];
  procedure: string[];
  policy: string;
  exceptions: string;
  output: string;
  completion: string;
  approval: string;
  workspace: { label: string; href: string };
  availability?: (company: string) => string | undefined;
  /** Only advertise scheduling when this procedure has an executable trigger. */
  execution: "on-request";
  example: string;
};

export const SKILLS: NeoSkill[] = [
  {
    id: "bills",
    version: 1,
    taskId: "batch-entry",
    slash: "bills",
    name: "Bill entry",
    when: "You ask Neo to enter or prepare supplier bills, or send bill attachments.",
    requestExample:
      "Enter these bills. Use the Bengaluru cost centre and flag anything unusual.",
    does: "Turn supplier bills into checked draft entries, ready for your review.",
    prompt: "Enter a batch of bills with an instruction",
    inputs: [
      "Supplier bills as PDFs or images",
      "Entry instructions, including ledger and cost centre",
    ],
    procedure: [
      "Read the bills and identify missing details and duplicates.",
      "Propose entry details using the bill evidence and your instructions.",
      "Ask you to resolve exceptions and review the purchase register.",
      "Create the drafts you confirm and link them to the source bills.",
    ],
    policy:
      "Entry instructions apply to this batch. Suggested ledger, cost centre and tax treatment remain editable before drafts are created.",
    exceptions:
      "Unreadable documents and duplicate or incomplete bills are surfaced for review. Neo asks about unresolved entry details before creating drafts.",
    output:
      "A purchase register with source bills, exceptions and draft entries in the Inbox.",
    completion:
      "Confirmed drafts are created; skipped and unresolved bills remain visible in the batch results.",
    approval:
      "You confirm draft creation. Posting and ERP sync require a separate review.",
    workspace: { label: "Inbox", href: "/inbox" },
    execution: "on-request",
    example:
      "Starting without attachments uses the 10 sample Harihar plant bills. This prototype reads the supplied sample documents.",
  },
  {
    id: "recon",
    version: 1,
    taskId: "recon-run",
    slash: "recon",
    name: "Three-way reconciliation",
    when: "You ask to reconcile sales, settlements and bank receipts, or attach the matching reports.",
    requestExample:
      "Match September sales with the settlement reports and bank receipts.",
    does: "Match sales, settlement reports and bank receipts, with evidence for every difference.",
    prompt: "Reconcile September",
    inputs: [
      "Sales reports for an outlet and period",
      "Settlement reports and the matching bank statement",
      "Approved reconciliation policy for the company",
    ],
    procedure: [
      "Confirm the period and review the company's reconciliation policy.",
      "Identify reports, check coverage and compare with existing entries.",
      "Match sales to settlements, then settlements to bank receipts.",
      "Explain differences and prepare a register for your sign-off.",
    ],
    policy:
      "Company policy is versioned and effective-dated. If it has not been approved, Neo asks you to review it before reconciling. Saved matching rules belong to this company.",
    exceptions:
      "Missing reports, unmatched receipts and unexplained differences remain visible. Questions are raised where the evidence cannot settle a match.",
    output:
      "A reconciliation register, evidence for differences, and drafts in Sales and Banking.",
    completion:
      "Every included line has a match or an explicit exception; confirmed entries are handed over as drafts.",
    approval:
      "You approve the company policy and confirm draft creation. Posting stays in Sales and Banking.",
    workspace: { label: "Banking", href: "/inbox?module=BANK" },
    execution: "on-request",
    example:
      "Demonstrates matching with September sample reports. Reconciliation closeout is a separate follow-up, not a full month-end close.",
  },
  {
    id: "chase",
    version: 1,
    taskId: "chase",
    slash: "chase",
    name: "Supplier follow-up",
    when: "You ask for a missing supplier detail, a clearer bill or a credit note.",
    requestExample:
      "Use the supplier follow-up procedure to ask for a clearer copy of this bill.",
    does: "Prepare a specific request for a missing detail or document, linked to the supplier's bill.",
    prompt: "Follow up with a supplier",
    inputs: [
      "An open supplier bill",
      "The missing detail or document",
      "A verified supplier email or WhatsApp number, if sending",
    ],
    procedure: [
      "Select the bill and confirm what is missing.",
      "Check for an existing request to avoid asking twice.",
      "Confirm the supplier's contact and draft the message.",
      "Let you review the message, then record the request against the bill.",
    ],
    policy:
      "Use the supplier contact from the bill's email or vendor master. A teammate who forwarded a bill is not treated as the supplier.",
    exceptions:
      "If a contact is missing, add one or copy the draft. An existing unanswered request is surfaced instead of sending a duplicate.",
    output:
      "An editable message draft and, after confirmation, a request linked to the bill.",
    completion:
      "The draft is handed over or the confirmed request is recorded. A supplier reply is a separate event.",
    approval:
      "You review the recipient and message before sending. Nothing is sent automatically.",
    workspace: { label: "Inbox", href: "/inbox" },
    execution: "on-request",
    example:
      "Uses open bills in the selected company. Sending is simulated; no external message leaves the prototype.",
  },
  {
    id: "journal",
    version: 1,
    taskId: "journal",
    slash: "journal",
    name: "Journal entries",
    does: "Prepare balanced journals for accruals, depreciation and other adjustments.",
    when: "You ask Neo to prepare an accounting adjustment.",
    requestExample: "Book depreciation of ₹12,000 on office equipment",
    prompt: "Book depreciation of ₹12,000 on office equipment",
    inputs: [
      "Adjustment amount and accounting period",
      "Debit and credit accounts, with supporting details",
    ],
    procedure: [
      "Identify the adjustment and confirm its amount and date.",
      "Choose debit and credit accounts from the available ledgers.",
      "Check that the journal balances and show its narration.",
      "Prepare the journal for your review.",
    ],
    policy:
      "Use the selected company’s records and your explicit instructions. Surface missing evidence before proceeding.",
    exceptions:
      "Missing records, ambiguous matches and incomplete instructions are shown for review rather than assumed.",
    output: "A balanced journal draft with its supporting details.",
    completion:
      "The result and any unresolved items are presented for your review.",
    approval:
      "You review proposed entries, changes or messages before they are applied. Analysis does not change your books.",
    workspace: {
      label: "Inbox",
      href: "/inbox",
    },
    execution: "on-request",
    example:
      "Uses the available records and deterministic workflows in this prototype.",
  },
  {
    id: "collections",
    version: 1,
    taskId: "collections",
    slash: "reminders",
    name: "Collection reminders",
    does: "Draft payment reminders for overdue invoices, ready for your approval.",
    when: "You ask Neo to follow up on unpaid customer invoices.",
    requestExample: "Draft collection reminders",
    prompt: "Draft collection reminders",
    inputs: ["Outstanding customer invoices", "Verified customer contacts"],
    procedure: [
      "Identify overdue invoices and outstanding balances.",
      "Group the invoices by customer.",
      "Prepare a reminder with the invoice details.",
      "Ask you to review the recipient and message.",
    ],
    policy:
      "Use the selected company’s records and your explicit instructions. Surface missing evidence before proceeding.",
    exceptions:
      "Missing records, ambiguous matches and incomplete instructions are shown for review rather than assumed.",
    output: "Customer reminder drafts linked to outstanding invoices.",
    completion:
      "The result and any unresolved items are presented for your review.",
    approval:
      "You review proposed entries, changes or messages before they are applied. Analysis does not change your books.",
    workspace: {
      label: "Inbox",
      href: "/inbox",
    },
    execution: "on-request",
    example: "Sending is simulated; no external message leaves the prototype.",
  },
  {
    id: "receivables",
    version: 1,
    taskId: "ask-books",
    slash: "receivables",
    name: "Receivables review",
    does: "See outstanding balances and overdue invoices, with the records behind them.",
    when: "You ask Neo to review customer balances or overdue invoices.",
    requestExample: "Who owes us money?",
    prompt: "Who owes us money?",
    inputs: ["Customer invoices, due dates and recorded receipts"],
    procedure: [
      "Read the receivables for the selected company.",
      "Calculate outstanding amounts from the available records.",
      "Highlight overdue balances and the related invoices.",
      "Show the source records for follow-up.",
    ],
    policy:
      "Use the selected company’s records and your explicit instructions. Surface missing evidence before proceeding.",
    exceptions:
      "Missing records, ambiguous matches and incomplete instructions are shown for review rather than assumed.",
    output: "A summary of outstanding and overdue customer balances.",
    completion:
      "The result and any unresolved items are presented for your review.",
    approval:
      "You review proposed entries, changes or messages before they are applied. Analysis does not change your books.",
    workspace: {
      label: "Inbox",
      href: "/inbox",
    },
    execution: "on-request",
    example:
      "Uses the available records and deterministic workflows in this prototype.",
  },
  {
    id: "reclassify",
    version: 1,
    taskId: "change-by-rule",
    slash: "reclassify",
    name: "Ledger reclassification",
    does: "Review and correct account mappings across a group of bills.",
    when: "You ask Neo to change the ledger used on a group of bills.",
    requestExample:
      "Move all Mahindra Logistics bills from Transportation to Freight Inward",
    prompt:
      "Move all Mahindra Logistics bills from Transportation to Freight Inward",
    inputs: [
      "The bills or supplier to update",
      "Current and destination accounts",
    ],
    procedure: [
      "Confirm the scope and destination ledger.",
      "Find eligible bills matching your instruction.",
      "Show the proposed changes and excluded records.",
      "Apply only the changes you confirm.",
    ],
    policy:
      "Use the selected company’s records and your explicit instructions. Surface missing evidence before proceeding.",
    exceptions:
      "Missing records, ambiguous matches and incomplete instructions are shown for review rather than assumed.",
    output: "A reviewed set of account corrections and a record of changes.",
    completion:
      "The result and any unresolved items are presented for your review.",
    approval:
      "You review proposed entries, changes or messages before they are applied. Analysis does not change your books.",
    workspace: {
      label: "Inbox",
      href: "/inbox",
    },
    execution: "on-request",
    example:
      "Uses the available records and deterministic workflows in this prototype.",
  },
  {
    id: "expenses",
    version: 1,
    taskId: "freight-insight",
    slash: "expenses",
    name: "Expense analysis",
    does: "Compare spending across periods and trace changes to the underlying bills.",
    when: "You ask Neo to explain a change in expenses between periods.",
    requestExample: "Why is freight up in September?",
    prompt: "Why is freight up in September?",
    inputs: [
      "Posted bills for the periods being compared",
      "An expense account to investigate",
    ],
    procedure: [
      "Collect the relevant posted bills for both periods.",
      "Compare totals and identify the largest movements.",
      "Trace differences to suppliers and source bills.",
      "Separate observed changes from possible explanations.",
    ],
    policy:
      "Use the selected company’s records and your explicit instructions. Surface missing evidence before proceeding.",
    exceptions:
      "Missing records, ambiguous matches and incomplete instructions are shown for review rather than assumed.",
    output: "A period comparison with supporting bills and explanations.",
    completion:
      "The result and any unresolved items are presented for your review.",
    approval:
      "You review proposed entries, changes or messages before they are applied. Analysis does not change your books.",
    workspace: {
      label: "Inbox",
      href: "/inbox",
    },
    execution: "on-request",
    example:
      "The prototype demonstrates expense analysis using freight spending across its sample periods.",
  },
  {
    id: "tax-credit",
    version: 1,
    taskId: "itc-risk",
    slash: "tax-credit",
    name: "Input tax credit review",
    does: "Highlight purchase tax-credit discrepancies that need a closer look.",
    when: "You ask Neo to review input tax credit discrepancies.",
    requestExample: "Check Q2 ITC that needs review",
    prompt: "Check Q2 ITC that needs review",
    inputs: ["Purchase records and available GST reconciliation data"],
    procedure: [
      "Compare the available purchase and tax reconciliation records.",
      "Identify unmatched or inconsistent entries.",
      "Group exceptions with the evidence available.",
      "Present the items that need an accountant’s review.",
    ],
    policy:
      "Use the selected company’s records and your explicit instructions. Surface missing evidence before proceeding.",
    exceptions:
      "Missing records, ambiguous matches and incomplete instructions are shown for review rather than assumed.",
    output: "A list of tax-credit exceptions and supporting records.",
    completion:
      "The result and any unresolved items are presented for your review.",
    approval:
      "You review proposed entries, changes or messages before they are applied. Analysis does not change your books.",
    workspace: {
      label: "Inbox",
      href: "/inbox",
    },
    execution: "on-request",
    example:
      "The prototype reviews the available Q2 GST sample records. It does not file a return.",
  },
];

export const skillById = (id: string) =>
  SKILLS.find((skill) => skill.id === id);
export const skillForTask = (taskId: string) =>
  SKILLS.find((skill) => skill.taskId === taskId);
