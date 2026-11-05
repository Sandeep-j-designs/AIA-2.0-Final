import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ACCOUNTING_AGENTS } from "@/config/pages/neo/agent-catalogue";
import { ArrowRight, Inbox, Radio } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useCollectionAgent } from "@/hooks/pages/agents/use-collection-agent";

export default function AgentCatalogue({ company }: { company: string }) {
  const c = useCollectionAgent(company);
  // Plans are saved per viewer by the agent's own page.
  const [planned, setPlanned] = useState<string[]>([]);
  useEffect(() => {
    try {
      setPlanned(
        ACCOUNTING_AGENTS.filter((a) =>
          localStorage.getItem(`aia.agent-plan.v1.${company}.${a.id}`)
        ).map((a) => a.id)
      );
    } catch {
      /* storage blocked: every plan reads as not set up */
    }
  }, [company]);
  return (
    <div className="neo-skills-scroll min-h-0 flex-1 overflow-y-auto">
      <div className="neo-skills-content neo-skills-compact">
        <header className="neo-library-header">
          <div>
            <h1>Agents</h1>
            <p>
              Give Neo an ongoing responsibility. Choose what it can access,
              when it runs, and what stays with you for review.
            </p>
          </div>
        </header>
        <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="flex flex-col rounded-md border border-pi-line bg-background p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="neo-skill-icon">
                <Inbox className="size-5" />
              </span>
              <AgentState
                on={c.agent.configured}
                label={c.agent.configured ? c.status : "Not set up"}
              />
            </div>
            <h2 className="mt-5 text-lead font-semibold text-pi-ink">
              Document collection
            </h2>
            <p className="mt-2 text-small leading-6 text-pi-body">
              Collect supplier documents from connected email and folders, check
              for duplicates, and bring them into Inbox for review.
            </p>
            <p className="mb-5 mt-4 text-caption text-pi-body">
              Gmail · Google Drive · WhatsApp Business
            </p>
            <div className="mt-auto border-t border-pi-line pt-4">
              <Link
                href={`/inbox?module=NEO&page=agents&agent=document-collection${c.agent.configured ? "" : "&setup=1"}`}
                className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 py-2 text-small font-medium text-pi-brand hover:bg-pi-brand-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand"
              >
                {c.agent.configured ? "Manage agent" : "Set up agent"}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </article>
          {ACCOUNTING_AGENTS.map((agent) => (
            <article
              key={agent.id}
              className="flex flex-col rounded-md border border-pi-line bg-background p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="neo-skill-icon">
                  <Radio className="size-5" />
                </span>
                <AgentState
                  on={planned.includes(agent.id)}
                  label={planned.includes(agent.id) ? "On" : "Not set up"}
                />
              </div>
              <h2 className="mt-5 text-lead font-semibold text-pi-ink">
                {agent.name}
              </h2>
              <p className="mb-5 mt-2 text-small leading-6 text-pi-body">
                {agent.description}
              </p>
              <div className="mt-auto border-t border-pi-line pt-4">
                <Link
                  href={`/inbox?module=NEO&page=agents&agent=${agent.id}${planned.includes(agent.id) ? "" : "&setup=1"}`}
                  className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 py-2 text-small font-medium text-pi-brand hover:bg-pi-brand-tint focus-visible:ring-2 focus-visible:ring-pi-brand"
                >
                  {planned.includes(agent.id) ? "Manage agent" : "Set up agent"}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 max-w-[560px] text-small leading-6 text-pi-body">
          Agents use skills to do the work and company knowledge to apply your
          preferences. You control their access and can pause automatic
          collection at any time.
        </p>
      </div>
    </div>
  );
}

const AgentState = ({ on, label }: { on: boolean; label: string }) => (
  <span className="inline-flex items-center gap-2 rounded-xs border border-pi-line bg-background px-2 py-1 text-caption text-pi-body">
    <span
      className={cn(
        "h-1.5 w-1.5 rounded-full",
        on ? "bg-pi-success" : "bg-pi-faint"
      )}
    />
    {label}
  </span>
);
