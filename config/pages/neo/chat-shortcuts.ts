/** Queries, one-off actions and setup shortcuts remain available in chat.
 * Procedure shortcuts are overridden by the shared skill contract. */
export type ChatShortcut = {
  id: string;
  slash: string;
  name: string;
  prompt: string;
};

export const CHAT_SHORTCUTS: ChatShortcut[] = [
  {
    id: "recon",
    slash: "recon",
    name: "Reconcile sales and bank receipts",
    prompt: "Reconcile September",
  },
  {
    id: "close",
    slash: "close",
    name: "Close reconciliation exceptions",
    prompt: "Close September with the 1–7 Oct statement",
  },
  {
    id: "bills",
    slash: "bills",
    name: "Enter multiple bills",
    prompt: "Enter a batch of bills with an instruction",
  },
  {
    id: "invoice",
    slash: "invoice",
    name: "Create a sales invoice from a purchase",
    prompt: "Create a sales invoice from a purchase",
  },
  {
    id: "journal",
    slash: "journal",
    name: "Create a journal entry",
    prompt: "Book a journal",
  },
  {
    id: "move",
    slash: "move",
    name: "Change the ledger on multiple bills",
    prompt: "Move all ",
  },
  {
    id: "collect",
    slash: "collect",
    name: "Collect bills",
    prompt: "Set up document collection",
  },
  {
    id: "chase",
    slash: "chase",
    name: "Follow up with a supplier",
    prompt: "Ask the vendor for their GSTIN",
  },
  {
    id: "remind",
    slash: "remind",
    name: "Send payment reminders",
    prompt: "Draft collection reminders",
  },
  {
    id: "validate",
    slash: "validate",
    name: "Set up bill checks",
    prompt: "Set up the Bill validator to run automatically",
  },
  {
    id: "duplicates",
    slash: "duplicates",
    name: "Set up duplicate checks",
    prompt: "Set up the Duplicate finder to run automatically",
  },
  {
    id: "gst",
    slash: "gst",
    name: "Set up GST checks",
    prompt: "Set up the GST checker to run automatically",
  },
  {
    id: "tds",
    slash: "tds",
    name: "Configure TDS checks",
    prompt: "Edit agent TDS deduction check",
  },
  {
    id: "bank",
    slash: "bank",
    name: "Set up bank mismatch checks",
    prompt: "Set up the Bank mismatch review to run automatically",
  },
  {
    id: "spend",
    slash: "spend",
    name: "Check purchase totals",
    prompt: "How much did we spend with ",
  },
  {
    id: "owes",
    slash: "owes",
    name: "Check overdue customer payments",
    prompt: "Who owes us money?",
  },
  {
    id: "masters",
    slash: "masters",
    name: "Find suppliers missing from masters",
    prompt: "Which vendors aren't in my masters?",
  },
  {
    id: "today",
    slash: "today",
    name: "Check pending work",
    prompt: "What needs me today?",
  },
];
