/**
 * An organisation the signed-in user belongs to, as
 * GET /api/companies/user?userUuid=… returns it (camelCased).
 *
 * Mirrors production's `UserCompany` in types/index.ts — on transplant,
 * delete this file and import from "@/types" instead.
 */
export type UserCompany = {
  ucUuid: string;
  companyUuid: string;
  companyName: string;
  companyId: string;
  organisationId: string;
  isActive: boolean;
  /** Primary registration supplied by the company record. */
  gstin?: string;
  registrationState?: string;
  branches?: string[];
  /** "tally" | "zoho" when an accounting tool is connected. */
  thirdPartyTool?: string;
};
