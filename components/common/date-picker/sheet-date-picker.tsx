import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format, isValid, parseISO } from "date-fns";
import DatePickerPanel from "./panel";

/**
 * The prototype's calendar for every native date input (27 Oct 2026).
 *
 * The AP and AR sheets are plain-JS engines, and their dates — voucher, bill
 * and due date, a GST rate's start, Additional fields, bill allocation — are
 * `<input type="date">` laid transparently over a formatted field, opened
 * with the browser's showPicker(). That calendar is the operating system's,
 * and it looked like a different product inside the form.
 *
 * Mounted once in _app. A click (or Enter, Space, Alt+↓) on any date input is
 * caught on the way down, before the engine's own listener can call
 * showPicker, and this panel opens under the field instead. A pick writes the
 * ISO value back and fires input and change, which is all the engines listen
 * for, so nothing in them changes.
 *
 * Inside an engine dialog the panel renders in that dialog: a modal dialog
 * makes everything outside it inert, so a panel on <body> couldn't be clicked.
 */

type Open = {
  input: HTMLInputElement;
  container: HTMLElement;
  keyboard: boolean;
};

const PANEL_W = 288;
const GAP = 4;

const usable = (el: EventTarget | null): el is HTMLInputElement =>
  el instanceof HTMLInputElement &&
  el.type === "date" &&
  !el.disabled &&
  !el.readOnly &&
  // A form being read (an approved record) lets nothing through.
  getComputedStyle(el).pointerEvents !== "none";

const SheetDatePicker = () => {
  const [open, setOpen] = useState<Open | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    if (!open) return;
    // The input lies over its whole field, so its box is the field's.
    const field = open.input.getBoundingClientRect();
    const height = panel.current?.offsetHeight ?? 380;
    const below = field.bottom + GAP + height <= window.innerHeight - 8;
    const top = below
      ? field.bottom + GAP
      : Math.max(8, field.top - GAP - height);
    const left = Math.min(
      Math.max(8, field.left),
      window.innerWidth - PANEL_W - 8
    );
    setPos({ top, left });
  }, [open]);

  const close = useCallback(
    (refocus: boolean) => {
      if (refocus) open?.input.focus({ preventScroll: true });
      setOpen(null);
      setPos(null);
    },
    [open]
  );

  // Catch the open before the engine's showPicker listener sees it.
  useEffect(() => {
    const start = (input: HTMLInputElement, keyboard: boolean) =>
      setOpen({
        input,
        keyboard,
        container:
          input.closest<HTMLElement>("dialog[open]") ?? document.body,
      });
    const onClick = (event: MouseEvent) => {
      if (!usable(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      start(event.target, false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (!usable(event.target)) return;
      const opens =
        event.key === "Enter" ||
        event.key === " " ||
        (event.altKey && event.key === "ArrowDown");
      if (!opens) return;
      event.preventDefault();
      event.stopPropagation();
      start(event.target, true);
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, []);

  // While open: follow the field, close on a press outside or Escape.
  useEffect(() => {
    if (!open) return;
    place();
    const frame = requestAnimationFrame(place);
    const onPress = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panel.current?.contains(target) || target === open.input) return;
      close(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Escape closes the calendar, not the dialog the field is in.
      event.preventDefault();
      event.stopPropagation();
      close(true);
    };
    const onMove = () => requestAnimationFrame(place);
    document.addEventListener("pointerdown", onPress, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPress, true);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, place, close]);

  if (!open) return null;
  const { input } = open;
  const parse = (v: string) => {
    const d = v ? parseISO(v) : undefined;
    return d && isValid(d) ? d : undefined;
  };
  const write = (day: Date | undefined) => {
    input.value = day ? format(day, "yyyy-MM-dd") : "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    close(true);
  };

  return createPortal(
    <div
      ref={panel}
      role="dialog"
      aria-label={input.getAttribute("aria-label") || "Choose a date"}
      style={{
        position: "fixed",
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        width: PANEL_W,
      }}
      className="z-[1000] rounded-md border border-pi-line bg-background shadow-pi-2 animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none"
    >
      <DatePickerPanel
        value={parse(input.value)}
        minDate={parse(input.min)}
        maxDate={parse(input.max)}
        autoFocus={open.keyboard}
        onSelect={write}
      />
    </div>,
    open.container
  );
};

export default SheetDatePicker;
