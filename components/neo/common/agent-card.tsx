import React from "react";
import { Check, Circle } from "@/components/icons";
import type { NeoCard } from "@/types/pages/neo";
import { cn } from "@/lib/utils";

type Props = { card: Extract<NeoCard, { kind: "agent" }> };

/**
 * An agent, as Neo will save it: what it checks, when it runs and how far it
 * may go. The sign-off sits under the card; this only shows.
 */
const AgentCard = ({ card }: Props) => (
  <div className="overflow-hidden rounded-md border border-pi-line bg-background text-pi-ink">
    <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
      <div className="min-w-0">
        <p className="text-small font-semibold">{card.name}</p>
        <p className="mt-0.5 text-caption leading-5 text-pi-body">
          {card.description}
        </p>
      </div>
      <span
        className={cn(
          "inline-flex flex-none items-center gap-1 rounded-sm border px-2 py-0.5 text-caption font-semibold",
          card.state === "Scheduled"
            ? "border-pi-success-line bg-pi-success-bg text-pi-success"
            : "border-pi-line text-pi-body"
        )}
      >
        {card.state === "Scheduled" ? (
          <Check className="h-3 w-3" />
        ) : (
          <Circle className="h-3 w-3" />
        )}
        {card.state}
      </span>
    </div>
    <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-pi-line px-4 py-3 text-caption leading-5">
      <dt className="text-pi-body">Runs</dt>
      <dd>{card.trigger}</dd>
      <dt className="text-pi-body">Action</dt>
      <dd>
        {card.permission === "draft"
          ? "Show issues and prepare drafts"
          : "Show issues for review"}
      </dd>
      <dt className="text-pi-body">Checks</dt>
      <dd>
        <ul className="flex flex-col gap-0.5">
          {card.checks.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </dd>
    </dl>
    <p className="border-t border-pi-line bg-pi-sunken px-4 py-2 text-caption text-pi-body">
      Review issues in the relevant workspace and approve any entries.
    </p>
  </div>
);

export default AgentCard;
