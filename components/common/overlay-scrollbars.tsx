import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** The scroller these bars stand in for. Give it `scrollbar-hide`. */
  scroller: React.RefObject<HTMLElement | null>;
  className?: string;
};

type Thumb = { size: number; offset: number } | null;

/** Inset of each bar from the scroller's edges. */
const EDGE = 4;
/** Room left at the far end of each bar so the two never cross. */
const CORNER = 12;
const MIN_THUMB = 32;
const IDLE_MS = 900;
/** A pause this long ends a wheel gesture, so the next one may pick its axis. */
const GESTURE_MS = 140;

/**
 * Thin scrollbars that float over the content instead of reserving a strip
 * of their own: a native bar took a full band under the last row, which read
 * as an empty block between the table and the pager.
 *
 * Render this as a sibling of the scroller inside a `relative` parent whose
 * box matches the scroller's. The bars show while the pointer is over the
 * scroller, while it scrolls, and while a thumb is dragged. The track lets
 * pointer events through to the rows; only the thumb takes them.
 */
const OverlayScrollbars = ({ scroller, className }: Props) => {
  const [frame, setFrame] = useState<{ top: number; height: number } | null>(
    null
  );
  const [x, setX] = useState<Thumb>(null);
  const [y, setY] = useState<Thumb>(null);
  const [hovered, setHovered] = useState(false);
  const [moving, setMoving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const idle = useRef<number>();

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    el.toggleAttribute("data-table-scrolled", el.scrollTop > 12);
    // Keep table headers below the actual toolbar height, including wrapping.
    if (el.classList.contains("table-scroller")) {
      const toolbar = el.querySelector<HTMLElement>(":scope > .sticky");
      el.style.setProperty(
        "--table-toolbar-height",
        `${toolbar?.offsetHeight ?? 0}px`
      );
    }
    const table = el.querySelector<HTMLElement>(
      ".table-region [data-slot='table']"
    );
    if (table) {
      const viewport = el.getBoundingClientRect();
      const bounds = table.getBoundingClientRect();
      const toolbar = el.querySelector<HTMLElement>(":scope > .sticky");
      const top = Math.max(
        bounds.top,
        viewport.top + (toolbar?.offsetHeight ?? 0) + 12
      );
      const bottom = Math.min(bounds.bottom, viewport.bottom);
      const next = {
        top: top - viewport.top,
        height: Math.max(0, bottom - top),
      };
      setFrame((previous) =>
        previous &&
        Math.abs(previous.top - next.top) < 0.5 &&
        Math.abs(previous.height - next.height) < 0.5
          ? previous
          : next
      );
    } else {
      setFrame(null);
    }
    const axis = (client: number, total: number, position: number): Thumb => {
      if (total - client < 1) return null;
      const track = client - EDGE * 2 - CORNER;
      const size = Math.max(MIN_THUMB, (client / total) * track);
      const offset = (position / (total - client)) * (track - size);
      return { size, offset };
    };
    const same = (a: Thumb, b: Thumb) =>
      a === b ||
      (!!a &&
        !!b &&
        Math.abs(a.size - b.size) < 0.5 &&
        Math.abs(a.offset - b.offset) < 0.5);
    const nextX = axis(el.clientWidth, el.scrollWidth, el.scrollLeft);
    const nextY = axis(el.clientHeight, el.scrollHeight, el.scrollTop);
    setX((prev) => (same(prev, nextX) ? prev : nextX));
    setY((prev) => (same(prev, nextY) ? prev : nextY));
  }, [scroller]);

  const bound = useRef<HTMLElement | null>(null);
  const unbind = useRef<(() => void) | null>(null);
  /*
    One axis per gesture (9 Nov 2026). A trackpad swipe is rarely straight, so
    the table drifted diagonally. The first wheel event of a gesture picks the
    axis it moves along most; until the gesture pauses, movement on the other
    axis is dropped. Pinch-zoom (ctrl + wheel) is left alone.
  */
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let axis: "x" | "y" | null = null;
    let timer: number | undefined;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      const unit =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? el.clientHeight : 1;
      const dx = event.deltaX * unit;
      const dy = event.deltaY * unit;
      if (!dx && !dy) return;
      if (!axis) axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        axis = null;
      }, GESTURE_MS);
      const off = axis === "x" ? dy : dx;
      // Straight along the chosen axis: let the browser scroll natively.
      if (!off) return;
      event.preventDefault();
      if (axis === "x") el.scrollLeft += dx;
      else el.scrollTop += dy;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(timer);
    };
  }, [scroller]);

  useEffect(() => {
    // Every render of the owner: the content may have changed size.
    measure();
    const el = scroller.current;
    if (el === bound.current) return;
    unbind.current?.();
    unbind.current = null;
    bound.current = el;
    if (!el) return;
    const onScroll = () => {
      measure();
      setMoving(true);
      window.clearTimeout(idle.current);
      idle.current = window.setTimeout(() => setMoving(false), IDLE_MS);
    };
    const onEnter = () => setHovered(true);
    const onLeave = () => setHovered(false);
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(el);
    const toolbar = el.querySelector<HTMLElement>(":scope > .sticky");
    if (toolbar) observer?.observe(toolbar);
    window.addEventListener("resize", measure);
    unbind.current = () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  });
  useEffect(
    () => () => {
      unbind.current?.();
      window.clearTimeout(idle.current);
    },
    []
  );

  /** Drag a thumb: pointer travel maps onto scroll travel along its axis. */
  const drag =
    (axis: "x" | "y") => (event: React.PointerEvent<HTMLDivElement>) => {
      const el = scroller.current;
      const thumb = axis === "x" ? x : y;
      if (!el || !thumb || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      const handle = event.currentTarget;
      handle.setPointerCapture(event.pointerId);
      setDragging(true);
      const start = axis === "x" ? event.clientX : event.clientY;
      const from = axis === "x" ? el.scrollLeft : el.scrollTop;
      const client = axis === "x" ? el.clientWidth : el.clientHeight;
      const total = axis === "x" ? el.scrollWidth : el.scrollHeight;
      const track = client - EDGE * 2 - CORNER;
      const ratio = (total - client) / Math.max(1, track - thumb.size);
      const move = (e: PointerEvent) => {
        const delta = (axis === "x" ? e.clientX : e.clientY) - start;
        if (axis === "x") el.scrollLeft = from + delta * ratio;
        else el.scrollTop = from + delta * ratio;
      };
      const end = () => {
        setDragging(false);
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", end);
        handle.removeEventListener("pointercancel", end);
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", end);
      handle.addEventListener("pointercancel", end);
    };

  const shown = hovered || moving || dragging;
  const thumbClass = cn(
    "pointer-events-auto absolute rounded-full bg-pi-line-strong transition-[opacity,background-color] duration-150 hover:bg-pi-faint",
    dragging && "bg-pi-faint",
    shown ? "opacity-100" : "opacity-0 hover:opacity-100"
  );

  return (
    <div
      data-slot="overlay-scrollbars"
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 z-30", className)}
    >
      {frame && frame.height > 0 && (
        <div
          data-slot="table-viewport-frame"
          style={{ top: frame.top, height: frame.height }}
        />
      )}
      {x && (
        <div
          data-scroll-axis="horizontal"
          className={cn(thumbClass, "h-1.5")}
          style={{ bottom: EDGE, left: EDGE + x.offset, width: x.size }}
          onPointerDown={drag("x")}
        />
      )}
      {y && (
        <div
          data-scroll-axis="vertical"
          className={cn(thumbClass, "w-1.5")}
          style={{ right: EDGE, top: EDGE + y.offset, height: y.size }}
          onPointerDown={drag("y")}
        />
      )}
    </div>
  );
};

export default OverlayScrollbars;
