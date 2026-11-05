export type BankBalance = {
  company: string;
  bankName: string;
  closingBalance: number;
  asOf: string;
};
export const MOCK_BANK_BALANCES: BankBalance[] = [
  {
    company: "shakun",
    bankName: "HDFC Bank",
    closingBalance: 245000000,
    asOf: "2026-10-13",
  },
  {
    company: "shakun",
    bankName: "State Bank of India",
    closingBalance: 135000000,
    asOf: "2026-10-13",
  },
  {
    company: "acme",
    bankName: "HDFC Bank",
    closingBalance: 128000000,
    asOf: "2026-10-13",
  },
];
