import type { UserCompany } from "@/types/pages/organisation";

/** Organisation labels are independent of the connected accounting provider. */
export const getCompanyBadgeLabel = (company: UserCompany) =>
  company.companyName;
