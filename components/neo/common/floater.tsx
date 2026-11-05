import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import NeoMark from "./neo-mark";

type Props = { busy?: boolean; onOpen: () => void };

// Offsets from the viewport's right and bottom edges, so the pill keeps its
// corner when the window resizes. Per viewer.
type Pos = { right: number; bottom: number };

const POS_KEY = "aia.neo.floaterPos";
const EDGE = 8;
// Below this a press is a click, not a drag.
const DRAG_SLOP = 4;

const clamp = (p: Pos, el: HTMLElement | null): Pos => {
  const w = el?.offsetWidth ?? 112;
  const h = el?.offsetHeight ?? 40;
  return {
    right: Math.min(Math.max(EDGE, p.right), window.innerWidth - w - EDGE),
    bottom: Math.min(Math.max(EDGE, p.bottom), window.innerHeight - h - EDGE),
  };
};

/**
 * "Ask Neo" where there is no top-bar launcher (the full-screen review).
 * It floats over the page instead of claiming a gutter, and can be dragged
 * anywhere on screen when it sits on something you need (4 Nov 2026).
 */
const NeoFloater = ({ busy, onOpen }: Props) => {
  const ref = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ x: number; y: number; from: Pos; moved: boolean }>();
  const [pos, setPos] = useState<Pos | null>(null);

  // Starts in the bottom-right corner, clear of the form's fields (the old
  // mid-edge spot sat on the GSTIN field).
  useEffect(() => {
    let saved: Pos | null = null;
    try {
      saved = JSON.parse(window.localStorage.getItem(POS_KEY) || "null");
    } catch {
      /* storage blocked: the default spot stands */
    }
    setPos(clamp(saved ?? { right: 24, bottom: 24 }, ref.current));
  }, []);

  useEffect(() => {
    const onResize = () => setPos((p) => (p ? clamp(p, ref.current) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const save = useCallback((p: Pos) => {
    try {
      window.localStorage.setItem(POS_KEY, JSON.stringify(p));
    } catch {
      /* storage blocked: the spot holds for this visit */
    }
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || !pos) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, from: pos, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_SLOP) return;
    d.moved = true;
    setPos(
      clamp({ right: d.from.right - dx, bottom: d.from.bottom - dy }, ref.current)
    );
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (d?.moved && pos) save(pos);
  };

  return (
    <button
      ref={ref}
      type="button"
      title="Ask Neo (Ctrl J) · drag to move"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current = undefined)}
      onClick={() => {
        // A drag ends in a click; only a press that stayed put opens Neo.
        const moved = drag.current?.moved;
        drag.current = undefined;
        if (!moved) onOpen();
      }}
      style={pos ? { right: pos.right, bottom: pos.bottom } : undefined}
      className={cn(
        "fixed z-40 flex h-10 touch-none select-none items-center gap-2 rounded-full border border-pi-line bg-background pl-1.5 pr-4 text-small font-semibold text-pi-ink shadow-popover-shadow hover:bg-pi-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand-border active:cursor-grabbing",
        // Hidden until placed, so it never flashes at the default corner.
        !pos && "invisible bottom-6 right-6"
      )}
    >
      <NeoMark className="h-7 w-7 rounded-full" live={!!busy} />
      Ask Neo
    </button>
  );
};

export default NeoFloater;
