import type {
  DashboardOverview,
  DashboardPosting,
  CashAssumption,
} from "@/types/pages/inbox/dashboard";
const postings = (company: string): DashboardPosting[] =>
  ["2026-08", "2026-09"].flatMap((month, m) => {
    const oil = company === "shakun",
      revenue = oil ? 1000000000 : m ? 285000000 : 270000000,
      cogs = oil ? (m ? 882000000 : 858000000) : m ? 195000000 : 180000000,
      opex = oil ? (m ? 63000000 : 58000000) : m ? 52000000 : 45000000;
    return [
      {
        kind: "revenue" as const,
        amount: revenue,
        party: oil ? "Reliance Retail Ltd" : "Bharat Forge Ltd",
        ledger: oil ? "Sales - Refined Oils" : "Sales - Machined Components",
      },
      {
        kind: "cogs" as const,
        amount: cogs,
        party: oil ? "Adani Wilmar Ltd" : "Tata Steel Ltd",
        ledger: oil
          ? "Cost of crude oil and refining"
          : "Steel, tooling and job work",
      },
      {
        kind: "opex" as const,
        amount: opex,
        party: "Operating expenses",
        ledger: "Payroll, freight and plant overheads",
      },
    ].map((p, i) => ({
      ...p,
      id: `MIS-${company}-${month}-${i}`,
      voucherNo: `MIS/26-27/${month.slice(-2)}/${i + 1}`,
      date: `${month}-30`,
    }));
  });
export const MOCK_DASHBOARD: DashboardOverview[] = ["shakun", "acme"].map(
  (companyUuid) => {
    const rows = postings(companyUuid);
    return {
      companyUuid,
      postings: rows,
      cashFlowData: [
        {
          month: "2026-08",
          cashIn: companyUuid === "shakun" ? "950000000" : "250000000",
          cashOut: companyUuid === "shakun" ? "910000000" : "230000000",
        },
        {
          month: "2026-09",
          cashIn: companyUuid === "shakun" ? "920000000" : "270000000",
          cashOut: companyUuid === "shakun" ? "940000000" : "280000000",
        },
      ],
      revenueVsExpenseData: ["2026-08", "2026-09"].map((month) => ({
        month,
        revenue: rows
          .filter((p) => p.date.startsWith(month) && p.kind === "revenue")
          .reduce((n, p) => n + p.amount, 0),
        expense: rows
          .filter((p) => p.date.startsWith(month) && p.kind !== "revenue")
          .reduce((n, p) => n + p.amount, 0),
        revenueGrowth:
          companyUuid === "shakun"
            ? 0
            : month === "2026-09"
              ? 15000000 / 270000000
              : 0,
      })),
    };
  }
);
export const CASH_ASSUMPTIONS: CashAssumption[] = [
  {
    company: "shakun",
    weeklyReceipts: 60000000,
    weeklyPayments: 65000000,
    reason:
      "Demo recurring assumption: weekly refinery receipts ₹6,00,00,000 and outgoings ₹6,50,00,000. Unissued activity is estimated; overdue invoices are not scheduled receipts.",
  },
  {
    company: "acme",
    weeklyReceipts: 22000000,
    weeklyPayments: 25000000,
    reason:
      "Demo recurring assumption: weekly OEM contract receipts ₹2,20,00,000 and payroll/vendor outgoings ₹2,50,00,000. Overdue invoices are excluded from scheduled receipts.",
  },
];
