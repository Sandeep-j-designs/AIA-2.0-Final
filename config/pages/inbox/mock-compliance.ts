import type { ComplianceIssue } from "@/types/pages/inbox/ai-features";
export const MOCK_COMPLIANCE: ComplianceIssue[] = [
  {
    id: "cancelled",
    company: "shakun",
    documentId: "CHECK-CANCELLED",
    vendor: "Sterling Packaging Ltd",
    check: "Vendor GSTIN cancelled",
    evidence:
      "Bill dated 20 Sep 2026; registration cancelled from 1 Aug 2026. Input credit requires review.",
    impact: 360000,
    fix: "Draft GST-to-expense journal",
    kind: "journal",
    debit: "Packing Materials",
    status: "open",
  },
  {
    id: "blocked",
    company: "shakun",
    documentId: "CHECK-CATERING",
    vendor: "Aster Facilities Ltd",
    check: "Blocked credit · section 17(5)",
    evidence:
      "Employee convention catering ₹10,00,000 + ₹1,80,000 GST. Employee convention is not an eligible statutory exception in this demo.",
    impact: 180000,
    fix: "Add GST to Staff Welfare",
    kind: "journal",
    debit: "Staff Welfare",
    status: "open",
  },
  {
    id: "rate",
    company: "shakun",
    documentId: "CHECK-OIL",
    vendor: "Adani Wilmar Ltd",
    check: "HSN and rate mismatch",
    evidence:
      "Refined soybean oil, HSN 1507: charged 18%; expected 5%. Difference: ₹40,00,000 × 13% = ₹5,20,000.",
    impact: 520000,
    fix: "Draft corrected-invoice request",
    kind: "email",
    status: "open",
  },
  {
    id: "tds",
    company: "shakun",
    documentId: "CHECK-TDS",
    vendor: "Horizon Logistics Ltd",
    check: "TDS threshold crossed",
    evidence:
      "FY payments ₹24,00,000 exceed ₹1,00,000. Demo vendor is a company with PAN; no transporter exemption declaration. 194C at 2%: ₹48,000.",
    impact: 48000,
    fix: "Draft note to Priya",
    kind: "note",
    status: "open",
  },
];
