import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "@/components/icons";
import type { NeoCard, NeoDecisionItem } from "@/types/pages/neo";
import { cn } from "@/lib/utils";
import { answered, applies, OTHER } from "@/utils/pages/neo/decisions";

type Card = Extract<NeoCard, { kind: "decisions" }>;

type Props = {
  card: Card;
  /** Answerable: the run is waiting on these questions. */
  live: boolean;
  onChange: (card: Card) => void;
  /** The sign-off: what it risks and its buttons, on the Submit tab. */
  footer?: React.ReactNode;
  /**
   * Words sent from the prompt box under the card: the open question's
   * "Something else" (`n` counts sends, so the same words twice still land).
   */
  typed?: { text: string; n: number };
  /** Which question is open, so the prompt box can say what typing does. */
  onActive?: (item?: NeoDecisionItem) => void;
};

/** One question at a time with a compact counter, optional explanation and
 * a final review. Numeric and arrow-key shortcuts remain available.
 * Recommended answers are prefilled; submission still requires sign-off.
 */
const DecisionsCard = ({
  card,
  live,
  onChange,
  footer,
  typed,
  onActive,
}: Props) => {
  const asked = card.items.filter((i) => applies(card, i) && !i.settled);
  const settled = card.items.filter((i) => applies(card, i) && i.settled);
  const submitTab = asked.length;
  const [tab, setTab] = useState(asked.length ? 0 : submitTab);
  const item = asked[tab] as NeoDecisionItem | undefined;
  const rows = item ? rowsOf(item) : [];
  const [cursor, setCursor] = useState(0);
  const [typing, setTyping] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // Each question opens with the cursor on its answer, or the first row.
  useEffect(() => {
    if (!item) return;
    const at = rows.findIndex((r) => r.id === item.pick);
    setCursor(at < 0 ? 0 : at);
    setTyping(item.pick === OTHER);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);
  useEffect(() => {
    if (live) box.current?.focus({ preventScroll: true });
  }, [live]);
  useEffect(() => {
    if (typing) input.current?.focus();
  }, [typing]);
  useEffect(() => {
    onActive?.(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, item?.id, live]);
  // Words from the prompt box answer the open question in your own words.
  useEffect(() => {
    if (!typed || !item?.other) return;
    onChange({
      ...card,
      items: card.items.map((i) =>
        i.id === item.id ? { ...i, pick: OTHER, note: typed.text } : i
      ),
    });
    setTab((t) => Math.min(t + 1, submitTab));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed?.n]);

  if (!live) return <Answered card={card} />;

  const patch = (id: string, p: Partial<NeoDecisionItem>) =>
    onChange({
      ...card,
      items: card.items.map((i) => (i.id === id ? { ...i, ...p } : i)),
    });
  const next = () => setTab((t) => Math.min(t + 1, submitTab));
  const choose = (i: number) => {
    if (!item) return;
    const row = rows[i];
    setCursor(i);
    if (row.id === OTHER) {
      patch(item.id, { pick: OTHER });
      setTyping(true);
      return;
    }
    patch(item.id, { pick: row.id, note: undefined });
    setTyping(false);
    next();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.target as HTMLElement).closest("button, summary")) return;
    if (typing && e.target === input.current) {
      if (e.key === "Enter" && item?.note?.trim()) {
        e.preventDefault();
        setTyping(false);
        box.current?.focus();
        next();
      }
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setTab((t) => Math.min(t + 1, submitTab));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setTab((t) => Math.max(t - 1, 0));
    } else if (!item) {
      return;
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(cursor);
    } else if (/^[1-9]$/.test(e.key) && Number(e.key) <= rows.length) {
      e.preventDefault();
      choose(Number(e.key) - 1);
    }
  };

  return (
    <section
      aria-label={card.title}
      className="overflow-hidden rounded-md border border-pi-line bg-background"
    >
      <div
        ref={box}
        tabIndex={-1}
        onKeyDown={onKey}
        className="focus-visible:outline-none"
      >
        <header className="flex items-center justify-between gap-3 px-4 pb-1 pt-3">
          <p
            className="min-w-0 truncate text-caption text-pi-faint"
            aria-live="polite"
          >
            {item ? (
              <>
                <span className="tabular-nums">
                  {tab + 1} of {asked.length}
                </span>
                <span aria-hidden="true" className="mx-2">
                  ·
                </span>
                {item.header || "Question"}
              </>
            ) : (
              "Review answers"
            )}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {item && (
              <button
                type="button"
                onClick={() => setTab(submitTab)}
                className="mr-1 rounded-md px-2 py-1 text-caption text-pi-body hover:bg-pi-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand"
              >
                Review
              </button>
            )}
            <button
              type="button"
              aria-label="Previous question"
              disabled={tab === 0}
              onClick={() => setTab((t) => Math.max(t - 1, 0))}
              className="grid size-7 place-items-center rounded-sm text-pi-body hover:bg-pi-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand disabled:opacity-25"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Next question"
              disabled={tab === submitTab}
              onClick={() => setTab((t) => Math.min(t + 1, submitTab))}
              className="grid size-7 place-items-center rounded-sm text-pi-body hover:bg-pi-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand disabled:opacity-25"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </header>

        {item ? (
          <div className="px-4 pb-4 pt-2">
            <p className="text-body font-semibold leading-5 text-pi-ink">
              {item.question}
            </p>
            {item.why && (
              <details
                key={item.id}
                className="mt-2 text-caption leading-5 text-pi-body"
              >
                <summary className="w-fit cursor-pointer rounded-sm text-pi-faint hover:text-pi-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand">
                  Why this needs a decision
                </summary>
                <p className="mt-2">{item.why}</p>
              </details>
            )}
            <ol
              role="listbox"
              aria-label={item.question}
              aria-activedescendant={`neo-q-${item.id}-${cursor}`}
              className="mt-3 flex flex-col gap-2"
            >
              {rows.map((r, i) => {
                const on = item.pick === r.id;
                const here = cursor === i;
                return (
                  <li
                    key={r.id}
                    id={`neo-q-${item.id}-${i}`}
                    role="option"
                    aria-selected={on}
                    tabIndex={0}
                    onFocus={() => setCursor(i)}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => choose(i)}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-md border px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand",
                      on
                        ? "border-pi-brand-border bg-pi-brand-tint"
                        : here
                          ? "border-pi-line-2 bg-pi-fill"
                          : "border-pi-line hover:bg-pi-fill"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-4 flex-none place-items-center rounded-full border",
                        on
                          ? "border-pi-brand bg-pi-brand text-white"
                          : "border-pi-line-2 bg-background"
                      )}
                    >
                      {on && <Check className="size-2.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "flex flex-wrap items-center gap-x-2 text-small leading-5 text-pi-ink",
                          on && "font-medium"
                        )}
                      >
                        {r.label}
                        {r.id === item.recommended && (
                          <span className="text-caption font-normal text-pi-faint">
                            Suggested
                          </span>
                        )}
                      </span>
                      {r.hint && (
                        <span className="block text-caption leading-5 text-pi-body">
                          {r.hint}
                        </span>
                      )}
                      {r.id === OTHER && on && (
                        <input
                          ref={input}
                          value={item.note || ""}
                          onChange={(e) =>
                            patch(item.id, { note: e.target.value })
                          }
                          onClick={(e) => e.stopPropagation()}
                          placeholder={
                            item.other?.placeholder || "Type your answer"
                          }
                          aria-label={`${item.question}: your answer`}
                          className="mt-2 h-8 w-full rounded-sm border border-pi-line-2 bg-background px-3 text-small text-pi-ink placeholder:text-pi-faint focus:border-primary focus-visible:outline-none"
                        />
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : (
          <Review card={card} asked={asked} settled={settled} onTab={setTab} />
        )}

        <p className="sr-only">
          {item
            ? "Enter to select · ↑↓ to move · ← → between questions"
            : asked.every(answered)
              ? "Check your answers, then choose the action below"
              : "Answer the questions marked with a dot to continue"}
        </p>
      </div>
      {!item && footer && (
        <footer className="border-t border-pi-line bg-pi-head-bg px-4 py-3">
          {footer}
        </footer>
      )}
    </section>
  );
};

/** A question's answers, then "Something else" when it takes words. */
const rowsOf = (item: NeoDecisionItem) => [
  ...item.options,
  ...(item.other
    ? [
        {
          id: OTHER,
          label: "Something else",
          hint: "Say it in your own words",
        },
      ]
    : []),
];

const labelOf = (item: NeoDecisionItem) =>
  item.pick === OTHER
    ? `“${item.note?.trim() || "…"}”`
    : item.options.find((o) => o.id === item.pick)?.label || "Not answered";

/** The Submit tab: every answer, what the records settle, then the sign-off. */
const Review = ({
  card,
  asked,
  settled,
  onTab,
}: {
  card: Card;
  asked: NeoDecisionItem[];
  settled: NeoDecisionItem[];
  onTab: (i: number) => void;
}) => (
  <div className="px-4 pb-4 pt-2">
    <p className="text-body font-semibold leading-5 text-pi-ink">
      {card.title}
    </p>
    {asked.length > 0 && (
      <ul className="mt-3 flex flex-col">
        {asked.map((q, i) => (
          <li key={q.id}>
            <button
              type="button"
              onClick={() => onTab(i)}
              className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-pi-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
            >
              {answered(q) ? (
                <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-pi-success" />
              ) : (
                <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-pi-warning-dot" />
              )}
              <span className="min-w-0 text-small leading-5">
                <span className="block text-pi-body">{q.question}</span>
                <span
                  className={cn(
                    "block font-medium",
                    answered(q) ? "text-pi-ink" : "text-pi-warning"
                  )}
                >
                  → {labelOf(q)}
                  {!!q.recommended && q.pick === q.recommended && (
                    <span className="font-normal text-pi-body">
                      {" "}
                      (Recommended)
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    )}
    {settled.length > 0 && (
      <div className="mt-3 border-t border-pi-line pt-3">
        <p className="px-2 text-caption font-semibold text-pi-ink-2">
          Settled from your records
        </p>
        <ul className="mt-1 flex flex-col">
          {settled.map((q) => (
            <li
              key={q.id}
              className="flex items-start gap-2 px-2 py-1 text-small leading-5"
            >
              <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-pi-success" />
              <span className="min-w-0">
                <span className="text-pi-ink">{labelOf(q)}</span>
                <span className="text-pi-body"> · {q.settled}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

/** After it's submitted: each question and its answer, as the chat's record. */
const Answered = ({ card }: { card: Card }) => {
  const items = card.items.filter((i) => applies(card, i));
  return (
    <section
      aria-label={card.title}
      className="rounded-md border border-pi-line px-4 py-3"
    >
      <p className="text-caption font-semibold text-pi-ink-2">{card.title}</p>
      <ul className="mt-2 flex flex-col gap-1">
        {items.map((i) => (
          <li
            key={i.id}
            className="flex items-start gap-2 text-small leading-5"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-pi-success" />
            <span className="min-w-0">
              <span className="text-pi-body">{i.question} </span>
              <span className="font-medium text-pi-ink">{labelOf(i)}</span>
              {i.settled && (
                <span className="text-caption text-pi-body">
                  {" "}
                  · settled: {i.settled}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default DecisionsCard;
