import React from "react";
import EmptyState from "../empty-state";
import {
  CloudUpload,
  MoreVertical,
  RotateCcw,
  Scissors,
  Upload as UploadIcon,
} from "@/components/icons";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FileIcon from "@/components/inbox/common/file-icon";
import { cn } from "@/lib/utils";
import type { SplitPacket } from "@/types/pages/inbox/bill-splitter";
import { billsOf } from "@/utils/pages/inbox/bill-splitter";
import { StatusPill, T } from "../ui";
import { DotChip } from "../sales-upload/common";
import type { Item } from "../store";
import type { ColumnSpec } from "../columns-menu";

/*
  Figma "AIA - Component Library" › Table, Bill Uploads (28 Oct 2026): File,
  Size, Linked Voucher, Uploaded By, Uploaded At, Processing status. Size
  left the file cell for a column of its own; Pages waits in the Columns
  menu. The register owns the layout, since its toolbar holds the menu.
*/
export const UPLOAD_COLUMNS: ColumnSpec[] = [
  { key: "file", label: "File", locked: true },
  { key: "size", label: "Size" },
  { key: "linked", label: "Linked Voucher" },
  { key: "uploadedBy", label: "Uploaded By" },
  { key: "uploadedAt", label: "Uploaded At" },
  { key: "status", label: "Processing status" },
  { key: "pages", label: "Pages", hidden: true },
];
/** Fixed widths; File takes what is left over. */
const WIDTH: Record<string, string> = {
  size: "w-[104px]",
  linked: "w-[184px]",
  uploadedBy: "w-[148px]",
  uploadedAt: "w-[184px]",
  status: "w-[168px]",
  pages: "w-20",
};
const RIGHT = new Set(["pages"]);

/** Bytes as the upload dialog prints them. */
const kb = (bytes: number) =>
  bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;

type Props = {
  /** The columns on screen, in order (the register's Columns menu). */
  columns?: string[];
  label?: (key: string) => string;
  packets: SplitPacket[];
  /** Bills uploaded one at a time through Upload Bills. */
  uploads: Item[];
  onOpenUpload: (item: Item) => void;
  onReview: (packet: SplitPacket) => void;
  onRetry: (packet: SplitPacket) => void;
  onRemove: (packet: SplitPacket) => void;
  onRemoveUpload: (item: Item) => void;
  /** The register's search, so a miss is said as a miss, not as "nothing". */
  search?: string;
  onClearSearch?: () => void;
  onUpload?: () => void;
};

const stamp = (iso: string) => format(new Date(iso), "d MMM yyyy, h:mm aaa");

/** The PRD's four packet states, in the words it gives them, as dot-chips. */
const PacketStatus = ({
  packet,
  className,
}: {
  packet: SplitPacket;
  className?: string;
}) => {
  switch (packet.status) {
    case "inProgress":
      return (
        <DotChip tone="progress" className={className}>
          In progress
        </DotChip>
      );
    case "splitReady":
      return (
        <DotChip tone="warn" className={className}>
          Split ready
        </DotChip>
      );
    case "failed":
      return (
        <DotChip tone="error" className={className}>
          Failed
        </DotChip>
      );
    case "completed":
      return (
        <DotChip tone="ok" className={className}>
          Completed
        </DotChip>
      );
  }
};

/** The line under the file name: what the packet is doing, in words. */
const packetDetail = (packet: SplitPacket) => {
  if (packet.status === "inProgress")
    return "Reading pages and finding where each bill starts";
  if (packet.status === "failed") return packet.failure?.reason ?? "";
  if (packet.status === "completed")
    return `Split into ${packet.billCount} ${packet.billCount === 1 ? "bill" : "bills"} · sent to Needs Review`;
  const bills = packet.plan ? billsOf(packet.plan).length : 0;
  return `${bills} ${bills === 1 ? "bill" : "bills"} found across ${packet.pageCount} pages`;
};

/**
 * Bill Uploads — files on their way in. A multi-bill packet lives here, not
 * in Needs Review, until its split is confirmed (PRD); single bills sit here
 * beside it with the Inbox's own status.
 */
const BillUploadsTable = ({
  columns = UPLOAD_COLUMNS.filter((c) => !c.hidden).map((c) => c.key),
  label = (key) => UPLOAD_COLUMNS.find((c) => c.key === key)?.label ?? key,
  packets,
  uploads,
  onOpenUpload,
  onReview,
  onRetry,
  onRemove,
  onRemoveUpload,
  search,
  onClearSearch,
  onUpload,
}: Props) => {
  const head = cn("h-row-header whitespace-nowrap px-4 py-0 align-middle", T.head);
  // Row hover wash across the whole row, the Inbox's.
  const cell = cn(
    "h-row px-4 py-0 align-middle transition-colors duration-100 group-hover:bg-pi-row-hover motion-reduce:transition-none",
    T.cell
  );

  const plain = (value: string, ink = "text-pi-body") => (
    <span
      className={cn("block truncate whitespace-nowrap", ink)}
      title={value}
    >
      {value}
    </span>
  );
  const packetCell = (key: string, packet: SplitPacket) => {
    switch (key) {
      case "file":
        return (
          <div className="flex min-w-0 items-center gap-2">
            <FileIcon ext="pdf" bare />
            <div className="min-w-0">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="truncate font-medium text-pi-ink"
                  title={packet.fileName}
                >
                  {packet.fileName}
                </span>
                <span className="flex-none rounded-xs bg-pi-fill px-2 py-px text-caption font-medium leading-4 text-pi-body">
                  Multi-bill
                </span>
              </span>
              <span
                className={cn(
                  T.sub,
                  "block truncate",
                  packet.status === "failed" && "text-pi-danger"
                )}
                title={packetDetail(packet)}
              >
                {packetDetail(packet)}
              </span>
            </div>
          </div>
        );
      case "size":
        return plain(packet.size ? kb(packet.size) : "—", "text-pi-faint");
      // A packet becomes several bills, each with its own voucher in Needs
      // Review; the file itself links to none.
      case "linked":
        return plain("—", "text-pi-faint");
      case "uploadedBy":
        return plain(packet.uploadedBy);
      case "uploadedAt":
        return plain(stamp(packet.uploadedAt));
      case "status":
        // -ml-2: the chip's padding, so its dot sits on the header's line.
        return <PacketStatus packet={packet} className="-ml-2" />;
      case "pages":
        return <span className="fig">{packet.pageCount || "—"}</span>;
      default:
        return null;
    }
  };
  const uploadCell = (key: string, item: Item) => {
    switch (key) {
      case "file":
        return (
          <div className="flex min-w-0 items-center gap-2">
            <FileIcon ext={item.file.ext || "pdf"} bare />
            <span
              className="block min-w-0 truncate font-medium text-pi-ink"
              title={item.file.name}
            >
              {item.file.name}
            </span>
          </div>
        );
      case "size":
        return plain(item.file.size || "—", "text-pi-faint");
      // The voucher the upload was read into, once it has a number.
      case "linked":
        return item.form.voucherNo ? (
          <span
            className="code block truncate text-small text-pi-body"
            title={item.form.voucherNo}
          >
            {item.form.voucherNo}
          </span>
        ) : (
          plain("—", "text-pi-faint")
        );
      case "uploadedBy":
        return plain(item.sender);
      case "uploadedAt":
        return plain(stamp(item.received));
      case "status":
        return <StatusPill status={item.status} className="-ml-2" />;
      case "pages":
        return <span className="text-pi-faint">—</span>;
      default:
        return null;
    }
  };

  return (
    // No scroll of its own: the register page scrolls both axes, and the
    // header sticks against it.
    <div className="min-w-0 flex-1">
      {/* Hairline rules between the columns. */}
      <Table className="min-w-[1280px] table-fixed border-separate border-spacing-0 bg-background [&_:is(th,td):not(:last-child)]:border-r [&_td]:border-b [&_td]:border-pi-line [&_th]:border-b [&_th]:border-pi-line">
        <TableHeader className="sticky top-0 z-10 bg-pi-head-bg [&_tr]:shadow-none">
          <TableRow className="hover:bg-transparent">
            {columns.map((key, i) => (
              <TableHead
                key={key}
                className={cn(
                  head,
                  WIDTH[key],
                  i === 0 && "pl-5",
                  RIGHT.has(key) && "text-right"
                )}
              >
                {label(key)}
              </TableHead>
            ))}
            <TableHead className={cn(head, "w-[196px] pr-5 text-right")}>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packets.map((packet) => (
            <TableRow
              key={packet.id}
              className={cn(
                "group hover:bg-transparent",
                packet.status === "splitReady" && "cursor-pointer"
              )}
              onClick={() => packet.status === "splitReady" && onReview(packet)}
            >
              {columns.map((key, i) => (
                <TableCell
                  key={key}
                  className={cn(
                    cell,
                    i === 0 && "pl-5",
                    RIGHT.has(key) && "text-right"
                  )}
                >
                  {packetCell(key, packet)}
                </TableCell>
              ))}
              <TableCell
                className={cn(cell, "pr-5 text-right")}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="inline-flex items-center gap-1">
                  {packet.status === "splitReady" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onReview(packet)}
                    >
                      <Scissors className="h-3.5 w-3.5" />
                      Review split
                    </Button>
                  )}
                  {/* Retry only where it can help (PRD) — a locked or
                      oversized file fails the same way twice. */}
                  {packet.status === "failed" && packet.failure?.retryable && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onRetry(packet)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Retry
                    </Button>
                  )}
                  {packet.status !== "inProgress" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${packet.fileName}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onRemove(packet)}>
                          {packet.status === "completed"
                            ? "Remove from this list"
                            : "Remove"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </span>
              </TableCell>
            </TableRow>
          ))}
          {uploads.map((item) => (
            <TableRow
              key={item.id}
              className="group cursor-pointer hover:bg-transparent"
              onClick={() => onOpenUpload(item)}
            >
              {columns.map((key, i) => (
                <TableCell
                  key={key}
                  className={cn(
                    cell,
                    i === 0 && "pl-5",
                    RIGHT.has(key) && "text-right"
                  )}
                >
                  {uploadCell(key, item)}
                </TableCell>
              ))}
              <TableCell
                className={cn(cell, "pr-5 text-right")}
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${item.file.name}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onOpenUpload(item)}>
                      Open in Inbox
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onRemoveUpload(item)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!packets.length && !uploads.length &&
        (search?.trim() ? (
          <EmptyState
            title="No uploads match your search"
            body="Search looks at file names. Clear it to see every upload."
            filters={[{ label: `Search: “${search.trim()}”` }]}
            onClear={onClearSearch}
          />
        ) : (
          <EmptyState
            icon={CloudUpload}
            title="Nothing uploaded yet"
            body="Bills you upload appear here while they are read. A PDF with several bills in it goes through Upload Purchases ▾ → Split Purchases."
            actions={
              onUpload ? (
                <Button onClick={onUpload}>
                  <UploadIcon className="h-4 w-4" />
                  Upload Purchases
                </Button>
              ) : undefined
            }
          />
        ))}
    </div>
  );
};

export default BillUploadsTable;
