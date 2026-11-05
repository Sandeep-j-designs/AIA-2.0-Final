const assert = require('node:assert/strict');
const path = require('node:path');
const jiti = require('jiti')(__filename, { alias: { '@': path.resolve(__dirname, '..') } });
const { MOCK_INBOX_ITEMS, SAHYADRI_FIRST_BILL } = jiti('../config/pages/inbox/mock-inbox.ts');
const { AI_DOCUMENTS } = jiti('../config/pages/inbox/mock-ai-documents.ts');
const { mockAutoApprovalBills } = jiti('../config/pages/inbox/mock-trust.ts');
const { MOCK_CUSTOMER_PO } = jiti('../config/pages/inbox/mock-purchase-order.ts');
const { MOCK_DASHBOARD } = jiti('../config/pages/inbox/mock-dashboard.ts');
const near = (actual, expected, message) => assert(Math.abs(actual - expected) < 0.011, `${message}: ${actual} ≠ ${expected}`);
let checked = 0;
for (const item of [...MOCK_INBOX_ITEMS, SAHYADRI_FIRST_BILL, MOCK_CUSTOMER_PO, ...AI_DOCUMENTS.map(x => x.item), ...mockAutoApprovalBills().map(x => x.bill)]) {
  const document = item.bill || item.invoice;
  if (document) {
    for (const line of document.items) {
      if (line.qty != null && line.rate != null) near(line.qty * line.rate, line.amount, `${item.id} quantity × rate`);
    }
    near(document.items.reduce((n, line) => n + line.amount, 0), document.subTotal, `${item.id} subtotal`);
    near(document.subTotal + Object.values(document.taxes).reduce((n, value) => n + value, 0), document.grandTotal, `${item.id} taxes`);
    if (item.amount != null) near(item.amount, document.grandTotal, `${item.id} inbox total`);
    checked++;
  }
  if (item.jv) near(item.jv.lines.reduce((n, line) => n + (line.dr || 0) - (line.cr || 0), 0), 0, `${item.id} journal balance`);
}
assert.equal(MOCK_CUSTOMER_PO.invoice.items[0].qty, 2000);
assert.equal(MOCK_CUSTOMER_PO.amount, 4515000);
for (const company of MOCK_DASHBOARD) {
  assert(company.postings.filter(p => p.kind === 'revenue').every(p => p.amount >= 270000000));
}
console.log(`PASS: ${checked} enterprise source documents reconcile; journals balance; bulk order and enterprise revenue fixtures verified.`);
