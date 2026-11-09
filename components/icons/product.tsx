import * as React from "react";
import { make } from "./core";

/** AIA Quiet: original 20-unit drawings, 1.5-unit strokes, 2.5-unit safe area.
 * Open interiors, rounded terminals, no decorative shading. Scale to 16–24px.
 * Receipt arrows describe document direction: purchase inward, sale outward.
 * State is expressed through color and surrounding surfaces, never stroke weight.
 */
const icon = (name: string, glyph: React.ReactNode) => make(name, glyph, 20);
export const Overview = icon(
  "Overview",
  <>
    <rect x="3" y="3" width="5" height="5" rx="1.25" />
    <rect x="12" y="3" width="5" height="5" rx="1.25" />
    <rect x="3" y="12" width="5" height="5" rx="1.25" />
    <rect x="12" y="12" width="5" height="5" rx="1.25" />
  </>
);
export const DocumentInbox = icon(
  "DocumentInbox",
  <>
    <path d="M6 10V3.5h8V10M8.5 6h3" />
    <path d="M5.5 8H4l-1 4v4.5h14V12l-1-4h-1.5M3 12h4l1.5 2h3l1.5-2h4" />
  </>
);
const receipt = (
  <path d="M11 3H4.5v14l2-1.5 2 1.5 2-1.5 2 1.5V12M7 6h2M7 9h2" />
);
export const Payables = icon(
  "Payables",
  <>
    {receipt}
    <path d="M17 6h-5m2.5-2.5L12 6l2.5 2.5" />
  </>
);
export const Receivables = icon(
  "Receivables",
  <>
    {receipt}
    <path d="M12 6h5m-2.5-2.5L17 6l-2.5 2.5" />
  </>
);
export const Accounting = icon(
  "Accounting",
  <>
    <path d="M10 5c-2-1.5-4.5-2-7-1.5v12c2.5-.5 5 0 7 1.5 2-1.5 4.5-2 7-1.5v-12c-2.5-.5-5 0-7 1.5Zm0 0v12" />
    <path d="m5.5 7.5 2 .5m5 0 2-.5" />
  </>
);
export const Inventory = icon(
  "Inventory",
  <>
    <path d="m3 6.5 7-3.5 7 3.5v7l-7 3.5-7-3.5Zm0 0 7 3.5 7-3.5M10 10v7M6.5 4.75l7 3.5" />
  </>
);
export const Compliance = icon(
  "Compliance",
  <>
    <path d="M10 2.75 16 5v5c0 3-2.5 5.5-6 7.25C6.5 15.5 4 13 4 10V5Z" />
    <path d="m7.5 9.75 1.75 1.75 3.5-3.5" />
  </>
);
export const Banking = icon(
  "Banking",
  <>
    <path d="m3 6.5 7-3.75 7 3.75ZM6.5 9.5v4M13.5 9.5v4M4 16.5h12" />
  </>
);
export const Reconcile = icon(
  "Reconcile",
  <>
    <path d="M5.5 5A6 6 0 0 1 16 8m0-4v4h-4M14.5 15A6 6 0 0 1 4 12m0 4v-4h4" />
  </>
);
export const TaxReconciliation = icon(
  "TaxReconciliation",
  <>
    <path d="M6.5 4V2.75h10.75V14H16M3 6h10.75v11.25H3Z" />
    <path d="m5.75 11.5 1.75 1.75 3.5-3.5" />
  </>
);
export const AccountTree = icon(
  "AccountTree",
  <>
    <rect x="9" y="3" width="8" height="3" rx="1" />
    <rect x="9" y="8.5" width="8" height="3" rx="1" />
    <rect x="9" y="14" width="8" height="3" rx="1" />
    <path d="M3 4.5h3M4.5 4.5v11H9M4.5 10H9" />
  </>
);
