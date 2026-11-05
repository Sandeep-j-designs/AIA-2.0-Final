import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Columns3,
  GripVertical,
  Lock,
  Pin,
  PinOff,
  Search,
  Undo2,
  X,
} from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { T } from "./ui";

/*
  The Columns menu, shared by every register (28 Oct 2026; Figma "AIA -
  Component Library" › Table, "Chargeback columns" 603:1927). Lifted from the
  Inbox's own panel so all modules choose, order and pin columns the same way:
  a search, one row per column — padlock for a column that is always shown, a
  grip to reorder, pin, show/hide — and Reset Width / Reset Default. It applies
  as you go: the table behind it is the preview.
*/

export type ColumnSpec = {
  key: string;
  label: string;
  /** Always shown: a padlock in place of the checkbox. */
  locked?: boolean;
  /** Off until someone turns it on in the menu (Figma's wide variant). */
  hidden?: boolean;
};

type Stored = { order: string[]; visible: string[]; pinned: string[] };

/** The pinned columns lead, in the order they were pinned. */
const normalise = (raw: string[], all: string[], pinned: string[]) => {
  const kept = raw.filter((c, i) => all.includes(c) && raw.indexOf(c) === i);
  const full = [...kept, ...all.filter((c) => !kept.includes(c))];
  return [
    ...pinned.filter((c) => full.includes(c)),
    ...full.filter((c) => !pinned.includes(c)),
  ];
};

const read = (key: string): Stored | null => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
};

/**
 * Which columns a table shows, in what order, and which are pinned. Kept per
 * table (`id`) for the session, as the Inbox keeps its own.
 *
 * Order and visibility are separate state: hiding a column and showing it
 * again puts it back where it was, not at the end.
 */
export function useColumnLayout(
  id: string,
  columns: ColumnSpec[],
  defaultPinned: string[] = []
) {
  const all = useMemo(() => columns.map((c) => c.key), [columns]);
  const defaults = useMemo(
    () => ({
      order: normalise(all, all, defaultPinned),
      visible: columns.filter((c) => !c.hidden).map((c) => c.key),
      pinned: defaultPinned,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all.join("|")]
  );
  const storageKey = `columns.${id}.v1`;
  const [state, setState] = useState<Stored>(defaults);
  // Stored layout after mount, so the server render and the first client
  // render agree. A different column set (another route, another tab) starts
  // from its own stored layout or its defaults.
  useEffect(() => {
    const stored = read(storageKey);
    setState(
      stored
        ? {
            pinned: stored.pinned.filter((c) => all.includes(c)),
            order: normalise(stored.order, all, stored.pinned),
            visible: stored.visible.filter((c) => all.includes(c)),
          }
        : defaults
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, defaults]);
  const update = (next: (s: Stored) => Stored) =>
    setState((s) => {
      const value = next(s);
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        /* storage full or blocked: the layout still applies this session */
      }
      return value;
    });

  const locked = new Set(columns.filter((c) => c.locked).map((c) => c.key));
  // Locked columns cannot be switched off, even by a stale stored layout.
  const visible = [
    ...state.visible,
    ...[...locked].filter((c) => !state.visible.includes(c)),
  ];
  const order = normalise(state.order, all, state.pinned);
  const shown = order.filter((c) => visible.includes(c));

  return {
    columns,
    order,
    visible,
    pinned: state.pinned,
    shown,
    locked,
    label: (key: string) => columns.find((c) => c.key === key)?.label ?? key,
    /**
     * The shown set differs from the table's default — a default column
     * switched off, or an extra switched on. Not "anything hidden": the wide
     * columns start hidden, and a chip lit on every table says nothing.
     */
    anyHidden:
      visible.length !== defaults.visible.length ||
      visible.some((c) => !defaults.visible.includes(c)),
    toggle: (key: string, on: boolean) => {
      if (!on && locked.has(key)) return;
      update((s) => {
        if (on) return { ...s, visible: [...s.visible, key] };
        const next = s.visible.filter((c) => c !== key);
        // A table with no columns is not a state worth being able to reach.
        if (!next.length) return s;
        return {
          ...s,
          visible: next,
          pinned: s.pinned.filter((c) => c !== key),
        };
      });
    },
    /**
     * Pinning sends the column to the back of the pinned block, so pins stack
     * up left to right in the order they were made; unpinning leaves it where
     * it is. A pinned column cannot be hidden, so pinning shows it.
     */
    togglePin: (key: string) =>
      update((s) => {
        if (s.pinned.includes(key))
          return { ...s, pinned: s.pinned.filter((c) => c !== key) };
        const pinned = [...s.pinned, key];
        return {
          pinned,
          order: normalise(s.order, all, pinned),
          visible: s.visible.includes(key) ? s.visible : [...s.visible, key],
        };
      }),
    /** Move `key` to slot `to`, clamped to the unpinned part of the list. */
    move: (key: string, to: number) =>
      update((s) => {
        const current = normalise(s.order, all, s.pinned);
        const from = current.indexOf(key);
        const target = Math.min(
          Math.max(to, s.pinned.length),
          current.length - 1
        );
        if (from < 0 || from === target || s.pinned.includes(key)) return s;
        const next = [...current];
        next.splice(target, 0, next.splice(from, 1)[0]);
        return { ...s, order: next };
      }),
    reset: () => update(() => defaults),
  };
}

export type ColumnLayout = ReturnType<typeof useColumnLayout>;

/**
 * Left offsets for the pinned columns, which stick after the checkbox column
 * (`lead` wide) in the order they lead the grid. `undefined` for the rest.
 */
export const pinnedOffsets = (
  layout: ColumnLayout,
  width: (key: string) => number,
  lead: number
) => {
  const offsets: Record<string, number> = {};
  let left = lead;
  for (const key of layout.shown) {
    if (!layout.pinned.includes(key)) break;
    offsets[key] = left;
    left += width(key);
  }
  return offsets;
};

/** The last pinned column, whose right edge casts the pinned shade. */
export const lastPinned = (layout: ColumnLayout) =>
  layout.shown.filter((c) => layout.pinned.includes(c)).at(-1);

const SETTLE_MS = 200;
const EASE = "cubic-bezier(0.2, 0, 0, 1)";
const ROW_HEIGHT = 32;
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The Columns chip and its panel. `onResetWidths` is the table's own resize
 * reset; without one, Reset Width is left out.
 */
export function ColumnsMenu({
  layout,
  onResetWidths,
  pinnable = true,
}: {
  layout: ColumnLayout;
  onResetWidths?: () => void;
  /** Off for a table that cannot hold columns sticky. */
  pinnable?: boolean;
}) {
  const { order, visible, pinned, locked } = layout;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [drag, setDrag] = useState<{
    key: string;
    from: number;
    to: number;
    dy: number;
    height: number;
    settling: boolean;
  } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const rowNodes = useRef(new Map<string, HTMLElement>());
  const settleTimer = useRef<number>();
  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  // "/" jumps to the panel's search while it is open, as in the Inbox.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.isContentEditable;
      if (e.key !== "/" || typing) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Searching narrows the list, so "drop it here" stops meaning anything:
  // a filtered list is read-only for ordering, and the grips come off.
  const filtering = search.trim().length > 0;
  const matches = order.filter((c) =>
    layout.label(c).toLowerCase().includes(search.trim().toLowerCase())
  );

  /*
    Drag to reorder: the list holds still and the drag is transforms only —
    the dragged row tracks the pointer, the rows it passes step aside — and
    the order is written once, after the row has settled into its slot.
  */
  const startDrag = (key: string, event: React.PointerEvent) => {
    event.preventDefault();
    const height = rowNodes.current.get(key)?.offsetHeight ?? ROW_HEIGHT;
    const from = order.indexOf(key),
      startY = event.clientY,
      first = pinned.length,
      last = order.length - 1,
      node = list.current,
      startScroll = node?.scrollTop ?? 0;
    let to = from,
      dy = 0;
    setDrag({ key, from, to, dy, height, settling: false });
    const move = (e: PointerEvent) => {
      dy = e.clientY - startY + ((node?.scrollTop ?? 0) - startScroll);
      to = Math.min(Math.max(from + Math.round(dy / height), first), last);
      setDrag({ key, from, to, dy, height, settling: false });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
      if (to === from && Math.abs(dy) < 2) return setDrag(null);
      setDrag({
        key,
        from,
        to,
        dy: (to - from) * height,
        height,
        settling: true,
      });
      settleTimer.current = window.setTimeout(() => {
        layout.move(key, to);
        setDrag(null);
      }, SETTLE_MS);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  };

  // Order changes without a drag (a pin, an arrow key, Reset Default) slide
  // into place too: measure, put each row back where it was, release.
  const rowTops = useRef(new Map<string, number>());
  const layoutKey = `${order.join("|")}::${pinned.join("|")}`;
  const lastKey = useRef(layoutKey);
  useIsomorphicLayoutEffect(() => {
    const reordered = lastKey.current !== layoutKey;
    lastKey.current = layoutKey;
    const tops = rowTops.current;
    for (const [key, node] of rowNodes.current) {
      const top = node.getBoundingClientRect().top;
      const was = tops.get(key);
      if (reordered && !drag && was !== undefined && Math.abs(was - top) > 0.5) {
        node.style.transition = "none";
        node.style.transform = `translateY(${was - top}px)`;
        requestAnimationFrame(() => {
          node.style.transition = `transform ${SETTLE_MS}ms ${EASE}`;
          node.style.transform = "translateY(0px)";
        });
      }
      tops.set(key, top);
    }
    for (const key of [...tops.keys()])
      if (!rowNodes.current.has(key)) tops.delete(key);
  });
  const rowShift = (index: number, isDragged: boolean) => {
    if (!drag) return 0;
    if (isDragged) return drag.dy;
    if (drag.from < drag.to && index > drag.from && index <= drag.to)
      return -drag.height;
    if (drag.from > drag.to && index >= drag.to && index < drag.from)
      return drag.height;
    return 0;
  };

  const resets = [
    ...(onResetWidths ? ([["Reset Width", onResetWidths]] as const) : []),
    [
      "Reset Default",
      () => {
        layout.reset();
        onResetWidths?.();
        setSearch("");
      },
    ] as const,
  ];

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        {/* Blue while the columns differ from the default, so a table someone
            has rearranged says so from the toolbar. */}
        <button
          type="button"
          aria-label="Customize columns"
          className={cn(
            "inline-flex h-control items-center gap-2 rounded-sm border px-3 text-small font-medium transition-[border-color,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
            layout.anyHidden
              ? "border-pi-brand-border bg-pi-brand-tint text-pi-brand"
              : "border-transparent text-pi-body hover:bg-pi-fill hover:text-pi-ink"
          )}
        >
          <Columns3 className="size-3.5" aria-hidden />
          Columns
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[300px] p-0"
        // The table behind is the preview; a drag that leaves the panel must
        // not read as "dismiss".
        onPointerDownOutside={(e) => drag && e.preventDefault()}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-neutral-gray px-4 py-2">
          <Search
            className="size-4 flex-none text-secondary-foreground"
            aria-hidden
          />
          <input
            ref={searchRef}
            aria-label="Search columns"
            placeholder="Search…"
            className="w-full min-w-0 border-0 bg-transparent text-body text-foreground outline-none placeholder:text-secondary-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearch("");
                searchRef.current?.focus();
              }}
              className="flex-none text-secondary-foreground hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
        <div
          ref={list}
          className="max-h-[320px] overflow-y-auto px-3 py-1 [scrollbar-color:hsl(var(--popover-border))_transparent] [scrollbar-width:thin]"
        >
          {matches.length === 0 ? (
            <p className={cn(T.sub, "px-3 py-8 text-center")}>
              No column matches “{search.trim()}”.
            </p>
          ) : (
            matches.map((c, i) => {
              const isPinned = pinned.includes(c);
              const fixed = locked.has(c);
              const checked = visible.includes(c);
              const isDragged = drag?.key === c;
              const id = `col-${c}`;
              return (
                <div
                  key={c}
                  ref={(node) => {
                    if (node) rowNodes.current.set(c, node);
                    else rowNodes.current.delete(c);
                  }}
                  style={{
                    transform: `translateY(${rowShift(i, isDragged)}px)`,
                    transition:
                      isDragged && !drag?.settling
                        ? "none"
                        : `transform ${SETTLE_MS}ms ${EASE}`,
                    willChange: drag ? "transform" : undefined,
                  }}
                  className={cn(
                    "group/row relative flex h-8 items-center gap-2 rounded-sm px-1",
                    isDragged &&
                      "z-10 bg-background shadow-lg ring-1 ring-neutral-gray"
                  )}
                >
                  {isPinned || filtering ? (
                    <span className="size-5 flex-none" />
                  ) : (
                    <button
                      type="button"
                      aria-label={`Reorder ${layout.label(c)}`}
                      onPointerDown={(e) => startDrag(c, e)}
                      // Arrow keys reorder for anyone not using a pointer.
                      onKeyDown={(e) => {
                        if (e.key !== "ArrowUp" && e.key !== "ArrowDown")
                          return;
                        e.preventDefault();
                        layout.move(
                          c,
                          order.indexOf(c) + (e.key === "ArrowDown" ? 1 : -1)
                        );
                      }}
                      className="inline-flex size-5 flex-none cursor-grab touch-none items-center justify-center rounded-xs text-secondary-foreground hover:text-foreground active:cursor-grabbing"
                    >
                      <GripVertical className="size-3" />
                    </button>
                  )}
                  {fixed ? (
                    <span
                      className="flex size-3 flex-none items-center justify-center text-secondary-foreground"
                      title={`${layout.label(c)} is always shown`}
                    >
                      <Lock className="size-3" aria-hidden />
                      <span className="sr-only">{layout.label(c)} is locked</span>
                    </span>
                  ) : (
                    <Checkbox
                      id={id}
                      checked={checked}
                      disabled={checked && visible.length === 1}
                      onCheckedChange={(next) => layout.toggle(c, !!next)}
                      className="size-3 rounded-xs [&_svg]:size-2.5"
                    />
                  )}
                  <Label
                    htmlFor={id}
                    className={cn(
                      "flex-1 truncate text-small font-normal text-foreground",
                      !fixed && "cursor-pointer",
                      !checked && "text-secondary-foreground"
                    )}
                  >
                    {layout.label(c)}
                  </Label>
                  {pinnable && (
                    <button
                      type="button"
                      onClick={() => layout.togglePin(c)}
                      aria-label={
                        isPinned
                          ? `Unpin ${layout.label(c)}`
                          : `Pin ${layout.label(c)}`
                      }
                      aria-pressed={isPinned}
                      title={
                        isPinned
                          ? "Unpin — lets the column be reordered"
                          : "Pin — moves the column to the front"
                      }
                      className={cn(
                        "inline-flex size-5 flex-none items-center justify-center rounded-xs transition-opacity duration-150 hover:bg-neutral-gray focus-visible:opacity-100",
                        isPinned
                          ? "text-primary"
                          : "text-secondary-foreground opacity-0 hover:text-foreground group-hover/row:opacity-100"
                      )}
                    >
                      {isPinned ? (
                        <PinOff className="size-3" />
                      ) : (
                        <Pin className="size-3" />
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
        {/* Neutral, not the library's red: a reset is an undo, and red is
            kept for deletes. */}
        <div className="flex items-start gap-3 border-t border-neutral-gray px-4 pb-3 pt-2">
          {resets.map(([label, onClick]) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md p-1 text-small font-medium text-secondary-foreground hover:bg-neutral-gray hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Undo2 className="size-3" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
