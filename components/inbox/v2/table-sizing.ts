/**
 * Automatic layouts adapt; manual layouts retain exact CSS-pixel widths.
 *
 * `min` is the floor for both, and no column may go below the width its header
 * needs to show in full: 16px left padding + label + 4px gap and 20px for each
 * sort/filter button + 16px right padding (Precision Indigo cell rhythm,
 * --pad-cell 12/16), plus a few px of slack for font
 * rendering. A header that truncates hides the name of what the column holds.
 */
export type ColumnSizes = Record<
  string,
  { min: number; preferred: number; max: number }
>;

/*
  File and Vendor carry raised floors (27 Oct 2026). The Inbox is wider than
  its pane with every column on, so the fit shrinks each column toward its
  min, and these two — with the most room between preferred and min — lost
  the most: "Reliance R…", "Mahindra …". They are how a row is recognised, so
  they hold a readable width and the table scrolls a little further instead.
*/
/*
  Fitted to content (5 Nov 2026): each min is the larger of the full header
  and the widest value, measured at 1440 with the cell padding. Status, GST,
  Source, Amount and Voucher type sat 30–70px wider than anything they hold;
  Received was 3px short of "13 Oct 2026, 10:00 am". Short-content columns
  carry a low max, so spare width on a wide screen goes to Document, Party
  and User, which have something to show with it.
*/
export const COLUMN_SIZES: ColumnSizes = {
  File: { min: 216, preferred: 248, max: 600 },
  Source: { min: 128, preferred: 128, max: 160 },
  User: { min: 158, preferred: 200, max: 360 },
  Vendor: { min: 204, preferred: 240, max: 360 },
  "Voucher type": { min: 168, preferred: 168, max: 200 },
  "GST Registration": { min: 188, preferred: 192, max: 240 },
  Amount: { min: 148, preferred: 152, max: 200 },
  Received: { min: 184, preferred: 188, max: 240 },
  Status: { min: 172, preferred: 176, max: 208 },
};
/**
 * The Purchases register's bill columns, under the same rule: no minimum below
 * what the header needs for its label, sort and filter buttons. Each `min`
 * rose by 8px when the header moved from 12px to 16px side padding
 * (Precision Indigo, px-4 cells); `preferred` never sits below `min`.
 * Source was raised to 132 for Open Sans (4 Oct 2026): "WhatsApp" with
 * its icon no longer fit 124.
 */
/*
 * Voucher No., Supplier Inv No. and Vendor carry raised floors (27 Oct 2026),
 * as the Inbox's File and Vendor do: they are how a bill is recognised, and at
 * the old mins they read "PUR/ML/A…", "ML/AF/2627/0…", "Mahindr…".
 */
export const BILL_COLUMN_SIZES: ColumnSizes = {
  voucherNo: { min: 216, preferred: 220, max: 280 },
  invoiceNo: { min: 184, preferred: 188, max: 280 },
  party: { min: 204, preferred: 228, max: 400 },
  date: { min: 132, preferred: 136, max: 220 },
  due: { min: 138, preferred: 138, max: 220 },
  amount: { min: 162, preferred: 162, max: 240 },
  payment: { min: 150, preferred: 150, max: 240 },
  attachments: { min: 134, preferred: 134, max: 200 },
};
/**
 * The Sales and Journals registers (27 Oct 2026), sized like Purchases so the
 * three registers read as one table: the same header rule for every `min`
 * (label + one 20px sort button), and the columns that identify a voucher —
 * the party and Narration — given room to show it. Sales' seven columns fit
 * a 1440 window at their mins; Journals' eight scroll, as the Inbox does.
 */
/* Filterable columns carry a 20px funnel and its 4px gap beside the sort
   button (27 Oct 2026), so their minimums hold the full header with both. */
export const REGISTER_COLUMN_SIZES: ColumnSizes = {
  date: { min: 164, preferred: 172, max: 244 },
  voucherNo: { min: 168, preferred: 184, max: 280 },
  party: { min: 224, preferred: 264, max: 424 },
  amount: { min: 152, preferred: 172, max: 264 },
  editedBy: { min: 180, preferred: 192, max: 304 },
  editedAt: { min: 148, preferred: 156, max: 220 },
  status: { min: 184, preferred: 192, max: 264 },
  sync: { min: 180, preferred: 188, max: 264 },
  voucherType: { min: 164, preferred: 168, max: 244 },
  narration: { min: 240, preferred: 320, max: 600 },
  createdBy: { min: 172, preferred: 192, max: 304 },
  updatedAt: { min: 168, preferred: 172, max: 240 },
  /*
    The Columns menu's hidden-by-default columns (28 Oct 2026, voucher-
    columns.tsx), under the same header rule: label + 20px sort (Tax Ledger
    has none) + 32px padding. None of them is filterable, so none carries the
    funnel's 24px. Invoice No. holds an identifier, so it gets a raised floor
    like Purchases' Supplier Inv No.
  */
  gst: { min: 184, preferred: 200, max: 360 },
  type: { min: 104, preferred: 148, max: 240 },
  invoiceNo: { min: 168, preferred: 184, max: 280 },
  docDate: { min: 144, preferred: 148, max: 220 },
  due: { min: 124, preferred: 136, max: 220 },
  ledger: { min: 140, preferred: 200, max: 360 },
  taxLedger: { min: 120, preferred: 160, max: 240 },
  costCentre: { min: 140, preferred: 176, max: 300 },
  taxable: { min: 160, preferred: 168, max: 264 },
  tax: { min: 132, preferred: 152, max: 240 },
  createdAt: { min: 136, preferred: 148, max: 220 },
  documentStatus: { min: 164, preferred: 176, max: 264 },
  attachments: { min: 140, preferred: 140, max: 200 },
};
export const SELECT_WIDTH = 40;
/**
 * The kebab column. Fixed, like the checkbox: it holds one 32px button, so
 * there is nothing in it for extra width to do, and both bookends stay out of
 * the distribution below.
 */
// 84 holds "Actions" at the 14px header size (5 Nov 2026).
export const ACTIONS_WIDTH = 64;
export const preferredWidths = (sizes: ColumnSizes) =>
  Object.fromEntries(
    Object.entries(sizes).map(([key, size]) => [key, size.preferred])
  );
export const DEFAULT_WIDTHS = preferredWidths(COLUMN_SIZES);
/*
  Every helper below takes the column map last and defaults it to the Inbox's,
  so the Inbox's calls read as they always did and other tables pass their own.
*/
export function clampWidth(
  column: string,
  value: number,
  sizes: ColumnSizes = COLUMN_SIZES
) {
  const size = sizes[column];
  return Math.round(
    Math.max(
      size.min,
      Math.min(size.max, Number.isFinite(value) ? value : size.preferred)
    )
  );
}
export function readWidths(
  value: unknown,
  sizes: ColumnSizes = COLUMN_SIZES
): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key, width]) =>
          Object.prototype.hasOwnProperty.call(sizes, key) &&
          typeof width === "number" &&
          Number.isFinite(width)
      )
      .map(([key, width]) => [key, clampWidth(key, width as number, sizes)])
  );
}
export function sizeColumns(
  shown: string[],
  available: number | null,
  manual: Record<string, number>,
  sizes: ColumnSizes = COLUMN_SIZES
): Record<string, number> {
  if (Object.keys(manual).length)
    return Object.fromEntries(
      shown.map((key) => [
        key,
        clampWidth(key, manual[key] ?? sizes[key].preferred, sizes),
      ])
    );
  const preferred = shown.reduce((sum, key) => sum + sizes[key].preferred, 0);
  const minimum = shown.reduce((sum, key) => sum + sizes[key].min, 0);
  const maximum = shown.reduce((sum, key) => sum + sizes[key].max, 0);
  const target = Math.round(
    Math.max(
      minimum,
      Math.min(
        maximum,
        available === null
          ? preferred
          : available - SELECT_WIDTH - ACTIONS_WIDTH
      )
    )
  );
  const growing = target >= preferred;
  const room = growing ? maximum - preferred : preferred - minimum;
  // Carry rounding across columns so exact fits never create a 1px scrollbar.
  let fractional = 0,
    allocated = 0;
  return Object.fromEntries(
    shown.map((key) => {
      const size = sizes[key];
      const capacity = growing
        ? size.max - size.preferred
        : size.preferred - size.min;
      fractional +=
        size.preferred + (room ? ((target - preferred) * capacity) / room : 0);
      const width = Math.round(fractional) - allocated;
      allocated += width;
      return [key, width];
    })
  );
}
/**
 * The columns that fit `available` at their minimum widths, in their shown
 * order. Columns go lowest `priority` first (a column missing from `priority`
 * goes before any listed one); the most important column always stays. Used
 * while a record is docked beside the table: a pane that narrow should drop
 * columns, not scroll sideways under the pinned bookends. `null` (not yet
 * measured) keeps everything.
 */
export function fitColumns(
  shown: string[],
  available: number | null,
  priority: string[],
  sizes: ColumnSizes = COLUMN_SIZES
): string[] {
  if (available === null) return shown;
  const room = available - SELECT_WIDTH - ACTIONS_WIDTH;
  const rank = (key: string) => {
    const i = priority.indexOf(key);
    return i === -1 ? priority.length : i;
  };
  const keep = new Set(shown);
  let used = shown.reduce((sum, key) => sum + sizes[key].min, 0);
  const dropOrder = [...shown].sort((a, b) => rank(b) - rank(a));
  for (const key of dropOrder) {
    if (used <= room || keep.size <= 1) break;
    keep.delete(key);
    used -= sizes[key].min;
  }
  return shown.filter((key) => keep.has(key));
}
