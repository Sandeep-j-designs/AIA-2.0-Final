import * as React from "react";
import { make } from "./core";

/** Ledger product family: 24-unit grid, 2-unit strokes, open interiors.
 * No shading or micro-detail: recognition must survive at 16px.
 * Money arrows are relative to the business (out/up, in/down).
 * Use the same semantic export in navigation, notifications and workflows.
 */
export const Overview = make(
  "Overview",
  <>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M4 10h16M10 10v10" />
  </>
);
export const DocumentInbox = make(
  "DocumentInbox",
  <>
    <path d="M8 8V3h8v5M4 11l2-3h12l2 3v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
    <path d="M4 12h5l1 3h4l1-3h5" />
  </>
);
const moneyBase = <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M7 16h3" />;
export const Payables = make(
  "Payables",
  <>
    {moneyBase}
    <path d="M12 13V3M8 7l4-4 4 4" />
  </>
);
export const Receivables = make(
  "Receivables",
  <>
    {moneyBase}
    <path d="M12 3v10M8 9l4 4 4-4" />
  </>
);
export const Accounting = make(
  "Accounting",
  <>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M9 3v18M13 9h3M13 15h3" />
  </>
);
export const Inventory = make(
  "Inventory",
  <>
    <path d="m4 7 8-4 8 4v10l-8 4-8-4Z" />
    <path d="m4 7 8 4 8-4M12 11v10" />
  </>
);
export const Compliance = make(
  "Compliance",
  <>
    <path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6Z" />
    <path d="m8 12 3 3 5-6" />
  </>
);
export const Banking = make(
  "Banking",
  <>
    <path d="m3 8 9-5 9 5ZM4 21h16M6 12v5M12 12v5M18 12v5" />
  </>
);
export const Reconcile = make(
  "Reconcile",
  <>
    <path d="M4 7h16l-4-4M20 17H4l4 4" />
    <path d="m9 12 2 2 4-4" />
  </>
);
