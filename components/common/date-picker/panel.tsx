import React, { useState } from "react";
import {
  addMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { dayGrid } from "@/components/common/date-filter/panel";

type Props = {
  value?: Date;
  onSelect: (date: Date | undefined) => void;
  /** Days before this cannot be picked. */
  minDate?: Date;
  /** Days after this cannot be picked. */
  maxDate?: Date;
  /** Opened from the keyboard: the grid takes focus so arrows move the day. */
  autoFocus?: boolean;
  className?: string;
};

/**
 * One date, picked the way the filters pick a range (27 Oct 2026): the same
 * month bar with its arrows, the same round days on the brand tint, and the
 * two answers a form date most often wants — today, or nothing — at the
 * foot. Picking a day is the answer; there is no Apply.
 *
 * Used by every form date: the React forms' DateField, and the AP and AR
 * sheets' date inputs through SheetDatePicker, which keeps the browser's own
 * calendar from opening.
 */
const DatePickerPanel = ({
  value,
  onSelect,
  minDate,
  maxDate,
  autoFocus,
  className,
}: Props) => {
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(() => startOfMonth(value ?? today));
  /*
    Days, months or years (27 Oct 2026). The title drills up — October 2026
    → the twelve months of 2026 → twelve years — and a pick drills back down,
    so a date two years back is three clicks, not twenty-four arrows.
  */
  const [view, setView] = useState<"days" | "months" | "years">("days");
  const lo = minDate ? startOfDay(minDate) : undefined;
  const hi = maxDate ? startOfDay(maxDate) : undefined;
  /** No pickable day between these two. */
  const outside = (from: Date, to: Date) =>
    (!!hi && isAfter(from, hi)) || (!!lo && isBefore(to, lo));
  const outOfBounds = (m: Date) => outside(m, endOfMonth(m));
  const year = month.getFullYear();
  /** The twelve-year page the current year sits on. */
  const decade = year - (year % 12);
  const yearOut = (y: number) =>
    outside(new Date(y, 0, 1), new Date(y, 11, 31));

  const nav =
    view === "days"
      ? {
          title: format(month, "MMMM yyyy"),
          prev: outOfBounds(addMonths(month, -1))
            ? undefined
            : () => setMonth(addMonths(month, -1)),
          next: outOfBounds(addMonths(month, 1))
            ? undefined
            : () => setMonth(addMonths(month, 1)),
          up: () => setView("months"),
          unit: "month",
        }
      : view === "months"
        ? {
            title: String(year),
            prev: yearOut(year - 1)
              ? undefined
              : () => setMonth(addMonths(month, -12)),
            next: yearOut(year + 1)
              ? undefined
              : () => setMonth(addMonths(month, 12)),
            up: () => setView("years"),
            unit: "year",
          }
        : {
            title: `${decade} – ${decade + 11}`,
            prev: yearOut(decade - 1)
              ? undefined
              : () => setMonth(new Date(decade - 12, month.getMonth(), 1)),
            next: yearOut(decade + 12)
              ? undefined
              : () => setMonth(new Date(decade + 12, month.getMonth(), 1)),
            up: undefined,
            unit: "twelve years",
          };

  const todayAllowed =
    !(lo && isBefore(today, lo)) && !(hi && isAfter(today, hi));
  const disabled = [
    ...(lo ? [{ before: lo }] : []),
    ...(hi ? [{ after: hi }] : []),
  ];

  return (
    <div className={cn("flex w-[288px] flex-col gap-2 p-3", className)}>
      <div className="flex h-[34px] items-center justify-between rounded-sm border border-pi-line-2 bg-background px-2">
        <MonthButton label={`Previous ${nav.unit}`} onClick={nav.prev}>
          <ChevronLeft className="size-4" aria-hidden />
        </MonthButton>
        {nav.up ? (
          <button
            type="button"
            onClick={nav.up}
            aria-label={`${nav.title}, choose ${view === "days" ? "a month" : "a year"}`}
            className="inline-flex h-7 items-center gap-1 rounded-xs px-2 text-small font-medium text-pi-ink hover:bg-pi-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {nav.title}
            <ChevronDown className="size-3.5 text-pi-faint" aria-hidden />
          </button>
        ) : (
          <span className="px-2 text-small font-medium text-pi-ink">
            {nav.title}
          </span>
        )}
        <MonthButton label={`Next ${nav.unit}`} onClick={nav.next}>
          <ChevronRight className="size-4" aria-hidden />
        </MonthButton>
      </div>
      {/* Every view holds the day grid's height, so the panel never jumps. */}
      <div className="min-h-[244px]">
        {view === "days" && (
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            disableNavigation
            showOutsideDays={false}
            weekStartsOn={0}
            disabled={disabled}
            selected={value}
            initialFocus={autoFocus}
            onSelect={(day) => day && onSelect(day)}
            className="w-full p-0"
            classNames={grid}
          />
        )}
        {view === "months" && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            {Array.from({ length: 12 }, (_, i) => new Date(year, i, 1)).map(
              (m) => (
                <Cell
                  key={m.getMonth()}
                  disabled={outOfBounds(m)}
                  picked={!!value && isSameMonth(m, value)}
                  current={isSameMonth(m, today)}
                  onClick={() => {
                    setMonth(m);
                    setView("days");
                  }}
                >
                  {format(m, "MMM")}
                </Cell>
              )
            )}
          </div>
        )}
        {view === "years" && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            {Array.from({ length: 12 }, (_, i) => decade + i).map((y) => (
              <Cell
                key={y}
                disabled={yearOut(y)}
                picked={!!value && value.getFullYear() === y}
                current={today.getFullYear() === y}
                onClick={() => {
                  setMonth(new Date(y, month.getMonth(), 1));
                  setView("months");
                }}
              >
                {y}
              </Cell>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-pi-line pt-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={!value}
          onClick={() => onSelect(undefined)}
        >
          Clear
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!todayAllowed}
          onClick={() => onSelect(today)}
        >
          Today
        </Button>
      </div>
    </div>
  );
};

/** A month or a year in the drill-up views. */
const Cell = ({
  children,
  disabled,
  picked,
  current,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  picked: boolean;
  current: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    disabled={disabled}
    aria-pressed={picked}
    onClick={onClick}
    className={cn(
      "h-[52px] rounded-sm text-small transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40",
      picked
        ? "bg-primary font-medium text-primary-foreground hover:bg-primary-hover"
        : cn(
            "text-pi-ink hover:bg-pi-fill",
            current && "font-semibold ring-1 ring-inset ring-pi-line-2"
          )
    )}
  >
    {children}
  </button>
);

const MonthButton = ({
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
    className="inline-flex size-6 items-center justify-center rounded-xs text-pi-faint hover:bg-pi-fill hover:text-pi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
  >
    {children}
  </button>
);

/** The range panel's day grid in 36px rows; one day is filled, no band. */
const grid = {
  ...dayGrid,
  tbody: "flex flex-col",
  cell: "flex h-9 flex-1 items-center justify-center p-0",
  day: cn(dayGrid.day, "size-8 text-small"),
};

export default DatePickerPanel;
