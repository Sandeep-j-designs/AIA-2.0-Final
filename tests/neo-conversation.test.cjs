const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const jiti = require("jiti")(__filename, {
  alias: { "@": path.resolve(__dirname, "..") },
});
const topics = jiti("../config/pages/neo/conversation.ts");
const period = jiti("../utils/pages/neo/period.ts");
const row = (id, company, route, status, amount, date = "15 Sep 26") => ({
  id,
  company,
  route,
  status,
  amount: amount * 1.18,
  form: {
    party: id,
    date,
    invoiceNo: id,
    lines: [{ ledger: "Services", amount }],
  },
});
const records = [
  row("sale", "a", "AR", "Approved", 100),
  row("draft", "a", "AR", "Needs Review", 900),
  row("purchase", "a", "AP", "Approved", 40),
  row("other", "b", "AR", "Approved", 99999),
  { ...row("prior", "a", "AR", "Approved", 800), priorVoucher: true },
];
const state = {
  company: "a",
  companies: [
    { id: "a", name: "Acme Foods" },
    { id: "b", name: "Apex Manufacturing" },
  ],
  items: records,
};
const code = ts.transpileModule(
  fs.readFileSync("config/pages/neo/tasks/conversation.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }
).outputText;
const out = {};
new Function("require", "exports", code)((name) => {
  if (name.includes("/store")) return { getState: () => state };
  if (name === "../conversation") return topics;
  if (name.endsWith("/period")) return period;
  if (name === "./shared")
    return { refTo: (x) => ({ itemId: x.id, label: x.id }) };
  if (name === "@/utils/pages/neo") return { money: (n) => `INR ${n}` };
  throw Error(name);
}, out);
const task = out.default;
async function run(prompt, history = []) {
  const texts = [],
    links = [],
    cards = [],
    suggestions = [];
  const api = {
    prompt,
    history,
    context: { company: "a", selectedIds: [] },
    say: async (t, l) => {
      texts.push(t);
      links.push(...(l || []));
    },
    step: async () => () => {},
    wait: async () => {},
    show: (c) => cards.push(c),
    suggest: (s) => suggestions.push(...s),
    chain: async (p) => texts.push(...(await run(p, history)).texts),
  };
  await task.run(api);
  return { texts, links, cards, suggestions };
}
(async () => {
  for (const t of topics.ACCOUNTING_TOPICS) {
    assert(task.match("Explain " + t.title, {}, []) > 0);
    const a = await run("Explain " + t.title);
    assert(a.texts.length);
  }
  let a = await run("Show revenue");
  assert.match(a.texts.join(" "), /INR 100/);
  assert.deepEqual(
    a.links.map((x) => x.itemId),
    ["sale"]
  );
  a = await run("Which bills need review?");
  assert.deepEqual(
    a.links.map((x) => x.itemId),
    ["draft"]
  );
  a = await run("Show September sales");
  assert.deepEqual(
    a.links.map((x) => x.itemId),
    ["sale"]
  );
  a = await run("Show expense breakdown");
  assert.match(a.texts.join(" "), /INR 40/);
  assert.equal(a.cards[0].groups[0].rows.length, 1);
  a = await run("Show my pending approvals");
  assert.match(a.texts.join(" "), /1 documents/);
  assert.deepEqual(
    a.links.map((x) => x.itemId),
    ["draft"]
  );
  a = await run("What is our net profit?");
  assert.match(a.texts.join(" "), /not net profit/);
  assert.equal(a.cards.length, 0);
  a = await run("Make it simpler", [
    { role: "user", text: "Explain accrual accounting" },
    { role: "neo", text: "A long explanation" },
  ]);
  assert.match(a.texts.join(" "), /Under accrual accounting/);
  a = await run("Show the sources", [
    { role: "user", text: "Explain accrual accounting" },
    { role: "neo", text: "Example" },
  ]);
  assert.match(a.texts.join(" "), /only examples/);
  a = await run("And August?", [
    { role: "user", text: "Show revenue for September" },
    { role: "neo", text: "September figures" },
  ]);
  assert.match(a.texts.join(" "), /August/);
  a = await run("Compare revenue in August and September");
  assert.match(a.texts.join(" "), /Check for missing invoices/);
  a = await run("Check my accounts");
  assert.match(a.texts.join(" "), /What would you like to check/);
  a = await run("hello");
  assert.match(a.texts.join(" "), /Acme Foods/);
  assert.equal(task.match("Explain accrual", {}, [{ name: "bill.pdf" }]), 0);
  const { pickTask } = jiti("../config/pages/neo/tasks/index.ts");
  for (const [prompt, id] of [
    ["Who owes us money?", "ask-books"],
    ["Book depreciation of ₹12,000 on office equipment", "journal"],
    ["Set up document collection", "collection-setup"],
    ["Reconcile September", "recon-run"],
    ["Explain depreciation", "conversation"],
  ])
    assert.equal(
      pickTask(prompt, { company: "shakun", selectedIds: [] }).id,
      id
    );
  console.log(
    "PASS: accounting concepts, company isolation, approved-only totals, excluded prior vouchers, source links, missing-data boundaries, follow-ups, comparisons, and clarification."
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
