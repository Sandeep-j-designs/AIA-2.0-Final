import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, Search } from "@/components/icons";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useKnowledge, type Pattern } from "@/hooks/pages/neo/use-knowledge";

const button =
  "inline-flex items-center justify-center gap-2 rounded-md border border-pi-line px-3 py-2 text-small font-medium text-pi-ink hover:bg-pi-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand disabled:opacity-40";
export default function CompanyKnowledge({
  company,
  companyName,
}: {
  company: string;
  companyName: string;
}) {
  const k = useKnowledge(company);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All patterns");
  const [selected, setSelected] = useState<string | null>(null);
  const [ledger, setLedger] = useState("");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const status = (p: Pattern) => {
    const edit = k.saved.edits[p.id];
    return edit?.disabled
      ? "Disabled"
      : !edit || edit.reviewed !== p.ledger
        ? "Needs review"
        : "Confirmed";
  };
  const pending = k.patterns.filter((p) => status(p) === "Needs review").length;
  const visible = k.patterns.filter(
    (p) =>
      (filter === "All patterns" || status(p) === filter) &&
      `${p.supplier} ${k.saved.edits[p.id]?.ledger || p.ledger}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );
  const active = k.patterns.find((p) => p.id === selected);
  const edit = active ? k.saved.edits[active.id] : undefined;
  const open = (p: Pattern) => {
    setSelected(p.id);
    setLedger(k.saved.edits[p.id]?.ledger || p.ledger);
    setNote(k.saved.edits[p.id]?.note || "");
    setNotice("");
  };
  return (
    <div className="neo-skills-scroll min-h-0 flex-1 overflow-y-auto">
      <div className="neo-skills-content">
        <header className="neo-library-header">
          <div>
            <h1>Company knowledge</h1>
            <p>
              The patterns in your books, with your experience added. Review
              what Neo has learned and tell it what to use.
            </p>
          </div>
        </header>
        <div className="knowledge-summary">
          <div>
            <span className="text-caption text-pi-body">
              SUPPLIER ACCOUNT MAPPINGS
            </span>
            <p className="mt-2 text-h2 font-semibold">
              {k.patterns.length} patterns{" "}
              <span className="text-small font-normal text-pi-body">
                · {pending} to review
              </span>
            </p>
          </div>
          <div className="text-small text-pi-body">
            <p>
              {k.saved.refreshed
                ? `Updated ${new Date(k.saved.refreshed).toLocaleString()}`
                : "Reading approved records…"}
            </p>
            <p className="mt-1">
              Refreshes when books change and daily while Neo is open.
            </p>
          </div>
          <button
            type="button"
            className={button}
            disabled={!k.ready}
            onClick={() => {
              k.refresh();
              setNotice("Knowledge is up to date with the available books.");
            }}
          >
            Refresh now
          </button>
        </div>
        <p className="my-4 text-caption text-pi-body">
          Prototype books · Edits are saved in this browser for {companyName}. A
          live accounting connection and background refresh are not connected.
        </p>
        {k.error && (
          <p role="alert" className="mb-4 text-small text-destructive">
            {k.error}
          </p>
        )}
        <p role="status" className="text-small text-pi-brand">
          {notice}
        </p>
        <div className="knowledge-toolbar">
          <div className="flex flex-wrap gap-2" aria-label="Filter patterns">
            {["All patterns", "Needs review", "Confirmed", "Disabled"].map(
              (f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={`${button} ${filter === f ? "bg-pi-brand-tint text-pi-brand" : ""}`}
                >
                  {f}
                </button>
              )
            )}
          </div>
          <label className="flex items-center gap-2 rounded-md border border-pi-line bg-background px-3 py-2">
            <Search className="size-4 text-pi-body" />
            <input
              aria-label="Search knowledge"
              placeholder="Find a supplier or account"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 bg-transparent text-small outline-none"
            />
          </label>
        </div>
        <ul className="neo-procedure-list">
          {visible.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => open(p)}
                className="knowledge-row"
              >
                <span className="neo-skill-icon shrink-0">
                  <BookOpen className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-body font-semibold text-pi-ink">
                    {p.supplier}
                  </span>
                  <span className="mt-1 block text-small text-pi-body">
                    Usually booked to{" "}
                    <strong>{k.saved.edits[p.id]?.ledger || p.ledger}</strong>
                  </span>
                  <span className="mt-2 block text-caption text-pi-faint">
                    {p.total} posted bills ·{" "}
                    {k.saved.edits[p.id]
                      ? "Reviewed by you"
                      : "Learned from books"}
                  </span>
                </span>
                <span
                  className={`knowledge-status ${status(p) === "Needs review" ? "text-pi-brand bg-pi-brand-tint" : "text-pi-body bg-pi-fill"}`}
                >
                  {status(p)}
                </span>
                <ArrowRight className="size-4 shrink-0 text-pi-body" />
              </button>
            </li>
          ))}
        </ul>
        {!visible.length && (
          <div className="rounded-md border border-dashed border-pi-line p-10 text-center">
            <BookOpen className="mx-auto mb-3 size-6 text-pi-brand" />
            <h2 className="text-body font-semibold">
              {k.patterns.length
                ? "No matching patterns"
                : "Knowledge starts with your books"}
            </h2>
            <p className="mt-2 text-small text-pi-body">
              {k.patterns.length
                ? "Try another search or filter."
                : "Neo looks for at least two approved purchase bills from the same supplier with a single expense account. Patterns will appear here as your books grow."}
            </p>
          </div>
        )}
        <p className="mt-6 text-small leading-6 text-pi-body">
          Your corrections take priority. New evidence can suggest a change, but
          it will never replace a confirmed account without your review.
        </p>
      </div>
      <Sheet
        open={!!active}
        onOpenChange={(v) => {
          if (!v) setSelected(null);
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-[600px]">
          {active && (
            <>
              <div className="pr-7">
                <p className="mb-2 text-caption text-pi-brand">
                  SUPPLIER ACCOUNT MAPPING
                </p>
                <SheetTitle>{active.supplier}</SheetTitle>
                <SheetDescription className="mt-2">
                  Review the evidence, then choose the account Neo should
                  suggest.
                </SheetDescription>
              </div>
              {edit && edit.reviewed !== active.ledger && (
                <div className="my-5 rounded-md bg-pi-brand-tint p-4 text-small text-pi-brand">
                  The books now suggest {active.ledger}. Your account,{" "}
                  {edit.ledger}, is unchanged. Keep it below or enter the
                  suggested account.
                </div>
              )}
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!ledger.trim()) return;
                  k.update(
                    active,
                    ledger.trim(),
                    note.trim(),
                    false,
                    edit ? "Updated and confirmed" : "Confirmed"
                  );
                  setNotice("Pattern saved. Your choice takes priority.");
                  setSelected(null);
                }}
              >
                <label className="block text-small font-medium">
                  Suggested account
                  <input
                    required
                    value={ledger}
                    onChange={(e) => setLedger(e.target.value)}
                    className="mt-2 block w-full rounded-md border border-pi-line bg-background p-3 font-normal"
                  />
                </label>
                <label className="block text-small font-medium">
                  Notes for this pattern
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add context or exceptions for your team"
                    rows={3}
                    className="mt-2 block w-full rounded-md border border-pi-line bg-background p-3 font-normal"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`${button} bg-pi-brand-tint text-pi-brand`}
                    type="submit"
                  >
                    {edit?.disabled ? "Confirm and enable" : "Save and confirm"}
                  </button>
                  <button
                    type="button"
                    className={button}
                    disabled={edit?.disabled}
                    onClick={() => {
                      k.update(
                        active,
                        edit?.ledger || active.ledger,
                        edit?.note || "",
                        true,
                        "Disabled"
                      );
                      setSelected(null);
                      setNotice("Pattern disabled.");
                    }}
                  >
                    Disable pattern
                  </button>
                  <button
                    type="button"
                    className={button}
                    onClick={() => setSelected(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
              <section className="mt-8 border-t border-pi-line pt-5">
                <h3 className="text-body font-semibold">
                  Evidence from your books
                </h3>
                <p className="my-2 text-small text-pi-body">
                  {
                    active.evidence.filter((e) => e.ledger === active.ledger)
                      .length
                  }{" "}
                  of {active.total} bills use {active.ledger}. These counts
                  describe the sample, not model confidence.
                </p>
                <ul className="divide-y divide-pi-line">
                  {active.evidence.map((e) => (
                    <li key={e.id} className="py-3 text-small">
                      <Link
                        href={`/inbox?module=AP&id=${encodeURIComponent(e.id)}`}
                        className="text-pi-brand hover:underline"
                      >
                        {e.invoice} ↗
                      </Link>
                      <p className="mt-1 text-pi-body">
                        {e.date} · {e.ledger}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="mt-6 border-t border-pi-line pt-5">
                <h3 className="text-body font-semibold">History</h3>
                <ul className="mt-3 space-y-3 text-small text-pi-body">
                  {edit?.history.map((h, i) => (
                    <li key={`${h.at}-${i}`}>
                      <p>{h.text}</p>
                      <p className="text-caption text-pi-faint">
                        {new Date(h.at).toLocaleString()} · You
                      </p>
                    </li>
                  ))}
                  <li>
                    Learned from {active.total} approved bills in the prototype
                    books.
                  </li>
                </ul>
              </section>
              <section className="mt-6 rounded-md bg-pi-fill p-4">
                <h3 className="text-small font-semibold">Suggestion preview</h3>
                <p className="mt-2 text-small text-pi-body">
                  {edit && !edit.disabled && edit.reviewed === active.ledger
                    ? `For a new bill from ${active.supplier}, this mapping would suggest ${edit.ledger}.`
                    : "Confirm this pattern to preview its account suggestion."}
                </p>
                <p className="mt-2 text-caption text-pi-faint">
                  Preview only. Live bill predictions are not yet connected to
                  this knowledge.
                </p>
              </section>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function KnowledgeSummary({ company }: { company: string }) {
  const k = useKnowledge(company);
  const pending = k.patterns.filter(
    (p) =>
      !k.saved.edits[p.id] ||
      (!k.saved.edits[p.id].disabled &&
        k.saved.edits[p.id].reviewed !== p.ledger)
  ).length;
  return (
    <Link href="/inbox?module=NEO&page=knowledge" className="knowledge-home">
      <BookOpen className="size-5 shrink-0 text-pi-brand" />
      <span className="flex-1">
        <strong className="block text-small font-medium text-pi-ink">
          Company knowledge
        </strong>
        <span className="text-caption text-pi-body">
          {k.patterns.length} patterns from your books
          {pending ? ` · ${pending} to review` : " · Review what Neo knows"}
        </span>
      </span>
      <ArrowRight className="size-4 text-pi-brand" />
    </Link>
  );
}
