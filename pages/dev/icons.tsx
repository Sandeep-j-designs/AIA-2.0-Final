import { useState } from "react";
import Link from "next/link";
import * as Icons from "@/components/icons";

// The complete registry is intentionally loaded only on this reference page.
const unique = Object.entries(Icons as Record<string, unknown>).filter(
  ([name, value]) =>
    value &&
    typeof value === "object" &&
    "displayName" in value &&
    value.displayName === name
) as [string, Icons.IconComponent][];
const productNames = new Set([
  "Overview",
  "DocumentInbox",
  "Payables",
  "Receivables",
  "Accounting",
  "Inventory",
  "Compliance",
  "Banking",
  "Reconcile",
]);
const meanings: Record<string, string> = {
  Overview: "Workspace overview",
  DocumentInbox: "Documents arriving for review",
  Payables: "Money leaving the business",
  Receivables: "Money entering the business",
  Accounting: "Ledgers and journal entries",
  Inventory: "Stock and physical goods",
  Compliance: "Tax and regulatory checks",
  Banking: "Bank accounts and transactions",
  Reconcile: "Bring records into agreement",
};

export default function IconGallery() {
  const [query, setQuery] = useState("");
  const [size, setSize] = useState(20);
  const [dark, setDark] = useState(false);
  const matches = unique.filter(([name]) =>
    `${name} ${meanings[name] || ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );
  return (
    <main className="h-full overflow-auto bg-canvas p-6 text-foreground sm:p-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/inbox"
          className="text-body text-muted-foreground underline underline-offset-4"
        >
          Back to Inbox
        </Link>
        <p className="mt-8 text-caption font-semibold uppercase tracking-widest text-muted-foreground">
          AI Accountant · Visual language
        </p>
        <h1 className="mt-2 text-h1">Ledger icons</h1>
        <p className="mt-3 max-w-2xl text-body leading-6 text-muted-foreground">
          Precise enough for accounting. Quiet enough for everyday work. Open
          silhouettes, soft corners, and consistent strokes connect the product
          family. Familiar outline symbols keep everyday actions easy to
          recognise.
        </p>
        <div className="my-6 flex flex-wrap gap-3 text-caption text-muted-foreground">
          <span>24-unit grid</span>
          <span>·</span>
          <span>2 stroke</span>
          <span>·</span>
          <span>Round caps & joins</span>
          <span>·</span>
          <span>{unique.length} glyphs, aliases excluded</span>
        </div>
        <div className="mb-8 flex flex-wrap items-end gap-4 rounded-md border border-rule bg-background p-4">
          <label className="flex min-w-48 flex-1 flex-col gap-2 text-body">
            Find an icon
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or meaning…"
              className="rounded-md border border-rule bg-background px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 text-body">
            Preview size
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="rounded-md border border-rule bg-background px-3 py-2"
            >
              {[16, 20, 24, 32].map((n) => (
                <option key={n} value={n}>
                  {n}px
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            aria-pressed={dark}
            onClick={() => setDark(!dark)}
            className="rounded-md border border-rule px-3 py-2 text-body"
          >
            {dark ? "Light preview" : "Dark preview"}
          </button>
        </div>
        {[
          ["Product vocabulary", true],
          ["Actions, objects & states", false],
        ].map(([heading, product]) => {
          const entries = matches.filter(
            ([name]) => productNames.has(name) === product
          );
          if (!entries.length) return null;
          return (
            <section key={String(heading)} className="mb-10">
              <h2 className="mb-4 text-lead font-semibold">{heading}</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
                {entries.map(([name, Icon]) => (
                  <article
                    key={name}
                    className="overflow-hidden rounded-md border border-rule bg-background"
                  >
                    <div
                      className="flex h-24 items-center justify-center gap-5"
                      style={{
                        background: dark ? "#202630" : "#f7f8fa",
                        color: dark ? "#eff2f6" : "#384454",
                      }}
                    >
                      <Icon size={size} />
                      <Icon size={size} color={dark ? "#79baff" : "#0073d1"} />
                    </div>
                    <div className="p-3">
                      <p className="break-words text-body font-medium">{name}</p>
                      {meanings[name] && (
                        <p className="mt-1 text-caption leading-5 text-muted-foreground">
                          {meanings[name]}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
        {!matches.length && (
          <p role="status" className="py-10 text-muted-foreground">
            No icons match “{query}”. Try a name such as Inbox or a meaning such
            as money.
          </p>
        )}
        <section className="mb-10 rounded-md border border-rule bg-background p-6">
          <h2 className="text-lead font-semibold">Built to extend</h2>
          <div className="mt-4 grid gap-6 text-body leading-6 md:grid-cols-3">
            <div>
              <h3 className="font-semibold">One meaning per symbol</h3>
              <p className="mt-1 text-muted-foreground">
                Use product icons for destinations. Use outline icons for
                actions. Arrows describe money relative to the business.
                Sparkles belong to AI; a check means a completed check, not
                merely AI involvement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Design for the smallest size</h3>
              <p className="mt-1 text-muted-foreground">
                Use 16px in tables, 20px in navigation, and 24px in larger
                controls. Draw on a 24-unit grid, leave a 3-unit margin, and
                reuse a container with one clear mark. Verify at all three
                sizes, in one colour, on light and dark surfaces.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Meaning stays accessible</h3>
              <p className="mt-1 text-muted-foreground">
                Icons beside text are decorative. Name icon-only buttons with
                aria-label. Give standalone meaningful icons an aria-label.
                Preserve visible labels and status text; colour and shape are
                supporting cues.
              </p>
            </div>
          </div>
          <pre className="mt-6 overflow-auto rounded-md bg-canvas p-4 text-caption leading-6">
            <code>
              {
                'import { Payables } from "@/components/icons";\n\n<Payables size={20} />\n<Payables size={24} aria-label="Payables" />'
              }
            </code>
          </pre>
          <p className="mt-4 text-caption text-muted-foreground">
            Add product glyphs in components/icons/product.tsx using the shared
            factory in core.tsx. Keep existing exports stable. New glyphs appear
            in this gallery automatically; add product names and meanings here
            for navigation additions.
          </p>
        </section>
      </div>
    </main>
  );
}
