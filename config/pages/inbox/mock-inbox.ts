import type { InboxItem } from "@/types/pages/inbox";

/**
 * Unified Inbox — mock data.
 *
 * Ported from the prototype's js/data.js (window.SEED). Shaped exactly as the
 * API is expected to return it, camelCase throughout.
 *
 * DEV: replaced by GET /api/inbox → InboxItem[].
 *      Server-side filtering by status/tab is expected; the prototype filters
 *      client-side because it holds the whole set in memory.
 *
 * Timestamps are fixed ISO strings anchored to 2026-09-10T05:30:00Z rather than
 * `Date.now()` offsets. Module-scope `Date.now()` differs between the server and
 * client render and would produce a hydration mismatch — and an API returns an
 * absolute timestamp anyway.
 *
 * The documents are Acme Foods' — an edible-oil refiner
 * with its plant at Harihar, Davanagere (GSTIN 29, Karnataka) — as they arrive
 * in the first ten days of September 2026, FY 2026-27. Parties, GSTINs and
 * addresses live in mock-parties.ts. Every figure reconciles: lines sum to the
 * sub-total, tax is the slab's exact share of it, and a supplier in Karnataka
 * charges CGST + SGST while one outside it charges IGST.
 */

const GST_REG = "Karnataka HQ · 29AAWCS8421F1ZR";
const BATCH_SENDER = "Sandeep B. · batch upload (10 files)";

export const MOCK_INBOX_ITEMS: InboxItem[] = [
  // 1. Standard AP — high confidence, ready to confirm
  {
    id: "INB-2041",
    file: {
      name: "Dell_Tax_Invoice_DIPL-KA-26-27-18842.pdf",
      size: "412 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "ap.invoices@dell.com",
      subject: "Tax Invoice DIPL/KA/26-27/18842 — Order 4012876631",
    },
    vendor: "Dell India Pvt Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: {
      confidence: 0.94,
      rationale:
        "Looks like a vendor invoice — supplier GSTIN + 'Tax Invoice' header detected.",
    },
    amount: 3367720.0,
    receivedAt: "2026-09-10T03:30:00.000Z",
    status: "needs-review",
    bill: {
      voucherNo: "PUR/26-27/0312",
      supplierInvoiceNo: "DIPL/KA/26-27/18842",
      billDate: "04 Sep 2026",
      dueDate: "04 Oct 2026",
      gstReg: GST_REG,
      costCentre: "Finance & Accounts",
      flagged: [],
      items: [
        {
          desc: "Dell OptiPlex 7020 Tower — i7-14700, 16 GB, 512 GB SSD",
          ledger: "Computers & Peripherals",
          amount: 2496000,
          hsn: "847150",
          qty: 40,
          unit: "Nos",
          rate: 62400,
        },
        {
          desc: "ProSupport Plus — 3 years onsite, next business day",
          ledger: "Repairs & Maintenance",
          amount: 358000,
          hsn: "998713",
          qty: 40,
          unit: "Nos",
          rate: 8950,
        },
      ],
      taxes: { cgst: 256860, sgst: 256860 },
      subTotal: 2854000,
      grandTotal: 3367720,
    },
  },

  // 2. AP — low confidence + flagged fields + vendor not in masters
  {
    id: "INB-2042",
    file: {
      name: "APL-INV-2627-01957.pdf",
      size: "1.2 MB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "dispatch@ashapura.com",
      subject: "Invoice & LR copy — Activated bleaching earth, 400 MT",
    },
    vendor: "Ashapura Perfoclay Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: {
      confidence: 0.62,
      rationale:
        "Supplier GSTIN starts 24 (Gujarat) and isn't in your vendor masters; the invoice number is partly under a stamp.",
    },
    amount: 11988800.0,
    receivedAt: "2026-09-10T00:30:00.000Z",
    status: "needs-review",
    bill: {
      voucherNo: "PUR/26-27/0313",
      supplierInvoiceNo: "APL/INV/2627/01957",
      billDate: "02 Sep 2026",
      dueDate: "02 Oct 2026",
      gstReg: GST_REG,
      costCentre: null,
      vendorMissing: true,
      flagged: ["supplierInvoiceNo", "costCentre", "vendor"],
      items: [
        {
          desc: "Activated bleaching earth — Fulmont Premium, 25 kg HDPE bags",
          ledger: "Purchase - Refining Chemicals",
          amount: 9800000,
          hsn: "380290",
          qty: 400,
          unit: "MT",
          rate: 24500,
        },
        {
          desc: "Freight — FOR Harihar (LR 7781204)",
          ledger: "Freight Inward",
          amount: 360000,
          hsn: "380290",
        },
      ],
      taxes: { igst: 1828800 },
      subTotal: 10160000,
      grandTotal: 11988800,
    },
  },

  // 3. Banking — long-running statement, low confidence
  {
    id: "INB-2043",
    file: { name: "HDFC-50100123456-Aug2026.pdf", size: "624 KB", ext: "pdf" },
    source: { channel: "upload", sender: "Sandeep B.", subject: "—" },
    vendor: "—",
    voucherType: "Receipt / Payment",
    route: "Banking",
    ai: {
      confidence: 0.71,
      rationale:
        "PDF matches HDFC statement layout (acct ending 3456). Date range 1 Aug – 31 Aug.",
    },
    amount: 0,
    receivedAt: "2026-09-09T21:30:00.000Z",
    status: "needs-review",
    banking: {
      txnCount: 47,
      dateRange: "01 Aug 2026 – 31 Aug 2026",
      opening: 36853008.0,
      closing: 31264368.0,
      sample: [
        {
          date: "01-Aug-26",
          narration:
            "NEFT CR-SBIN0040213-SUMMIT RETAIL DISTRIBUTION-AF/26-27/0376",
          dr: null,
          cr: 2500000.0,
        },
        {
          date: "04-Aug-26",
          narration: "ACH D- ICICI LOMBARD GIC-4001/339127/00/000",
          dr: 372800.0,
          cr: null,
        },
        {
          date: "07-Aug-26",
          narration: "UPI/DR/621903417722/IOCL HARIHAR/Fuel for DG set",
          dr: 85600.0,
          cr: null,
        },
        {
          date: "10-Aug-26",
          narration: "IMPS CR-ASTER NATIONAL DISTRIBUTION-AF/26-27/0381",
          dr: null,
          cr: 1080000.0,
        },
        {
          date: "31-Aug-26",
          narration: "NEFT DR-BULK SALARY AUG-26-760 TXNS",
          dr: 8240000.0,
          cr: null,
        },
      ],
    },
  },

  // 4. AR — a sales invoice we issued, vendor field empty because there isn't one
  {
    id: "INB-2044",
    file: {
      name: "HRC-26-27-0118 Horizon Hospitality.pdf",
      size: "112 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "sales@acmefoods.example",
      subject: "Invoice HRC/26-27/0118 — Horizon Hospitality Ltd",
    },
    vendor: "—",
    customer: "Horizon Hospitality Ltd",
    voucherType: "Sales",
    route: "AR",
    ai: {
      confidence: 0.94,
      rationale:
        "Acme is named as the supplier and Horizon Hospitality Ltd as the recipient.",
    },
    amount: 7585200.0,
    receivedAt: "2026-09-09T18:30:00.000Z",
    status: "needs-review",
    invoice: {
      voucherNo: "HRC/26-27/0118",
      invoiceNo: "HRC/26-27/0118",
      invoiceDate: "04 Sep 2026",
      dueDate: "19 Sep 2026",
      gstReg: "Karnataka HQ",
      costCentre: null,
      customer: "Horizon Hospitality Ltd",
      flagged: [],
      items: [
        {
          desc: "Refined Sunflower Oil — 15 L Tin",
          ledger: "Sales - Edible Oil 5%",
          amount: 5160000.0,
          hsn: "151219",
          qty: 2400,
          unit: "Tin",
          rate: 2150,
        },
        {
          desc: "Refined Palmolein — 15 kg Tin",
          ledger: "Sales - Edible Oil 5%",
          amount: 2064000.0,
          hsn: "151190",
          qty: 1200,
          unit: "Tin",
          rate: 1720,
        },
      ],
      taxes: { cgst: 180600.0, sgst: 180600.0 },
      subTotal: 7224000.0,
      grandTotal: 7585200.0,
    },
  },

  // 5. AR — customer not yet in masters, so approving proposes creating it
  {
    id: "INB-2045",
    file: {
      name: "HRC-26-27-0119 Vertex Food Services.pdf",
      size: "96 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "sales@acmefoods.example",
      subject: "Invoice HRC/26-27/0119 — Vertex Food Services",
    },
    vendor: "—",
    customer: "Vertex Food Services Ltd",
    voucherType: "Sales",
    route: "AR",
    ai: {
      confidence: 0.88,
      rationale:
        "Acme is the supplier on this invoice; the recipient is not in your customer masters.",
    },
    amount: 2956800.0,
    receivedAt: "2026-09-09T15:30:00.000Z",
    status: "needs-review",
    invoice: {
      voucherNo: "HRC/26-27/0119",
      invoiceNo: "HRC/26-27/0119",
      invoiceDate: "05 Sep 2026",
      dueDate: "20 Sep 2026",
      gstReg: "Karnataka HQ",
      costCentre: null,
      customer: "Vertex Food Services Ltd",
      flagged: ["customer"],
      items: [
        {
          desc: "Refined Groundnut Oil — 15 L Tin",
          ledger: "Sales - Edible Oil 5%",
          amount: 2120000.0,
          hsn: "150890",
          qty: 800,
          unit: "Tin",
          rate: 2650,
        },
        {
          desc: "Rice Bran Oil — 1 L Pouch",
          ledger: "Sales - Edible Oil 5%",
          amount: 696000.0,
          hsn: "151590",
          qty: 4800,
          unit: "Pouch",
          rate: 145,
        },
      ],
      taxes: { cgst: 70400.0, sgst: 70400.0 },
      subTotal: 2816000.0,
      grandTotal: 2956800.0,
      customerMissing: true,
    },
  },

  // 6. JV — internal adjustment
  {
    id: "INB-2046",
    file: {
      name: "Depreciation-H1-FY2026-27.pdf",
      size: "98 KB",
      ext: "pdf",
    },
    source: { channel: "upload", sender: "Sandeep B.", subject: "—" },
    vendor: "—",
    voucherType: "Journal",
    route: "JV",
    ai: {
      confidence: 0.88,
      rationale: "Internal adjustment note — debit/credit entries, no vendor.",
    },
    amount: 8880000.0,
    receivedAt: "2026-09-09T10:30:00.000Z",
    status: "needs-review",
    jv: {
      referenceNo: "AF/FA/DEP/2627-H1",
      date: "08 Sep 2026",
      narration:
        "Provisional depreciation, H1 FY 2026-27 (Apr–Sep 2026) — WDV at Companies Act rates, per fixed asset register",
      lines: [
        { ledger: "Depreciation A/c", dr: 8880000, cr: null },
        {
          ledger: "Accumulated Depreciation - Plant & Machinery",
          dr: null,
          cr: 7680000,
        },
        {
          ledger: "Accumulated Depreciation - Vehicles",
          dr: null,
          cr: 768000,
        },
        {
          ledger: "Accumulated Depreciation - Computers",
          dr: null,
          cr: 432000,
        },
      ],
    },
  },

  // 7. Ambiguous — no route pre-selected, the disambiguation fork
  {
    id: "INB-2047",
    file: { name: "Petty-cash-Harihar-Aug.pdf", size: "210 KB", ext: "pdf" },
    source: {
      channel: "whatsapp",
      sender: "+91 98450 XXX42 (Priya R.)",
      subject: "—",
    },
    vendor: "Multiple",
    voucherType: "—",
    route: null,
    ai: {
      confidence: 0.41,
      rationale:
        "Mixed document — partly looks like vendor receipts, partly like an internal reconciliation.",
    },
    amount: 368400.0,
    receivedAt: "2026-09-09T06:30:00.000Z",
    status: "needs-review",
    ambiguous: true,
    candidates: [
      {
        route: "AP",
        evidence:
          "Page 1 has 4 consolidated expense schedules — diesel for the DG set, DTDC courier, stationery, tea and snacks.",
      },
      {
        route: "JV",
        evidence:
          "Page 2 is a typed table topping the Harihar plant's petty-cash float back up to ₹5,00,000.",
      },
    ],
  },

  // 8. Extracting — in flight
  {
    id: "INB-2048",
    file: {
      name: "BESCOM_HT_Bill_DVGHT-112_Sep2026.pdf",
      size: "388 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "ebill@bescom.co.in",
      subject: "HT bill for RR No. DVGHT-112 — September 2026",
    },
    vendor: "Bangalore Electricity Supply Company Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-10T05:28:00.000Z",
    status: "extracting",
    bill: {
      voucherNo: "PUR/26-27/0323",
      supplierInvoiceNo: "HT/DVGHT-112/0926",
      billDate: "01 Sep 2026",
      dueDate: "15 Sep 2026",
      gstReg: GST_REG,
      costCentre: "Operations",
      flagged: [],
      items: [
        {
          desc: "Energy charges — 972,400 kWh (HT-2a, Aug 2026)",
          ledger: "Power & Fuel - Refinery",
          amount: 7438860,
          hsn: "271600",
          qty: 972400,
          unit: "kWh",
          rate: 7.65,
        },
        {
          desc: "Demand charges — 7,000 kVA",
          ledger: "Power & Fuel - Refinery",
          amount: 2520000,
          qty: 7000,
          unit: "kVA",
          rate: 360,
        },
        {
          desc: "Tax on electricity @ 9% of energy charges",
          ledger: "Power & Fuel - Refinery",
          amount: 669497.4,
        },
      ],
      taxes: {},
      subTotal: 10628357.4,
      grandTotal: 10628357.4,
    },
  },

  // 9. Failed — OCR could not read the scan
  {
    id: "INB-2049",
    file: { name: "IMG-20260909-WA0014.pdf", size: "2.8 MB", ext: "pdf" },
    source: {
      channel: "email",
      sender: "basaveshwaraengg@gmail.com",
      subject: "Quotation for expeller shaft repair — pls process",
    },
    vendor: "Sri Basaveshwara Engineering Works",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-10T02:30:00.000Z",
    status: "failed",
    failure: {
      type: "scanned-pdf",
      title: "Scanned PDF — text not extractable",
      body: "This appears to be a phone-camera scan. Our OCR could read partial text but couldn't reliably identify line items, GST or amount.",
    },
  },

  // 10. Failed — password protected
  {
    id: "INB-2050",
    file: {
      name: "Airtel_Bill_1-2B4XK9Q_Aug2026.pdf",
      size: "94 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "ebill@airtel.com",
      subject: "Your Airtel Business bill for August 2026",
    },
    vendor: "Bharti Airtel Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-09T23:30:00.000Z",
    status: "failed",
    failure: {
      type: "password-protected",
      title: "Password-protected PDF",
      body: "We couldn't open this file. Ask the vendor to share an unlocked copy, or paste the password and we'll retry.",
    },
  },

  // 11. Duplicate hard-block — same vendor + invoice no already exists
  {
    id: "INB-2051",
    file: {
      name: "Dell_Tax_Invoice_DIPL-KA-26-27-18842 (1).pdf",
      size: "412 KB",
      ext: "pdf",
    },
    source: {
      channel: "drive",
      sender: "Shared drive · auto-import",
      subject: "—",
    },
    vendor: "Dell India Pvt Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: {
      confidence: 0.94,
      rationale:
        "Same as INB-2041 — vendor + invoice no match an existing bill.",
    },
    amount: 3367720.0,
    receivedAt: "2026-09-10T04:30:00.000Z",
    status: "duplicate-hard",
    duplicateOf: "INB-2041",
    bill: {
      voucherNo: "PUR/26-27/0312",
      supplierInvoiceNo: "DIPL/KA/26-27/18842",
      billDate: "04 Sep 2026",
      dueDate: "04 Oct 2026",
      gstReg: GST_REG,
      costCentre: "Finance & Accounts",
      flagged: [],
      items: [
        {
          desc: "Dell OptiPlex 7020 Tower — i7-14700, 16 GB, 512 GB SSD",
          ledger: "Computers & Peripherals",
          amount: 2496000,
          hsn: "847150",
          qty: 40,
          unit: "Nos",
          rate: 62400,
        },
        {
          desc: "ProSupport Plus — 3 years onsite, next business day",
          ledger: "Repairs & Maintenance",
          amount: 358000,
          hsn: "998713",
          qty: 40,
          unit: "Nos",
          rate: 8950,
        },
      ],
      taxes: { cgst: 256860, sgst: 256860 },
      subTotal: 2854000,
      grandTotal: 3367720,
    },
  },

  // 12. Aged + soft duplicate warning
  {
    id: "INB-2052",
    file: { name: "VPPL-INV-2627-0688.pdf", size: "320 KB", ext: "pdf" },
    source: {
      channel: "email",
      sender: "accounts@vardhmanpackaging.in",
      subject: "Invoice VPPL/26-27/0688 — pouch laminate & tape",
    },
    vendor: "Vardhman Packaging Pvt Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: {
      confidence: 0.84,
      rationale:
        "Vendor bill, identical amount as another bill 6 weeks ago — possible duplicate, soft warning.",
    },
    amount: 818448.0,
    receivedAt: "2026-09-01T05:30:00.000Z",
    status: "duplicate-soft",
    aged: true,
    bill: {
      voucherNo: "PUR/26-27/0287",
      supplierInvoiceNo: "VPPL/26-27/0688",
      billDate: "18 Aug 2026",
      dueDate: "17 Sep 2026",
      gstReg: GST_REG,
      costCentre: "Operations",
      flagged: ["dueDate"],
      items: [
        {
          desc: "Printed pouch laminate — 1 L Sunflower, 12 µ PET / 75 µ PE",
          ledger: "Packing Material",
          amount: 564000,
          hsn: "392020",
          qty: 2400,
          unit: "Kg",
          rate: 235,
        },
        {
          desc: "BOPP tape 72 mm × 65 m — brown",
          ledger: "Packing Material",
          amount: 129600,
          hsn: "391910",
          qty: 2400,
          unit: "Roll",
          rate: 54,
        },
      ],
      taxes: { cgst: 62424.0, sgst: 62424.0 },
      subTotal: 693600,
      grandTotal: 818448.0,
    },
  },

  // 13. Retrying
  {
    id: "INB-2053",
    file: {
      name: "Zoho_Invoice_INV-2627-4471903.pdf",
      size: "228 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "billing@zohocorp.com",
      subject: "Zoho Books — invoice for September 2026",
    },
    vendor: "Zoho Corporation Pvt Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-10T05:22:00.000Z",
    status: "retrying",
    retryAttempt: 2,
    retryMax: 3,
    bill: {
      voucherNo: "PUR/26-27/0324",
      supplierInvoiceNo: "INV-2627-4471903",
      billDate: "01 Sep 2026",
      dueDate: "01 Sep 2026",
      gstReg: GST_REG,
      costCentre: "Finance & Accounts",
      flagged: [],
      items: [
        {
          desc: "Zoho One — all-employee plan, 240 users, Sep 2026",
          ledger: "Software Subscriptions",
          amount: 302400,
          hsn: "997331",
          qty: 240,
          unit: "User",
          rate: 1260,
        },
      ],
      taxes: { igst: 54432.0 },
      subTotal: 302400,
      grandTotal: 356832.0,
    },
  },

  /* ---------------- Bulk batch — 10 files uploaded together ---------------- */

  {
    id: "BULK-001",
    file: {
      name: "ERP_Annual_Subscription_TSPL-2627-88104.pdf",
      size: "388 KB",
      ext: "pdf",
    },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "Enterprise Software Services Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: 0.91, rationale: "—" },
    amount: 286740.0,
    receivedAt: "2026-09-10T05:26:00.000Z",
    status: "needs-review",
    batchTag: "BATCH-Sep26",
    bill: {
      voucherNo: "PUR/26-27/0314",
      supplierInvoiceNo: "TSPL/2627/88104",
      billDate: "01 Sep 2026",
      dueDate: "01 Sep 2026",
      gstReg: GST_REG,
      costCentre: "Finance & Accounts",
      flagged: [],
      items: [
        {
          desc: "ERP Finance Suite — Annual subscription, 12 months (serial 7342 1180)",
          ledger: "Software Subscriptions",
          amount: 243000,
          hsn: "997331",
          qty: 20,
          unit: "Nos",
          rate: 12150,
        },
      ],
      taxes: { cgst: 21870.0, sgst: 21870.0 },
      subTotal: 243000,
      grandTotal: 286740,
    },
  },
  {
    id: "BULK-002",
    file: {
      name: "BlueDart_Bill_BLR-2627-0091187.pdf",
      size: "412 KB",
      ext: "pdf",
    },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "Blue Dart Express Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: {
      confidence: 0.74,
      rationale: "Courier bill — vendor matched in masters.",
    },
    amount: 1097400.0,
    receivedAt: "2026-09-10T05:26:00.000Z",
    status: "needs-review",
    batchTag: "BATCH-Sep26",
    bill: {
      voucherNo: "PUR/26-27/0315",
      supplierInvoiceNo: "BLR/2627/0091187",
      billDate: "31 Aug 2026",
      dueDate: "15 Sep 2026",
      gstReg: GST_REG,
      costCentre: "Sales & Marketing",
      flagged: ["dueDate"],
      items: [
        {
          desc: "Dart Surfaceline — Harihar → Bengaluru, 3,720 shipments",
          ledger: "Freight Outward",
          amount: 620000,
          hsn: "996812",
        },
        {
          desc: "Dart Surfaceline — Harihar → Chennai, 2,240 shipments",
          ledger: "Freight Outward",
          amount: 310000,
          hsn: "996812",
        },
      ],
      taxes: { cgst: 83700, sgst: 83700 },
      subTotal: 930000,
      grandTotal: 1097400,
    },
  },
  {
    id: "BULK-003",
    file: {
      name: "ENIL_RO-BLR-26-0918_Mirchi.pdf",
      size: "276 KB",
      ext: "pdf",
    },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "Entertainment Network (India) Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: 0.86, rationale: "—" },
    amount: 2548800.0,
    receivedAt: "2026-09-10T05:26:00.000Z",
    status: "needs-review",
    batchTag: "BATCH-Sep26",
    bill: {
      voucherNo: "PUR/26-27/0316",
      supplierInvoiceNo: "ENIL/KA/2627/03318",
      billDate: "31 Aug 2026",
      dueDate: "30 Sep 2026",
      gstReg: GST_REG,
      costCentre: "Sales & Marketing",
      flagged: [],
      items: [
        {
          desc: "Radio Mirchi 98.3 Bengaluru — 30-sec spots, Aug 2026 (RO BLR/26/0918)",
          ledger: "Advertisement & Publicity",
          amount: 2160000,
          hsn: "998366",
          qty: 2400,
          unit: "Spot",
          rate: 900,
        },
      ],
      taxes: { cgst: 194400, sgst: 194400 },
      subTotal: 2160000,
      grandTotal: 2548800,
    },
  },
  {
    id: "BULK-004",
    file: { name: "HHT-INV-2627-0631.pdf", size: "344 KB", ext: "pdf" },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "Hyderabad Hexane Traders",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-10T05:27:00.000Z",
    status: "extracting",
    batchTag: "BATCH-Sep26",
    bill: {
      voucherNo: "PUR/26-27/0325",
      supplierInvoiceNo: "HHT/2627/0631",
      billDate: "29 Aug 2026",
      dueDate: "28 Sep 2026",
      gstReg: GST_REG,
      costCentre: "Operations",
      flagged: [],
      items: [
        {
          desc: "Food-grade n-hexane — tanker fleet, 160 KL",
          ledger: "Purchase - Refining Chemicals",
          amount: 15040000,
          hsn: "290110",
          qty: 160000,
          unit: "L",
          rate: 94,
        },
      ],
      taxes: { igst: 2707200 },
      subTotal: 15040000,
      grandTotal: 17747200,
    },
  },
  {
    id: "BULK-005",
    file: {
      name: "Sri_Manjunatha_Hardware_INV-2284.pdf",
      size: "510 KB",
      ext: "pdf",
    },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "Sri Manjunatha Hardware & Tools",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-10T05:27:00.000Z",
    status: "extracting",
    batchTag: "BATCH-Sep26",
    bill: {
      voucherNo: "PUR/26-27/0326",
      supplierInvoiceNo: "SMH/2284",
      billDate: "30 Aug 2026",
      dueDate: "29 Sep 2026",
      gstReg: GST_REG,
      costCentre: "Operations",
      flagged: [],
      items: [
        {
          desc: "SS 304 ball valve 25 mm — screwed end",
          ledger: "Stores & Spares",
          amount: 444000,
          hsn: "848180",
          qty: 240,
          unit: "Nos",
          rate: 1850,
        },
        {
          desc: "Spiral-wound gasket 50 mm — SS 316 / graphite",
          ledger: "Stores & Spares",
          amount: 174000,
          hsn: "848410",
          qty: 120,
          unit: "Nos",
          rate: 1450,
        },
      ],
      taxes: { cgst: 55620, sgst: 55620 },
      subTotal: 618000,
      grandTotal: 729240,
    },
  },
  {
    id: "BULK-006",
    file: {
      name: "Krishna_Computers_INV-0918.pdf",
      size: "180 KB",
      ext: "pdf",
    },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "Krishna Computers & Peripherals",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-10T05:27:00.000Z",
    status: "extracting",
    batchTag: "BATCH-Sep26",
    bill: {
      voucherNo: "PUR/26-27/0327",
      supplierInvoiceNo: "KCP/26-27/0918",
      billDate: "28 Aug 2026",
      dueDate: "27 Sep 2026",
      gstReg: GST_REG,
      costCentre: "Finance & Accounts",
      flagged: [],
      items: [
        {
          desc: "HP 88A toner cartridge — original",
          ledger: "Printing & Stationery",
          amount: 354000,
          hsn: "844399",
          qty: 120,
          unit: "Nos",
          rate: 2950,
        },
      ],
      taxes: { cgst: 31860, sgst: 31860 },
      subTotal: 354000,
      grandTotal: 417720,
    },
  },
  {
    id: "BULK-007",
    file: {
      name: "Annapurna_Caterers_Canteen_Aug.pdf",
      size: "92 KB",
      ext: "pdf",
    },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "Aster Facilities Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-10T05:27:00.000Z",
    status: "extracting",
    batchTag: "BATCH-Sep26",
    bill: {
      voucherNo: "PUR/26-27/0328",
      supplierInvoiceNo: "AC/26-27/041",
      billDate: "31 Aug 2026",
      dueDate: "10 Sep 2026",
      gstReg: GST_REG,
      costCentre: "Operations",
      flagged: [],
      items: [
        {
          desc: "Factory canteen — Aug 2026, 49,600 meals",
          ledger: "Staff Welfare",
          amount: 3224000,
          hsn: "996337",
          qty: 49600,
          unit: "Meal",
          rate: 65,
        },
      ],
      taxes: { cgst: 80600, sgst: 80600 },
      subTotal: 3224000,
      grandTotal: 3385200,
    },
  },
  {
    id: "BULK-008",
    file: {
      name: "BlueStar_AMC_Quote_ColdRoom_scan.pdf",
      size: "3.2 MB",
      ext: "pdf",
    },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "Blue Star Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: null, rationale: null },
    amount: null,
    receivedAt: "2026-09-10T05:27:00.000Z",
    status: "failed",
    batchTag: "BATCH-Sep26",
    failure: {
      type: "scanned-pdf",
      title: "Scanned PDF — text not extractable",
      body: "Phone-camera scan — couldn't reliably read line items or totals.",
    },
  },
  {
    id: "BULK-009",
    file: {
      name: "BVG_India_INV-KA-2627-11420.pdf",
      size: "118 KB",
      ext: "pdf",
    },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "BVG India Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: 0.92, rationale: "—" },
    amount: 1095040.0,
    receivedAt: "2026-09-10T05:27:00.000Z",
    status: "needs-review",
    batchTag: "BATCH-Sep26",
    bill: {
      voucherNo: "PUR/26-27/0317",
      supplierInvoiceNo: "BVG/KA/2627/11420",
      billDate: "01 Sep 2026",
      dueDate: "01 Oct 2026",
      gstReg: GST_REG,
      costCentre: "Operations",
      flagged: [],
      items: [
        {
          desc: "Housekeeping — Harihar plant & office, Aug 2026 (160 staff)",
          ledger: "Housekeeping Charges",
          amount: 928000,
          hsn: "998533",
        },
      ],
      taxes: { cgst: 83520, sgst: 83520 },
      subTotal: 928000,
      grandTotal: 1095040,
    },
  },
  {
    id: "BULK-010",
    file: {
      name: "Sri_Durga_Filling_Stn_Aug-HSD.pdf",
      size: "224 KB",
      ext: "pdf",
    },
    source: { channel: "upload", sender: BATCH_SENDER, subject: "—" },
    vendor: "Sri Durga Filling Station",
    voucherType: "Purchase",
    route: "AP",
    ai: {
      confidence: 0.77,
      rationale:
        "Fuel bill — diesel is outside GST, so no tax lines are expected.",
    },
    amount: 1461568.0,
    receivedAt: "2026-09-10T05:27:00.000Z",
    status: "needs-review",
    batchTag: "BATCH-Sep26",
    bill: {
      voucherNo: "PUR/26-27/0318",
      supplierInvoiceNo: "SDFS/0826/0412",
      billDate: "31 Aug 2026",
      dueDate: "15 Sep 2026",
      gstReg: GST_REG,
      costCentre: "Operations",
      flagged: [],
      items: [
        {
          desc: "High-speed diesel — tanker & DG set, Aug 2026 (credit a/c 118)",
          ledger: "Vehicle Running Expenses",
          amount: 1461568.0,
          hsn: "271019",
          qty: 16400,
          unit: "L",
          rate: 89.12,
        },
      ],
      taxes: {},
      subTotal: 1461568.0,
      grandTotal: 1461568.0,
    },
  },

  /* --------------------------------- Done --------------------------------- */

  {
    id: "INB-2030",
    file: { name: "BIG-INV-2627-0733.pdf", size: "172 KB", ext: "pdf" },
    source: {
      channel: "email",
      sender: "billing@bengalurugases.in",
      subject: "—",
    },
    vendor: "Bengaluru Industrial Gases",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: 0.91, rationale: "—" },
    amount: 254880.0,
    receivedAt: "2026-09-08T05:30:00.000Z",
    status: "done",
    doneBy: "Sandeep Balaji",
    doneAt: "2026-09-08T05:30:00.000Z",
    destination: "PUR/26-27/0298",
  },
  {
    id: "INB-2031",
    file: {
      name: "MT-26-27-0061 Reliance Retail.pdf",
      size: "108 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "sales@acmefoods.example",
      subject: "—",
    },
    vendor: "—",
    customer: "Reliance Retail Ltd",
    voucherType: "Sales",
    route: "AR",
    ai: { confidence: 0.96, rationale: "—" },
    amount: 6615000.0,
    receivedAt: "2026-09-06T05:30:00.000Z",
    status: "done",
    doneBy: "Sandeep Balaji",
    doneAt: "2026-09-06T05:30:00.000Z",
    destination: "MT/26-27/0061",
    invoice: {
      voucherNo: "MT/26-27/0061",
      invoiceNo: "MT/26-27/0061",
      invoiceDate: "27 August 2026",
      dueDate: "26 September 2026",
      gstReg: "Karnataka HQ",
      costCentre: null,
      customer: "Reliance Retail Ltd",
      flagged: [],
      items: [
        {
          desc: "Refined Sunflower Oil — 15 L Tin (PO 4100388127)",
          ledger: "Sales - Edible Oil 5%",
          amount: 6300000.0,
          hsn: "151219",
          qty: 3000,
          unit: "Tin",
          rate: 2100,
        },
      ],
      taxes: { igst: 315000.0 },
      subTotal: 6300000.0,
      grandTotal: 6615000.0,
    },
  },

  /* ------------------------------- Deleted -------------------------------- */

  {
    id: "INB-2020",
    file: { name: "DC-VPPL-2627-0412.pdf", size: "44 KB", ext: "pdf" },
    source: {
      channel: "email",
      sender: "dispatch@vardhmanpackaging.in",
      subject: "Re: PO/26-27/0118 — delivery challan",
    },
    vendor: "—",
    voucherType: "—",
    route: "AP",
    ai: {
      confidence: 0.22,
      rationale: "Couldn't classify — looks like a delivery note, not a bill.",
    },
    amount: null,
    receivedAt: "2026-09-07T05:30:00.000Z",
    status: "deleted",
    deletedBy: "Sandeep Balaji",
    deletedAt: "2026-09-07T05:30:00.000Z",
  },

  /* ------------------------- Conversion-system seeds ----------------------- */

  // CONV-001 — Bill ready for Bill→Invoice; vendor is not in the Customer master
  {
    id: "CONV-001",
    file: {
      name: "OSL-WH-2627-0219.pdf",
      size: "320 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "accounts@omsailogistics.in",
      subject: "Warehousing invoice — Transport Nagar godown, August",
    },
    vendor: "Om Sai Logistics",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: 0.92, rationale: "Vendor invoice." },
    amount: 1770000.0,
    receivedAt: "2026-09-10T02:30:00.000Z",
    status: "needs-review",
    bill: {
      voucherNo: "PUR/26-27/0319",
      supplierInvoiceNo: "OSL/WH/2627/0219",
      billDate: "31 Aug 2026",
      dueDate: "30 Sep 2026",
      gstReg: GST_REG,
      costCentre: "Operations",
      flagged: [],
      items: [
        {
          desc: "Warehousing & handling — Transport Nagar godown, 8,200 pallet-weeks, Aug 2026",
          ledger: "Warehousing Charges",
          amount: 1500000,
          hsn: "996729",
        },
      ],
      taxes: { cgst: 135000, sgst: 135000 },
      subTotal: 1500000,
      grandTotal: 1770000,
    },
    convertHint: "bill-to-invoice",
  },

  // CONV-002 — JV whose narration names a candidate party, ready for JV→Invoice
  {
    id: "CONV-002",
    file: {
      name: "Rebill-Peenya-godown-rent-Aug.pdf",
      size: "164 KB",
      ext: "pdf",
    },
    source: { channel: "upload", sender: "Sandeep B.", subject: "—" },
    vendor: "—",
    voucherType: "Journal",
    route: "JV",
    ai: { confidence: 0.95, rationale: "Internal adjustment note." },
    amount: 840000.0,
    receivedAt: "2026-09-09T23:30:00.000Z",
    status: "needs-review",
    jv: {
      referenceNo: "AF/JV/2627/0142",
      date: "31 Aug 2026",
      narration:
        "Re-bill: Peenya godown rent (bay 3) for Aug 2026 paid on behalf of Aster Distribution Ltd — should be raised as a sales invoice on Annapoorna.",
      lines: [
        {
          ledger: "Aster Distribution Ltd (Receivable)",
          dr: 840000,
          cr: null,
        },
        { ledger: "Godown Rent — Pass-through", dr: null, cr: 840000 },
      ],
    },
    convertHint: "jv-to-invoice",
  },

  // CONV-003 — content hash matches a posted JV, not a bill
  {
    id: "CONV-003",
    file: {
      name: "Annapoorna-rent-debit-note-Aug.pdf",
      size: "188 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "accounts@annapoornawholesale.in",
      subject: "—",
    },
    vendor: "Internal — Adjustment",
    voucherType: "Purchase",
    route: "AP",
    ai: {
      confidence: 0.84,
      rationale: "Looks like a bill but content hashes match a posted JV.",
    },
    amount: 840000.0,
    receivedAt: "2026-09-10T01:30:00.000Z",
    status: "duplicate-cross-type",
    crossDupOf: {
      id: "JV/26-27/0074",
      type: "Journal Voucher",
      postedBy: "Sandeep B.",
      postedOn: "02 Sep 2026",
      amount: 840000,
    },
  },

  // CONV-004 — AR re-upload of an invoice already posted, so it lands as a
  // hard-block duplicate: same customer, same invoice number as INB-2031.
  {
    id: "CONV-004",
    file: {
      name: "MT-26-27-0061 Reliance Retail (re-send).pdf",
      size: "108 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "sales@acmefoods.example",
      subject: "Invoice MT/26-27/0061 — please re-process",
    },
    vendor: "—",
    customer: "Reliance Retail Ltd",
    voucherType: "Sales",
    route: "AR",
    ai: {
      confidence: 0.97,
      rationale: "Acme is the supplier; recipient is Reliance Retail.",
    },
    amount: 6615000.0,
    receivedAt: "2026-09-10T03:30:00.000Z",
    status: "needs-review",
    isReupload: true,
    invoice: {
      voucherNo: "MT/26-27/0061",
      invoiceNo: "MT/26-27/0061",
      invoiceDate: "27 August 2026",
      dueDate: "26 September 2026",
      gstReg: "Karnataka HQ",
      costCentre: null,
      customer: "Reliance Retail Ltd",
      flagged: [],
      items: [
        {
          desc: "Refined Sunflower Oil — 15 L Tin (PO 4100388127)",
          ledger: "Sales - Edible Oil 5%",
          amount: 6300000.0,
          hsn: "151219",
          qty: 3000,
          unit: "Tin",
          rate: 2100,
        },
      ],
      taxes: { igst: 315000.0 },
      subTotal: 6300000.0,
      grandTotal: 6615000.0,
    },
  },

  // CONV-005 — multi-user edit conflict demo
  {
    id: "CONV-005",
    file: {
      name: "Metro_Tax_Invoice_29-118-0904417.pdf",
      size: "224 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "einvoice@metro.co.in",
      subject: "—",
    },
    vendor: "Metro Cash & Carry India Pvt Ltd",
    voucherType: "Purchase",
    route: "AP",
    ai: { confidence: 0.89, rationale: "—" },
    amount: 667880.0,
    receivedAt: "2026-09-10T04:30:00.000Z",
    status: "needs-review",
    conflictSim: true,
    bill: {
      voucherNo: "PUR/26-27/0320",
      supplierInvoiceNo: "29/118/0904417",
      billDate: "06 Sep 2026",
      dueDate: "06 Sep 2026",
      gstReg: GST_REG,
      costCentre: "Operations",
      flagged: [],
      items: [
        {
          desc: "Corporate pantry & housekeeping supplies — as per annexure (41 lines)",
          ledger: "Staff Welfare",
          amount: 566000,
        },
      ],
      taxes: { cgst: 50940, sgst: 50940 },
      subTotal: 566000,
      grandTotal: 667880,
    },
  },

  // DONE-001 — already converted Bill→JV, drives the reversal/lineage view
  {
    id: "DONE-001",
    file: {
      name: "AWL-CN-2627-00914.pdf",
      size: "142 KB",
      ext: "pdf",
    },
    source: {
      channel: "email",
      sender: "creditnotes@adaniwilmar.in",
      subject: "Credit note — rate difference, crude sunflower oil",
    },
    vendor: "Adani Wilmar Ltd",
    voucherType: "Purchase",
    route: "JV",
    ai: { confidence: 0.91, rationale: "—" },
    amount: 378000.0,
    receivedAt: "2026-09-09T05:30:00.000Z",
    status: "done",
    doneBy: "Sandeep Balaji",
    doneAt: "2026-09-09T05:30:00.000Z",
    lineage: {
      sourceType: "Bill",
      sourceId: "PUR/26-27/0247",
      sourcePostedOn: "21 Aug 2026",
      convertedTo: {
        type: "Journal Voucher",
        id: "JV/26-27/0088",
        postedOn: "21 Aug 2026",
        actor: "Sandeep B.",
      },
    },
  },
];

/**
 * Apex Manufacturing' first document — a Chakan machine shop buying
 * round bars from a Maharashtra supplier, so CGST + SGST. The store files it
 * under the second company; it is not part of Acme's queue.
 */
export const SAHYADRI_FIRST_BILL: InboxItem = {
  id: "ACME-1001",
  file: { name: "TSL-MH-2627-6488.pdf", size: "286 KB", ext: "pdf" },
  source: {
    channel: "email",
    sender: "einvoice.pune@tatasteel.com",
    subject: "Tax Invoice TSL/MH/26-27/6488 — EN8 round bars",
  },
  vendor: "Tata Steel Ltd",
  voucherType: "Purchase",
  route: "AP",
  ai: {
    confidence: 0.93,
    rationale:
      "Looks like a vendor invoice — supplier GSTIN + 'Tax Invoice' header detected.",
  },
  amount: 9699600,
  receivedAt: "2026-09-10T03:10:00.000Z",
  status: "needs-review",
  bill: {
    voucherNo: "PUR/26-27/0141",
    supplierInvoiceNo: "TSL/MH/26-27/6488",
    billDate: "03 Sep 2026",
    dueDate: "03 Oct 2026",
    gstReg: "Pune HQ · 27AABCM5582A1ZO",
    costCentre: null,
    flagged: [],
    items: [
      {
        desc: "EN8 round bar, 40 mm dia — hot rolled",
        ledger: "Purchase - Raw Material",
        amount: 8220000,
        hsn: "721420",
        qty: 120,
        unit: "MT",
        rate: 68500,
      },
    ],
    taxes: { cgst: 739800, sgst: 739800 },
    subTotal: 8220000,
    grandTotal: 9699600,
  },
};
