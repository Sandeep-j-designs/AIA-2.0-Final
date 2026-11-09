import { swapView } from "@/utils/swap-view";
import React, { useId, useMemo, useRef, useState } from "react";
import { TabIndicator } from "@/components/ui/tab-indicator";
import { useRouter } from "next/router";
import Collections from "@/components/inbox/v2/collections";
import Provisions from "@/components/inbox/v2/provisions";
import { overdueInvoices } from "@/utils/pages/inbox/ai-calculations";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  MoreVertical,
  Trash2,
  Plus,
  RotateCcw,
  Upload,
  Inbox as InboxIcon,
  Clock,
  Stamp,
  ListFilter,
  Undo2,
  Keyboard,
} from "@/components/icons";
import EmptyState, { type ActiveFilter, type FlowStep } from "./empty-state";
import { TextEditCell } from "./register-cells";
import EditableCell from "./editable-cell";
import {
  ColumnsMenu,
  lastPinned,
  pinnedOffsets,
  useColumnLayout,
  type ColumnSpec,
} from "./columns-menu";
import { voucherExtraColumns } from "./voucher-columns";
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
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import FilterChip from "@/components/common/filter-chip";
import DateFilter, { FY_PRESETS } from "@/components/common/date-filter";
import DateRangePanel from "@/components/common/date-filter/panel";
import { ColumnFilter, FilterPanel, type FilterCategory } from "./filter-panel";
import PageTopBar from "@/components/common/page-top-bar";
import OverlayScrollbars from "@/components/common/overlay-scrollbars";
import usePinEdges from "@/hooks/pages/inbox/use-pin-edges";
import { useColumnResize } from "@/hooks/pages/inbox/use-column-resize";
import {
  ACTIONS_WIDTH,
  REGISTER_COLUMN_SIZES,
  SELECT_WIDTH,
} from "./table-sizing";
import { useSalesBatches } from "@/hooks/pages/inbox/use-sales-upload";
import {
  AmountText,
  CELL_TRIGGER,
  CountPill,
  PageButton,
  QUIET_FIELD,
  QUIET_TOOL,
  StatusPill,
  T,
} from "./ui";
import { actor, routeNames, useStore, type Item, type Route } from "./store";
import UploadedInvoicesTable, {
  batchRows,
} from "./sales-upload/uploaded-invoices-table";
import {
  HEADER_CLASS,
  HeaderCell,
  SearchBox,
  TABLE_CLASS,
  UNDERLINE_TAB,
} from "./banking/table-parts";

/**
 * The posted-voucher registers — Purchases, Sales, Journal Vouchers.
 *
 * Built from Figma 25568:65382 (Purchases), 25568:78235 (Sales) and
 * 25568:78839 (Journal Vouchers).
 *
 * These used to be the Inbox's own table with a route filter on it, which put
 * a document queue's vocabulary — File, Status, Source, AI Route — on three
 * screens that are registers of accounting records. A register answers a
 * different question: which vouchers exist, what they are worth, and whether
 * ERP has them. So it carries voucher columns and the sync state, and the
 * document that produced each one is a click away rather than the subject.
 *
 * Create is deliberately inert. There is no manual voucher flow anywhere in
 * this prototype, and a button that opens the upload dialog instead would be
 * describing a product decision nobody has made.
 */

/** Minimum and maximum amount, the filter panel's Total Amount section. */
export const AmountFields = ({
  min,
  max,
  onChange,
}: {
  min: string;
  max: string;
  onChange: (key: "min" | "max", value: string) => void;
}) => (
  <div className="flex flex-col gap-4">
    {(
      [
        ["min", "Minimum amount", min],
        ["max", "Maximum amount", max],
      ] as const
    ).map(([key, label, value]) => (
      <label key={key} className="block">
        <span className={cn(T.label, "mb-1 block")}>{label}</span>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(key, e.target.value)}
        />
      </label>
    ))}
  </div>
);

export type RegisterFilters = {
  /** Vendor on a purchase register, customer on a sales one. */
  party: string;
  from: string;
  to: string;
  min: string;
  max: string;
};

const day = (value?: string) =>
  value && !Number.isNaN(Date.parse(value))
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

/** Whether ERP has this voucher, as the register states it. */
export type RegisterSyncState = "synced" | "syncing" | "failed" | "pending";

const SYNC_LABELS: Record<RegisterSyncState, string> = {
  synced: "Synced",
  syncing: "Syncing…",
  failed: "Sync failed",
  pending: "Not synced",
};

/**
 * ERP sync as the reference register's SyncPill: a dot-chip, colour only in
 * the 7px dot and the label in body ink. Synced and syncing sit on no ground;
 * the two that need attention — waiting, failed — earn a tint.
 */
const SYNC_DOT: Record<RegisterSyncState, string> = {
  synced: "bg-pi-success-dot",
  syncing: "bg-pi-brand-vivid animate-pulse motion-reduce:animate-none",
  pending: "bg-pi-warning-dot",
  failed: "bg-pi-danger-dot",
};
const SYNC_GROUND: Partial<Record<RegisterSyncState, string>> = {
  pending: "bg-pi-warning-bg",
  failed: "bg-pi-danger-bg text-pi-danger",
};

const SyncStatus = ({
  state,
  className,
}: {
  state: RegisterSyncState;
  className?: string;
}) => (
  <span
    title={SYNC_LABELS[state]}
    className={cn(
      "inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-xs px-2 py-1 text-small leading-4 text-pi-body",
      SYNC_GROUND[state],
      className
    )}
  >
    <span
      aria-hidden
      className={cn("size-[7px] flex-none rounded-full", SYNC_DOT[state])}
    />
    <span className="min-w-0 truncate">{SYNC_LABELS[state]}</span>
  </span>
);

type Column = {
  key: string;
  label: string;
  className?: string;
  align?: "left" | "right";
  cell: (item: Item) => React.ReactNode;
};

type SortDir = "asc" | "desc";
/**
 * What each column sorts by (27 Oct 2026), as Purchases' headers do. Sync
 * Status is left out: it reads the sync engine, not the voucher.
 */
const SORT_VALUE: Record<string, (item: Item) => string | number> = {
  date: (x) => x.form.date || "",
  voucherNo: (x) => x.form.voucherNo || "",
  party: (x) => (x.form.party || "").toLowerCase(),
  amount: (x) => x.amount,
  editedBy: (x) => x.doneBy || actor,
  editedAt: (x) => x.doneAt || x.received,
  status: (x) => x.status,
  voucherType: (x) => x.form.voucherType || "Journal",
  narration: (x) => (x.form.narration || "").toLowerCase(),
  createdBy: (x) => x.doneBy || actor,
  updatedAt: (x) => x.doneAt || x.received,
};

/**
 * One of the register's filter dropdowns, on a Bloocks FilterChip trigger —
 * the same chip as the Inbox's filter bar, so a filter reads "Vendor: Dell"
 * once set and its × clears it in place.
 */
const FilterMenu = ({
  label,
  value,
  onClear,
  children,
}: {
  label: string;
  /** What is applied, as the chip should say it; empty when nothing is. */
  value: string;
  onClear: () => void;
  children: React.ReactNode;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <FilterChip label={label} value={value} onClearButtonClick={onClear} />
    </PopoverTrigger>
    <PopoverContent
      align="start"
      className="w-64 rounded-md border-pi-line p-2 shadow-pi-2"
    >
      {children}
    </PopoverContent>
  </Popover>
);

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

const RangeField = ({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: "date" | "number";
  value: string;
  onChange: (value: string) => void;
}) => (
  <label className="block">
    <span className={cn(T.label, "mb-1 block")}>{label}</span>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-sm"
    />
  </label>
);

type RegisterProps = {
  route: Route;
  /** Every item for the company, already scoped to this route. */
  items: Item[];
  syncState: (item: Item) => RegisterSyncState;
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
  /**
   * Open a row. `ids` is the list as it stands on screen — this tab, these
   * filters, this order — so the review screen walks the same list and
   * comes back to it.
   */
  onOpen: (item: Item, ids: string[], tab: string) => void;
  /** The row whose record is docked beside the table, lit while it is. */
  activeId?: string;
  onDelete: (item: Item) => void;
  /** Opens the keyboard shortcuts drawer. */
  onOpenShortcuts?: () => void;
  /** Write one field from an in-place cell editor; false keeps it open. */
  onEditField: (
    item: Item,
    field: "voucherNo" | "party",
    value: string
  ) => boolean;
  /** Says a thing is real in the app but not here — Create, exports. */
  onUnbuilt: (what: string) => void;
  /** Create Invoice / New Journal Voucher: a blank voucher, entered by hand. */
  onCreate: () => void;
  /** Opens the Inbox, where this register's documents wait for review. */
  onOpenInbox?: () => void;
  /** Upload Sales: the spreadsheet upload flow. Sales only. */
  onUpload?: () => void;
  /** Open an import batch from the Uploaded Invoice tab at the given step. */
  onOpenUploadBatch?: (batchId: string, step: "mapping" | "preview") => void;
  /** The tab to open on, from the URL (?tab=uploads after an upload). */
  initialTab?: string;
  search: string;
  onSearchChange: (value: string) => void;
  /** Party, date range and amount range — the three the frames name. */
  filters: RegisterFilters;
  onFilterChange: (key: keyof RegisterFilters, value: string) => void;
  onResetFilters: () => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  pageSizes: number[];
  /** Rendered under the toolbar — the workspace's own filter controls. */
  children?: React.ReactNode;
};

const REGISTER_COPY: Record<
  Route,
  {
    /** The workspace eyebrow over the title — where the register lives. */
    eyebrow: string;
    title: string;
    create: string;
    upload?: string;
    /** The party column's name, which is the whole difference between AP and AR. */
    party: string;
    dateLabel: string;
    tabs: { id: string; label: string }[];
  }
> = {
  AP: {
    eyebrow: "Payables",
    title: "Purchases",
    create: "Create Purchase Voucher",
    upload: "Upload Purchases",
    party: "Vendor",
    dateLabel: "Bill Date",
    tabs: [
      { id: "all", label: "All Bills" },
      { id: "review", label: "Needs Review" },
      { id: "uploads", label: "Bill Uploads" },
    ],
  },
  AR: {
    eyebrow: "Receivables",
    title: "Sales",
    create: "Create Sales Voucher",
    upload: "Upload Sales",
    party: "Customer",
    dateLabel: "Invoice Date",
    // Needs Review mirrors Purchases (8 Oct 2026, user: "Sales module needs
    // a 'Needs Review' section as well"): the sales invoices still on their
    // way in, opened into the review form from here.
    tabs: [
      { id: "all", label: "All Invoices" },
      { id: "overdue", label: "Overdue" },
      { id: "review", label: "Needs Review" },
      { id: "uploads", label: "Uploaded Invoice" },
    ],
  },
  JV: {
    eyebrow: "Accounting",
    title: "Journal Vouchers",
    create: "New Journal Voucher",
    party: "Counterparty",
    dateLabel: "Voucher Date",
    // Every book reviews in its own tab, Journals included (8 Oct 2026).
    tabs: [
      { id: "all", label: "All Vouchers" },
      { id: "review", label: "Needs Review" },
    ],
  },
};

/** The Columns menu's storage name for each register. */
const REGISTER_LAYOUT_ID: Record<Route, string> = {
  AP: "purchases.register",
  AR: "sales",
  JV: "journals",
};

/** Posted is the register's subject; the other tabs are work on its way in. */
/**
 * The stages a register's documents move through, counted, for its empty
 * state (8 Oct 2026): Received → Needs review → Posted, the tab on screen
 * marked.
 */
export const registerFlow = (
  items: Item[],
  current: "review" | "all"
): FlowStep[] => [
  {
    label: "Received",
    count: items.filter((x) => x.status !== "Deleted").length,
    icon: InboxIcon,
  },
  {
    label: "Needs review",
    count: tabRows("review", items).length,
    icon: Clock,
    current: current === "review",
  },
  {
    label: "Posted",
    count: tabRows("all", items).length,
    icon: Stamp,
    current: current === "all",
  },
];

/** "1 bill" / "15 bills". */
export const countOf = (n: number, noun: string) =>
  `${n.toLocaleString("en-IN")} ${noun}${n === 1 ? "" : "s"}`;

/*
  A book's Needs Review holds the documents that are its vouchers in waiting:
  read, routed here, and waiting on a person — Needs Review and Duplicate.
  A file still being read, or one that couldn't be read, belongs to no book
  yet; the Inbox owns those. So this tab always equals the Inbox's Needs review
  plus Duplicate for the same book.
*/
export const tabRows = (tab: string, items: Item[]) =>
  tab === "overdue"
    ? overdueInvoices(items, items[0]?.company || "").map((x) => x.item)
    : tab === "review"
      ? items.filter((x) => ["Needs Review", "Duplicate"].includes(x.status))
      : tab === "uploads"
        ? items.filter((x) => x.source === "upload" && x.status !== "Deleted")
        : items.filter((x) => x.status === "Approved");

const Register = ({
  route,
  items,
  syncState,
  selected,
  onSelectedChange,
  onOpen,
  activeId,
  onDelete,
  onOpenShortcuts,
  onEditField,
  onUnbuilt,
  onCreate,
  onOpenInbox,
  onUpload,
  onOpenUploadBatch,
  initialTab,
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onResetFilters,
  pageSize,
  onPageSizeChange,
  pageSizes,
  children,
}: RegisterProps) => {
  const router = useRouter();
  const copy = REGISTER_COPY[route];
  const journal = route === "JV";
  const [tab, setTab] = useState(
    initialTab && copy.tabs.some((entry) => entry.id === initialTab)
      ? initialTab
      : "all"
  );
  const { company } = useStore();
  /** For the Uploaded Invoice tab's count chip; a read, nothing more. */
  const salesBatches = useSalesBatches(company);
  /*
    Sales' Uploaded Invoice tab lists spreadsheet import batches, not
    vouchers: its own table, and none of the voucher filters apply to it.
  */
  const batchTab = route === "AR" && tab === "uploads";
  const hasReviewTab = copy.tabs.some((entry) => entry.id === "review");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(null);
  /** Descending first, as Purchases and the Inbox do; a third click clears. */
  const toggleSort = (key: string) => {
    setSort((current) =>
      current?.key !== key
        ? { key, dir: "desc" }
        : current.dir === "desc"
          ? { key, dir: "asc" }
          : null
    );
    setPage(0);
  };
  // The page scroller, which owns the horizontal scroll the pinned Actions
  // column shades against.
  const scroller = useRef<HTMLDivElement | null>(null);
  const pinEdges = usePinEdges(scroller);

  /*
    Column funnels (27 Oct 2026), as Purchases and the Inbox have them. The
    columns that are lists of values — customer, voucher type, who, sync —
    filter by ticks, several at once; the date and amount columns open the
    same range pickers as the toolbar.
  */
  const [picks, setPicks] = useState<Record<string, string[]>>({});
  const PICK_VALUE: Record<string, (x: Item) => string> = {
    party: (x) => x.form.party || "",
    voucherType: (x) => x.form.voucherType || "Journal",
    // Journals' Created By is who posted it; Sales' (a Columns-menu column)
    // is who sent the document in, as its cell says.
    createdBy: (x) => (journal ? x.doneBy : x.sender) || actor,
    editedBy: (x) => x.doneBy || actor,
    status: (x) => x.status,
    sync: (x) => SYNC_LABELS[syncState(x)],
  };
  const pick = (key: string, next: string[]) => {
    setPicks((p) => ({ ...p, [key]: next }));
    setPage(0);
  };

  /** The names actually in this register, for the party filter. */
  const parties = useMemo(
    () => [...new Set(items.map((x) => x.form.party).filter(Boolean))].sort(),
    [items]
  );

  /** The party cell whose list is open, as `${id}:party`. */
  const [openCell, setOpenCell] = useState<string | null>(null);
  /*
    Figma draws the customer as a dropdown cell, and it is one (28 Oct 2026):
    Purchases' Vendor picker, offering the parties already in this register.
    Editable wherever the voucher number is, which is every row today.
  */
  const partyColumn: Column = {
    key: "party",
    label: copy.party,
    cell: (item) => (
      <EditableCell
        label={`${copy.party} name`}
        className={cn(CELL_TRIGGER, "text-pi-ink")}
        open={openCell === `${item.id}:party`}
        onOpenChange={(open) => setOpenCell(open ? `${item.id}:party` : null)}
        value={item.form.party}
        options={parties}
        editable
        onChange={(value) => onEditField(item, "party", value)}
      />
    ),
  };
  const amountColumn: Column = {
    key: "amount",
    label: "Amount",
    className: "text-right",
    align: "right",
    cell: (item) => (
      <span className="block whitespace-nowrap text-right [&_.fig]:font-normal">
        <AmountText value={item.amount} />
      </span>
    ),
  };
  /*
    A document still in review has no voucher in ERP yet, so "Not synced"
    would be true and useless. The review tab shows where the document stands
    instead — Needs Review, Extracting, Failed, Duplicate — as the Inbox does.
  */
  const statusColumn: Column = {
    key: "status",
    label: "Status",
    cell: (item) => <StatusPill status={item.status} className="-ml-2" />,
  };
  const syncColumn: Column = {
    key: "sync",
    label: "Sync Status",
    // -ml-2: the chip's own padding, so its dot sits on the header's line.
    cell: (item) => <SyncStatus state={syncState(item)} className="-ml-2" />,
  };
  /*
    The voucher number carries the pencil the Figma draws on it, and the
    pencil edits it in place (28 Oct 2026). Drawn on plain text it was a
    promise the row broke: the click fell through and opened the voucher.
  */
  const voucherNoColumn: Column = {
    key: "voucherNo",
    label: "Voucher No.",
    // An ID, so the reference register's mono cut ("AP/005/25-26").
    cell: (item) => (
      <TextEditCell
        label="Voucher number"
        value={item.form.voucherNo}
        editable
        onChange={(value) => onEditField(item, "voucherNo", value)}
      >
        {item.form.voucherNo ? (
          <span className="code text-small font-medium text-pi-ink">
            {item.form.voucherNo}
          </span>
        ) : (
          "—"
        )}
      </TextEditCell>
    ),
  };
  const dateColumn: Column = {
    key: "date",
    label: "Voucher Date",
    cell: (item) => (
      <span className="whitespace-nowrap tabular-nums text-pi-ink">
        {day(item.form.date)}
      </span>
    ),
  };

  const baseColumns: Column[] = journal
    ? [
        {
          key: "voucherType",
          label: "Voucher Type",
          cell: (item) => (
            // Body ink, as the Inbox's Voucher type: it describes the
            // voucher, it does not name it.
            <span className="block truncate text-pi-faint">
              {item.form.voucherType || "Journal"}
            </span>
          ),
        },
        dateColumn,
        voucherNoColumn,
        {
          key: "narration",
          label: "Narration",
          cell: (item) => (
            <span
              className="block truncate text-pi-faint"
              title={item.form.narration}
            >
              {item.form.narration || "—"}
            </span>
          ),
        },
        amountColumn,
        {
          key: "createdBy",
          label: "Created By",
          // Plain text, as Sales' Last Edited By (27 Oct 2026): the
          // initial-in-a-circle the Journals frame drew was the one avatar in
          // any register, so the column read differently from its twin.
          cell: (item) => (
            <span className="block truncate text-pi-faint">
              {item.doneBy || actor}
            </span>
          ),
        },
        tab === "review" ? statusColumn : syncColumn,
        {
          key: "updatedAt",
          label: "Last Updated At",
          cell: (item) => (
            <span className="whitespace-nowrap tabular-nums text-pi-faint">
              {day(item.doneAt || item.received)}
            </span>
          ),
        },
      ]
    : [
        dateColumn,
        voucherNoColumn,
        partyColumn,
        amountColumn,
        {
          key: "editedBy",
          label: "Last Edited By",
          cell: (item) => (
            <span className="block truncate text-pi-faint">
              {item.doneBy || actor}
            </span>
          ),
        },
        {
          key: "editedAt",
          label: "Last Edited At",
          cell: (item) => (
            <span className="whitespace-nowrap tabular-nums text-pi-faint">
              {day(item.doneAt || item.received)}
            </span>
          ),
        },
        tab === "review" ? statusColumn : syncColumn,
      ];

  /*
    Figma's wider column set ("AIA - Component Library" › Table), off until
    someone turns it on in the Columns menu (28 Oct 2026). The defaults above
    are Figma's default set; these follow in Figma's order.
  */
  const extraColumns = useMemo(() => voucherExtraColumns(route), [route]);
  const allColumns: Column[] = [
    ...baseColumns,
    ...extraColumns
      .filter((extra) => !baseColumns.some((c) => c.key === extra.key))
      .map(
        (extra): Column => ({
          key: extra.key,
          label: extra.label,
          align: extra.align,
          className: extra.align === "right" ? "text-right" : undefined,
          cell: extra.cell,
        })
      ),
  ];
  /** What each column sorts by: the extras bring their own. */
  const sortValue: Record<string, (item: Item) => string | number> = {
    ...SORT_VALUE,
    ...Object.fromEntries(
      extraColumns
        .filter((extra) => extra.sort)
        .map((extra) => [extra.key, extra.sort as (item: Item) => string | number])
    ),
  };
  /*
    One layout per register and tab family: the review tab swaps Sync Status
    for Status, so it keeps a column set of its own. Voucher No. is how a row
    is found, so it cannot be switched off.
  */
  const layout = useColumnLayout(
    `${REGISTER_LAYOUT_ID[route]}.${tab === "review" ? "review" : "all"}`,
    allColumns.map(
      (column): ColumnSpec => ({
        key: column.key,
        label: column.label,
        locked: column.key === "voucherNo",
        hidden: !baseColumns.some((c) => c.key === column.key),
      })
    )
  );
  const columns = layout.shown
    .map((key) => allColumns.find((column) => column.key === key))
    .filter((column): column is Column => !!column);
  const shownKeys = columns.map((column) => column.key);

  /*
    Fixed widths from REGISTER_COLUMN_SIZES, through the same hook Purchases
    uses, so a column holds its width across pages and tabs and can be
    dragged. The auto layout this replaces sized each column to whatever its
    longest value happened to be, so Sales and Journals never lined up with
    Purchases or with each other.
  */
  const resize = useColumnResize({
    shown: shownKeys,
    sizes: REGISTER_COLUMN_SIZES,
    storageKey: `register.${route}.widths.v1`,
  });
  /*
    Pinned columns stick after the checkbox, in the order they lead the grid,
    and the last one takes over the checkbox's shaded edge.
  */
  const pinLeft = pinnedOffsets(layout, resize.colWidth, SELECT_WIDTH);
  const pinEdge = lastPinned(layout);
  const pinScope = useId();

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tabRows(tab, items)
      .filter((x) =>
        !term
          ? true
          : [
              x.form.voucherNo,
              x.form.party,
              x.form.invoiceNo,
              x.form.narration,
              x.file.name,
            ].some((value) => (value || "").toLowerCase().includes(term))
      )
      .filter(
        (x) =>
          (!filters.party || x.form.party === filters.party) &&
          // The voucher's own date, not the day the file arrived: a register
          // is read against the books, and the books are dated by the voucher.
          (!filters.from || x.form.date >= filters.from) &&
          (!filters.to || x.form.date <= filters.to) &&
          (!filters.min || x.amount >= Number(filters.min)) &&
          (!filters.max || x.amount <= Number(filters.max)) &&
          // A column switched off in the Columns menu takes its funnel with
          // it, so it stops filtering too: nothing hides rows out of sight.
          Object.entries(picks).every(
            ([key, chosen]) =>
              !chosen.length ||
              !shownKeys.includes(key) ||
              chosen.includes(PICK_VALUE[key]?.(x) ?? "")
          )
      )
      .sort((a, b) => {
        const value =
          sort && shownKeys.includes(sort.key) && sortValue[sort.key];
        if (!value) return 0;
        const x = value(a),
          y = value(b);
        const order =
          typeof x === "number" && typeof y === "number"
            ? x - y
            : String(x).localeCompare(String(y));
        return sort.dir === "asc" ? order : -order;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, tab, filters, sort, picks, syncState, shownKeys.join("|")]);

  const pageRows = rows.slice(page * pageSize, (page + 1) * pageSize);
  /*
    The pager sits below the page scroller, so it is the register's for both
    tables: the Uploaded Invoice tab counts its batches the way its table
    filters them, and takes the page from here.
  */
  const total = batchTab ? batchRows(salesBatches, search).length : rows.length;
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min(total, (page + 1) * pageSize);

  const allOnPage =
    !!pageRows.length && pageRows.every((x) => selected.includes(x.id));
  const someOnPage = pageRows.some((x) => selected.includes(x.id));

  const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);
  /*
    A record docked beside the table narrows it, and the bar goes compact
    the same way in every module (27 Oct 2026): the view tabs alone on the
    first row; search, one filter panel and Reset on the second. Creating,
    uploading, Columns and the shortcuts are for the full-width table.
  */
  const compact = !!activeId;
  const pickCount = Object.values(picks).reduce((n, v) => n + v.length, 0);
  const panelCount =
    pickCount +
    (filters.party ? 1 : 0) +
    (filters.from || filters.to ? 1 : 0) +
    (filters.min ? 1 : 0) +
    (filters.max ? 1 : 0);
  const resetAll = () => {
    setPicks({});
    onResetFilters();
    onSearchChange("");
    setPage(0);
  };
  /** What is hiding rows, named for the empty state. */
  const activeFilters: ActiveFilter[] = [
    ...(search.trim() ? [{ label: `Search: “${search.trim()}”` }] : []),
    ...(filters.party ? [{ label: `${copy.party}: ${filters.party}` }] : []),
    ...(filters.from || filters.to
      ? [{ label: `${copy.dateLabel} range` }]
      : []),
    ...(filters.min || filters.max ? [{ label: "Amount range" }] : []),
    ...columns
      .filter((column) => picks[column.key]?.length)
      .map((column) => {
        const chosen = picks[column.key];
        return {
          label: `${column.label.replace(/\s+/g, " ")}: ${chosen.length === 1 ? chosen[0] : `${chosen.length} selected`}`,
        };
      }),
  ];
  /** The values a list column holds on this tab, for its funnel. */
  const optionsFor = (key: string) => {
    const counts = new Map<string, number>();
    tabRows(tab, items).forEach((x) => {
      const value = PICK_VALUE[key](x);
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    });
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([value, count]) => ({ value, label: value, count }));
  };
  const dateRange = {
    from: filters.from ? parseISO(filters.from) : undefined,
    to: filters.to ? parseISO(filters.to) : undefined,
  };
  const applyDates = ({ from, to }: { from?: Date; to?: Date }) => {
    onFilterChange("from", from ? format(from, "yyyy-MM-dd") : "");
    onFilterChange("to", to ? format(to, "yyyy-MM-dd") : "");
    setPage(0);
  };
  const setAmount = (key: "min" | "max", value: string) => {
    onFilterChange(key, value);
    setPage(0);
  };
  /** One filter per filterable column: the header funnels and, docked, the
      sections of the filter panel. */
  const filterCategories: FilterCategory[] = columns.flatMap(
    (column): FilterCategory[] => {
      const label = column.label.replace(/\s+/g, " ");
      if (PICK_VALUE[column.key])
        return [
          {
            id: column.key,
            label,
            options: optionsFor(column.key),
            selected: picks[column.key] ?? [],
            onChange: (next) => pick(column.key, next),
            activeCount: picks[column.key]?.length ?? 0,
          },
        ];
      if (column.key === "date")
        return [
          {
            id: "date",
            label,
            activeCount: filters.from || filters.to ? 1 : 0,
            custom: (
              <DateRangePanel
                value={dateRange}
                onApply={applyDates}
                presets={FY_PRESETS}
                presetsLabel="Date range"
                today={new Date()}
              />
            ),
          },
        ];
      if (column.key === "amount")
        return [
          {
            id: "amount",
            label,
            activeCount: (filters.min ? 1 : 0) + (filters.max ? 1 : 0),
            custom: (
              <AmountFields
                min={filters.min}
                max={filters.max}
                onChange={setAmount}
              />
            ),
          },
        ];
      return [];
    }
  );
  /** What a column's header funnel opens. */
  const columnFilter = (key: string) => {
    const category = filterCategories.find((c) => c.id === key);
    if (!category) return undefined;
    if (category.options)
      return (
        <ColumnFilter
          label={category.label}
          options={category.options}
          selected={category.selected ?? []}
          onChange={category.onChange ?? (() => {})}
        />
      );
    return key === "amount" ? (
      <div className="w-64 p-3">{category.custom}</div>
    ) : (
      category.custom
    );
  };
  const tabCount = (id: string) =>
    route === "AR" && id === "uploads"
      ? salesBatches.length
      : tabRows(id, items).length;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* The scroller's own box, so the overlay bars sit over the table and
        end above the pager. */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {/* The page's one scroller, both axes: heading and table scroll as a
        page, and the table header sticks at the top of the content area.
        Native bars reserve a strip under the last row; the overlay bars
        float over the rows instead. */}
        <div
          ref={scroller}
          className="table-scroller scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-auto overscroll-none"
        >
          {/* Heading and toolbar, pinned against the horizontal scroll so a
          widened table slides under them alone. */}
          <div className="sticky left-0 shrink-0 [transform:translateZ(0)]">
            <div className="shrink-0 px-page pt-6">
              {/*
          Create opens the register's own voucher form, blank. Upload is a
          real destination in the app that is not built here, and saying so
          is better than a button that quietly does something adjacent.
        */}
              <PageTopBar
                className="flex-wrap gap-x-4 gap-y-2"
                // The view tabs share the actions' row (8 Oct 2026).
                /*
                  Search and Columns sit on the toolbar row below on every
                  register, Journals included (27 Oct 2026, reversing the
                  one-row Journals of earlier that day): the first row is
                  views and actions, the second is how you narrow the list.
                */
                leading={
                  copy.tabs.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <div
                        role="tablist"
                        aria-label={`${copy.title} views`}
                        className="scrollbar-hide relative flex shrink-0 gap-6 overflow-x-auto overflow-y-hidden border-b border-pi-line"
                      >
                        {copy.tabs.map((entry) => (
                          <button
                            key={entry.id}
                            role="tab"
                            type="button"
                            aria-selected={tab === entry.id}
                            // Radix's attribute, so the shared tab and CountPill styles
                            // read the active state the same way here.
                            data-state={
                              tab === entry.id ? "active" : "inactive"
                            }
                            onClick={() =>
                              swapView(() => {
                                setTab(entry.id);
                                void router.replace(
                                  {
                                    pathname: "/inbox",
                                    query: { ...router.query, tab: entry.id },
                                  },
                                  undefined,
                                  { shallow: true, scroll: false }
                                );
                                setPage(0);
                                onSelectedChange([]);
                              })
                            }
                            className={cn(
                              UNDERLINE_TAB,
                              "inline-flex flex-none items-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none"
                            )}
                          >
                            {entry.label}
                            <CountPill>{tabCount(entry.id)}</CountPill>
                          </button>
                        ))}
                        <TabIndicator />
                      </div>
                    </div>
                  ) : undefined
                }
                eyebrow={copy.eyebrow}
                title={copy.title}
                secondaryButtonText={compact ? undefined : copy.create}
                secondaryIcon={Plus}
                onSecondaryButtonClick={onCreate}
                primaryText={compact ? undefined : copy.upload}
                leadingActions={
                  journal && !compact ? (
                    <Provisions company={company} />
                  ) : undefined
                }
                primaryIcon={Upload}
                onPrimaryButtonClick={() =>
                  onUpload ? onUpload() : onUnbuilt(copy.upload as string)
                }
              />
            </div>

            <div
              className={cn(
                "flex shrink-0 items-center gap-2 px-page py-4",
                // Docked, the search takes the row (Inbox and Purchases do).
                compact
                  ? "[&>div:first-child]:min-w-0 [&>div:first-child]:flex-1 [&>div:first-child]:sm:w-auto"
                  : "flex-wrap"
              )}
            >
              <SearchBox
                label={`Search ${copy.title.toLowerCase()}`}
                placeholder="Search…"
                value={search}
                onChange={(value) => {
                  onSearchChange(value);
                  setPage(0);
                }}
              />
              {/* The column filters behind one panel, beside the search, as
                  Purchases has it, docked or not. */}
              {!batchTab && (
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
                    <FilterPanel categories={filterCategories} onReset={resetAll} />
                  </PopoverContent>
                </Popover>
              )}
              {/*
          The three filters the frames name, and no more. A journal register
          has none of them: it is filtered by narration, which is what the
          search box is for.
        */}
              {!compact && !journal && !batchTab && (
                <>
                  <span aria-hidden className="h-6 w-px flex-none bg-pi-line" />
                  <FilterMenu
                    label={copy.party}
                    value={
                      (picks.party ?? []).length > 1
                        ? `${picks.party.length} selected`
                        : (picks.party?.[0] ?? "")
                    }
                    onClear={() => pick("party", [])}
                  >
                    <div className="max-h-64 overflow-y-auto">
                      {parties.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            const now = picks.party ?? [];
                            pick(
                              "party",
                              now.includes(name)
                                ? now.filter((x) => x !== name)
                                : [...now, name]
                            );
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                            picks.party?.includes(name)
                              ? "bg-pi-brand-tint font-medium text-pi-brand"
                              : "text-pi-ink hover:bg-pi-fill"
                          )}
                        >
                          <span className="truncate">{name}</span>
                        </button>
                      ))}
                      {!parties.length && (
                        <p className={cn(T.value, "px-2 py-2")}>
                          Nothing to filter yet.
                        </p>
                      )}
                    </div>
                  </FilterMenu>
                  <DateFilter
                    label={copy.dateLabel}
                    value={{
                      from: filters.from ? parseISO(filters.from) : undefined,
                      to: filters.to ? parseISO(filters.to) : undefined,
                    }}
                    onChange={({ from, to }) => {
                      onFilterChange(
                        "from",
                        from ? format(from, "yyyy-MM-dd") : ""
                      );
                      onFilterChange("to", to ? format(to, "yyyy-MM-dd") : "");
                      setPage(0);
                    }}
                  />
                  <FilterMenu
                    label="Total Amount"
                    value={amountRange(filters.min, filters.max)}
                    onClear={() => {
                      onFilterChange("min", "");
                      onFilterChange("max", "");
                      setPage(0);
                    }}
                  >
                    <div className="space-y-3 p-2">
                      <RangeField
                        label="Minimum"
                        type="number"
                        value={filters.min}
                        onChange={(v) => {
                          onFilterChange("min", v);
                          setPage(0);
                        }}
                      />
                      <RangeField
                        label="Maximum"
                        type="number"
                        value={filters.max}
                        onChange={(v) => {
                          onFilterChange("max", v);
                          setPage(0);
                        }}
                      />
                    </div>
                  </FilterMenu>
                </>
              )}
              {!batchTab && !compact && children}
              {!compact && <span className="flex-1" />}
              {/* Reset only once there is something to undo, as every other
                  register has it (28 Oct 2026): Sales used to show it always. */}
              {!batchTab && !compact && (panelCount > 0 || !!search) && (
                  <Button
                    variant="ghost"
                    className="whitespace-nowrap"
                    onClick={resetAll}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset Filters
                  </Button>
                )}
              {compact && (panelCount > 0 || !!search) && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Reset filters"
                  title="Reset filters"
                  onClick={resetAll}
                >
                  <Undo2 className="h-3 w-3" />
                </Button>
              )}
              {/* Overdue is Collections' own table, not these columns. */}
              {!batchTab && !compact && tab !== "overdue" && (
                <ColumnsMenu layout={layout} onResetWidths={resize.resetWidths} />
              )}
              {/* The shortcuts drawer's own button, as Purchases has it
                  (Figma's toolbar ends on it, 28 Oct 2026). */}
              {!compact && onOpenShortcuts && (
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

          {/* The table, edge to edge: no card and no scroll of its own. */}
          <div className="table-region swap-region flex min-w-0 flex-1 flex-col bg-background">
            {route === "AR" && tab === "overdue" ? (
              <Collections
                company={company}
                search={search}
                pageIds={pageRows.map((x) => x.id)}
                onOpen={(item) =>
                  onOpen(
                    item,
                    rows.map((x) => x.id),
                    "overdue"
                  )
                }
              />
            ) : batchTab ? (
              <UploadedInvoicesTable
                company={company}
                search={search}
                onOpen={(batchId, step) => onOpenUploadBatch?.(batchId, step)}
                page={page}
                pageSize={pageSize}
              />
            ) : (
              <div
                ref={resize.gridRef}
                className="min-w-0 flex-1"
                data-pin-scope={pinScope}
                {...pinEdges}
              >
                {/*
                  Pinned headers. HeaderCell owns the header cell and takes
                  no class or style, so the sticky offsets and the shaded edge
                  (globals.css's .pin-edge-l, restated) reach it by position:
                  the checkbox is child 1, so a column is its index + 2.
                */}
                {Object.keys(pinLeft).length > 0 && (
                  <style>
                    {Object.entries(pinLeft)
                      .map(([key, left]) => {
                        const th = `[data-pin-scope="${pinScope}"] thead th:nth-child(${shownKeys.indexOf(key) + 2})`;
                        return key === pinEdge
                          ? `${th}{position:sticky;left:${left}px;z-index:10;background:var(--pi-head-bg);overflow:visible}` +
                              `[data-pin-scope="${pinScope}"][data-pin-l] thead th:nth-child(${shownKeys.indexOf(key) + 2})::after{content:"";position:absolute;top:0;bottom:0;left:100%;width:12px;pointer-events:none;animation:pin-shade-in var(--dur-fast) var(--ease-enter);background:linear-gradient(to right,var(--pin-shade),transparent)}` +
                              `[data-pin-scope="${pinScope}"][data-pin-l] thead th:nth-child(${shownKeys.indexOf(key) + 2}){border-right-color:transparent}`
                          : `${th}{position:sticky;left:${left}px;z-index:10;background:var(--pi-head-bg)}`;
                      })
                      .join("")}
                  </style>
                )}
                {/* Hairline column rules on every column but Actions, which
                  shades its edge instead while columns scroll under it. */}
                <Table
                  style={{ width: resize.tableWidth }}
                  className={TABLE_CLASS}
                >
                  <TableHeader className={HEADER_CLASS}>
                    <TableRow className="hover:bg-transparent">
                      {/* Pinned left, opaque, as Purchases' checkbox is; its
                        edge shades unless a pinned column now holds it. */}
                      <TableHead
                        style={{ width: SELECT_WIDTH }}
                        className={cn(
                          "sticky left-0 z-10 h-row-header bg-pi-head-bg px-3 py-0 align-middle",
                          !pinEdge && "pin-edge-l"
                        )}
                      >
                        <Checkbox
                          aria-label={`Select every ${journal ? "voucher" : "row"} on this page`}
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
                      {columns.map((column) => (
                        <HeaderCell
                          key={column.key}
                          columnKey={column.key}
                          label={column.label}
                          sizes={REGISTER_COLUMN_SIZES}
                          resize={resize}
                          align={column.align}
                          sort={
                            !sortValue[column.key]
                              ? undefined
                              : sort?.key === column.key
                                ? sort.dir
                                : "none"
                          }
                          onSort={() => toggleSort(column.key)}
                          filter={columnFilter(column.key)}
                          filterActive={
                            !!filterCategories.find((c) => c.id === column.key)
                              ?.activeCount
                          }
                        />
                      ))}
                      {/* Pinned right, opaque, so the kebab stays in reach when
                        a narrow window scrolls the register sideways. */}
                      <TableHead
                        style={{ width: ACTIONS_WIDTH }}
                        className={cn(
                          "pin-edge-r sticky right-0 z-10 h-row-header bg-pi-head-bg px-4 py-0 align-middle",
                          T.head
                        )}
                      >
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((item) => {
                      const ticked = selected.includes(item.id);
                      // Lit: ticked, or the row whose record is docked beside.
                      const lit = ticked || item.id === activeId;
                      // Row hover wash, or the brand tint once lit.
                      const ground = lit
                        ? "bg-pi-brand-tint"
                        : "transition-colors duration-100 group-hover:bg-pi-row-hover motion-reduce:transition-none";
                      return (
                        <TableRow
                          key={item.id}
                          aria-selected={ticked}
                          aria-current={
                            item.id === activeId ? "true" : undefined
                          }
                          className="group cursor-pointer hover:bg-transparent"
                          onClick={() =>
                            onOpen(
                              item,
                              rows.map((x) => x.id),
                              tab
                            )
                          }
                        >
                          <TableCell
                            className={cn(
                              "sticky left-0 z-[1] h-row px-3 py-0 align-middle",
                              !pinEdge && "pin-edge-l",
                              !lit && "bg-background",
                              ground,
                              lit && "shadow-[inset_2px_0_0_var(--pi-brand)]"
                            )}
                            onClick={(e) => e.stopPropagation()}
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
                          {columns.map((column) => {
                            const left = pinLeft[column.key];
                            const pinned = left !== undefined;
                            return (
                              <TableCell
                                key={column.key}
                                style={pinned ? { left } : undefined}
                                className={cn(
                                  "h-row overflow-hidden px-4 py-0 align-middle",
                                  T.cell,
                                  pinned && "sticky z-[1]",
                                  pinned && !lit && "bg-background",
                                  column.key === pinEdge && "pin-edge-l",
                                  ground,
                                  column.className
                                )}
                              >
                                {/* The shaded edge hangs outside its cell,
                                    so that cell clips with an inner box. */}
                                {column.key === pinEdge ? (
                                  <div className="min-w-0 overflow-hidden">
                                    {column.cell(item)}
                                  </div>
                                ) : (
                                  column.cell(item)
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell
                            className={cn(
                              "pin-edge-r sticky right-0 z-[1] h-row px-4 py-0 align-middle",
                              !lit && "bg-background",
                              ground
                            )}
                            onClick={(e) => e.stopPropagation()}
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
                              {/* Figma's row menu (28 Oct 2026): View, then
                                Delete in red, the one red action. A
                                document still in review opens in the Inbox's
                                review screen, so it says so. */}
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
                                  {item.status === "Approved" ? (
                                    <>
                                      <Eye className="mr-2 h-4 w-4" />
                                      {journal ? "View Voucher" : "View Invoice"}
                                    </>
                                  ) : (
                                    <>
                                      <InboxIcon className="mr-2 h-4 w-4" />
                                      Open in Inbox
                                    </>
                                  )}
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
                    route={route}
                    items={items}
                    filters={activeFilters}
                    onClear={resetAll}
                    // A register with its own Needs Review tab reviews there;
                    // Journals still send you to the Inbox.
                    onReview={
                      hasReviewTab || !onOpenInbox
                        ? () => setTab("review")
                        : onOpenInbox
                    }
                    reviewInInbox={!hasReviewTab && !!onOpenInbox}
                    onViewPosted={() => setTab("all")}
                    onUpload={onUpload}
                    onCreate={onCreate}
                  />
                )}
              </div>
            )}
          </div>
        </div>
        <OverlayScrollbars scroller={scroller} />
      </div>

      {/* The Inbox footer: rows per page, then the page controls. Below the
        page scroller, not inside it: it stays at the bottom of the viewport,
        and the horizontal bar ends above it. */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-pi-line bg-background px-6 py-2">
        <div className="flex items-center gap-2">
          <span className={cn(T.cell, "text-foreground")}>Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              onPageSizeChange(Number(value));
              setPage(0);
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
            onClick={() => setPage(0)}
          >
            <ChevronsLeft />
          </PageButton>
          <PageButton
            label="Previous page"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft />
          </PageButton>
          <span className={cn(T.cell, "px-2 tabular-nums text-foreground")}>
            {total ? `${start} - ${end} of ${total}` : "0 of 0"}
          </span>
          <PageButton
            label="Next page"
            disabled={end >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight />
          </PageButton>
          <PageButton
            label="Last page"
            disabled={end >= total}
            onClick={() => setPage(lastPage)}
          >
            <ChevronsRight />
          </PageButton>
        </div>
      </div>
    </div>
  );
};

const NOUN: Record<Route, string> = {
  AP: "bill",
  AR: "sales invoice",
  JV: "journal",
};

/**
 * A register with nothing to list (8 Oct 2026). Filtered to nothing, it names
 * the filters and offers to clear them. Truly empty, it shows where the
 * documents are — usually one stage back, waiting for review — and acts on
 * that stage: the register's own Needs Review tab (Purchases), or the Inbox
 * (Sales and Journals, which review there).
 */
export const RegisterEmpty = ({
  tab,
  route,
  items,
  filters,
  onClear,
  onReview,
  reviewInInbox,
  onViewPosted,
  onUpload,
  onCreate,
}: {
  tab: "all" | "review";
  route: Route;
  items: Item[];
  filters: ActiveFilter[];
  onClear: () => void;
  onReview: () => void;
  /** The button says "in Inbox" when that is where it goes. */
  reviewInInbox?: boolean;
  onViewPosted: () => void;
  onUpload?: () => void;
  onCreate: () => void;
}) => {
  const noun = NOUN[route];
  const { create, upload } = REGISTER_COPY[route];
  const waiting = tabRows("review", items).length;
  const posted = tabRows("all", items).length;
  const inTab = tab === "all" ? posted : waiting;

  if (filters.length && inTab)
    return (
      <EmptyState
        title={`No ${noun}s match these filters`}
        body={`${tab === "all" ? countOf(posted, `posted ${noun}`) : `${countOf(waiting, noun)} waiting for review`}, but none match. Clear the filters to see them.`}
        filters={filters}
        onClear={onClear}
      />
    );

  const uploadButton = (primary: boolean) =>
    onUpload && upload ? (
      <Button variant={primary ? "default" : "outline"} onClick={onUpload}>
        <Upload className="h-4 w-4" />
        {upload}
      </Button>
    ) : null;
  const createButton = (primary: boolean) => (
    <Button variant={primary ? "default" : "outline"} onClick={onCreate}>
      <Plus className="h-4 w-4" />
      {create}
    </Button>
  );
  const flow = registerFlow(items, tab);

  if (tab === "all")
    return (
      <EmptyState
        flow={flow}
        title={`No posted ${noun}s yet`}
        body={
          waiting
            ? `${countOf(waiting, noun)} ${waiting === 1 ? "is" : "are"} waiting for your review${reviewInInbox ? " in the Inbox" : ""}. Approve one and the voucher it creates is listed here.`
            : `${route === "JV" ? "Send a journal note to the Inbox, or enter one by hand." : `Upload a ${noun}, or have one emailed or sent on WhatsApp.`} Once you approve it, the voucher it creates is listed here.`
        }
        actions={
          waiting ? (
            <>
              <Button onClick={onReview}>
                Review {countOf(waiting, noun)}
                {reviewInInbox ? " in Inbox" : ""}
              </Button>
              {uploadButton(false) ?? createButton(false)}
            </>
          ) : (
            <>
              {uploadButton(true)}
              {createButton(!(onUpload && upload))}
            </>
          )
        }
      />
    );

  return (
    <EmptyState
      flow={flow}
      title="Nothing waiting for your review"
      body={
        posted
          ? `Every ${noun} received has been reviewed, and ${countOf(posted, "voucher")} ${posted === 1 ? "is" : "are"} posted. New ${noun}s appear here once AI Accountant has read them.`
          : `New ${noun}s appear here once AI Accountant has read them.`
      }
      actions={
        <>
          {posted ? (
            <Button variant="outline" onClick={onViewPosted}>
              View posted {noun}s
            </Button>
          ) : null}
          {uploadButton(true)}
        </>
      }
    />
  );
};

export default Register;
