# Neo copy guide

Write for an accountant who wants to finish a task quickly. Use plain English without talking down to the reader.

## Rules

- Say what happened, what the user needs to do, and what happens next.
- Use short sentences. Put one instruction in each sentence.
- Use familiar accounting terms: bill, invoice, supplier, customer, ledger, GST, TDS, journal and approval.
- Explain an unfamiliar term when it first appears. Do not replace an accurate accounting term with an inaccurate everyday word.
- Ask a complete question: “Which supplier’s bills should I change?” rather than “Whose bills?”
- Name the action on the button: “Create draft”, “Preview entries”, “Find matching bills”, “Save and turn on”.
- Separate preparation from approval, posting and sending. Do not imply that a draft has been posted.
- Keep the company, period, tax basis and record status clear in numerical answers.
- Say “No matching records found” when data is missing. Do not claim the balance is zero.
- Label example amounts as examples. Keep simulated sending and demo limitations visible.
- For an error, explain the problem and the next step. Avoid technical implementation details.
- Avoid slogans, clever phrases and unnecessary references to AI.

## Preferred wording

| Avoid | Use |
| --- | --- |
| Sign-off | Approval |
| Dry run | Preview results |
| Chase a vendor | Follow up with a supplier |
| Backfill | Collect earlier files for the selected dates |
| Findings | Issues to review |
| Scoped sources | Connected accounts |
| Works from | Needs |
| What Neo has learned | Saved rules |
| Held for you | Needs your review |
| Submit and create the draft | Create draft |
| How far may it go? | What should Neo do when it finds an issue? |
| Outstanding nets off part-payments | Amount due after deducting part payments |
| Illustrative example / practical application | Example |

## Examples

**Before:** “Proves POS sales against settlement reports and the bank, then drafts the vouchers.”

**After:** “Match sales with settlement reports and bank receipts. Prepare entries for any differences.”

**Before:** “A prepayment is a payment for a benefit you will receive over future periods.”

**After:** “A prepaid expense is an amount paid now for a future period.”

**Before:** “Nothing drafted, and nothing learned: rules only come from runs you sign off.”

**After:** “No drafts or rules were saved. Approve your choices to save them.”

## Implementation boundaries

Change display copy without renaming task IDs, action IDs, status values, stored fields or slash commands. Keep existing prompt routing intact. If a new example question appears in the UI, verify that typing it opens the intended task.
