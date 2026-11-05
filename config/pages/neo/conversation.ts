/** Curated conversational prototype. No external model or fabricated ledger balances. */
export const ACCOUNTING_TOPICS = [
  {
    id: "journal",
    test: /journal entr|journal voucher/,
    title: "Journal entries",
    answer:
      "A journal entry records a transaction in your accounts. It has a date, a reason, and equal debit and credit amounts. Use it for entries such as depreciation and unpaid expenses.",
    example:
      "Example only: for an unpaid expense of ₹12,000, debit the expense and credit accrued liabilities. Check the month, ledgers and supporting documents before posting.",
    next: "Explain debits and credits",
  },
  {
    id: "revenue",
    test: /revenue recognition|recognis.*revenue|recogniz.*revenue/,
    title: "Revenue recognition",
    answer:
      "Record revenue when it is earned under your accounting policy. The invoice date or payment date alone may not be enough. Check what was delivered and what the contract says.",
    example:
      "Example only: a customer pays in advance for work due next month. You may need to record the advance as a liability until the work is done.",
    next: "Explain profit versus cash",
  },
  {
    id: "aging",
    test: /ageing|aging/,
    title: "Receivables ageing",
    answer:
      "An ageing report shows how long customer payments have been overdue. Use it to decide whom to follow up with first.",
    example:
      "Group unpaid amounts into current, 1–30, 31–60, 61–90 and over 90 days overdue. Count from the due date and subtract payments already received against each invoice.",
    next: "Who owes us money?",
  },
  {
    id: "inventory",
    test: /inventory|cost of goods|cogs/,
    title: "Inventory and cost of goods sold",
    answer:
      "Inventory means stock held for sale or production. Cost of goods sold is the cost of the goods you sold. You need stock records as well as purchase bills to calculate it.",
    example:
      "Example only: opening stock of ₹10 lakh + purchases of ₹8 lakh − closing stock of ₹6 lakh = ₹12 lakh of goods used or sold. Other production costs and adjustments may also apply.",
    next: "What is a trial balance?",
  },
  {
    id: "provision",
    test: /provision|contingent liability/,
    title: "Provisions",
    answer:
      "A provision is an amount recorded for an obligation when the exact amount or payment date is uncertain. Check that it meets your accounting rules before recording it.",
    example:
      "For example, estimate the cost of warranty claims using past claims and current information. Record how you calculated it and get it reviewed.",
    next: "Explain accrual accounting",
  },
  {
    id: "accrual",
    test: /accrual|cash basis|cash vs|cash versus/,
    title: "Accrual versus cash accounting",
    answer:
      "Under accrual accounting, record income when earned and expenses when they arise. Under cash accounting, record them when money is received or paid.",
    example:
      "Example only: a ₹60,000 bill for September services is paid in October. Under accrual accounting, book the expense in September. The October payment clears the amount payable; do not book the expense again.",
    next: "What is a prepaid expense?",
  },
  {
    id: "prepaid",
    test: /prepaid|prepayment/,
    title: "Prepaid expenses",
    answer:
      "A prepaid expense is an amount paid now for a future period. Keep the unused amount as an asset. Transfer it to expense as you use the service.",
    example:
      "Example only: annual insurance costs ₹1,20,000. If spread equally over 12 months, the monthly expense is ₹10,000. First debit prepaid insurance and credit bank. Each month, debit insurance expense and credit prepaid insurance.",
    next: "Explain accrual accounting",
  },
  {
    id: "depreciation",
    test: /depreciation|fixed asset/,
    title: "Depreciation",
    answer:
      "Depreciation spreads the cost of an asset over the years you use it. It reduces profit, but does not involve a new payment each month or year.",
    example:
      "Example only: an asset costs ₹6,00,000, has no expected resale value and will be used for five years. Straight-line depreciation is ₹1,20,000 a year. Debit depreciation expense and credit accumulated depreciation. Use the life and method required by your accounting policy.",
    next: "What is capital expenditure?",
  },
  {
    id: "capex",
    test: /capex|opex|capital expenditure|revenue expenditure|capitalise|capitalize/,
    title: "Capital versus operating expenditure",
    answer:
      "Capital expenditure is money spent to buy or improve a long-term asset. Operating expenditure is the cost of running the business day to day. Follow your accounting policy when deciding which to use.",
    example:
      "Buying a machine may be a fixed asset purchase. Routine servicing is usually an expense. For a major upgrade, check whether it adds future benefits before deciding how to record it.",
    next: "Explain depreciation",
  },
  {
    id: "debit",
    test: /debit.*credit|credit.*debit|double.entry/,
    title: "Debits and credits",
    answer:
      "Every journal entry must have equal debits and credits. A debit usually increases an asset or expense. A credit usually increases a liability, capital or income.",
    example:
      "Example only, before tax: for a ₹25,000 service bill, debit the expense and credit the supplier payable. When you pay, debit the supplier payable and credit bank.",
    next: "What is a trial balance?",
  },
  {
    id: "trial",
    test: /trial balance/,
    title: "Trial balance",
    answer:
      "A trial balance lists ledger balances. Total debits should equal total credits. Even when they match, an entry may still be missing or posted to the wrong ledger.",
    example:
      "For example, a repair posted to the equipment ledger instead of repairs expense can still balance. Check the ledger, date and supporting bill.",
    next: "Give me a month-end close checklist",
  },
  {
    id: "working",
    test: /working capital|current ratio/,
    title: "Working capital",
    answer:
      "Working capital is current assets minus current liabilities. The current ratio is current assets divided by current liabilities. You need balance-sheet figures to calculate them.",
    example:
      "Example only: current assets of ₹50 lakh and current liabilities of ₹30 lakh give working capital of ₹20 lakh and a current ratio of 1.67. You may still face a cash shortage if customers pay late.",
    next: "Who owes us money?",
  },
  {
    id: "profit",
    test: /profit.*cash|cash.*profit|cash flow.*income/,
    title: "Profit is not cash",
    answer:
      "Profit is income minus expenses. Cash flow is money received minus money paid. They differ because invoices and payments often happen on different dates.",
    example:
      "Example only: a ₹2 lakh credit sale can increase revenue before the customer pays. Buying a machine uses cash now, but its cost may be charged as depreciation over several years.",
    next: "What is working capital?",
  },
  {
    id: "reconcile",
    test: /bank reconciliation|three.way match|three.way reconciliation/,
    title: "Reconciliation and matching",
    answer:
      "Bank reconciliation compares your bank statement with your books and explains any differences. Purchase three-way matching checks the purchase order, goods receipt and supplier invoice against each other.",
    example:
      "A bank charge on the statement but missing from the books needs an entry. A payment recorded in the books but not yet cleared by the bank may only be a timing difference.",
    next: "Give me a month-end close checklist",
  },
  {
    id: "notes",
    test: /credit note|debit note/,
    title: "Credit and debit notes",
    answer:
      "A credit note usually reduces an invoice, for example after a return or price reduction. A debit note records an extra charge or adjustment. Check who issued the note and why.",
    example:
      "Example only: a supplier reduces a ₹50,000 bill by ₹5,000. Link their credit note to the original bill and check the tax adjustment before posting.",
    next: "Explain accounts payable versus receivable",
  },
  {
    id: "ap-ar",
    test: /payable.*receivable|receivable.*payable|accounts payable|accounts receivable/,
    title: "Payables versus receivables",
    answer:
      "Accounts payable is money you owe suppliers. Accounts receivable is money customers owe you. Approving an invoice does not mean it has been paid.",
    example:
      "A purchase bill creates a supplier payable. A sales invoice creates a customer receivable. Match each payment to the correct invoice to reduce the balance.",
    next: "Who owes us money?",
  },
  {
    id: "close",
    test: /month.end|close checklist|closing checklist/,
    title: "Month-end close checklist",
    answer:
      "1. Check that all bills and invoices are entered in the correct month.\n2. Match bank and settlement records with the books.\n3. Check unpaid bills, customer dues and unmatched payments.\n4. Review accruals, prepayments, depreciation and stock adjustments.\n5. Check tax balances and resolve differences.\n6. Review the trial balance and unusual changes.\n7. Get approval before closing the month.",
    example:
      "Start with missing documents and unmatched transactions. Resolve important differences before posting final adjustments. Completing this checklist alone does not confirm that the books are correct.",
    next: "Show my pending approvals",
  },
  {
    id: "gst",
    test: /\bgst\b|\bitc\b|input tax credit/,
    title: "GST and input tax credit",
    answer:
      "GST is a tax on goods and services. Input tax credit (ITC) is eligible GST paid on purchases that can reduce GST payable on sales. Having a purchase bill does not automatically make the credit eligible.",
    example:
      "Check supplier details, the invoice, goods or services received, GST reconciliation and eligibility rules. Neo can show issues in this demo. It does not confirm legal eligibility or file returns.",
    next: "How much ITC is at risk in Q2?",
  },
  {
    id: "tds",
    test: /\btds\b|withholding/,
    title: "Tax deducted at source",
    answer:
      "TDS is tax deducted from certain payments and paid to the government on the recipient’s behalf. The rules depend on the payment, parties and applicable limits.",
    example:
      "Record the full expense, the net amount payable to the supplier and TDS payable separately. Check the applicable section and current rules before choosing a rate.",
    next: "Show my pending approvals",
  },
  {
    id: "duplicate",
    test: /duplicate invoice|duplicate bill/,
    title: "Checking duplicate bills",
    answer:
      "Check the supplier, invoice number, date, amount and bill copy. Two bills with the same amount are not always duplicates.",
    example:
      "The same bill may be uploaded under two filenames. Compare both copies and check whether either has already been posted before rejecting one.",
    next: "Show duplicate bills",
  },
];

export const NEO_CONVERSATION_STARTERS = [
  {
    label: "Understand the business",
    prompt: "Give me a financial snapshot",
    detail: "Sales, purchases, and review priorities",
  },
  {
    label: "Prepare for month-end",
    prompt: "Give me a month-end close checklist",
    detail: "A practical sequence for your close",
  },
  {
    label: "Explore your numbers",
    prompt: "Show revenue for September",
    detail: "Answers grounded in your invoices",
  },
  {
    label: "Learn as you work",
    prompt: "Explain accrual accounting with an example",
    detail: "Clear explanations, without the jargon",
  },
];

export const isExplanation = (p: string) =>
  /\b(explain|tell me about|what[’']s|what is|what are|what does|difference|how does|how do|teach|meaning|versus|vs|checklist)\b/i.test(
    p
  );
export const topicFor = (p: string) =>
  ACCOUNTING_TOPICS.find((t) => t.test.test(p.toLowerCase()));
export const isConversationFollowUp = (p: string) =>
  /^(make (it|that) (shorter|simpler)|shorter|simpler|summari[sz]e( that| it)?|explain (that|it)( simply)?|give (me )?(an? |another )?example|why does (that|it) matter|show (the )?sources|where (did|do).*numbers|put (that|it) in a table)[.!?]*$/i.test(
    p.trim()
  );
