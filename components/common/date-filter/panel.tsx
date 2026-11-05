import React, { createContext, useContext, useEffect, useState } from "react";
import {
  addMonths,
  endOfDay,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  startOfDay,
  startOfMonth,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import DatePickerPanel from "@/components/common/date-picker/panel";
import { cn } from "@/lib/utils";
import { sameRange, type DatePreset, type DateRangeValue } from "./presets";

type Props = {
  value: DateRangeValue;
  onApply: (value: DateRangeValue) => void;
  /** Kept for callers; the period tabs replace the preset list. */
  presets?: DatePreset[];
  presetsLabel?: string;
  today: Date;
  /** Days before this cannot be picked. */
  minDate?: Date;
  /** Days after this cannot be picked, e.g. today for received documents. */
  maxDate?: Date;
};

/**
  Set by the filter panel. Inside it the range is one of several filters: a
  pick applies at once and the panel's own foot carries Reset and the count.
  Null everywhere else — a header funnel or a toolbar chip keeps a draft and
  an Apply, because Apply is what closes it.
*/
export const DateRangeInPanel = createContext<{ label: string } | null>(null);

type Mode = "month" | "quarter" | "fy" | "custom";
const MODES: { id: Mode; label: string }[] = [
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
  { id: "fy", label: "FY" },
  { id: "custom", label: "Custom" },
];

/** The Indian financial year a day falls in, by the April it starts. */
const fyOf = (d: Date) =>
  d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
const fyStart = (fy: number) => new Date(fy, 3, 1);
const fyEnd = (fy: number) => endOfMonth(new Date(fy + 1, 2, 1));
const fyLabel = (fy: number) => `FY ${fy}–${String(fy + 1).slice(2)}`;
/** The twelve months of a financial year, April first. */
const fyMonths = (fy: number) =>
  Array.from({ length: 12 }, (_, i) => addMonths(fyStart(fy), i));
const QUARTERS = [
  { label: "Q1", months: "Apr – Jun" },
  { label: "Q2", months: "Jul – Sep" },
  { label: "Q3", months: "Oct – Dec" },
  { label: "Q4", months: "Jan – Mar" },
];

/** What a typed date may look like: 01/10/2026, 1 Oct 2026, 2026-10-01. */
const TYPED = [
  "d/M/yyyy",
  "d-M-yyyy",
  "d.M.yyyy",
  "d MMM yyyy",
  "d MMMM yyyy",
  "yyyy-MM-dd",
  "d/M/yy",
];
const readDate = (text: string) => {
  const t = text.trim();
  if (!t) return undefined;
  for (const f of TYPED) {
    const d = parse(t, f, new Date());
    if (isValid(d) && d.getFullYear() > 1900) return startOfDay(d);
  }
  return null;
};
const shown = (d?: Date) => (d ? format(d, "dd/MM/yyyy") : "");

/** The tab a range reads best in, so the picker opens on it. */
const modeFor = (r: DateRangeValue): Mode => {
  if (!r.from || !r.to) return "month";
  const whole =
    isSameDay(r.from, startOfMonth(r.from)) &&
    isSameDay(startOfDay(r.to), startOfDay(endOfMonth(r.to)));
  if (!whole || fyOf(r.from) !== fyOf(r.to)) return "custom";
  const months =
    (r.to.getFullYear() - r.from.getFullYear()) * 12 +
    r.to.getMonth() -
    r.from.getMonth() +
    1;
  if (months === 12) return "fy";
  if (months % 3 === 0 && (r.from.getMonth() + 9) % 3 === 0) return "quarter";
  return "month";
};

/** "1 Sep 2026 – 31 Oct 2026", or one day alone. */
const spelled = (r: DateRangeValue) =>
  !r.from
    ? ""
    : !r.to || isSameDay(r.from, r.to)
      ? format(r.from, "d MMM yyyy")
      : `${format(r.from, "d MMM yyyy")} – ${format(r.to, "d MMM yyyy")}`;

/**
 * The date filter as a period picker (27 Oct 2026).
 *
 * Accountants filter by period, not by day: a GST month, a quarter, the
 * financial year. So it opens on the periods — Month, Quarter, FY — and keeps
 * day-level dates for Custom. This replaced a preset dropdown over two
 * calendars, From and To, which asked for five decisions to say "September".
 *
 * Month and Quarter pick the way a calendar range does: one click is that
 * period, a second stretches it to there (previewed under the pointer), a
 * third starts again. Months run in FY order, April first, under ‹ FY ›. The
 * range in words sits at the foot with Clear, whichever tab it came from.
 */
const DateRangePanel = ({ value, onApply, today, minDate, maxDate }: Props) => {
  const inPanel = useContext(DateRangeInPanel);
  const [draft, setDraftState] = useState<DateRangeValue>(value);
  const [mode, setMode] = useState<Mode>(() => modeFor(value));
  const [fy, setFy] = useState(() => fyOf(value.from ?? today));
  /** The first end of a range being stretched, until the second click. */
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [hover, setHover] = useState<Date | null>(null);

  // In the filter panel a pick is the filter; standalone it waits for Apply.
  const setDraft = (next: DateRangeValue) => {
    setDraftState(next);
    if (inPanel) onApply(next);
  };
  // In the panel the filter is the truth: the panel's Reset clears it here.
  useEffect(() => {
    if (inPanel && !sameRange(value, draft)) {
      setDraftState(value);
      setAnchor(null);
    }
  }, [value.from?.getTime(), value.to?.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  const lo = minDate ? startOfDay(minDate) : undefined;
  const hi = maxDate ? endOfDay(maxDate) : undefined;
  /** A period with no pickable day in it. */
  const outside = (from: Date, to: Date) =>
    (!!hi && isAfter(from, hi)) || (!!lo && isBefore(to, lo));
  /** A period cut down to the days that can be picked. */
  const clamp = (from: Date, to: Date): DateRangeValue => ({
    from: lo && isBefore(from, lo) ? lo : from,
    to: startOfDay(hi && isAfter(to, hi) ? hi : to),
  });

  /** One click picks the period; a second stretches it; a third restarts. */
  const pickPeriod = (start: Date, end: Date, anchorEnd: Date) => {
    if (anchor) {
      const first = isBefore(start, anchor) ? start : anchor;
      const last = isBefore(start, anchor) ? anchorEnd : end;
      setDraft(clamp(first, last));
      setAnchor(null);
      setHover(null);
    } else {
      setDraft(clamp(start, end));
      setAnchor(start);
    }
  };
  /** The end of the period the anchor started, for stretching backwards. */
  const anchorEnd = (len: number) =>
    anchor ? endOfMonth(addMonths(anchor, len - 1)) : new Date();

  const inRange = (from: Date, to: Date) => {
    // While stretching, the pointer previews the range it would make.
    if (anchor && hover) {
      const a = isBefore(hover, anchor) ? hover : anchor;
      const b = isBefore(hover, anchor) ? anchor : hover;
      return !isBefore(from, a) && !isAfter(from, b);
    }
    return (
      !!draft.from &&
      !!draft.to &&
      !isAfter(from, draft.to) &&
      !isBefore(to, draft.from)
    );
  };
  const isEnd = (from: Date, to: Date) => {
    if (anchor && hover)
      return isSameDay(from, anchor) || isSameDay(from, hover);
    const has = (d?: Date) => !!d && !isBefore(d, from) && !isAfter(d, to);
    // Filled only when the range takes the whole period: Sep–Nov seen as
    // quarters tints Q2 and Q3, it doesn't claim them.
    const whole =
      !!draft.from &&
      !!draft.to &&
      !isAfter(draft.from, from) &&
      !isBefore(endOfDay(draft.to), startOfDay(to));
    return whole && (has(draft.from) || has(draft.to));
  };

  const [yearsOpen, setYearsOpen] = useState(false);
  /** Next FY back to ten years ago, latest first, as far as dates allow. */
  const years = Array.from(
    { length: 11 },
    (_, i) => fyOf(today) + 1 - i
  ).filter((year) => !outside(fyStart(year), fyEnd(year)));
  const fyNav = (
    <div className="flex h-8 items-center justify-between">
      <NavButton
        label={`Before ${fyLabel(fy)}`}
        onClick={
          outside(fyStart(fy - 1), fyEnd(fy - 1))
            ? undefined
            : () => setFy(fy - 1)
        }
      >
        <ChevronLeft className="size-4" aria-hidden />
      </NavButton>
      {/* The title jumps to any year, so going back five years is one
          pick, not five arrow clicks. */}
      <Popover open={yearsOpen} onOpenChange={setYearsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`${fyLabel(fy)}, choose another year`}
            className="inline-flex h-8 items-center gap-1 rounded-sm px-3 text-small font-semibold text-pi-ink hover:bg-pi-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {fyLabel(fy)}
            <ChevronDown className="size-3.5 text-pi-faint" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          className="max-h-72 w-[220px] overflow-y-auto rounded-md border-pi-line p-1 shadow-pi-2"
        >
          {years.map((year) => {
            const touched =
              !!draft.from &&
              !!draft.to &&
              !isAfter(fyStart(year), draft.to) &&
              !isBefore(fyEnd(year), draft.from);
            return (
              <button
                key={year}
                type="button"
                aria-current={year === fy || undefined}
                onClick={() => {
                  setFy(year);
                  setYearsOpen(false);
                }}
                className={cn(
                  "flex h-9 w-full items-center gap-2 rounded-sm px-3 text-left text-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  year === fy
                    ? "bg-pi-brand-tint font-medium text-pi-brand"
                    : "text-pi-ink hover:bg-pi-fill"
                )}
              >
                {fyLabel(year)}
                {/* The years the picked range falls in. */}
                {touched && (
                  <span
                    aria-label="in the selected range"
                    className="size-1.5 flex-none rounded-full bg-pi-brand"
                  />
                )}
                {year === fyOf(today) && (
                  <span className="ml-auto rounded-xs bg-pi-fill px-2 py-0.5 text-caption font-medium text-pi-body">
                    Current
                  </span>
                )}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>
      <NavButton
        label={`After ${fyLabel(fy)}`}
        onClick={
          outside(fyStart(fy + 1), fyEnd(fy + 1))
            ? undefined
            : () => setFy(fy + 1)
        }
      >
        <ChevronRight className="size-4" aria-hidden />
      </NavButton>
    </div>
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        inPanel ? "w-full" : "w-[360px] p-4"
      )}
    >
      {/* The kind of period first. Switching tabs keeps the range. */}
      <div
        role="tablist"
        aria-label="Filter by"
        className="grid grid-cols-4 gap-0.5 rounded-sm bg-pi-fill p-0.5"
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => {
              setMode(m.id);
              setAnchor(null);
            }}
            className={cn(
              "h-8 rounded-xs text-small font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              mode === m.id
                ? "bg-background text-pi-ink shadow-contact"
                : "text-pi-body hover:text-pi-ink"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "month" && (
        <div className="flex flex-col gap-2">
          {fyNav}
          <div
            className="grid grid-cols-4 gap-2"
            onMouseLeave={() => setHover(null)}
          >
            {fyMonths(fy).map((m) => {
              const end = endOfMonth(m);
              return (
                <PeriodButton
                  key={m.getTime()}
                  disabled={outside(m, end)}
                  inRange={inRange(m, end)}
                  isEnd={isEnd(m, end)}
                  current={isSameMonth(m, today)}
                  onHover={() => setHover(m)}
                  onClick={() => pickPeriod(m, end, anchorEnd(1))}
                >
                  {format(m, "MMM")}
                </PeriodButton>
              );
            })}
          </div>
          <Hint>
            {anchor
              ? "Now click another month — in any year — to make a range"
              : "Click a month, or two months for a range"}
          </Hint>
        </div>
      )}

      {mode === "quarter" && (
        <div className="flex flex-col gap-2">
          {fyNav}
          <div
            className="grid grid-cols-2 gap-2"
            onMouseLeave={() => setHover(null)}
          >
            {QUARTERS.map((q, i) => {
              const start = addMonths(fyStart(fy), i * 3);
              const end = endOfMonth(addMonths(start, 2));
              return (
                <PeriodButton
                  key={q.label}
                  tall
                  disabled={outside(start, end)}
                  inRange={inRange(start, end)}
                  isEnd={isEnd(start, end)}
                  current={!isBefore(today, start) && !isAfter(today, end)}
                  onHover={() => setHover(start)}
                  onClick={() => pickPeriod(start, end, anchorEnd(3))}
                >
                  <span className="text-body font-semibold">{q.label}</span>
                  <span className="text-caption opacity-80">{q.months}</span>
                </PeriodButton>
              );
            })}
          </div>
          <Hint>
            {anchor
              ? "Now click another quarter — in any year — to make a range"
              : "Click a quarter, or two quarters for a range"}
          </Hint>
        </div>
      )}

      {mode === "fy" && (
        // This year and the nine before it; the list scrolls past the first
        // five rather than stopping there.
        <div className="flex max-h-[264px] flex-col gap-1 overflow-y-auto">
          {Array.from({ length: 10 }, (_, back) => back).map((back) => {
            const year = fyOf(today) - back;
            const start = fyStart(year);
            const end = fyEnd(year);
            const picked =
              !!draft.from &&
              !!draft.to &&
              isSameDay(draft.from, start) &&
              isSameDay(startOfDay(draft.to), startOfDay(end));
            return (
              <button
                key={year}
                type="button"
                disabled={outside(start, end)}
                aria-pressed={picked}
                onClick={() => setDraft(clamp(start, end))}
                className={cn(
                  "flex h-10 flex-none items-center gap-3 rounded-sm px-3 text-left text-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40",
                  picked
                    ? "bg-primary text-primary-foreground"
                    : "text-pi-ink hover:bg-pi-fill"
                )}
              >
                <span className="font-medium">{fyLabel(year)}</span>
                <span
                  className={
                    picked ? "text-primary-foreground" : "text-pi-faint"
                  }
                >
                  {format(start, "MMM yyyy")} – {format(end, "MMM yyyy")}
                </span>
                {back === 0 && (
                  <span
                    className={cn(
                      "ml-auto rounded-xs px-2 py-0.5 text-caption font-medium",
                      picked
                        ? "bg-white/20 text-primary-foreground"
                        : "bg-pi-fill text-pi-body"
                    )}
                  >
                    Current
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {mode === "custom" && (
        <CustomRange
          draft={draft}
          setDraft={setDraft}
          minDate={minDate}
          maxDate={maxDate}
        />
      )}

      {/* The range in words, wherever it was picked. */}
      <div className="flex min-h-9 items-center gap-2 border-t border-pi-line pt-3">
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-small",
            draft.from ? "font-medium text-pi-ink" : "text-pi-faint"
          )}
        >
          {draft.from ? spelled(draft) : "Any date"}
        </span>
        {draft.from && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft({});
              setAnchor(null);
            }}
          >
            Clear
          </Button>
        )}
        {!inPanel && (
          <Button
            size="sm"
            className="w-[78px]"
            disabled={sameRange(draft, value)}
            onClick={() => onApply(draft)}
          >
            Apply
          </Button>
        )}
      </div>
    </div>
  );
};

/** From and To, each typeable and each with its own one-month calendar. */
const CustomRange = ({
  draft,
  setDraft,
  minDate,
  maxDate,
}: {
  draft: DateRangeValue;
  setDraft: (next: DateRangeValue) => void;
  minDate?: Date;
  maxDate?: Date;
}) => {
  const [typed, setTyped] = useState({
    from: shown(draft.from),
    to: shown(draft.to),
  });
  useEffect(
    () => setTyped({ from: shown(draft.from), to: shown(draft.to) }),
    [draft.from?.getTime(), draft.to?.getTime()] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [open, setOpen] = useState<"from" | "to" | null>(null);
  /** Lands one end. Set alone, a date is a one-day range; an end set past
      the other moves the other with it. */
  const land = (end: "from" | "to", day: Date | undefined) => {
    if (!day) {
      setDraft(end === "from" ? {} : { from: draft.from, to: draft.from });
      return;
    }
    let from = end === "from" ? day : (draft.from ?? day);
    let to = end === "to" ? day : (draft.to ?? day);
    if (isAfter(from, to)) from = to = day;
    setDraft({ from, to });
  };
  const commit = (end: "from" | "to") => {
    const day = readDate(typed[end]);
    const allowed =
      day !== null &&
      (day === undefined ||
        (!(minDate && isBefore(day, startOfDay(minDate))) &&
          !(maxDate && isAfter(day, startOfDay(maxDate)))));
    if (!allowed) {
      setTyped({ from: shown(draft.from), to: shown(draft.to) });
      return;
    }
    land(end, day ?? undefined);
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      {(["from", "to"] as const).map((end) => (
        <div key={end} className="flex min-w-0 flex-col gap-1">
          <label
            htmlFor={`range-${end}`}
            className="text-caption font-medium leading-4 text-pi-body"
          >
            {end === "from" ? "From" : "To"}
          </label>
          <span
            className={cn(
              "flex h-9 items-center gap-1 rounded-sm border border-pi-line-2 bg-background pl-3 pr-1",
              "focus-within:border-pi-brand focus-within:shadow-[0_0_0_3px_var(--pi-brand-tint)]"
            )}
          >
            <input
              id={`range-${end}`}
              value={typed[end]}
              placeholder="dd/mm/yyyy"
              aria-label={end === "from" ? "From date" : "To date"}
              onChange={(e) =>
                setTyped((t) => ({ ...t, [end]: e.target.value }))
              }
              onBlur={() => commit(end)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit(end);
                }
              }}
              className="min-w-0 flex-1 bg-transparent text-small tabular-nums text-pi-ink outline-none placeholder:text-pi-faint"
            />
            <Popover
              open={open === end}
              onOpenChange={(next) => setOpen(next ? end : null)}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`Choose the ${end === "from" ? "from" : "to"} date`}
                  className="inline-flex size-7 flex-none items-center justify-center rounded-xs text-pi-faint hover:bg-pi-fill hover:text-pi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CalendarIcon className="size-4" aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align={end === "from" ? "start" : "end"}
                className="w-auto rounded-md border-pi-line p-0 shadow-pi-2"
              >
                <DatePickerPanel
                  value={draft[end]}
                  // To can't fall before From.
                  minDate={end === "to" ? (draft.from ?? minDate) : minDate}
                  maxDate={maxDate}
                  onSelect={(day) => {
                    land(end, day);
                    setOpen(null);
                  }}
                />
              </PopoverContent>
            </Popover>
          </span>
        </div>
      ))}
    </div>
  );
};

/** A month or quarter: tinted inside the range, filled at its two ends. */
const PeriodButton = ({
  children,
  disabled,
  inRange,
  isEnd,
  current,
  tall,
  onHover,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  inRange: boolean;
  isEnd: boolean;
  current: boolean;
  tall?: boolean;
  onHover: () => void;
  onClick: () => void;
}) => (
  <button
    type="button"
    disabled={disabled}
    aria-pressed={inRange}
    onMouseEnter={onHover}
    onFocus={onHover}
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center rounded-sm text-small transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40",
      tall ? "h-14 gap-0.5" : "h-10",
      inRange && isEnd
        ? "bg-primary font-medium text-primary-foreground hover:bg-primary-hover"
        : inRange
          ? "bg-pi-brand-tint font-medium text-pi-brand"
          : cn(
              "text-pi-ink hover:bg-pi-fill",
              // This month or quarter, outlined so "now" is easy to find.
              current && "font-semibold ring-1 ring-inset ring-pi-line-2"
            )
    )}
  >
    {children}
  </button>
);

const NavButton = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    disabled={!onClick}
    onClick={onClick}
    className="inline-flex size-7 items-center justify-center rounded-xs text-pi-body hover:bg-pi-fill hover:text-pi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
  >
    {children}
  </button>
);

const Hint = ({ children }: { children: React.ReactNode }) => (
  <p className="text-caption text-pi-faint">{children}</p>
);

/**
 * The single-date picker's day grid: round days in 36px rows, weekday
 * initials in brand ink, the chosen day filled.
 */
export const dayGrid = {
  months: "w-full",
  month: "w-full",
  caption: "sr-only",
  table: "w-full border-collapse",
  head_row: "flex w-full",
  head_cell:
    "flex h-7 flex-1 items-center justify-center text-caption font-medium text-pi-brand",
  tbody: "flex flex-col",
  row: "flex w-full",
  cell: "flex h-9 flex-1 items-center justify-center p-0",
  day: "size-8 rounded-full text-small tabular-nums text-pi-ink hover:bg-pi-fill-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
  day_selected:
    "bg-primary text-primary-foreground hover:!bg-primary-hover hover:!text-primary-foreground",
  day_today: "font-semibold",
  day_outside: "invisible",
  day_disabled:
    "cursor-not-allowed text-pi-faint opacity-40 hover:bg-transparent",
  day_hidden: "invisible",
};

export default DateRangePanel;
