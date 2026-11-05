import type { OpenDocument } from "@/types/pages/inbox/bank-automation";

/**
 * The unpaid sales invoices and purchase bills a bank line can be matched
 * to, per company. Every figure reconciles: total = taxable + GST, and
 * outstanding = total − what was received or paid before.
 *
 * DEV: GET /api/bank/transactions/:bankLineUuid/match-suggestions returns
 * the suggestion itself; these stand in for the receivables and payables it
 * is worked out from (GET /api/accounts-receivable/open-invoices and
 * GET /api/accounts-payable/open-bills).
 */
export const MOCK_OPEN_DOCUMENTS: OpenDocument[] = [
  /* ------------------------------------------- Apex Manufacturing */
  {
    // Machining job work for Tata Motors' Pimpri plant. Tata Motors deducts
    // TDS at 2% under 194C (Apex is a company), on the taxable value.
    id: "od-acme-118",
    company: "acme",
    kind: "invoice",
    number: "AM/26-27/118",
    party: "Tata Motors Ltd",
    date: "2026-09-12",
    taxable: 500000,
    gst: 90000,
    total: 590000,
    outstanding: 590000,
  },
  {
    id: "od-acme-121",
    company: "acme",
    kind: "invoice",
    number: "AM/26-27/121",
    party: "Cummins India Ltd",
    date: "2026-09-16",
    taxable: 100000,
    gst: 18000,
    total: 118000,
    outstanding: 118000,
  },
  {
    id: "od-acme-122",
    company: "acme",
    kind: "invoice",
    number: "AM/26-27/122",
    party: "Cummins India Ltd",
    date: "2026-09-19",
    taxable: 100000,
    gst: 18000,
    total: 118000,
    outstanding: 118000,
  },
  {
    // Paid in instalments: the first one is on the statement.
    id: "od-acme-0151",
    company: "acme",
    kind: "invoice",
    number: "ACM/26-27/0151",
    party: "Kirloskar Brothers Ltd",
    date: "2026-08-21",
    taxable: 240000,
    gst: 43200,
    total: 283200,
    outstanding: 283200,
  },
  {
    id: "od-acme-0142",
    company: "acme",
    kind: "invoice",
    number: "ACM/26-27/0142",
    party: "Thermax Ltd",
    date: "2026-08-04",
    taxable: 200000,
    gst: 36000,
    total: 236000,
    outstanding: 236000,
  },
  {
    id: "od-acme-ppt-0412",
    company: "acme",
    kind: "bill",
    number: "PPT/26-27/0412",
    party: "Pune Precision Tools",
    date: "2026-09-09",
    taxable: 16000,
    gst: 2880,
    total: 18880,
    outstanding: 18880,
  },

  /* ---------------------------------------- Acme Foods */
  {
    // Refined sunflower oil for the group's kitchens, at 5% GST.
    id: "od-shakun-0104",
    company: "shakun",
    kind: "invoice",
    number: "HRC/26-27/0104",
    party: "Horizon Hospitality Ltd",
    date: "2026-09-02",
    taxable: 240000,
    gst: 12000,
    total: 252000,
    outstanding: 252000,
  },
  {
    // Part-paid by cheque on 18 Aug; the balance is on the statement.
    id: "od-shakun-2026-112",
    company: "shakun",
    kind: "invoice",
    number: "INV 2026-112",
    party: "Mehta Engineering Works",
    date: "2026-08-08",
    taxable: 188000,
    gst: 33840,
    total: 221840,
    outstanding: 103840,
    paid: [{ amount: 118000, date: "2026-08-18" }],
  },
  {
    id: "od-shakun-slt-0931",
    company: "shakun",
    kind: "bill",
    number: "SLT/0931",
    party: "Summit Retail Ltd",
    date: "2026-08-20",
    taxable: 36000,
    gst: 6480,
    total: 42480,
    outstanding: 42480,
  },
  {
    id: "od-shakun-slt-0987",
    company: "shakun",
    kind: "bill",
    number: "SLT/0987",
    party: "Summit Retail Ltd",
    date: "2026-09-14",
    taxable: 23000,
    gst: 4140,
    total: 27140,
    outstanding: 27140,
  },
  /*
    Acme Foods' open purchase bills for the bank voucher's References
    (4 Nov 2026), one per case the Tally guide walks through:
      Vardhman  two bills, one RTGS of ₹3,54,000 settles both
      Om Sai    a ₹38,000 bill paid ₹41,300 — ₹3,300 over, an Advance
      Bluedart  a ₹15,340 bill paid ₹11,682 — part payment, rest open
  */
  {
    id: "od-shakun-vpp-0418",
    company: "shakun",
    kind: "bill",
    number: "VPP/26-27/0418",
    party: "Vardhman Packaging Pvt Ltd",
    date: "2026-08-12",
    taxable: 200000,
    gst: 36000,
    total: 236000,
    outstanding: 236000,
  },
  {
    id: "od-shakun-vpp-0431",
    company: "shakun",
    kind: "bill",
    number: "VPP/26-27/0431",
    party: "Vardhman Packaging Pvt Ltd",
    date: "2026-08-26",
    taxable: 100000,
    gst: 18000,
    total: 118000,
    outstanding: 118000,
  },
  {
    id: "od-shakun-osl-0812",
    company: "shakun",
    kind: "bill",
    number: "OSL/0812",
    party: "Om Sai Logistics",
    date: "2026-08-31",
    taxable: 36190.48,
    gst: 1809.52,
    total: 38000,
    outstanding: 38000,
  },
  {
    id: "od-shakun-bd-2291",
    company: "shakun",
    kind: "bill",
    number: "BD/SEP/2291",
    party: "Bluedart Express Ltd",
    date: "2026-09-05",
    taxable: 13000,
    gst: 2340,
    total: 15340,
    outstanding: 15340,
  },
  {
    id: "od-shakun-ric-044",
    company: "shakun",
    kind: "bill",
    number: "RIC/2026/044",
    party: "Rajesh Iyer & Co",
    date: "2026-09-01",
    taxable: 25000,
    gst: 4500,
    total: 29500,
    outstanding: 29500,
  },
  {
    id: "od-shakun-sgp-0388",
    company: "shakun",
    kind: "bill",
    number: "SGP/26-27/0388",
    party: "Shree Ganesh Printers",
    date: "2026-09-02",
    taxable: 8000,
    gst: 1440,
    total: 9440,
    outstanding: 9440,
  },
];
