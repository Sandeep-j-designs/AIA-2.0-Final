import PlanSetup from "./plan-setup";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ACCOUNTING_AGENTS } from "@/config/pages/neo/agent-catalogue";
import {
  ASK_WORDS,
  closeChase,
  simulateReply,
  useChases,
} from "@/hooks/pages/neo/use-chases";
import { useStartChat } from "@/hooks/pages/neo/use-start-chat";
import { useCollections } from "@/hooks/pages/inbox/use-collections";
import { rupees } from "@/utils/pages/inbox/ai-calculations";
import { actor } from "@/components/inbox/v2/store";

type Plan = {
  owner: string;
  cadence: string;
  escalation: string;
  notes: string;
};
export default function AccountingAgent({
  company,
  agentId,
}: {
  company: string;
  agentId: string;
}) {
  const agent = ACCOUNTING_AGENTS.find((a) => a.id === agentId);
  const router = useRouter();
  const chat = useStartChat();
  const { chases } = useChases();
  const receivables = useCollections(company);
  // ?setup=1 (from the agents list) opens straight on the setup.
  const [tab, setTab] = useState(router.query.setup ? "Setup" : "Overview");
  const [filter, setFilter] = useState("Open");
  const [plan, setPlan] = useState<Plan>({
    owner: actor,
    cadence: "Every weekday",
    escalation: "7",
    notes: "",
  });
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const key = `aia.agent-plan.v1.${company}.${agentId}`;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const p = JSON.parse(raw);
        if (
          typeof p.owner !== "string" ||
          typeof p.notes !== "string" ||
          typeof p.cadence !== "string" ||
          typeof p.escalation !== "string"
        )
          throw Error();
        setPlan(p);
        setSaved(true);
      }
    } catch {
      setNotice("Saved plan could not be loaded. You can configure it again.");
    }
  }, [key]);
  if (!agent)
    return (
      <div className="p-8">
        <h1 className="text-h3">Agent not found</h1>
        <Link href="/inbox?module=NEO&page=agents" className="text-pi-brand">
          Back to agents
        </Link>
      </div>
    );
  const requests = chases.filter(
    (c) =>
      c.company === company &&
      (agentId === "missing-documents"
        ? c.ask !== "payment"
        : c.ask === "payment")
  );
  const rows = requests.filter(
    (c) =>
      filter === "All" ||
      (filter === "Open"
        ? c.status !== "closed"
        : filter === "Replies"
          ? c.status === "received"
          : c.status === "closed")
  );
  const hasWork =
    agentId === "missing-documents" || agentId === "receivables-follow-up";
  const update = (patch: Partial<Plan>) => {
    setPlan({ ...plan, ...patch });
    setSaved(false);
    setNotice("");
  };
  return (
    <div className="neo-skills-scroll min-h-0 flex-1 overflow-y-auto">
      <div className="neo-skills-content agent-detail-wrap">
        <Link
          href="/inbox?module=NEO&page=agents"
          className="mb-6 inline-flex items-center gap-2 text-small text-pi-body hover:text-pi-brand"
        >
          <ArrowLeft className="size-4" />
          All agents
        </Link>
        <div className="agent-detail-panel">
          <header className="neo-library-header agent-detail-header">
            <div>
              <h1>{agent.name}</h1>
              <p>{agent.description}</p>
            </div>
          </header>
          <div className="agent-detail-nav flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2" aria-label="Agent sections">
              {["Overview", "Setup", ...(hasWork ? ["Work queue"] : [])].map(
                (t) => (
                  <Button
                    key={t}
                    variant={tab === t ? "secondary" : "ghost"}
                    aria-pressed={tab === t}
                    onClick={() => setTab(t)}
                  >
                    {t}
                  </Button>
                )
              )}
            </div>
            <span className="inline-flex items-center gap-2 rounded-xs border border-pi-line bg-background px-2 py-1 text-caption text-pi-body">
              <span
                className={`h-1.5 w-1.5 rounded-full ${saved ? "bg-pi-success" : "bg-pi-faint"}`}
              />
              {saved ? "On" : "Not set up"}
            </span>
          </div>
          <div className="agent-detail-body">
            <p className="mb-5 text-caption leading-5 text-pi-body">
              {agent.readiness}
            </p>
            {tab === "Overview" && (
              <>
                <div className="grid items-start gap-5 md:grid-cols-2">
                  <section className="rounded-md border border-pi-line bg-background p-5">
                    <h2 className="text-body font-semibold">
                      What it takes care of
                    </h2>
                    <ol className="mt-4 list-decimal space-y-3 pl-5 text-small leading-6 text-pi-body">
                      {agent.steps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                  </section>
                  <section className="rounded-md border border-pi-line bg-background p-5">
                    <h2 className="text-body font-semibold">
                      When it should act
                    </h2>
                    <p className="mt-3 text-small leading-6 text-pi-body">
                      {agent.trigger}
                    </p>
                    <h3 className="mt-5 text-small font-semibold">
                      Done means
                    </h3>
                    <p className="mt-2 text-small leading-6 text-pi-body">
                      {agent.outcome}
                    </p>
                    <h3 className="mt-5 text-small font-semibold">
                      When it should stop
                    </h3>
                    <p className="mt-2 text-small leading-6 text-pi-body">
                      {agent.stops}
                    </p>
                  </section>
                </div>
                <div className="mt-5 flex gap-3">
                  <Button onClick={() => setTab("Setup")}>
                    {saved ? "Change setup" : "Set up agent"}
                  </Button>
                  {hasWork && (
                    <Button
                      variant="outline"
                      onClick={() => setTab("Work queue")}
                    >
                      Review current work
                    </Button>
                  )}
                </div>
              </>
            )}
            {tab === "Setup" && (
              <PlanSetup
                agent={agent}
                plan={plan}
                saved={saved}
                onChange={update}
                onCancel={() => setTab("Overview")}
                onSave={() => {
                  try {
                    localStorage.setItem(key, JSON.stringify(plan));
                    setSaved(true);
                    setNotice(
                      "Turned on. In this prototype it doesn't run on its own yet."
                    );
                    setTab("Overview");
                  } catch {
                    setNotice("Could not save the plan. Please try again.");
                  }
                }}
              />
            )}

            {tab === "Work queue" && (
              <div className="space-y-5">
                {agentId === "receivables-follow-up" && (
                  <section className="rounded-md border border-pi-line bg-background p-5">
                    <h2 className="text-body font-semibold">
                      Overdue invoices
                    </h2>
                    {receivables.length ? (
                      <ul className="mt-3 divide-y divide-pi-line">
                        {receivables.map((r) => (
                          <li
                            key={r.item.id}
                            className="flex flex-wrap items-center justify-between gap-3 py-4"
                          >
                            <div>
                              <Link
                                href={`/inbox?id=${encodeURIComponent(r.item.id)}`}
                                className="text-small font-medium text-pi-brand"
                              >
                                {r.item.form.party} · {r.item.form.invoiceNo}
                              </Link>
                              <p className="mt-1 text-caption text-pi-body">
                                {rupees(r.outstanding)} outstanding · {r.days}{" "}
                                days overdue
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() =>
                                void chat(
                                  `Draft collection reminder for ${r.item.id}`
                                )
                              }
                            >
                              Review reminder
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-small text-pi-body">
                        No overdue approved invoices in this company.
                      </p>
                    )}
                  </section>
                )}
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {["Open", "Replies", "Closed", "All"].map((f) => (
                      <Button
                        key={f}
                        variant={filter === f ? "secondary" : "ghost"}
                        aria-pressed={filter === f}
                        onClick={() => setFilter(f)}
                      >
                        {f}
                      </Button>
                    ))}
                  </div>
                  {agentId === "missing-documents" && (
                    <Button
                      onClick={() => void chat("Follow up with a supplier")}
                    >
                      Prepare a request
                    </Button>
                  )}
                </div>
                <ul className="space-y-3">
                  {rows.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-md border border-pi-line bg-background p-5"
                    >
                      <div className="flex flex-wrap justify-between gap-3">
                        <div>
                          <h3 className="text-body font-semibold">
                            {ASK_WORDS[c.ask]} · {c.party}
                          </h3>
                          <p className="mt-1 text-caption text-pi-body">
                            {c.docRef} · {c.channel} · Requested{" "}
                            {new Date(c.sentAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-caption text-pi-brand">
                          {c.status === "received"
                            ? "Reply needs review"
                            : c.status === "closed"
                              ? "Resolved"
                              : "Waiting for reply"}
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-line text-small leading-6 text-pi-body">
                        {c.body}
                      </p>
                      {c.reply && (
                        <div className="mt-4 rounded-md bg-pi-fill p-3 text-small">
                          <strong>Supplier reply</strong>
                          <p className="mt-1">{c.reply.text}</p>
                        </div>
                      )}
                      {c.closedReason && (
                        <p className="mt-3 text-small text-pi-body">
                          {c.closedReason}
                        </p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {c.itemId && (
                          <Button
                            variant="outline"
                            onClick={() =>
                              void router.push(
                                `/inbox?id=${encodeURIComponent(c.itemId!)}`
                              )
                            }
                          >
                            Review document
                          </Button>
                        )}
                        {c.status === "waiting" && (
                          <Button
                            variant="ghost"
                            onClick={() => simulateReply(c.id)}
                          >
                            Simulate reply
                          </Button>
                        )}
                        {c.status === "received" && (
                          <Button
                            onClick={() => {
                              closeChase(
                                c.id,
                                "Reply reviewed and accepted by accountant"
                              );
                              setNotice("Request resolved after your review.");
                            }}
                          >
                            Accept reply and resolve
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                {!rows.length && (
                  <p className="rounded-md border border-dashed border-pi-line p-8 text-center text-small text-pi-body">
                    No requests in this view.
                  </p>
                )}
                <p className="text-caption text-pi-body">
                  Replies and sending are simulated. Review the document and
                  reply before resolving a request.
                </p>
              </div>
            )}
            <p role="status" className="mt-4 text-small text-pi-brand">
              {notice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
