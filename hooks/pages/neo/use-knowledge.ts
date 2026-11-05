import { useEffect, useMemo, useState } from "react";
import { useStore, type Item } from "@/components/inbox/v2/store";

export type Evidence = {
  id: string;
  invoice: string;
  date: string;
  ledger: string;
};
export type Pattern = {
  id: string;
  supplier: string;
  ledger: string;
  evidence: Evidence[];
  total: number;
};
export type KnowledgeEdit = {
  ledger: string;
  note: string;
  disabled: boolean;
  reviewed: string;
  history: { at: string; text: string }[];
};
type Saved = {
  edits: Record<string, KnowledgeEdit>;
  refreshed: string;
  signature: string;
};
const empty = (): Saved => ({ edits: {}, refreshed: "", signature: "" });
export function learnPatterns(items: Item[], company: string): Pattern[] {
  const groups = new Map<string, Evidence[]>();
  items
    .filter(
      (i) =>
        i.company === company &&
        i.status === "Approved" &&
        i.route === "AP" &&
        i.form.party
    )
    .forEach((i) => {
      const ledgers = [
        ...new Set(
          i.form.lines
            .map((l) => l.ledger)
            .filter((l) => l && !/gst|tds|round off|rounding/i.test(l))
        ),
      ];
      if (ledgers.length !== 1) return;
      const rows = groups.get(i.form.party) || [];
      rows.push({
        id: i.id,
        invoice: i.form.invoiceNo || i.form.voucherNo || i.id,
        date: i.form.date,
        ledger: ledgers[0],
      });
      groups.set(i.form.party, rows);
    });
  return [...groups]
    .filter(([, rows]) => rows.length >= 2)
    .map(([supplier, rows]) => {
      const counts = new Map<string, number>();
      rows.forEach((r) =>
        counts.set(r.ledger, (counts.get(r.ledger) || 0) + 1)
      );
      const ledger = [...counts].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
      )[0][0];
      return {
        id: supplier,
        supplier,
        ledger,
        evidence: rows,
        total: rows.length,
      };
    })
    .filter(
      (p) =>
        p.evidence.filter((e) => e.ledger === p.ledger).length > p.total / 2
    )
    .sort((a, b) => a.supplier.localeCompare(b.supplier));
}
export function useKnowledge(company: string) {
  const books = useStore();
  const [saved, setSaved] = useState<Saved>(empty);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const patterns = useMemo(
    () => learnPatterns(books.items, company),
    [books.items, company]
  );
  const signature = JSON.stringify(patterns);
  const key = `aia.neo.knowledge.v1.${company}`;
  useEffect(() => {
    setReady(false);
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : empty();
      if (
        !parsed ||
        typeof parsed.edits !== "object" ||
        !parsed.edits ||
        typeof parsed.signature !== "string"
      )
        throw Error();
      setSaved(parsed);
      setError("");
    } catch {
      setSaved(empty());
      setError(
        "Saved knowledge could not be loaded. Changes will apply for this visit."
      );
    }
    setReady(true);
  }, [key]);
  const persist = (next: Saved) => {
    setSaved(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setError("");
    } catch {
      setError(
        "Changes could not be saved to this browser. Keep this page open and try again."
      );
    }
  };
  useEffect(() => {
    if (!ready) return;
    const refresh = () => {
      if (
        saved.signature !== signature ||
        Date.now() - Date.parse(saved.refreshed || "1970-01-01") >= 86400000
      ) {
        persist({ ...saved, signature, refreshed: new Date().toISOString() });
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 60000);
    return () => clearInterval(timer);
  }, [ready, signature, saved, key]);
  const update = (
    pattern: Pattern,
    ledger: string,
    note: string,
    disabled: boolean,
    action: string
  ) => {
    const previous = saved.edits[pattern.id];
    const at = new Date().toISOString();
    persist({
      ...saved,
      edits: {
        ...saved.edits,
        [pattern.id]: {
          ledger,
          note,
          disabled,
          reviewed: pattern.ledger,
          history: [
            { at, text: `${action}: ${ledger}${note ? ` · ${note}` : ""}` },
            ...(previous?.history || []),
          ],
        },
      },
    });
  };
  return {
    patterns,
    saved,
    ready,
    error,
    update,
    refresh: () =>
      persist({ ...saved, signature, refreshed: new Date().toISOString() }),
  };
}
