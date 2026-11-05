import React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DatePickerPanel from "@/components/common/date-picker/panel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Status } from "./store";
import { useLateError } from "@/hooks/common/use-late-error";

/**
 * The Unified Inbox's presentational vocabulary, expressed in design-system
 * tokens and primitives.
 *
 * Geometry is the Accounts Payable prototype's (Prototypes/Accounts Payable,
 * also embedded at /ap/index.html by ./sheet.tsx) so the Inbox chrome and the
 * bill sheet it wraps read as one screen. Colour is production's token set,
 * with the accessibility overrides marked in styles/globals.css.
 *
 * Nothing here holds state or product logic — it is shape and colour only.
 */

/* ---------------------------------------------------------------- type scale
   Mirrors the .t-* classes in the Accounts Payable prototype. */
export const T = {
  /** .t-title — page heading */
  title: "text-h3 text-foreground",
  /** .t-section — section heading inside a panel */
  section: "text-lead font-semibold text-foreground",
  /** .t-label — field label */
  label: "text-caption font-medium leading-4 text-pi-body",
  /** .t-value — body value */
  value: "text-small font-normal leading-5 text-pi-body",
  /**
   * Table cell — 12/16, -0.12px, text-primary.
   *
   * Figma "Label/Label-3/Regular" (24421:72574). The ink is `foreground`, not
   * `secondary-foreground`: cell values are the content of the screen, and the
   * grey belongs to the header that names them.
   */
  cell: "text-small font-normal leading-5 text-foreground",
  /**
   * Table header cell — 12/16 Medium, no letter-spacing, text-secondary.
   *
   * The Bloocks TableHead (components-table--docs). It replaced Figma's
   * SemiBold +0.12px (24421:72539) on 25 Sep 2026 to match the design system.
   */
  // 14px (5 Nov 2026): 12 read as too small beside 14px cells.
  head: "text-small font-medium tracking-normal text-pi-faint",
  /** secondary line under a cell or control */
  sub: "text-caption leading-5 text-pi-faint",
} as const;

/* --------------------------------------------------------------------- pills
   AP's .pill: 2px 8px, fully round, 11px/600. */
const pillBase = "max-w-full";

/** Figma 603:5002 table badges: 20px tall, caption text, 4px corners. */
/**
 * Controls on the main canvas carry no outline (5 Nov 2026): a field or
 * filter sits on a soft fill, a tool is a bare icon or label that fills on
 * hover. Only the primary action is solid. Outlining every control drew a
 * few hundred identical rectangles and gave none of them weight.
 */
export const QUIET_FIELD =
  "border-transparent bg-pi-fill shadow-none hover:border-transparent hover:bg-pi-fill-2";
export const QUIET_TOOL =
  "border-transparent bg-transparent shadow-none hover:border-transparent hover:bg-pi-fill";

export const tablePillClass =
  "gap-2 rounded-xs border-0 px-2 py-1 text-small font-normal leading-4 [&_svg]:size-2.5";

/**
 * The inline pickers' trigger, set on the column's text line: it bleeds 8px
 * into the cell's 16px padding on each side, so the value starts where the
 * header label does and the hover wash still has room.
 *
 * The caret is always there (7 Oct 2026, user: "Don't show the dropdowns on
 * just hover, fields with dropdown should be obvious"). It rests in faint ink
 * at half strength (27 Oct 2026) so a page of rows reads as values rather than
 * a form, and comes up to body ink on row hover, focus, while open, or under
 * the grid cursor.
 */
export const CELL_TRIGGER =
  "-mx-2 w-[calc(100%+16px)] px-2 text-small leading-5 [&>svg]:text-pi-faint [&>svg]:opacity-50 [&>svg]:transition-[color,opacity] group-hover:[&>svg]:text-pi-body group-hover:[&>svg]:opacity-100 focus-visible:[&>svg]:text-pi-body focus-visible:[&>svg]:opacity-100 aria-expanded:[&>svg]:text-pi-body aria-expanded:[&>svg]:opacity-100 [[data-cursor]_&>svg]:text-pi-body [[data-cursor]_&>svg]:opacity-100";

export type PillTone = "info" | "ok" | "warn" | "error" | "neutral";

/* Precision Indigo semantic tints: colour is for state only, an ~9% tint
   under AA ink. */
const pillTone: Record<PillTone, string> = {
  info: "bg-pi-brand-tint text-pi-brand",
  ok: "bg-pi-success-bg text-pi-success",
  warn: "bg-pi-warning-bg text-pi-warning",
  error: "bg-pi-danger-bg text-pi-danger",
  neutral: "bg-pi-fill text-pi-body",
};

export const Pill = ({
  tone = "info",
  className,
  children,
  ...props
}: { tone?: PillTone } & React.ComponentProps<typeof Badge>) => (
  // `outline` is the one Badge variant with no ground and no hover of its own —
  // a status pill is a label, not a target, so it must not light up under the
  // cursor the way the default variant does.
  <Badge
    variant="outline"
    className={cn(pillBase, pillTone[tone], className)}
    {...props}
  >
    {children}
  </Badge>
);

/**
 * The status column is the one thing an accountant scans to decide what to
 * open, so the mapping lives in exactly one place.
 */
const STATUS_TONE: Record<Status, PillTone> = {
  Received: "neutral",
  Extracting: "neutral",
  "Needs Review": "info",
  Approved: "ok",
  Failed: "error",
  Duplicate: "warn",
  Deleted: "neutral",
};

/**
 * Precision Indigo dot-chip: meaning lives in a small coloured dot, and the
 * label stays neutral body ink, so the Status column reads as one calm
 * line instead of a rainbow. Every dot is solid (5 Nov 2026): a hollow ring
 * read as "not started" on Approved, so colour alone carries the state.
 * Failures earn red text too.
 */
const STATUS_DOT: Record<Status, string> = {
  Received: "bg-pi-brand-vivid",
  Extracting: "bg-pi-brand-vivid animate-pulse motion-reduce:animate-none",
  "Needs Review": "bg-pi-warning-dot",
  Approved: "bg-pi-success-dot",
  Failed: "bg-pi-danger-dot",
  Duplicate: "bg-pi-warning-dot",
  Deleted: "bg-pi-faint",
};
const STATUS_GROUND: Partial<Record<Status, string>> = {
  Failed: "bg-pi-danger-bg text-pi-danger",
  Duplicate: "bg-pi-warning-bg text-pi-warning",
};

export const StatusPill = ({
  status,
  className,
  trailing,
}: {
  status: Status;
  className?: string;
  /** Drawn inside the pill after the word, e.g. a dropdown's chevron. */
  trailing?: React.ReactNode;
}) => (
  // max-w-full with a truncating label, so a narrow Status column ellipses the
  // word inside an intact pill rather than slicing the pill's ground off. The
  // tone survives truncation, and the tone is the part being scanned — which is
  // what lets the column's floor sit below "Needs Review" instead of on it.
  <span
    title={status}
    className={cn(
      "inline-flex max-w-full items-center gap-2 rounded-xs px-2 py-1 text-small leading-4 text-pi-body",
      STATUS_GROUND[status],
      className
    )}
  >
    <span
      aria-hidden
      className={cn("size-[7px] flex-none rounded-full", STATUS_DOT[status])}
    />
    {/* Sentence case on screen, like every other label; the stored status
        stays "Needs Review". */}
    <span className="min-w-0 truncate">
      {status === "Needs Review" ? "Needs review" : status}
    </span>
    {trailing}
  </span>
);

/**
 * A review reason on the Inbox row (Needs you column). Built like StatusPill
 * so the two columns read as one family: the meaning in a 7px dot, the words
 * in body ink. Danger blocks approval, warning wants a decision, neutral is
 * worth a look, ok is the hollow ring Approved uses: nothing is open.
 */
const REASON_DOT = {
  danger: "bg-pi-danger-dot",
  warning: "bg-pi-warning-dot",
  neutral: "bg-pi-faint",
  ok: "border-2 border-pi-success-dot bg-transparent",
} as const;
export const ReasonPill = ({
  tone,
  label,
  more = 0,
  className,
}: {
  tone: keyof typeof REASON_DOT;
  label: string;
  /** How many more reasons sit behind this one. */
  more?: number;
  className?: string;
}) => (
  <span className={cn("inline-flex max-w-full items-center gap-1", className)}>
    <span className="inline-flex min-w-0 items-center gap-2 rounded-xs px-2 py-1 text-small leading-4 text-pi-body">
      <span
        aria-hidden
        className={cn("size-[7px] flex-none rounded-full", REASON_DOT[tone])}
      />
      <span className="min-w-0 truncate">{label}</span>
    </span>
    {more > 0 && (
      <span className="flex-none rounded-xs bg-pi-fill px-1 text-caption font-medium tabular-nums text-pi-body">
        +{more}
      </span>
    )}
  </span>
);

/** A count chip on a tab or nav item. */
// A tab's count is quiet text beside its label, not a chip (5 Nov 2026): the
// label carries the row, the number answers "how many" when you look for it.
export const CountPill = ({ children }: { children: React.ReactNode }) => (
  <span className="text-body font-normal tabular-nums text-pi-faint group-data-[state=active]:text-pi-body">
    {children}
  </span>
);

/* ------------------------------------------------------------------ notices
   AP's tinted panel: a ground, a hairline biased to it, and matching ink. */
export type NoticeTone = "info" | "success" | "warning" | "danger";

const noticeTone: Record<NoticeTone, string> = {
  info: "border-pi-brand-border bg-pi-brand-tint text-foreground",
  success:
    "border-success-green-border bg-success-green text-success-green-foreground",
  warning: "border-warning-border bg-warning text-warning-foreground",
  danger:
    "border-destructive-foreground/25 bg-destructive text-destructive-foreground",
};

export const Notice = ({
  tone = "info",
  className,
  children,
  ...props
}: { tone?: NoticeTone } & React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-md border px-4 py-3 text-small leading-5",
      noticeTone[tone],
      className
    )}
    {...props}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------- spinner */
export const Spinner = ({ className }: { className?: string }) => (
  <Loader2
    aria-hidden
    className={cn(
      "h-3.5 w-3.5 shrink-0 animate-spin text-primary motion-reduce:animate-none",
      className
    )}
  />
);

/* --------------------------------------------------------------------- field
   AP pairs a .t-label with its control and keeps the label slot one height
   whether it holds text or a toggle, so rows stay aligned. */
/**
 * One form field, the bill form's anatomy (7 Oct 2026: every form in the
 * prototype matches the AP/AR/JV review forms).
 *
 * - A 12px/500 label above the control, 6px between them. `optional` adds the
 *   faint "Optional" after it; required is the norm and unmarked (no `*`).
 * - The control inside is the form box (38px, 6px radius, 14px text, brand
 *   edge and soft halo on focus): `.modern-field` in form-workspace.css sizes
 *   whatever sits in here, so toolbars keep their own 36px controls.
 * - `error` is one 12px line under the box, on its left edge, and turns the
 *   box's edge red. No fill.
 */
export const Field = ({
  label,
  htmlFor,
  hint,
  optional,
  error,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  /** Shows "Optional" after the label. */
  optional?: boolean;
  /** One line under the box; marks the field invalid. */
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) => {
  // A new error waits until focus leaves the field (useLateError).
  const late = useLateError(error);
  return (
    <div
      className={cn("modern-field flex min-w-0 flex-col", className)}
      data-invalid={late.error ? "true" : undefined}
      {...late.focusProps}
    >
      <span className="flex min-h-4 items-baseline gap-2">
        <Label htmlFor={htmlFor} className={T.label}>
          {label}
        </Label>
        {optional ? <OptionalTag /> : null}
      </span>
      {children}
      {late.error ? <FieldError>{late.error}</FieldError> : null}
      {hint}
    </div>
  );
};

/** The faint "Optional" a field's label carries, as on the bill form. */
export const OptionalTag = () => (
  <span className="text-caption font-normal leading-4 text-pi-faint">
    Optional
  </span>
);

/** A field's error: one 12px line, left-aligned under the box. */
export const FieldError = ({ children }: { children: React.ReactNode }) => (
  <p role="alert" className="text-left text-caption leading-4 text-pi-danger">
    {children}
  </p>
);

/** The form's header note, right-aligned on its first section's line. */
export const RequiredNote = ({ className }: { className?: string }) => (
  <p
    className={cn(
      "whitespace-nowrap text-caption leading-4 text-pi-faint",
      className
    )}
  >
    All fields required unless marked optional
  </p>
);

/**
 * Retired (7 Oct 2026): required fields are no longer starred — required is
 * the norm, and an optional field says "Optional" (`<Field optional>`). Kept
 * as a no-op so a call site that still renders it draws nothing.
 */
export const Req = () => null;

/**
 * A form section, the bill form's (7 Oct 2026): no card, a 14px/600 brand
 * heading with a hairline above it (none on the first section), and the
 * fields in a two-column grid at 16px rows / 20px columns. `aside` sits on
 * the heading's line, right-aligned (the first section carries
 * `<RequiredNote />` there). The name is kept so call sites need no change.
 */
export const FieldCard = ({
  title,
  aside,
  children,
  className,
}: {
  title?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={cn(
      "form-section border-t border-pi-line pt-5 first:border-t-0 first:pt-0",
      className
    )}
  >
    {title || aside ? (
      <div className="mb-4 flex min-h-5 items-center justify-between gap-4">
        {title ? (
          <h2 className="text-body font-semibold leading-5 text-pi-brand">
            {title}
          </h2>
        ) : (
          <span />
        )}
        {aside}
      </div>
    ) : null}
    <div className="grid grid-cols-1 items-start gap-x-5 gap-y-4 sm:grid-cols-2">
      {children}
    </div>
  </section>
);

/**
 * A date, written the way the sheet writes it.
 *
 * `<input type="date">` renders the browser's own control — "05/05/2026" and a
 * platform calendar glyph — which is the single loudest reason the JV form read
 * as a different application to the bill sheet beside it. This shows the
 * sheet's format behind a calendar button and keeps the stored value ISO, which
 * is what the store holds.
 */
export const DateField = ({
  id,
  value,
  onChange,
  disabled,
  className,
}: {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
  /** So a caller can match a surrounding field set — see the AR header card. */
  className?: string;
}) => {
  const parsed = value ? new Date(value) : undefined;
  const valid = !!parsed && !Number.isNaN(parsed.getTime());
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-[38px] w-full items-center justify-between gap-2 rounded-sm border border-pi-line-2 bg-background px-3",
            "text-left text-body hover:border-pi-line-strong disabled:cursor-not-allowed disabled:opacity-50",
            "focus:outline-none focus-visible:border-pi-brand focus-visible:shadow-[0_0_0_3px_var(--pi-brand-tint)]",
            className
          )}
        >
          <span className={cn("truncate", !valid && "text-muted-foreground")}>
            {valid ? format(parsed, "d MMM yyyy") : "Select date"}
          </span>
          <CalendarIcon className="h-4 w-4 flex-none text-secondary-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto rounded-md border-pi-line p-0 shadow-pi-2"
      >
        {/* The same calendar as every form date (date-picker/panel). */}
        <DatePickerPanel
          value={valid ? parsed : undefined}
          // The store keeps dates as yyyy-MM-dd; formatting locally rather
          // than via toISOString avoids the UTC shift turning a date into the
          // one before it for anyone east of Greenwich — everyone here.
          onSelect={(d) => {
            onChange(d ? format(d, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

/**
 * The note that marks a field the accountant has changed. It sits on the
 * label line, top right, as the AP/AR engines draw theirs (`.inbox-edited`,
 * bill-form.css), so marking a field never makes its row taller (5 Nov 2026).
 */
export const EditedMark = () => (
  <span className="inbox-edited">Edited by you</span>
);

/* -------------------------------------------------------------------- dialog
   Radix gives focus trap, Escape and restore, so the screen no longer keeps
   its own keydown handler for that. */
export const PageDialog = ({
  title,
  description,
  open,
  onClose,
  className,
  footer,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  open: boolean;
  /** Omit to make the dialog non-dismissible (the launch guide). */
  onClose?: () => void;
  className?: string;
  /**
   * The actions, in the form's footer band (7 Oct 2026): white, a hairline
   * above, right-aligned — Cancel then the specific action ("Save template",
   * not "Save"). Pass the buttons; the band is drawn here.
   */
  footer?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
    <DialogContent
      className={cn(
        // One dialog pattern (27 Oct 2026, as the engine dialogs): title and
        // a line of what it is for on white, no band or rule under them; a
        // white body with no cards of its own; a footer with one hairline.
        "refined-dialog max-h-[calc(100dvh-48px)] w-[calc(100vw-32px)] max-w-[650px] gap-0 overflow-hidden rounded-lg border-pi-line p-0",
        footer
          ? "grid-rows-[auto_minmax(0,1fr)_auto]"
          : "grid-rows-[auto_minmax(0,1fr)]",
        !onClose && "[&>button]:hidden",
        className
      )}
      onEscapeKeyDown={(e) => !onClose && e.preventDefault()}
      onPointerDownOutside={(e) => !onClose && e.preventDefault()}
      onInteractOutside={(e) => !onClose && e.preventDefault()}
    >
      <DialogHeader className="refined-dialog-header space-y-0 px-6 pb-2 pt-6 text-left">
        <DialogTitle className="pr-8 text-h3 text-pi-ink">
          {title}
        </DialogTitle>
        {description ? (
          <DialogDescription className="pt-1 text-small leading-5 text-pi-body">
            {description}
          </DialogDescription>
        ) : null}
      </DialogHeader>
      <div className="refined-dialog-body min-h-0 overflow-y-auto overscroll-contain px-6 pb-6 pt-4">{children}</div>
      {footer ? (
        <div className="flex items-center justify-end gap-3 border-t border-pi-line bg-pi-surface-panel px-6 py-4">
          {footer}
        </div>
      ) : null}
    </DialogContent>
  </Dialog>
);

/** The right-hand panel variant — AP's own side surface. */
export const SidePanel = ({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
    <SheetContent
      side="right"
      className="flex w-full flex-col gap-0 overflow-y-auto border-neutral-gray p-6 sm:max-w-[440px]"
    >
      <SheetHeader className="mb-3 space-y-0 text-left">
        <SheetTitle className={T.title}>{title}</SheetTitle>
      </SheetHeader>
      {children}
    </SheetContent>
  </Sheet>
);

/** The Bloocks AmountCell's figure: rupees in en-IN groups, paise small and muted. */
export const AmountText = ({ value }: { value: number }) => {
  const [rupees, paise] = Math.abs(value).toFixed(2).split(".");
  return (
    // Precision Indigo figures: the display cut with tabular, lining digits;
    // paise drop to the faint ink so the rupees carry the read. Same size:
    // 0.8em put them at 10.4px, under the 11px floor (27 Oct 2026).
    <span className="fig font-medium text-pi-ink">
      {value < 0 && "−"}₹{new Intl.NumberFormat("en-IN").format(Number(rupees))}
      <span className="font-normal text-pi-faint">.{paise}</span>
    </span>
  );
};

/** The pager's icon button — first, previous, next, last. */
export const PageButton = ({
  label,
  disabled,
  onClick,
  children,
  className,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
  /** For the cohort pager, which wants the brand at low emphasis, not grey. */
  className?: string;
}) => (
  <Button
    variant="ghost"
    size="icon"
    aria-label={label}
    title={label}
    className={cn(
      "text-pi-faint hover:bg-pi-fill hover:text-foreground",
      className
    )}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </Button>
);
