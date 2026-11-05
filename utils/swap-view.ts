import { flushSync } from "react-dom";

/**
 * Runs a tab switch as a view transition (5 Nov 2026): the table crossfades
 * from the old rows to the new ones, so no frame is ever blank.
 *
 * The page scroller holding the table (`.table-scroller` around
 * `.swap-region`) is what gets captured, because a scroller's snapshot is
 * clipped to what is on screen. Capturing the table itself drew its full
 * height over the sticky pager, which vanished for the length of the fade.
 * The tab rows inside the scroller are captured on their own, shown live and
 * never faded, so the sliding underline keeps moving through it. The names
 * exist only for the transition, so nothing else on the page can clash
 * with them. Falls back to a plain update where the API is missing or motion
 * is reduced.
 */
export const swapView = (update: () => void) => {
  if (
    typeof document === "undefined" ||
    typeof document.startViewTransition !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    update();
    return;
  }
  const region = document.querySelector<HTMLElement>(".swap-region");
  const scroller =
    region?.closest<HTMLElement>(".table-scroller") ?? region ?? null;
  const named: HTMLElement[] = [];
  const name = (el: HTMLElement, id: string, kind: string) => {
    el.style.setProperty("view-transition-name", id);
    el.style.setProperty("view-transition-class", kind);
    named.push(el);
  };
  if (scroller) {
    name(scroller, "swap-region", "swap-region");
    scroller
      .querySelectorAll<HTMLElement>('[role="tablist"]')
      .forEach((tabs, i) => name(tabs, `swap-tabs-${i}`, "swap-tabs"));
  }
  const transition = document.startViewTransition(() => flushSync(update));
  void transition.finished.finally(() => {
    named.forEach((el) => {
      el.style.removeProperty("view-transition-name");
      el.style.removeProperty("view-transition-class");
    });
  });
};

export default swapView;
