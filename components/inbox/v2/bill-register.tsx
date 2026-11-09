import { swapView } from "@/utils/swap-view";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Plus,
  Keyboard,
  ListFilter,
  MoreVertical,
  Scissors,
  Slash,
  Trash2,
  Undo2,
  Upload,
} from "@/components/icons";
import { format, parseISO } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DateFilter, { FY_PRESETS } from "@/components/common/date-filter";
import DateRangePanel from "@/components/common/date-filter/panel";
import PageTopBar from "@/components/common/page-top-bar";
import OverlayScrollbars from "@/components/common/overlay-scrollbars";
import { cn } from "@/lib/utils";
import {
  gridCellId,
  useGridKeyboard,
} from "@/hooks/pages/inbox/use-grid-keyboard";
import { useColumnResize } from "@/hooks/pages/inbox/use-column-resize";
import usePinEdges from "@/hooks/pages/inbox/use-pin-edges";
import FilterChip from "@/components/common/filter-chip";
import {
  ColumnFilter,
  FilterPanel,
  QuickFilter,
  type FilterOption,
} from "./filter-panel";
import {
  ACTIONS_WIDTH,
  BILL_COLUMN_SIZES,
  SELECT_WIDTH,
  type ColumnSizes,
} from "./table-sizing";
import {
  AmountText,
  CELL_TRIGGER,
  PageButton,
  QUIET_FIELD,
  QUIET_TOOL,
  T,
} from "./ui";
import EditableCell from "./editable-cell";
import { DateEditCell, TextEditCell } from "./register-cells";
import {
  HEADER_CLASS,
  TABLE_CLASS,
  UnderlineTabs,
} from "./banking/table-parts";
import {
  AmountFields,
  RegisterEmpty,
  tabRows,
  type RegisterFilters,
} from "./register";
import type { ActiveFilter } from "./empty-state";
import { actor, createSplitBills, type Item } from "./store";
import {
  ColumnsMenu,
  lastPinned,
  pinnedOffsets,
  useColumnLayout,
  type ColumnSpec,
} from "./columns-menu";
import {
  AttachmentsCell,
  PAYMENT,
  PaymentCell,
  paymentOf,
  day,
  voucherExtraColumns,
} from "./voucher-columns";
import { UPLOAD_COLUMNS } from "./bill-splitter/bill-uploads-table";
import {
  splitPackets,
  useSplitPackets,
} from "@/hooks/pages/inbox/use-split-packets";
import { billsOf, outputFiles } from "@/utils/pages/inbox/bill-splitter";
import type { SplitPacket, SplitPlan } from "@/types/pages/inbox/bill-splitter";
import BillUploadsTable from "./bill-splitter/bill-uploads-table";
import SplitUploadDialog from "./bill-splitter/split-upload-dialog";
import SplitReviewDialog from "./bill-splitter/split-review-dialog";

/**
 * The Purchases register — posted bills.
 *
 * Columns and header actions from Figma 24239:28355. The grid itself is the
 * Inbox's, on purpose: the same header (sort, filter, resize handle), the same
 * sticky checkbox and Actions bookends, the same keyboard cursor, the same
 * multi-select filters and the same pager, so moving between the Inbox and
 * Purchases does not mean learning a second table.
 *
 * Sales and Journal Vouchers are still ./register, on their older frames.
 */

type DateRange = { from?: Date; to?: Date };

const PAYMENT_OPTIONS: FilterOption[] = (
  Object.keys(PAYMENT) as (keyof typeof PAYMENT)[]
).map((value) => ({ value, label: PAYMENT[value].label }));

/** Whether ERP has this bill — the four states the Sales register shows. */
export type BillSyncState = "synced" | "syncing" | "failed" | "pending";

/*
  The Sales register's Sync Status cell (register.tsx SyncStatus), redrawn
  here rather than imported so the two registers can be edited apart; keep
  the dot, the ground and the markup in step with it. The labels follow the
  Figma library's sentence case (28 Oct 2026).
*/
const SYNC_LABELS: Record<BillSyncState, string> = {
  synced: "Synced",
  syncing: "Syncing…",
  failed: "Sync failed",
  pending: "Not synced",
};
const SYNC_DOT: Record<BillSyncState, string> = {
  synced: "bg-pi-success-dot",
  syncing: "bg-pi-brand-vivid animate-pulse motion-reduce:animate-none",
  pending: "bg-pi-warning-dot",
  failed: "bg-pi-danger-dot",
};
const SYNC_GROUND: Partial<Record<BillSyncState, string>> = {
  pending: "bg-pi-warning-bg",
  failed: "bg-pi-danger-bg text-pi-danger",
};
const SYNC_OPTIONS: FilterOption[] = (
  Object.keys(SYNC_LABELS) as BillSyncState[]
).map((value) => ({ value, label: SYNC_LABELS[value] }));

const SyncStatus = ({ state }: { state: BillSyncState }) => (
  <span
    title={SYNC_LABELS[state]}
    className={cn(
      // -ml-2: the chip's own padding, so its dot sits on the header's line.
      "-ml-2 inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-xs px-2 py-1 text-small leading-4 text-pi-body",
      SYNC_GROUND[state]
    )}
  >
    <span
      aria-hidden
      className={cn("size-[7px] flex-none rounded-full", SYNC_DOT[state])}
    />
    <span className="min-w-0 truncate">{SYNC_LABELS[state]}</span>
  </span>
);

const iso = (date?: Date) => (date ? format(date, "yyyy-MM-dd") : "");
const inRange = (value: string, range: DateRange) =>
  (!range.from || value >= iso(range.from)) &&
  (!range.to || value <= iso(range.to));

/** "₹1,000 – ₹5,000", "≥ ₹1,000", "≤ ₹5,000" for the amount chip. */
const amountRange = (min: string, max: string) => {
  const rupees = (v: string) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(v));
  if (min && max) return `${rupees(min)} – ${rupees(max)}`;
  if (min) return `≥ ${rupees(min)}`;
  if (max) return `≤ ${rupees(max)}`;
  return "";
};

const TABS = [
  { id: "all", label: "All Bills" },
  { id: "review", label: "Needs Review" },
  { id: "uploads", label: "Bill Uploads" },
];

/*
  Columns per tab, from Figma "AIA - Component Library" › Table (28 Oct
  2026). Each tab opens on Figma's default set; the frame's wider set of
  voucher columns waits, hidden, in the Columns menu. Voucher No. is how a
  bill is recognised, so it is the one column that cannot be switched off.

  The keys this file draws itself (with their in-place editors and
  filters) take the place of voucher-columns' read-only twins: Bill No. is
  the supplier's invoice number, Payment Status is its documentStatus. Its
  Bill Date is left out of All Bills, where Voucher Date is already that
  same field — a second column would only repeat it.
*/
const EXTRAS = voucherExtraColumns("AP");
const EXTRA = Object.fromEntries(EXTRAS.map((c) => [c.key, c]));
const OWN_EXTRA: Record<string, string> = {
  invoiceNo: "invoiceNo",
  due: "due",
  documentStatus: "payment",
  attachments: "attachments",
};
const extraSpecs = (skip: string[]): ColumnSpec[] =>
  EXTRAS.filter((c) => c.key !== "docDate")
    .map((c) => ({
      key: OWN_EXTRA[c.key] ?? c.key,
      label: c.label,
      hidden: true,
    }))
    .filter((c) => !skip.includes(c.key));

const ALL_COLUMNS: ColumnSpec[] = [
  { key: "date", label: "Voucher Date" },
  { key: "voucherNo", label: "Voucher No.", locked: true },
  { key: "party", label: "Vendor" },
  { key: "amount", label: "Amount" },
  { key: "editedBy", label: "Last Edited By" },
  // Hidden by default (5 Nov 2026): with it on, All Bills was wider than a
  // 1440 window and Sync Status slid under the pinned Actions. It waits in
  // the Columns menu.
  { key: "editedAt", label: "Last Edited At", hidden: true },
  { key: "sync", label: "Sync Status" },
  ...extraSpecs([]),
];
const REVIEW_COLUMNS: ColumnSpec[] = [
  { key: "voucherNo", label: "Voucher No.", locked: true },
  { key: "invoiceNo", label: "Supplier Inv No." },
  { key: "party", label: "Vendor" },
  { key: "date", label: "Bill Date" },
  { key: "due", label: "Due Date" },
  { key: "amount", label: "Total Amount" },
  { key: "payment", label: "Payment Status" },
  { key: "attachments", label: "Attachments" },
  ...extraSpecs(["invoiceNo", "due", "payment", "attachments"]),
  // Not posted, so no Sync Status here; who last touched it still helps.
  { key: "editedBy", label: "Last Edited By", hidden: true },
  { key: "editedAt", label: "Last Edited At", hidden: true },
];

/*
  Widths for the columns BILL_COLUMN_SIZES (table-sizing.ts) does not hold,
  kept here so the shared file stays the Sales register's to edit. Every
  `min` follows its rule: 32px padding + the label at 12/500 + 24px per
  sort or filter button, plus slack.
*/
const EXTRA_SIZES: ColumnSizes = {
  editedBy: { min: 152, preferred: 176, max: 304 },
  editedAt: { min: 152, preferred: 156, max: 220 },
  // "Not synced" in its chip, clear of the pinned Actions edge (5 Nov 2026).
  sync: { min: 168, preferred: 172, max: 240 },
  gst: { min: 184, preferred: 200, max: 320 },
  type: { min: 120, preferred: 152, max: 240 },
  ledger: { min: 120, preferred: 200, max: 360 },
  taxLedger: { min: 120, preferred: 144, max: 240 },
  costCentre: { min: 140, preferred: 168, max: 300 },
  narration: { min: 120, preferred: 240, max: 600 },
  taxable: { min: 160, preferred: 164, max: 240 },
  tax: { min: 136, preferred: 140, max: 220 },
  createdBy: { min: 140, preferred: 176, max: 304 },
  createdAt: { min: 136, preferred: 140, max: 220 },
};
/** All Bills' date and amount carry shorter or longer labels than Review's. */
const SIZES: Record<"all" | "review", ColumnSizes> = {
  review: { ...BILL_COLUMN_SIZES, ...EXTRA_SIZES },
  all: {
    ...BILL_COLUMN_SIZES,
    ...EXTRA_SIZES,
    date: { min: 176, preferred: 176, max: 240 },
    amount: { min: 136, preferred: 150, max: 240 },
  },
};

const RIGHT_ALIGNED = new Set(["amount", "taxable", "tax"]);

const SORT_VALUE: Record<string, (item: Item) => string | number> = {
  ...Object.fromEntries(
    EXTRAS.filter((c) => c.sort && !OWN_EXTRA[c.key]).map((c) => [
      c.key,
      c.sort!,
    ])
  ),
  voucherNo: (item) => item.form.voucherNo,
  invoiceNo: (item) => item.form.invoiceNo,
  date: (item) => item.form.date,
  due: (item) => item.form.due,
  amount: (item) => item.amount,
  attachments: (item) => item.original.attachmentCount ?? 1,
  editedBy: (item) => item.doneBy || actor,
  editedAt: (item) => item.doneAt || item.received,
};
const FILTERABLE = new Set([
  "party",
  "date",
  "due",
  "amount",
  "payment",
  "sync",
]);

type SortDir = "asc" | "desc";

/** A quiet 20px header icon button (sort, filter), as table-parts draws it. */
const HEAD_ICON_BUTTON =
  "grid h-5 w-5 flex-none place-items-center rounded-xs transition-colors duration-100 hover:bg-pi-fill hover:text-pi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none";

type Props = {
  /** Every item for the company, already scoped to Purchases. */
  items: Item[];
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
  /** Open a row, with the list on screen (see Register's onOpen). */
  onOpen: (item: Item, ids: string[], tab: string) => void;
  /** The row whose record is docked beside the table, lit while it is. */
  activeId?: string;
  onDelete: (item: Item) => void;
  /** Says a thing is real in the app but not here. */
  onUnbuilt: (what: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  /**
   * Bill date and amount ride on the workspace's filter state, as they do for
   * the other registers. Vendor, due date and payment are this table's own:
   * vendor is multi-select here, as every Inbox list filter is, and the other
   * two exist on no other screen.
   */
  filters: RegisterFilters;
  onFilterChange: (key: keyof RegisterFilters, value: string) => void;
  /** Clears the workspace-held filters; this table clears its own. */
  onResetFilters: () => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  pageSizes: number[];
  onUpload: () => void;
  /** Create Bill: a blank Purchase voucher, entered by hand. */
  onCreate: () => void;
  onOpenShortcuts: () => void;
  /** The workspace's search ref, so its "/" shortcut lands here. */
  searchRef: React.Ref<HTMLInputElement>;
  /** Scopes the split packets, as every upload is scoped. */
  company: string;
  /**
   * Write one field from an in-place cell editor. Returns false when the
   * store refuses it, so the editor stays open.
   */
  onEditField: (
    item: Item,
    field: "voucherNo" | "invoiceNo" | "party" | "date" | "due",
    value: string
  ) => boolean;
  /** Where ERP stands on a posted bill, for the Sync Status column. */
  syncState?: (item: Item) => BillSyncState;
};

const BillRegister = ({
  items,
  selected,
  onSelectedChange,
  onOpen,
  activeId,
  onDelete,
  onUnbuilt,
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onResetFilters,
  pageSize,
  onPageSizeChange,
  pageSizes,
  onUpload,
  onCreate,
  onOpenShortcuts,
  searchRef,
  company,
  onEditField,
  syncState = () => "pending",
}: Props) => {
  const compact = !!activeId;
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(
    null
  );
  const [vendors, setVendors] = useState<string[]>([]);
  const [payments, setPayments] = useState<string[]>([]);
  const [syncs, setSyncs] = useState<string[]>([]);
  const [due, setDue] = useState<DateRange>({});
  const [splitUploadOpen, setSplitUploadOpen] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const packets = useSplitPackets(company);
  const uploadsTab = tab === "uploads";
  /*
    A layout per tab, each kept on its own (28 Oct 2026): the two bill tabs
    open on different Figma sets, and Bill Uploads lists files, not bills.
  */
  const allLayout = useColumnLayout("purchases.all", ALL_COLUMNS);
  const reviewLayout = useColumnLayout("purchases.review", REVIEW_COLUMNS);
  const uploadsLayout = useColumnLayout("purchases.uploads", UPLOAD_COLUMNS);
  const layout = tab === "review" ? reviewLayout : allLayout;
  const shown = layout.shown;
  const sizes = SIZES[tab === "review" ? "review" : "all"];
  // A sort on a column switched off stops applying, rather than ordering
  // the rows by something no longer on screen.
  const activeSort = sort && shown.includes(sort.key) ? sort : null;
  /*
    &tab=review|uploads opens that tab: the review screen's way back, a
    ready-for-review notice, a split notice. &split=<id> also opens that
    packet's review once it is ready. The params go afterwards so the back
    button lands on the list, not on the dialog again.
  */
  const router = useRouter();
  useEffect(() => {
    const wanted = router.query.tab;
    if (wanted !== "uploads" && wanted !== "review") return;
    setTab(wanted);
    const split =
      typeof router.query.split === "string" ? router.query.split : "";
    if (
      split &&
      packets.some((p) => p.id === split && p.status === "splitReady")
    )
      setReviewId(split);
    const { tab: _tab, split: _split, ...rest } = router.query;
    void router.replace({ pathname: router.pathname, query: rest }, undefined, {
      shallow: true,
    });
  }, [router.query.tab, router.query.split]);
  /** Opening the review clears the toasts — one sits over its footer. */
  const openReview = (id: string) => {
    toast.dismiss();
    setReviewId(id);
  };
  const reviewPacket =
    packets.find((p) => p.id === reviewId && p.status === "splitReady") ?? null;

  /*
    Split ready is worth saying wherever you are on the screen: detection
    takes long enough that you will have looked away. Once per packet.
  */
  const announced = useRef(new Set<string>());
  useEffect(() => {
    packets.forEach((packet) => {
      if (packet.status !== "splitReady" || !packet.plan) return;
      if (announced.current.has(packet.id)) return;
      announced.current.add(packet.id);
      const count = billsOf(packet.plan).length;
      toast.success(`${packet.fileName} is ready to review`, {
        description: `${count} bills found across ${packet.pageCount} pages.`,
        action: {
          label: "Review split",
          onClick: () => openReview(packet.id),
        },
      });
    });
    // Anything already past this point when the screen opened is not news.
  }, [packets]);
  useEffect(() => {
    packets
      .filter((p) => p.status !== "inProgress")
      .forEach((p) => announced.current.add(p.id));
  }, []);

  /** Create N bills: one upload per bill, or per part of a long bill. */
  const createBills = (packet: SplitPacket, plan: SplitPlan) => {
    const groups = billsOf(plan);
    // Bill Upload's names — vendor code and invoice number, or the name the
    // accountant typed — with "(part 1 of 2)" on a bill over the page limit.
    const files = outputFiles(plan);
    createSplitBills(company, files);
    splitPackets.complete(packet.id, groups.length);
    setReviewId(null);
    const bills = `${groups.length} ${groups.length === 1 ? "bill" : "bills"}`;
    toast.success(
      files.length > groups.length
        ? `${bills} created from ${packet.fileName}, in ${files.length} files`
        : `${bills} created from ${packet.fileName}`,
      {
        description: "Each one is being read and will appear in Needs Review.",
      }
    );
  };

  const term = search.trim().toLowerCase();
  const shownPackets = packets.filter(
    (p) => !term || p.fileName.toLowerCase().includes(term)
  );
  const shownUploads = tabRows("uploads", items).filter(
    (x) => !term || x.file.name.toLowerCase().includes(term)
  );

  const billDate: DateRange = {
    from: filters.from ? parseISO(filters.from) : undefined,
    to: filters.to ? parseISO(filters.to) : undefined,
  };

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = tabRows(tab, items).filter(
      (x) =>
        (!term ||
          [x.form.voucherNo, x.form.party, x.form.invoiceNo, x.file.name].some(
            (value) => (value || "").toLowerCase().includes(term)
          )) &&
        (!vendors.length || vendors.includes(x.form.party)) &&
        (!payments.length || payments.includes(paymentOf(x))) &&
        // Sync is a posted bill's state, so it narrows All Bills only.
        (tab === "review" || !syncs.length || syncs.includes(syncState(x))) &&
        (!filters.from || x.form.date >= filters.from) &&
        (!filters.to || x.form.date <= filters.to) &&
        inRange(x.form.due, due) &&
        (!filters.min || x.amount >= Number(filters.min)) &&
        (!filters.max || x.amount <= Number(filters.max))
    );
    const value = activeSort && SORT_VALUE[activeSort.key];
    if (!activeSort || !value) return filtered;
    const sign = activeSort.dir === "asc" ? 1 : -1;
    return filtered.slice().sort((a, b) => {
      const x = value(a);
      const y = value(b);
      return (
        sign *
        (typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y), "en-IN", { numeric: true }))
      );
    });
  }, [
    items,
    search,
    tab,
    vendors,
    payments,
    syncs,
    syncState,
    due,
    filters,
    activeSort,
  ]);

  const vendorOptions: FilterOption[] = useMemo(
    () =>
      [...new Set(items.map((x) => x.form.party).filter(Boolean))]
        .sort()
        .map((name) => ({ value: name, label: name })),
    [items]
  );

  const pageRows = rows.slice(page * pageSize, (page + 1) * pageSize);
  const lastPage = Math.max(0, Math.ceil(rows.length / pageSize) - 1);

  // One width store for both tabs, as before the Columns menu: a column
  // dragged on All Bills keeps its width on Needs Review.
  const resize = useColumnResize({
    shown,
    sizes,
    storageKey: "purchases.widths.v1",
  });
  // Pinned columns stick after the checkbox, in the order they lead.
  const pinLeft = pinnedOffsets(layout, resize.colWidth, SELECT_WIDTH);
  const pinEdge = lastPinned(layout);
  // The page scroller, which owns the horizontal scroll; the resize hook's
  // grid ref is the table's box inside it, not the element that scrolls.
  const scroller = useRef<HTMLDivElement | null>(null);
  // Shades the pinned edges while columns are scrolled under them.
  const pinEdges = usePinEdges(scroller);

  const toggleSort = (key: string) => {
    if (!SORT_VALUE[key]) return;
    // Descending first, as the Inbox does: the newest or largest bill is the
    // one a clerk is usually after.
    setSort((current) =>
      current?.key !== key
        ? { key, dir: "desc" }
        : current.dir === "desc"
          ? { key, dir: "asc" }
          : null
    );
    setPage(0);
  };

  const grid = useGridKeyboard({
    gridRef: resize.gridElement as React.RefObject<HTMLElement>,
    rowCount: pageRows.length,
    colCount: shown.length,
    // The workspace's own instance of this hook already answers "/" and "?"
    // on every screen, this one included — answering them twice would toggle
    // the shortcuts drawer open and shut again.
    onOpenShortcuts: () => {},
    onFocusSearch: () => {},
    onActivateRow: (row) => {
      const item = pageRows[row];
      if (item)
        onOpen(
          item,
          rows.map((x) => x.id),
          tab
        );
    },
    onSortColumn: (col) => toggleSort(shown[col]),
    onFilterColumn: (col) =>
      document
        .getElementById(gridCellId(-1, col))
        ?.querySelector<HTMLElement>("[data-filter-trigger]")
        ?.click(),
  });

  const changePage = (next: number) => {
    setPage(next);
    onSelectedChange([]);
  };

  const anyFilter =
    !!vendors.length ||
    !!payments.length ||
    !!syncs.length ||
    !!due.from ||
    !!due.to ||
    !!filters.from ||
    !!filters.to ||
    !!filters.min ||
    !!filters.max;
  const resetAll = () => {
    onResetFilters();
    onSearchChange("");
    setVendors([]);
    setPayments([]);
    setSyncs([]);
    setDue({});
    changePage(0);
  };
  /** What is hiding rows, named for the empty state. */
  const activeFilters: ActiveFilter[] = [
    ...(search.trim() ? [{ label: `Search: “${search.trim()}”` }] : []),
    ...(vendors.length
      ? [
          {
            label: `Vendor: ${vendors.length === 1 ? vendors[0] : `${vendors.length} selected`}`,
          },
        ]
      : []),
    ...(payments.length
      ? [{ label: `Payment status: ${payments.join(", ")}` }]
      : []),
    ...(syncs.length
      ? [
          {
            label: `Sync status: ${syncs.map((s) => SYNC_LABELS[s as BillSyncState]).join(", ")}`,
          },
        ]
      : []),
    ...(filters.from || filters.to
      ? [{ label: `${layout.label("date")} range` }]
      : []),
    ...(due.from || due.to ? [{ label: "Due date range" }] : []),
    ...(filters.min || filters.max ? [{ label: "Amount range" }] : []),
  ];
  const panelCount =
    vendors.length +
    payments.length +
    syncs.length +
    (filters.min ? 1 : 0) +
    (filters.max ? 1 : 0) +
    (filters.from || filters.to ? 1 : 0) +
    (due.from || due.to ? 1 : 0);

  const setAmount = (key: "min" | "max", value: string) => {
    onFilterChange(key, value);
    setPage(0);
  };
  const setBillDate = ({ from, to }: DateRange) => {
    onFilterChange("from", iso(from));
    onFilterChange("to", iso(to));
    setPage(0);
  };

  /** What a column's header funnel opens. */
  const columnFilter = (key: string) => {
    switch (key) {
      case "party":
        return (
          <ColumnFilter
            label="Vendor"
            options={vendorOptions}
            selected={vendors}
            onChange={(next) => {
              setVendors(next);
              setPage(0);
            }}
          />
        );
      case "payment":
        return (
          <ColumnFilter
            label="Payment Status"
            options={PAYMENT_OPTIONS}
            selected={payments}
            onChange={(next) => {
              setPayments(next);
              setPage(0);
            }}
          />
        );
      case "sync":
        return (
          <ColumnFilter
            label="Sync Status"
            options={SYNC_OPTIONS}
            selected={syncs}
            onChange={(next) => {
              setSyncs(next);
              setPage(0);
            }}
          />
        );
      case "date":
      case "due":
        return (
          <DateRangePanel
            value={key === "date" ? billDate : due}
            onApply={(next) => {
              if (key === "date") setBillDate(next);
              else {
                setDue(next);
                setPage(0);
              }
            }}
            presets={FY_PRESETS}
            presetsLabel="Date range"
            today={new Date()}
          />
        );
      case "amount":
        return (
          <div className="w-64 p-3">
            <AmountFields
              min={filters.min}
              max={filters.max}
              onChange={setAmount}
            />
          </div>
        );
      default:
        return null;
    }
  };
  const filterActive = (key: string) =>
    key === "sync"
      ? !!syncs.length
      : key === "party"
      ? !!vendors.length
      : key === "payment"
        ? !!payments.length
        : key === "date"
          ? !!filters.from || !!filters.to
          : key === "due"
            ? !!due.from || !!due.to
            : key === "amount"
              ? !!filters.min || !!filters.max
              : false;

  /** The vendor cell whose list is open, as `${id}:party`. */
  const [openCell, setOpenCell] = useState<string | null>(null);
  const vendorNames = useMemo(
    () =>
      [...new Set(items.map((x) => x.form.party).filter(Boolean))].sort(),
    [items]
  );

  const cell = (key: string, item: Item) => {
    switch (key) {
      case "voucherNo":
        // An ID, so the reference register's mono cut ("AP/005/25-26").
        return (
          <TextEditCell
            label="Voucher number"
            value={item.form.voucherNo}
            editable
            onChange={(value) => onEditField(item, "voucherNo", value)}
            onClosed={grid.refocusGrid}
          >
            {item.form.voucherNo ? (
              <span className="code text-small font-medium text-pi-ink">
                {item.form.voucherNo}
              </span>
            ) : (
              "—"
            )}
          </TextEditCell>
        );
      case "invoiceNo":
        return (
          <TextEditCell
            label="Invoice number"
            value={item.form.invoiceNo}
            editable
            onChange={(value) => onEditField(item, "invoiceNo", value)}
            onClosed={grid.refocusGrid}
          />
        );
      case "party":
        // The bill's other side, in regular ink; the voucher no. is the
        // row's one medium weight (5 Nov 2026), as in the Inbox.
        return (
          <EditableCell
            label="Vendor name"
            className={cn(CELL_TRIGGER, "text-pi-ink")}
            open={openCell === `${item.id}:party`}
            onOpenChange={(open) =>
              setOpenCell(open ? `${item.id}:party` : null)
            }
            onClosed={grid.refocusGrid}
            value={item.form.party}
            options={vendorNames}
            editable
            onChange={(value) => onEditField(item, "party", value)}
          />
        );
      case "date":
        return (
          <DateEditCell
            label={tab === "review" ? "Bill date" : "Voucher date"}
            value={item.form.date}
            editable
            onChange={(value) => onEditField(item, "date", value)}
            onClosed={grid.refocusGrid}
          />
        );
      case "due":
        return (
          <DateEditCell
            label="Due date"
            value={item.form.due}
            editable
            onChange={(value) => onEditField(item, "due", value)}
            onClosed={grid.refocusGrid}
          />
        );
      case "amount":
        return (
          <span className="block truncate text-right tabular-nums [&_.fig]:font-normal">
            <AmountText value={item.amount} />
          </span>
        );
      case "payment":
        return <PaymentCell item={item} />;
      case "attachments":
        return <AttachmentsCell item={item} />;
      case "editedBy":
        return (
          <span className="block truncate text-pi-faint">
            {item.doneBy || actor}
          </span>
        );
      case "editedAt":
        return (
          <span className="whitespace-nowrap tabular-nums text-pi-faint">
            {day(item.doneAt || item.received)}
          </span>
        );
      case "sync":
        return <SyncStatus state={syncState(item)} />;
      default:
        return EXTRA[key]?.cell(item) ?? null;
    }
  };

  const allOnPage =
    !!pageRows.length && pageRows.every((x) => selected.includes(x.id));
  const someOnPage = pageRows.some((x) => selected.includes(x.id));

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* The scroller's own box, so the overlay bars sit over the table and
        end above the pager. */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {/* The page's one scroller, both axes: heading and table scroll as a
        page, and the table header and bookends stick against it. Native
        bars reserve a strip under the last row; the overlay bars float
        over the rows instead. */}
        <div
          ref={scroller}
          className="table-scroller scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-auto overscroll-none"
        >
          {/* Heading and toolbar, pinned against the horizontal scroll so a
          widened table slides under them alone. */}
          <div className="sticky left-0 shrink-0 [transform:translateZ(0)]">
            <div className="shrink-0 px-page pt-6">
              <PageTopBar
                className="flex-wrap gap-x-4 gap-y-2"
                eyebrow="Payables"
                title="Purchases"
                // The view tabs share the actions' row (8 Oct 2026).
                leading={
                  <UnderlineTabs
                    inline
                    tabs={TABS.map((entry) => ({
                      ...entry,
                      count:
                        tabRows(entry.id, items).length +
                        (entry.id === "uploads" ? packets.length : 0),
                    }))}
                    value={tab}
                    onChange={(next) =>
                      swapView(() => {
                        setTab(next);
                        setPage(0);
                        onSelectedChange([]);
                      })
                    }
                  />
                }
                /*
                  Docked, the bar is the same in every module (27 Oct 2026):
                  tabs alone on this row; search, the filter panel and Reset
                  below. Creating, uploading, Columns and the shortcuts wait
                  for the full-width table.
                */
                leadingActions={
                  compact ? undefined : (
                    <>
                      {/* Entering a bill by hand, beside the upload rather than
                  behind it — the same pairing the Sales and Journal
                  registers use. */}
                      <Button variant="secondary" onClick={onCreate}>
                        <Plus className="h-4 w-4" />
                        Create Purchase Voucher
                      </Button>
                      {/*
                A split button: the everyday upload on the face, the
                multi-bill splitter behind the chevron. The halves touch and
                overlap by a pixel, so their shared border is the one divider.
              */}
                      <div className="ui-split-button flex" role="group" aria-label="Add purchases">
                        <Button
                          className="rounded-r-none focus-visible:z-10"
                          onClick={onUpload}
                        >
                          <Upload className="h-4 w-4" />
                          Upload Purchases
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              className="-ml-px rounded-l-none focus-visible:z-10"
                              aria-label="More ways to add purchases"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* The multi-bill path's only entry (PRD). The main
                        button stays the single-bill upload and never enters
                        the splitter. */}
                            <DropdownMenuItem
                              onSelect={() => setSplitUploadOpen(true)}
                              className="items-start gap-2"
                            >
                              <Scissors className="mt-0.5 h-4 w-4 flex-none" />
                              <span className="flex flex-col">
                                Split Purchases
                                <span className={T.sub}>
                                  One PDF with several purchases — we’ll split
                                  it for you to check.
                                </span>
                              </span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </>
                  )
                }
              />
            </div>

            <div
              data-purchase-toolbar
              className={cn(
                "flex shrink-0 items-center gap-2 px-page py-4",
                !compact && "flex-wrap"
              )}
            >
              <div
                className={cn(
                  "relative",
                  compact ? "min-w-0 flex-1" : "w-full sm:w-[198px]"
                )}
              >
                <Input
                  data-quiet
                  ref={searchRef}
                  aria-label="Search purchases"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    setPage(0);
                  }}
                  className={cn("h-control pr-9 focus-visible:bg-background", QUIET_FIELD, T.cell, "text-foreground")}
                />
                {!search && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-xs bg-background"
                  >
                    <Slash className="h-3 w-3 text-pi-faint" />
                  </span>
                )}
              </div>
              {/* Uploads are files, not bills: the bill filters have nothing
            to act on there. Search still finds a file by name. */}
              {!uploadsTab && (
                <>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={
                          panelCount
                            ? `Filters, ${panelCount} applied`
                            : "Filters"
                        }
                        title="Filters"
                        className={cn("relative shrink-0", QUIET_TOOL)}
                      >
                        <ListFilter className="h-4 w-4" />
                        {panelCount ? (
                          <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-xs bg-pi-brand px-1 text-caption font-medium tabular-nums text-primary-foreground">
                            {panelCount}
                          </span>
                        ) : null}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-auto overflow-hidden rounded-md border-pi-line p-0 shadow-pi-2"
                    >
                      <FilterPanel
                        onReset={resetAll}
                        categories={[
                          {
                            id: "Bill Date",
                            label: layout.label("date"),
                            activeCount: filters.from || filters.to ? 1 : 0,
                            custom: (
                              <DateRangePanel
                                value={billDate}
                                onApply={setBillDate}
                                presets={FY_PRESETS}
                                presetsLabel="Date range"
                                today={new Date()}
                              />
                            ),
                          },
                          {
                            id: "Due Date",
                            label: "Due Date",
                            activeCount: due.from || due.to ? 1 : 0,
                            custom: (
                              <DateRangePanel
                                value={due}
                                onApply={(next) => {
                                  setDue(next);
                                  setPage(0);
                                }}
                                presets={FY_PRESETS}
                                presetsLabel="Date range"
                                today={new Date()}
                              />
                            ),
                          },
                          {
                            id: "Vendor",
                            label: "Vendor",
                            options: vendorOptions,
                            selected: vendors,
                            onChange: (next) => {
                              setVendors(next);
                              setPage(0);
                            },
                            activeCount: vendors.length,
                          },
                          {
                            id: "Payment Status",
                            label: "Payment Status",
                            options: PAYMENT_OPTIONS,
                            selected: payments,
                            onChange: (next) => {
                              setPayments(next);
                              setPage(0);
                            },
                            activeCount: payments.length,
                          },
                          ...(tab === "review"
                            ? []
                            : [
                                {
                                  id: "Sync Status",
                                  label: "Sync Status",
                                  options: SYNC_OPTIONS,
                                  selected: syncs,
                                  onChange: (next: string[]) => {
                                    setSyncs(next);
                                    setPage(0);
                                  },
                                  activeCount: syncs.length,
                                },
                              ]),
                          {
                            id: "Total Amount",
                            label: layout.label("amount"),
                            activeCount:
                              (filters.min ? 1 : 0) + (filters.max ? 1 : 0),
                            custom: (
                              <AmountFields
                                min={filters.min}
                                max={filters.max}
                                onChange={setAmount}
                              />
                            ),
                          },
                        ]}
                      />
                    </PopoverContent>
                  </Popover>
                  {!compact && (
                    <>
                      <span
                        aria-hidden
                        className="h-6 w-px flex-none bg-pi-line"
                      />
                      {/* Figma's three chips (28 Oct 2026): Vendor, the
                        date and the amount, named as the tab's columns
                        name them. They write the same state as the header
                        funnels and the panel. */}
                      <QuickFilter
                        label="Vendor"
                        options={vendorOptions}
                        selected={vendors}
                        onChange={(next) => {
                          setVendors(next);
                          setPage(0);
                        }}
                      />
                      <DateFilter
                        label={layout.label("date")}
                        value={billDate}
                        onChange={setBillDate}
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <FilterChip
                            label={layout.label("amount")}
                            value={amountRange(filters.min, filters.max)}
                            onClearButtonClick={() => {
                              setAmount("min", "");
                              setAmount("max", "");
                            }}
                          />
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-64 rounded-md border-pi-line p-3 shadow-pi-2"
                        >
                          <AmountFields
                            min={filters.min}
                            max={filters.max}
                            onChange={setAmount}
                          />
                        </PopoverContent>
                      </Popover>
                    </>
                  )}
                </>
              )}
              {!compact && <span className="flex-1" />}
              {/* Reset, Columns and the shortcuts chip end the bar, as in the
            Inbox; Reset only once there is something to undo. */}
              {(anyFilter || search) && (
                <Button
                  variant="ghost"
                  onClick={resetAll}
                  aria-label="Reset filters"
                  title="Reset filters"
                  size={compact ? "icon" : "default"}
                >
                  <Undo2 className="h-3 w-3" />
                  {!compact && "Reset Filters"}
                </Button>
              )}
              {/* Uploads choose their columns too; they have no widths to
                reset and no sticky grid to pin into. */}
              {!compact && (
                <ColumnsMenu
                  key={uploadsTab ? "uploads" : tab}
                  layout={uploadsTab ? uploadsLayout : layout}
                  onResetWidths={uploadsTab ? undefined : resize.resetWidths}
                  pinnable={!uploadsTab}
                />
              )}
              {compact ? null : (
                <button
                  type="button"
                  aria-label="Keyboard shortcuts"
                  title="Keyboard shortcuts"
                  onClick={onOpenShortcuts}
                  className="inline-flex size-control items-center justify-center rounded-sm text-pi-body transition-[background-color,color] duration-150 hover:bg-pi-fill hover:text-pi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                >
                  <Keyboard className="size-3.5" aria-hidden />
                </button>
              )}
            </div>
          </div>

          {/* The table, edge to edge: no card and no scroll of its own — the
          page above owns both axes. */}
          <div className="table-region swap-region flex min-w-0 flex-1 flex-col bg-background">
            {uploadsTab ? (
              <BillUploadsTable
                columns={uploadsLayout.shown}
                label={uploadsLayout.label}
                packets={shownPackets}
                uploads={shownUploads}
                onOpenUpload={(item) =>
                  onOpen(
                    item,
                    shownUploads.map((x) => x.id),
                    "uploads"
                  )
                }
                onRemoveUpload={onDelete}
                onReview={(packet) => openReview(packet.id)}
                onRetry={(packet) => splitPackets.retry(packet.id)}
                onRemove={(packet) => splitPackets.remove(packet.id)}
                search={search}
                onClearSearch={() => onSearchChange("")}
                onUpload={onUpload}
              />
            ) : (
              <>
                {/*
        The Inbox's grid: one tab stop, a cursor moved by the arrow keys,
        table-fixed so a dragged width holds, sticky header and bookends.
      */}
                <div
                  ref={resize.gridRef}
                  role="grid"
                  aria-label="Purchase bills"
                  {...pinEdges}
                  aria-rowcount={pageRows.length + 1}
                  aria-colcount={shown.length}
                  tabIndex={0}
                  aria-activedescendant={grid.activeDescendant}
                  onKeyDown={grid.onGridKeyDown}
                  className="min-w-0 flex-1 focus-visible:outline-none"
                >
                  <Table
                    role="none"
                    style={{ width: resize.tableWidth }}
                    className={cn(TABLE_CLASS, "bg-background")}
                  >
                    <TableHeader role="rowgroup" className={HEADER_CLASS}>
                      <TableRow role="row" aria-rowindex={1}>
                        <TableHead
                          role="columnheader"
                          style={{ width: SELECT_WIDTH }}
                          className={cn(
                            "sticky left-0 z-10 h-row-header bg-pi-head-bg px-3 py-0 align-middle",
                            !pinEdge && "pin-edge-l"
                          )}
                        >
                          <Checkbox
                            aria-label="Select every bill on this page"
                            checked={allOnPage ? true : someOnPage ? "indeterminate" : false}
                            onCheckedChange={() => {
                              const ids = pageRows.map((x) => x.id);
                              onSelectedChange(
                                someOnPage
                                  ? selected.filter((id) => !ids.includes(id))
                                  : Array.from(new Set([...selected, ...ids]))
                              );
                            }}
                          />
                        </TableHead>
                        {shown.map((key, col) => {
                          const label = layout.label(key);
                          const sortable = !!SORT_VALUE[key];
                          const width = resize.colWidth(key);
                          const size = sizes[key];
                          const left = pinLeft[key];
                          const pinned = left !== undefined;
                          return (
                            <TableHead
                              key={key}
                              role="columnheader"
                              id={gridCellId(-1, col)}
                              aria-colindex={col + 1}
                              aria-sort={
                                !sortable
                                  ? undefined
                                  : activeSort?.key !== key
                                    ? "none"
                                    : activeSort.dir === "asc"
                                      ? "ascending"
                                      : "descending"
                              }
                              style={{ width, left }}
                              data-grid-row={-1}
                              data-grid-col={col}
                              className={cn(
                                "h-row-header whitespace-nowrap px-4 py-0 align-middle",
                                // A pinned header sticks after the checkbox on
                                // the head strip's own ground.
                                pinned
                                  ? "sticky z-10 bg-pi-head-bg"
                                  : "relative",
                                key === pinEdge && "pin-edge-l",
                                T.head,
                                grid.isCursor(-1, col) &&
                                  "ring-2 ring-inset ring-primary"
                              )}
                            >
                              <div
                                className={cn(
                                  "flex h-4 min-w-0 items-center gap-1",
                                  RIGHT_ALIGNED.has(key) && "justify-end"
                                )}
                              >
                                <span className="truncate" title={label}>
                                  {label}
                                </span>
                                {sortable && (
                                  <button
                                    type="button"
                                    onClick={() => toggleSort(key)}
                                    aria-label={`Sort by ${label}`}
                                    className={cn(
                                      HEAD_ICON_BUTTON,
                                      activeSort?.key === key
                                        ? "text-pi-brand"
                                        : "text-pi-faint"
                                    )}
                                  >
                                    {activeSort?.key === key ? (
                                      activeSort.dir === "asc" ? (
                                        <ArrowUp className="h-3 w-3" />
                                      ) : (
                                        <ArrowDown className="h-3 w-3" />
                                      )
                                    ) : (
                                      <ArrowUpDown className="h-3 w-3" />
                                    )}
                                  </button>
                                )}
                                {FILTERABLE.has(key) && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button
                                        type="button"
                                        data-filter-trigger={key}
                                        aria-label={`Filter ${label}`}
                                        className={cn(
                                          HEAD_ICON_BUTTON,
                                          filterActive(key)
                                            ? "text-pi-brand"
                                            : "text-pi-faint"
                                        )}
                                      >
                                        <ListFilter className="h-3 w-3" />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      align="start"
                                      className="w-auto overflow-hidden rounded-md border-pi-line p-0 shadow-pi-2"
                                    >
                                      {columnFilter(key)}
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                              {/* Over the cell's right border. Double-click or Enter puts
                        the column back to its default width. */}
                              <span
                                role="separator"
                                aria-orientation="vertical"
                                aria-label={`Resize ${label}`}
                                tabIndex={0}
                                aria-valuemin={size.min}
                                aria-valuemax={size.max}
                                aria-valuenow={width}
                                aria-valuetext={`${width} pixels`}
                                title={`${width} px · Drag or use arrow keys to resize. Double-click or Enter to reset.`}
                                onPointerDown={(e) =>
                                  resize.startResize(key, e)
                                }
                                onDoubleClick={() => {
                                  if (resize.isManual)
                                    resize.resizeColumn(key, size.preferred);
                                }}
                                onKeyDown={(e) => {
                                  const step = e.shiftKey ? 40 : 10;
                                  const next =
                                    e.key === "ArrowRight"
                                      ? width + step
                                      : e.key === "ArrowLeft"
                                        ? width - step
                                        : e.key === "Home"
                                          ? size.min
                                          : e.key === "End"
                                            ? size.max
                                            : e.key === "Enter"
                                              ? size.preferred
                                              : null;
                                  if (next !== null) {
                                    e.preventDefault();
                                    // The grid would read these as cursor moves.
                                    e.stopPropagation();
                                    resize.resizeColumn(key, next);
                                  }
                                }}
                                className="group absolute -right-[5px] top-0 z-20 flex h-full w-[10px] cursor-col-resize touch-none items-stretch justify-center focus-visible:outline-none"
                              >
                                <span
                                  className={cn(
                                    "w-[2px] transition-colors group-hover:bg-pi-brand group-focus-visible:bg-pi-brand motion-reduce:transition-none",
                                    resize.resizing === key
                                      ? "bg-pi-brand"
                                      : "bg-transparent"
                                  )}
                                />
                              </span>
                            </TableHead>
                          );
                        })}
                        {/* Pinned right, so the kebab never scrolls out of reach. */}
                        <TableHead
                          role="columnheader"
                          style={{ width: ACTIONS_WIDTH }}
                          className="pin-edge-r sticky right-0 z-10 h-row-header bg-pi-head-bg px-4 py-0 align-middle"
                        >
                          <span
                            className={cn(
                              T.head,
                              "flex h-4 items-center truncate"
                            )}
                          >
                            Actions
                          </span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody role="rowgroup">
                      {pageRows.map((item, row) => {
                        const ticked = selected.includes(item.id);
                        // Lit: ticked, or the row whose record is docked beside.
                        const lit = ticked || item.id === activeId;
                        // Precision Indigo rows: a calm row-hover wash, the brand
                        // tint for a ticked row. Sticky cells paint the same
                        // grounds opaquely, or the columns scrolling under them
                        // show through.
                        const ground = lit
                          ? "bg-pi-brand-tint"
                          : "bg-background transition-colors duration-100 group-hover:bg-pi-row-hover motion-reduce:transition-none";
                        const flowGround = lit
                          ? "bg-pi-brand-tint"
                          : "transition-colors duration-100 group-hover:bg-pi-row-hover motion-reduce:transition-none";
                        return (
                          <TableRow
                            key={item.id}
                            role="row"
                            aria-rowindex={row + 2}
                            aria-selected={ticked}
                            onClick={() =>
                              onOpen(
                                item,
                                rows.map((x) => x.id),
                                tab
                              )
                            }
                            aria-current={
                              item.id === activeId ? "true" : undefined
                            }
                            className={cn(
                              "group cursor-pointer hover:bg-transparent",
                              lit && "bg-pi-brand-tint hover:bg-pi-brand-tint"
                            )}
                          >
                            <TableCell
                              role="gridcell"
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                "sticky left-0 z-[1] h-row px-3 py-0 align-middle",
                                !pinEdge && "pin-edge-l",
                                ground,
                                // The selected row's 2px brand edge.
                                lit && "shadow-[inset_2px_0_0_var(--pi-brand)]"
                              )}
                            >
                              <Checkbox
                                aria-label={`Select ${item.form.voucherNo || item.file.name}`}
                                checked={ticked}
                                onCheckedChange={(checked) =>
                                  onSelectedChange(
                                    checked
                                      ? [...selected, item.id]
                                      : selected.filter((id) => id !== item.id)
                                  )
                                }
                              />
                            </TableCell>
                            {shown.map((key, col) => (
                              <TableCell
                                key={key}
                                role="gridcell"
                                id={gridCellId(row, col)}
                                aria-colindex={col + 1}
                                aria-selected={grid.isSelected(row, col)}
                                data-grid-row={row}
                                data-grid-col={col}
                                style={
                                  pinLeft[key] !== undefined
                                    ? { left: pinLeft[key] }
                                    : undefined
                                }
                                className={cn(
                                  "h-row overflow-hidden px-4 py-0 align-middle",
                                  // Pinned cells paint the row's ground
                                  // opaquely, as the checkbox does, so the
                                  // columns scrolling under them never show.
                                  pinLeft[key] !== undefined
                                    ? cn("sticky z-[1]", ground)
                                    : flowGround,
                                  key === pinEdge && "pin-edge-l",
                                  T.cell,
                                  grid.isSelected(row, col) && "bg-accent",
                                  grid.isCursor(row, col) &&
                                    "ring-2 ring-inset ring-primary"
                                )}
                              >
                                <div className="flex h-row-box min-w-0 flex-col justify-center overflow-x-visible overflow-y-clip [&>.inline-flex]:self-start">
                                  {cell(key, item)}
                                </div>
                              </TableCell>
                            ))}
                            <TableCell
                              role="gridcell"
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                "pin-edge-r sticky right-0 z-[1] h-row px-4 py-0 align-middle",
                                ground
                              )}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Actions for ${item.form.voucherNo || item.file.name}`}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      onOpen(
                                        item,
                                        rows.map((x) => x.id),
                                        tab
                                      )
                                    }
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    {/* Figma's View Bill for a posted
                                      bill; one still in review opens where
                                      it is reviewed. */}
                                    {item.status === "Approved"
                                      ? "View Bill"
                                      : "Open in Inbox"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => onDelete(item)}
                                    className="text-pi-danger focus:bg-pi-danger-bg focus:text-pi-danger"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {!pageRows.length && (
                    <RegisterEmpty
                      tab={tab === "review" ? "review" : "all"}
                      route="AP"
                      items={items}
                      filters={activeFilters}
                      onClear={resetAll}
                      onReview={() => {
                        setTab("review");
                        changePage(0);
                      }}
                      onViewPosted={() => {
                        setTab("all");
                        changePage(0);
                      }}
                      onUpload={onUpload}
                      onCreate={onCreate}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <OverlayScrollbars scroller={scroller} />
      </div>

      {/* Below the page scroller, not inside it: the pager stays at the
          bottom of the viewport, and the horizontal bar ends above it. */}
      {!uploadsTab && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-pi-line bg-background px-6 py-2">
          <div className="flex items-center gap-2">
            <span className={cn(T.cell, "text-foreground")}>
              Rows per page:
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                onPageSizeChange(Number(value));
                changePage(0);
              }}
            >
              <SelectTrigger
                aria-label="Rows per page"
                className={cn(
                  "h-auto w-[72px] rounded-md border-border px-2 py-1",
                  T.cell,
                  "text-foreground"
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizes.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-0 sm:gap-1">
            <PageButton
              label="First page"
              disabled={page === 0}
              onClick={() => changePage(0)}
            >
              <ChevronsLeft />
            </PageButton>
            <PageButton
              label="Previous page"
              disabled={page === 0}
              onClick={() => changePage(page - 1)}
            >
              <ChevronLeft />
            </PageButton>
            <span className={cn(T.cell, "px-2 tabular-nums text-foreground")}>
              {rows.length
                ? `${page * pageSize + 1} - ${Math.min((page + 1) * pageSize, rows.length)} of ${rows.length}`
                : "0 of 0"}
            </span>
            <PageButton
              label="Next page"
              disabled={page >= lastPage}
              onClick={() => changePage(page + 1)}
            >
              <ChevronRight />
            </PageButton>
            <PageButton
              label="Last page"
              disabled={page >= lastPage}
              onClick={() => changePage(lastPage)}
            >
              <ChevronsRight />
            </PageButton>
          </div>
        </div>
      )}

      <SplitUploadDialog
        open={splitUploadOpen}
        onOpenChange={setSplitUploadOpen}
        onUploaded={(files) => {
          files.forEach(
            (file) => void splitPackets.addFile(company, actor, file)
          );
          // Packets are read in Bill Uploads, so that is where the dialog
          // hands off to — as Bill Upload's does.
          setTab("uploads");
          setPage(0);
        }}
      />
      <SplitReviewDialog
        packet={reviewPacket}
        onOpenChange={(open) => !open && setReviewId(null)}
        onCreate={createBills}
      />
    </div>
  );
};

export default BillRegister;
