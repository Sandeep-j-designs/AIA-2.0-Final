import type { ColumnSizes } from "@/components/inbox/v2/table-sizing";

/**
 * The Items table's column sizes, under the Inbox's rule (TABLE-RESIZING.md):
 * no minimum below what the header needs for its label and its sort and
 * filter buttons — 16px padding each side (Precision Indigo; +8 over the
 * old 12px), the label, 4px gaps, 20px a button. Sync Status holds a
 * dot-chip ("Sync failed") rather than a 16px icon, so it is that wide.
 *
 * The last five are the Columns menu's extras, off until someone turns them
 * on (28 Oct 2026): each minimum is its full header label plus its sort
 * button and the 32px of padding.
 */
export const ITEM_SIZES: ColumnSizes = {
  name: { min: 128, preferred: 300, max: 560 },
  under: { min: 120, preferred: 180, max: 320 },
  category: { min: 140, preferred: 170, max: 300 },
  unit: { min: 108, preferred: 130, max: 220 },
  openingStocks: { min: 152, preferred: 170, max: 260 },
  sync: { min: 136, preferred: 148, max: 160 },
  hsn: { min: 112, preferred: 120, max: 180 },
  gstRate: { min: 112, preferred: 128, max: 180 },
  openingRate: { min: 140, preferred: 150, max: 220 },
  godown: { min: 104, preferred: 190, max: 320 },
  lastSynced: { min: 128, preferred: 140, max: 200 },
};
