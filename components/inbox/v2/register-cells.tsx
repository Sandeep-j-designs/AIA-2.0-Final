import React from "react";
import { format } from "date-fns";
import { CalendarDays, Pencil } from "@/components/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import DatePickerPanel from "@/components/common/date-picker/panel";
import { cn } from "@/lib/utils";

/*
  In-place editors for register cells whose row opens a record on click.

  A pencil or a calendar in a cell promises that the cell edits; drawn on a
  plain span it was a promise the row broke — the click fell through and
  opened the voucher instead (28 Oct 2026). Each editor here owns its clicks
  and keys, so the row only opens from the parts of it that are not a field.
*/

const swallow = (event: React.SyntheticEvent) => event.stopPropagation();

/* The cell's own compact trigger, bled into the cell padding as the Inbox's
   CELL_TRIGGER is — but without its half-strength glyph rule: a pencil or a
   calendar waits for the row (hover, focus or the grid cursor). */
const TRIGGER =
  "-mx-2 flex h-8 w-[calc(100%+16px)] min-w-0 items-center justify-between gap-2 rounded-sm px-2 text-left text-small leading-5 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

/** The trailing glyph: hidden at rest, shown on row hover, focus or open. */
const glyph =
  "h-3.5 w-3.5 flex-none text-pi-faint opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [[data-cursor]_&]:opacity-100 motion-reduce:transition-none";

/**
 * A text value that turns into an input where it sits. Enter or leaving the
 * field saves; Escape puts the old value back.
 */
export function TextEditCell({
  label,
  value,
  editable,
  onChange,
  onClosed,
  children,
}: {
  label: string;
  value: string;
  editable: boolean;
  /** Return false to refuse the value and keep the field open. */
  onChange: (value: string) => boolean | void;
  /** Where focus goes when editing ends — the grid's cursor. */
  onClosed?: () => void;
  /** How the value reads at rest, e.g. in the voucher-number mono cut. */
  children?: React.ReactNode;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const input = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);

  if (!editable)
    return (
      <span className="truncate" title={value}>
        {children ?? (value || "—")}
      </span>
    );

  const finish = (save: boolean) => {
    const next = draft.trim();
    if (save && next && next !== value && onChange(next) === false) return;
    setEditing(false);
    onClosed?.();
  };

  if (editing)
    return (
      <div className="min-w-0" onClick={swallow}>
        <input
          ref={input}
          aria-label={label}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => finish(true)}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter") finish(true);
            if (event.key === "Escape") finish(false);
          }}
          className="-mx-2 h-8 w-[calc(100%+16px)] rounded-sm border border-pi-brand bg-background px-2 text-small leading-5 text-pi-ink shadow-[0_0_0_3px_var(--pi-brand-tint)] outline-none"
        />
      </div>
    );

  return (
    <button
      type="button"
      aria-label={`Edit ${label}`}
      title={value || `Add ${label.toLowerCase()}`}
      onClick={(event) => {
        event.stopPropagation();
        setDraft(value);
        setEditing(true);
      }}
      onKeyDown={swallow}
      className={TRIGGER}
    >
      <span className="min-w-0 truncate">{children ?? (value || "—")}</span>
      <Pencil aria-hidden className={glyph} />
    </button>
  );
}

/** A date behind the app's own calendar; the store keeps it as yyyy-MM-dd. */
export function DateEditCell({
  label,
  value,
  editable,
  onChange,
  onClosed,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange: (iso: string) => boolean | void;
  onClosed?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const parsed = value ? new Date(value) : undefined;
  const valid = !!parsed && !Number.isNaN(parsed.getTime());
  const shown = valid ? format(parsed, "d MMM yyyy") : "—";

  if (!editable)
    return (
      <span className="truncate" title={shown}>
        {shown}
      </span>
    );

  return (
    <div className="min-w-0" onClick={swallow} onKeyDown={swallow}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Edit ${label}`}
            aria-expanded={open}
            title={valid ? shown : `Add ${label.toLowerCase()}`}
            className={cn(
              TRIGGER,
              open && "bg-accent/60 ring-1 ring-inset ring-ring"
            )}
          >
            <span className="min-w-0 truncate">{shown}</span>
            <CalendarDays
              aria-hidden
              className={cn(glyph, open && "opacity-100")}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-auto rounded-md border-pi-line p-0 shadow-pi-2"
          onClick={swallow}
          onKeyDown={swallow}
          onCloseAutoFocus={(event) => {
            if (!onClosed) return;
            event.preventDefault();
            onClosed();
          }}
        >
          <DatePickerPanel
            value={valid ? parsed : undefined}
            onSelect={(d) => {
              // Local format, not toISOString: the UTC shift would land the
              // date a day early for anyone east of Greenwich.
              if (d && onChange(format(d, "yyyy-MM-dd")) === false) return;
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
