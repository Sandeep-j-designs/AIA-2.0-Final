import * as React from "react";

/*
  The sliding underline for a row of underline tabs (5 Nov 2026). Put it as
  the last child of the tablist (which must be `relative`); it finds the
  active tab by Radix's data-state or aria-selected and glides to it. One
  bar moves instead of one tab's border switching off and another's on,
  which read as a jump. Only transform animates (a 100px bar, scaled to the
  tab's width), and reduced motion snaps.
*/
const ACTIVE =
  ':scope > [role="tab"][data-state="active"], :scope > [role="tab"][aria-selected="true"]';

export const TabIndicator = () => {
  const bar = React.useRef<HTMLSpanElement>(null);

  React.useLayoutEffect(() => {
    const el = bar.current;
    const list = el?.parentElement;
    if (!el || !list) return;
    let placed = false;

    const place = () => {
      const tab = list.querySelector<HTMLElement>(ACTIVE);
      if (!tab) {
        el.style.opacity = "0";
        return;
      }
      const x = tab.offsetLeft;
      const w = tab.offsetWidth / 100;
      // The first placement lands without sliding in from the left edge.
      if (!placed) el.style.transition = "none";
      el.style.transform = `translateX(${x}px) scaleX(${w})`;
      el.style.opacity = "1";
      if (!placed) {
        void el.offsetWidth;
        el.style.transition = "";
        placed = true;
        list.setAttribute("data-tab-indicator", "");
      }
    };

    place();
    const mutations = new MutationObserver(place);
    mutations.observe(list, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state", "aria-selected"],
      childList: true,
    });
    const sizes = new ResizeObserver(place);
    sizes.observe(list);
    Array.from(list.children).forEach((child) => sizes.observe(child));
    return () => {
      mutations.disconnect();
      sizes.disconnect();
      list.removeAttribute("data-tab-indicator");
    };
  }, []);

  return <span ref={bar} aria-hidden className="tab-indicator" />;
};

export default TabIndicator;
