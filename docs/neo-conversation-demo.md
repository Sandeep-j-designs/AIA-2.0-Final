# Neo: conversational accounting prototype

## Purpose and scope

Make Neo feel like a useful accounting colleague: answer a direct question, explain the scope, offer evidence, and handle the next question without forcing the user into a menu. This version is a curated, deterministic simulation, not a connected LLM. Streaming is simulated. Company figures are calculated from local prototype records; explanations and examples are authored content. No external payment, filing, or message is sent by the new conversational layer.

Work only in **AIA 2.0 - Copy**. Start with `npm run dev`, then open `http://127.0.0.1:3001/inbox?module=NEO`.

## Conversation contract

- Lead with the answer. Use short paragraphs for explanations and tables for comparisons.
- State company, date range, tax basis, and record status for numerical answers.
- Distinguish invoice activity, recognised income, outstanding balances, and cash.
- Link the source documents. Never invent a cash balance, profit, tax rate, or missing record.
- Treat example amounts as illustrative; never present them as company transactions.
- Clarify an ambiguous task with concrete choices. Let the user type or select a suggestion.
- Preserve existing draft, review, approval, cancellation, and undo flows.
- Keep company boundaries. Ask the user to change organisations before accessing another company's records.
- A new topic should not silently carry an old vendor or date filter.
- After an answer, suggest two or three useful next questions rather than making the user guess the exact wording.

## Main demo script: 10–12 minutes

Start in **Acme Foods**, on Neo → New chat. Figures vary with local edits; validate the source rows rather than memorising fixed totals.

### Scene 1 — Natural introduction

**User:** Hi Neo.

**Neo:** Introduces itself in the context of Acme Foods, explains the available accounting support, and offers financial snapshot, close checklist, and accounting explanation prompts.

**User:** Give me a financial snapshot.

**Neo:** Streams a company-specific answer, with approved sales before tax, approved purchases before tax, review count, and possible duplicate count. States that these are prototype invoice measures, not a full P&L. Shows linked source documents.

**User:** Show the sources.

**Neo:** Explains the evidence basis and retains document links. Click a link to inspect the record, then return to chat.

**What this demonstrates:** Natural opening, company context, streaming, tabular answers, evidence, and follow-up continuity.

### Scene 2 — Explore a period

**User:** Show revenue for September.

**Neo:** Totals approved sales invoice lines before tax for September. Identifies the number of matching invoices and excludes drafts, review items, prior vouchers, and other companies.

**User:** And August?

**Neo:** Repeats the same analysis for August. If no records match, says no matching records exist in the prototype instead of asserting the company had no revenue.

**User:** Compare revenue in August and September.

**Neo:** Shows both periods, amounts, and invoice counts. Only calculates a percentage movement when the comparison has usable records and a nonzero starting value.

**User:** Make it shorter.

**Neo:** Returns a compact version with the same scope and figures.

**What this demonstrates:** Period follow-ups, comparison, concise answers, and honest empty-data handling.

### Scene 3 — Review priorities

**User:** Show my pending approvals.

**Neo:** Shows review documents, their combined document value including applicable tax, and the possible duplicate count. Presents source records for inspection. Does not approve them.

**User:** Show duplicate bills.

**Neo:** Shows only flagged records and explains that a flag needs investigation.

**User:** Explain duplicate invoices.

**Neo:** Explains the matching criteria and why similar amounts alone are insufficient evidence.

**What this demonstrates:** Moving from analysis to explanation without changing records.

### Scene 4 — Learn while working

**User:** Explain accrual accounting with an example.

**Neo:** Explains when income and expense are recognised, then uses an explicitly illustrative September bill paid in October.

**User:** Make it simpler.

**Neo:** Keeps the topic and gives the shorter explanation.

**User:** Give me an example.

**Neo:** Returns the illustrative example for accrual accounting.

**User:** Put that in a table.

**Neo:** Formats the concept and example as a table.

**User:** Show the sources.

**Neo:** Explains that the amounts were examples, not company records.

**What this demonstrates:** Multi-turn explanations, response formatting, and distinction between knowledge and evidence.

### Scene 5 — Prepare for close

**User:** Give me a month-end close checklist.

**Neo:** Lists completeness/cut-off, banking, receivables/payables, adjustments, tax controls, trial balance review, and reviewer sign-off.

**User:** What is a prepaid expense?

**Neo:** Explains the asset-to-expense treatment with an illustrative annual insurance example.

**User:** Book depreciation of ₹12,000 on office equipment.

**Neo:** Enters the existing journal workflow, asks for missing details, and prepares the balanced entry for review. Demonstrate the preview and cancellation; do not imply it is already posted.

**What this demonstrates:** Knowledge, task switching, clarification, and approval boundaries.

### Scene 6 — Existing accounting workflows

Start a new chat if a previous workflow is waiting for approval.

**User:** How much did we spend with Mahindra Logistics in September?

**Neo:** Uses the existing vendor-spend workflow, shows booked versus waiting figures and supporting bills.

**User:** Only the open ones.

**Neo:** Retains the vendor and period, narrows to review items, and states its interpretation.

In a new chat:

**User:** Who owes us money?

**Neo:** Uses the existing overdue-invoice workflow and offers to draft reminders. Review the draft instead of sending an external message.

**What this demonstrates:** Existing deeper workflows remain available alongside the broader conversational layer.

### Scene 7 — Boundaries that build trust

**User:** What is our bank balance?

**Neo:** Explains that invoice totals cannot establish a bank balance and names the missing opening balances and complete bank activity.

**User:** What is our net profit?

**Neo:** Explains that a complete trial balance and adjustments are required; does not subtract purchases from sales and call it profit.

**User:** Check my accounts.

**Neo:** Clarifies whether the user means sales, purchases, or review documents, with clickable suggestions.

**User:** Write a holiday itinerary.

**Neo:** Explains the prototype's accounting scope and requests a supported subject. Does not pretend to have general web or live-model access.

## Question bank

### Company analysis — new conversational handlers

1. Give me a financial snapshot.
2. Show a financial summary.
3. Give me a business overview.
4. Show revenue for September.
5. What was our revenue last month?
6. Show total sales this FY.
7. Show total purchases for September.
8. Show total spend this quarter.
9. Show an expense breakdown.
10. Show purchase summary for August.
11. Show my pending approvals.
12. Show the review queue.
13. Show duplicate bills.
14. Show duplicate invoices for September.
15. Compare revenue in August and September.
16. Compare purchases in August and September.
17. And August? — after a period analysis.
18. What about September? — after a period analysis.
19. I meant August. — correct the period of the previous analysis.
20. Show the sources.

### Accounting knowledge — new curated explanations

21. Explain accrual accounting.
22. What is the difference between cash basis and accrual accounting?
23. What is a prepaid expense?
24. Explain depreciation with an example.
25. What is capital expenditure?
26. Explain capex versus opex.
27. Explain debits and credits.
28. What is double-entry accounting?
29. What is a trial balance?
30. What is working capital?
31. What is the current ratio?
32. Explain profit versus cash.
33. What is bank reconciliation?
34. Explain three-way matching.
35. What is a credit note?
36. Explain debit notes.
37. Explain accounts payable versus receivable.
38. Give me a month-end close checklist.
39. What is input tax credit?
40. Explain GST.
41. What is TDS?
42. Explain duplicate invoices.

These are conceptual explanations, not current-law determinations. Neo deliberately does not prescribe tax rates, filing dates, or legal eligibility.

### Everyday conversation and follow-ups

43. Hi Neo.
44. What can you do?
45. Who are you?
46. Thank you.
47. Make it simpler.
48. Explain that simply.
49. Give me an example.
50. Put that in a table.
51. Summarise that.
52. Make it shorter.
53. Where did those numbers come from?
54. Check my accounts.

### Existing workflows retained

55. How much did we spend with Mahindra Logistics in September?
56. Who are my top vendors?
57. Only the open ones. (After vendor-spend analysis.)
58. Which vendors aren't in my masters?
59. Who owes us money?
60. Draft collection reminders.
61. Enter a batch of bills with an instruction.
62. Book depreciation of ₹12,000 on office equipment.
63. Move all Mahindra Logistics bills from Transportation to Freight Inward.
64. Ask the vendor for their GSTIN.
65. Create a sales invoice from a purchase.
66. What needs me today?
67. Set up the Bill validator to run automatically.
68. Set up document collection.
69. Reconcile September. (Use Summit Hospitality.)
70. Close September with the 1–7 Oct statement. (Use Summit Hospitality and the required reconciliation state.)

### Missing-data and unsupported-action cases

71. What is our cash balance?
72. Forecast our runway.
73. What is our net profit?
74. Show our balance sheet.
75. Calculate EBITDA.
76. File our GST return.
77. Make a payment to a supplier.
78. Show revenue for January 2030.
79. Compare revenue. (Neo asks for two months.)
80. Ask about another organisation while the current company is selected. (Neo requests an organisation switch.)

### Additional accounting explanations

81. What is a journal entry?
82. Explain revenue recognition.
83. What is receivables ageing?
84. Explain inventory and cost of goods sold.
85. What is a provision?

## Implemented mechanics

- `config/pages/neo/conversation.ts`: authored topic library, examples, follow-up recognition, home starters.
- `config/pages/neo/tasks/conversation.ts`: low-priority fallback plus higher-priority conceptual and analytical handlers.
- Existing task registry still handles operational workflows. Concept questions win over accidental matches on words like “depreciation”.
- Recent chat turns are supplied to the task API; repeated explanation follow-ups preserve the original topic.
- Analytical results read the current company store. No fixed company amount is embedded in these answers.
- Existing streaming, stop, markdown tables, source cards, and suggested prompt controls are reused.
- Home starters expose the broader conversation range without adding another navigation mode.

## Validation and known limits

Automated checks cover company isolation, approved-only totals, exclusion of prior vouchers, evidence links, concept follow-ups, period corrections, absent-data comparisons, and attachments not being intercepted by the new handler. Browser checks cover typed prompts, streaming completion, follow-ups, tables, and mobile layout.

This is still a finite prototype. Paraphrases outside the supported patterns receive clarification; arbitrary multi-part questions, unrestricted reasoning, live research, arbitrary document understanding, and financial forecasts require a real model and appropriate data tools. A production implementation should keep server-side authorisation, company scoping, validation, idempotent writes, and explicit approval gates, while replacing intent matching with model tool selection.
