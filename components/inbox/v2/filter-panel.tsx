import React, { useMemo, useState } from "react";
import { Search } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import FilterChip from "@/components/common/filter-chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DateRangeInPanel } from "@/components/common/date-filter/panel";
import { Button } from "@/components/ui/button";

/**
 * The filter surface (27 Oct 2026, after the reference frame).
 *
 * Two panes. The left lists what you can filter on, under a "Filters" title
 * and a search for the list itself; a dot marks the ones applied, and Reset
 * at its foot clears them all. The right is the chosen filter, titled with
 * its name: a searchable checkbox list (every category is multi-select —
 * an accountant chasing a month-end wants "email OR whatsapp"), or a range.
 * Its foot counts what is applied. Nothing waits for an Apply: a tick, a
 * typed amount or a picked day is the filter.
 *
 * 680 x 480: room for a long checkbox list and the period picker.
 */

export type FilterOption = { value: string; label: string; count?: number };

export type FilterCategory = {
  id: string;
  label: string;
  /** Checkbox list. Omit when supplying `custom`. */
  options?: FilterOption[];
  selected?: string[];
  onChange?: (next: string[]) => void;
  /** For ranges — dates, amounts — which are not a list of values. */
  custom?: React.ReactNode;
  /** How many constraints this category currently contributes. */
  activeCount?: number;
};

export const FilterPanel = ({
  categories,
  onReset,
  className,
}: {
  categories: FilterCategory[];
  /** Clears every filter here. Without it, Reset clears the lists only. */
  onReset?: () => void;
  className?: string;
}) => {
  const [activeId, setActiveId] = useState(categories[0]?.id);
  const [query, setQuery] = useState("");
  const [find, setFind] = useState("");
  const active = categories.find((c) => c.id === activeId) ?? categories[0];
  const applied = categories.filter((c) => c.activeCount).length;
  const listed = find.trim()
    ? categories.filter((c) =>
        c.label.toLowerCase().includes(find.trim().toLowerCase())
      )
    : categories;

  const visible = useMemo(() => {
    if (!active?.options) return [];
    const q = query.trim().toLowerCase();
    return q
      ? active.options.filter((o) => o.label.toLowerCase().includes(q))
      : active.options;
  }, [active, query]);

  const toggle = (value: string) => {
    if (!active?.onChange) return;
    const current = active.selected ?? [];
    active.onChange(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    );
  };
  const reset = () =>
    onReset
      ? onReset()
      : categories.forEach((c) => c.options && c.onChange?.([]));

  return (
    <div
      className={cn(
        "flex h-[480px] max-h-[calc(100vh-96px)] w-[680px] max-w-[calc(100vw-32px)] overflow-hidden",
        className
      )}
    >
      <div className="flex w-[212px] flex-none flex-col border-r border-pi-line">
        <h2 className="flex h-14 flex-none items-center px-4 text-lead font-semibold text-pi-ink">
          Filters
        </h2>
        <div className="relative flex-none border-b border-pi-line">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pi-faint" />
          <input
            aria-label="Search filters"
            placeholder="Search filters"
            value={find}
            onChange={(e) => setFind(e.target.value)}
            className="h-10 w-full bg-transparent pl-10 pr-4 text-small text-pi-ink outline-none placeholder:text-pi-faint"
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {listed.map((c) => {
            const isActive = c.id === active?.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-current={isActive || undefined}
                onClick={() => {
                  setActiveId(c.id);
                  setQuery("");
                }}
                className={cn(
                  "flex h-9 flex-none items-center gap-2 rounded-sm px-3 text-left text-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  isActive
                    ? "bg-pi-brand-tint font-medium text-pi-brand"
                    : "text-pi-body hover:bg-pi-fill hover:text-pi-ink"
                )}
              >
                <span className="truncate">{c.label}</span>
                {c.activeCount ? (
                  <span
                    aria-label="applied"
                    className="size-1.5 flex-none rounded-full bg-pi-brand"
                  />
                ) : null}
              </button>
            );
          })}
          {!listed.length && (
            <p className="px-3 py-2 text-small text-pi-faint">No filters.</p>
          )}
        </div>
        <div className="flex h-12 flex-none items-center border-t border-pi-line px-2">
          {/* Plain, not red: clearing filters is an undo, and red is kept
              for the buttons that delete things. */}
          <Button variant="ghost" size="sm" disabled={!applied} onClick={reset}>
            Reset
          </Button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="flex h-14 flex-none items-center px-4 text-lead font-semibold text-pi-ink">
          {active?.label}
        </h3>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4">
          {active?.custom ? (
            <DateRangeInPanel.Provider value={{ label: active.label }}>
              {active.custom}
            </DateRangeInPanel.Provider>
          ) : (
            <>
              <div className="relative flex-none">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pi-faint" />
                <Input
                  aria-label={`Search ${active?.label ?? "options"}`}
                  placeholder="Search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 rounded-sm pl-8 text-small"
                />
              </div>
              <div className="mt-3 flex min-h-0 flex-1 flex-col gap-0.5">
                {visible.length ? (
                  visible.map((o) => (
                    <Label
                      key={o.value}
                      className="flex h-9 flex-none cursor-pointer items-center gap-3 rounded-sm px-2 text-small font-normal text-pi-ink hover:bg-pi-fill"
                    >
                      <Checkbox
                        checked={(active?.selected ?? []).includes(o.value)}
                        onCheckedChange={() => toggle(o.value)}
                      />
                      <span className="flex-1 truncate">{o.label}</span>
                      {o.count !== undefined ? (
                        <span className="flex-none text-caption tabular-nums text-pi-faint">
                          {o.count}
                        </span>
                      ) : null}
                    </Label>
                  ))
                ) : (
                  <p className="px-2 py-2 text-small text-pi-faint">
                    No matches.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
        <p className="flex h-12 flex-none items-center border-t border-pi-line px-4 text-small text-pi-faint">
          {applied
            ? `${applied} filter${applied === 1 ? "" : "s"} applied`
            : "No filters applied"}
        </p>
      </div>
    </div>
  );
};

/**
 * The single-category version behind a column header's funnel icon — the right
 * pane on its own, scoped to that column.
 */
export const ColumnFilter = ({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) => {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = q
    ? options.filter((o) => o.label.toLowerCase().includes(q))
    : options;

  return (
    <div className="flex w-[280px] flex-col p-3">
      <div className="relative flex-none">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pi-faint" />
        <Input
          aria-label={`Search ${label}`}
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 rounded-sm pl-8 text-small"
        />
      </div>
      <div className="mt-2 flex max-h-[260px] flex-col gap-0.5 overflow-y-auto">
        {visible.length ? (
          visible.map((o) => (
            <Label
              key={o.value}
              className="flex h-8 flex-none cursor-pointer items-center gap-3 rounded-sm px-2 text-small font-normal text-pi-ink hover:bg-pi-fill"
            >
              <Checkbox
                checked={selected.includes(o.value)}
                onCheckedChange={() =>
                  onChange(
                    selected.includes(o.value)
                      ? selected.filter((v) => v !== o.value)
                      : [...selected, o.value]
                  )
                }
              />
              <span className="flex-1 truncate">{o.label}</span>
            </Label>
          ))
        ) : (
          <p className="px-2 py-2 text-small text-pi-faint">No matches.</p>
        )}
      </div>
      {selected.length ? (
        <button
          type="button"
          onClick={() => onChange([])}
          className="mt-2 flex-none self-start rounded-xs px-2 py-1 text-left text-caption font-medium text-pi-brand hover:bg-pi-brand-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Clear {label} filter
        </button>
      ) : null}
    </div>
  );
};

/**
 * One column's filter, promoted onto the bar (Figma 716:15029).
 *
 * The trigger is a Bloocks FilterChip, the same as the Received date chip
 * beside it. The body is `ColumnFilter` — the same searchable multi-select the
 * column-header funnel opens — rather than a second list written to look like
 * it, so "Source" means one thing wherever it is answered.
 *
 * The chip says what is applied because it is the only place an applied quick
 * filter shows: a dropdown that silently filters the grid is worse than a wide
 * one.
 */
export const QuickFilter = ({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      {/* A Bloocks FilterChip: it names what is applied ("Source:
          WhatsApp", or a count for several) and its × clears in place. */}
      <FilterChip
        label={label}
        selectionType="multiple"
        value={selected.map(
          (value) => options.find((o) => o.value === value)?.label ?? value
        )}
        onClearButtonClick={() => onChange([])}
      />
    </PopoverTrigger>
    <PopoverContent
      align="start"
      className="w-auto rounded-md border-pi-line p-0 shadow-pi-2"
    >
      <ColumnFilter
        label={label}
        options={options}
        selected={selected}
        onChange={onChange}
      />
    </PopoverContent>
  </Popover>
);
